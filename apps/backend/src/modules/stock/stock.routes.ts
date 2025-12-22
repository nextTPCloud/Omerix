import { Router } from 'express';
import { stockController } from './stock.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Stock
 *   description: Gestión de stock y movimientos de inventario
 */

/**
 * @swagger
 * /api/stock/movimientos:
 *   get:
 *     summary: Obtener listado de movimientos de stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productoId
 *         schema:
 *           type: string
 *         description: Filtrar por producto
 *       - in: query
 *         name: almacenId
 *         schema:
 *           type: string
 *         description: Filtrar por almacén
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de movimiento
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicio
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha fin
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de movimientos
 */
router.get('/movimientos', stockController.getMovimientos.bind(stockController));

/**
 * @swagger
 * /api/stock/movimientos/tipos:
 *   get:
 *     summary: Obtener tipos de movimiento y orígenes disponibles
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tipos y orígenes de movimiento
 */
router.get('/movimientos/tipos', stockController.getTiposMovimiento.bind(stockController));

/**
 * @swagger
 * /api/stock/movimientos/{id}:
 *   get:
 *     summary: Obtener detalle de un movimiento
 *     tags: [Stock]
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
 *         description: Detalle del movimiento
 *       404:
 *         description: Movimiento no encontrado
 */
router.get('/movimientos/:id', stockController.getMovimiento.bind(stockController));

/**
 * @swagger
 * /api/stock/movimientos/{id}/anular:
 *   post:
 *     summary: Anular un movimiento de stock
 *     tags: [Stock]
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
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimiento anulado
 */
router.post('/movimientos/:id/anular', stockController.anularMovimiento.bind(stockController));

/**
 * @swagger
 * /api/stock/ajuste:
 *   post:
 *     summary: Crear ajuste manual de stock
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *               - almacenId
 *               - tipo
 *               - cantidad
 *               - motivo
 *             properties:
 *               productoId:
 *                 type: string
 *               almacenId:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [entrada, salida, merma]
 *               cantidad:
 *                 type: number
 *               motivo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ajuste creado
 */
router.post('/ajuste', stockController.crearAjuste.bind(stockController));

/**
 * @swagger
 * /api/stock/actual:
 *   get:
 *     summary: Obtener vista de stock actual de todos los productos
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: almacenId
 *         schema:
 *           type: string
 *         description: Filtrar por almacén
 *       - in: query
 *         name: familiaId
 *         schema:
 *           type: string
 *         description: Filtrar por familia
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre/código
 *       - in: query
 *         name: stockBajo
 *         schema:
 *           type: string
 *         description: Solo productos con stock bajo mínimo
 *       - in: query
 *         name: sinStock
 *         schema:
 *           type: string
 *         description: Solo productos sin stock
 *     responses:
 *       200:
 *         description: Vista de stock
 */
router.get('/actual', stockController.getStockActual.bind(stockController));

/**
 * @swagger
 * /api/stock/valoracion:
 *   get:
 *     summary: Obtener valoración de inventario
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: almacenId
 *         schema:
 *           type: string
 *         description: Filtrar por almacén
 *     responses:
 *       200:
 *         description: Valoración del inventario
 */
router.get('/valoracion', stockController.getValoracion.bind(stockController));

/**
 * @swagger
 * /api/stock/producto/{productoId}:
 *   get:
 *     summary: Obtener resumen de stock de un producto
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: varianteId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resumen de stock del producto
 */
router.get('/producto/:productoId', stockController.getResumenStock.bind(stockController));

/**
 * @swagger
 * /api/stock/producto/{productoId}/historial:
 *   get:
 *     summary: Obtener historial de movimientos de un producto
 *     tags: [Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: almacenId
 *         schema:
 *           type: string
 *       - in: query
 *         name: varianteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de movimientos
 */
router.get('/producto/:productoId/historial', stockController.getHistorialProducto.bind(stockController));

export default router;
