import Licencia from './Licencia';
import Plan from './Plan';
import AddOn from './AddOn';

export class LicenciasService {
  
  // Obtener licencia de una empresa
  async getLicenciaByEmpresa(empresaId: string) {
    const licencia = await Licencia.findOne({ empresaId })
      .populate('planId');

    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const plan = licencia.planId as any;

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
    const addOns = await AddOn.find({ activo: true }).sort({ precioMensual: 1 });
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
  async removeAddOn(empresaId: string, addOnSlug: string) {
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

    // Marcar como inactivo
    licencia.addOns[addOnIndex].activo = false;
    licencia.addOns[addOnIndex].fechaCancelacion = new Date();

    // Añadir al historial
    licencia.historial.push({
      fecha: new Date(),
      accion: 'ADDON_CANCELADO',
      motivo: `Add-on cancelado: ${licencia.addOns[addOnIndex].nombre}`,
    } as any);

    await licencia.save();

    return {
      success: true,
      message: 'Add-on cancelado correctamente',
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
}