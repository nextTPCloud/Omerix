import { Router } from 'express';
import express from 'express'; 
import { handleStripeWebhook } from './stripe.webhooks';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { tenantMiddleware } from '../../../middleware/tenant.middleware';
import {
  createPaymentIntent,
  confirmPayment,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  addPaymentMethod,
  removePaymentMethod,
  getPaymentMethods,
  createRefund,
  getPaymentHistory,
  getPublishableKey,
} from './stripe.controller';

const router = Router();

// ============================================
// RUTA PÚBLICA
// ============================================

/**
 * @swagger
 * /api/pagos/stripe/config:
 *   get:
 *     summary: Obtener clave pública de Stripe
 *     tags: [Stripe]
 *     responses:
 *       200:
 *         description: Clave pública de Stripe
 */
router.get('/config', getPublishableKey);

// ============================================
// WEBHOOK (NO REQUIERE AUTENTICACIÓN)
// ============================================

/**
 * @swagger
 * /api/pagos/stripe/webhook:
 *   post:
 *     summary: Webhook de Stripe
 *     tags: [Stripe]
 *     description: Endpoint llamado por Stripe para notificar eventos
 *     responses:
 *       200:
 *         description: Webhook procesado
 */
    router.post(
    '/webhook',
    express.raw({ type: 'application/json' }), // IMPORTANTE: raw body para verificar firma
    handleStripeWebhook
    );

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// Todas las rutas siguientes requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// PAYMENT INTENTS (PAGOS ÚNICOS)
// ============================================

/**
 * @swagger
 * /api/pagos/stripe/payment-intent:
 *   post:
 *     summary: Crear intención de pago
 *     tags: [Stripe]
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
 *                 minimum: 0.5
 *                 example: 99.99
 *               moneda:
 *                 type: string
 *                 default: eur
 *                 example: eur
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
 *         description: Payment Intent creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/payment-intent', createPaymentIntent);

/**
 * @swagger
 * /api/pagos/stripe/payment-intent/confirm:
 *   post:
 *     summary: Confirmar pago
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 example: pi_1234567890
 *     responses:
 *       200:
 *         description: Pago confirmado
 *       404:
 *         description: Pago no encontrado
 */
router.post('/payment-intent/confirm', confirmPayment);

// ============================================
// SUSCRIPCIONES
// ============================================

/**
 * @swagger
 * /api/pagos/stripe/subscription:
 *   post:
 *     summary: Crear suscripción recurrente
 *     tags: [Stripe]
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
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_1234567890
 *               trialDays:
 *                 type: number
 *                 example: 14
 *     responses:
 *       201:
 *         description: Suscripción creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/subscription', createSubscription);

/**
 * @swagger
 * /api/pagos/stripe/subscription:
 *   put:
 *     summary: Actualizar suscripción (upgrade/downgrade)
 *     tags: [Stripe]
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
 *               - nuevoPlanId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *                 example: sub_1234567890
 *               nuevoPlanId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               prorrateo:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Suscripción actualizada
 *       404:
 *         description: Suscripción no encontrada
 */
router.put('/subscription', updateSubscription);

/**
 * @swagger
 * /api/pagos/stripe/subscription/cancel:
 *   post:
 *     summary: Cancelar suscripción
 *     tags: [Stripe]
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
 *                 example: sub_1234567890
 *               inmediato:
 *                 type: boolean
 *                 default: false
 *                 description: Si es true, cancela inmediatamente. Si es false, cancela al final del período.
 *               motivo:
 *                 type: string
 *                 example: No necesito el servicio
 *     responses:
 *       200:
 *         description: Suscripción cancelada
 *       404:
 *         description: Suscripción no encontrada
 */
router.post('/subscription/cancel', cancelSubscription);

// ============================================
// MÉTODOS DE PAGO
// ============================================

/**
 * @swagger
 * /api/pagos/stripe/payment-methods:
 *   get:
 *     summary: Obtener métodos de pago guardados
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métodos de pago
 */
router.get('/payment-methods', getPaymentMethods);

/**
 * @swagger
 * /api/pagos/stripe/payment-methods:
 *   post:
 *     summary: Añadir método de pago
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_1234567890
 *               setPredeterminado:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Método de pago añadido
 *       400:
 *         description: Datos inválidos
 */
router.post('/payment-methods', addPaymentMethod);

/**
 * @swagger
 * /api/pagos/stripe/payment-methods/{id}:
 *   delete:
 *     summary: Eliminar método de pago
 *     tags: [Stripe]
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
 *         description: Método de pago eliminado
 *       404:
 *         description: Método de pago no encontrado
 */
router.delete('/payment-methods/:id', removePaymentMethod);

// ============================================
// REEMBOLSOS
// ============================================

/**
 * @swagger
 * /api/pagos/stripe/refund:
 *   post:
 *     summary: Crear reembolso
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 example: pi_1234567890
 *               cantidad:
 *                 type: number
 *                 example: 50.00
 *                 description: Si no se especifica, se reembolsa el total
 *               motivo:
 *                 type: string
 *                 enum: [duplicate, fraudulent, requested_by_customer]
 *                 example: requested_by_customer
 *               descripcion:
 *                 type: string
 *                 example: Cliente no satisfecho con el servicio
 *     responses:
 *       201:
 *         description: Reembolso creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/refund', createRefund);

// ============================================
// HISTORIAL
// ============================================

/**
 * @swagger
 * /api/pagos/stripe/history:
 *   get:
 *     summary: Obtener historial de pagos
 *     tags: [Stripe]
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