import Licencia from '../../models/Licencia';
import Plan from '../../models/Plan';
import AddOn from '../../models/AddOn';

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
        diasTrialRestantes: licencia.getDiasTrialRestantes(),
        fechaRenovacion: licencia.fechaRenovacion,
        tipoSuscripcion: licencia.tipoSuscripcion,
      },
      plan: {
        id: plan._id,
        nombre: plan.nombre,
        slug: plan.slug,
        precio: plan.precio,
        limites: plan.limites,
        modulosIncluidos: plan.modulosIncluidos,
      },
      uso: licencia.usoActual,
      addOns: licencia.addOns,
      advertencias: this.getAdvertencias(licencia, plan),
    };
  }

  // Obtener advertencias de límites
    private getAdvertencias(licencia: any, plan: any) {
    const advertencias: Array<{
        tipo: 'critico' | 'alerta' | 'aviso';
        limite: string;
        mensaje: string;
        porcentaje: number;
        uso: number;
        limiteMaximo: number;
    }> = []; // ← Definir el tipo del array aquí

    const limites = plan.limites;
    const uso = licencia.usoActual;

    // Verificar cada límite
    Object.keys(limites).forEach((key) => {
        const limite = limites[key];
        const usoActual = uso[key] || 0;

        if (limite === -1) return; // Ilimitado

        const porcentaje = (usoActual / limite) * 100;

        if (porcentaje >= 100) {
        advertencias.push({
            tipo: 'critico',
            limite: key,
            mensaje: `Has alcanzado el límite de ${key}`,
            porcentaje: 100,
            uso: usoActual,
            limiteMaximo: limite,
        });
        } else if (porcentaje >= 90) {
        advertencias.push({
            tipo: 'alerta',
            limite: key,
            mensaje: `Estás cerca del límite de ${key}`,
            porcentaje: Math.round(porcentaje),
            uso: usoActual,
            limiteMaximo: limite,
        });
        } else if (porcentaje >= 80) {
        advertencias.push({
            tipo: 'aviso',
            limite: key,
            mensaje: `Has usado el ${Math.round(porcentaje)}% de ${key}`,
            porcentaje: Math.round(porcentaje),
            uso: usoActual,
            limiteMaximo: limite,
        });
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

  // Añadir add-on
  async addAddOn(empresaId: string, addOnSlug: string) {
    const licencia = await Licencia.findOne({ empresaId });
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const addOn = await AddOn.findOne({ slug: addOnSlug, activo: true });
    if (!addOn) {
      throw new Error('Add-on no encontrado');
    }

    // Verificar si ya tiene el add-on
    const yaExiste = licencia.addOns.some((a: any) => a.nombre === addOn.nombre);
    if (yaExiste) {
      throw new Error('Ya tienes este add-on activado');
    }

    // Añadir add-on
    licencia.addOns.push({
      nombre: addOn.nombre,
      precioMensual: addOn.precioMensual,
      activo: true,
      fechaActivacion: new Date(),
    } as any);

    await licencia.save();

    console.log(`✅ Add-on añadido: ${addOn.nombre}`);

    return {
      success: true,
      message: `Add-on ${addOn.nombre} añadido correctamente`,
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