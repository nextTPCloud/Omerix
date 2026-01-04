import Licencia from './Licencia';
import Plan from './Plan';
import AddOn from './AddOn';
import Stripe from 'stripe';
import config from '../../config/env';
import Empresa from '../empresa/Empresa';
import { getTPVRegistradoModel } from '../../utils/dynamic-models.helper';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-10-29.clover',
});

export class LicenciasService {
  
  // Obtener licencia de una empresa
  async getLicenciaByEmpresa(empresaId: string) {
    const licencia = await Licencia.findOne({ empresaId })
      .populate('planId');

    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    let plan = licencia.planId as any;

    // Si el plan no se pobló correctamente (referencia rota), buscar por ID directamente
    if (!plan && licencia.planId) {
      plan = await Plan.findById(licencia.planId);
    }

    if (!plan) {
      throw new Error(`Plan no encontrado para la licencia. PlanId: ${licencia.planId}`);
    }

    // Recalcular conteo de TPVs automáticamente (multi-tenant)
    try {
      const empresa = await Empresa.findById(empresaId);
      if (empresa?.databaseConfig) {
        const TPVRegistrado = await getTPVRegistradoModel(empresaId, empresa.databaseConfig);
        const conteoReal = await TPVRegistrado.countDocuments({ estado: 'activo' });

        // Actualizar si hay diferencia
        if (licencia.usoActual?.tpvsActuales !== conteoReal) {
          licencia.usoActual = licencia.usoActual || {};
          licencia.usoActual.tpvsActuales = conteoReal;
          await licencia.save();
        }
      }
    } catch (error) {
      console.warn('No se pudo recalcular TPVs:', error);
    }

    return {
      licencia: {
        id: licencia._id,
        estado: licencia.estado,
        esTrial: licencia.esTrial,
        fechaRenovacion: licencia.fechaRenovacion,
        tipoSuscripcion: licencia.tipoSuscripcion,
        usoActual: licencia.usoActual,
        addOns: licencia.addOns,
      },
      plan: {
        id: plan._id,
        nombre: plan.nombre,
        slug: plan.slug,
        precio: plan.precio,
        limites: plan.limites,
        modulosIncluidos: plan.modulosIncluidos,
      },
      diasRestantes: licencia.getDiasTrialRestantes(),
      advertencias: this.getAdvertencias(licencia, plan),
    };
  }

  // Obtener advertencias de límites
  private getAdvertencias(licencia: any, plan: any) {
    const advertencias: string[] = [];

    const limites = plan.limites;
    const uso = licencia.usoActual || {};

    // Mapeo de usoActual a limites del plan
    const mapeoLimites: Record<string, { usoKey: string; nombre: string }> = {
      usuariosTotales: { usoKey: 'usuariosActuales', nombre: 'usuarios' },
      facturasMes: { usoKey: 'facturasEsteMes', nombre: 'facturas este mes' },
      productosCatalogo: { usoKey: 'productosActuales', nombre: 'productos' },
      almacenes: { usoKey: 'almacenesActuales', nombre: 'almacenes' },
      clientes: { usoKey: 'clientesActuales', nombre: 'clientes' },
      tpvsActivos: { usoKey: 'tpvsActuales', nombre: 'TPVs' },
      almacenamientoGB: { usoKey: 'almacenamientoUsadoGB', nombre: 'almacenamiento' },
      llamadasAPIDia: { usoKey: 'llamadasAPIHoy', nombre: 'llamadas API hoy' },
      emailsMes: { usoKey: 'emailsEsteMes', nombre: 'emails este mes' },
      smsMes: { usoKey: 'smsEsteMes', nombre: 'SMS este mes' },
      whatsappMes: { usoKey: 'whatsappEsteMes', nombre: 'WhatsApp este mes' },
    };

    // Verificar cada límite
    Object.entries(mapeoLimites).forEach(([limiteKey, { usoKey, nombre }]) => {
      const limite = limites[limiteKey];
      const usoActual = uso[usoKey] || 0;

      if (limite === -1 || limite === undefined) return; // Ilimitado o no definido

      const porcentaje = (usoActual / limite) * 100;

      if (porcentaje >= 100) {
        advertencias.push(`⛔ Límite alcanzado: ${nombre} (${usoActual}/${limite})`);
      } else if (porcentaje >= 80) {
        advertencias.push(`⚠️ ${Math.round(porcentaje)}% de ${nombre} usado (${usoActual}/${limite})`);
      } else if (porcentaje >= 60) {
        advertencias.push(`📊 ${Math.round(porcentaje)}% de ${nombre} usado (${usoActual}/${limite})`);
      }
    });

    return advertencias;
  }

  // Listar todos los planes disponibles
  async getPlanes() {
    const planes = await Plan.find({ activo: true, visible: true }).sort({ 'precio.mensual': 1 });
    return planes;
  }

  // Listar todos los add-ons disponibles
  async getAddOns() {
    const addOns = await AddOn.find({ activo: true, visible: true }).sort({ orden: 1, 'precio.mensual': 1 });
    return addOns;
  }

  // Cambiar plan
  async cambiarPlan(empresaId: string, nuevoPlanSlug: string, tipoSuscripcion: 'mensual' | 'anual') {
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const nuevoPlan = await Plan.findOne({ slug: nuevoPlanSlug, activo: true });
    if (!nuevoPlan) {
      throw new Error('Plan no encontrado');
    }

    const planAnterior = licencia.planId as any;

    // Actualizar licencia
    licencia.planId = nuevoPlan._id as any;
    licencia.tipoSuscripcion = tipoSuscripcion;
    licencia.esTrial = false;
    licencia.estado = 'activa';
    
    // Calcular nueva fecha de renovación
    const dias = tipoSuscripcion === 'mensual' ? 30 : 365;
    licencia.fechaRenovacion = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

    // Añadir al historial
    licencia.historial.push({
      fecha: new Date(),
      accion: 'CAMBIO_PLAN',
      planAnterior: planAnterior.nombre,
      planNuevo: nuevoPlan.nombre,
      motivo: `Cambio a plan ${nuevoPlan.nombre} (${tipoSuscripcion})`,
    } as any);

    await licencia.save();

    console.log(`✅ Plan cambiado: ${planAnterior.nombre} → ${nuevoPlan.nombre}`);

    return {
      success: true,
      message: `Plan actualizado a ${nuevoPlan.nombre}`,
      nuevoPlan: nuevoPlan.nombre,
    };
  }

  // Añadir add-on a la licencia
  async addAddOn(empresaId: string, addOnSlug: string, cantidad: number = 1) {
    const licencia = await Licencia.findOne({ empresaId });
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const addOn = await AddOn.findOne({ slug: addOnSlug, activo: true });
    if (!addOn) {
      throw new Error('Add-on no encontrado');
    }

    // Para add-ons recurrentes, verificar si ya existe
    if (addOn.esRecurrente) {
      const yaExiste = licencia.addOns.some(
        (a: any) => a.slug === addOn.slug && a.activo
      );
      if (yaExiste) {
        throw new Error('Ya tienes este add-on activado');
      }
    }

    // Calcular precio total según cantidad
    const precioTotal = addOn.precioMensual * cantidad;

    // Añadir add-on
    licencia.addOns.push({
      addOnId: addOn._id,
      nombre: addOn.nombre,
      slug: addOn.slug,
      cantidad,
      precioMensual: precioTotal,
      activo: true,
      fechaActivacion: new Date(),
    } as any);

    // Para add-ons no recurrentes (tokens), añadir al contador
    if (!addOn.esRecurrente && addOn.limitesExtra?.tokensIA) {
      // Sumar tokens al uso disponible (implementar lógica de tokens)
    }

    // Añadir al historial
    licencia.historial.push({
      fecha: new Date(),
      accion: 'ADDON_ACTIVADO',
      motivo: `Add-on activado: ${addOn.nombre} x${cantidad}`,
    } as any);

    await licencia.save();

    console.log(`Add-on añadido: ${addOn.nombre} x${cantidad}`);

    return {
      success: true,
      message: `Add-on ${addOn.nombre} añadido correctamente`,
      addOn: {
        nombre: addOn.nombre,
        cantidad,
        precioMensual: precioTotal,
      },
    };
  }

  // Desactivar add-on
  // cancelarAlRenovar: true = sigue activo hasta fin de período, false = cancela inmediatamente
  async removeAddOn(empresaId: string, addOnSlug: string, cancelarAlRenovar: boolean = true) {
    const licencia = await Licencia.findOne({ empresaId });
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const addOnIndex = licencia.addOns.findIndex(
      (a: any) => a.slug === addOnSlug && a.activo
    );

    if (addOnIndex === -1) {
      throw new Error('Add-on no encontrado en tu licencia');
    }

    const addOnInfo = licencia.addOns[addOnIndex];

    // Si tiene suscripción en Stripe, cancelar el item de la suscripción
    if (licencia.stripeSubscriptionId && !cancelarAlRenovar) {
      try {
        const Stripe = (await import('stripe')).default;
        const config = (await import('../../config/env')).default;
        const stripe = new Stripe(config.stripe.secretKey);

        // Buscar el subscription item correspondiente
        const subscription = await stripe.subscriptions.retrieve(licencia.stripeSubscriptionId);
        const addOn = await AddOn.findOne({ slug: addOnSlug });

        if (addOn) {
          // Buscar el price ID del add-on
          const priceId = licencia.tipoSuscripcion === 'anual'
            ? addOn.stripePriceIdAnual
            : addOn.stripePriceId;

          if (priceId) {
            // Buscar el item en la suscripción
            const subscriptionItem = subscription.items.data.find(
              (item: any) => item.price?.id === priceId
            );

            if (subscriptionItem) {
              // Eliminar inmediatamente con prorrateo inverso (genera crédito)
              await stripe.subscriptionItems.del(subscriptionItem.id, {
                proration_behavior: 'create_prorations',
              });
              console.log(`✅ Add-on ${addOnSlug} eliminado de suscripción Stripe con crédito prorrateado`);
            }
          }
        }
      } catch (stripeError: any) {
        console.error('Error cancelando add-on en Stripe:', stripeError.message);
        // Continuar con la cancelación local
      }
    }

    if (cancelarAlRenovar) {
      // Marcar para no renovar pero mantener activo hasta fin de período
      licencia.addOns[addOnIndex].cancelarAlRenovar = true;
      licencia.addOns[addOnIndex].fechaCancelacionProgramada = licencia.fechaRenovacion;

      licencia.historial.push({
        fecha: new Date(),
        accion: 'ADDON_CANCELACION_PROGRAMADA',
        motivo: `Add-on ${addOnInfo.nombre} programado para cancelar en la próxima renovación`,
      } as any);
    } else {
      // Cancelar inmediatamente
      licencia.addOns[addOnIndex].activo = false;
      licencia.addOns[addOnIndex].fechaCancelacion = new Date();

      licencia.historial.push({
        fecha: new Date(),
        accion: 'ADDON_CANCELADO',
        motivo: `Add-on cancelado: ${addOnInfo.nombre}`,
      } as any);
    }

    await licencia.save();

    return {
      success: true,
      message: cancelarAlRenovar
        ? `Add-on ${addOnInfo.nombre} se cancelará en la próxima renovación`
        : `Add-on ${addOnInfo.nombre} cancelado correctamente`,
      canceladoInmediatamente: !cancelarAlRenovar,
      fechaCancelacion: cancelarAlRenovar ? licencia.fechaRenovacion : new Date(),
    };
  }

  // Obtener resumen de facturación
  async getResumenFacturacion(empresaId: string) {
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const plan = licencia.planId as any;

    // Precio base del plan
    const precioPlan = licencia.tipoSuscripcion === 'anual'
      ? plan.precio.anual
      : plan.precio.mensual;

    // Sumar add-ons activos
    const addOnsActivos = licencia.addOns.filter((a: any) => a.activo);
    const precioAddOns = addOnsActivos.reduce(
      (total: number, a: any) => total + (a.precioMensual || 0),
      0
    );

    // Total mensual (para anuales, dividir entre 12)
    const totalMensual = licencia.tipoSuscripcion === 'anual'
      ? (precioPlan / 12) + precioAddOns
      : precioPlan + precioAddOns;

    return {
      plan: {
        nombre: plan.nombre,
        precio: precioPlan,
        tipoSuscripcion: licencia.tipoSuscripcion,
      },
      addOns: addOnsActivos.map((a: any) => ({
        nombre: a.nombre,
        cantidad: a.cantidad,
        precioMensual: a.precioMensual,
      })),
      totales: {
        precioPlan,
        precioAddOns,
        totalMensual: Math.round(totalMensual * 100) / 100,
        proximaFactura: licencia.fechaRenovacion,
      },
    };
  }

  // Cancelar suscripción
  async cancelarSuscripcion(empresaId: string, motivo?: string) {
    const licencia = await Licencia.findOne({ empresaId });
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    licencia.estado = 'cancelada';
    licencia.fechaCancelacion = new Date();

    licencia.historial.push({
      fecha: new Date(),
      accion: 'CANCELACION',
      motivo: motivo || 'Cancelación por el usuario',
    } as any);

    await licencia.save();

    console.log(`✅ Suscripción cancelada: ${empresaId}`);

    return {
      success: true,
      message: 'Suscripción cancelada',
    };
  }

  // ============================================
  // TOGGLE RENOVACIÓN AUTOMÁTICA
  // ============================================

  async toggleRenovacionAutomatica(empresaId: string, activar: boolean) {
    const licencia = await Licencia.findOne({ empresaId });
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    // Actualizar en la pasarela de pago
    if (licencia.stripeSubscriptionId) {
      await this.toggleStripeAutoRenew(licencia.stripeSubscriptionId, activar);
    } else if (licencia.paypalSubscriptionId) {
      await this.togglePayPalAutoRenew(licencia.paypalSubscriptionId, activar);
    }

    // Actualizar en nuestra BD
    licencia.renovacionAutomatica = activar;
    licencia.historial.push({
      fecha: new Date(),
      accion: activar ? 'RENOVACION_ACTIVADA' : 'RENOVACION_DESACTIVADA',
      motivo: activar
        ? 'Renovación automática activada por el usuario'
        : 'Renovación automática desactivada por el usuario',
    } as any);

    await licencia.save();

    console.log(`✅ Renovación automática ${activar ? 'activada' : 'desactivada'}: ${empresaId}`);

    return {
      success: true,
      renovacionAutomatica: activar,
      message: activar
        ? 'Renovación automática activada'
        : 'Renovación automática desactivada. Tu suscripción se cancelará al finalizar el período actual.',
    };
  }

  // Toggle renovación en Stripe
  private async toggleStripeAutoRenew(subscriptionId: string, activar: boolean) {
    try {
      if (activar) {
        // Reactivar suscripción (quitar cancel_at_period_end)
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });
      } else {
        // Cancelar al final del período (no renueva)
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
      console.log(`✅ Stripe: cancel_at_period_end = ${!activar}`);
    } catch (error: any) {
      console.error('Error actualizando suscripción en Stripe:', error);
      throw new Error(`Error en Stripe: ${error.message}`);
    }
  }

  // Toggle renovación en PayPal
  private async togglePayPalAutoRenew(subscriptionId: string, activar: boolean) {
    try {
      const action = activar ? 'activate' : 'suspend';

      const response = await fetch(
        `https://api-m.${config.paypal.mode}.paypal.com/v1/billing/subscriptions/${subscriptionId}/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await this.getPayPalAccessToken()}`,
          },
          body: JSON.stringify({
            reason: activar
              ? 'Reactivación por el usuario'
              : 'Suspensión de renovación por el usuario',
          }),
        }
      );

      if (!response.ok && response.status !== 204) {
        throw new Error(`Error ${action} suscripción PayPal`);
      }

      console.log(`✅ PayPal: suscripción ${action}d`);
    } catch (error: any) {
      console.error('Error actualizando suscripción en PayPal:', error);
      throw new Error(`Error en PayPal: ${error.message}`);
    }
  }

  // Helper para obtener token de PayPal
  private async getPayPalAccessToken(): Promise<string> {
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

    const data = await response.json() as any;
    return data.access_token;
  }

  // Obtener estado de renovación
  async getEstadoRenovacion(empresaId: string) {
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const plan = licencia.planId as any;

    return {
      renovacionAutomatica: licencia.renovacionAutomatica,
      fechaRenovacion: licencia.fechaRenovacion,
      estado: licencia.estado,
      plan: plan.nombre,
      tipoSuscripcion: licencia.tipoSuscripcion,
      pasarela: licencia.stripeSubscriptionId ? 'stripe' :
                licencia.paypalSubscriptionId ? 'paypal' : null,
    };
  }

  // ============================================
  // PERMISOS DISPONIBLES SEGÚN PLAN
  // ============================================

  /**
   * Obtener permisos especiales disponibles según el plan contratado
   * Usado en el frontend para ocultar opciones no disponibles
   */
  async getPermisosDisponibles(empresaId: string) {
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const plan = licencia.planId as any;
    const modulosContratados: string[] = plan.modulosIncluidos || [];

    // Añadir módulos de add-ons activos
    const addOnsActivos = licencia.addOns?.filter((a: any) => a.activo) || [];
    for (const addOn of addOnsActivos) {
      if (addOn.slug && !modulosContratados.includes(addOn.slug)) {
        modulosContratados.push(addOn.slug);
      }
    }

    // Mapeo de módulos a permisos especiales
    const moduloToPermiso: Record<string, string[]> = {
      rrhh: ['accesoRRHH'],
      informes: ['accesoInformes'],
      taller: ['accesoTaller'],
      tpv: ['accesoTPV'],
      contabilidad: ['accesoContabilidad'],
      // Permisos base siempre disponibles
      base: ['accesoVentas', 'accesoCompras', 'accesoAlmacen', 'accesoClientes', 'accesoProveedores'],
    };

    // Permisos siempre disponibles (base del sistema)
    const permisosDisponibles: string[] = [...moduloToPermiso.base];

    // Añadir permisos según módulos contratados
    for (const modulo of modulosContratados) {
      const permisos = moduloToPermiso[modulo];
      if (permisos) {
        permisosDisponibles.push(...permisos);
      }
    }

    // Lista completa de permisos especiales y cuáles están disponibles
    const todosLosPermisos = [
      { key: 'accesoRRHH', label: 'Recursos Humanos', modulo: 'rrhh' },
      { key: 'accesoInformes', label: 'Informes Avanzados', modulo: 'informes' },
      { key: 'accesoTaller', label: 'Gestión de Taller', modulo: 'taller' },
      { key: 'accesoTPV', label: 'Terminal Punto de Venta', modulo: 'tpv' },
      { key: 'accesoContabilidad', label: 'Contabilidad', modulo: 'contabilidad' },
      { key: 'accesoVentas', label: 'Ventas', modulo: 'base' },
      { key: 'accesoCompras', label: 'Compras', modulo: 'base' },
      { key: 'accesoAlmacen', label: 'Almacén', modulo: 'base' },
      { key: 'accesoClientes', label: 'Clientes', modulo: 'base' },
      { key: 'accesoProveedores', label: 'Proveedores', modulo: 'base' },
    ];

    return {
      plan: plan.nombre,
      modulosContratados,
      permisos: todosLosPermisos.map(p => ({
        ...p,
        disponible: permisosDisponibles.includes(p.key),
        requiereUpgrade: !permisosDisponibles.includes(p.key),
      })),
    };
  }

  // ============================================
  // RECALCULAR CONTEO DE TPVS
  // ============================================

  /**
   * Recalcula el conteo de TPVs activos desde la BD de la empresa
   * Útil después de migrar a multi-tenant
   */
  async recalcularConteoTPVs(empresaId: string) {
    // Obtener empresa y su configuración de BD
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    if (!empresa.databaseConfig) {
      throw new Error('Configuración de base de datos no encontrada');
    }

    // Obtener modelo de TPVRegistrado de la BD de empresa
    const TPVRegistrado = await getTPVRegistradoModel(empresaId, empresa.databaseConfig);

    // Contar TPVs activos en la BD de empresa
    const conteoReal = await TPVRegistrado.countDocuments({ estado: 'activo' });

    // Actualizar la licencia con el conteo correcto
    const licencia = await Licencia.findOneAndUpdate(
      { empresaId },
      { $set: { 'usoActual.tpvsActuales': conteoReal } },
      { new: true }
    );

    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    console.log(`✅ Conteo de TPVs recalculado para empresa ${empresaId}: ${conteoReal}`);

    return {
      success: true,
      tpvsActuales: conteoReal,
      message: `Conteo actualizado: ${conteoReal} TPVs activos`,
    };
  }
}