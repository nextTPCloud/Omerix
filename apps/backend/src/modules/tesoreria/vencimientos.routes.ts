import { Router } from 'express';
import { vencimientosController } from './vencimientos.controller';
import { authMiddleware, requireModuleAccess } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// Aplicar middleware de autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de tesorería
router.use(requireModuleAccess('accesoTesoreria'));

/**
 * @swagger
 * tags:
 *   name: Vencimientos
 *   description: Gestión de vencimientos de tesorería (cobros y pagos)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Vencimiento:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [cobro, pago]
 *           description: Tipo de vencimiento
 *         tipoDocumentoOrigen:
 *           type: string
 *           enum: [factura, pedido, albaran, recibo, otro]
 *         documentoOrigenId:
 *           type: string
 *         numeroDocumento:
 *           type: string
 *         clienteId:
 *           type: string
 *         proveedorId:
 *           type: string
 *         fechaEmision:
 *           type: string
 *           format: date
 *         fechaVencimiento:
 *           type: string
 *           format: date
 *         importe:
 *           type: number
 *         importeCobrado:
 *           type: number
 *         importePendiente:
 *           type: number
 *         estado:
 *           type: string
 *           enum: [pendiente, parcial, cobrado, pagado, impagado, anulado]
 *         formaPagoId:
 *           type: string
 *         cuentaBancariaId:
 *           type: string
 *         remesaId:
 *           type: string
 *         cobrosParciales:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               importe:
 *                 type: number
 *               formaPago:
 *                 type: string
 *               observaciones:
 *                 type: string
 *         observaciones:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ResumenTesoreria:
 *       type: object
 *       properties:
 *         totalPendiente:
 *           type: number
 *         totalVencido:
 *           type: number
 *         totalProximoVencer:
 *           type: number
 *         porEstado:
 *           type: object
 *         porFormaPago:
 *           type: object
 */

// Aplicar middleware de autenticación y empresa a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// RUTAS DE VENCIMIENTOS
// ============================================

/**
 * @swagger
 * /vencimientos:
 *   get:
 *     summary: Obtener todos los vencimientos con filtros y paginación
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [cobro, pago]
 *         description: Filtrar por tipo de vencimiento
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, parcial, cobrado, pagado, impagado, anulado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente
 *       - in: query
 *         name: proveedorId
 *         schema:
 *           type: string
 *         description: Filtrar por proveedor
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de vencimiento desde
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de vencimiento hasta
 *       - in: query
 *         name: vencidos
 *         schema:
 *           type: boolean
 *         description: Solo vencimientos vencidos
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por número de documento
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: fechaVencimiento
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Lista de vencimientos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vencimiento'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: No autenticado
 */
router.get('/', (req, res, next) => vencimientosController.findAll(req, res, next));

/**
 * @swagger
 * /vencimientos/resumen:
 *   get:
 *     summary: Obtener resumen de tesorería
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [cobro, pago]
 *         description: Filtrar resumen por tipo
 *     responses:
 *       200:
 *         description: Resumen de tesorería obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ResumenTesoreria'
 *       401:
 *         description: No autenticado
 */
router.get('/resumen', (req, res, next) => vencimientosController.getResumen(req, res, next));

/**
 * @swagger
 * /vencimientos/cliente/{clienteId}:
 *   get:
 *     summary: Obtener vencimientos de un cliente
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Vencimientos del cliente obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vencimiento'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/cliente/:clienteId', (req, res, next) => vencimientosController.getByCliente(req, res, next));

/**
 * @swagger
 * /vencimientos/proveedor/{proveedorId}:
 *   get:
 *     summary: Obtener vencimientos de un proveedor
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: proveedorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proveedor
 *     responses:
 *       200:
 *         description: Vencimientos del proveedor obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vencimiento'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Proveedor no encontrado
 */
router.get('/proveedor/:proveedorId', (req, res, next) => vencimientosController.getByProveedor(req, res, next));

/**
 * @swagger
 * /vencimientos/{id}:
 *   get:
 *     summary: Obtener un vencimiento por ID
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vencimiento
 *     responses:
 *       200:
 *         description: Vencimiento obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vencimiento'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vencimiento no encontrado
 */
router.get('/:id', (req, res, next) => vencimientosController.findOne(req, res, next));

/**
 * @swagger
 * /vencimientos:
 *   post:
 *     summary: Crear un nuevo vencimiento
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - fechaVencimiento
 *               - importe
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [cobro, pago]
 *                 description: Tipo de vencimiento
 *               tipoDocumentoOrigen:
 *                 type: string
 *                 enum: [factura, pedido, albaran, recibo, otro]
 *               documentoOrigenId:
 *                 type: string
 *               numeroDocumento:
 *                 type: string
 *               clienteId:
 *                 type: string
 *                 description: ID del cliente (requerido para cobros)
 *               proveedorId:
 *                 type: string
 *                 description: ID del proveedor (requerido para pagos)
 *               fechaEmision:
 *                 type: string
 *                 format: date
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *               importe:
 *                 type: number
 *               formaPagoId:
 *                 type: string
 *               cuentaBancariaId:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vencimiento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vencimiento'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.post('/', (req, res, next) => vencimientosController.create(req, res, next));

/**
 * @swagger
 * /vencimientos/remesa:
 *   post:
 *     summary: Crear una remesa de vencimientos
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vencimientoIds
 *               - fechaPresentacion
 *             properties:
 *               vencimientoIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de IDs de vencimientos a incluir en la remesa
 *               fechaPresentacion:
 *                 type: string
 *                 format: date
 *                 description: Fecha de presentación de la remesa
 *               cuentaBancariaId:
 *                 type: string
 *                 description: Cuenta bancaria para la remesa
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Remesa creada exitosamente
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
 *                     remesaId:
 *                       type: string
 *                     vencimientosActualizados:
 *                       type: integer
 *                     totalImporte:
 *                       type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o vencimientos no válidos para remesa
 *       401:
 *         description: No autenticado
 */
router.post('/remesa', (req, res, next) => vencimientosController.crearRemesa(req, res, next));

/**
 * @swagger
 * /vencimientos/{id}:
 *   put:
 *     summary: Actualizar un vencimiento
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vencimiento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fechaVencimiento:
 *                 type: string
 *                 format: date
 *               importe:
 *                 type: number
 *               formaPagoId:
 *                 type: string
 *               cuentaBancariaId:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vencimiento actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vencimiento'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o vencimiento no modificable
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vencimiento no encontrado
 */
router.put('/:id', (req, res, next) => vencimientosController.update(req, res, next));

/**
 * @swagger
 * /vencimientos/{id}/cobro:
 *   post:
 *     summary: Registrar cobro/pago parcial o total
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vencimiento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - importe
 *               - fecha
 *             properties:
 *               importe:
 *                 type: number
 *                 description: Importe del cobro/pago
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Fecha del cobro/pago
 *               formaPago:
 *                 type: string
 *                 description: Forma de pago utilizada
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cobro/pago registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vencimiento'
 *                 message:
 *                   type: string
 *       400:
 *         description: Importe inválido o vencimiento ya cobrado
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vencimiento no encontrado
 */
router.post('/:id/cobro', (req, res, next) => vencimientosController.registrarCobro(req, res, next));

/**
 * @swagger
 * /vencimientos/{id}/impagado:
 *   post:
 *     summary: Marcar vencimiento como impagado
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vencimiento
 *     responses:
 *       200:
 *         description: Vencimiento marcado como impagado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vencimiento'
 *                 message:
 *                   type: string
 *       400:
 *         description: Vencimiento no puede marcarse como impagado
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vencimiento no encontrado
 */
router.post('/:id/impagado', (req, res, next) => vencimientosController.marcarImpagado(req, res, next));

/**
 * @swagger
 * /vencimientos/{id}/anular:
 *   post:
 *     summary: Anular un vencimiento
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vencimiento
 *     responses:
 *       200:
 *         description: Vencimiento anulado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Vencimiento'
 *                 message:
 *                   type: string
 *       400:
 *         description: Vencimiento no puede anularse (ya cobrado/pagado)
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vencimiento no encontrado
 */
router.post('/:id/anular', (req, res, next) => vencimientosController.anular(req, res, next));

/**
 * @swagger
 * /vencimientos/{id}:
 *   delete:
 *     summary: Eliminar un vencimiento
 *     tags: [Vencimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del vencimiento
 *     responses:
 *       200:
 *         description: Vencimiento eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Vencimiento no puede eliminarse (tiene cobros parciales)
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Vencimiento no encontrado
 */
router.delete('/:id', (req, res, next) => vencimientosController.delete(req, res, next));

export default router;
