// apps/backend/src/modules/google-calendar/google-calendar.routes.ts

import { Router } from 'express';
import { googleCalendarController } from './google-calendar.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

// OAuth callback (sin autenticación, pero con state)
router.get('/auth/callback', googleCalendarController.authCallback);

// Rutas protegidas
router.use(authMiddleware);

// Autenticación
router.get('/auth', googleCalendarController.getAuthUrl);

// Configuración
router.get('/config', googleCalendarController.getConfig);
router.put('/config', googleCalendarController.updateConfig);
router.delete('/disconnect', googleCalendarController.disconnect);

// Sincronización
router.post('/sync', googleCalendarController.sync);
router.post('/eventos/:id/sync', googleCalendarController.syncEvento);

// Eventos
router.get('/eventos', googleCalendarController.getEventos);
router.post('/eventos', googleCalendarController.registrarEvento);
router.delete('/eventos/:tipo/:entidadId', googleCalendarController.eliminarEvento);

// Estadísticas
router.get('/stats', googleCalendarController.getStats);

export default router;
