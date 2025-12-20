import { Request, Response } from 'express';
import Stripe from 'stripe';
import config from '../../../config/env';
import Pago from '../Pago';
import Licencia from '../../licencias/Licencia';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-10-29.clover',
});

/**
 * Webhook de Stripe
 * Endpoint: POST /api/pagos/stripe/webhook
 * 
 * IMPORTANTE: Este endpoint NO debe tener middleware de autenticación
 * porque Stripe lo llama directamente
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    // Verificar la firma del webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔔 Stripe webhook recibido:', event.type);

  try {
    // Manejar diferentes tipos de eventos
    switch (event.type) {
      // ============================================
      // PAYMENT INTENT
      // ============================================
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      // ============================================
      // SUSCRIPCIONES
      // ============================================

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // ============================================
      // FACTURACIÓN
      // ============================================

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // ============================================
      // MÉTODO DE PAGO
      // ============================================

      case 'payment_method.attached':
        console.log('✅ Método de pago adjuntado');
        break;

      case 'payment_method.detached':
        console.log('✅ Método de pago desvinculado');
        break;

      // ============================================
      // OTROS EVENTOS
      // ============================================

      default:
        console.log(`⚠️ Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// HANDLERS DE EVENTOS
// ============================================

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('✅ Payment Intent exitoso:', paymentIntent.id);

  const pago = await Pago.findOne({
    transaccionExternaId: paymentIntent.id,
  });

  if (pago) {
    pago.estado = 'completado';
    pago.fechaPago = new Date();
    pago.estadoDetalle = 'Pago completado exitosamente';

    // Obtener el charge asociado al payment intent
    try {
      const charges = await stripe.charges.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });

      if (charges.data.length > 0) {
        const charge = charges.data[0];
        if (charge.payment_method_details?.card) {
          pago.metodoPago.ultimos4 = charge.payment_method_details.card.last4 || undefined;
          pago.metodoPago.marca = charge.payment_method_details.card.brand || undefined;
        }
      }
    } catch (error) {
      console.error('Error obteniendo charge:', error);
    }

    await pago.save();

    // Si es un pago de suscripción, activar la licencia
    if (pago.concepto === 'suscripcion' && pago.metadata?.licenciaId) {
      await activarLicencia(String(pago.metadata.licenciaId));
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment Intent fallido:', paymentIntent.id);

  const pago = await Pago.findOne({
    transaccionExternaId: paymentIntent.id,
  });

  if (pago) {
    pago.estado = 'fallido';
    pago.estadoDetalle = 'Pago fallido';
    pago.errorMensaje = paymentIntent.last_payment_error?.message || undefined;
    await pago.save();
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('⚠️ Payment Intent cancelado:', paymentIntent.id);

  const pago = await Pago.findOne({
    transaccionExternaId: paymentIntent.id,
  });

  if (pago) {
    pago.estado = 'cancelado';
    pago.estadoDetalle = 'Pago cancelado';
    await pago.save();
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('✅ Suscripción creada:', subscription.id);

  const empresaId = subscription.metadata.empresaId;
  if (empresaId) {
    const licencia = await Licencia.findOne({ empresaId });
    if (licencia) {
      licencia.stripeSubscriptionId = subscription.id;
      await licencia.save();
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Suscripción actualizada:', subscription.id);

  const empresaId = subscription.metadata.empresaId;
  if (empresaId) {
    const licencia = await Licencia.findOne({ empresaId });
    if (licencia) {
      // Actualizar estado según el estado de la suscripción
      if (subscription.status === 'active') {
        licencia.estado = 'activa';
      } else if (subscription.status === 'canceled') {
        licencia.estado = 'cancelada';
        licencia.fechaCancelacion = new Date();
      } else if (subscription.status === 'past_due') {
        licencia.estado = 'suspendida';
      }
      await licencia.save();
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Suscripción eliminada:', subscription.id);

  const empresaId = subscription.metadata.empresaId;
  if (empresaId) {
    const licencia = await Licencia.findOne({ empresaId });
    if (licencia) {
      licencia.estado = 'cancelada';
      licencia.fechaCancelacion = new Date();
      licencia.historial.push({
        fecha: new Date(),
        accion: 'CANCELACION',
        motivo: 'Suscripción eliminada en Stripe',
      });
      await licencia.save();
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('✅ Factura pagada:', invoice.id);

  // Casting seguro para acceder a propiedades que TypeScript no reconoce
  const invoiceAny = invoice as any;
  const paymentIntentId = invoiceAny.payment_intent as string | null | undefined;
  const subscriptionId = invoiceAny.subscription as string | null | undefined;

  if (!paymentIntentId) {
    console.log('⚠️ Invoice sin payment_intent:', invoice.id);
    return;
  }

  // Crear registro de pago si no existe
  const pagoExistente = await Pago.findOne({
    transaccionExternaId: paymentIntentId,
  });

  if (!pagoExistente && subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const empresaId = subscription.metadata.empresaId;

    if (empresaId) {
      await Pago.create({
        empresaId,
        concepto: 'suscripcion',
        descripcion: `Pago de suscripción - ${invoice.lines.data[0]?.description || 'Suscripción'}`,
        cantidad: (invoice.amount_paid || 0) / 100,
        moneda: (invoice.currency || 'eur').toUpperCase(),
        total: (invoice.amount_paid || 0) / 100,
        pasarela: 'stripe',
        transaccionExternaId: paymentIntentId,
        clienteExternoId: String(invoice.customer || ''),
        estado: 'completado',
        fechaPago: invoice.status_transitions?.paid_at 
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date(),
        metodoPago: {
          tipo: 'tarjeta',
        },
        numeroFactura: invoice.number || undefined,
      });
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Pago de factura fallido:', invoice.id);

  // Casting seguro para acceder a subscription
  const invoiceAny = invoice as any;
  const subscriptionId = invoiceAny.subscription as string | null | undefined;

  // Suspender licencia si el pago falla
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const empresaId = subscription.metadata.empresaId;

    if (empresaId) {
      const licencia = await Licencia.findOne({ empresaId });
      if (licencia) {
        licencia.estado = 'suspendida';
        licencia.historial.push({
          fecha: new Date(),
          accion: 'SUSPENSION',
          motivo: 'Pago de factura fallido',
        });
        await licencia.save();
      }
    }
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