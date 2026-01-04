// apps/backend/src/modules/recordatorios/recordatorios.routes.ts

import { Router } from 'express';
import { recordatoriosController } from './recordatorios.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Enums (públicos para el frontend)
router.get('/tipos', recordatoriosController.getTipos);

// CRUD
router.post('/', recordatoriosController.crear);
router.get('/', recordatoriosController.listar);
router.get('/pendientes', recordatoriosController.getPendientes);
router.get('/contadores', recordatoriosController.getContadores);

// Configuración
router.get('/configuracion', recordatoriosController.getConfiguracion);
router.put('/configuracion', recordatoriosController.actualizarConfiguracion);

// Estadísticas
router.get('/estadisticas', recordatoriosController.getEstadisticas);

// Acciones sobre un recordatorio
router.put('/:id/leido', recordatoriosController.marcarLeido);
router.put('/:id/completar', recordatoriosController.completar);
router.put('/:id/posponer', recordatoriosController.posponer);
router.put('/:id/descartar', recordatoriosController.descartar);
router.delete('/:id', recordatoriosController.eliminar);

export default router;
