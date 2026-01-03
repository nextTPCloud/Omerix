import paypal from '@paypal/checkout-server-sdk';
import config from '../../../config/env';
import Pago from '../Pago';
import Licencia from '../../licencias/Licencia';
import Plan from '../../licencias/Plan';
import AddOn from '../../licencias/AddOn';
import Empresa from '../../empresa/Empresa';
import { prorrateoService } from '../../licencias/prorrateo.service';
import { facturacionSuscripcionService } from '../facturacion-suscripcion.service';
import {
  CreateOrderDTO,
  CreatePayPalSubscriptionDTO,
  CancelPayPalSubscriptionDTO,
  CreatePayPalRefundDTO,
} from './paypal.dto';

console.log('🔵🔵🔵 [PayPal Service V2] CARGADO - Versión con soporte de add-ons 🔵🔵🔵');

// Configurar cliente de PayPal
function getPayPalClient() {
  const environment =
    config.paypal.mode === 'production'
      ? new paypal.core.LiveEnvironment(config.paypal.clientId, config.paypal.clientSecret)
      : new paypal.core.SandboxEnvironment(config.paypal.clientId, config.paypal.clientSecret);

  return new paypal.core.PayPalHttpClient(environment);
}

const client = getPayPalClient();

export class PayPalService {
  
  // ============================================
  // CREAR ORDEN (PAGO ÚNICO)
  // ============================================
  
  async createOrder(empresaId: string, data: CreateOrderDTO) {
    try {
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Crear orden en PayPal
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            description: data.descripcion,
            amount: {
              currency_code: data.moneda,
              value: data.cantidad.toFixed(2),
            },
            custom_id: empresaId, // Para identificar la empresa en webhooks
          },
        ],
        application_context: {
          brand_name: 'Tu ERP SaaS',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/pagos/paypal/success`,
          cancel_url: `${process.env.FRONTEND_URL}/pagos/paypal/cancel`,
        },
      });

      const order = await client.execute(request);

      // Crear registro de pago en nuestra BD
      const pago = await Pago.create({
        empresaId,
        concepto: data.concepto,
        descripcion: data.descripcion,
        cantidad: data.cantidad,
        moneda: data.moneda.toUpperCase(),
        total: data.cantidad,
        pasarela: 'paypal',
        transaccionExternaId: order.result.id,
        clienteExternoId: empresa.paypalCustomerId,
        estado: 'pendiente',
        metodoPago: {
          tipo: 'paypal',
        },
        metadata: data.metadata,
      });

      console.log('✅ PayPal Order creada:', order.result.id);

      // Obtener el link de aprobación
      const approvalLink = order.result.links?.find(
        (link: any) => link.rel === 'approve'
      )?.href;

      return {
        pago,
        orderId: order.result.id,
        approvalUrl: approvalLink,
        order: order.result,
      };
    } catch (error: any) {
      console.error('Error creando orden de PayPal:', error);
      throw new Error(`Error en PayPal: ${error.message}`);
    }
  }

  // ============================================
  // CAPTURAR ORDEN (COMPLETAR PAGO)
  // ============================================

  async captureOrder(empresaId: string, orderId: string) {
    try {
        // Capturar la orden en PayPal
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        // ⚠️ IMPORTANTE: No necesitamos pasar requestBody para capturas simples
        // O si el SDK lo requiere, usar type assertion
        request.requestBody({} as any);

        const capture = await client.execute(request);

        // Actualizar el pago en nuestra BD
        const pago = await Pago.findOne({
          empresaId,
          transaccionExternaId: orderId,
        });

        if (!pago) {
          throw new Error('Pago no encontrado');
        }

        if (capture.result.status === 'COMPLETED') {
          pago.estado = 'completado';
          pago.fechaPago = new Date();
          pago.estadoDetalle = 'Pago completado exitosamente';

          // Buscar licencia y activar add-ons pendientes
          const licencia = await Licencia.findOne({
            $or: [
              { paypalOrderId: orderId },
              { empresaId }
            ]
          });

          if (licencia) {
            console.log(`🔄 Procesando licencia para empresa ${empresaId}, orderId: ${orderId}`);

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
              await this.activarAddOnsPendientes(empresaId, licencia.addOnsPendientes, licencia.tipoSuscripcion);
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
            console.log(`✅ Licencia actualizada correctamente`);
          }
        } else {
          pago.estado = 'procesando';
          pago.estadoDetalle = `Estado: ${capture.result.status}`;
        }

        await pago.save();

        console.log('✅ PayPal Order capturada:', orderId, '- Estado:', pago.estado);

        // Generar factura de suscripción si el pago fue exitoso
        if (pago.estado === 'completado') {
          try {
            const result = await facturacionSuscripcionService.procesarPagoCompletado(String(pago._id));
            console.log(`✅ Factura ${result.factura.numeroFactura} generada, email: ${result.emailEnviado}`);
          } catch (facturaError: any) {
            console.error('Error generando factura de suscripción:', facturaError.message);
            // No fallar la captura por error de facturación
          }
        }

        return {
          pago,
          capture: capture.result,
        };
    } catch (error: any) {
        console.error('Error capturando orden de PayPal:', error);
        throw new Error(`Error capturando orden: ${error.message}`);
    }
  }

  // ============================================
  // OBTENER DETALLES DE ORDEN
  // ============================================
  
  async getOrder(empresaId: string, orderId: string) {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const order = await client.execute(request);

      return order.result;
    } catch (error: any) {
      console.error('Error obteniendo orden de PayPal:', error);
      throw new Error(`Error obteniendo orden: ${error.message}`);
    }
  }

    // ============================================
    // CREAR PLAN DE SUSCRIPCIÓN EN PAYPAL
    // ============================================

    async createPayPalPlan(plan: any, tipoSuscripcion: 'mensual' | 'anual' = 'mensual') {
    try {
        // Crear producto en PayPal (si no existe)
        const productRequest = {
        name: plan.nombre,
        description: plan.descripcion || `Plan ${plan.nombre}`,
        type: 'SERVICE',
        category: 'SOFTWARE',
        };

        const productResponse = await fetch(
        `https://api-m.${config.paypal.mode}.paypal.com/v1/catalogs/products`,
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getAccessToken()}`,
            },
            body: JSON.stringify(productRequest),
        }
        );

        const product = await productResponse.json() as any;

        // Configurar según tipo de suscripción
        const esAnual = tipoSuscripcion === 'anual';
        const precio = esAnual ? plan.precio.anual : plan.precio.mensual;
        const intervalo = esAnual ? 'YEAR' : 'MONTH';

        // Crear plan de suscripción
        const planRequest = {
        product_id: product.id,
        name: `${plan.nombre} (${esAnual ? 'Anual' : 'Mensual'})`,
        description: plan.descripcion || `Suscripción ${esAnual ? 'anual' : 'mensual'} al plan ${plan.nombre}`,
        billing_cycles: [
            {
            frequency: {
                interval_unit: intervalo,
                interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Ilimitado
            pricing_scheme: {
                fixed_price: {
                value: precio.toFixed(2),
                currency_code: 'EUR',
                },
            },
            },
        ],
        payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {
            value: '0',
            currency_code: 'EUR',
            },
            setup_fee_failure_action: 'CONTINUE',
            payment_failure_threshold: 3,
        },
        };

        const planResponse = await fetch(
        `https://api-m.${config.paypal.mode}.paypal.com/v1/billing/plans`,
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getAccessToken()}`,
            },
            body: JSON.stringify(planRequest),
        }
        );

        const paypalPlan = await planResponse.json() as any;

        console.log(`✅ Plan de PayPal creado (${tipoSuscripcion}):`, paypalPlan.id, `- ${precio}€`);

        return paypalPlan.id;
    } catch (error: any) {
        console.error('Error creando plan de PayPal:', error);
        throw new Error(`Error creando plan: ${error.message}`);
    }
    }


    // ============================================
    // CREAR SUSCRIPCIÓN
    // ============================================

    async createSubscription(empresaId: string, data: CreatePayPalSubscriptionDTO) {
    try {
        console.log('🔵 [PayPal V2] createSubscription llamado con:', JSON.stringify(data, null, 2));

        const tipoSuscripcion = data.tipoSuscripcion || 'mensual';
        const esAnual = tipoSuscripcion === 'anual';
        const onlyAddOns = data.onlyAddOns === true;

        console.log('🔵 [PayPal V2] Parámetros:', { tipoSuscripcion, esAnual, onlyAddOns, addOns: data.addOns });

        // Calcular precio total
        let precioTotal = 0;
        let descripcion = '';
        let plan = null;

        // Si NO es solo add-ons, obtener el plan
        if (!onlyAddOns) {
          if (data.planId) {
            plan = await Plan.findById(data.planId);
          } else if (data.planSlug) {
            plan = await Plan.findOne({ slug: data.planSlug, activo: true });
          }
          if (!plan) {
            throw new Error('Plan no encontrado');
          }
          precioTotal = esAnual ? plan.precio.anual : plan.precio.mensual;
          descripcion = `Plan ${plan.nombre} (${esAnual ? 'Anual' : 'Mensual'})`;
        }

        // Calcular precio de add-ons si hay
        const addOnsSlugs = data.addOns || [];
        const addOnsDetails: Array<{ nombre: string; precio: number; precioProrrata?: number }> = [];
        let usaProrrateo = false;
        let prorrateoInfo: any = null;

        if (addOnsSlugs.length > 0) {
          const addOnsData = await AddOn.find({
            slug: { $in: addOnsSlugs },
            activo: true
          });

          // Verificar si debe aplicar prorrateo (solo si tiene plan activo y es solo add-ons)
          const licencia = await Licencia.findOne({ empresaId });
          const tieneActivaPlan = licencia && licencia.estado === 'activa' && !licencia.esTrial;

          if (onlyAddOns && tieneActivaPlan && addOnsSlugs.length > 0) {
            try {
              prorrateoInfo = await prorrateoService.getResumenProrrateo(empresaId, addOnsSlugs);
              usaProrrateo = prorrateoInfo.aplicaProrrata;
              console.log('🔵 [PayPal] Prorrateo calculado:', {
                aplicaProrrata: prorrateoInfo.aplicaProrrata,
                diasRestantes: prorrateoInfo.diasRestantes,
                totalCompleto: prorrateoInfo.totales.totalCompleto,
                totalProrrata: prorrateoInfo.totales.totalProrrata
              });
            } catch (e) {
              console.log('⚠️ [PayPal] No se pudo calcular prorrateo, usando precio completo');
            }
          }

          for (const addon of addOnsData) {
            const precioAddon = esAnual && addon.precioAnual
              ? addon.precioAnual
              : addon.precioMensual;

            // Buscar precio prorrateado si aplica
            let precioProrrata = precioAddon;
            if (usaProrrateo && prorrateoInfo) {
              const desgloseItem = prorrateoInfo.desglose.find((d: any) => d.concepto === addon.nombre);
              if (desgloseItem) {
                precioProrrata = desgloseItem.precioProrrata;
              }
            }

            precioTotal += usaProrrateo ? precioProrrata : precioAddon;
            addOnsDetails.push({
              nombre: addon.nombre,
              precio: precioAddon,
              precioProrrata: usaProrrateo ? precioProrrata : undefined
            });
          }

          if (onlyAddOns) {
            if (usaProrrateo && prorrateoInfo) {
              descripcion = `Add-ons (prorrateado ${prorrateoInfo.diasRestantes} días): ${addOnsDetails.map(a => a.nombre).join(', ')}`;
            } else {
              descripcion = `Add-ons: ${addOnsDetails.map(a => a.nombre).join(', ')}`;
            }
          } else {
            descripcion += ` + ${addOnsDetails.map(a => a.nombre).join(', ')}`;
          }
        }

        if (precioTotal <= 0) {
          throw new Error('El precio total debe ser mayor a 0');
        }

        // Si se usó prorrateo, usar el total con IVA del servicio
        if (usaProrrateo && prorrateoInfo) {
          precioTotal = prorrateoInfo.totales.totalProrrata;
          console.log(`💳 PayPal: Usando precio prorrateado: ${precioTotal}€`);
        }

        console.log(`💳 PayPal: Creando orden por ${precioTotal}€ - ${descripcion}`);

        // Para pagos con add-ons o precio custom, usar ORDER en lugar de SUBSCRIPTION
        // Esto permite un pago único con el precio exacto calculado
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
          intent: 'CAPTURE',
          purchase_units: [
            {
              description: descripcion,
              amount: {
                currency_code: 'EUR',
                value: precioTotal.toFixed(2),
              },
              custom_id: empresaId,
            },
          ],
          application_context: {
            brand_name: 'Omerix ERP',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: `${process.env.FRONTEND_URL}/pagos/paypal/subscription/success`,
            cancel_url: `${process.env.FRONTEND_URL}/pagos/paypal/subscription/cancel`,
          },
        });

        const order = await client.execute(request);

        // Crear registro de pago en nuestra BD
        const pago = await Pago.create({
          empresaId,
          concepto: onlyAddOns ? 'addon' : 'suscripcion',
          descripcion,
          cantidad: precioTotal,
          moneda: 'EUR',
          total: precioTotal,
          pasarela: 'paypal',
          transaccionExternaId: order.result.id,
          estado: 'pendiente',
          metodoPago: { tipo: 'paypal' },
          metadata: {
            planSlug: plan?.slug,
            planNombre: plan?.nombre,
            addOns: addOnsSlugs,
            addOnsDetails,
            tipoSuscripcion,
            onlyAddOns,
          },
        });

        // Guardar add-ons pendientes en licencia (se activarán al capturar pago)
        const licencia = await Licencia.findOne({ empresaId });
        if (licencia) {
          licencia.paypalOrderId = order.result.id; // Guardar order ID para activar después
          if (!onlyAddOns && plan) {
            licencia.planPendiente = plan._id;
          }
          licencia.addOnsPendientes = addOnsSlugs;
          await licencia.save();
        }

        console.log('✅ PayPal Order creada:', order.result.id, '- Precio:', precioTotal, '€');

        // Obtener el link de aprobación
        const approvalLink = order.result.links?.find(
          (link: any) => link.rel === 'approve'
        )?.href;

        return {
          subscriptionId: order.result.id, // Mantener el nombre para compatibilidad
          orderId: order.result.id,
          approvalUrl: approvalLink,
          subscription: order.result,
          pago,
        };
    } catch (error: any) {
        console.error('Error creando suscripción de PayPal:', error);
        throw new Error(`Error en PayPal: ${error.message}`);
    }
    }

  // ============================================
  // ACTIVAR SUSCRIPCIÓN (después del callback de PayPal)
  // ============================================

  async activateSubscription(empresaId: string, subscriptionId: string) {
    try {
      // Obtener detalles de la suscripción desde PayPal
      const response = await fetch(
        `https://api-m.${config.paypal.mode}.paypal.com/v1/billing/subscriptions/${subscriptionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getAccessToken()}`,
          },
        }
      );

      const subscription = await response.json() as any;

      if (subscription.status !== 'ACTIVE' && subscription.status !== 'APPROVED') {
        throw new Error(`La suscripción no está activa. Estado: ${subscription.status}`);
      }

      // Actualizar licencia
      const licencia = await Licencia.findOne({ empresaId });
      if (licencia) {
        // Obtener plan asociado
        const plan = await Plan.findById(licencia.planId);

        licencia.estado = 'activa';
        licencia.esTrial = false;
        licencia.paypalSubscriptionId = subscriptionId;

        // Calcular fecha de renovación
        const dias = licencia.tipoSuscripcion === 'anual' ? 365 : 30;
        licencia.fechaRenovacion = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

        licencia.historial.push({
          fecha: new Date(),
          accion: 'ACTIVACION_PAYPAL',
          planNuevo: plan?.nombre,
          motivo: `Suscripción PayPal activada: ${subscriptionId}`,
        });

        await licencia.save();
        console.log('✅ Licencia activada con PayPal:', empresaId);
      }

      return {
        success: true,
        message: 'Suscripción activada correctamente',
        subscription,
      };
    } catch (error: any) {
      console.error('Error activando suscripción de PayPal:', error);
      throw new Error(`Error activando suscripción: ${error.message}`);
    }
  }

  // ============================================
  // CANCELAR SUSCRIPCIÓN
  // ============================================

  async cancelSubscription(empresaId: string, data: CancelPayPalSubscriptionDTO) {
    try {
      const { subscriptionId, motivo } = data;

      // Cancelar en PayPal
      const response = await fetch(
        `https://api-m.${config.paypal.mode}.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getAccessToken()}`,
          },
          body: JSON.stringify({
            reason: motivo || 'Cancelación por el usuario',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error cancelando suscripción en PayPal');
      }

      // Actualizar licencia
      const licencia = await Licencia.findOne({ empresaId });
      if (licencia) {
        licencia.estado = 'cancelada';
        licencia.fechaCancelacion = new Date();
        licencia.historial.push({
          fecha: new Date(),
          accion: 'CANCELACION',
          motivo: motivo || 'Cancelación por el usuario',
        });
        await licencia.save();
      }

      console.log('✅ Suscripción de PayPal cancelada:', subscriptionId);

      return { success: true, message: 'Suscripción cancelada' };
    } catch (error: any) {
      console.error('Error cancelando suscripción de PayPal:', error);
      throw new Error(`Error cancelando suscripción: ${error.message}`);
    }
  }

    // ============================================
    // CREAR REEMBOLSO (DEVOLUCIÓN)
    // ============================================

    async createRefund(empresaId: string, data: CreatePayPalRefundDTO) {
    try {
        const { captureId, cantidad, motivo } = data;

        // Obtener el pago
        const pago = await Pago.findOne({
        empresaId,
        transaccionExternaId: captureId,
        });

        if (!pago) {
        throw new Error('Pago no encontrado');
        }

        // Crear reembolso en PayPal
        const refundRequest: any = {
        note_to_payer: motivo || 'Reembolso procesado',
        };

        if (cantidad) {
        refundRequest.amount = {
            value: cantidad.toFixed(2),
            currency_code: pago.moneda,
        };
        }

        const response = await fetch(
        `https://api-m.${config.paypal.mode}.paypal.com/v2/payments/captures/${captureId}/refund`,
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getAccessToken()}`,
            },
            body: JSON.stringify(refundRequest),
        }
        );

        const refund = await response.json() as any; // ← AÑADIR 'as any'

        // Actualizar el pago
        pago.estado = 'reembolsado';
        pago.fechaReembolso = new Date();
        pago.estadoDetalle = motivo || 'Reembolso procesado';
        await pago.save();

        console.log('✅ Reembolso de PayPal creado:', refund.id);

        return refund;
    } catch (error: any) {
        console.error('Error creando reembolso de PayPal:', error);
        throw new Error(`Error creando reembolso: ${error.message}`);
    }
 }

  // ============================================
  // OBTENER HISTORIAL DE PAGOS
  // ============================================
  
  async getPaymentHistory(empresaId: string, limit: number = 20) {
    const pagos = await Pago.find({
      empresaId,
      pasarela: 'paypal',
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return pagos;
  }

    // ============================================
    // HELPERS PRIVADOS
    // ============================================

    private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
        `${config.paypal.clientId}:${config.paypal.clientSecret}`
    ).toString('base64');

    const response = await fetch(
        `https://api-m.${config.paypal.mode}.paypal.com/v1/oauth2/token`,
        {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        }
    );

    const data = await response.json() as any; // ← AÑADIR 'as any'
    return data.access_token;
    }

  private async activarLicencia(licenciaId: string) {
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
   */
  private async activarAddOnsPendientes(
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

      // Añadir el add-on a la licencia
      licencia.addOns.push({
        addOnId: addon._id,
        nombre: addon.nombre,
        slug: addon.slug,
        cantidad: addon.cantidad || 1,
        precioMensual: addon.precioMensual,
        activo: true,
        fechaActivacion: new Date(),
      });

      const precio = esAnual && addon.precioAnual ? addon.precioAnual : addon.precioMensual;
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
}