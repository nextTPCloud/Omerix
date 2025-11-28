import { Router } from 'express';
import { gruposModificadoresController } from './grupos-modificadores.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: GruposModificadores
 *   description: Gestión de grupos de modificadores (punto cocción, extras, sin ingredientes, etc.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GrupoModificadores:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del grupo
 *         nombre:
 *           type: string
 *           description: Nombre del grupo
 *           example: Punto de cocción
 *         descripcion:
 *           type: string
 *           description: Descripción del grupo
 *         tipo:
 *           type: string
 *           enum: [exclusivo, multiple]
 *           description: Tipo de selección (exclusivo=una opción, multiple=varias)
 *           example: exclusivo
 *         minSelecciones:
 *           type: number
 *           description: Mínimo de selecciones requeridas
 *           example: 1
 *         maxSelecciones:
 *           type: number
 *           description: Máximo de selecciones permitidas (solo para tipo multiple)
 *           example: 3
 *         modificadores:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ModificadorProducto'
 *           description: Lista de modificadores del grupo (solo cuando se solicita con populate)
 *         orden:
 *           type: number
 *           description: Orden de visualización
 *           example: 1
 *         activo:
 *           type: boolean
 *           description: Si está activo
 *           example: true
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
router.get('/search-codigos', (req, res) => gruposModificadoresController.searchCodigos(req, res));

/**
 * @swagger
 * /api/grupos-modificadores:
 *   get:
 *     summary: Obtener todos los grupos de modificadores con filtros y paginación
 *     tags: [GruposModificadores]
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
 *           enum: [exclusivo, multiple]
 *         description: Filtrar por tipo de grupo
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *         description: Filtrar por estado activo (true/false)
 *       - in: query
 *         name: includeModificadores
 *         schema:
 *           type: string
 *         description: Incluir modificadores del grupo (true/false)
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
 *         description: Lista de grupos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/GrupoModificadores'
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
router.get('/', (req, res) => gruposModificadoresController.findAll(req, res));

/**
 * @swagger
 * /api/grupos-modificadores/{id}:
 *   get:
 *     summary: Obtener un grupo de modificadores por ID
 *     tags: [GruposModificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grupo
 *     responses:
 *       200:
 *         description: Grupo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GrupoModificadores'
 *       404:
 *         description: Grupo no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', (req, res) => gruposModificadoresController.findOne(req, res));

/**
 * @swagger
 * /api/grupos-modificadores/{id}/modificadores:
 *   get:
 *     summary: Obtener un grupo con todos sus modificadores
 *     tags: [GruposModificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grupo
 *     responses:
 *       200:
 *         description: Grupo con modificadores encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GrupoModificadores'
 *       404:
 *         description: Grupo no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id/modificadores', (req, res) => gruposModificadoresController.findOneWithModificadores(req, res));

/**
 * @swagger
 * /api/grupos-modificadores:
 *   post:
 *     summary: Crear un nuevo grupo de modificadores
 *     tags: [GruposModificadores]
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
 *                 example: Punto de cocción
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [exclusivo, multiple]
 *                 default: exclusivo
 *               minSelecciones:
 *                 type: number
 *                 default: 0
 *               maxSelecciones:
 *                 type: number
 *               orden:
 *                 type: number
 *                 default: 0
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Grupo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GrupoModificadores'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', (req, res) => gruposModificadoresController.create(req, res));

/**
 * @swagger
 * /api/grupos-modificadores/{id}:
 *   put:
 *     summary: Actualizar un grupo de modificadores
 *     tags: [GruposModificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grupo
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
 *                 enum: [exclusivo, multiple]
 *               minSelecciones:
 *                 type: number
 *               maxSelecciones:
 *                 type: number
 *               orden:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Grupo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GrupoModificadores'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Grupo no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', (req, res) => gruposModificadoresController.update(req, res));

/**
 * @swagger
 * /api/grupos-modificadores/{id}:
 *   delete:
 *     summary: Eliminar un grupo de modificadores
 *     tags: [GruposModificadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grupo
 *     responses:
 *       200:
 *         description: Grupo eliminado exitosamente
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
 *                   example: Grupo eliminado correctamente
 *       404:
 *         description: Grupo no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', (req, res) => gruposModificadoresController.delete(req, res));

export default router;
