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
 * GET /api/tareas/estadisticas
 * Obtener estadísticas de tareas
 */
router.get('/estadisticas', tareasController.estadisticas.bind(tareasController));

/**
 * GET /api/tareas/widget
 * Obtener tareas para el widget del dashboard
 */
router.get('/widget', tareasController.widget.bind(tareasController));

/**
 * GET /api/tareas
 * Listar tareas con filtros
 */
router.get('/', tareasController.listar.bind(tareasController));

/**
 * GET /api/tareas/:id
 * Obtener tarea por ID
 */
router.get('/:id', tareasController.obtenerPorId.bind(tareasController));

/**
 * POST /api/tareas
 * Crear nueva tarea
 */
router.post('/', tareasController.crear.bind(tareasController));

/**
 * PUT /api/tareas/:id
 * Actualizar tarea
 */
router.put('/:id', tareasController.actualizar.bind(tareasController));

/**
 * POST /api/tareas/:id/estado
 * Cambiar estado de tarea
 */
router.post('/:id/estado', tareasController.cambiarEstado.bind(tareasController));

/**
 * POST /api/tareas/:id/comentarios
 * Agregar comentario a tarea
 */
router.post('/:id/comentarios', tareasController.agregarComentario.bind(tareasController));

/**
 * POST /api/tareas/:id/reasignar
 * Reasignar tarea (desde planificacion)
 */
router.post('/:id/reasignar', tareasController.reasignar.bind(tareasController));

/**
 * DELETE /api/tareas/:id
 * Eliminar tarea
 */
router.delete('/:id', tareasController.eliminar.bind(tareasController));

export default router;
