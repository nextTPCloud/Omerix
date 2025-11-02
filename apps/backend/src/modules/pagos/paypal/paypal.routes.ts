import { Router } from 'express';
import express from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { tenantMiddleware } from '../../../middleware/tenant.middleware';
import { handlePayPalWebhook } from './paypal.webhooks';
import {
  createOrder,
  captureOrder,
  getOrder,
  createSubscription,
  cancelSubscription,
  createRefund,
  getPaymentHistory,
  getConfig,
} from './paypal.controller';

const router = Router();

// ============================================
// RUTA PÚBLICA
// ============================================

/**
 * @swagger
 * /api/pagos/paypal/config:
 *   get:
 *     summary: Obtener configuración de PayPal
 *     tags: [PayPal]
 *     responses:
 *       200:
 *         description: Configuración de PayPal (client ID y mode)
 */
router.get('/config', getConfig);

/**
 * @swagger
 * /api/pagos/paypal/webhook:
 *   post:
 *     summary: Webhook de PayPal
 *     tags: [PayPal]
 *     description: Endpoint llamado por PayPal para notificar eventos
 *     responses:
 *       200:
 *         description: Webhook procesado
 */
router.post(
  '/webhook',
  express.json(), // PayPal envía JSON normal
  handlePayPalWebhook
);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// Todas las rutas siguientes requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);


// ============================================
// ÓRDENES (PAGOS ÚNICOS)
// ============================================

/**
 * @swagger
 * /api/pagos/paypal/orders:
 *   post:
 *     summary: Crear orden de PayPal
 *     tags: [PayPal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *               - concepto
 *               - descripcion
 *             properties:
 *               cantidad:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 99.99
 *               moneda:
 *                 type: string
 *                 default: EUR
 *                 example: EUR
 *               concepto:
 *                 type: string
 *                 enum: [suscripcion, upgrade, addon, factura, otro]
 *                 example: upgrade
 *               descripcion:
 *                 type: string
 *                 example: Upgrade a Plan Premium
 *               planId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/orders', createOrder);

/**
 * @swagger
 * /api/pagos/paypal/orders/capture:
 *   post:
 *     summary: Capturar orden de PayPal (completar pago)
 *     tags: [PayPal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 5O190127TN364715T
 *     responses:
 *       200:
 *         description: Orden capturada exitosamente
 *       404:
 *         description: Orden no encontrada
 */
router.post('/orders/capture', captureOrder);

/**
 * @swagger
 * /api/pagos/paypal/orders/{orderId}:
 *   get:
 *     summary: Obtener detalles de una orden
 *     tags: [PayPal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalles de la orden
 *       404:
 *         description: Orden no encontrada
 */
router.get('/orders/:orderId', getOrder);

// ============================================
// SUSCRIPCIONES
// ============================================

/**
 * @swagger
 * /api/pagos/paypal/subscriptions:
 *   post:
 *     summary: Crear suscripción de PayPal
 *     tags: [PayPal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: Suscripción creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/subscriptions', createSubscription);

/**
 * @swagger
 * /api/pagos/paypal/subscriptions/cancel:
 *   post:
 *     summary: Cancelar suscripción de PayPal
 *     tags: [PayPal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *                 example: I-BW452GLLEP1G
 *               motivo:
 *                 type: string
 *                 example: No necesito el servicio
 *     responses:
 *       200:
 *         description: Suscripción cancelada exitosamente
 *       404:
 *         description: Suscripción no encontrada
 */
router.post('/subscriptions/cancel', cancelSubscription);

// ============================================
// REEMBOLSOS
// ============================================

/**
 * @swagger
 * /api/pagos/paypal/refunds:
 *   post:
 *     summary: Crear reembolso de PayPal
 *     tags: [PayPal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - captureId
 *             properties:
 *               captureId:
 *                 type: string
 *                 example: 2GG279541U471931P
 *               cantidad:
 *                 type: number
 *                 example: 50.00
 *                 description: Si no se especifica, se reembolsa el total
 *               motivo:
 *                 type: string
 *                 example: Cliente no satisfecho con el servicio
 *     responses:
 *       201:
 *         description: Reembolso creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/refunds', createRefund);

// ============================================
// HISTORIAL
// ============================================

/**
 * @swagger
 * /api/pagos/paypal/history:
 *   get:
 *     summary: Obtener historial de pagos de PayPal
 *     tags: [PayPal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de pagos a retornar
 *     responses:
 *       200:
 *         description: Historial de pagos
 */
router.get('/history', getPaymentHistory);

export default router;