// apps/backend/src/modules/social-media/social-media.routes.ts

import { Router } from 'express';
import { socialMediaController } from './social-media.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

// ============================================
// WEBHOOKS (sin autenticación)
// ============================================

router.get('/webhooks/meta', socialMediaController.verifyMetaWebhook);
router.post('/webhooks/meta', socialMediaController.handleMetaWebhook);

// ============================================
// AUTENTICACIÓN (requiere auth)
// ============================================

router.use(authMiddleware);

// OAuth con Meta
router.get('/auth/meta', socialMediaController.getMetaAuthUrl);
router.get('/auth/meta/callback', socialMediaController.metaAuthCallback);

// ============================================
// CUENTAS
// ============================================

router.get('/cuentas', socialMediaController.getCuentas);
router.get('/cuentas/:id', socialMediaController.getCuenta);
router.delete('/cuentas/:id', socialMediaController.desconectarCuenta);
router.post('/cuentas/:id/sync', socialMediaController.sincronizarCuenta);
router.post('/cuentas/:id/mensajes/sync', socialMediaController.sincronizarMensajes);
router.post('/cuentas/:id/mensajes/enviar', socialMediaController.enviarMensaje);

// ============================================
// PUBLICACIONES
// ============================================

router.get('/publicaciones', socialMediaController.getPublicaciones);
router.post('/publicaciones', socialMediaController.crearPublicacion);
router.post('/publicaciones/:id/publicar', socialMediaController.publicar);
router.post('/publicaciones/:id/programar', socialMediaController.programar);
router.post('/publicaciones/:id/sync', socialMediaController.sincronizarEstadisticas);
router.post('/publicaciones/:id/comentarios/sync', socialMediaController.sincronizarComentarios);

// ============================================
// COMENTARIOS
// ============================================

router.post('/comentarios/:id/responder', socialMediaController.responderComentario);

// ============================================
// DASHBOARD
// ============================================

router.get('/resumen', socialMediaController.getResumen);

export default router;
