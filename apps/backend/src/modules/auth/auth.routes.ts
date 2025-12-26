// apps/backend/src/modules/auth/auth.routes.ts

import { Router } from 'express';
import {
  register,
  verificarNIF,
  login,
  selectEmpresa,
  verify2FA,
  getMe,
  setup2FAApp,
  confirm2FAApp,
  setup2FASMS,
  confirm2FASMS,
  disable2FA,
  resendSMSCode,
  refreshToken,
  resetPassword,
  verifyResetToken,
  forgotPassword,
  logout,
  getActiveSessions,
  getActiveSessionsEmpresa,
  logoutAllSessions,
} from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  authLimiter,
  registerLimiter,
  twoFactorLimiter,
  passwordResetLimiter,
} from '../../middleware/rateLimiter.middleware';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nueva empresa y usuario administrador
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombreEmpresa
 *               - nifEmpresa
 *               - emailEmpresa
 *               - nombre
 *               - apellidos
 *               - email
 *               - password
 *             properties:
 *               nombreEmpresa:
 *                 type: string
 *                 example: Mi Empresa SL
 *               nifEmpresa:
 *                 type: string
 *                 example: B12345678
 *               emailEmpresa:
 *                 type: string
 *                 format: email
 *                 example: empresa@test.com
 *               tipoNegocio:
 *                 type: string
 *                 enum: [retail, restauracion, taller, informatica, servicios, otro]
 *                 example: retail
 *               nombre:
 *                 type: string
 *                 example: Juan
 *               apellidos:
 *                 type: string
 *                 example: Pérez García
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *               telefono:
 *                 type: string
 *                 example: "+34666777888"
 *     responses:
 *       201:
 *         description: Registro exitoso
 *       400:
 *         description: Datos inválidos
 */
router.post('/register', registerLimiter, register);

/**
 * @swagger
 * /api/auth/verificar-nif:
 *   post:
 *     summary: Verificar NIF/CIF antes del registro
 *     tags: [Autenticación]
 *     description: |
 *       Valida el formato del NIF/CIF y opcionalmente verifica la empresa en el Registro Mercantil.
 *       En desarrollo permite continuar con advertencias, en producción requiere verificación.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nif
 *             properties:
 *               nif:
 *                 type: string
 *                 example: B12345678
 *                 description: NIF/CIF a verificar
 *               nombre:
 *                 type: string
 *                 example: Mi Empresa SL
 *                 description: Nombre fiscal (opcional, para verificación completa)
 *     responses:
 *       200:
 *         description: Resultado de la verificación
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
 *                     valido:
 *                       type: boolean
 *                       description: Si el formato del NIF es válido
 *                     tipo:
 *                       type: string
 *                       description: Tipo de entidad (DNI, NIE, CIF)
 *                     verificado:
 *                       type: boolean
 *                       description: Si se verificó en el Registro Mercantil
 *                     encontrado:
 *                       type: boolean
 *                       description: Si se encontró en el Registro Mercantil
 *                     datosOficiales:
 *                       type: object
 *                       description: Datos oficiales del Registro Mercantil
 *                     advertencias:
 *                       type: array
 *                       items:
 *                         type: string
 *                     errores:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post('/verificar-nif', authLimiter, verificarNIF);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión (Paso 1 - Verificar credenciales)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login exitoso o requiere 2FA
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', authLimiter, login);

/**
 * @swagger
 * /api/auth/select-empresa:
 *   post:
 *     summary: Seleccionar empresa (Paso 2 del login si el usuario tiene múltiples empresas)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - empresaId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               empresaId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: Empresa seleccionada, login exitoso
 *       401:
 *         description: Usuario no tiene acceso a esa empresa
 */
router.post('/select-empresa', authLimiter, selectEmpresa);

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     summary: Verificar código 2FA (Paso 2 del login)
 *     tags: [2FA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - code
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Código válido, login exitoso
 *       401:
 *         description: Código inválido
 */
router.post('/verify-2fa', twoFactorLimiter, verify2FA);

/**
 * @swagger
 * /api/auth/resend-sms:
 *   post:
 *     summary: Reenviar código SMS
 *     tags: [2FA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código reenviado
 */
router.post('/resend-sms', resendSMSCode);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar access token usando refresh token
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refrescado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@test.com
 *     responses:
 *       200:
 *         description: Email de recuperación enviado (si existe)
 */
router.post('/forgot-password', passwordResetLimiter, forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-token:
 *   get:
 *     summary: Verificar si un token de reset es válido
 *     tags: [Autenticación]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token válido
 *       400:
 *         description: Token inválido o expirado
 */
router.get('/verify-reset-token', verifyResetToken);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/reset-password', resetPassword);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener información del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/me', authMiddleware, getMe);

/**
 * @swagger
 * /api/auth/2fa/setup/app:
 *   post:
 *     summary: Configurar 2FA con Google Authenticator
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR Code generado
 */
router.post('/2fa/setup/app', authMiddleware, setup2FAApp);

/**
 * @swagger
 * /api/auth/2fa/confirm/app:
 *   post:
 *     summary: Confirmar y activar 2FA Google Authenticator
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA activado exitosamente
 */
router.post('/2fa/confirm/app', authMiddleware, confirm2FAApp);

/**
 * @swagger
 * /api/auth/2fa/setup/sms:
 *   post:
 *     summary: Configurar 2FA con SMS
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+34666777888"
 *     responses:
 *       200:
 *         description: Código SMS enviado
 */
router.post('/2fa/setup/sms', authMiddleware, setup2FASMS);

/**
 * @swagger
 * /api/auth/2fa/confirm/sms:
 *   post:
 *     summary: Confirmar y activar 2FA SMS
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA SMS activado
 */
router.post('/2fa/confirm/sms', authMiddleware, confirm2FASMS);

/**
 * @swagger
 * /api/auth/2fa/disable:
 *   post:
 *     summary: Desactivar 2FA
 *     tags: [2FA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: 2FA desactivado
 */
router.post('/2fa/disable', authMiddleware, disable2FA);

// ============================================
// GESTIÓN DE SESIONES Y TOKENS
// ============================================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión (revocar refresh token)
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       400:
 *         description: Refresh token es requerido
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     summary: Obtener sesiones activas del usuario
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       deviceInfo:
 *                         type: string
 *                       ipAddress:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autenticado
 */
router.get('/sessions', authMiddleware, getActiveSessions);

/**
 * @swagger
 * /api/auth/sessions/empresa:
 *   get:
 *     summary: Obtener todas las sesiones activas de la empresa
 *     description: Devuelve todas las sesiones activas de todos los usuarios de la empresa (para control de usuarios simultáneos)
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas de la empresa
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
 *                     totalSesiones:
 *                       type: integer
 *                       description: Número total de sesiones activas
 *                     sesiones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           usuario:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               nombre:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           deviceInfo:
 *                             type: string
 *                           ipAddress:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: No autenticado
 */
router.get('/sessions/empresa', authMiddleware, getActiveSessionsEmpresa);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Cerrar todas las sesiones activas del usuario
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las sesiones cerradas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Se cerraron 3 sesiones activas"
 *                 count:
 *                   type: number
 *                   example: 3
 *       401:
 *         description: No autenticado
 */
router.post('/logout-all', authMiddleware, logoutAllSessions);

export default router;