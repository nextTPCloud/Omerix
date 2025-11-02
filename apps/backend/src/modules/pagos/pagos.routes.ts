import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import stripeRoutes from './stripe/stripe.routes';
import {
  getPayments,
  getPaymentMethods,
  getPaymentStats,
  getPayment,
} from './pagos.controller';
import paypalRoutes from './paypal/paypal.routes';
import redsysRoutes from './redsys/redsys.routes';

const router = Router();

// ============================================
// RUTAS DE PASARELAS ESPECÍFICAS
// ============================================

router.use('/stripe', stripeRoutes);
router.use('/paypal', paypalRoutes); 
router.use('/redsys', redsysRoutes); 

// ============================================
// RUTAS GENERALES (REQUIEREN AUTENTICACIÓN)
// ============================================

router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @swagger
 * /api/pagos:
 *   get:
 *     summary: Obtener historial de pagos
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pasarela
 *         schema:
 *           type: string
 *           enum: [stripe, paypal, redsys, transferencia, efectivo]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, procesando, completado, fallido, cancelado, reembolsado]
 *       - in: query
 *         name: concepto
 *         schema:
 *           type: string
 *           enum: [suscripcion, upgrade, addon, factura, otro]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Historial de pagos
 */
router.get('/', getPayments);

/**
 * @swagger
 * /api/pagos/{id}:
 *   get:
 *     summary: Obtener detalle de un pago
 *     tags: [Pagos]
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
 *         description: Detalle del pago
 *       404:
 *         description: Pago no encontrado
 */
router.get('/:id', getPayment);

/**
 * @swagger
 * /api/pagos/metodos/todos:
 *   get:
 *     summary: Obtener todos los métodos de pago
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métodos de pago
 */
router.get('/metodos/todos', getPaymentMethods);

/**
 * @swagger
 * /api/pagos/estadisticas/resumen:
 *   get:
 *     summary: Obtener estadísticas de pagos
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de pagos
 */
router.get('/estadisticas/resumen', getPaymentStats);

export default router;