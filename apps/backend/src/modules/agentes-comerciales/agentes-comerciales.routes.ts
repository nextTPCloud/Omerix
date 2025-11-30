import { Router } from 'express';
import * as controller from './agentes-comerciales.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Middlewares de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/agentes-comerciales:
 *   get:
 *     summary: Listar agentes comerciales
 *     tags: [Agentes Comerciales]
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
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [vendedor, representante, comercial, delegado, agente_externo]
 *         description: Filtrar por tipo de agente
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, inactivo, baja, vacaciones]
 *         description: Filtrar por estado
 *       - in: query
 *         name: zona
 *         schema:
 *           type: string
 *         description: Filtrar por zona asignada
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Elementos por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: nombre
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Orden ascendente o descendente
 *     responses:
 *       200:
 *         description: Lista de agentes comerciales
 */
router.get('/', controller.findAll);

/**
 * @swagger
 * /api/agentes-comerciales/sugerir-codigo:
 *   get:
 *     summary: Obtener siguiente código sugerido
 *     tags: [Agentes Comerciales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefijo
 *         schema:
 *           type: string
 *         description: Prefijo personalizado (por defecto AG)
 *     responses:
 *       200:
 *         description: Código sugerido
 */
router.get('/sugerir-codigo', controller.sugerirCodigo);

/**
 * @swagger
 * /api/agentes-comerciales/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de agentes
 *     tags: [Agentes Comerciales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de agentes comerciales
 */
router.get('/estadisticas', controller.getEstadisticas);

/**
 * @swagger
 * /api/agentes-comerciales/exportar/csv:
 *   get:
 *     summary: Exportar agentes a CSV
 *     tags: [Agentes Comerciales]
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
 * /api/agentes-comerciales/{id}:
 *   get:
 *     summary: Obtener agente por ID
 *     tags: [Agentes Comerciales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del agente
 *     responses:
 *       200:
 *         description: Datos del agente
 *       404:
 *         description: Agente no encontrado
 */
router.get('/:id', controller.findById);

/**
 * @swagger
 * /api/agentes-comerciales:
 *   post:
 *     summary: Crear nuevo agente comercial
 *     tags: [Agentes Comerciales]
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
 *               apellidos:
 *                 type: string
 *               nif:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [vendedor, representante, comercial, delegado, agente_externo]
 *               contacto:
 *                 type: object
 *               comision:
 *                 type: object
 *     responses:
 *       201:
 *         description: Agente creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/agentes-comerciales/bulk-delete:
 *   post:
 *     summary: Eliminar múltiples agentes
 *     tags: [Agentes Comerciales]
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
 *         description: Agentes eliminados
 */
router.post('/bulk-delete', controller.bulkDelete);

/**
 * @swagger
 * /api/agentes-comerciales/{id}:
 *   put:
 *     summary: Actualizar agente
 *     tags: [Agentes Comerciales]
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
 *         description: Agente actualizado
 *       404:
 *         description: Agente no encontrado
 */
router.put('/:id', controller.update);

/**
 * @swagger
 * /api/agentes-comerciales/{id}:
 *   delete:
 *     summary: Eliminar agente
 *     tags: [Agentes Comerciales]
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
 *         description: Agente eliminado
 *       404:
 *         description: Agente no encontrado
 */
router.delete('/:id', controller.remove);

/**
 * @swagger
 * /api/agentes-comerciales/{id}/estado:
 *   patch:
 *     summary: Cambiar estado del agente
 *     tags: [Agentes Comerciales]
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
 * /api/agentes-comerciales/{id}/duplicar:
 *   post:
 *     summary: Duplicar agente
 *     tags: [Agentes Comerciales]
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
 *         description: Agente duplicado
 */
router.post('/:id/duplicar', controller.duplicar);

/**
 * @swagger
 * /api/agentes-comerciales/{id}/clientes:
 *   post:
 *     summary: Asignar clientes al agente
 *     tags: [Agentes Comerciales]
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
 *               - clienteIds
 *             properties:
 *               clienteIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Clientes asignados
 */
router.post('/:id/clientes', controller.asignarClientes);

/**
 * @swagger
 * /api/agentes-comerciales/{id}/venta:
 *   post:
 *     summary: Registrar venta del agente
 *     tags: [Agentes Comerciales]
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
 *               - importe
 *             properties:
 *               importe:
 *                 type: number
 *               comision:
 *                 type: number
 *     responses:
 *       200:
 *         description: Venta registrada
 */
router.post('/:id/venta', controller.registrarVenta);

export default router;
