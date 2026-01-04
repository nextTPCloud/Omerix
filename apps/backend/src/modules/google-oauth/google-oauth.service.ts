// apps/backend/src/modules/google-oauth/google-oauth.service.ts

/**
 * Servicio unificado de Google OAuth2
 * Maneja autenticación para Calendar y Gmail por usuario
 */

import { google, calendar_v3, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';
import { GoogleOAuthToken, IGoogleOAuthToken, GoogleScope } from './GoogleOAuthToken';

// ============================================
// CONFIGURACIÓN
// ============================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/oauth/callback';

// Mapeo de scopes internos a URLs de Google
const SCOPE_MAP: Record<GoogleScope, string[]> = {
  calendar: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  gmail: [
    'https://mail.google.com/',
  ],
  gmail_send: [
    'https://www.googleapis.com/auth/gmail.send',
  ],
  gmail_readonly: [
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  drive: [
    'https://www.googleapis.com/auth/drive.file',
  ],
  contacts: [
    'https://www.googleapis.com/auth/contacts.readonly',
  ],
};

// Scopes base siempre incluidos
const BASE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// ============================================
// TIPOS
// ============================================

export interface GoogleUserInfo {
  email: string;
  name?: string;
  picture?: string;
}

export interface OAuthTokenResult {
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  scopes: string[];
}

// ============================================
// SERVICIO GOOGLE OAUTH
// ============================================

export class GoogleOAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }

  // ============================================
  // VERIFICACIÓN DE CONFIGURACIÓN
  // ============================================

  isConfigured(): boolean {
    return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  }

  getClientId(): string | null {
    return GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 30) + '...' : null;
  }

  // ============================================
  // GENERACIÓN DE URL DE AUTENTICACIÓN
  // ============================================

  /**
   * Genera URL de autorización con los scopes solicitados
   */
  getAuthUrl(state: string, requestedScopes: GoogleScope[]): string {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth2 no está configurado');
    }

    // Construir lista de scopes
    const scopes = [...BASE_SCOPES];
    for (const scope of requestedScopes) {
      if (SCOPE_MAP[scope]) {
        scopes.push(...SCOPE_MAP[scope]);
      }
    }

    // Eliminar duplicados
    const uniqueScopes = Array.from(new Set(scopes));

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: uniqueScopes,
      state,
      prompt: 'consent', // Forzar para obtener refresh_token
    });
  }

  // ============================================
  // INTERCAMBIO DE CÓDIGO POR TOKENS
  // ============================================

  /**
   * Intercambia código de autorización por tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokenResult> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error(
        'No se obtuvo refresh_token. Revoca el acceso de la app en tu cuenta de Google y vuelve a intentar.'
      );
    }

    // Obtener scopes concedidos
    const grantedScopes = tokens.scope?.split(' ') || [];

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date!),
      scopes: grantedScopes,
    };
  }

  // ============================================
  // INFORMACIÓN DEL USUARIO
  // ============================================

  /**
   * Obtiene información del usuario de Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email!,
      name: data.name || undefined,
      picture: data.picture || undefined,
    };
  }

  // ============================================
  // GESTIÓN DE TOKENS
  // ============================================

  /**
   * Refresca el token de acceso
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: Date;
  }> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      expiryDate: new Date(credentials.expiry_date!),
    };
  }

  /**
   * Configura credenciales para usar APIs
   */
  setCredentials(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  // ============================================
  // PERSISTENCIA DE TOKENS (POR USUARIO)
  // ============================================

  /**
   * Guarda o actualiza tokens de un usuario
   */
  async saveUserTokens(
    usuarioId: string,
    empresaId: string,
    tokens: OAuthTokenResult,
    userInfo: GoogleUserInfo,
    requestedScopes: GoogleScope[]
  ): Promise<IGoogleOAuthToken> {
    // Determinar scopes concedidos
    const grantedScopes = this.parseGrantedScopes(tokens.scopes);

    const tokenData = {
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.expiryDate,
      googleEmail: userInfo.email,
      googleNombre: userInfo.name,
      googleAvatar: userInfo.picture,
      scopes: grantedScopes,
      activo: true,
      errorMensaje: undefined,
      intentosFallidos: 0,
      ultimoUso: new Date(),
    };

    // Upsert por usuario+empresa
    const token = await GoogleOAuthToken.findOneAndUpdate(
      {
        usuarioId: tokenData.usuarioId,
        empresaId: tokenData.empresaId,
      },
      tokenData,
      { upsert: true, new: true }
    );

    return token;
  }

  /**
   * Obtiene tokens de un usuario
   */
  async getUserTokens(
    usuarioId: string,
    empresaId: string
  ): Promise<IGoogleOAuthToken | null> {
    return GoogleOAuthToken.findOne({
      usuarioId: new mongoose.Types.ObjectId(usuarioId),
      empresaId: new mongoose.Types.ObjectId(empresaId),
      activo: true,
    });
  }

  /**
   * Obtiene un token de acceso válido, refrescando si es necesario
   */
  async getValidAccessToken(
    usuarioId: string,
    empresaId: string,
    requiredScope?: GoogleScope
  ): Promise<{
    accessToken: string;
    googleEmail: string;
    scopes: GoogleScope[];
  }> {
    const token = await this.getUserTokens(usuarioId, empresaId);

    if (!token) {
      throw new Error('Usuario no tiene Google conectado');
    }

    // Verificar si tiene el scope requerido
    if (requiredScope && !token.scopes.includes(requiredScope)) {
      throw new Error(`No tiene permiso para ${requiredScope}. Reconecte Google con los permisos necesarios.`);
    }

    // Verificar si el token ha expirado
    const now = new Date();
    const expiresAt = new Date(token.tokenExpiry);
    const isExpired = now >= new Date(expiresAt.getTime() - 5 * 60 * 1000); // 5 min antes

    if (!isExpired) {
      // Actualizar último uso
      token.ultimoUso = new Date();
      await token.save();

      return {
        accessToken: token.accessToken,
        googleEmail: token.googleEmail,
        scopes: token.scopes,
      };
    }

    // Refrescar token
    try {
      const newTokens = await this.refreshAccessToken(token.refreshToken);

      token.accessToken = newTokens.accessToken;
      token.tokenExpiry = newTokens.expiryDate;
      token.ultimoUso = new Date();
      token.errorMensaje = undefined;
      token.intentosFallidos = 0;
      await token.save();

      return {
        accessToken: newTokens.accessToken,
        googleEmail: token.googleEmail,
        scopes: token.scopes,
      };
    } catch (error) {
      // Registrar error
      token.intentosFallidos += 1;
      token.errorMensaje = (error as Error).message;
      if (token.intentosFallidos >= 5) {
        token.activo = false;
      }
      await token.save();
      throw error;
    }
  }

  /**
   * Desconecta Google de un usuario
   */
  async disconnectUser(usuarioId: string, empresaId: string): Promise<void> {
    await GoogleOAuthToken.updateOne(
      {
        usuarioId: new mongoose.Types.ObjectId(usuarioId),
        empresaId: new mongoose.Types.ObjectId(empresaId),
      },
      { activo: false }
    );
  }

  /**
   * Verifica si un usuario tiene Google conectado
   */
  async isUserConnected(
    usuarioId: string,
    empresaId: string
  ): Promise<{
    connected: boolean;
    email?: string;
    scopes?: GoogleScope[];
  }> {
    const token = await this.getUserTokens(usuarioId, empresaId);

    if (!token) {
      return { connected: false };
    }

    return {
      connected: true,
      email: token.googleEmail,
      scopes: token.scopes,
    };
  }

  // ============================================
  // CLIENTES DE API
  // ============================================

  /**
   * Obtiene cliente de Calendar API configurado
   */
  getCalendarClient(accessToken: string, refreshToken?: string): calendar_v3.Calendar {
    this.setCredentials(accessToken, refreshToken);
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Obtiene cliente de Gmail API configurado
   */
  getGmailClient(accessToken: string, refreshToken?: string): gmail_v1.Gmail {
    this.setCredentials(accessToken, refreshToken);
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Parsea scopes de Google a scopes internos
   */
  private parseGrantedScopes(googleScopes: string[]): GoogleScope[] {
    const internalScopes: GoogleScope[] = [];

    for (const [internal, googleUrls] of Object.entries(SCOPE_MAP)) {
      const hasAll = googleUrls.every(url => googleScopes.includes(url));
      if (hasAll) {
        internalScopes.push(internal as GoogleScope);
      }
    }

    return internalScopes;
  }
}

export const googleOAuthService = new GoogleOAuthService();
export default googleOAuthService;
