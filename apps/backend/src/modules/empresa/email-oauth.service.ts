import { google } from 'googleapis';
import { ConfidentialClientApplication } from '@azure/msal-node';
import Empresa, { IEmailConfig, encrypt, decrypt } from './Empresa';
import { googleOAuthService } from '../google-oauth';

// Configuración de Microsoft OAuth2
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5000/api/empresa/email/oauth2/microsoft/callback';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';

const MICROSOFT_SCOPES = [
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/User.Read',
  'offline_access',
];

/**
 * Servicio de Email OAuth
 *
 * NOTA: Para Google, ahora se usa el módulo google-oauth unificado que maneja
 * tokens por usuario (no por empresa). Este servicio mantiene compatibilidad
 * con Microsoft y funciones legacy de empresa.
 */
class EmailOAuthService {
  private msalClient: ConfidentialClientApplication | null = null;

  constructor() {
    // Inicializar cliente de Microsoft
    if (MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET) {
      this.msalClient = new ConfidentialClientApplication({
        auth: {
          clientId: MICROSOFT_CLIENT_ID,
          clientSecret: MICROSOFT_CLIENT_SECRET,
          authority: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}`,
        },
      });
    }
  }

  /**
   * Verifica si OAuth2 está configurado para un proveedor
   */
  isProviderConfigured(provider: 'google' | 'microsoft'): boolean {
    if (provider === 'google') {
      return googleOAuthService.isConfigured();
    }
    if (provider === 'microsoft') {
      return !!(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET);
    }
    return false;
  }

  /**
   * Obtiene la URL de autorización de Google
   * @deprecated Usar googleOAuthService.getAuthUrl() con scopes ['gmail_send'] para OAuth por usuario
   */
  getGoogleAuthUrl(state: string): string {
    return googleOAuthService.getAuthUrl(state, ['gmail_send']);
  }

  /**
   * Obtiene la URL de autorización de Microsoft
   */
  async getMicrosoftAuthUrl(state: string): Promise<string> {
    if (!this.msalClient) {
      throw new Error('Microsoft OAuth2 no está configurado');
    }

    const authCodeUrlParameters = {
      scopes: MICROSOFT_SCOPES,
      redirectUri: MICROSOFT_REDIRECT_URI,
      state,
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * Intercambia el código de autorización de Google por tokens
   * @deprecated Para nuevas integraciones, usar googleOAuthService directamente
   */
  async exchangeGoogleCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    email: string;
  }> {
    const tokens = await googleOAuthService.exchangeCodeForTokens(code);
    const userInfo = await googleOAuthService.getUserInfo(tokens.accessToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiryDate,
      email: userInfo.email,
    };
  }

  /**
   * Intercambia el código de autorización de Microsoft por tokens
   */
  async exchangeMicrosoftCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    email: string;
  }> {
    if (!this.msalClient) {
      throw new Error('Microsoft OAuth2 no está configurado');
    }

    const tokenRequest = {
      code,
      scopes: MICROSOFT_SCOPES,
      redirectUri: MICROSOFT_REDIRECT_URI,
    };

    const response = await this.msalClient.acquireTokenByCode(tokenRequest);

    if (!response) {
      throw new Error('No se pudo obtener el token');
    }

    // El refresh token no está expuesto directamente en MSAL, usamos el cache
    const accounts = await this.msalClient.getTokenCache().getAllAccounts();
    const account = accounts.find(a => a.username === response.account?.username);

    return {
      accessToken: response.accessToken,
      refreshToken: '', // MSAL maneja el refresh internamente
      expiresAt: response.expiresOn || new Date(Date.now() + 3600000),
      email: response.account?.username || '',
    };
  }

  /**
   * Refresca el token de acceso de Google
   * @deprecated Para nuevas integraciones, usar googleOAuthService.getValidAccessToken()
   */
  async refreshGoogleToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    const decryptedToken = decrypt(refreshToken);
    const result = await googleOAuthService.refreshAccessToken(decryptedToken);

    return {
      accessToken: result.accessToken,
      expiresAt: result.expiryDate,
    };
  }

  /**
   * Guarda la configuración OAuth2 en la empresa
   */
  async saveOAuth2Config(
    empresaId: string,
    provider: 'google' | 'microsoft',
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresAt: Date;
      email: string;
    }
  ): Promise<void> {
    const emailConfig: Partial<IEmailConfig> = {
      authType: 'oauth2',
      provider,
      user: tokens.email,
      fromEmail: tokens.email,
      oauth2: {
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        expiresAt: tokens.expiresAt,
        scope: provider === 'google' ? GOOGLE_SCOPES.join(' ') : MICROSOFT_SCOPES.join(' '),
      },
    };

    await Empresa.updateOne(
      { _id: empresaId },
      { $set: { emailConfig } }
    );
  }

  /**
   * Obtiene un token de acceso válido (refrescando si es necesario)
   */
  async getValidAccessToken(empresaId: string): Promise<{
    accessToken: string;
    provider: 'google' | 'microsoft';
    email: string;
  }> {
    const empresa = await Empresa.findById(empresaId)
      .select('+emailConfig.oauth2.accessToken +emailConfig.oauth2.refreshToken')
      .lean();

    if (!empresa?.emailConfig) {
      throw new Error('No hay configuración de email');
    }

    if (empresa.emailConfig.authType !== 'oauth2') {
      throw new Error('La configuración no es OAuth2');
    }

    const { oauth2, provider, user } = empresa.emailConfig;

    if (!oauth2 || !provider) {
      throw new Error('Configuración OAuth2 incompleta');
    }

    // Verificar si el token ha expirado
    const now = new Date();
    const expiresAt = new Date(oauth2.expiresAt);
    const isExpired = now >= new Date(expiresAt.getTime() - 5 * 60 * 1000); // 5 minutos antes

    if (!isExpired) {
      return {
        accessToken: decrypt(oauth2.accessToken),
        provider,
        email: user,
      };
    }

    // Refrescar el token
    if (provider === 'google') {
      const newTokens = await this.refreshGoogleToken(oauth2.refreshToken);

      // Actualizar en la base de datos
      await Empresa.updateOne(
        { _id: empresaId },
        {
          $set: {
            'emailConfig.oauth2.accessToken': encrypt(newTokens.accessToken),
            'emailConfig.oauth2.expiresAt': newTokens.expiresAt,
          },
        }
      );

      return {
        accessToken: newTokens.accessToken,
        provider,
        email: user,
      };
    }

    // Para Microsoft, MSAL maneja el refresh automáticamente
    throw new Error('Refresh de Microsoft no implementado');
  }

  /**
   * Desconecta la cuenta OAuth2
   */
  async disconnectOAuth2(empresaId: string): Promise<void> {
    await Empresa.updateOne(
      { _id: empresaId },
      { $unset: { emailConfig: 1 } }
    );
  }

  /**
   * Obtiene el estado de la configuración OAuth2
   */
  getProviderStatus(): {
    google: { configured: boolean; clientId?: string };
    microsoft: { configured: boolean; clientId?: string };
  } {
    return {
      google: {
        configured: this.isProviderConfigured('google'),
        clientId: googleOAuthService.getClientId() || undefined,
      },
      microsoft: {
        configured: this.isProviderConfigured('microsoft'),
        clientId: MICROSOFT_CLIENT_ID ? MICROSOFT_CLIENT_ID.substring(0, 20) + '...' : undefined,
      },
    };
  }

  // ============================================
  // NUEVO SISTEMA: TOKENS POR USUARIO
  // ============================================

  /**
   * Obtiene un token de acceso válido para enviar emails (nuevo sistema por usuario)
   */
  async getValidAccessTokenForUser(
    usuarioId: string,
    empresaId: string
  ): Promise<{
    accessToken: string;
    provider: 'google';
    email: string;
  }> {
    const tokenData = await googleOAuthService.getValidAccessToken(usuarioId, empresaId, 'gmail_send');

    return {
      accessToken: tokenData.accessToken,
      provider: 'google',
      email: tokenData.googleEmail,
    };
  }

  /**
   * Verifica si un usuario tiene Gmail conectado
   */
  async isUserGmailConnected(usuarioId: string, empresaId: string): Promise<{
    connected: boolean;
    email?: string;
    canSendEmail?: boolean;
  }> {
    const status = await googleOAuthService.isUserConnected(usuarioId, empresaId);

    if (!status.connected) {
      return { connected: false };
    }

    return {
      connected: true,
      email: status.email,
      canSendEmail: status.scopes?.includes('gmail_send') || status.scopes?.includes('gmail'),
    };
  }
}

export const emailOAuthService = new EmailOAuthService();
export default emailOAuthService;
