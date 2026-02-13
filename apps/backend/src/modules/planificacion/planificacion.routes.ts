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
 * @swagger
 * /api/planificacion/sugerir-codigo:
 *   get:
 *     summary: Obtener sugerencia de próximo código
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código sugerido
 */
router.get('/sugerir-codigo', planificacionController.sugerirCodigo.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/resumen-semanal:
 *   get:
 *     summary: Obtener resumen semanal de planificación
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de referencia para la semana
 *     responses:
 *       200:
 *         description: Resumen semanal
 */
router.get('/resumen-semanal', planificacionController.obtenerResumenSemanal.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/vista-completa:
 *   get:
 *     summary: Obtener vista completa de la semana con partes de trabajo y tareas
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vista completa semanal
 */
router.get('/vista-completa', planificacionController.obtenerVistaCompleta.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/empleado/{personalId}:
 *   get:
 *     summary: Obtener planificación de un empleado
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Planificación del empleado
 */
router.get('/empleado/:personalId', planificacionController.obtenerPlanificacionEmpleado.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion:
 *   get:
 *     summary: Listar planificaciones
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de planificaciones
 */
router.get('/', planificacionController.listar.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/{id}:
 *   get:
 *     summary: Obtener planificación por ID
 *     tags: [Planificacion]
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
 *         description: Detalle de la planificación
 */
router.get('/:id', planificacionController.obtenerPorId.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion:
 *   post:
 *     summary: Crear nueva planificación
 *     tags: [Planificacion]
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
 *         description: Planificación creada
 */
router.post('/', planificacionController.crear.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/{id}:
 *   put:
 *     summary: Actualizar planificación
 *     tags: [Planificacion]
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
 *         description: Planificación actualizada
 */
router.put('/:id', planificacionController.actualizar.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/{id}/asignaciones:
 *   post:
 *     summary: Agregar asignaciones a planificación
 *     tags: [Planificacion]
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
 *         description: Asignaciones agregadas
 */
router.post('/:id/asignaciones', planificacionController.agregarAsignaciones.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/{id}/asignaciones/{asignacionId}:
 *   put:
 *     summary: Actualizar asignación
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: asignacionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asignación actualizada
 */
router.put('/:id/asignaciones/:asignacionId', planificacionController.actualizarAsignacion.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/{id}/asignaciones/{asignacionId}:
 *   delete:
 *     summary: Eliminar asignación
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: asignacionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Asignación eliminada
 */
router.delete('/:id/asignaciones/:asignacionId', planificacionController.eliminarAsignacion.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/{id}/estado:
 *   post:
 *     summary: Cambiar estado de planificación
 *     tags: [Planificacion]
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
router.post('/:id/estado', planificacionController.cambiarEstado.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/{id}/copiar-semana:
 *   post:
 *     summary: Copiar planificación de una semana
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Semana copiada
 */
router.post('/:id/copiar-semana', planificacionController.copiarSemana.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/{id}:
 *   delete:
 *     summary: Eliminar planificación
 *     tags: [Planificacion]
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
 *         description: Planificación eliminada
 */
router.delete('/:id', planificacionController.eliminar.bind(planificacionController));

/**
 * @swagger
 * /api/planificacion/enviar-email:
 *   post:
 *     summary: Enviar planificación por email a empleados
 *     tags: [Planificacion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Email enviado
 */
router.post('/enviar-email', planificacionController.enviarPorEmail.bind(planificacionController));

export default router;
