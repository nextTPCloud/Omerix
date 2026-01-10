import Licencia from './Licencia';
import Plan from './Plan';
import AddOn from './AddOn';

/**
 * Servicio de cálculo de prorrateo
 *
 * Calcula el importe proporcional cuando un usuario compra
 * add-ons o hace upgrade de plan fuera del ciclo de facturación.
 *
 * Estrategia: Unificar todas las fechas de renovación al ciclo del plan principal.
 * Cuando se compra un add-on, se cobra solo la parte proporcional hasta
 * la próxima renovación del plan.
 */
export class ProrrateoService {
  /**
   * Calcular días restantes hasta la próxima renovación
   */
  calcularDiasRestantes(fechaRenovacion: Date): number {
    const ahora = new Date();
    const renovacion = new Date(fechaRenovacion);

    // Normalizar a medianoche
    ahora.setHours(0, 0, 0, 0);
    renovacion.setHours(0, 0, 0, 0);

    const diffMs = renovacion.getTime() - ahora.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diasRestantes);
  }

  /**
   * Calcular el período completo según el tipo de suscripción
   */
  getDiasCiclo(tipoSuscripcion: 'mensual' | 'anual'): number {
    return tipoSuscripcion === 'anual' ? 365 : 30;
  }

  /**
   * Calcular precio prorrateado de un importe
   */
  calcularProrrata(
    precioCompleto: number,
    diasRestantes: number,
    diasCiclo: number
  ): number {
    if (diasRestantes >= diasCiclo) {
      return precioCompleto;
    }

    const prorrata = (precioCompleto / diasCiclo) * diasRestantes;
    return Math.round(prorrata * 100) / 100;
  }

  /**
   * Calcular prorrateo para add-ons de una licencia
   */
  async calcularProrrateoAddOns(
    empresaId: string,
    addOnSlugs: string[]
  ): Promise<{
    diasRestantes: number;
    diasCiclo: number;
    fechaRenovacion: Date;
    tipoSuscripcion: 'mensual' | 'anual';
    addOns: Array<{
      slug: string;
      nombre: string;
      precioCompleto: number;
      precioProrrata: number;
      diasCobrados: number;
    }>;
    totales: {
      subtotalCompleto: number;
      subtotalProrrata: number;
      ahorro: number;
      porcentajeProrrata: number;
    };
  }> {
    // Obtener licencia
    const licencia = await Licencia.findOne({ empresaId });
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const tipoSuscripcion = licencia.tipoSuscripcion || 'mensual';
    const fechaRenovacion = licencia.fechaRenovacion || new Date();
    const diasCiclo = this.getDiasCiclo(tipoSuscripcion);
    const diasRestantes = this.calcularDiasRestantes(fechaRenovacion);

    // Obtener add-ons
    const addOnsData = await AddOn.find({
      slug: { $in: addOnSlugs },
      activo: true,
    });

    const esAnual = tipoSuscripcion === 'anual';
    let subtotalCompleto = 0;
    let subtotalProrrata = 0;

    const addOnsCalculados = addOnsData.map((addon) => {
      const precioCompleto = esAnual && addon.precio?.anual
        ? addon.precio.anual
        : (addon.precio?.mensual || 0) * (esAnual ? 12 : 1);

      const precioProrrata = this.calcularProrrata(
        precioCompleto,
        diasRestantes,
        diasCiclo
      );

      subtotalCompleto += precioCompleto;
      subtotalProrrata += precioProrrata;

      return {
        slug: addon.slug,
        nombre: addon.nombre,
        precioCompleto,
        precioProrrata,
        diasCobrados: diasRestantes,
      };
    });

    return {
      diasRestantes,
      diasCiclo,
      fechaRenovacion,
      tipoSuscripcion,
      addOns: addOnsCalculados,
      totales: {
        subtotalCompleto,
        subtotalProrrata,
        ahorro: subtotalCompleto - subtotalProrrata,
        porcentajeProrrata: Math.round((diasRestantes / diasCiclo) * 100),
      },
    };
  }

  /**
   * Calcular prorrateo para cambio de plan
   */
  async calcularProrrateoCambioPlan(
    empresaId: string,
    nuevoPlanSlug: string
  ): Promise<{
    diasRestantes: number;
    diasCiclo: number;
    fechaRenovacion: Date;
    tipoSuscripcion: 'mensual' | 'anual';
    planActual: {
      nombre: string;
      precio: number;
    };
    planNuevo: {
      nombre: string;
      precio: number;
    };
    diferencia: {
      precioCompleto: number;
      precioProrrata: number;
      esUpgrade: boolean;
    };
  }> {
    // Obtener licencia con plan actual
    const licencia = await Licencia.findOne({ empresaId }).populate('planId');
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const planActual = licencia.planId as any;
    const tipoSuscripcion = licencia.tipoSuscripcion || 'mensual';
    const esAnual = tipoSuscripcion === 'anual';
    const fechaRenovacion = licencia.fechaRenovacion || new Date();
    const diasCiclo = this.getDiasCiclo(tipoSuscripcion);
    const diasRestantes = this.calcularDiasRestantes(fechaRenovacion);

    // Obtener nuevo plan
    const nuevoPlan = await Plan.findOne({ slug: nuevoPlanSlug, activo: true });
    if (!nuevoPlan) {
      throw new Error('Plan no encontrado');
    }

    // Calcular precios
    const precioPlanActual = esAnual ? planActual.precio.anual : planActual.precio.mensual;
    const precioPlanNuevo = esAnual ? nuevoPlan.precio.anual : nuevoPlan.precio.mensual;
    const diferenciaPrecio = precioPlanNuevo - precioPlanActual;

    // Si es downgrade, no se cobra prorrata (se aplica en próxima renovación)
    const esUpgrade = diferenciaPrecio > 0;

    let precioProrrata = 0;
    if (esUpgrade) {
      precioProrrata = this.calcularProrrata(diferenciaPrecio, diasRestantes, diasCiclo);
    }

    return {
      diasRestantes,
      diasCiclo,
      fechaRenovacion,
      tipoSuscripcion,
      planActual: {
        nombre: planActual.nombre,
        precio: precioPlanActual,
      },
      planNuevo: {
        nombre: nuevoPlan.nombre,
        precio: precioPlanNuevo,
      },
      diferencia: {
        precioCompleto: Math.abs(diferenciaPrecio),
        precioProrrata: Math.abs(precioProrrata),
        esUpgrade,
      },
    };
  }

  /**
   * Calcular total con IVA
   */
  calcularConIVA(subtotal: number, ivaPorcentaje: number = 21): {
    subtotal: number;
    iva: number;
    total: number;
  } {
    const iva = Math.round(subtotal * (ivaPorcentaje / 100) * 100) / 100;
    const total = Math.round((subtotal + iva) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      iva,
      total,
    };
  }

  /**
   * Obtener resumen de prorrateo para mostrar en checkout
   */
  async getResumenProrrateo(
    empresaId: string,
    addOnSlugs: string[] = [],
    nuevoPlanSlug?: string
  ): Promise<{
    aplicaProrrata: boolean;
    diasRestantes: number;
    diasCiclo: number;
    fechaRenovacion: Date;
    tipoSuscripcion: 'mensual' | 'anual';
    mensaje: string;
    desglose: {
      concepto: string;
      precioCompleto: number;
      precioProrrata: number;
    }[];
    totales: {
      subtotalCompleto: number;
      subtotalProrrata: number;
      ivaCompleto: number;
      ivaProrrata: number;
      totalCompleto: number;
      totalProrrata: number;
      ahorro: number;
    };
  }> {
    const licencia = await Licencia.findOne({ empresaId });
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    const tipoSuscripcion = licencia.tipoSuscripcion || 'mensual';
    const fechaRenovacion = licencia.fechaRenovacion || new Date();
    const diasCiclo = this.getDiasCiclo(tipoSuscripcion);
    const diasRestantes = this.calcularDiasRestantes(fechaRenovacion);

    // Si faltan más del 90% del ciclo, no aplicar prorrata
    const aplicaProrrata = diasRestantes < diasCiclo * 0.9;

    const desglose: { concepto: string; precioCompleto: number; precioProrrata: number }[] = [];
    let subtotalCompleto = 0;
    let subtotalProrrata = 0;

    // Calcular add-ons
    if (addOnSlugs.length > 0) {
      const prorrateoAddOns = await this.calcularProrrateoAddOns(empresaId, addOnSlugs);
      for (const addon of prorrateoAddOns.addOns) {
        desglose.push({
          concepto: addon.nombre,
          precioCompleto: addon.precioCompleto,
          precioProrrata: aplicaProrrata ? addon.precioProrrata : addon.precioCompleto,
        });
        subtotalCompleto += addon.precioCompleto;
        subtotalProrrata += aplicaProrrata ? addon.precioProrrata : addon.precioCompleto;
      }
    }

    // Calcular cambio de plan
    if (nuevoPlanSlug) {
      const prorrateoPlan = await this.calcularProrrateoCambioPlan(empresaId, nuevoPlanSlug);
      if (prorrateoPlan.diferencia.esUpgrade) {
        desglose.push({
          concepto: `Upgrade a ${prorrateoPlan.planNuevo.nombre}`,
          precioCompleto: prorrateoPlan.diferencia.precioCompleto,
          precioProrrata: aplicaProrrata
            ? prorrateoPlan.diferencia.precioProrrata
            : prorrateoPlan.diferencia.precioCompleto,
        });
        subtotalCompleto += prorrateoPlan.diferencia.precioCompleto;
        subtotalProrrata += aplicaProrrata
          ? prorrateoPlan.diferencia.precioProrrata
          : prorrateoPlan.diferencia.precioCompleto;
      }
    }

    // Calcular IVA
    const totalesCompleto = this.calcularConIVA(subtotalCompleto);
    const totalesProrrata = this.calcularConIVA(subtotalProrrata);

    // Generar mensaje
    let mensaje = '';
    if (aplicaProrrata) {
      const fechaFormateada = fechaRenovacion.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      mensaje = `Tu plan se renueva el ${fechaFormateada} (en ${diasRestantes} días). ` +
        `Hoy pagarás solo la parte proporcional. A partir de la renovación, ` +
        `el importe completo se añadirá a tu factura ${tipoSuscripcion}.`;
    }

    return {
      aplicaProrrata,
      diasRestantes,
      diasCiclo,
      fechaRenovacion,
      tipoSuscripcion,
      mensaje,
      desglose,
      totales: {
        subtotalCompleto,
        subtotalProrrata,
        ivaCompleto: totalesCompleto.iva,
        ivaProrrata: totalesProrrata.iva,
        totalCompleto: totalesCompleto.total,
        totalProrrata: totalesProrrata.total,
        ahorro: totalesCompleto.total - totalesProrrata.total,
      },
    };
  }
}

export const prorrateoService = new ProrrateoService();
