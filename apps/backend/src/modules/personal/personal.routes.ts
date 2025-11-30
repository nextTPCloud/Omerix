import { Router } from 'express';
import * as controller from './personal.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Middlewares de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/personal:
 *   get:
 *     summary: Listar empleados
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por código, nombre, apellidos, NIF o email
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, baja_temporal, baja_definitiva, vacaciones, excedencia, prejubilacion]
 *         description: Filtrar por estado
 *       - in: query
 *         name: tipoContrato
 *         schema:
 *           type: string
 *           enum: [indefinido, temporal, practicas, formacion, obra_servicio, interinidad, autonomo]
 *         description: Filtrar por tipo de contrato
 *       - in: query
 *         name: departamentoId
 *         schema:
 *           type: string
 *         description: Filtrar por departamento
 *       - in: query
 *         name: puesto
 *         schema:
 *           type: string
 *         description: Filtrar por puesto
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
 *           default: apellidos
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Lista de empleados
 */
router.get('/', controller.findAll);

/**
 * @swagger
 * /api/personal/sugerir-codigo:
 *   get:
 *     summary: Obtener siguiente código sugerido
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefijo
 *         schema:
 *           type: string
 *         description: Prefijo personalizado (por defecto EMP)
 *     responses:
 *       200:
 *         description: Código sugerido
 */
router.get('/sugerir-codigo', controller.sugerirCodigo);

/**
 * @swagger
 * /api/personal/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de personal
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del personal
 */
router.get('/estadisticas', controller.getEstadisticas);

/**
 * @swagger
 * /api/personal/exportar/csv:
 *   get:
 *     summary: Exportar personal a CSV
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Archivo CSV
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/exportar/csv', controller.exportarCSV);

/**
 * @swagger
 * /api/personal/calendario-ausencias:
 *   get:
 *     summary: Obtener calendario de ausencias
 *     tags: [Personal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Mes (1-12)
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Año
 *     responses:
 *       200:
 *         description: Calendario de ausencias
 */
router.get('/calendario-ausencias', controller.getCalendarioAusencias);

/**
 * @swagger
 * /api/personal/{id}:
 *   get:
 *     summary: Obtener empleado por ID
 *     tags: [Personal]
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
 *         description: Datos del empleado
 *       404:
 *         description: Empleado no encontrado
 */
router.get('/:id', controller.findById);

/**
 * @swagger
 * /api/personal:
 *   post:
 *     summary: Crear nuevo empleado
 *     tags: [Personal]
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
 *               - apellidos
 *               - datosLaborales
 *             properties:
 *               nombre:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               datosLaborales:
 *                 type: object
 *               datosPersonales:
 *                 type: object
 *               contacto:
 *                 type: object
 *     responses:
 *       201:
 *         description: Empleado creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/personal/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples empleados
 *     tags: [Personal]
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
 *         description: Empleados eliminados
 */
router.post('/bulk-delete', controller.bulkDelete);

/**
 * @swagger
 * /api/personal/{id}:
 *   put:
 *     summary: Actualizar empleado
 *     tags: [Personal]
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
 *         description: Empleado actualizado
 *       404:
 *         description: Empleado no encontrado
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/personal/{id}:
 *   delete:
 *     summary: Eliminar empleado
 *     tags: [Personal]
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
 *         description: Empleado eliminado
 *       404:
 *         description: Empleado no encontrado
 */
router.delete('/:id', controller.remove);

/**
 * @swagger
 * /api/personal/{id}/estado:
 *   patch:
 *     summary: Cambiar estado del empleado
 *     tags: [Personal]
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
 *             required:
 *               - activo
 *             properties:
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/estado', controller.changeStatus);

/**
 * @swagger
 * /api/personal/{id}/duplicar:
 *   post:
 *     summary: Duplicar empleado
 *     tags: [Personal]
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
 *         description: Empleado duplicado
 */
router.post('/:id/duplicar', controller.duplicar);

/**
 * @swagger
 * /api/personal/{id}/subordinados:
 *   get:
 *     summary: Obtener subordinados del empleado
 *     tags: [Personal]
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
 *         description: Lista de subordinados
 */
router.get('/:id/subordinados', controller.getSubordinados);

/**
 * @swagger
 * /api/personal/{id}/ausencias:
 *   post:
 *     summary: Registrar ausencia del empleado
 *     tags: [Personal]
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
 *             required:
 *               - tipo
 *               - fechaInicio
 *             properties:
 *               tipo:
 *                 type: string
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *               fechaFin:
 *                 type: string
 *                 format: date-time
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ausencia registrada
 */
router.post('/:id/ausencias', controller.registrarAusencia);

/**
 * @swagger
 * /api/personal/{id}/vacaciones:
 *   put:
 *     summary: Actualizar vacaciones del empleado
 *     tags: [Personal]
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
 *             required:
 *               - anio
 *               - diasTotales
 *             properties:
 *               anio:
 *                 type: integer
 *               diasTotales:
 *                 type: integer
 *               diasDisfrutados:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vacaciones actualizadas
 */
router.put('/:id/vacaciones', controller.actualizarVacaciones);

/**
 * @swagger
 * /api/personal/{id}/evaluaciones:
 *   post:
 *     summary: Registrar evaluación del empleado
 *     tags: [Personal]
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
 *             required:
 *               - fecha
 *               - evaluadorId
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               evaluadorId:
 *                 type: string
 *               puntuacion:
 *                 type: number
 *               comentarios:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evaluación registrada
 */
router.post('/:id/evaluaciones', controller.registrarEvaluacion);

export default router;
