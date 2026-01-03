/**
 * Servicio de Libro Diario
 * Genera el libro diario contable con todos los asientos en orden cronológico
 */

import { IDatabaseConfig } from '../../empresa/Empresa';
import {
  getAsientoContableModel,
  getCuentaContableModel,
} from '../../../utils/dynamic-models.helper';
import { EstadoAsiento } from '../models/AsientoContable';

export interface IFiltrosLibroDiario {
  fechaDesde: Date;
  fechaHasta: Date;
  ejercicio?: number;
  periodo?: number;
  numeroDesde?: number;
  numeroHasta?: number;
  incluirAnulados?: boolean;
  pagina?: number;
  limite?: number;
}

export interface ILineaLibroDiario {
  asientoNumero: number;
  fecha: Date;
  cuentaCodigo: string;
  cuentaNombre: string;
  concepto: string;
  debe: number;
  haber: number;
  terceroNombre?: string;
  documentoRef?: string;
}

export interface IResumenLibroDiario {
  totalAsientos: number;
  totalDebe: number;
  totalHaber: number;
  diferencia: number;
  cuadrado: boolean;
}

export interface ILibroDiarioResult {
  lineas: ILineaLibroDiario[];
  resumen: IResumenLibroDiario;
  filtros: IFiltrosLibroDiario;
  paginacion?: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

class LibroDiarioService {
  /**
   * Generar libro diario
   */
  async generar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosLibroDiario
  ): Promise<ILibroDiarioResult> {
    const AsientoContable = await getAsientoContableModel(empresaId, dbConfig);

    // Construir query
    const query: any = {
      fecha: {
        $gte: filtros.fechaDesde,
        $lte: filtros.fechaHasta,
      },
    };

    if (filtros.ejercicio) {
      query.ejercicio = filtros.ejercicio;
    }

    if (filtros.periodo) {
      query.periodo = filtros.periodo;
    }

    if (filtros.numeroDesde || filtros.numeroHasta) {
      query.numero = {};
      if (filtros.numeroDesde) query.numero.$gte = filtros.numeroDesde;
      if (filtros.numeroHasta) query.numero.$lte = filtros.numeroHasta;
    }

    if (!filtros.incluirAnulados) {
      query.estado = { $ne: EstadoAsiento.ANULADO };
    }

    // Obtener total para paginación
    const total = await AsientoContable.countDocuments(query);

    // Obtener asientos paginados
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 100;
    const skip = (pagina - 1) * limite;

    const asientos = await AsientoContable.find(query)
      .sort({ fecha: 1, numero: 1 })
      .skip(skip)
      .limit(limite)
      .lean();

    // Transformar a líneas del libro diario
    const lineas: ILineaLibroDiario[] = [];
    let totalDebe = 0;
    let totalHaber = 0;

    for (const asiento of asientos) {
      for (const linea of asiento.lineas) {
        lineas.push({
          asientoNumero: asiento.numero,
          fecha: asiento.fecha,
          cuentaCodigo: linea.cuentaCodigo,
          cuentaNombre: linea.cuentaNombre,
          concepto: linea.concepto || asiento.concepto,
          debe: linea.debe,
          haber: linea.haber,
          terceroNombre: linea.terceroNombre,
          documentoRef: linea.documentoRef,
        });

        totalDebe += linea.debe;
        totalHaber += linea.haber;
      }
    }

    // Calcular totales generales (de todos los asientos, no solo los paginados)
    const totales = await AsientoContable.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDebe: { $sum: '$totalDebe' },
          totalHaber: { $sum: '$totalHaber' },
          count: { $sum: 1 },
        },
      },
    ]);

    const resumenGeneral = totales[0] || { totalDebe: 0, totalHaber: 0, count: 0 };

    return {
      lineas,
      resumen: {
        totalAsientos: resumenGeneral.count,
        totalDebe: Math.round(resumenGeneral.totalDebe * 100) / 100,
        totalHaber: Math.round(resumenGeneral.totalHaber * 100) / 100,
        diferencia: Math.round((resumenGeneral.totalDebe - resumenGeneral.totalHaber) * 100) / 100,
        cuadrado: Math.abs(resumenGeneral.totalDebe - resumenGeneral.totalHaber) < 0.01,
      },
      filtros,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  /**
   * Generar libro diario agrupado por asiento
   */
  async generarPorAsientos(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosLibroDiario
  ): Promise<any> {
    const AsientoContable = await getAsientoContableModel(empresaId, dbConfig);

    const query: any = {
      fecha: {
        $gte: filtros.fechaDesde,
        $lte: filtros.fechaHasta,
      },
    };

    if (filtros.ejercicio) query.ejercicio = filtros.ejercicio;
    if (!filtros.incluirAnulados) query.estado = { $ne: EstadoAsiento.ANULADO };

    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 50;
    const skip = (pagina - 1) * limite;

    const [asientos, total] = await Promise.all([
      AsientoContable.find(query)
        .sort({ fecha: 1, numero: 1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      AsientoContable.countDocuments(query),
    ]);

    return {
      asientos: asientos.map((a: any) => ({
        numero: a.numero,
        fecha: a.fecha,
        concepto: a.concepto,
        lineas: a.lineas,
        totalDebe: a.totalDebe,
        totalHaber: a.totalHaber,
        cuadrado: a.cuadrado,
        origenTipo: a.origenTipo,
        origenNumero: a.origenNumero,
        estado: a.estado,
      })),
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }
}

export const libroDiarioService = new LibroDiarioService();
