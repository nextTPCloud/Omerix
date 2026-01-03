/**
 * Servicio de Cuenta de Pérdidas y Ganancias (PyG)
 * Genera la cuenta de resultados del ejercicio
 */

import { IDatabaseConfig } from '../../empresa/Empresa';
import {
  getAsientoContableModel,
  getCuentaContableModel,
} from '../../../utils/dynamic-models.helper';
import { EstadoAsiento } from '../models/AsientoContable';
import { NaturalezaCuenta } from '../models/PlanCuentas';

export interface IFiltrosCuentaResultados {
  fechaDesde: Date;
  fechaHasta: Date;
  ejercicio?: number;
  nivelDetalle?: number;
  compararEjercicioAnterior?: boolean;
}

export interface IPartidaPyG {
  codigo: string;
  nombre: string;
  nivel: number;
  importe: number;
  importeAnterior?: number;
  variacion?: number;
  variacionPorcentaje?: number;
  esSubtotal?: boolean;
  hijos?: IPartidaPyG[];
}

export interface ICuentaResultadosResult {
  // Resultado de explotación
  ingresos: {
    importeNetoVentas: IPartidaPyG[];
    otrosIngresosExplotacion: IPartidaPyG[];
    totalIngresos: number;
  };
  gastos: {
    aprovisionamientos: IPartidaPyG[];
    gastosPersonal: IPartidaPyG[];
    otrosGastosExplotacion: IPartidaPyG[];
    amortizaciones: IPartidaPyG[];
    totalGastos: number;
  };
  resultadoExplotacion: number;
  // Resultado financiero
  ingresosFinancieros: IPartidaPyG[];
  gastosFinancieros: IPartidaPyG[];
  resultadoFinanciero: number;
  // Resultado antes de impuestos
  resultadoAntesImpuestos: number;
  // Impuestos
  impuestoSociedades: number;
  // Resultado del ejercicio
  resultadoEjercicio: number;
  // Ejercicio anterior (si se solicita)
  ejercicioAnterior?: {
    resultadoExplotacion: number;
    resultadoFinanciero: number;
    resultadoEjercicio: number;
  };
  // Metadata
  periodo: {
    desde: Date;
    hasta: Date;
    ejercicio: number;
  };
}

class CuentaResultadosService {
  /**
   * Generar cuenta de pérdidas y ganancias
   */
  async generar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosCuentaResultados
  ): Promise<ICuentaResultadosResult> {
    const [CuentaContable, AsientoContable] = await Promise.all([
      getCuentaContableModel(empresaId, dbConfig),
      getAsientoContableModel(empresaId, dbConfig),
    ]);

    // Obtener movimientos del período
    const saldos = await this.obtenerSaldosPeriodo(
      AsientoContable,
      filtros.fechaDesde,
      filtros.fechaHasta,
      filtros.ejercicio
    );

    // Obtener todas las cuentas de resultados (6xx y 7xx)
    const cuentas = await CuentaContable.find({
      codigo: { $regex: /^[67]/ },
      activa: true,
    }).lean();

    // Mapear cuentas con sus saldos
    const cuentasConSaldo = cuentas.map((cuenta: any) => ({
      ...cuenta,
      saldo: saldos[cuenta.codigo] || { debe: 0, haber: 0 },
    }));

    // Calcular secciones
    const nivelDetalle = filtros.nivelDetalle || 3;

    // INGRESOS
    const importeNetoVentas = await this.calcularSeccion(
      cuentasConSaldo,
      ['70', '71'],
      nivelDetalle,
      false  // Los ingresos son acreedores, haber - debe
    );

    const otrosIngresosExplotacion = await this.calcularSeccion(
      cuentasConSaldo,
      ['73', '74', '75'],
      nivelDetalle,
      false
    );

    const totalIngresos = this.sumarPartidas(importeNetoVentas) +
      this.sumarPartidas(otrosIngresosExplotacion);

    // GASTOS DE EXPLOTACIÓN
    const aprovisionamientos = await this.calcularSeccion(
      cuentasConSaldo,
      ['60'],
      nivelDetalle,
      true  // Los gastos son deudores, debe - haber
    );

    const gastosPersonal = await this.calcularSeccion(
      cuentasConSaldo,
      ['64'],
      nivelDetalle,
      true
    );

    const otrosGastosExplotacion = await this.calcularSeccion(
      cuentasConSaldo,
      ['62', '63', '65'],
      nivelDetalle,
      true
    );

    const amortizaciones = await this.calcularSeccion(
      cuentasConSaldo,
      ['68'],
      nivelDetalle,
      true
    );

    const totalGastos = this.sumarPartidas(aprovisionamientos) +
      this.sumarPartidas(gastosPersonal) +
      this.sumarPartidas(otrosGastosExplotacion) +
      this.sumarPartidas(amortizaciones);

    // Resultado de explotación
    const resultadoExplotacion = totalIngresos - totalGastos;

    // RESULTADO FINANCIERO
    const ingresosFinancieros = await this.calcularSeccion(
      cuentasConSaldo,
      ['76'],
      nivelDetalle,
      false
    );

    const gastosFinancieros = await this.calcularSeccion(
      cuentasConSaldo,
      ['66', '67'],
      nivelDetalle,
      true
    );

    const resultadoFinanciero = this.sumarPartidas(ingresosFinancieros) -
      this.sumarPartidas(gastosFinancieros);

    // Resultado antes de impuestos
    const resultadoAntesImpuestos = resultadoExplotacion + resultadoFinanciero;

    // Impuesto de sociedades (cuenta 630)
    const impuestoSociedades = await this.calcularImpuestoSociedades(
      cuentasConSaldo
    );

    // Resultado del ejercicio
    const resultadoEjercicio = resultadoAntesImpuestos - impuestoSociedades;

    const result: ICuentaResultadosResult = {
      ingresos: {
        importeNetoVentas,
        otrosIngresosExplotacion,
        totalIngresos: Math.round(totalIngresos * 100) / 100,
      },
      gastos: {
        aprovisionamientos,
        gastosPersonal,
        otrosGastosExplotacion,
        amortizaciones,
        totalGastos: Math.round(totalGastos * 100) / 100,
      },
      resultadoExplotacion: Math.round(resultadoExplotacion * 100) / 100,
      ingresosFinancieros,
      gastosFinancieros,
      resultadoFinanciero: Math.round(resultadoFinanciero * 100) / 100,
      resultadoAntesImpuestos: Math.round(resultadoAntesImpuestos * 100) / 100,
      impuestoSociedades: Math.round(impuestoSociedades * 100) / 100,
      resultadoEjercicio: Math.round(resultadoEjercicio * 100) / 100,
      periodo: {
        desde: filtros.fechaDesde,
        hasta: filtros.fechaHasta,
        ejercicio: filtros.ejercicio || filtros.fechaHasta.getFullYear(),
      },
    };

    // Comparar con ejercicio anterior si se solicita
    if (filtros.compararEjercicioAnterior) {
      const fechaDesdeAnterior = new Date(filtros.fechaDesde);
      fechaDesdeAnterior.setFullYear(fechaDesdeAnterior.getFullYear() - 1);
      const fechaHastaAnterior = new Date(filtros.fechaHasta);
      fechaHastaAnterior.setFullYear(fechaHastaAnterior.getFullYear() - 1);

      const resultadoAnterior = await this.generar(empresaId, dbConfig, {
        fechaDesde: fechaDesdeAnterior,
        fechaHasta: fechaHastaAnterior,
        nivelDetalle: filtros.nivelDetalle,
        compararEjercicioAnterior: false,
      });

      result.ejercicioAnterior = {
        resultadoExplotacion: resultadoAnterior.resultadoExplotacion,
        resultadoFinanciero: resultadoAnterior.resultadoFinanciero,
        resultadoEjercicio: resultadoAnterior.resultadoEjercicio,
      };
    }

    return result;
  }

  /**
   * Obtener saldos del período
   */
  private async obtenerSaldosPeriodo(
    AsientoContable: any,
    fechaDesde: Date,
    fechaHasta: Date,
    ejercicio?: number
  ): Promise<Record<string, { debe: number; haber: number }>> {
    const match: any = {
      fecha: {
        $gte: fechaDesde,
        $lte: fechaHasta,
      },
      estado: { $ne: EstadoAsiento.ANULADO },
    };

    if (ejercicio) {
      match.ejercicio = ejercicio;
    }

    const resultados = await AsientoContable.aggregate([
      { $match: match },
      { $unwind: '$lineas' },
      {
        $group: {
          _id: '$lineas.cuentaCodigo',
          debe: { $sum: '$lineas.debe' },
          haber: { $sum: '$lineas.haber' },
        },
      },
    ]);

    const saldos: Record<string, { debe: number; haber: number }> = {};
    for (const r of resultados) {
      saldos[r._id] = { debe: r.debe, haber: r.haber };
    }

    return saldos;
  }

  /**
   * Calcular una sección del PyG
   */
  private async calcularSeccion(
    cuentas: any[],
    prefijos: string[],
    nivelDetalle: number,
    esGasto: boolean
  ): Promise<IPartidaPyG[]> {
    const partidas: IPartidaPyG[] = [];

    // Filtrar cuentas
    const cuentasFiltradas = cuentas.filter(cuenta =>
      prefijos.some(prefijo => cuenta.codigo.startsWith(prefijo))
    );

    // Agrupar por nivel
    const agrupadas = new Map<string, { nombre: string; importe: number }>();

    for (const cuenta of cuentasFiltradas) {
      // Para gastos: debe - haber (naturaleza deudora)
      // Para ingresos: haber - debe (naturaleza acreedora)
      const saldo = esGasto
        ? cuenta.saldo.debe - cuenta.saldo.haber
        : cuenta.saldo.haber - cuenta.saldo.debe;

      // Determinar clave de agrupación
      const clave = cuenta.codigo.substring(0, Math.min(nivelDetalle, cuenta.codigo.length));

      if (!agrupadas.has(clave)) {
        agrupadas.set(clave, {
          nombre: this.getNombreCuenta(cuenta, nivelDetalle),
          importe: 0,
        });
      }

      const grupo = agrupadas.get(clave)!;
      grupo.importe += saldo;
    }

    // Convertir a partidas
    for (const [codigo, datos] of agrupadas) {
      if (Math.abs(datos.importe) > 0.01) {
        partidas.push({
          codigo,
          nombre: datos.nombre,
          nivel: codigo.length,
          importe: Math.round(datos.importe * 100) / 100,
        });
      }
    }

    return partidas.sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  private getNombreCuenta(cuenta: any, nivel: number): string {
    // Nombres estándar PGC
    const nombresPyG: Record<string, string> = {
      '60': 'Compras',
      '600': 'Compras de mercaderías',
      '601': 'Compras de materias primas',
      '602': 'Compras otros aprovisionamientos',
      '62': 'Servicios exteriores',
      '620': 'Gastos I+D',
      '621': 'Arrendamientos y cánones',
      '622': 'Reparaciones y conservación',
      '623': 'Servicios profesionales',
      '624': 'Transportes',
      '625': 'Primas de seguros',
      '626': 'Servicios bancarios',
      '627': 'Publicidad y relaciones públicas',
      '628': 'Suministros',
      '629': 'Otros servicios',
      '63': 'Tributos',
      '630': 'Impuesto sobre beneficios',
      '631': 'Otros tributos',
      '64': 'Gastos de personal',
      '640': 'Sueldos y salarios',
      '641': 'Indemnizaciones',
      '642': 'Seguridad Social empresa',
      '65': 'Otros gastos de gestión',
      '650': 'Pérdidas créditos comerciales',
      '66': 'Gastos financieros',
      '662': 'Intereses de deudas',
      '67': 'Pérdidas procedentes activos',
      '68': 'Dotaciones para amortizaciones',
      '681': 'Amort. inmovilizado material',
      '682': 'Amort. inversiones inmobiliarias',
      '70': 'Ventas',
      '700': 'Ventas de mercaderías',
      '701': 'Ventas de productos terminados',
      '705': 'Prestaciones de servicios',
      '71': 'Variación existencias',
      '73': 'Trabajos empresa para activo',
      '74': 'Subvenciones de explotación',
      '75': 'Otros ingresos de gestión',
      '752': 'Ingresos por arrendamientos',
      '759': 'Ingresos por servicios diversos',
      '76': 'Ingresos financieros',
      '762': 'Ingresos de créditos',
      '769': 'Otros ingresos financieros',
    };

    const codigo = cuenta.codigo.substring(0, nivel);
    return nombresPyG[codigo] || cuenta.nombre;
  }

  private sumarPartidas(partidas: IPartidaPyG[]): number {
    return partidas.reduce((sum, p) => sum + p.importe, 0);
  }

  private async calcularImpuestoSociedades(cuentas: any[]): Promise<number> {
    const cuenta630 = cuentas.find(c => c.codigo.startsWith('630'));
    if (!cuenta630) return 0;

    // Impuesto es un gasto, naturaleza deudora
    return cuenta630.saldo.debe - cuenta630.saldo.haber;
  }

  /**
   * Generar PyG resumido (formato corto)
   */
  async generarResumido(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosCuentaResultados
  ): Promise<{
    ventas: number;
    costeVentas: number;
    margenBruto: number;
    gastosOperativos: number;
    ebitda: number;
    amortizaciones: number;
    resultadoExplotacion: number;
    resultadoFinanciero: number;
    resultadoAntesImpuestos: number;
    impuestos: number;
    resultadoNeto: number;
  }> {
    const completo = await this.generar(empresaId, dbConfig, {
      ...filtros,
      nivelDetalle: 2,
    });

    const ventas = completo.ingresos.totalIngresos;
    const costeVentas = this.sumarPartidas(completo.gastos.aprovisionamientos);
    const margenBruto = ventas - costeVentas;

    const gastosOperativos = this.sumarPartidas(completo.gastos.gastosPersonal) +
      this.sumarPartidas(completo.gastos.otrosGastosExplotacion);

    const amortizaciones = this.sumarPartidas(completo.gastos.amortizaciones);
    const ebitda = margenBruto - gastosOperativos;

    return {
      ventas: Math.round(ventas * 100) / 100,
      costeVentas: Math.round(costeVentas * 100) / 100,
      margenBruto: Math.round(margenBruto * 100) / 100,
      gastosOperativos: Math.round(gastosOperativos * 100) / 100,
      ebitda: Math.round(ebitda * 100) / 100,
      amortizaciones: Math.round(amortizaciones * 100) / 100,
      resultadoExplotacion: completo.resultadoExplotacion,
      resultadoFinanciero: completo.resultadoFinanciero,
      resultadoAntesImpuestos: completo.resultadoAntesImpuestos,
      impuestos: completo.impuestoSociedades,
      resultadoNeto: completo.resultadoEjercicio,
    };
  }
}

export const cuentaResultadosService = new CuentaResultadosService();
