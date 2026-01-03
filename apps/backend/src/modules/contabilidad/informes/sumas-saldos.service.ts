/**
 * Servicio de Balance de Sumas y Saldos
 * Balance de comprobación con sumas y saldos de todas las cuentas
 */

import { IDatabaseConfig } from '../../empresa/Empresa';
import {
  getAsientoContableModel,
  getCuentaContableModel,
} from '../../../utils/dynamic-models.helper';
import { EstadoAsiento } from '../models/AsientoContable';
import { NaturalezaCuenta, TipoCuenta } from '../models/PlanCuentas';

export interface IFiltrosSumasSaldos {
  fechaDesde: Date;
  fechaHasta: Date;
  ejercicio?: number;
  nivel?: number;                       // Nivel de agregación (1-5)
  cuentaDesde?: string;
  cuentaHasta?: string;
  soloConMovimiento?: boolean;
  agruparPorGrupo?: boolean;            // Agrupar por grupos principales
}

export interface ILineaSumasSaldos {
  cuentaCodigo: string;
  cuentaNombre: string;
  nivel: number;
  tipo: string;
  naturaleza: string;
  // Sumas
  sumaDebe: number;
  sumaHaber: number;
  // Saldos
  saldoDeudor: number;                  // Si debe > haber
  saldoAcreedor: number;                // Si haber > debe
}

export interface IResumenSumasSaldos {
  totalSumaDebe: number;
  totalSumaHaber: number;
  totalSaldoDeudor: number;
  totalSaldoAcreedor: number;
  cuadradoSumas: boolean;
  cuadradoSaldos: boolean;
  diferenciaSumas: number;
  diferenciaSaldos: number;
}

export interface ISumasSaldosResult {
  lineas: ILineaSumasSaldos[];
  resumen: IResumenSumasSaldos;
  filtros: IFiltrosSumasSaldos;
  porGrupos?: {
    grupo: string;
    nombre: string;
    sumaDebe: number;
    sumaHaber: number;
    saldoDeudor: number;
    saldoAcreedor: number;
  }[];
}

class SumasSaldosService {
  /**
   * Generar balance de sumas y saldos
   */
  async generar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosSumasSaldos
  ): Promise<ISumasSaldosResult> {
    const [CuentaContable, AsientoContable] = await Promise.all([
      getCuentaContableModel(empresaId, dbConfig),
      getAsientoContableModel(empresaId, dbConfig),
    ]);

    // Construir query base para asientos
    const matchQuery: any = {
      fecha: {
        $gte: filtros.fechaDesde,
        $lte: filtros.fechaHasta,
      },
      estado: { $ne: EstadoAsiento.ANULADO },
    };

    if (filtros.ejercicio) {
      matchQuery.ejercicio = filtros.ejercicio;
    }

    // Agregar movimientos por cuenta
    const pipeline: any[] = [
      { $match: matchQuery },
      { $unwind: '$lineas' },
    ];

    // Filtrar por rango de cuentas
    if (filtros.cuentaDesde || filtros.cuentaHasta) {
      const cuentaMatch: any = {};
      if (filtros.cuentaDesde) cuentaMatch.$gte = filtros.cuentaDesde;
      if (filtros.cuentaHasta) cuentaMatch.$lte = filtros.cuentaHasta;
      pipeline.push({ $match: { 'lineas.cuentaCodigo': cuentaMatch } });
    }

    // Agrupar por cuenta (o por nivel)
    let groupKey = '$lineas.cuentaCodigo';
    if (filtros.nivel && filtros.nivel < 10) {
      // Agrupar por los primeros N dígitos del código
      groupKey = { $substr: ['$lineas.cuentaCodigo', 0, filtros.nivel] };
    }

    pipeline.push(
      {
        $group: {
          _id: groupKey,
          sumaDebe: { $sum: '$lineas.debe' },
          sumaHaber: { $sum: '$lineas.haber' },
        },
      },
      { $sort: { _id: 1 } }
    );

    const resultados = await AsientoContable.aggregate(pipeline);

    // Obtener info de cuentas y construir líneas
    const lineas: ILineaSumasSaldos[] = [];
    let totalSumaDebe = 0;
    let totalSumaHaber = 0;
    let totalSaldoDeudor = 0;
    let totalSaldoAcreedor = 0;

    for (const item of resultados) {
      // Buscar cuenta
      let cuenta;
      if (filtros.nivel && filtros.nivel < 10) {
        // Buscar cuenta padre del nivel
        cuenta = await CuentaContable.findOne({
          codigo: item._id,
        }).lean();

        if (!cuenta) {
          // Buscar primera cuenta que empiece por ese código
          cuenta = await CuentaContable.findOne({
            codigo: { $regex: `^${item._id}` },
          }).lean();
        }
      } else {
        cuenta = await CuentaContable.findOne({
          codigo: item._id,
        }).lean();
      }

      if (!cuenta && filtros.soloConMovimiento !== false) {
        // Crear entrada genérica
        cuenta = {
          codigo: item._id,
          nombre: `Cuenta ${item._id}`,
          nivel: item._id.length,
          tipo: this.determinarTipo(item._id),
          naturaleza: this.determinarNaturaleza(item._id),
        };
      }

      if (!cuenta) continue;

      // Calcular saldos
      const diferencia = item.sumaDebe - item.sumaHaber;
      const saldoDeudor = diferencia > 0 ? diferencia : 0;
      const saldoAcreedor = diferencia < 0 ? Math.abs(diferencia) : 0;

      lineas.push({
        cuentaCodigo: cuenta.codigo || item._id,
        cuentaNombre: cuenta.nombre,
        nivel: cuenta.nivel || item._id.length,
        tipo: cuenta.tipo,
        naturaleza: cuenta.naturaleza,
        sumaDebe: Math.round(item.sumaDebe * 100) / 100,
        sumaHaber: Math.round(item.sumaHaber * 100) / 100,
        saldoDeudor: Math.round(saldoDeudor * 100) / 100,
        saldoAcreedor: Math.round(saldoAcreedor * 100) / 100,
      });

      totalSumaDebe += item.sumaDebe;
      totalSumaHaber += item.sumaHaber;
      totalSaldoDeudor += saldoDeudor;
      totalSaldoAcreedor += saldoAcreedor;
    }

    // Calcular resumen
    const diferenciaSumas = Math.abs(totalSumaDebe - totalSumaHaber);
    const diferenciaSaldos = Math.abs(totalSaldoDeudor - totalSaldoAcreedor);

    const result: ISumasSaldosResult = {
      lineas,
      resumen: {
        totalSumaDebe: Math.round(totalSumaDebe * 100) / 100,
        totalSumaHaber: Math.round(totalSumaHaber * 100) / 100,
        totalSaldoDeudor: Math.round(totalSaldoDeudor * 100) / 100,
        totalSaldoAcreedor: Math.round(totalSaldoAcreedor * 100) / 100,
        cuadradoSumas: diferenciaSumas < 0.01,
        cuadradoSaldos: diferenciaSaldos < 0.01,
        diferenciaSumas: Math.round(diferenciaSumas * 100) / 100,
        diferenciaSaldos: Math.round(diferenciaSaldos * 100) / 100,
      },
      filtros,
    };

    // Agrupar por grupos principales si se solicita
    if (filtros.agruparPorGrupo) {
      result.porGrupos = this.agruparPorGrupos(lineas);
    }

    return result;
  }

  /**
   * Agrupar líneas por grupos principales (primer dígito)
   */
  private agruparPorGrupos(lineas: ILineaSumasSaldos[]) {
    const grupos: Record<string, {
      sumaDebe: number;
      sumaHaber: number;
      saldoDeudor: number;
      saldoAcreedor: number;
    }> = {};

    const nombresGrupos: Record<string, string> = {
      '1': 'Financiación básica',
      '2': 'Activo no corriente',
      '3': 'Existencias',
      '4': 'Acreedores y deudores',
      '5': 'Cuentas financieras',
      '6': 'Compras y gastos',
      '7': 'Ventas e ingresos',
      '8': 'Gastos imputados al patrimonio neto',
      '9': 'Ingresos imputados al patrimonio neto',
    };

    for (const linea of lineas) {
      const grupo = linea.cuentaCodigo.charAt(0);
      if (!grupos[grupo]) {
        grupos[grupo] = {
          sumaDebe: 0,
          sumaHaber: 0,
          saldoDeudor: 0,
          saldoAcreedor: 0,
        };
      }

      grupos[grupo].sumaDebe += linea.sumaDebe;
      grupos[grupo].sumaHaber += linea.sumaHaber;
      grupos[grupo].saldoDeudor += linea.saldoDeudor;
      grupos[grupo].saldoAcreedor += linea.saldoAcreedor;
    }

    return Object.entries(grupos).map(([grupo, datos]) => ({
      grupo,
      nombre: nombresGrupos[grupo] || `Grupo ${grupo}`,
      sumaDebe: Math.round(datos.sumaDebe * 100) / 100,
      sumaHaber: Math.round(datos.sumaHaber * 100) / 100,
      saldoDeudor: Math.round(datos.saldoDeudor * 100) / 100,
      saldoAcreedor: Math.round(datos.saldoAcreedor * 100) / 100,
    })).sort((a, b) => a.grupo.localeCompare(b.grupo));
  }

  private determinarTipo(codigo: string): string {
    const primerDigito = codigo.charAt(0);
    switch (primerDigito) {
      case '1': return TipoCuenta.PASIVO;
      case '2': return TipoCuenta.ACTIVO;
      case '3': return TipoCuenta.ACTIVO;
      case '4': return codigo.startsWith('43') ? TipoCuenta.ACTIVO : TipoCuenta.PASIVO;
      case '5': return TipoCuenta.ACTIVO;
      case '6': return TipoCuenta.GASTO;
      case '7': return TipoCuenta.INGRESO;
      default: return TipoCuenta.PATRIMONIO;
    }
  }

  private determinarNaturaleza(codigo: string): string {
    const primerDigito = codigo.charAt(0);
    switch (primerDigito) {
      case '1': return NaturalezaCuenta.ACREEDORA;
      case '2': return NaturalezaCuenta.DEUDORA;
      case '3': return NaturalezaCuenta.DEUDORA;
      case '4':
        return codigo.startsWith('43') || codigo.startsWith('44')
          ? NaturalezaCuenta.DEUDORA
          : NaturalezaCuenta.ACREEDORA;
      case '5': return NaturalezaCuenta.DEUDORA;
      case '6': return NaturalezaCuenta.DEUDORA;
      case '7': return NaturalezaCuenta.ACREEDORA;
      default: return NaturalezaCuenta.ACREEDORA;
    }
  }
}

export const sumasSaldosService = new SumasSaldosService();
