import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import {
  createProducto,
  getProducto,
  getProductoBySku,
  getProductoByCodigoBarras,
  searchProductos,
  updateProducto,
  deleteProducto,
  deleteProductoPermanente,
  updateStock,
  getEstadisticas,
  getCategorias,
  getSubcategorias,
  getMarcas,
  getTags,
  getProductosStockBajo,
} from './productos.controller';

const router = Router();

// Todas las rutas requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS CRUD
// ============================================

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
 *               - precios
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laptop Dell XPS 15
 *               descripcion:
 *                 type: string
 *                 example: Laptop de alta gama con pantalla 4K
 *               sku:
 *                 type: string
 *                 example: LAP-DELL-XPS15
 *               codigoBarras:
 *                 type: string
 *                 example: "7501234567890"
 *               referencia:
 *                 type: string
 *                 example: DELL-XPS15-2024
 *               categoria:
 *                 type: string
 *                 example: Electrónica
 *               subcategoria:
 *                 type: string
 *                 example: Laptops
 *               marca:
 *                 type: string
 *                 example: Dell
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [premium, gaming, 4k]
 *               precios:
 *                 type: object
 *                 required:
 *                   - venta
 *                 properties:
 *                   compra:
 *                     type: number
 *                     example: 1200
 *                   venta:
 *                     type: number
 *                     example: 1800
 *                   pvp:
 *                     type: number
 *                     example: 1999
 *               stock:
 *                 type: object
 *                 properties:
 *                   cantidad:
 *                     type: number
 *                     example: 10
 *                   minimo:
 *                     type: number
 *                     example: 2
 *                   maximo:
 *                     type: number
 *                     example: 50
 *                   ubicacion:
 *                     type: string
 *                     example: Almacén A - Estante 3
 *               gestionaStock:
 *                 type: boolean
 *                 default: true
 *               iva:
 *                 type: number
 *                 default: 21
 *               tipoImpuesto:
 *                 type: string
 *                 enum: [iva, igic, exento]
 *                 default: iva
 *               activo:
 *                 type: boolean
 *                 default: true
 *               disponible:
 *                 type: boolean
 *                 default: true
 *               destacado:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Límite de productos alcanzado
 */
router.post('/', createProducto);

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Listar y buscar productos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda de texto (nombre, SKU, código de barras)
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *       - in: query
 *         name: subcategoria
 *         schema:
 *           type: string
 *       - in: query
 *         name: marca
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Tags separados por comas
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: disponible
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: destacado
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sinStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: stockBajo
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: precioMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: precioMax
 *         schema:
 *           type: number
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
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Lista de productos con paginación
 */
router.get('/', searchProductos);

/**
 * @swagger
 * /api/productos/alertas/stock-bajo:
 *   get:
 *     summary: Obtener productos con stock bajo
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos con stock bajo
 */
router.get('/alertas/stock-bajo', getProductosStockBajo);


/**
 * @swagger
 * /api/productos/estadisticas/resumen:
 *   get:
 *     summary: Obtener estadísticas de productos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales
 */
router.get('/estadisticas/resumen', getEstadisticas);

/**
 * @swagger
 * /api/productos/meta/categorias:
 *   get:
 *     summary: Obtener lista de categorías únicas
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/meta/categorias', getCategorias);

/**
 * @swagger
 * /api/productos/meta/subcategorias:
 *   get:
 *     summary: Obtener lista de subcategorías únicas
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *     responses:
 *       200:
 *         description: Lista de subcategorías
 */
router.get('/meta/subcategorias', getSubcategorias);

/**
 * @swagger
 * /api/productos/meta/marcas:
 *   get:
 *     summary: Obtener lista de marcas únicas
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de marcas
 */
router.get('/meta/marcas', getMarcas);

/**
 * @swagger
 * /api/productos/meta/tags:
 *   get:
 *     summary: Obtener lista de tags únicos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tags
 */
router.get('/meta/tags', getTags);

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
 *     responses:
 *       200:
 *         description: Datos del producto
 *       404:
 *         description: Producto no encontrado
 */
router.get('/sku/:sku', getProductoBySku);

/**
 * @swagger
 * /api/productos/barcode/{codigo}:
 *   get:
 *     summary: Obtener producto por código de barras
 *     tags: [Productos]
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
 *         description: Datos del producto
 *       404:
 *         description: Producto no encontrado
 */
router.get('/barcode/:codigo', getProductoByCodigoBarras);

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
 *     responses:
 *       200:
 *         description: Datos del producto
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', getProducto);

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Productos]
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
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precios:
 *                 type: object
 *               stock:
 *                 type: object
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id', updateProducto);

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Desactivar producto (soft delete)
 *     tags: [Productos]
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
 *         description: Producto desactivado
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id', deleteProducto);

/**
 * @swagger
 * /api/productos/{id}/permanente:
 *   delete:
 *     summary: Eliminar producto permanentemente
 *     tags: [Productos]
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
 *         description: Producto eliminado permanentemente
 *       404:
 *         description: Producto no encontrado
 */
router.delete('/:id/permanente', deleteProductoPermanente);

// ============================================
// RUTAS DE STOCK
// ============================================

/**
 * @swagger
 * /api/productos/{id}/stock:
 *   put:
 *     summary: Actualizar stock de producto
 *     tags: [Productos]
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
 *               - cantidad
 *               - tipo
 *             properties:
 *               cantidad:
 *                 type: number
 *                 example: 10
 *               tipo:
 *                 type: string
 *                 enum: [entrada, salida, ajuste]
 *                 example: entrada
 *               motivo:
 *                 type: string
 *                 example: Compra a proveedor
 *     responses:
 *       200:
 *         description: Stock actualizado
 */
router.put('/:id/stock', updateStock);



// ============================================
// RUTAS DE INFORMACIÓN
// ============================================




export default router;