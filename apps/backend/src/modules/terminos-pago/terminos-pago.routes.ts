import { Router } from 'express';
import { terminosPagoController } from './terminos-pago.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TerminosPago
 *   description: Gestión de términos de pago
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Vencimiento:
 *       type: object
 *       required:
 *         - dias
 *         - porcentaje
 *       properties:
 *         dias:
 *           type: number
 *           description: Días desde la fecha de factura
 *           example: 30
 *         porcentaje:
 *           type: number
 *           description: Porcentaje del total a pagar
 *           example: 50
 *     TerminoPago:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del término de pago
 *         codigo:
 *           type: string
 *           description: Código único del término
 *           example: 30-60
 *         nombre:
 *           type: string
 *           description: Nombre del término de pago
 *           example: 50% a 30 días, 50% a 60 días
 *         descripcion:
 *           type: string
 *           description: Descripción adicional
 *         vencimientos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Vencimiento'
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

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/terminos-pago:
 *   get:
 *     summary: Obtener todos los términos de pago con filtros y paginación
 *     tags: [TerminosPago]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por código, nombre o descripción
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
 *           default: nombre
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
 *         description: Lista de términos de pago obtenida exitosamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/', terminosPagoController.getAll.bind(terminosPagoController));

/**
 * @swagger
 * /api/terminos-pago/activos:
 *   get:
 *     summary: Obtener todos los términos de pago activos
 *     tags: [TerminosPago]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de términos de pago activos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/activos', terminosPagoController.getActivos.bind(terminosPagoController));

/**
 * @swagger
 * /api/terminos-pago/codigos:
 *   get:
 *     summary: Buscar códigos existentes por prefijo
 *     tags: [TerminosPago]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Prefijo del código a buscar
 *     responses:
 *       200:
 *         description: Lista de códigos que coinciden con el prefijo
 *       401:
 *         description: No autorizado
 */
router.get('/codigos', terminosPagoController.searchCodigos.bind(terminosPagoController));

/**
 * @swagger
 * /api/terminos-pago/{id}:
 *   get:
 *     summary: Obtener un término de pago por ID
 *     tags: [TerminosPago]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del término de pago
 *     responses:
 *       200:
 *         description: Término de pago encontrado
 *       404:
 *         description: Término de pago no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', terminosPagoController.getOne.bind(terminosPagoController));

/**
 * @swagger
 * /api/terminos-pago:
 *   post:
 *     summary: Crear un nuevo término de pago
 *     tags: [TerminosPago]
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
 *               - vencimientos
 *             properties:
 *               codigo:
 *                 type: string
 *                 example: 30-60
 *               nombre:
 *                 type: string
 *                 example: 50% a 30 días, 50% a 60 días
 *               descripcion:
 *                 type: string
 *               vencimientos:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Vencimiento'
 *               activo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Término de pago creado exitosamente
 *       400:
 *         description: Datos inválidos o código duplicado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', terminosPagoController.create.bind(terminosPagoController));

/**
 * @swagger
 * /api/terminos-pago/{id}:
 *   put:
 *     summary: Actualizar un término de pago
 *     tags: [TerminosPago]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del término de pago
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               vencimientos:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Vencimiento'
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Término de pago actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Término de pago no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', terminosPagoController.update.bind(terminosPagoController));

/**
 * @swagger
 * /api/terminos-pago/{id}:
 *   delete:
 *     summary: Eliminar un término de pago
 *     tags: [TerminosPago]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del término de pago
 *     responses:
 *       200:
 *         description: Término de pago eliminado exitosamente
 *       404:
 *         description: Término de pago no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', terminosPagoController.delete.bind(terminosPagoController));

/**
 * @swagger
 * /api/terminos-pago/{id}/duplicar:
 *   post:
 *     summary: Duplicar un término de pago
 *     tags: [TerminosPago]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del término de pago a duplicar
 *     responses:
 *       201:
 *         description: Término de pago duplicado exitosamente
 *       404:
 *         description: Término de pago no encontrado
 *       401:
 *         description: No autenticado
 */
router.post('/:id/duplicar', terminosPagoController.duplicar.bind(terminosPagoController));

export default router;
