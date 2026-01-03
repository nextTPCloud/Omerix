import { Router } from 'express';
import { actividadesController } from './actividades.controller';
import {
  CreateActividadSchema,
  UpdateActividadSchema,
  CompletarActividadSchema,
} from './crm.dto';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Actividades CRM
 *   description: Gestión de actividades de seguimiento
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /crm/actividades:
 *   post:
 *     summary: Crear una nueva actividad
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  validateBody(CreateActividadSchema),
  actividadesController.crear.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades:
 *   get:
 *     summary: Obtener todas las actividades con filtros
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  actividadesController.obtenerTodas.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/pendientes:
 *   get:
 *     summary: Obtener actividades pendientes
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/pendientes',
  actividadesController.obtenerPendientes.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/proximas:
 *   get:
 *     summary: Obtener actividades próximas (hoy y siguientes días)
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/proximas',
  actividadesController.obtenerProximas.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/vencidas:
 *   get:
 *     summary: Obtener actividades vencidas sin completar
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/vencidas',
  actividadesController.obtenerVencidas.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de actividades
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/estadisticas',
  actividadesController.obtenerEstadisticas.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/{id}:
 *   get:
 *     summary: Obtener una actividad por ID
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  actividadesController.obtenerPorId.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/{id}:
 *   put:
 *     summary: Actualizar una actividad
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  validateBody(UpdateActividadSchema),
  actividadesController.actualizar.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/{id}:
 *   delete:
 *     summary: Eliminar una actividad
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  actividadesController.eliminar.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/{id}/completar:
 *   post:
 *     summary: Marcar actividad como completada
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/completar',
  validateBody(CompletarActividadSchema),
  actividadesController.completar.bind(actividadesController)
);

/**
 * @swagger
 * /crm/actividades/{id}/descompletar:
 *   post:
 *     summary: Reabrir actividad completada
 *     tags: [Actividades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/descompletar',
  actividadesController.descompletar.bind(actividadesController)
);

export default router;
