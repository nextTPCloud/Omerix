import paypal from '@paypal/checkout-server-sdk';
import config from '../../../config/env';
import Pago from '../Pago';
import Licencia from '../../licencias/Licencia';
import Plan from '../../licencias/Plan';
import Empresa from '../../empresa/Empresa';
import {
  CreateOrderDTO,
  CreatePayPalSubscriptionDTO,
  CancelPayPalSubscriptionDTO,
  CreatePayPalRefundDTO,
} from './paypal.dto';

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

        // Si es una suscripción, activar la licencia
        if (pago.concepto === 'suscripcion' && pago.metadata?.licenciaId) {
            await this.activarLicencia(String(pago.metadata.licenciaId));
        }
        } else {
        pago.estado = 'procesando';
        pago.estadoDetalle = `Estado: ${capture.result.status}`;
        }

        await pago.save();

        console.log('✅ PayPal Order capturada:', orderId, '- Estado:', pago.estado);

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
        // Obtener plan por ID o slug
        let plan;
        if (data.planId) {
          plan = await Plan.findById(data.planId);
        } else if (data.planSlug) {
          plan = await Plan.findOne({ slug: data.planSlug, activo: true });
        }
        if (!plan) {
          throw new Error('Plan no encontrado');
        }

        // Determinar tipo de suscripción
        const tipoSuscripcion = data.tipoSuscripcion || 'mensual';
        const esAnual = tipoSuscripcion === 'anual';

        // Crear plan en PayPal si no existe para este tipo de suscripción
        // Usamos paypalPlanId para mensual y paypalPlanIdAnual para anual
        let paypalPlanId = esAnual ? plan.paypalPlanIdAnual : plan.paypalPlanId;
        if (!paypalPlanId) {
          paypalPlanId = await this.createPayPalPlan(plan, tipoSuscripcion);
          if (esAnual) {
            plan.paypalPlanIdAnual = paypalPlanId;
          } else {
            plan.paypalPlanId = paypalPlanId;
          }
          await plan.save();
        }

        // Crear suscripción en PayPal
        const subscriptionRequest = {
        plan_id: paypalPlanId,
        application_context: {
            brand_name: 'Tu ERP SaaS',
            locale: 'es-ES',
            user_action: 'SUBSCRIBE_NOW',
            payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
            },
            return_url: `${process.env.FRONTEND_URL}/pagos/paypal/subscription/success`,
            cancel_url: `${process.env.FRONTEND_URL}/pagos/paypal/subscription/cancel`,
        },
        custom_id: empresaId,
        };

        const response = await fetch(
        `https://api-m.${config.paypal.mode}.paypal.com/v1/billing/subscriptions`,
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getAccessToken()}`,
            },
            body: JSON.stringify(subscriptionRequest),
        }
        );

        const subscription = await response.json() as any; // ← AÑADIR 'as any'

        // Guardar en licencia (incluyendo el nuevo plan)
        const licencia = await Licencia.findOne({ empresaId });
        if (licencia) {
          const planAnterior = licencia.planId;
          licencia.paypalSubscriptionId = subscription.id;
          licencia.planId = plan._id; // Actualizar al nuevo plan
          licencia.tipoSuscripcion = data.tipoSuscripcion || 'mensual';
          await licencia.save();
          console.log(`📋 Licencia actualizada: plan ${planAnterior} → ${plan._id}`);
        }

        console.log('✅ Suscripción de PayPal creada:', subscription.id);

        // Obtener el link de aprobación
        const approvalLink = subscription.links?.find(
        (link: any) => link.rel === 'approve'
        )?.href;

        return {
        subscriptionId: subscription.id,
        approvalUrl: approvalLink,
        subscription,
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
}