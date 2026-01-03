import { Router } from 'express';
import { pipelineController } from './pipeline.controller';
import {
  CreateEtapaPipelineSchema,
  UpdateEtapaPipelineSchema,
  ReordenarEtapasSchema,
} from './crm.dto';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pipeline CRM
 *   description: Gestión de etapas del pipeline de ventas
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /crm/pipeline/etapas:
 *   post:
 *     summary: Crear una nueva etapa del pipeline
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/etapas',
  validateBody(CreateEtapaPipelineSchema),
  pipelineController.crearEtapa.bind(pipelineController)
);

/**
 * @swagger
 * /crm/pipeline/etapas:
 *   get:
 *     summary: Obtener todas las etapas del pipeline
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/etapas',
  pipelineController.obtenerEtapas.bind(pipelineController)
);

/**
 * @swagger
 * /crm/pipeline/etapas/estadisticas:
 *   get:
 *     summary: Obtener etapas con estadísticas de oportunidades
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/etapas/estadisticas',
  pipelineController.obtenerEtapasConEstadisticas.bind(pipelineController)
);

/**
 * @swagger
 * /crm/pipeline/inicializar:
 *   post:
 *     summary: Inicializar pipeline con etapas por defecto
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/inicializar',
  pipelineController.inicializarPipelineDefault.bind(pipelineController)
);

/**
 * @swagger
 * /crm/pipeline/etapas/reordenar:
 *   post:
 *     summary: Reordenar etapas del pipeline
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/etapas/reordenar',
  validateBody(ReordenarEtapasSchema),
  pipelineController.reordenarEtapas.bind(pipelineController)
);

/**
 * @swagger
 * /crm/pipeline/etapas/{id}:
 *   get:
 *     summary: Obtener una etapa por ID
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/etapas/:id',
  pipelineController.obtenerEtapaPorId.bind(pipelineController)
);

/**
 * @swagger
 * /crm/pipeline/etapas/{id}:
 *   put:
 *     summary: Actualizar una etapa
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/etapas/:id',
  validateBody(UpdateEtapaPipelineSchema),
  pipelineController.actualizarEtapa.bind(pipelineController)
);

/**
 * @swagger
 * /crm/pipeline/etapas/{id}:
 *   delete:
 *     summary: Eliminar una etapa
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/etapas/:id',
  pipelineController.eliminarEtapa.bind(pipelineController)
);

/**
 * @swagger
 * /crm/pipeline/etapas/{id}/estado:
 *   patch:
 *     summary: Activar/desactivar una etapa
 *     tags: [Pipeline CRM]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/etapas/:id/estado',
  pipelineController.cambiarEstadoEtapa.bind(pipelineController)
);

export default router;
