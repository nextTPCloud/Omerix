import { Router } from 'express';
import { estadosController } from './estados.controller';
import {
  CreateEstadoSchema,
  UpdateEstadoSchema,
  BulkDeleteEstadosSchema,
  ChangeStatusSchema,
} from './estados.dto';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';
import { validateBody } from '@/middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Estados
 *   description: Gestión de estados del sistema
 */

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BÁSICAS
// ============================================

/**
 * @swagger
 * /estados:
 *   post:
 *     summary: Crear un nuevo estado
 *     tags: [Estados]
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
 *                 description: Nombre del estado
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Estado creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  '/',
  validateBody(CreateEstadoSchema),
  estadosController.create.bind(estadosController)
);

/**
 * @swagger
 * /estados:
 *   get:
 *     summary: Obtener todos los estados con filtros y paginación
 *     tags: [Estados]
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
 *         description: Lista de estados obtenida exitosamente
 *       401:
 *         description: No autenticado
 */
router.get(
  '/',
  estadosController.findAll.bind(estadosController)
);

/**
 * @swagger
 * /estados/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de estados
 *     tags: [Estados]
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
  estadosController.obtenerEstadisticas.bind(estadosController)
);

/**
 * @swagger
 * /estados/{id}:
 *   get:
 *     summary: Obtener un estado por ID
 *     tags: [Estados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estado
 *     responses:
 *       200:
 *         description: Estado obtenido exitosamente
 *       404:
 *         description: Estado no encontrado
 *       401:
 *         description: No autenticado
 */
router.get(
  '/:id',
  estadosController.findById.bind(estadosController)
);

/**
 * @swagger
 * /estados/{id}:
 *   put:
 *     summary: Actualizar un estado
 *     tags: [Estados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estado
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
 *         description: Estado actualizado exitosamente
 *       404:
 *         description: Estado no encontrado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.put(
  '/:id',
  validateBody(UpdateEstadoSchema),
  estadosController.update.bind(estadosController)
);

/**
 * @swagger
 * /estados/{id}:
 *   delete:
 *     summary: Eliminar un estado
 *     tags: [Estados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estado
 *     responses:
 *       200:
 *         description: Estado eliminado exitosamente
 *       404:
 *         description: Estado no encontrado
 *       401:
 *         description: No autenticado
 */
router.delete(
  '/:id',
  estadosController.delete.bind(estadosController)
);

// ============================================
// RUTAS ESPECIALES
// ============================================

/**
 * @swagger
 * /estados/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples estados
 *     tags: [Estados]
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
 *         description: Estados eliminados exitosamente
 *       400:
 *         description: IDs inválidos
 *       401:
 *         description: No autenticado
 */
router.post(
  '/bulk-delete',
  validateBody(BulkDeleteEstadosSchema),
  estadosController.bulkDelete.bind(estadosController)
);

/**
 * @swagger
 * /estados/{id}/estado:
 *   patch:
 *     summary: Cambiar estado (activar/desactivar)
 *     tags: [Estados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del estado
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
 *         description: Estado no encontrado
 *       401:
 *         description: No autenticado
 */
router.patch(
  '/:id/estado',
  validateBody(ChangeStatusSchema),
  estadosController.changeStatus.bind(estadosController)
);

export default router;
