import { google } from 'googleapis';
import { ConfidentialClientApplication } from '@azure/msal-node';
import Empresa, { IEmailConfig, encrypt, decrypt } from '../../models/Empresa';

// Configuración de Google OAuth2
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/empresa/email/oauth2/google/callback';

// Configuración de Microsoft OAuth2
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/empresa/email/oauth2/microsoft/callback';
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';

// Scopes necesarios
const GOOGLE_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

const MICROSOFT_SCOPES = [
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/User.Read',
  'offline_access',
];

class EmailOAuthService {
  private googleOAuth2Client: any;
  private msalClient: ConfidentialClientApplication | null = null;

  constructor() {
    // Inicializar cliente de Google
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      this.googleOAuth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
      );
    }

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
      return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
    }
    if (provider === 'microsoft') {
      return !!(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET);
    }
    return false;
  }

  /**
   * Obtiene la URL de autorización de Google
   */
  getGoogleAuthUrl(state: string): string {
    if (!this.googleOAuth2Client) {
      throw new Error('Google OAuth2 no está configurado');
    }

    return this.googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_SCOPES,
      state,
      prompt: 'consent', // Forzar consentimiento para obtener refresh_token
    });
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
   */
  async exchangeGoogleCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    email: string;
  }> {
    if (!this.googleOAuth2Client) {
      throw new Error('Google OAuth2 no está configurado');
    }

    const { tokens } = await this.googleOAuth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error('No se obtuvo refresh_token. Intenta desconectar la app de tu cuenta de Google y vuelve a intentar.');
    }

    // Obtener email del usuario
    this.googleOAuth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: this.googleOAuth2Client });
    const userInfo = await oauth2.userinfo.get();

    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600000);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiresAt,
      email: userInfo.data.email!,
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
   */
  async refreshGoogleToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    if (!this.googleOAuth2Client) {
      throw new Error('Google OAuth2 no está configurado');
    }

    this.googleOAuth2Client.setCredentials({
      refresh_token: decrypt(refreshToken),
    });

    const { credentials } = await this.googleOAuth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000),
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
        clientId: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 20) + '...' : undefined,
      },
      microsoft: {
        configured: this.isProviderConfigured('microsoft'),
        clientId: MICROSOFT_CLIENT_ID ? MICROSOFT_CLIENT_ID.substring(0, 20) + '...' : undefined,
      },
    };
  }
}

export const emailOAuthService = new EmailOAuthService();
export default emailOAuthService;
