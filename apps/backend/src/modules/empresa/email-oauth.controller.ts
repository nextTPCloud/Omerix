import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { emailOAuthService } from './email-oauth.service';
import { empresaService } from './empresa.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Interfaz para el state del OAuth
interface OAuthState {
  empresaId: string;
  userId: string;
  returnUrl: string;
}

class EmailOAuthController {
  /**
   * Obtener estado de los proveedores OAuth2
   */
  async getProviders(req: Request, res: Response) {
    try {
      const status = emailOAuthService.getProviderStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener proveedores',
      });
    }
  }

  /**
   * Iniciar autenticación con Google
   */
  async startGoogleAuth(req: Request, res: Response) {
    try {
      if (!emailOAuthService.isProviderConfigured('google')) {
        return res.status(400).json({
          success: false,
          message: 'Google OAuth2 no está configurado en el servidor',
        });
      }

      const empresaId = req.empresaId?.toString();
      const userId = req.userId?.toString();

      if (!empresaId || !userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      // Crear state con información necesaria para el callback
      const state: OAuthState = {
        empresaId,
        userId,
        returnUrl: `${FRONTEND_URL}/configuracion?tab=email`,
      };

      // Codificar state como JWT para seguridad
      const stateToken = jwt.sign(state, JWT_SECRET, { expiresIn: '10m' });

      const authUrl = emailOAuthService.getGoogleAuthUrl(stateToken);

      res.json({
        success: true,
        data: { authUrl },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al iniciar autenticación con Google',
      });
    }
  }

  /**
   * Callback de Google OAuth2
   */
  async googleCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${FRONTEND_URL}/configuracion?tab=email&oauth_error=${encodeURIComponent(error as string)}`);
      }

      if (!code || !state) {
        return res.redirect(`${FRONTEND_URL}/configuracion?tab=email&oauth_error=missing_params`);
      }

      // Verificar y decodificar state
      let stateData: OAuthState;
      try {
        stateData = jwt.verify(state as string, JWT_SECRET) as OAuthState;
      } catch (err) {
        return res.redirect(`${FRONTEND_URL}/configuracion?tab=email&oauth_error=invalid_state`);
      }

      // Intercambiar código por tokens
      const tokens = await emailOAuthService.exchangeGoogleCode(code as string);

      // Guardar configuración OAuth2
      await emailOAuthService.saveOAuth2Config(stateData.empresaId, 'google', tokens);

      // Redirigir al frontend con éxito
      res.redirect(`${stateData.returnUrl}&oauth_success=google`);
    } catch (error: any) {
      console.error('Error en callback de Google:', error);
      res.redirect(`${FRONTEND_URL}/configuracion?tab=email&oauth_error=${encodeURIComponent(error.message || 'unknown_error')}`);
    }
  }

  /**
   * Iniciar autenticación con Microsoft
   */
  async startMicrosoftAuth(req: Request, res: Response) {
    try {
      if (!emailOAuthService.isProviderConfigured('microsoft')) {
        return res.status(400).json({
          success: false,
          message: 'Microsoft OAuth2 no está configurado en el servidor',
        });
      }

      const empresaId = req.empresaId?.toString();
      const userId = req.userId?.toString();

      if (!empresaId || !userId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      // Crear state con información necesaria para el callback
      const state: OAuthState = {
        empresaId,
        userId,
        returnUrl: `${FRONTEND_URL}/configuracion?tab=email`,
      };

      // Codificar state como JWT para seguridad
      const stateToken = jwt.sign(state, JWT_SECRET, { expiresIn: '10m' });

      const authUrl = await emailOAuthService.getMicrosoftAuthUrl(stateToken);

      res.json({
        success: true,
        data: { authUrl },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al iniciar autenticación con Microsoft',
      });
    }
  }

  /**
   * Callback de Microsoft OAuth2
   */
  async microsoftCallback(req: Request, res: Response) {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        return res.redirect(`${FRONTEND_URL}/configuracion?tab=email&oauth_error=${encodeURIComponent(error_description as string || error as string)}`);
      }

      if (!code || !state) {
        return res.redirect(`${FRONTEND_URL}/configuracion?tab=email&oauth_error=missing_params`);
      }

      // Verificar y decodificar state
      let stateData: OAuthState;
      try {
        stateData = jwt.verify(state as string, JWT_SECRET) as OAuthState;
      } catch (err) {
        return res.redirect(`${FRONTEND_URL}/configuracion?tab=email&oauth_error=invalid_state`);
      }

      // Intercambiar código por tokens
      const tokens = await emailOAuthService.exchangeMicrosoftCode(code as string);

      // Guardar configuración OAuth2
      await emailOAuthService.saveOAuth2Config(stateData.empresaId, 'microsoft', tokens);

      // Redirigir al frontend con éxito
      res.redirect(`${stateData.returnUrl}&oauth_success=microsoft`);
    } catch (error: any) {
      console.error('Error en callback de Microsoft:', error);
      res.redirect(`${FRONTEND_URL}/configuracion?tab=email&oauth_error=${encodeURIComponent(error.message || 'unknown_error')}`);
    }
  }

  /**
   * Desconectar cuenta OAuth2
   */
  async disconnect(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId?.toString();

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      await empresaService.disconnectEmail(empresaId);

      res.json({
        success: true,
        message: 'Configuración de email desconectada',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error al desconectar',
      });
    }
  }
}

export const emailOAuthController = new EmailOAuthController();
export default emailOAuthController;
