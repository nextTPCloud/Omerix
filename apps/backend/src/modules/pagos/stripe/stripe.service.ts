import Stripe from 'stripe';
import config from '../../../config/env';
import Pago from '../Pago';
import MetodoPago from '../../formas-pago/MetodoPago';
import Empresa from '../../empresa/Empresa';
import Licencia from '../../licencias/Licencia';
import Plan from '../../licencias/Plan';
import AddOn from '../../licencias/AddOn';
import {
  CreatePaymentIntentDTO,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  CancelSubscriptionDTO,
  AddPaymentMethodDTO,
  CreateRefundDTO,
  CreateCheckoutSessionDTO,
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

      // Obtener licencia para ver add-ons activos
      const licencia = await Licencia.findOne({ empresaId });

      // Obtener o crear customer
      const customerId = await this.getOrCreateCustomer(empresaId);

      // Determinar si es anual o mensual
      const esAnual = data.tipoSuscripcion === 'anual';
      const intervalo = esAnual ? 'year' : 'month';
      const precio = esAnual ? plan.precio.anual : plan.precio.mensual;

      // Crear precio del plan en Stripe si no existe
      let stripePriceId = esAnual ? plan.stripePriceIdAnual : plan.stripePriceId;

      if (!stripePriceId) {
        const price = await stripe.prices.create({
          currency: 'eur',
          unit_amount: Math.round(precio * 100),
          recurring: {
            interval: intervalo,
          },
          product_data: {
            name: `${plan.nombre} (${esAnual ? 'Anual' : 'Mensual'})`,
          },
        });

        stripePriceId = price.id;
        if (esAnual) {
          plan.stripePriceIdAnual = stripePriceId;
        } else {
          plan.stripePriceId = stripePriceId;
        }
        await plan.save();
      }

      // Preparar items de la suscripción (plan + add-ons)
      const items: Stripe.SubscriptionCreateParams.Item[] = [
        { price: stripePriceId }
      ];

      // Añadir add-ons activos como items adicionales
      if (licencia?.addOns && licencia.addOns.length > 0) {
        const addOnsActivos = licencia.addOns.filter((a: any) => a.activo && a.addOnId);

        for (const addOnLicencia of addOnsActivos) {
          const addOn = await AddOn.findById(addOnLicencia.addOnId);
          if (!addOn || !addOn.esRecurrente) continue;

          // Crear precio del add-on en Stripe si no existe
          let addOnPriceId = esAnual ? addOn.stripePriceIdAnual : addOn.stripePriceId;
          const addOnPrecio = esAnual
            ? (addOn.precioAnual || addOn.precioMensual * 12)
            : addOn.precioMensual;

          if (!addOnPriceId) {
            const addOnPrice = await stripe.prices.create({
              currency: 'eur',
              unit_amount: Math.round(addOnPrecio * 100),
              recurring: {
                interval: intervalo,
              },
              product_data: {
                name: `${addOn.nombre} (${esAnual ? 'Anual' : 'Mensual'})`,
              },
            });

            addOnPriceId = addOnPrice.id;
            if (esAnual) {
              addOn.stripePriceIdAnual = addOnPriceId;
            } else {
              addOn.stripePriceId = addOnPriceId;
            }
            await addOn.save();
          }

          // Añadir item con cantidad
          items.push({
            price: addOnPriceId,
            quantity: addOnLicencia.cantidad || 1,
          });

          console.log(`✅ Add-on añadido a suscripción: ${addOn.nombre} x${addOnLicencia.cantidad || 1}`);
        }
      }

      // Crear suscripción en Stripe
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          empresaId,
          planId: String(plan._id),
          tipoSuscripcion: data.tipoSuscripcion || 'mensual',
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
      if (licencia) {
        licencia.stripeSubscriptionId = subscription.id;
        licencia.tipoSuscripcion = data.tipoSuscripcion || 'mensual';
        await licencia.save();
      }

      console.log('✅ Suscripción creada con', items.length, 'items:', subscription.id);

      // Obtener client_secret para confirmar el pago
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const invoiceAny = invoice as any;
      const paymentIntent = invoiceAny?.payment_intent as Stripe.PaymentIntent;

      return {
        subscription,
        clientSecret: paymentIntent?.client_secret,
        subscriptionId: subscription.id,
        itemsCount: items.length,
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
  // CREAR CHECKOUT SESSION (STRIPE HOSTED)
  // ============================================

  async createCheckoutSession(empresaId: string, data: CreateCheckoutSessionDTO) {
    try {
      console.log('🟢 [Stripe] createCheckoutSession llamado con:', JSON.stringify(data, null, 2));

      // Obtener o crear customer
      const customerId = await this.getOrCreateCustomer(empresaId);

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      let plan: any = null;
      const addOnSlugs: string[] = data.addOns || [];

      console.log('🟢 [Stripe] Parámetros:', { onlyAddOns: data.onlyAddOns, planSlug: data.planSlug, addOns: addOnSlugs });

      // Verificar si el usuario tiene una suscripción activa en Stripe
      const licencia = await Licencia.findOne({ empresaId });
      const existingSubscriptionId = licencia?.stripeSubscriptionId;

      // Si solo compra add-ons y tiene suscripción activa, añadir items a la suscripción existente
      if (data.onlyAddOns && existingSubscriptionId && addOnSlugs.length > 0) {
        console.log('🟢 [Stripe] Añadiendo add-ons a suscripción existente:', existingSubscriptionId);

        try {
          // Verificar que la suscripción existe y está activa
          const existingSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId);

          if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
            // Añadir cada add-on como item a la suscripción
            const addedItems: string[] = [];

            for (const slug of addOnSlugs) {
              const addOn = await AddOn.findOne({ slug, activo: true });
              if (!addOn) continue;

              const esAnual = data.tipoSuscripcion === 'anual';
              const precio = esAnual && addOn.precioAnual
                ? addOn.precioAnual
                : addOn.precioMensual;

              // Obtener o crear precio en Stripe
              let addonPriceId = esAnual ? addOn.stripePriceIdAnual : addOn.stripePriceId;

              if (!addonPriceId) {
                const stripePrice = await stripe.prices.create({
                  currency: 'eur',
                  unit_amount: Math.round(precio * 100),
                  recurring: addOn.esRecurrente ? {
                    interval: esAnual ? 'year' : 'month',
                  } : undefined,
                  product_data: {
                    name: `${addOn.nombre} (${esAnual ? 'Anual' : 'Mensual'})`,
                  },
                });

                addonPriceId = stripePrice.id;
                if (esAnual) {
                  addOn.stripePriceIdAnual = addonPriceId;
                } else {
                  addOn.stripePriceId = addonPriceId;
                }
                await addOn.save();
              }

              // Añadir item a la suscripción con proration
              await stripe.subscriptionItems.create({
                subscription: existingSubscriptionId,
                price: addonPriceId,
                quantity: 1,
                proration_behavior: 'create_prorations', // Stripe calcula prorrateo automáticamente
              });

              addedItems.push(addOn.nombre);

              // Activar add-on en la licencia
              const addOnData = {
                addOnId: addOn._id,
                slug: addOn.slug,
                nombre: addOn.nombre,
                precioMensual: addOn.precioMensual,
                cantidad: 1,
                activo: true,
                fechaActivacion: new Date(),
              };

              if (!licencia.addOns) {
                licencia.addOns = [];
              }

              // Verificar si ya existe
              const existingIndex = licencia.addOns.findIndex((a: any) => a.slug === addOn.slug);
              if (existingIndex >= 0) {
                licencia.addOns[existingIndex] = addOnData;
              } else {
                licencia.addOns.push(addOnData);
              }
            }

            await licencia.save();

            console.log('✅ [Stripe] Add-ons añadidos a suscripción existente:', addedItems.join(', '));

            // Calcular monto prorrateado y crear registro de pago + factura
            try {
              const prorrateoInfo = await prorrateoService.getResumenProrrateo(empresaId, addOnSlugs);

              if (prorrateoInfo.totales.totalProrrata > 0) {
                // Crear registro de pago
                const pago = await Pago.create({
                  empresaId,
                  concepto: 'addon',
                  descripcion: `Add-ons (prorrateo): ${addedItems.join(', ')}`,
                  cantidad: prorrateoInfo.totales.subtotalProrrata,
                  moneda: 'EUR',
                  total: prorrateoInfo.totales.totalProrrata,
                  pasarela: 'stripe',
                  transaccionExternaId: `proration-${existingSubscriptionId}-${Date.now()}`,
                  clienteExternoId: customerId,
                  estado: 'completado',
                  fechaPago: new Date(),
                  metodoPago: { tipo: 'tarjeta' },
                  metadata: {
                    addOns: addOnSlugs,
                    tipoSuscripcion: data.tipoSuscripcion,
                    esProrrateo: true,
                    diasRestantes: prorrateoInfo.diasRestantes,
                  },
                });

                console.log(`✅ Pago de prorrateo creado: ${pago._id}`);

                // Generar factura
                const { facturacionSuscripcionService } = await import('../facturacion-suscripcion.service');
                const result = await facturacionSuscripcionService.procesarPagoCompletado(String(pago._id));
                console.log(`✅ Factura ${result.factura.numeroFactura} generada`);
              }
            } catch (prorrateoError: any) {
              console.error('Error creando pago/factura de prorrateo:', prorrateoError.message);
              // No fallar - los add-ons ya están activados
            }

            // Devolver URL de éxito directamente (no hay checkout, el pago se hace con prorrateo)
            return {
              sessionId: 'direct-' + existingSubscriptionId,
              url: data.successUrl.replace('{CHECKOUT_SESSION_ID}', 'subscription-updated'),
              message: `Add-ons añadidos: ${addedItems.join(', ')}. El importe prorrateado se cargará a tu método de pago.`,
            };
          }
        } catch (subscriptionError: any) {
          console.log('⚠️ [Stripe] Suscripción no encontrada o inactiva, creando nueva checkout session');
          // Continuar con la creación de checkout session normal
        }
      }

      // Si no es solo add-ons, obtener el plan
      if (!data.onlyAddOns && data.planSlug) {
        plan = await Plan.findOne({ slug: data.planSlug, activo: true });
        if (!plan) {
          throw new Error('Plan no encontrado');
        }

        // Determinar precio según tipo de suscripción
        const precio = data.tipoSuscripcion === 'anual'
          ? plan.precio.anual
          : plan.precio.mensual;

        // Crear o recuperar el precio en Stripe
        let stripePriceId: string;

        if (data.tipoSuscripcion === 'anual' && plan.stripePriceIdAnual) {
          stripePriceId = plan.stripePriceIdAnual;
        } else if (data.tipoSuscripcion === 'mensual' && plan.stripePriceId) {
          stripePriceId = plan.stripePriceId;
        } else {
          // Crear precio en Stripe si no existe
          const stripePrice = await stripe.prices.create({
            currency: 'eur',
            unit_amount: Math.round(precio * 100),
            recurring: {
              interval: data.tipoSuscripcion === 'anual' ? 'year' : 'month',
            },
            product_data: {
              name: `Plan ${plan.nombre} (${data.tipoSuscripcion})`,
            },
          });

          stripePriceId = stripePrice.id;

          // Guardar para futuras referencias
          if (data.tipoSuscripcion === 'anual') {
            plan.stripePriceIdAnual = stripePriceId;
          } else {
            plan.stripePriceId = stripePriceId;
          }
          await plan.save();
        }

        lineItems.push({
          price: stripePriceId,
          quantity: 1,
        });
      }

      // Procesar add-ons
      if (addOnSlugs.length > 0) {
        const addOns = await AddOn.find({ slug: { $in: addOnSlugs }, activo: true });

        for (const addOn of addOns) {
          const precio = data.tipoSuscripcion === 'anual' && addOn.precioAnual
            ? addOn.precioAnual
            : addOn.precioMensual;

          // Crear precio en Stripe para el add-on
          const stripePriceKey = data.tipoSuscripcion === 'anual'
            ? 'stripePriceIdAnual'
            : 'stripePriceId';

          let addonPriceId = (addOn as any)[stripePriceKey];

          if (!addonPriceId) {
            const stripePrice = await stripe.prices.create({
              currency: 'eur',
              unit_amount: Math.round(precio * 100),
              recurring: addOn.esRecurrente ? {
                interval: data.tipoSuscripcion === 'anual' ? 'year' : 'month',
              } : undefined,
              product_data: {
                name: `${addOn.nombre} (${data.tipoSuscripcion})`,
              },
            });

            addonPriceId = stripePrice.id;
            (addOn as any)[stripePriceKey] = addonPriceId;
            await addOn.save();
          }

          lineItems.push({
            price: addonPriceId,
            quantity: 1,
          });
        }
      }

      // Verificar que hay al menos un item
      if (lineItems.length === 0) {
        throw new Error('Debes seleccionar al menos un plan o add-on');
      }

      // Crear Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: lineItems,
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          empresaId,
          planId: plan ? String(plan._id) : '',
          planSlug: plan?.slug || '',
          tipoSuscripcion: data.tipoSuscripcion,
          addOns: addOnSlugs.join(','),
          onlyAddOns: data.onlyAddOns ? 'true' : 'false',
        },
        subscription_data: {
          metadata: {
            empresaId,
            planId: plan ? String(plan._id) : '',
            addOns: addOnSlugs.join(','),
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
        },
        locale: 'es',
      });

      console.log('✅ Stripe Checkout Session creada:', session.id);

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error: any) {
      console.error('Error creando Checkout Session:', error);
      throw new Error(`Error en Stripe: ${error.message}`);
    }
  }

  // ============================================
  // SEPA DIRECT DEBIT
  // ============================================

  /**
   * Crear SetupIntent para SEPA Direct Debit
   * El cliente debe proporcionar su IBAN y aceptar el mandato
   */
  async createSepaSetupIntent(empresaId: string) {
    try {
      const customerId = await this.getOrCreateCustomer(empresaId);

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['sepa_debit'],
        usage: 'off_session', // Para cobros recurrentes
        metadata: {
          empresaId,
          tipo: 'sepa_debit',
        },
      });

      console.log('✅ SEPA SetupIntent creado:', setupIntent.id);

      return {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret,
      };
    } catch (error: any) {
      console.error('Error creando SEPA SetupIntent:', error);
      throw new Error(`Error en Stripe SEPA: ${error.message}`);
    }
  }

  /**
   * Confirmar SetupIntent SEPA con los datos del cliente
   */
  async confirmSepaSetup(
    empresaId: string,
    setupIntentId: string,
    iban: string,
    nombreTitular: string,
    email: string
  ) {
    try {
      const customerId = await this.getOrCreateCustomer(empresaId);

      // Crear PaymentMethod SEPA
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'sepa_debit',
        sepa_debit: {
          iban,
        },
        billing_details: {
          name: nombreTitular,
          email,
        },
      });

      // Adjuntar al customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId,
      });

      // Confirmar el SetupIntent
      const setupIntent = await stripe.setupIntents.confirm(setupIntentId, {
        payment_method: paymentMethod.id,
        mandate_data: {
          customer_acceptance: {
            type: 'online',
            online: {
              ip_address: '0.0.0.0', // Se puede pasar la IP real del cliente
              user_agent: 'OmerixERP',
            },
          },
        },
      });

      // Guardar como método de pago predeterminado
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // Guardar en nuestra BD
      const metodoPago = await MetodoPago.create({
        empresaId,
        tipo: 'sepa',
        iban: `****${iban.slice(-4)}`, // Solo últimos 4 dígitos por seguridad
        nombreTitular,
        stripePaymentMethodId: paymentMethod.id,
        stripeCustomerId: customerId,
        predeterminado: true,
        activo: true,
        verificado: setupIntent.status === 'succeeded',
        fechaVerificacion: new Date(),
      });

      // Desmarcar otros métodos como predeterminados
      await MetodoPago.updateMany(
        { empresaId, _id: { $ne: metodoPago._id }, predeterminado: true },
        { predeterminado: false }
      );

      console.log('✅ SEPA configurado correctamente:', paymentMethod.id);

      return {
        success: true,
        metodoPago,
        status: setupIntent.status,
        message: 'Domiciliación bancaria SEPA configurada correctamente',
      };
    } catch (error: any) {
      console.error('Error confirmando SEPA:', error);
      throw new Error(`Error configurando SEPA: ${error.message}`);
    }
  }

  /**
   * Crear suscripción con SEPA Direct Debit
   */
  async createSepaSubscription(
    empresaId: string,
    planId: string,
    tipoSuscripcion: 'mensual' | 'anual' = 'mensual'
  ) {
    try {
      // Verificar que tiene método SEPA configurado
      const metodoPago = await MetodoPago.findOne({
        empresaId,
        tipo: 'sepa',
        activo: true,
        verificado: true,
      });

      if (!metodoPago || !metodoPago.stripePaymentMethodId) {
        throw new Error('No tienes una cuenta SEPA configurada. Configúrala primero.');
      }

      // Crear suscripción con el método SEPA
      const result = await this.createSubscription(empresaId, {
        planId,
        tipoSuscripcion,
        paymentMethodId: metodoPago.stripePaymentMethodId,
      });

      console.log('✅ Suscripción SEPA creada:', result.subscriptionId);

      return {
        ...result,
        metodoPago: 'sepa_debit',
        message: 'Suscripción creada con domiciliación bancaria SEPA',
      };
    } catch (error: any) {
      console.error('Error creando suscripción SEPA:', error);
      throw new Error(`Error en suscripción SEPA: ${error.message}`);
    }
  }

  /**
   * Obtener métodos de pago SEPA del cliente
   */
  async getSepaPaymentMethods(empresaId: string) {
    const metodos = await MetodoPago.find({
      empresaId,
      tipo: 'sepa',
      activo: true,
    }).sort({ predeterminado: -1, createdAt: -1 });

    return metodos;
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