import { Router } from 'express';
import { recibosController } from './recibos.controller';
import { authMiddleware, requireModuleAccess } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Recibos
 *   description: Gestión de recibos bancarios
 */

// Aplicar middleware de autenticación y empresa a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Verificar acceso al módulo de tesorería
router.use(requireModuleAccess('accesoTesoreria'));

// ============================================
// RUTAS DE RECIBOS
// ============================================

/**
 * @swagger
 * /recibos:
 *   get:
 *     summary: Obtener todos los recibos con filtros y paginación
 *     tags: [Recibos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', (req, res, next) => recibosController.getAll(req, res, next));

/**
 * @swagger
 * /recibos/pendientes-envio:
 *   get:
 *     summary: Obtener recibos pendientes de envío a banco (con mandato SEPA activo)
 *     tags: [Recibos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/pendientes-envio', (req, res, next) => recibosController.getPendientesEnvio(req, res, next));

/**
 * @swagger
 * /recibos/{id}:
 *   get:
 *     summary: Obtener un recibo por ID
 *     tags: [Recibos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', (req, res, next) => recibosController.getById(req, res, next));

/**
 * @swagger
 * /recibos:
 *   post:
 *     summary: Crear un nuevo recibo
 *     tags: [Recibos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', (req, res, next) => recibosController.create(req, res, next));

/**
 * @swagger
 * /recibos/desde-factura:
 *   post:
 *     summary: Generar recibos desde una factura (un recibo por cada vencimiento pendiente)
 *     tags: [Recibos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facturaId
 *             properties:
 *               facturaId:
 *                 type: string
 *               serie:
 *                 type: string
 *                 default: REC
 */
router.post('/desde-factura', (req, res, next) => recibosController.generarDesdeFactura(req, res, next));

/**
 * @swagger
 * /recibos/desde-vencimientos:
 *   post:
 *     summary: Generar recibos desde vencimientos seleccionados
 *     tags: [Recibos]
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
 *             properties:
 *               vencimientoIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               serie:
 *                 type: string
 *                 default: REC
 */
router.post('/desde-vencimientos', (req, res, next) => recibosController.generarDesdeVencimientos(req, res, next));

/**
 * @swagger
 * /recibos/remesa:
 *   post:
 *     summary: Crear una remesa de recibos para envío a banco
 *     tags: [Recibos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reciboIds
 *             properties:
 *               reciboIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               fechaRemesa:
 *                 type: string
 *                 format: date
 *               cuentaBancariaEmpresaId:
 *                 type: string
 */
router.post('/remesa', (req, res, next) => recibosController.crearRemesa(req, res, next));

/**
 * @swagger
 * /recibos/{id}:
 *   put:
 *     summary: Actualizar un recibo (solo en estado emitido)
 *     tags: [Recibos]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', (req, res, next) => recibosController.update(req, res, next));

/**
 * @swagger
 * /recibos/{id}/enviar:
 *   post:
 *     summary: Marcar recibo como enviado al banco
 *     tags: [Recibos]
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
 *               fechaEnvio:
 *                 type: string
 *                 format: date
 */
router.post('/:id/enviar', (req, res, next) => recibosController.marcarEnviado(req, res, next));

/**
 * @swagger
 * /recibos/{id}/cobrar:
 *   post:
 *     summary: Marcar recibo como cobrado
 *     tags: [Recibos]
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
 *               fechaCobro:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 */
router.post('/:id/cobrar', (req, res, next) => recibosController.marcarCobrado(req, res, next));

/**
 * @swagger
 * /recibos/{id}/devolver:
 *   post:
 *     summary: Marcar recibo como devuelto
 *     tags: [Recibos]
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
 *               comision:
 *                 type: number
 *               observaciones:
 *                 type: string
 */
router.post('/:id/devolver', (req, res, next) => recibosController.marcarDevuelto(req, res, next));

/**
 * @swagger
 * /recibos/{id}/anular:
 *   post:
 *     summary: Anular un recibo
 *     tags: [Recibos]
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
 *               motivo:
 *                 type: string
 */
router.post('/:id/anular', (req, res, next) => recibosController.anular(req, res, next));

/**
 * @swagger
 * /recibos/{id}:
 *   delete:
 *     summary: Eliminar un recibo (solo en estado emitido)
 *     tags: [Recibos]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', (req, res, next) => recibosController.delete(req, res, next));

export default router;
