import { Router } from 'express';
import { tiposGastoController } from './tipos-gasto.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TiposGasto
 *   description: Gestion de tipos de gasto para partes de trabajo
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TipoGasto:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         codigo:
 *           type: string
 *           example: MATER
 *         nombre:
 *           type: string
 *           example: Material de obra
 *         descripcion:
 *           type: string
 *         categoria:
 *           type: string
 *           enum: [material, transporte, dietas, alojamiento, herramientas, subcontratacion, otros]
 *         cuenta:
 *           type: string
 *           description: Codigo contable
 *         ivaPorDefecto:
 *           type: number
 *           default: 21
 *         facturable:
 *           type: boolean
 *           default: true
 *         margenPorDefecto:
 *           type: number
 *           default: 0
 *         orden:
 *           type: number
 *         activo:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Aplicar middleware de autenticacion y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/tipos-gasto:
 *   get:
 *     summary: Obtener todos los tipos de gasto
 *     tags: [TiposGasto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Busqueda por codigo, nombre o descripcion
 *       - in: query
 *         name: activo
 *         schema:
 *           type: string
 *         description: Filtrar por estado activo (true/false)
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: facturable
 *         schema:
 *           type: string
 *         description: Filtrar por facturable (true/false)
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: orden
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Lista de tipos de gasto obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', tiposGastoController.getAll.bind(tiposGastoController));

/**
 * @swagger
 * /api/tipos-gasto/activos:
 *   get:
 *     summary: Obtener todos los tipos de gasto activos
 *     tags: [TiposGasto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tipos de gasto activos
 *       401:
 *         description: No autorizado
 */
router.get('/activos', tiposGastoController.getActivos.bind(tiposGastoController));

/**
 * @swagger
 * /api/tipos-gasto/bulk/delete:
 *   post:
 *     summary: Eliminar multiples tipos de gasto
 *     tags: [TiposGasto]
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
 *         description: Tipos de gasto eliminados exitosamente
 *       401:
 *         description: No autorizado
 */
router.post('/bulk/delete', tiposGastoController.deleteMany.bind(tiposGastoController));

/**
 * @swagger
 * /api/tipos-gasto/{id}:
 *   get:
 *     summary: Obtener un tipo de gasto por ID
 *     tags: [TiposGasto]
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
 *         description: Tipo de gasto encontrado
 *       404:
 *         description: Tipo de gasto no encontrado
 *       401:
 *         description: No autorizado
 */
router.get('/:id', tiposGastoController.getOne.bind(tiposGastoController));

/**
 * @swagger
 * /api/tipos-gasto:
 *   post:
 *     summary: Crear un nuevo tipo de gasto
 *     tags: [TiposGasto]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               categoria:
 *                 type: string
 *                 enum: [material, transporte, dietas, alojamiento, herramientas, subcontratacion, otros]
 *               cuenta:
 *                 type: string
 *               ivaPorDefecto:
 *                 type: number
 *               facturable:
 *                 type: boolean
 *               margenPorDefecto:
 *                 type: number
 *               orden:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tipo de gasto creado exitosamente
 *       400:
 *         description: Datos invalidos
 *       401:
 *         description: No autorizado
 */
router.post('/', tiposGastoController.create.bind(tiposGastoController));

/**
 * @swagger
 * /api/tipos-gasto/{id}:
 *   put:
 *     summary: Actualizar un tipo de gasto
 *     tags: [TiposGasto]
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
 *         description: Tipo de gasto actualizado exitosamente
 *       404:
 *         description: Tipo de gasto no encontrado
 *       401:
 *         description: No autorizado
 */
router.put('/:id', tiposGastoController.update.bind(tiposGastoController));

/**
 * @swagger
 * /api/tipos-gasto/{id}:
 *   delete:
 *     summary: Eliminar un tipo de gasto
 *     tags: [TiposGasto]
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
 *         description: Tipo de gasto eliminado exitosamente
 *       404:
 *         description: Tipo de gasto no encontrado
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', tiposGastoController.delete.bind(tiposGastoController));

/**
 * @swagger
 * /api/tipos-gasto/{id}/duplicar:
 *   post:
 *     summary: Duplicar un tipo de gasto
 *     tags: [TiposGasto]
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
 *         description: Tipo de gasto duplicado exitosamente
 *       404:
 *         description: Tipo de gasto no encontrado
 *       401:
 *         description: No autorizado
 */
router.post('/:id/duplicar', tiposGastoController.duplicar.bind(tiposGastoController));

export default router;
