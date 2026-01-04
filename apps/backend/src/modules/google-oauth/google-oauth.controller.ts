// apps/backend/src/modules/google-oauth/google-oauth.controller.ts

/**
 * @swagger
 * tags:
 *   name: Google OAuth
 *   description: Autenticación OAuth2 unificada con Google (Calendar + Gmail) por usuario
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GoogleOAuthStatus:
 *       type: object
 *       properties:
 *         configured:
 *           type: boolean
 *           description: Si Google OAuth está configurado en el servidor
 *         connected:
 *           type: boolean
 *           description: Si el usuario tiene Google conectado
 *         email:
 *           type: string
 *           description: Email de la cuenta Google conectada
 *         scopes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [calendar, gmail, gmail_send, gmail_readonly, drive, contacts]
 *           description: Scopes autorizados
 *     GoogleScope:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador del scope
 *         name:
 *           type: string
 *           description: Nombre del scope
 *         description:
 *           type: string
 *           description: Descripción del scope
 *     GoogleAuthRequest:
 *       type: object
 *       properties:
 *         scopes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [calendar, gmail, gmail_send, gmail_readonly, drive, contacts]
 *           description: Scopes a solicitar (por defecto calendar y gmail_send)
 *         returnUrl:
 *           type: string
 *           description: URL de redirección tras la autenticación
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { googleOAuthService } from './google-oauth.service';
import { GoogleScope } from './GoogleOAuthToken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ============================================
// TIPOS
// ============================================

interface OAuthState {
  usuarioId: string;
  empresaId: string;
  scopes: GoogleScope[];
  returnUrl: string;
}

// ============================================
// CONTROLADOR
// ============================================

export const googleOAuthController = {
  /**
   * @swagger
   * /api/google/oauth/status:
   *   get:
   *     summary: Estado de conexión de Google del usuario
   *     description: Obtiene el estado de la conexión OAuth de Google del usuario actual
   *     tags: [Google OAuth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estado de conexión
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/GoogleOAuthStatus'
   *       401:
   *         description: No autorizado
   */
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.userId?.toString();
      const empresaId = req.empresaId?.toString();

      if (!usuarioId || !empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const status = await googleOAuthService.isUserConnected(usuarioId, empresaId);

      res.json({
        success: true,
        data: {
          configured: googleOAuthService.isConfigured(),
          ...status,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/google/oauth/auth:
   *   post:
   *     summary: Iniciar autenticación con Google
   *     description: Genera URL de autorización OAuth2 de Google con los scopes solicitados
   *     tags: [Google OAuth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GoogleAuthRequest'
   *           example:
   *             scopes: ["calendar", "gmail_send"]
   *             returnUrl: "/integraciones"
   *     responses:
   *       200:
   *         description: URL de autorización generada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     authUrl:
   *                       type: string
   *                       description: URL de Google para iniciar OAuth
   *       400:
   *         description: Google OAuth no configurado
   *       401:
   *         description: No autorizado
   */
  async startAuth(req: Request, res: Response, next: NextFunction) {
    try {
      if (!googleOAuthService.isConfigured()) {
        return res.status(400).json({
          success: false,
          message: 'Google OAuth2 no está configurado en el servidor',
        });
      }

      const usuarioId = req.userId?.toString();
      const empresaId = req.empresaId?.toString();

      if (!usuarioId || !empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      // Scopes solicitados (por defecto calendar y gmail_send)
      const requestedScopes: GoogleScope[] = req.body.scopes || ['calendar', 'gmail_send'];
      const returnUrl = req.body.returnUrl || `${FRONTEND_URL}/integraciones`;

      // Crear state con JWT
      const state: OAuthState = {
        usuarioId,
        empresaId,
        scopes: requestedScopes,
        returnUrl,
      };

      const stateToken = jwt.sign(state, JWT_SECRET, { expiresIn: '10m' });
      const authUrl = googleOAuthService.getAuthUrl(stateToken, requestedScopes);

      res.json({
        success: true,
        data: { authUrl },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/google/oauth/callback:
   *   get:
   *     summary: Callback de Google OAuth
   *     description: |
   *       Endpoint de callback donde Google redirige tras la autorización.
   *       Este endpoint es llamado automáticamente por Google, no directamente por el frontend.
   *       Redirige al frontend con parámetros de éxito o error.
   *     tags: [Google OAuth]
   *     parameters:
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *         description: Código de autorización de Google
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: Estado JWT con info del usuario
   *       - in: query
   *         name: error
   *         schema:
   *           type: string
   *         description: Error si el usuario canceló o hubo problema
   *     responses:
   *       302:
   *         description: Redirección al frontend con resultado
   */
  async callback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(
          `${FRONTEND_URL}/integraciones?google_error=${encodeURIComponent(error as string)}`
        );
      }

      if (!code || !state) {
        return res.redirect(`${FRONTEND_URL}/integraciones?google_error=missing_params`);
      }

      // Verificar y decodificar state
      let stateData: OAuthState;
      try {
        stateData = jwt.verify(state as string, JWT_SECRET) as OAuthState;
      } catch (err) {
        return res.redirect(`${FRONTEND_URL}/integraciones?google_error=invalid_state`);
      }

      // Intercambiar código por tokens
      const tokens = await googleOAuthService.exchangeCodeForTokens(code as string);

      // Obtener info del usuario
      const userInfo = await googleOAuthService.getUserInfo(tokens.accessToken);

      // Guardar tokens
      await googleOAuthService.saveUserTokens(
        stateData.usuarioId,
        stateData.empresaId,
        tokens,
        userInfo,
        stateData.scopes
      );

      // Redirigir con éxito
      const separator = stateData.returnUrl.includes('?') ? '&' : '?';
      res.redirect(`${stateData.returnUrl}${separator}google_success=true`);
    } catch (error: any) {
      console.error('Error en callback de Google OAuth:', error);
      res.redirect(
        `${FRONTEND_URL}/integraciones?google_error=${encodeURIComponent(error.message || 'unknown_error')}`
      );
    }
  },

  /**
   * @swagger
   * /api/google/oauth/disconnect:
   *   delete:
   *     summary: Desconectar Google
   *     description: Desconecta la cuenta de Google del usuario actual, revocando los tokens
   *     tags: [Google OAuth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Google desconectado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: No autorizado
   */
  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const usuarioId = req.userId?.toString();
      const empresaId = req.empresaId?.toString();

      if (!usuarioId || !empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      await googleOAuthService.disconnectUser(usuarioId, empresaId);

      res.json({
        success: true,
        message: 'Google desconectado correctamente',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /api/google/oauth/scopes:
   *   get:
   *     summary: Scopes disponibles de Google
   *     description: Lista los scopes disponibles que se pueden solicitar al conectar Google
   *     tags: [Google OAuth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de scopes disponibles
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     scopes:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/GoogleScope'
   */
  async getAvailableScopes(req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        scopes: [
          {
            id: 'calendar',
            name: 'Google Calendar',
            description: 'Acceso completo a calendarios y eventos',
          },
          {
            id: 'gmail_send',
            name: 'Enviar emails',
            description: 'Enviar correos desde tu cuenta de Gmail',
          },
          {
            id: 'gmail_readonly',
            name: 'Leer emails',
            description: 'Leer correos de tu bandeja de entrada',
          },
          {
            id: 'gmail',
            name: 'Gmail completo',
            description: 'Acceso completo a Gmail (leer, enviar, modificar)',
          },
          {
            id: 'drive',
            name: 'Google Drive',
            description: 'Acceso a archivos creados por la app',
          },
          {
            id: 'contacts',
            name: 'Contactos',
            description: 'Leer contactos de Google',
          },
        ],
      },
    });
  },
};

export default googleOAuthController;
