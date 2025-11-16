import { Router } from 'express';
import { productosController } from './productos.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión de productos y catálogo
 */

/**
 * @swagger
 * /api/productos/stock-bajo:
 *   get:
 *     summary: Obtener productos con stock bajo
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de productos con stock bajo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: No autorizado
 */
router.get('/stock-bajo', productosController.obtenerStockBajo.bind(productosController));

/**
 * @swagger
 * /api/productos/sku/{sku}:
 *   get:
 *     summary: Obtener producto por SKU
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *         description: SKU del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/sku/:sku', productosController.obtenerPorSku.bind(productosController));

/**
 * @swagger
 * /api/productos/barcode/{codigoBarras}:
 *   get:
 *     summary: Obtener producto por código de barras
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigoBarras
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de barras del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/barcode/:codigoBarras', productosController.obtenerPorCodigoBarras.bind(productosController));

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener listado de productos con paginación
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, SKU o código de barras
 *       - in: query
 *         name: familiaId
 *         schema:
 *           type: string
 *         description: Filtrar por familia
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Listado de productos obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: No autorizado
 */
router.get('/', productosController.obtenerTodos.bind(productosController));

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:id', productosController.obtenerPorId.bind(productosController));

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear nuevo producto
 *     tags: [Productos]
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
 *               - sku
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Portátil Dell XPS 15"
 *               sku:
 *                 type: string
 *                 example: "DELL-XPS-15-001"
 *               descripcion:
 *                 type: string
 *                 example: "Portátil de alto rendimiento"
 *               familiaId:
 *                 type: string
 *                 description: ID de la familia del producto
 *               codigoBarras:
 *                 type: string
 *                 example: "1234567890123"
 *               precio:
 *                 type: object
 *                 properties:
 *                   base:
 *                     type: number
 *                     example: 1000
 *                   venta:
 *                     type: number
 *                     example: 1200
 *               stock:
 *                 type: object
 *                 properties:
 *                   cantidad:
 *                     type: number
 *                     example: 10
 *                   minimo:
 *                     type: number
 *                     example: 5
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Producto creado correctamente"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', productosController.crear.bind(productosController));

/**
 * @swagger
 * /api/productos/{id}/variantes:
 *   post:
 *     summary: Generar variantes de un producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto base
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - atributos
 *             properties:
 *               atributos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       example: "Color"
 *                     valores:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Rojo", "Azul", "Negro"]
 *     responses:
 *       200:
 *         description: Variantes generadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Variantes generadas correctamente"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/:id/variantes', productosController.generarVariantes.bind(productosController));

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar producto existente
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               familiaId:
 *                 type: string
 *               precio:
 *                 type: object
 *               stock:
 *                 type: object
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Producto actualizado correctamente"
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.put('/:id', productosController.actualizar.bind(productosController));

/**
 * @swagger
 * /api/productos/{id}/stock:
 *   put:
 *     summary: Actualizar stock de un producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad:
 *                 type: number
 *                 example: 50
 *               minimo:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Stock actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: "Stock actualizado correctamente"
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.put('/:id/stock', productosController.actualizarStock.bind(productosController));

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', productosController.eliminar.bind(productosController));

export default router;