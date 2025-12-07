import { Router } from 'express';
import { formasPagoController } from './formas-pago.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: FormasPago
 *   description: Gestión de formas de pago
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ConfiguracionPasarela:
 *       type: object
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [stripe, redsys, paypal, transferencia, efectivo, otro]
 *         stripePublicKey:
 *           type: string
 *         stripeSecretKey:
 *           type: string
 *         redsysMerchantCode:
 *           type: string
 *         redsysTerminal:
 *           type: string
 *         redsysSecretKey:
 *           type: string
 *         redsysEnvironment:
 *           type: string
 *           enum: [test, production]
 *         paypalClientId:
 *           type: string
 *         paypalClientSecret:
 *           type: string
 *         paypalEnvironment:
 *           type: string
 *           enum: [sandbox, production]
 *         webhookUrl:
 *           type: string
 *         habilitado:
 *           type: boolean
 *     FormaPago:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         codigo:
 *           type: string
 *           example: EFEC
 *         nombre:
 *           type: string
 *           example: Efectivo
 *         descripcion:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [efectivo, tarjeta, transferencia, domiciliacion, cheque, pagare, otro]
 *         icono:
 *           type: string
 *         color:
 *           type: string
 *         requiereDatosBancarios:
 *           type: boolean
 *         configuracionPasarela:
 *           $ref: '#/components/schemas/ConfiguracionPasarela'
 *         comision:
 *           type: number
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

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/formas-pago:
 *   get:
 *     summary: Obtener todas las formas de pago
 *     tags: [FormasPago]
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
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
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
 *         description: Lista de formas de pago obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', formasPagoController.getAll.bind(formasPagoController));

/**
 * @swagger
 * /api/formas-pago/activas:
 *   get:
 *     summary: Obtener todas las formas de pago activas
 *     tags: [FormasPago]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de formas de pago activas
 *       401:
 *         description: No autorizado
 */
router.get('/activas', formasPagoController.getActivas.bind(formasPagoController));

/**
 * @swagger
 * /api/formas-pago/codigos:
 *   get:
 *     summary: Buscar códigos existentes por prefijo
 *     tags: [FormasPago]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de códigos
 *       401:
 *         description: No autorizado
 */
router.get('/codigos', formasPagoController.searchCodigos.bind(formasPagoController));

/**
 * @swagger
 * /api/formas-pago/{id}:
 *   get:
 *     summary: Obtener una forma de pago por ID
 *     tags: [FormasPago]
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
 *         description: Forma de pago encontrada
 *       404:
 *         description: Forma de pago no encontrada
 *       401:
 *         description: No autorizado
 */
router.get('/:id', formasPagoController.getOne.bind(formasPagoController));

/**
 * @swagger
 * /api/formas-pago:
 *   post:
 *     summary: Crear una nueva forma de pago
 *     tags: [FormasPago]
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
 *               - tipo
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [efectivo, tarjeta, transferencia, domiciliacion, cheque, pagare, otro]
 *               icono:
 *                 type: string
 *               color:
 *                 type: string
 *               requiereDatosBancarios:
 *                 type: boolean
 *               configuracionPasarela:
 *                 $ref: '#/components/schemas/ConfiguracionPasarela'
 *               comision:
 *                 type: number
 *               orden:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Forma de pago creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', formasPagoController.create.bind(formasPagoController));

/**
 * @swagger
 * /api/formas-pago/{id}:
 *   put:
 *     summary: Actualizar una forma de pago
 *     tags: [FormasPago]
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
 *         description: Forma de pago actualizada exitosamente
 *       404:
 *         description: Forma de pago no encontrada
 *       401:
 *         description: No autorizado
 */
router.put('/:id', formasPagoController.update.bind(formasPagoController));

/**
 * @swagger
 * /api/formas-pago/{id}:
 *   delete:
 *     summary: Eliminar una forma de pago
 *     tags: [FormasPago]
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
 *         description: Forma de pago eliminada exitosamente
 *       404:
 *         description: Forma de pago no encontrada
 *       401:
 *         description: No autorizado
 */
router.delete('/:id', formasPagoController.delete.bind(formasPagoController));

/**
 * @swagger
 * /api/formas-pago/{id}/duplicar:
 *   post:
 *     summary: Duplicar una forma de pago
 *     tags: [FormasPago]
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
 *         description: Forma de pago duplicada exitosamente
 *       404:
 *         description: Forma de pago no encontrada
 *       401:
 *         description: No autorizado
 */
router.post('/:id/duplicar', formasPagoController.duplicar.bind(formasPagoController));

export default router;
