import { Request, Response } from 'express';
import crypto from 'crypto';
import config from '../../../config/env';
import Pago from '../Pago';
import Licencia from '../../licencias/Licencia';
import Plan from '../../licencias/Plan';
import AddOn from '../../licencias/AddOn';
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

    const empresaId = String(pago.empresaId);

    // Buscar licencia por paypalOrderId o empresaId
    const licencia = await Licencia.findOne({
      $or: [
        { paypalOrderId: orderId },
        { empresaId: pago.empresaId }
      ]
    });

    if (licencia) {
      console.log(`🔄 Procesando licencia para empresa ${empresaId}, paypalOrderId: ${orderId}`);

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
            motivo: 'Pago PayPal completado',
          });
          console.log(`✅ Plan actualizado: ${planAnterior?.nombre || 'N/A'} → ${nuevoPlan.nombre}`);
        }
        licencia.planPendiente = undefined;
      }

      // Activar add-ons pendientes
      if (licencia.addOnsPendientes && licencia.addOnsPendientes.length > 0) {
        console.log(`🔄 Activando ${licencia.addOnsPendientes.length} add-ons pendientes:`, licencia.addOnsPendientes);
        await activarAddOnsPendientes(empresaId, licencia.addOnsPendientes, licencia.tipoSuscripcion);
      }

      // Activar licencia si estaba en trial
      if (licencia.estado === 'trial') {
        licencia.estado = 'activa';
        licencia.esTrial = false;
        licencia.historial.push({
          fecha: new Date(),
          accion: 'ACTIVACION',
          motivo: 'Pago PayPal completado exitosamente',
        });
      }

      // Limpiar paypalOrderId
      licencia.paypalOrderId = undefined;

      await licencia.save();
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

/**
 * Activa los add-ons pendientes en una licencia
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

  // Limpiar add-ons pendientes
  licencia.addOnsPendientes = [];

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