import { Router } from 'express';
import { planificacionController } from './planificacion.controller';
import { authMiddleware, requireModuleAccess } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de RRHH
router.use(requireModuleAccess('accesoRRHH'));

/**
 * @swagger
 * tags:
 *   name: Planificacion
 *   description: Gestion de planificacion de jornadas del personal
 */

/**
 * GET /api/planificacion/sugerir-codigo
 * Obtener sugerencia de proximo codigo
 */
router.get('/sugerir-codigo', planificacionController.sugerirCodigo.bind(planificacionController));

/**
 * GET /api/planificacion/resumen-semanal
 * Obtener resumen semanal de planificacion
 */
router.get('/resumen-semanal', planificacionController.obtenerResumenSemanal.bind(planificacionController));

/**
 * GET /api/planificacion/vista-completa
 * Obtener vista completa de la semana con partes de trabajo y tareas
 */
router.get('/vista-completa', planificacionController.obtenerVistaCompleta.bind(planificacionController));

/**
 * GET /api/planificacion/empleado/:personalId
 * Obtener planificacion de un empleado
 */
router.get('/empleado/:personalId', planificacionController.obtenerPlanificacionEmpleado.bind(planificacionController));

/**
 * GET /api/planificacion
 * Listar planificaciones
 */
router.get('/', planificacionController.listar.bind(planificacionController));

/**
 * GET /api/planificacion/:id
 * Obtener planificacion por ID
 */
router.get('/:id', planificacionController.obtenerPorId.bind(planificacionController));

/**
 * POST /api/planificacion
 * Crear nueva planificacion
 */
router.post('/', planificacionController.crear.bind(planificacionController));

/**
 * PUT /api/planificacion/:id
 * Actualizar planificacion
 */
router.put('/:id', planificacionController.actualizar.bind(planificacionController));

/**
 * POST /api/planificacion/:id/asignaciones
 * Agregar asignaciones
 */
router.post('/:id/asignaciones', planificacionController.agregarAsignaciones.bind(planificacionController));

/**
 * PUT /api/planificacion/:id/asignaciones/:asignacionId
 * Actualizar asignacion
 */
router.put('/:id/asignaciones/:asignacionId', planificacionController.actualizarAsignacion.bind(planificacionController));

/**
 * DELETE /api/planificacion/:id/asignaciones/:asignacionId
 * Eliminar asignacion
 */
router.delete('/:id/asignaciones/:asignacionId', planificacionController.eliminarAsignacion.bind(planificacionController));

/**
 * POST /api/planificacion/:id/estado
 * Cambiar estado
 */
router.post('/:id/estado', planificacionController.cambiarEstado.bind(planificacionController));

/**
 * POST /api/planificacion/:id/copiar-semana
 * Copiar semana
 */
router.post('/:id/copiar-semana', planificacionController.copiarSemana.bind(planificacionController));

/**
 * DELETE /api/planificacion/:id
 * Eliminar planificacion
 */
router.delete('/:id', planificacionController.eliminar.bind(planificacionController));

/**
 * POST /api/planificacion/enviar-email
 * Enviar planificacion por email a empleados
 */
router.post('/enviar-email', planificacionController.enviarPorEmail.bind(planificacionController));

export default router;
