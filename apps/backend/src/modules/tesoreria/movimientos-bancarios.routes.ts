import { Router } from 'express';
import { movimientosBancariosController } from './movimientos-bancarios.controller';
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
 *   name: MovimientosBancarios
 *   description: Gestión de movimientos bancarios (entradas y salidas de tesorería)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MovimientoBancario:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         numero:
 *           type: string
 *           description: Número único del movimiento (MOV-YYYY-NNNNN)
 *         tipo:
 *           type: string
 *           enum: [entrada, salida]
 *         origen:
 *           type: string
 *           enum: [tpv, factura_venta, factura_compra, vencimiento, pagare, recibo, transferencia, manual, apertura_caja, cierre_caja, devolucion]
 *         metodo:
 *           type: string
 *           enum: [efectivo, tarjeta, transferencia, bizum, domiciliacion, cheque, pagare, otro]
 *         estado:
 *           type: string
 *           enum: [pendiente, confirmado, conciliado, anulado]
 *         importe:
 *           type: number
 *         fecha:
 *           type: string
 *           format: date
 *         concepto:
 *           type: string
 *         terceroNombre:
 *           type: string
 *         conciliado:
 *           type: boolean
 */

// ============================================
// RUTAS DE MOVIMIENTOS BANCARIOS
// ============================================

/**
 * @swagger
 * /movimientos-bancarios:
 *   get:
 *     summary: Listar movimientos con filtros y paginación
 *     tags: [MovimientosBancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [entrada, salida]
 *       - in: query
 *         name: origen
 *         schema:
 *           type: string
 *         description: Origen del movimiento (puede ser múltiples separados por coma)
 *       - in: query
 *         name: metodo
 *         schema:
 *           type: string
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: conciliado
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de movimientos obtenida exitosamente
 */
router.get('/', (req, res, next) => movimientosBancariosController.listar(req, res, next));

/**
 * @swagger
 * /movimientos-bancarios/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de movimientos
 *     tags: [MovimientosBancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/estadisticas', (req, res, next) => movimientosBancariosController.estadisticas(req, res, next));

/**
 * @swagger
 * /movimientos-bancarios/tpv/{tpvId}:
 *   get:
 *     summary: Obtener movimientos de un TPV específico
 *     tags: [MovimientosBancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tpvId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fechaDesde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaHasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Movimientos del TPV obtenidos exitosamente
 */
router.get('/tpv/:tpvId', (req, res, next) => movimientosBancariosController.listarPorTPV(req, res, next));

/**
 * @swagger
 * /movimientos-bancarios/{id}:
 *   get:
 *     summary: Obtener un movimiento por ID
 *     tags: [MovimientosBancarios]
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
 *         description: Movimiento obtenido exitosamente
 *       404:
 *         description: Movimiento no encontrado
 */
router.get('/:id', (req, res, next) => movimientosBancariosController.obtenerPorId(req, res, next));

/**
 * @swagger
 * /movimientos-bancarios:
 *   post:
 *     summary: Crear un nuevo movimiento manual
 *     tags: [MovimientosBancarios]
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
 *               - origen
 *               - metodo
 *               - importe
 *               - concepto
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [entrada, salida]
 *               origen:
 *                 type: string
 *               metodo:
 *                 type: string
 *               importe:
 *                 type: number
 *               concepto:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date
 *               terceroNombre:
 *                 type: string
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movimiento creado exitosamente
 */
router.post('/', (req, res, next) => movimientosBancariosController.crear(req, res, next));

/**
 * @swagger
 * /movimientos-bancarios/{id}/anular:
 *   post:
 *     summary: Anular un movimiento
 *     tags: [MovimientosBancarios]
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
 *               - motivo
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movimiento anulado exitosamente
 *       404:
 *         description: Movimiento no encontrado
 */
router.post('/:id/anular', (req, res, next) => movimientosBancariosController.anular(req, res, next));

/**
 * @swagger
 * /movimientos-bancarios/{id}/conciliar:
 *   post:
 *     summary: Marcar un movimiento como conciliado
 *     tags: [MovimientosBancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movimientoExtractoId:
 *                 type: string
 *                 description: ID del movimiento del extracto bancario (opcional)
 *     responses:
 *       200:
 *         description: Movimiento conciliado exitosamente
 *       404:
 *         description: Movimiento no encontrado
 */
router.post('/:id/conciliar', (req, res, next) => movimientosBancariosController.conciliar(req, res, next));

export default router;
