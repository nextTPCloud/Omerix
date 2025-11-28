import { Router } from 'express';
import { variantesController } from './variantes.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Variantes
 *   description: Gestión de variantes de productos (tallas, colores, etc.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ValorVariante:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del valor
 *         nombre:
 *           type: string
 *           description: Nombre del valor
 *           example: Pequeño
 *         codigo:
 *           type: string
 *           description: Código del valor
 *           example: P
 *         orden:
 *           type: number
 *           description: Orden de visualización
 *           example: 1
 *         activo:
 *           type: boolean
 *           description: Si está activo
 *           example: true
 *     Variante:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID de la variante
 *         nombre:
 *           type: string
 *           description: Nombre de la variante
 *           example: Talla
 *         descripcion:
 *           type: string
 *           description: Descripción de la variante
 *         tipo:
 *           type: string
 *           enum: [texto, color, imagen]
 *           description: Tipo de variante
 *           example: texto
 *         valores:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ValorVariante'
 *           description: Lista de valores posibles para la variante
 *         obligatorio:
 *           type: boolean
 *           description: Si es obligatorio seleccionar un valor
 *           example: true
 *         orden:
 *           type: number
 *           description: Orden de visualización
 *           example: 1
 *         activo:
 *           type: boolean
 *           description: Si está activa
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Ruta para buscar códigos (debe ir antes de /:id para evitar conflictos)
router.get('/search-codigos', (req, res) => variantesController.searchCodigos(req, res));

/**
 * @swagger
 * /api/variantes:
 *   get:
 *     summary: Obtener todas las variantes con filtros y paginación
 *     tags: [Variantes]
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
 *           enum: [texto, color, imagen]
 *         description: Filtrar por tipo de variante
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
 *         description: Lista de variantes obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Variante'
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
router.get('/', (req, res) => variantesController.findAll(req, res));

/**
 * @swagger
 * /api/variantes/{id}:
 *   get:
 *     summary: Obtener una variante por ID
 *     tags: [Variantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la variante
 *     responses:
 *       200:
 *         description: Variante encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Variante'
 *       404:
 *         description: Variante no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', (req, res) => variantesController.findOne(req, res));

/**
 * @swagger
 * /api/variantes:
 *   post:
 *     summary: Crear una nueva variante
 *     tags: [Variantes]
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
 *                 example: Talla
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [texto, color, imagen]
 *                 default: texto
 *               valores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                       example: Pequeño
 *                     codigo:
 *                       type: string
 *                       example: P
 *                     orden:
 *                       type: number
 *                     activo:
 *                       type: boolean
 *               obligatorio:
 *                 type: boolean
 *                 default: false
 *               orden:
 *                 type: number
 *                 default: 0
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Variante creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Variante'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', (req, res) => variantesController.create(req, res));

/**
 * @swagger
 * /api/variantes/{id}:
 *   put:
 *     summary: Actualizar una variante
 *     tags: [Variantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la variante
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
 *                 enum: [texto, color, imagen]
 *               valores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     nombre:
 *                       type: string
 *                     codigo:
 *                       type: string
 *                     orden:
 *                       type: number
 *                     activo:
 *                       type: boolean
 *               obligatorio:
 *                 type: boolean
 *               orden:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Variante actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Variante'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Variante no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', (req, res) => variantesController.update(req, res));

/**
 * @swagger
 * /api/variantes/{id}:
 *   delete:
 *     summary: Eliminar una variante
 *     tags: [Variantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la variante
 *     responses:
 *       200:
 *         description: Variante eliminada exitosamente
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
 *                   example: Variante eliminada correctamente
 *       404:
 *         description: Variante no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', (req, res) => variantesController.delete(req, res));

/**
 * @swagger
 * /api/variantes/{id}/valores:
 *   post:
 *     summary: Agregar un valor a una variante
 *     tags: [Variantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la variante
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
 *                 description: Nombre del valor
 *                 example: Grande
 *               codigo:
 *                 type: string
 *                 description: Código del valor
 *                 example: G
 *               orden:
 *                 type: number
 *                 description: Orden de visualización
 *                 default: 0
 *               activo:
 *                 type: boolean
 *                 description: Si está activo
 *                 default: true
 *     responses:
 *       200:
 *         description: Valor agregado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Variante'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Variante no encontrada
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/:id/valores', (req, res) => variantesController.addValor(req, res));

/**
 * @swagger
 * /api/variantes/{id}/valores/{valorId}:
 *   delete:
 *     summary: Eliminar un valor de una variante
 *     tags: [Variantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la variante
 *       - in: path
 *         name: valorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del valor a eliminar
 *     responses:
 *       200:
 *         description: Valor eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Variante'
 *       404:
 *         description: Variante o valor no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id/valores/:valorId', (req, res) => variantesController.removeValor(req, res));

export default router;
