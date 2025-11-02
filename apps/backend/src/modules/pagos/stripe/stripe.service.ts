import Stripe from 'stripe';
import config from '../../../config/env';
import Pago from '../../../models/Pago';
import MetodoPago from '../../../models/MetodoPago';
import Empresa from '../../../models/Empresa';
import Licencia from '../../../models/Licencia';
import Plan from '../../../models/Plan';
import {
  CreatePaymentIntentDTO,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  CancelSubscriptionDTO,
  AddPaymentMethodDTO,
  CreateRefundDTO,
} from './stripe.dto';

// Inicializar Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-10-29.clover',
});

export class StripeService {
  
  // ============================================
  // CREAR O OBTENER CUSTOMER DE STRIPE
  // ============================================
  
  async getOrCreateCustomer(empresaId: string): Promise<string> {
    const empresa = await Empresa.findById(empresaId);
    
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }

    // Si ya tiene customerId en Stripe, devolverlo
    if (empresa.stripeCustomerId) {
      return empresa.stripeCustomerId;
    }

    // Crear nuevo customer en Stripe
    const customer = await stripe.customers.create({
      email: empresa.email,
      name: empresa.nombre,
      metadata: {
        empresaId: String(empresa._id),
        nif: empresa.nif,
      },
    });

    // Guardar el customerId en la empresa
    empresa.stripeCustomerId = customer.id;
    await empresa.save();

    console.log('✅ Stripe Customer creado:', customer.id);

    return customer.id;
  }

  // ============================================
  // CREAR INTENCIÓN DE PAGO (PAYMENT INTENT)
  // ============================================
  
  async createPaymentIntent(empresaId: string, data: CreatePaymentIntentDTO) {
    try {
      // Obtener o crear customer
      const customerId = await this.getOrCreateCustomer(empresaId);

      // Crear Payment Intent en Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.cantidad * 100), // Convertir a centavos
        currency: data.moneda,
        customer: customerId,
        description: data.descripcion,
        metadata: {
          empresaId,
          concepto: data.concepto,
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Crear registro de pago en nuestra BD
      const pago = await Pago.create({
        empresaId,
        concepto: data.concepto,
        descripcion: data.descripcion,
        cantidad: data.cantidad,
        moneda: data.moneda.toUpperCase(),
        total: data.cantidad,
        pasarela: 'stripe',
        transaccionExternaId: paymentIntent.id,
        clienteExternoId: customerId,
        estado: 'pendiente',
        metodoPago: {
          tipo: 'tarjeta',
        },
        metadata: data.metadata,
      });

      console.log('✅ Payment Intent creado:', paymentIntent.id);

      return {
        pago,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('Error creando Payment Intent:', error);
      throw new Error(`Error en Stripe: ${error.message}`);
    }
  }

  // ============================================
  // CONFIRMAR PAGO
  // ============================================
  
  async confirmPayment(empresaId: string, paymentIntentId: string) {
    try {
      // Obtener el Payment Intent de Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Actualizar el pago en nuestra BD
      const pago = await Pago.findOne({
        empresaId,
        transaccionExternaId: paymentIntentId,
      });

      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      // Actualizar según el estado del Payment Intent
      if (paymentIntent.status === 'succeeded') {
        pago.estado = 'completado';
        pago.fechaPago = new Date();
        pago.estadoDetalle = 'Pago completado exitosamente';

        // Si es una suscripción, activar la licencia
        if (pago.concepto === 'suscripcion' && pago.metadata?.licenciaId) {
          await this.activarLicencia(String(pago.metadata.licenciaId));
        }
      } else if (paymentIntent.status === 'processing') {
        pago.estado = 'procesando';
        pago.estadoDetalle = 'Pago en proceso';
      } else if (paymentIntent.status === 'requires_payment_method') {
        pago.estado = 'fallido';
        pago.estadoDetalle = 'Método de pago rechazado';
      } else {
        pago.estado = 'fallido';
        pago.estadoDetalle = `Estado: ${paymentIntent.status}`;
      }

      await pago.save();

      console.log('✅ Pago confirmado:', paymentIntent.id, '- Estado:', pago.estado);

      return pago;
    } catch (error: any) {
      console.error('Error confirmando pago:', error);
      throw new Error(`Error confirmando pago: ${error.message}`);
    }
  }

  // ============================================
  // CREAR SUSCRIPCIÓN RECURRENTE
  // ============================================
  
  async createSubscription(empresaId: string, data: CreateSubscriptionDTO) {
    try {
      // Obtener plan
      const plan = await Plan.findById(data.planId);
      if (!plan) {
        throw new Error('Plan no encontrado');
      }

      // Obtener o crear customer
      const customerId = await this.getOrCreateCustomer(empresaId);

      // Crear precio en Stripe si no existe
      let stripePriceId = plan.stripePriceId;

      if (!stripePriceId) {
        const price = await stripe.prices.create({
          currency: 'eur',
          unit_amount: Math.round(plan.precio.mensual * 100),
          recurring: {
            interval: 'month',
          },
          product_data: {
            name: plan.nombre,
          },
        });

        stripePriceId = price.id;
        plan.stripePriceId = stripePriceId;
        await plan.save();
      }

      // Crear suscripción en Stripe
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          empresaId,
          planId: String(plan._id),
        },
      };

      // Añadir método de pago si se proporciona
      if (data.paymentMethodId) {
        subscriptionData.default_payment_method = data.paymentMethodId;
      }

      // Añadir trial si se proporciona
      if (data.trialDays && data.trialDays > 0) {
        subscriptionData.trial_period_days = data.trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      // Guardar suscripción en la licencia
      const licencia = await Licencia.findOne({ empresaId });
      if (licencia) {
        licencia.stripeSubscriptionId = subscription.id;
        await licencia.save();
      }

      console.log('✅ Suscripción creada:', subscription.id);

      // Obtener client_secret para confirmar el pago
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const invoiceAny = invoice as any; 
      const paymentIntent = invoiceAny?.payment_intent as Stripe.PaymentIntent; 
      
      return {
        subscription,
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
      };
    } catch (error: any) {
      console.error('Error creando suscripción:', error);
      throw new Error(`Error en Stripe: ${error.message}`);
    }
  }

  // ============================================
  // ACTUALIZAR SUSCRIPCIÓN (UPGRADE/DOWNGRADE)
  // ============================================
  
  async updateSubscription(empresaId: string, data: UpdateSubscriptionDTO) {
    try {
      const { subscriptionId, nuevoPlanId, prorrateo } = data;

      // Obtener nuevo plan
      const nuevoPlan = await Plan.findById(nuevoPlanId);
      if (!nuevoPlan || !nuevoPlan.stripePriceId) {
        throw new Error('Plan no encontrado o no tiene precio en Stripe');
      }

      // Obtener suscripción actual
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Actualizar suscripción
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: nuevoPlan.stripePriceId,
        }],
        proration_behavior: prorrateo ? 'create_prorations' : 'none',
        metadata: {
          empresaId,
          planId: String(nuevoPlan._id),
        },
      });

      // Actualizar licencia
      const licencia = await Licencia.findOne({ empresaId });
      if (licencia) {
        licencia.planId = nuevoPlan._id as any;
        licencia.historial.push({
          fecha: new Date(),
          accion: 'CAMBIO_PLAN',
          planNuevo: nuevoPlan.nombre,
          motivo: 'Cambio de plan mediante Stripe',
        });
        await licencia.save();
      }

      console.log('✅ Suscripción actualizada:', subscriptionId);

      return updatedSubscription;
    } catch (error: any) {
      console.error('Error actualizando suscripción:', error);
      throw new Error(`Error en Stripe: ${error.message}`);
    }
  }

  // ============================================
  // CANCELAR SUSCRIPCIÓN
  // ============================================
  
  async cancelSubscription(empresaId: string, data: CancelSubscriptionDTO) {
    try {
      const { subscriptionId, inmediato, motivo } = data;

      let canceledSubscription;

      if (inmediato) {
        // Cancelar inmediatamente
        canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      } else {
        // Cancelar al final del período
        canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Actualizar licencia
      const licencia = await Licencia.findOne({ empresaId });
      if (licencia) {
        if (inmediato) {
          licencia.estado = 'cancelada';
          licencia.fechaCancelacion = new Date();
        } else {
          licencia.estado = 'activa'; // Se mantiene activa hasta el final del período
        }
        
        licencia.historial.push({
          fecha: new Date(),
          accion: 'CANCELACION',
          motivo: motivo || 'Cancelación por el usuario',
        });
        
        await licencia.save();
      }

      console.log('✅ Suscripción cancelada:', subscriptionId);

      return canceledSubscription;
    } catch (error: any) {
      console.error('Error cancelando suscripción:', error);
      throw new Error(`Error en Stripe: ${error.message}`);
    }
  }

    // ============================================
    // AÑADIR MÉTODO DE PAGO
    // ============================================

    async addPaymentMethod(empresaId: string, data: AddPaymentMethodDTO) {
    try {
        const { paymentMethodId, setPredeterminado } = data;

        // Obtener o crear customer
        const customerId = await this.getOrCreateCustomer(empresaId);

        // Adjuntar método de pago al customer
        const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        // Si es predeterminado, actualizar en Stripe
        if (setPredeterminado) {
        await stripe.customers.update(customerId, {
            invoice_settings: {
            default_payment_method: paymentMethodId,
            },
        });

        // Desmarcar otros métodos como predeterminados
        await MetodoPago.updateMany(
            { empresaId, predeterminado: true },
            { predeterminado: false }
        );
        }

        // Guardar en nuestra BD ← ARREGLAR AQUÍ
        const metodoPago = await MetodoPago.create({
        empresaId,
        tipo: 'tarjeta',
        ultimos4: paymentMethod.card?.last4 || undefined, // ← Convertir null a undefined
        marca: paymentMethod.card?.brand || undefined, // ← Convertir null a undefined
        expMes: paymentMethod.card?.exp_month || undefined,
        expAno: paymentMethod.card?.exp_year || undefined,
        stripePaymentMethodId: paymentMethodId,
        stripeCustomerId: customerId,
        predeterminado: setPredeterminado,
        activo: true,
        verificado: true,
        fechaVerificacion: new Date(),
        });

        console.log('✅ Método de pago añadido:', paymentMethodId);

        return metodoPago;
    } catch (error: any) {
        console.error('Error añadiendo método de pago:', error);
        throw new Error(`Error en Stripe: ${error.message}`);
    }
    }


  // ============================================
  // ELIMINAR MÉTODO DE PAGO
  // ============================================
  
  async removePaymentMethod(empresaId: string, metodoPagoId: string) {
    try {
      const metodoPago = await MetodoPago.findOne({
        _id: metodoPagoId,
        empresaId,
      });

      if (!metodoPago) {
        throw new Error('Método de pago no encontrado');
      }

      // Desadjuntar de Stripe
      if (metodoPago.stripePaymentMethodId) {
        await stripe.paymentMethods.detach(metodoPago.stripePaymentMethodId);
      }

      // Eliminar de nuestra BD
      await metodoPago.deleteOne();

      console.log('✅ Método de pago eliminado:', metodoPagoId);

      return { success: true, message: 'Método de pago eliminado' };
    } catch (error: any) {
      console.error('Error eliminando método de pago:', error);
      throw new Error(`Error en Stripe: ${error.message}`);
    }
  }

  // ============================================
  // CREAR REEMBOLSO
  // ============================================
  
  async createRefund(empresaId: string, data: CreateRefundDTO) {
    try {
      const { paymentIntentId, cantidad, motivo, descripcion } = data;

      // Obtener el pago
      const pago = await Pago.findOne({
        empresaId,
        transaccionExternaId: paymentIntentId,
      });

      if (!pago) {
        throw new Error('Pago no encontrado');
      }

      // Crear reembolso en Stripe
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: motivo,
      };

      if (cantidad) {
        refundData.amount = Math.round(cantidad * 100);
      }

      const refund = await stripe.refunds.create(refundData);

      // Actualizar el pago
      pago.estado = 'reembolsado';
      pago.fechaReembolso = new Date();
      pago.estadoDetalle = descripcion || 'Reembolso procesado';
      await pago.save();

      console.log('✅ Reembolso creado:', refund.id);

      return refund;
    } catch (error: any) {
      console.error('Error creando reembolso:', error);
      throw new Error(`Error en Stripe: ${error.message}`);
    }
  }

  // ============================================
  // OBTENER MÉTODOS DE PAGO
  // ============================================
  
  async getPaymentMethods(empresaId: string) {
    const metodos = await MetodoPago.find({
      empresaId,
      activo: true,
    }).sort({ predeterminado: -1, createdAt: -1 });

    return metodos;
  }

  // ============================================
  // OBTENER HISTORIAL DE PAGOS
  // ============================================
  
  async getPaymentHistory(empresaId: string, limit: number = 20) {
    const pagos = await Pago.find({ empresaId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return pagos;
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  private async activarLicencia(licenciaId: string) {
    const licencia = await Licencia.findById(licenciaId);
    if (licencia && licencia.estado === 'trial') {
      licencia.estado = 'activa';
      licencia.esTrial = false;
      await licencia.save();
      console.log('✅ Licencia activada:', licenciaId);
    }
  }
}