import { Router } from 'express';
import { tareasController } from './tareas.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Tareas
 *   description: Gestión de tareas y recordatorios
 */

/**
 * @swagger
 * /api/tareas/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de tareas
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de tareas
 */
router.get('/estadisticas', tareasController.estadisticas.bind(tareasController));

/**
 * @swagger
 * /api/tareas/widget:
 *   get:
 *     summary: Obtener tareas para el widget del dashboard
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tareas del widget
 */
router.get('/widget', tareasController.widget.bind(tareasController));

/**
 * @swagger
 * /api/tareas:
 *   get:
 *     summary: Listar tareas con filtros
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tareas
 */
router.get('/', tareasController.listar.bind(tareasController));

/**
 * @swagger
 * /api/tareas/{id}:
 *   get:
 *     summary: Obtener tarea por ID
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de la tarea
 */
router.get('/:id', tareasController.obtenerPorId.bind(tareasController));

/**
 * @swagger
 * /api/tareas:
 *   post:
 *     summary: Crear nueva tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Tarea creada
 */
router.post('/', tareasController.crear.bind(tareasController));

/**
 * @swagger
 * /api/tareas/{id}:
 *   put:
 *     summary: Actualizar tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Tarea actualizada
 */
router.put('/:id', tareasController.actualizar.bind(tareasController));

/**
 * @swagger
 * /api/tareas/{id}/estado:
 *   post:
 *     summary: Cambiar estado de tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado cambiado
 */
router.post('/:id/estado', tareasController.cambiarEstado.bind(tareasController));

/**
 * @swagger
 * /api/tareas/{id}/comentarios:
 *   post:
 *     summary: Agregar comentario a tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Comentario agregado
 */
router.post('/:id/comentarios', tareasController.agregarComentario.bind(tareasController));

/**
 * @swagger
 * /api/tareas/{id}/reasignar:
 *   post:
 *     summary: Reasignar tarea a otro usuario
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Tarea reasignada
 */
router.post('/:id/reasignar', tareasController.reasignar.bind(tareasController));

/**
 * @swagger
 * /api/tareas/{id}:
 *   delete:
 *     summary: Eliminar tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tarea eliminada
 */
router.delete('/:id', tareasController.eliminar.bind(tareasController));

export default router;
