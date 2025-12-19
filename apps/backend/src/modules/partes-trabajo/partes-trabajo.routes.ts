import { Router } from 'express';
import { partesTrabajoController } from './partes-trabajo.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: PartesTrabajo
 *   description: Gestion de partes de trabajo / ordenes de trabajo
 */

// ============================================
// RUTAS ESPECIALES (antes de :id)
// ============================================

/**
 * @swagger
 * /api/partes-trabajo/estadisticas:
 *   get:
 *     summary: Obtener estadisticas de partes de trabajo
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadisticas de partes de trabajo
 */
router.get('/estadisticas', partesTrabajoController.estadisticas);

/**
 * @swagger
 * /api/partes-trabajo/proyecto/{proyectoId}:
 *   get:
 *     summary: Obtener partes de trabajo de un proyecto
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proyectoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto
 *     responses:
 *       200:
 *         description: Lista de partes del proyecto
 */
router.get('/proyecto/:proyectoId', partesTrabajoController.obtenerPorProyecto);

/**
 * @swagger
 * /api/partes-trabajo/cliente/{clienteId}:
 *   get:
 *     summary: Obtener partes de trabajo de un cliente
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Lista de partes del cliente
 */
router.get('/cliente/:clienteId', partesTrabajoController.obtenerPorCliente);

/**
 * @swagger
 * /api/partes-trabajo/bulk/delete:
 *   post:
 *     summary: Eliminar multiples partes de trabajo
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Partes eliminados correctamente
 */
router.post('/bulk/delete', partesTrabajoController.eliminarMultiples);

// ============================================
// RUTAS CRUD BASICAS
// ============================================

/**
 * @swagger
 * /api/partes-trabajo:
 *   post:
 *     summary: Crear un nuevo parte de trabajo
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateParteTrabajoDTO'
 *     responses:
 *       201:
 *         description: Parte de trabajo creado correctamente
 */
router.post('/', partesTrabajoController.crear);

/**
 * @swagger
 * /api/partes-trabajo:
 *   get:
 *     summary: Obtener lista de partes de trabajo con filtros y paginacion
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busqueda por codigo, titulo, cliente, proyecto
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *       - in: query
 *         name: proyectoId
 *         schema:
 *           type: string
 *         description: Filtrar por proyecto
 *       - in: query
 *         name: responsableId
 *         schema:
 *           type: string
 *         description: Filtrar por responsable
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, planificado, en_curso, pausado, completado, facturado, anulado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [mantenimiento, instalacion, reparacion, servicio, proyecto, otro]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *           enum: [baja, media, alta, urgente]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha desde
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha hasta
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: fecha
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de partes de trabajo
 */
router.get('/', partesTrabajoController.buscar);

/**
 * @swagger
 * /api/partes-trabajo/{id}:
 *   get:
 *     summary: Obtener un parte de trabajo por ID
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del parte de trabajo
 *     responses:
 *       200:
 *         description: Parte de trabajo encontrado
 *       404:
 *         description: Parte de trabajo no encontrado
 */
router.get('/:id', partesTrabajoController.obtenerPorId);

/**
 * @swagger
 * /api/partes-trabajo/{id}:
 *   put:
 *     summary: Actualizar un parte de trabajo
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del parte de trabajo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateParteTrabajoDTO'
 *     responses:
 *       200:
 *         description: Parte de trabajo actualizado correctamente
 */
router.put('/:id', partesTrabajoController.actualizar);

/**
 * @swagger
 * /api/partes-trabajo/{id}:
 *   delete:
 *     summary: Eliminar un parte de trabajo (soft delete)
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del parte de trabajo
 *     responses:
 *       200:
 *         description: Parte de trabajo eliminado correctamente
 */
router.delete('/:id', partesTrabajoController.eliminar);

// ============================================
// RUTAS DE ACCIONES
// ============================================

/**
 * @swagger
 * /api/partes-trabajo/{id}/estado:
 *   patch:
 *     summary: Cambiar el estado de un parte de trabajo
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del parte de trabajo
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
 *                 enum: [borrador, planificado, en_curso, pausado, completado, facturado, anulado]
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado cambiado correctamente
 */
router.patch('/:id/estado', partesTrabajoController.cambiarEstado);

/**
 * @swagger
 * /api/partes-trabajo/{id}/completar:
 *   post:
 *     summary: Completar un parte de trabajo con firmas
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del parte de trabajo
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trabajoRealizado:
 *                 type: string
 *                 description: Descripcion del trabajo realizado
 *               firmaTecnico:
 *                 type: string
 *                 description: Firma del tecnico en base64
 *               nombreTecnico:
 *                 type: string
 *               firmaCliente:
 *                 type: string
 *                 description: Firma del cliente en base64
 *               nombreCliente:
 *                 type: string
 *               dniCliente:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Parte completado correctamente
 */
router.post('/:id/completar', partesTrabajoController.completar);

/**
 * @swagger
 * /api/partes-trabajo/{id}/generar-albaran:
 *   post:
 *     summary: Generar albaran de venta desde el parte de trabajo
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del parte de trabajo
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               incluirPersonal:
 *                 type: boolean
 *                 default: true
 *               incluirMaterial:
 *                 type: boolean
 *                 default: true
 *               incluirMaquinaria:
 *                 type: boolean
 *                 default: true
 *               incluirTransporte:
 *                 type: boolean
 *                 default: true
 *               incluirGastos:
 *                 type: boolean
 *                 default: true
 *               soloFacturables:
 *                 type: boolean
 *                 default: true
 *               almacenId:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Albaran generado correctamente
 */
router.post('/:id/generar-albaran', partesTrabajoController.generarAlbaran);

/**
 * @swagger
 * /api/partes-trabajo/{id}/duplicar:
 *   post:
 *     summary: Duplicar un parte de trabajo
 *     tags: [PartesTrabajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del parte de trabajo a duplicar
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clienteId:
 *                 type: string
 *                 description: Nuevo cliente (opcional)
 *               proyectoId:
 *                 type: string
 *                 description: Nuevo proyecto (opcional)
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Nueva fecha (opcional)
 *               incluirLineas:
 *                 type: boolean
 *                 default: true
 *                 description: Si incluir las lineas del parte original
 *     responses:
 *       201:
 *         description: Parte de trabajo duplicado correctamente
 */
router.post('/:id/duplicar', partesTrabajoController.duplicar);

export default router;
