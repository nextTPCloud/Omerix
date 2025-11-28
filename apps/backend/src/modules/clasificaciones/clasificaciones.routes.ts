import { Router } from 'express';
import { clasificacionesController } from './clasificaciones.controller';
import {
  CreateClasificacionSchema,
  UpdateClasificacionSchema,
  BulkDeleteClasificacionesSchema,
  ChangeStatusSchema,
} from './clasificaciones.dto';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clasificaciones
 *   description: Gestión de clasificaciones del sistema
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /clasificaciones:
 *   post:
 *     summary: Crear una nueva clasificación
 *     tags: [Clasificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la clasificación
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Clasificación creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  '/',
  validateBody(CreateClasificacionSchema),
  clasificacionesController.create.bind(clasificacionesController)
);

/**
 * @swagger
 * /clasificaciones:
 *   get:
 *     summary: Obtener todas las clasificaciones con filtros y paginación
 *     tags: [Clasificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: nombre
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Lista de clasificaciones obtenida exitosamente
 *       401:
 *         description: No autenticado
 */
router.get(
  '/',
  clasificacionesController.findAll.bind(clasificacionesController)
);

/**
 * @swagger
 * /clasificaciones/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de clasificaciones
 *     tags: [Clasificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         description: No autenticado
 */
router.get(
  '/estadisticas',
  clasificacionesController.obtenerEstadisticas.bind(clasificacionesController)
);

/**
 * @swagger
 * /clasificaciones/{id}:
 *   get:
 *     summary: Obtener una clasificación por ID
 *     tags: [Clasificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clasificación
 *     responses:
 *       200:
 *         description: Clasificación obtenida exitosamente
 *       404:
 *         description: Clasificación no encontrada
 *       401:
 *         description: No autenticado
 */
router.get(
  '/:id',
  clasificacionesController.findById.bind(clasificacionesController)
);

/**
 * @swagger
 * /clasificaciones/{id}:
 *   put:
 *     summary: Actualizar una clasificación
 *     tags: [Clasificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clasificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Clasificación actualizada exitosamente
 *       404:
 *         description: Clasificación no encontrada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.put(
  '/:id',
  validateBody(UpdateClasificacionSchema),
  clasificacionesController.update.bind(clasificacionesController)
);

/**
 * @swagger
 * /clasificaciones/{id}:
 *   delete:
 *     summary: Eliminar una clasificación
 *     tags: [Clasificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clasificación
 *     responses:
 *       200:
 *         description: Clasificación eliminada exitosamente
 *       404:
 *         description: Clasificación no encontrada
 *       401:
 *         description: No autenticado
 */
router.delete(
  '/:id',
  clasificacionesController.delete.bind(clasificacionesController)
);

// ============================================
// RUTAS ESPECIALES
// ============================================

/**
 * @swagger
 * /clasificaciones/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples clasificaciones
 *     tags: [Clasificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Clasificaciones eliminadas exitosamente
 *       400:
 *         description: IDs inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  '/bulk-delete',
  validateBody(BulkDeleteClasificacionesSchema),
  clasificacionesController.bulkDelete.bind(clasificacionesController)
);

/**
 * @swagger
 * /clasificaciones/{id}/estado:
 *   patch:
 *     summary: Cambiar estado (activar/desactivar)
 *     tags: [Clasificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clasificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activo
 *             properties:
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado cambiado exitosamente
 *       404:
 *         description: Clasificación no encontrada
 *       401:
 *         description: No autenticado
 */
router.patch(
  '/:id/estado',
  validateBody(ChangeStatusSchema),
  clasificacionesController.changeStatus.bind(clasificacionesController)
);

export default router;
