import { Router } from 'express';
import { modificadoresController } from './modificadores.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Modificadores
 *   description: Gestión de modificadores de productos (poco hecho, sin sal, extra queso, etc.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ModificadorProducto:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del modificador
 *         nombre:
 *           type: string
 *           description: Nombre del modificador
 *           example: Poco hecho
 *         descripcion:
 *           type: string
 *           description: Descripción del modificador
 *         tipo:
 *           type: string
 *           enum: [preparacion, ingrediente, porcion, otro]
 *           description: Tipo de modificador
 *           example: preparacion
 *         aplicaA:
 *           type: string
 *           enum: [todos, categorias, productos]
 *           description: A qué productos aplica
 *           example: categorias
 *         productosIds:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de productos específicos (si aplicaA=productos)
 *         familiasIds:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de familias (si aplicaA=categorias)
 *         precioExtra:
 *           type: number
 *           description: Precio adicional
 *           example: 1.50
 *         afectaTiempoPreparacion:
 *           type: boolean
 *           description: Si afecta el tiempo de preparación
 *           example: true
 *         tiempoExtraMinutos:
 *           type: number
 *           description: Minutos extra de preparación
 *           example: 5
 *         requiereStock:
 *           type: boolean
 *           description: Si consume stock de algún producto
 *           example: true
 *         productoInsumoId:
 *           type: string
 *           description: ID del producto que consume como insumo
 *         cantidadInsumo:
 *           type: number
 *           description: Cantidad de insumo que consume
 *           example: 1
 *         orden:
 *           type: number
 *           description: Orden de visualización
 *           example: 1
 *         activo:
 *           type: boolean
 *           description: Si está activo
 *           example: true
 *         grupoId:
 *           type: string
 *           description: ID del grupo de modificadores al que pertenece
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

router.use(authMiddleware);
router.use(tenantMiddleware);

// Ruta para buscar códigos (debe ir antes de /:id para evitar conflictos)
router.get('/search-codigos', (req, res) => modificadoresController.searchCodigos(req, res));

/**
 * @swagger
 * /api/modificadores:
 *   get:
 *     summary: Obtener todos los modificadores con filtros y paginación
 *     tags: [Modificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [preparacion, ingrediente, porcion, otro]
 *         description: Filtrar por tipo de modificador
 *       - in: query
 *         name: grupoId
 *         schema:
 *           type: string
 *         description: Filtrar por grupo de modificadores
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *         description: Filtrar por estado activo (true/false)
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
 *           default: 50
 *         description: Elementos por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: orden
 *         description: Campo por el que ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Orden ascendente o descendente
 *     responses:
 *       200:
 *         description: Lista de modificadores obtenida exitosamente
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
 *                     $ref: '#/components/schemas/ModificadorProducto'
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
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/', (req, res) => modificadoresController.findAll(req, res));

/**
 * @swagger
 * /api/modificadores/producto/{productoId}:
 *   get:
 *     summary: Obtener modificadores aplicables a un producto específico
 *     tags: [Modificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Modificadores aplicables encontrados
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
 *                     $ref: '#/components/schemas/ModificadorProducto'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/producto/:productoId', (req, res) => modificadoresController.findByProducto(req, res));

/**
 * @swagger
 * /api/modificadores/{id}:
 *   get:
 *     summary: Obtener un modificador por ID
 *     tags: [Modificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del modificador
 *     responses:
 *       200:
 *         description: Modificador encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ModificadorProducto'
 *       404:
 *         description: Modificador no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', (req, res) => modificadoresController.findOne(req, res));

/**
 * @swagger
 * /api/modificadores:
 *   post:
 *     summary: Crear un nuevo modificador
 *     tags: [Modificadores]
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
 *                 example: Poco hecho
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [preparacion, ingrediente, porcion, otro]
 *                 default: preparacion
 *               aplicaA:
 *                 type: string
 *                 enum: [todos, categorias, productos]
 *                 default: todos
 *               productosIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               familiasIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               precioExtra:
 *                 type: number
 *                 default: 0
 *               afectaTiempoPreparacion:
 *                 type: boolean
 *                 default: false
 *               tiempoExtraMinutos:
 *                 type: number
 *                 default: 0
 *               requiereStock:
 *                 type: boolean
 *                 default: false
 *               productoInsumoId:
 *                 type: string
 *               cantidadInsumo:
 *                 type: number
 *               orden:
 *                 type: number
 *                 default: 0
 *               activo:
 *                 type: boolean
 *                 default: true
 *               grupoId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Modificador creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ModificadorProducto'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', (req, res) => modificadoresController.create(req, res));

/**
 * @swagger
 * /api/modificadores/{id}:
 *   put:
 *     summary: Actualizar un modificador
 *     tags: [Modificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del modificador
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
 *               tipo:
 *                 type: string
 *                 enum: [preparacion, ingrediente, porcion, otro]
 *               aplicaA:
 *                 type: string
 *                 enum: [todos, categorias, productos]
 *               productosIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               familiasIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               precioExtra:
 *                 type: number
 *               afectaTiempoPreparacion:
 *                 type: boolean
 *               tiempoExtraMinutos:
 *                 type: number
 *               requiereStock:
 *                 type: boolean
 *               productoInsumoId:
 *                 type: string
 *               cantidadInsumo:
 *                 type: number
 *               orden:
 *                 type: number
 *               activo:
 *                 type: boolean
 *               grupoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Modificador actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ModificadorProducto'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Modificador no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', (req, res) => modificadoresController.update(req, res));

/**
 * @swagger
 * /api/modificadores/{id}:
 *   delete:
 *     summary: Eliminar un modificador
 *     tags: [Modificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del modificador
 *     responses:
 *       200:
 *         description: Modificador eliminado exitosamente
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
 *                   example: Modificador eliminado correctamente
 *       404:
 *         description: Modificador no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', (req, res) => modificadoresController.delete(req, res));

export default router;
