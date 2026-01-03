/**
 * Servicio de Libro Mayor
 * Genera el libro mayor para cuentas contables
 */

import mongoose from 'mongoose';
import { IDatabaseConfig } from '../../empresa/Empresa';
import {
  getAsientoContableModel,
  getCuentaContableModel,
} from '../../../utils/dynamic-models.helper';
import { EstadoAsiento } from '../models/AsientoContable';
import { NaturalezaCuenta } from '../models/PlanCuentas';

export interface IFiltrosLibroMayor {
  cuentaCodigo?: string;        // Cuenta específica
  cuentaDesde?: string;         // Rango de cuentas
  cuentaHasta?: string;
  fechaDesde: Date;
  fechaHasta: Date;
  ejercicio?: number;
  incluirCuentasSinMovimiento?: boolean;
  incluirAnulados?: boolean;
  nivel?: number;               // Nivel de agregación (1-10)
}

export interface IMovimientoMayor {
  fecha: Date;
  asientoNumero: number;
  concepto: string;
  debe: number;
  haber: number;
  saldoParcial: number;
  documentoRef?: string;
  terceroNombre?: string;
}

export interface ICuentaMayor {
  cuentaCodigo: string;
  cuentaNombre: string;
  naturaleza: string;
  saldoInicial: number;
  movimientos: IMovimientoMayor[];
  totalDebe: number;
  totalHaber: number;
  saldoFinal: number;
}

export interface ILibroMayorResult {
  cuentas: ICuentaMayor[];
  resumen: {
    totalCuentas: number;
    totalDebe: number;
    totalHaber: number;
  };
  filtros: IFiltrosLibroMayor;
}

class LibroMayorService {
  /**
   * Generar libro mayor para una cuenta específica
   */
  async generarPorCuenta(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    cuentaCodigo: string,
    filtros: Omit<IFiltrosLibroMayor, 'cuentaCodigo'>
  ): Promise<ICuentaMayor | null> {
    const [CuentaContable, AsientoContable] = await Promise.all([
      getCuentaContableModel(empresaId, dbConfig),
      getAsientoContableModel(empresaId, dbConfig),
    ]);

    // Buscar cuenta
    const cuenta = await CuentaContable.findOne({ codigo: cuentaCodigo }).lean();
    if (!cuenta) {
      return null;
    }

    // Calcular saldo inicial (movimientos antes de fechaDesde)
    const saldoInicialResult = await AsientoContable.aggregate([
      {
        $match: {
          fecha: { $lt: filtros.fechaDesde },
          estado: { $ne: EstadoAsiento.ANULADO },
        },
      },
      { $unwind: '$lineas' },
      { $match: { 'lineas.cuentaCodigo': cuentaCodigo } },
      {
        $group: {
          _id: null,
          totalDebe: { $sum: '$lineas.debe' },
          totalHaber: { $sum: '$lineas.haber' },
        },
      },
    ]);

    const saldoInicialData = saldoInicialResult[0] || { totalDebe: 0, totalHaber: 0 };
    const saldoInicial = cuenta.naturaleza === NaturalezaCuenta.DEUDORA
      ? saldoInicialData.totalDebe - saldoInicialData.totalHaber
      : saldoInicialData.totalHaber - saldoInicialData.totalDebe;

    // Obtener movimientos del período
    const matchQuery: any = {
      fecha: {
        $gte: filtros.fechaDesde,
        $lte: filtros.fechaHasta,
      },
    };

    if (!filtros.incluirAnulados) {
      matchQuery.estado = { $ne: EstadoAsiento.ANULADO };
    }

    const movimientosResult = await AsientoContable.aggregate([
      { $match: matchQuery },
      { $unwind: '$lineas' },
      { $match: { 'lineas.cuentaCodigo': cuentaCodigo } },
      { $sort: { fecha: 1, numero: 1 } },
      {
        $project: {
          fecha: 1,
          asientoNumero: '$numero',
          concepto: { $ifNull: ['$lineas.concepto', '$concepto'] },
          debe: '$lineas.debe',
          haber: '$lineas.haber',
          documentoRef: '$lineas.documentoRef',
          terceroNombre: '$lineas.terceroNombre',
        },
      },
    ]);

    // Calcular saldo parcial acumulado
    let saldoAcumulado = saldoInicial;
    const movimientos: IMovimientoMayor[] = movimientosResult.map((mov: any) => {
      if (cuenta.naturaleza === NaturalezaCuenta.DEUDORA) {
        saldoAcumulado += mov.debe - mov.haber;
      } else {
        saldoAcumulado += mov.haber - mov.debe;
      }

      return {
        fecha: mov.fecha,
        asientoNumero: mov.asientoNumero,
        concepto: mov.concepto,
        debe: mov.debe,
        haber: mov.haber,
        saldoParcial: Math.round(saldoAcumulado * 100) / 100,
        documentoRef: mov.documentoRef,
        terceroNombre: mov.terceroNombre,
      };
    });

    const totalDebe = movimientos.reduce((sum, m) => sum + m.debe, 0);
    const totalHaber = movimientos.reduce((sum, m) => sum + m.haber, 0);

    return {
      cuentaCodigo: cuenta.codigo,
      cuentaNombre: cuenta.nombre,
      naturaleza: cuenta.naturaleza,
      saldoInicial: Math.round(saldoInicial * 100) / 100,
      movimientos,
      totalDebe: Math.round(totalDebe * 100) / 100,
      totalHaber: Math.round(totalHaber * 100) / 100,
      saldoFinal: Math.round(saldoAcumulado * 100) / 100,
    };
  }

  /**
   * Generar libro mayor para rango de cuentas
   */
  async generar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosLibroMayor
  ): Promise<ILibroMayorResult> {
    const CuentaContable = await getCuentaContableModel(empresaId, dbConfig);

    // Buscar cuentas según filtros
    const cuentasQuery: any = { esMovimiento: true, activa: true };

    if (filtros.cuentaCodigo) {
      cuentasQuery.codigo = filtros.cuentaCodigo;
    } else if (filtros.cuentaDesde || filtros.cuentaHasta) {
      cuentasQuery.codigo = {};
      if (filtros.cuentaDesde) cuentasQuery.codigo.$gte = filtros.cuentaDesde;
      if (filtros.cuentaHasta) cuentasQuery.codigo.$lte = filtros.cuentaHasta;
    }

    if (filtros.nivel) {
      cuentasQuery.nivel = filtros.nivel;
    }

    const cuentas = await CuentaContable.find(cuentasQuery)
      .sort({ codigo: 1 })
      .lean();

    // Generar mayor para cada cuenta
    const cuentasMayor: ICuentaMayor[] = [];
    let totalDebeGeneral = 0;
    let totalHaberGeneral = 0;

    for (const cuenta of cuentas) {
      const mayor = await this.generarPorCuenta(
        empresaId,
        dbConfig,
        cuenta.codigo,
        filtros
      );

      if (mayor) {
        // Incluir solo si tiene movimientos o se solicita incluir sin movimiento
        if (mayor.movimientos.length > 0 || filtros.incluirCuentasSinMovimiento) {
          cuentasMayor.push(mayor);
          totalDebeGeneral += mayor.totalDebe;
          totalHaberGeneral += mayor.totalHaber;
        }
      }
    }

    return {
      cuentas: cuentasMayor,
      resumen: {
        totalCuentas: cuentasMayor.length,
        totalDebe: Math.round(totalDebeGeneral * 100) / 100,
        totalHaber: Math.round(totalHaberGeneral * 100) / 100,
      },
      filtros,
    };
  }

  /**
   * Obtener saldo de cuenta a una fecha
   */
  async obtenerSaldoCuenta(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    cuentaCodigo: string,
    fechaHasta: Date
  ): Promise<{ saldo: number; debe: number; haber: number }> {
    const [CuentaContable, AsientoContable] = await Promise.all([
      getCuentaContableModel(empresaId, dbConfig),
      getAsientoContableModel(empresaId, dbConfig),
    ]);

    const cuenta = await CuentaContable.findOne({ codigo: cuentaCodigo });
    if (!cuenta) {
      return { saldo: 0, debe: 0, haber: 0 };
    }

    const result = await AsientoContable.aggregate([
      {
        $match: {
          fecha: { $lte: fechaHasta },
          estado: { $ne: EstadoAsiento.ANULADO },
        },
      },
      { $unwind: '$lineas' },
      { $match: { 'lineas.cuentaCodigo': cuentaCodigo } },
      {
        $group: {
          _id: null,
          totalDebe: { $sum: '$lineas.debe' },
          totalHaber: { $sum: '$lineas.haber' },
        },
      },
    ]);

    const data = result[0] || { totalDebe: 0, totalHaber: 0 };
    const saldo = cuenta.naturaleza === NaturalezaCuenta.DEUDORA
      ? data.totalDebe - data.totalHaber
      : data.totalHaber - data.totalDebe;

    return {
      saldo: Math.round(saldo * 100) / 100,
      debe: Math.round(data.totalDebe * 100) / 100,
      haber: Math.round(data.totalHaber * 100) / 100,
    };
  }
}

export const libroMayorService = new LibroMayorService();
