import { Router } from 'express';
import { proyectosController } from './proyectos.controller';
import { authMiddleware, requireModuleAccess } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de Proyectos
router.use(requireModuleAccess('accesoProyectos'));

/**
 * @swagger
 * components:
 *   schemas:
 *     Proyecto:
 *       type: object
 *       required:
 *         - nombre
 *         - clienteId
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del proyecto
 *         codigo:
 *           type: string
 *           description: Código único del proyecto (auto-generado)
 *         nombre:
 *           type: string
 *           description: Nombre del proyecto
 *         descripcion:
 *           type: string
 *           description: Descripción detallada
 *         clienteId:
 *           type: string
 *           description: ID del cliente asociado
 *         agenteComercialId:
 *           type: string
 *           description: ID del agente comercial
 *         tipo:
 *           type: string
 *           enum: [interno, cliente, mantenimiento, desarrollo, consultoria, instalacion, otro]
 *         estado:
 *           type: string
 *           enum: [borrador, planificacion, en_curso, pausado, completado, cancelado, cerrado]
 *         prioridad:
 *           type: string
 *           enum: [baja, media, alta, urgente]
 *         fechaInicio:
 *           type: string
 *           format: date
 *         fechaFinPrevista:
 *           type: string
 *           format: date
 *         fechaFinReal:
 *           type: string
 *           format: date
 *         direccion:
 *           type: object
 *           properties:
 *             nombre:
 *               type: string
 *             calle:
 *               type: string
 *             numero:
 *               type: string
 *             codigoPostal:
 *               type: string
 *             ciudad:
 *               type: string
 *             provincia:
 *               type: string
 *             pais:
 *               type: string
 *         presupuestoEstimado:
 *           type: number
 *         presupuestoAprobado:
 *           type: number
 *         costeReal:
 *           type: number
 *         horasEstimadas:
 *           type: number
 *         horasReales:
 *           type: number
 *         hitos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fechaPrevista:
 *                 type: string
 *                 format: date
 *               fechaReal:
 *                 type: string
 *                 format: date
 *               completado:
 *                 type: boolean
 *               orden:
 *                 type: number
 *         participantes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               personalId:
 *                 type: string
 *               rol:
 *                 type: string
 *               horasAsignadas:
 *                 type: number
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         activo:
 *           type: boolean
 *     ProyectoInput:
 *       type: object
 *       required:
 *         - nombre
 *         - clienteId
 *       properties:
 *         nombre:
 *           type: string
 *         clienteId:
 *           type: string
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *         estado:
 *           type: string
 *         prioridad:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Proyectos
 *   description: Gestión de proyectos
 */

/**
 * @swagger
 * /api/proyectos/sugerir-codigo:
 *   get:
 *     summary: Obtener el siguiente código de proyecto sugerido
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código sugerido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     codigo:
 *                       type: string
 */
router.get('/sugerir-codigo', proyectosController.sugerirCodigo.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/codigos:
 *   get:
 *     summary: Buscar códigos existentes por prefijo (para auto-sugerencia)
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Prefijo del código a buscar
 *     responses:
 *       200:
 *         description: Lista de códigos que coinciden con el prefijo
 */
router.get('/codigos', proyectosController.searchCodigos.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de proyectos
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     activos:
 *                       type: number
 *                     enCurso:
 *                       type: number
 *                     completados:
 *                       type: number
 *                     retrasados:
 *                       type: number
 *                     presupuestoTotal:
 *                       type: number
 *                     costeTotal:
 *                       type: number
 */
router.get('/estadisticas', proyectosController.obtenerEstadisticas.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/cliente/{clienteId}:
 *   get:
 *     summary: Obtener proyectos de un cliente
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de proyectos del cliente
 */
router.get('/cliente/:clienteId', proyectosController.obtenerPorCliente.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos:
 *   get:
 *     summary: Obtener todos los proyectos
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, código o descripción
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, planificacion, en_curso, pausado, completado, cancelado, cerrado]
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *       - in: query
 *         name: retrasados
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
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
 *           default: fechaCreacion
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de proyectos paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Proyecto'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', proyectosController.obtenerTodos.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos:
 *   post:
 *     summary: Crear un nuevo proyecto
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProyectoInput'
 *     responses:
 *       201:
 *         description: Proyecto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Proyecto'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 */
router.post('/', proyectosController.crear.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples proyectos
 *     tags: [Proyectos]
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
 *         description: Proyectos eliminados
 */
router.post('/bulk-delete', proyectosController.eliminarVarios.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}:
 *   get:
 *     summary: Obtener un proyecto por ID
 *     tags: [Proyectos]
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
 *         description: Proyecto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Proyecto'
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:id', proyectosController.obtenerPorId.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}:
 *   put:
 *     summary: Actualizar un proyecto
 *     tags: [Proyectos]
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
 *             $ref: '#/components/schemas/ProyectoInput'
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *       404:
 *         description: Proyecto no encontrado
 */
router.put('/:id', proyectosController.actualizar.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}:
 *   delete:
 *     summary: Eliminar un proyecto
 *     tags: [Proyectos]
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
 *         description: Proyecto eliminado
 *       404:
 *         description: Proyecto no encontrado
 */
router.delete('/:id', proyectosController.eliminar.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un proyecto
 *     tags: [Proyectos]
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
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [borrador, planificacion, en_curso, pausado, completado, cancelado, cerrado]
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado cambiado
 *       404:
 *         description: Proyecto no encontrado
 */
router.patch('/:id/estado', proyectosController.cambiarEstado.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}/duplicar:
 *   post:
 *     summary: Duplicar un proyecto
 *     tags: [Proyectos]
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
 *         description: Proyecto duplicado
 *       404:
 *         description: Proyecto no encontrado
 */
router.post('/:id/duplicar', proyectosController.duplicar.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}/hitos:
 *   post:
 *     summary: Agregar un hito al proyecto
 *     tags: [Proyectos]
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
 *               - nombre
 *               - fechaPrevista
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fechaPrevista:
 *                 type: string
 *                 format: date
 *               orden:
 *                 type: number
 *     responses:
 *       200:
 *         description: Hito agregado
 */
router.post('/:id/hitos', proyectosController.agregarHito.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}/hitos/{hitoId}:
 *   patch:
 *     summary: Actualizar un hito del proyecto
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: hitoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fechaPrevista:
 *                 type: string
 *                 format: date
 *               fechaReal:
 *                 type: string
 *                 format: date
 *               completado:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Hito actualizado
 */
router.patch('/:id/hitos/:hitoId', proyectosController.actualizarHito.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}/hitos/{hitoId}:
 *   delete:
 *     summary: Eliminar un hito del proyecto
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: hitoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hito eliminado
 */
router.delete('/:id/hitos/:hitoId', proyectosController.eliminarHito.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}/participantes:
 *   post:
 *     summary: Agregar un participante al proyecto
 *     tags: [Proyectos]
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
 *               - rol
 *             properties:
 *               personalId:
 *                 type: string
 *               usuarioId:
 *                 type: string
 *               rol:
 *                 type: string
 *               horasAsignadas:
 *                 type: number
 *     responses:
 *       200:
 *         description: Participante agregado
 */
router.post('/:id/participantes', proyectosController.agregarParticipante.bind(proyectosController));

/**
 * @swagger
 * /api/proyectos/{id}/participantes/{participanteId}:
 *   delete:
 *     summary: Eliminar un participante del proyecto
 *     tags: [Proyectos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: participanteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participante eliminado
 */
router.delete('/:id/participantes/:participanteId', proyectosController.eliminarParticipante.bind(proyectosController));

export default router;
