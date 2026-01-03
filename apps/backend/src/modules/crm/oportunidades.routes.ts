import { Router } from 'express';
import { oportunidadesController } from './oportunidades.controller';
import {
  CreateOportunidadSchema,
  UpdateOportunidadSchema,
  CambiarEtapaOportunidadSchema,
  CerrarOportunidadSchema,
} from './crm.dto';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Oportunidades CRM
 *   description: Gestión de oportunidades de venta
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /crm/oportunidades:
 *   post:
 *     summary: Crear una nueva oportunidad
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  validateBody(CreateOportunidadSchema),
  oportunidadesController.crear.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades:
 *   get:
 *     summary: Obtener todas las oportunidades con filtros
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  oportunidadesController.obtenerTodas.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/pipeline:
 *   get:
 *     summary: Obtener oportunidades agrupadas por etapa (vista kanban)
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/pipeline',
  oportunidadesController.obtenerPipeline.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de oportunidades
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/estadisticas',
  oportunidadesController.obtenerEstadisticas.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/forecast:
 *   get:
 *     summary: Obtener forecast de ventas
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/forecast',
  oportunidadesController.obtenerForecast.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/{id}:
 *   get:
 *     summary: Obtener una oportunidad por ID
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  oportunidadesController.obtenerPorId.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/{id}:
 *   put:
 *     summary: Actualizar una oportunidad
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  validateBody(UpdateOportunidadSchema),
  oportunidadesController.actualizar.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/{id}:
 *   delete:
 *     summary: Eliminar una oportunidad
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  oportunidadesController.eliminar.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/{id}/etapa:
 *   patch:
 *     summary: Cambiar etapa de una oportunidad
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/etapa',
  validateBody(CambiarEtapaOportunidadSchema),
  oportunidadesController.cambiarEtapa.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/{id}/cerrar:
 *   post:
 *     summary: Cerrar oportunidad (ganada o perdida)
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/cerrar',
  validateBody(CerrarOportunidadSchema),
  oportunidadesController.cerrar.bind(oportunidadesController)
);

/**
 * @swagger
 * /crm/oportunidades/{id}/reabrir:
 *   post:
 *     summary: Reabrir una oportunidad cerrada
 *     tags: [Oportunidades CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/reabrir',
  oportunidadesController.reabrir.bind(oportunidadesController)
);

export default router;
