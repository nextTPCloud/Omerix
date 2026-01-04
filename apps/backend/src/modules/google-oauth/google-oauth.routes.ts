// apps/backend/src/modules/google-oauth/google-oauth.routes.ts

import { Router } from 'express';
import { googleOAuthController } from './google-oauth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (callback de Google)
// ============================================

// GET /api/google/oauth/callback - Callback de Google (no requiere auth)
router.get('/callback', googleOAuthController.callback);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// Aplicar middleware de autenticación
router.use(authMiddleware);

// GET /api/google/oauth/status - Estado de conexión del usuario
router.get('/status', googleOAuthController.getStatus);

// GET /api/google/oauth/scopes - Scopes disponibles
router.get('/scopes', googleOAuthController.getAvailableScopes);

// POST /api/google/oauth/auth - Iniciar autenticación
router.post('/auth', googleOAuthController.startAuth);

// DELETE /api/google/oauth/disconnect - Desconectar
router.delete('/disconnect', googleOAuthController.disconnect);

export default router;
