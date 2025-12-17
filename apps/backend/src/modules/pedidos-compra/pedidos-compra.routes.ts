import { Router } from 'express';
import { pedidosCompraController } from './pedidos-compra.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { tenantMiddleware } from '@/middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pedidos de Compra
 *   description: Gestion de pedidos de compra a proveedores
 */

// Todas las rutas requieren autenticacion y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD BASICAS
// ============================================

/**
 * @swagger
 * /pedidos-compra:
 *   post:
 *     summary: Crear un nuevo pedido de compra
 *     tags: [Pedidos de Compra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proveedorId
 *             properties:
 *               proveedorId:
 *                 type: string
 *               titulo:
 *                 type: string
 *               lineas:
 *                 type: array
 *     responses:
 *       201:
 *         description: Pedido de compra creado exitosamente
 */
router.post('/', pedidosCompraController.create.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra:
 *   get:
 *     summary: Obtener todos los pedidos de compra con paginacion y filtros
 *     tags: [Pedidos de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero de pagina
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Registros por pagina
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busqueda por codigo, proveedor, etc.
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: proveedorId
 *         schema:
 *           type: string
 *         description: Filtrar por proveedor
 *     responses:
 *       200:
 *         description: Lista de pedidos de compra
 */
router.get('/', pedidosCompraController.findAll.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/estadisticas:
 *   get:
 *     summary: Obtener estadisticas de pedidos de compra
 *     tags: [Pedidos de Compra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadisticas de pedidos de compra
 */
router.get('/estadisticas', pedidosCompraController.getEstadisticas.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/alertas:
 *   get:
 *     summary: Obtener alertas de pedidos de compra (pendientes recibir, retrasados, proximos)
 *     tags: [Pedidos de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: diasAlerta
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Dias para considerar proximos a recibir
 *     responses:
 *       200:
 *         description: Alertas de pedidos de compra
 */
router.get('/alertas', pedidosCompraController.getAlertas.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/codigo/{codigo}:
 *   get:
 *     summary: Obtener pedido de compra por codigo
 *     tags: [Pedidos de Compra]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido de compra encontrado
 *       404:
 *         description: Pedido de compra no encontrado
 */
router.get('/codigo/:codigo', pedidosCompraController.findByCodigo.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/{id}:
 *   get:
 *     summary: Obtener pedido de compra por ID
 *     tags: [Pedidos de Compra]
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
 *         description: Pedido de compra encontrado
 *       404:
 *         description: Pedido de compra no encontrado
 */
router.get('/:id', pedidosCompraController.findById.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/{id}:
 *   put:
 *     summary: Actualizar un pedido de compra
 *     tags: [Pedidos de Compra]
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
 *         description: Pedido de compra actualizado
 *       404:
 *         description: Pedido de compra no encontrado
 */
router.put('/:id', pedidosCompraController.update.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/{id}:
 *   delete:
 *     summary: Eliminar un pedido de compra
 *     tags: [Pedidos de Compra]
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
 *         description: Pedido de compra eliminado
 *       404:
 *         description: Pedido de compra no encontrado
 */
router.delete('/:id', pedidosCompraController.delete.bind(pedidosCompraController));

// ============================================
// RUTAS DE ACCIONES
// ============================================

/**
 * @swagger
 * /pedidos-compra/{id}/estado:
 *   patch:
 *     summary: Cambiar estado de un pedido de compra
 *     tags: [Pedidos de Compra]
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
 *                 enum: [borrador, enviado, confirmado, parcialmente_recibido, recibido, facturado, cancelado]
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/estado', pedidosCompraController.cambiarEstado.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/{id}/recepcion:
 *   post:
 *     summary: Registrar recepcion de mercancia
 *     tags: [Pedidos de Compra]
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
 *               - lineaId
 *               - cantidadRecibida
 *             properties:
 *               lineaId:
 *                 type: string
 *               cantidadRecibida:
 *                 type: number
 *     responses:
 *       200:
 *         description: Recepcion registrada
 */
router.post('/:id/recepcion', pedidosCompraController.registrarRecepcion.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/{id}/preparar-recepcion:
 *   get:
 *     summary: Obtener datos preparados para recepcion (expande kits, muestra variantes)
 *     tags: [Pedidos de Compra]
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
 *         description: Datos preparados para recepcion
 */
router.get('/:id/preparar-recepcion', pedidosCompraController.prepararParaRecepcion.bind(pedidosCompraController));

/**
 * @swagger
 * /pedidos-compra/{id}/duplicar:
 *   post:
 *     summary: Duplicar un pedido de compra
 *     tags: [Pedidos de Compra]
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
 *         description: Pedido de compra duplicado
 */
router.post('/:id/duplicar', pedidosCompraController.duplicar.bind(pedidosCompraController));

// ============================================
// RUTAS MASIVAS
// ============================================

/**
 * @swagger
 * /pedidos-compra/bulk/delete:
 *   post:
 *     summary: Eliminar multiples pedidos de compra
 *     tags: [Pedidos de Compra]
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
 *         description: Pedidos de compra eliminados
 */
router.post('/bulk/delete', pedidosCompraController.deleteMany.bind(pedidosCompraController));

export default router;
