import { Router } from 'express';
import { familiasController } from './familias.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * tags:
 *   name: Familias
 *   description: Gestión de familias de productos
 */

/**
 * @swagger
 * /api/familias/sugerir-codigo:
 *   get:
 *     summary: Sugerir el siguiente código disponible
 *     tags: [Familias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefijo
 *         schema:
 *           type: string
 *         description: Prefijo del código (ej. FAM-, F-). Si no se proporciona, detecta el patrón más común
 *         example: FAM-
 *     responses:
 *       200:
 *         description: Código sugerido generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     codigo:
 *                       type: string
 *                       example: FAM-001
 *       401:
 *         description: No autenticado
 */
router.get('/sugerir-codigo', familiasController.sugerirSiguienteCodigo.bind(familiasController));

/**
 * @swagger
 * /api/familias/arbol:
 *   get:
 *     summary: Obtener árbol jerárquico de familias
 *     tags: [Familias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Árbol de familias obtenido exitosamente
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
 *       500:
 *         description: Error del servidor
 */
router.get('/arbol', familiasController.obtenerArbol.bind(familiasController));

/**
 * @swagger
 * /api/familias:
 *   get:
 *     summary: Obtener listado de familias con paginación
 *     tags: [Familias]
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
 *         description: Búsqueda por nombre o código
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Listado de familias obtenido exitosamente
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
router.get('/', familiasController.obtenerTodas.bind(familiasController));

/**
 * @swagger
 * /api/familias/{id}:
 *   get:
 *     summary: Obtener familia por ID
 *     tags: [Familias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la familia
 *     responses:
 *       200:
 *         description: Familia encontrada
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
 *         description: Familia no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', familiasController.obtenerPorId.bind(familiasController));

/**
 * @swagger
 * /api/familias/{id}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de una familia
 *     tags: [Familias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la familia
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *         description: Familia no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id/estadisticas', familiasController.obtenerEstadisticas.bind(familiasController));

/**
 * @swagger
 * /api/familias:
 *   post:
 *     summary: Crear nueva familia
 *     tags: [Familias]
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
 *                 example: "Electrónica"
 *               codigo:
 *                 type: string
 *                 example: "ELEC"
 *               descripcion:
 *                 type: string
 *                 example: "Productos de electrónica"
 *               familiaPadreId:
 *                 type: string
 *                 description: ID de la familia padre (opcional)
 *               orden:
 *                 type: number
 *                 example: 1
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Familia creada exitosamente
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
 *                   example: "Familia creada correctamente"
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', familiasController.crear.bind(familiasController));

/**
 * @swagger
 * /api/familias/{id}:
 *   put:
 *     summary: Actualizar familia existente
 *     tags: [Familias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la familia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               familiaPadreId:
 *                 type: string
 *               orden:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Familia actualizada exitosamente
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
 *                   example: "Familia actualizada correctamente"
 *       404:
 *         description: Familia no encontrada
 *       401:
 *         description: No autorizado
 */
router.put('/:id', familiasController.actualizar.bind(familiasController));

/**
 * @swagger
 * /api/familias/{id}:
 *   delete:
 *     summary: Eliminar familia
 *     tags: [Familias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la familia
 *     responses:
 *       200:
 *         description: Familia eliminada exitosamente
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
 *         description: Familia no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', familiasController.eliminar.bind(familiasController));

/**
 * @swagger
 * /api/familias/reordenar:
 *   post:
 *     summary: Reordenar familias
 *     tags: [Familias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     orden:
 *                       type: number
 *     responses:
 *       200:
 *         description: Familias reordenadas exitosamente
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
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/reordenar', familiasController.reordenar.bind(familiasController));

/**
 * @swagger
 * /api/familias/{id}/duplicar:
 *   post:
 *     summary: Duplicar una familia
 *     tags: [Familias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la familia a duplicar
 *     responses:
 *       201:
 *         description: Familia duplicada exitosamente
 *       404:
 *         description: Familia no encontrada
 *       401:
 *         description: No autorizado
 */
router.post('/:id/duplicar', familiasController.duplicar.bind(familiasController));

export default router;