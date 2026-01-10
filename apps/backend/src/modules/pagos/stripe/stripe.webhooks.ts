import { Request, Response } from 'express';
import Stripe from 'stripe';
import config from '../../../config/env';
import Pago from '../Pago';
import Licencia from '../../licencias/Licencia';
import Plan from '../../licencias/Plan';
import AddOn from '../../licencias/AddOn';
import { facturacionSuscripcionService } from '../facturacion-suscripcion.service';

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
      // CHECKOUT SESSION
      // ============================================

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
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

    // Generar factura de suscripción y enviar por email
    try {
      const result = await facturacionSuscripcionService.procesarPagoCompletado(String(pago._id));
      console.log(`Factura ${result.factura.numeroFactura} generada, email enviado: ${result.emailEnviado}`);
    } catch (error: any) {
      console.error('Error generando factura de suscripción:', error.message);
      // No fallar el webhook por error de facturación
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

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('✅ Checkout Session completada:', session.id);

  const empresaId = session.metadata?.empresaId;
  if (!empresaId) {
    console.log('⚠️ Checkout Session sin empresaId en metadata');
    return;
  }

  // Obtener add-ons desde metadata
  const addOnsString = session.metadata?.addOns;
  const tipoSuscripcion = session.metadata?.tipoSuscripcion as 'mensual' | 'anual' | undefined;
  const planSlug = session.metadata?.planSlug;
  const onlyAddOns = session.metadata?.onlyAddOns === 'true';

  console.log(`🔄 Checkout completado para empresa ${empresaId}:`, {
    planSlug,
    addOns: addOnsString,
    tipoSuscripcion,
    onlyAddOns,
  });

  // Actualizar licencia
  const licencia = await Licencia.findOne({ empresaId });
  if (!licencia) {
    console.error('❌ No se encontró licencia para empresa:', empresaId);
    return;
  }

  // Actualizar tipo de suscripción
  if (tipoSuscripcion) {
    licencia.tipoSuscripcion = tipoSuscripcion;
  }

  // Actualizar plan si no es solo add-ons
  if (!onlyAddOns && planSlug) {
    const nuevoPlan = await Plan.findOne({ slug: planSlug, activo: true });
    if (nuevoPlan) {
      const planAnterior = await Plan.findById(licencia.planId);
      licencia.planId = nuevoPlan._id;

      // Solo añadir al historial si cambió de plan
      if (planAnterior?.slug !== nuevoPlan.slug) {
        licencia.historial.push({
          fecha: new Date(),
          accion: 'CAMBIO_PLAN',
          planAnterior: planAnterior?.nombre,
          planNuevo: nuevoPlan.nombre,
          motivo: 'Checkout completado',
        });
        console.log(`✅ Plan actualizado: ${planAnterior?.nombre || 'N/A'} → ${nuevoPlan.nombre}`);
      }
    }
  }

  // Activar licencia si estaba en trial
  if (licencia.estado === 'trial') {
    licencia.estado = 'activa';
    licencia.esTrial = false;
    licencia.historial.push({
      fecha: new Date(),
      accion: 'ACTIVACION',
      motivo: 'Checkout completado exitosamente',
    });
  }

  await licencia.save();

  // Activar add-ons si hay
  if (addOnsString) {
    const addOnSlugs = addOnsString.split(',').filter(Boolean);
    if (addOnSlugs.length > 0) {
      console.log(`🔄 Activando ${addOnSlugs.length} add-ons desde Checkout Session`);
      await activarAddOnsPendientes(empresaId, addOnSlugs, tipoSuscripcion);
    }
  }

  // Crear registro de pago y generar factura
  try {
    const monto = session.amount_total ? session.amount_total / 100 : 0;

    if (monto > 0) {
      // Verificar si ya existe un pago para esta sesión
      const pagoExistente = await Pago.findOne({ transaccionExternaId: session.id });

      if (!pagoExistente) {
        const pago = await Pago.create({
          empresaId,
          concepto: onlyAddOns ? 'addon' : 'suscripcion',
          descripcion: onlyAddOns
            ? `Add-ons: ${addOnsString?.split(',').join(', ') || ''}`
            : `Suscripción Plan ${planSlug || ''} (${tipoSuscripcion})`,
          cantidad: monto,
          moneda: (session.currency || 'eur').toUpperCase(),
          total: monto,
          pasarela: 'stripe',
          transaccionExternaId: session.id,
          clienteExternoId: String(session.customer || ''),
          estado: 'completado',
          fechaPago: new Date(),
          metodoPago: { tipo: 'tarjeta' },
          metadata: {
            planSlug,
            addOns: addOnsString?.split(','),
            tipoSuscripcion,
            onlyAddOns,
          },
        });

        console.log(`✅ Pago creado desde Checkout Session: ${pago._id}`);

        // Generar factura de suscripción
        const result = await facturacionSuscripcionService.procesarPagoCompletado(String(pago._id));
        console.log(`✅ Factura ${result.factura.numeroFactura} generada, email: ${result.emailEnviado}`);
      }
    }
  } catch (error: any) {
    console.error('Error creando pago/factura desde Checkout:', error.message);
  }

  console.log(`✅ Checkout Session procesado para empresa ${empresaId}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('✅ Suscripción creada:', subscription.id);

  const empresaId = subscription.metadata.empresaId;
  if (empresaId) {
    const licencia = await Licencia.findOne({ empresaId });
    if (licencia) {
      licencia.stripeSubscriptionId = subscription.id;

      // Actualizar tipo de suscripción si viene en metadata
      if (subscription.metadata.tipoSuscripcion) {
        licencia.tipoSuscripcion = subscription.metadata.tipoSuscripcion as 'mensual' | 'anual';
      }

      await licencia.save();

      // Activar add-ons si vienen en metadata
      const addOnsString = subscription.metadata.addOns;
      if (addOnsString) {
        const addOnSlugs = addOnsString.split(',').filter(Boolean);
        if (addOnSlugs.length > 0) {
          console.log(`🔄 Activando add-ons desde metadata de suscripción: ${addOnSlugs.join(', ')}`);
          await activarAddOnsPendientes(
            empresaId,
            addOnSlugs,
            subscription.metadata.tipoSuscripcion as 'mensual' | 'anual'
          );
        }
      }
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
      const pago = await Pago.create({
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

      // Generar factura de suscripción y enviar por email
      try {
        const result = await facturacionSuscripcionService.procesarPagoCompletado(String(pago._id));
        console.log(`Factura ${result.factura.numeroFactura} generada, email enviado: ${result.emailEnviado}`);
      } catch (error: any) {
        console.error('Error generando factura de suscripción:', error.message);
      }
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

/**
 * Activa los add-ons pendientes en una licencia
 * @param empresaId - ID de la empresa
 * @param addOnSlugs - Array de slugs de add-ons a activar (opcional, si no se pasa usa addOnsPendientes de licencia)
 * @param tipoSuscripcion - Tipo de suscripción para el precio
 */
async function activarAddOnsPendientes(
  empresaId: string,
  addOnSlugs?: string[],
  tipoSuscripcion?: 'mensual' | 'anual'
) {
  const licencia = await Licencia.findOne({ empresaId });
  if (!licencia) {
    console.error('❌ No se encontró licencia para empresa:', empresaId);
    return;
  }

  // Usar add-ons pasados como parámetro o los pendientes en la licencia
  const slugsToActivate = addOnSlugs || licencia.addOnsPendientes || [];

  if (slugsToActivate.length === 0) {
    console.log('ℹ️ No hay add-ons pendientes para activar');
    return;
  }

  console.log(`🔄 Activando ${slugsToActivate.length} add-ons para empresa ${empresaId}:`, slugsToActivate);

  // Obtener los add-ons de la base de datos
  const addOnsData = await AddOn.find({
    slug: { $in: slugsToActivate },
    activo: true,
  });

  const tipo = tipoSuscripcion || licencia.tipoSuscripcion || 'mensual';
  const esAnual = tipo === 'anual';

  for (const addon of addOnsData) {
    // Verificar si ya existe el add-on en la licencia
    const existeAddOn = licencia.addOns?.find(
      (a: any) => a.slug === addon.slug && a.activo
    );

    if (existeAddOn) {
      console.log(`ℹ️ Add-on ${addon.slug} ya estaba activo`);
      continue;
    }

    // Calcular precio según tipo de suscripción
    const precio = esAnual && addon.precio?.anual
      ? addon.precio.anual
      : addon.precio?.mensual || 0;

    // Añadir el add-on a la licencia
    licencia.addOns.push({
      addOnId: addon._id,
      nombre: addon.nombre,
      slug: addon.slug,
      cantidad: addon.cantidad || 1,
      precioMensual: addon.precio?.mensual || 0,
      activo: true,
      fechaActivacion: new Date(),
    });

    console.log(`✅ Add-on activado: ${addon.nombre} (${addon.slug}) - ${precio}€/${esAnual ? 'año' : 'mes'}`);
  }

  // Actualizar plan pendiente si existe
  if (licencia.planPendiente) {
    const nuevoPlan = await Plan.findById(licencia.planPendiente);
    if (nuevoPlan) {
      const planAnterior = await Plan.findById(licencia.planId);
      licencia.planId = licencia.planPendiente;
      licencia.historial.push({
        fecha: new Date(),
        accion: 'CAMBIO_PLAN',
        planAnterior: planAnterior?.nombre,
        planNuevo: nuevoPlan.nombre,
        motivo: 'Pago completado',
      });
      console.log(`✅ Plan actualizado: ${planAnterior?.nombre || 'N/A'} → ${nuevoPlan.nombre}`);
    }
    licencia.planPendiente = undefined;
  }

  // Limpiar add-ons pendientes
  licencia.addOnsPendientes = [];

  // Activar licencia si estaba en trial
  if (licencia.estado === 'trial') {
    licencia.estado = 'activa';
    licencia.esTrial = false;
  }

  // Añadir al historial
  if (addOnsData.length > 0) {
    licencia.historial.push({
      fecha: new Date(),
      accion: 'ACTIVACION_ADDONS',
      motivo: `Add-ons activados: ${addOnsData.map(a => a.nombre).join(', ')}`,
    });
  }

  await licencia.save();
  console.log(`✅ Licencia actualizada con ${addOnsData.length} add-ons nuevos`);
}