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
import { createCheckoutSession } from './stripe/stripe.controller';
import paypalRoutes from './paypal/paypal.routes';
import redsysRoutes from './redsys/redsys.routes';
import { facturacionSuscripcionService } from './facturacion-suscripcion.service';
import { facturaSuscripcionPDFService } from './factura-suscripcion-pdf.service';
import { prorrateoService } from '../licencias/prorrateo.service';

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

// ============================================
// RUTAS DE CHECKOUT (ALIAS PARA FRONTEND)
// ============================================

/**
 * @swagger
 * /api/pagos/checkout/session:
 *   post:
 *     summary: Crear sesion de Stripe Checkout
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planSlug
 *               - tipoSuscripcion
 *               - successUrl
 *               - cancelUrl
 *             properties:
 *               planSlug:
 *                 type: string
 *                 example: profesional
 *               tipoSuscripcion:
 *                 type: string
 *                 enum: [mensual, anual]
 *               successUrl:
 *                 type: string
 *                 format: uri
 *               cancelUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Sesion de checkout creada
 */
router.post('/checkout/session', createCheckoutSession);

/**
 * @swagger
 * /api/pagos/historial:
 *   get:
 *     summary: Obtener historial de pagos (alias)
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de pagos
 */
router.get('/historial', getPayments);

/**
 * @swagger
 * /api/pagos/metodo-pago:
 *   get:
 *     summary: Obtener metodo de pago predeterminado
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metodo de pago
 */
router.get('/metodo-pago', async (req, res) => {
  try {
    const empresaId = req.empresaId!;
    const MetodoPago = (await import('../formas-pago/MetodoPago')).default;

    const metodo = await MetodoPago.findOne({
      empresaId,
      activo: true,
      predeterminado: true,
    });

    if (!metodo) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: {
        tipo: metodo.tipo,
        ultimos4: metodo.ultimos4,
        marca: metodo.marca,
        expira: metodo.expMes && metodo.expAno
          ? `${String(metodo.expMes).padStart(2, '0')}/${metodo.expAno}`
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error obteniendo metodo de pago:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo metodo de pago',
    });
  }
});

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

// ============================================
// FACTURAS DE SUSCRIPCIÓN
// ============================================

/**
 * @swagger
 * /api/pagos/facturas-suscripcion:
 *   get:
 *     summary: Obtener facturas de suscripción de la empresa
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/facturas-suscripcion', async (req, res) => {
  try {
    const empresaId = req.empresaId!;
    const facturas = await facturacionSuscripcionService.getFacturasEmpresa(empresaId);

    res.json({
      success: true,
      data: facturas,
    });
  } catch (error: any) {
    console.error('Error obteniendo facturas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo facturas',
    });
  }
});

/**
 * @swagger
 * /api/pagos/facturas-suscripcion/{id}/pdf:
 *   get:
 *     summary: Descargar PDF de factura de suscripción
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/facturas-suscripcion/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const empresaId = req.empresaId!;

    // Verificar que la factura pertenece a la empresa
    const factura = await facturacionSuscripcionService.getFacturaById(id);
    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada',
      });
    }

    if (factura.cliente.empresaId.toString() !== empresaId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta factura',
      });
    }

    // Generar PDF
    const { pdfBuffer } = await facturaSuscripcionPDFService.generarYGuardarPDF(id);

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="factura-${factura.numeroFactura}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generando PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generando PDF',
    });
  }
});

// ============================================
// PRORRATEO
// ============================================

/**
 * @swagger
 * /api/pagos/prorrateo:
 *   post:
 *     summary: Calcular prorrateo para add-ons o cambio de plan
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/prorrateo', async (req, res) => {
  try {
    const empresaId = req.empresaId!;
    const { addOns, planSlug } = req.body;

    const resumen = await prorrateoService.getResumenProrrateo(
      empresaId,
      addOns || [],
      planSlug
    );

    res.json({
      success: true,
      data: resumen,
    });
  } catch (error: any) {
    console.error('Error calculando prorrateo:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error calculando prorrateo',
    });
  }
});

export default router;