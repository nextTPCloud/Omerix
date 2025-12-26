import { Request, Response } from 'express';
import crypto from 'crypto';
import config from '../../../config/env';
import Pago from '../Pago';
import Licencia from '../../licencias/Licencia';
import { facturacionSuscripcionService } from '../facturacion-suscripcion.service';

/**
 * Webhook de PayPal
 * Endpoint: POST /api/pagos/paypal/webhook
 * 
 * IMPORTANTE: Este endpoint NO debe tener middleware de autenticación
 * porque PayPal lo llama directamente
 */
export const handlePayPalWebhook = async (req: Request, res: Response) => {
  try {
    // Verificar la firma del webhook
    const isValid = await verifyWebhookSignature(req);

    if (!isValid) {
      console.error('⚠️ PayPal webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const eventType = event.event_type;

    console.log('🔔 PayPal webhook recibido:', eventType);

    // Manejar diferentes tipos de eventos
    switch (eventType) {
      // ============================================
      // PAGOS
      // ============================================

      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentCaptureDenied(event);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(event);
        break;

      // ============================================
      // SUSCRIPCIONES
      // ============================================

      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(event);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;

      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handleSubscriptionUpdated(event);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handleSubscriptionPaymentFailed(event);
        break;

      // ============================================
      // OTROS EVENTOS
      // ============================================

      default:
        console.log(`⚠️ Evento no manejado: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error procesando webhook de PayPal:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// HANDLERS DE EVENTOS
// ============================================

async function handlePaymentCaptureCompleted(event: any) {
  console.log('✅ Pago capturado:', event.resource.id);

  const captureId = event.resource.id;
  const orderId = event.resource.supplementary_data?.related_ids?.order_id;

  if (!orderId) return;

  const pago = await Pago.findOne({
    transaccionExternaId: orderId,
  });

  if (pago) {
    pago.estado = 'completado';
    pago.fechaPago = new Date();
    pago.estadoDetalle = 'Pago completado exitosamente';
    await pago.save();

    // Si es una suscripción, activar la licencia
    if (pago.concepto === 'suscripcion' && pago.metadata?.licenciaId) {
      await activarLicencia(String(pago.metadata.licenciaId));
    }

    // Generar factura de suscripción y enviar por email
    try {
      const result = await facturacionSuscripcionService.procesarPagoCompletado(String(pago._id));
      console.log(`Factura ${result.factura.numeroFactura} generada, email enviado: ${result.emailEnviado}`);
    } catch (error: any) {
      console.error('Error generando factura de suscripción:', error.message);
    }
  }
}

async function handlePaymentCaptureDenied(event: any) {
  console.log('❌ Pago denegado:', event.resource.id);

  const orderId = event.resource.supplementary_data?.related_ids?.order_id;

  if (!orderId) return;

  const pago = await Pago.findOne({
    transaccionExternaId: orderId,
  });

  if (pago) {
    pago.estado = 'fallido';
    pago.estadoDetalle = 'Pago denegado';
    await pago.save();
  }
}

async function handlePaymentCaptureRefunded(event: any) {
  console.log('💰 Reembolso procesado:', event.resource.id);

  const captureId = event.resource.id;

  const pago = await Pago.findOne({
    transaccionExternaId: captureId,
  });

  if (pago) {
    pago.estado = 'reembolsado';
    pago.fechaReembolso = new Date();
    pago.estadoDetalle = 'Reembolso procesado';
    await pago.save();
  }
}

async function handleSubscriptionCreated(event: any) {
  console.log('✅ Suscripción creada:', event.resource.id);

  const subscriptionId = event.resource.id;
  const customId = event.resource.custom_id; // empresaId

  if (customId) {
    const licencia = await Licencia.findOne({ empresaId: customId });
    if (licencia) {
      licencia.paypalSubscriptionId = subscriptionId;
      await licencia.save();
    }
  }
}

async function handleSubscriptionActivated(event: any) {
  console.log('✅ Suscripción activada:', event.resource.id);

  const subscriptionId = event.resource.id;

  const licencia = await Licencia.findOne({ paypalSubscriptionId: subscriptionId });
  if (licencia) {
    licencia.estado = 'activa';
    licencia.historial.push({
      fecha: new Date(),
      accion: 'ACTIVACION',
      motivo: 'Suscripción activada en PayPal',
    });
    await licencia.save();
  }
}

async function handleSubscriptionUpdated(event: any) {
  console.log('🔄 Suscripción actualizada:', event.resource.id);

  const subscriptionId = event.resource.id;
  const status = event.resource.status;

  const licencia = await Licencia.findOne({ paypalSubscriptionId: subscriptionId });
  if (licencia) {
    if (status === 'ACTIVE') {
      licencia.estado = 'activa';
    } else if (status === 'CANCELLED') {
      licencia.estado = 'cancelada';
      licencia.fechaCancelacion = new Date();
    } else if (status === 'SUSPENDED') {
      licencia.estado = 'suspendida';
    }
    await licencia.save();
  }
}

async function handleSubscriptionCancelled(event: any) {
  console.log('❌ Suscripción cancelada:', event.resource.id);

  const subscriptionId = event.resource.id;

  const licencia = await Licencia.findOne({ paypalSubscriptionId: subscriptionId });
  if (licencia) {
    licencia.estado = 'cancelada';
    licencia.fechaCancelacion = new Date();
    licencia.historial.push({
      fecha: new Date(),
      accion: 'CANCELACION',
      motivo: 'Suscripción cancelada en PayPal',
    });
    await licencia.save();
  }
}

async function handleSubscriptionSuspended(event: any) {
  console.log('⚠️ Suscripción suspendida:', event.resource.id);

  const subscriptionId = event.resource.id;

  const licencia = await Licencia.findOne({ paypalSubscriptionId: subscriptionId });
  if (licencia) {
    licencia.estado = 'suspendida';
    licencia.historial.push({
      fecha: new Date(),
      accion: 'SUSPENSION',
      motivo: 'Suscripción suspendida en PayPal',
    });
    await licencia.save();
  }
}

async function handleSubscriptionPaymentFailed(event: any) {
  console.log('❌ Pago de suscripción fallido:', event.resource.id);

  const subscriptionId = event.resource.id;

  const licencia = await Licencia.findOne({ paypalSubscriptionId: subscriptionId });
  if (licencia) {
    licencia.estado = 'suspendida';
    licencia.historial.push({
      fecha: new Date(),
      accion: 'SUSPENSION',
      motivo: 'Pago de suscripción fallido',
    });
    await licencia.save();
  }
}

// ============================================
// HELPERS
// ============================================

async function activarLicencia(licenciaId: string) {
  const licencia = await Licencia.findById(licenciaId);
  if (licencia && licencia.estado === 'trial') {
    licencia.estado = 'activa';
    licencia.esTrial = false;
    licencia.historial.push({
      fecha: new Date(),
      accion: 'ACTIVACION',
      motivo: 'Pago completado exitosamente',
    });
    await licencia.save();
    console.log('✅ Licencia activada:', licenciaId);
  }
}

async function verifyWebhookSignature(req: Request): Promise<boolean> {
  try {
    // PayPal envía headers de verificación
    const transmissionId = req.headers['paypal-transmission-id'] as string;
    const transmissionTime = req.headers['paypal-transmission-time'] as string;
    const certUrl = req.headers['paypal-cert-url'] as string;
    const transmissionSig = req.headers['paypal-transmission-sig'] as string;
    const authAlgo = req.headers['paypal-auth-algo'] as string;

    if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig || !authAlgo) {
      return false;
    }

    // Para simplificar en desarrollo, puedes saltarte la verificación
    // En producción, implementa la verificación completa según la documentación de PayPal
    if (config.paypal.mode === 'sandbox') {
      console.log('⚠️ Webhook signature verification skipped in sandbox mode');
      return true;
    }

    // Aquí iría la verificación completa de firma
    // https://developer.paypal.com/api/rest/webhooks/rest/

    return true;
  } catch (error) {
    console.error('Error verificando firma de webhook:', error);
    return false;
  }
}