import { Router } from 'express';
import { situacionesController } from './situaciones.controller';
import {
  CreateSituacionSchema,
  UpdateSituacionSchema,
  BulkDeleteSituacionesSchema,
  ChangeStatusSchema,
} from './situaciones.dto';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Situaciones
 *   description: Gestión de situaciones del sistema
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /situaciones:
 *   post:
 *     summary: Crear una nueva situación
 *     tags: [Situaciones]
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
 *                 description: Nombre de la situación
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Situación creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  '/',
  validateBody(CreateSituacionSchema),
  situacionesController.create.bind(situacionesController)
);

/**
 * @swagger
 * /situaciones:
 *   get:
 *     summary: Obtener todas las situaciones con filtros y paginación
 *     tags: [Situaciones]
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
 *         description: Lista de situaciones obtenida exitosamente
 *       401:
 *         description: No autenticado
 */
router.get(
  '/',
  situacionesController.findAll.bind(situacionesController)
);

/**
 * @swagger
 * /situaciones/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de situaciones
 *     tags: [Situaciones]
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
  situacionesController.obtenerEstadisticas.bind(situacionesController)
);

/**
 * @swagger
 * /situaciones/{id}:
 *   get:
 *     summary: Obtener una situación por ID
 *     tags: [Situaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la situación
 *     responses:
 *       200:
 *         description: Situación obtenida exitosamente
 *       404:
 *         description: Situación no encontrada
 *       401:
 *         description: No autenticado
 */
router.get(
  '/:id',
  situacionesController.findById.bind(situacionesController)
);

/**
 * @swagger
 * /situaciones/{id}:
 *   put:
 *     summary: Actualizar una situación
 *     tags: [Situaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la situación
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
 *         description: Situación actualizada exitosamente
 *       404:
 *         description: Situación no encontrada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.put(
  '/:id',
  validateBody(UpdateSituacionSchema),
  situacionesController.update.bind(situacionesController)
);

/**
 * @swagger
 * /situaciones/{id}:
 *   delete:
 *     summary: Eliminar una situación
 *     tags: [Situaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la situación
 *     responses:
 *       200:
 *         description: Situación eliminada exitosamente
 *       404:
 *         description: Situación no encontrada
 *       401:
 *         description: No autenticado
 */
router.delete(
  '/:id',
  situacionesController.delete.bind(situacionesController)
);

// ============================================
// RUTAS ESPECIALES
// ============================================

/**
 * @swagger
 * /situaciones/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples situaciones
 *     tags: [Situaciones]
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
 *         description: Situaciones eliminadas exitosamente
 *       400:
 *         description: IDs inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  '/bulk-delete',
  validateBody(BulkDeleteSituacionesSchema),
  situacionesController.bulkDelete.bind(situacionesController)
);

/**
 * @swagger
 * /situaciones/{id}/estado:
 *   patch:
 *     summary: Cambiar estado (activar/desactivar)
 *     tags: [Situaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la situación
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
 *         description: Situación no encontrada
 *       401:
 *         description: No autenticado
 */
router.patch(
  '/:id/estado',
  validateBody(ChangeStatusSchema),
  situacionesController.changeStatus.bind(situacionesController)
);

export default router;
