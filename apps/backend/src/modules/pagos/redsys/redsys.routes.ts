import { Router } from 'express';
import express from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { tenantMiddleware } from '../../../middleware/tenant.middleware';
import {
  handleRedsysWebhook,
  handleOkResponse,
  handleKoResponse,
} from './redsys.webhooks'; // ← IMPORTAR DESDE WEBHOOKS
import {
  createPayment,
  createSubscription,
  cancelSubscription,
  createRefund,
  getPaymentHistory,
} from './redsys.controller';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTENTICACIÓN)
// ============================================

/**
 * @swagger
 * /api/pagos/redsys/webhook:
 *   post:
 *     summary: Webhook de Redsys (Notificación)
 *     tags: [Redsys]
 *     description: Endpoint llamado por Redsys para notificar el estado del pago
 *     responses:
 *       200:
 *         description: Notificación procesada (OK)
 *       400:
 *         description: Error en los parámetros (KO)
 */
router.post(
  '/webhook',
  express.urlencoded({ extended: true }), // Redsys envía form-urlencoded
  handleRedsysWebhook
);

/**
 * @swagger
 * /api/pagos/redsys/ok:
 *   get:
 *     summary: Respuesta OK de Redsys
 *     tags: [Redsys]
 *     description: Página a la que vuelve el usuario después de un pago exitoso
 *     responses:
 *       200:
 *         description: Pago procesado correctamente
 */
router.get('/ok', handleOkResponse);

/**
 * @swagger
 * /api/pagos/redsys/ko:
 *   get:
 *     summary: Respuesta KO de Redsys
 *     tags: [Redsys]
 *     description: Página a la que vuelve el usuario si cancela o falla el pago
 *     responses:
 *       200:
 *         description: Pago cancelado o denegado
 */
router.get('/ko', handleKoResponse);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// Todas las rutas siguientes requieren autenticación y tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// ============================================
// PAGOS
// ============================================

/**
 * @swagger
 * /api/pagos/redsys/payments:
 *   post:
 *     summary: Crear pago de Redsys
 *     tags: [Redsys]
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
 *         description: Pago creado exitosamente (devuelve formulario para enviar a Redsys)
 *       400:
 *         description: Datos inválidos
 */
router.post('/payments', createPayment);

// ============================================
// SUSCRIPCIONES
// ============================================

/**
 * @swagger
 * /api/pagos/redsys/subscriptions:
 *   post:
 *     summary: Crear suscripción de Redsys
 *     tags: [Redsys]
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
 * /api/pagos/redsys/subscriptions/cancel:
 *   post:
 *     summary: Cancelar suscripción de Redsys
 *     tags: [Redsys]
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
 *                 example: abc123
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
 * /api/pagos/redsys/refunds:
 *   post:
 *     summary: Crear reembolso de Redsys
 *     tags: [Redsys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaccionId
 *             properties:
 *               transaccionId:
 *                 type: string
 *                 example: "000012345678"
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
 * /api/pagos/redsys/history:
 *   get:
 *     summary: Obtener historial de pagos de Redsys
 *     tags: [Redsys]
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