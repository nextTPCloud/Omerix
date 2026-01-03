/**
 * Servicio de Balance de Situación
 * Genera el balance de situación (activo/pasivo/patrimonio neto)
 */

import { IDatabaseConfig } from '../../empresa/Empresa';
import {
  getAsientoContableModel,
  getCuentaContableModel,
} from '../../../utils/dynamic-models.helper';
import { EstadoAsiento } from '../models/AsientoContable';
import { TipoCuenta, NaturalezaCuenta } from '../models/PlanCuentas';

export interface IFiltrosBalance {
  fechaHasta: Date;              // Fecha de cierre del balance
  ejercicio?: number;
  nivelDetalle?: number;         // 1=grupos, 2=subgrupos, 3=cuentas
  incluirCuentasVacias?: boolean;
}

export interface IPartidaBalance {
  codigo: string;
  nombre: string;
  nivel: number;
  importe: number;
  esSubtotal?: boolean;
  hijos?: IPartidaBalance[];
}

export interface IBalanceSituacionResult {
  activo: {
    activoNoCorriente: IPartidaBalance[];
    activoCorriente: IPartidaBalance[];
    totalActivoNoCorriente: number;
    totalActivoCorriente: number;
    totalActivo: number;
  };
  pasivo: {
    patrimonioNeto: IPartidaBalance[];
    pasivoNoCorriente: IPartidaBalance[];
    pasivoCorriente: IPartidaBalance[];
    totalPatrimonioNeto: number;
    totalPasivoNoCorriente: number;
    totalPasivoCorriente: number;
    totalPasivoPatrimonio: number;
  };
  cuadra: boolean;
  diferencia: number;
  fecha: Date;
  ejercicio: number;
}

class BalanceSituacionService {
  /**
   * Generar balance de situación
   */
  async generar(
    empresaId: string,
    dbConfig: IDatabaseConfig,
    filtros: IFiltrosBalance
  ): Promise<IBalanceSituacionResult> {
    const [CuentaContable, AsientoContable] = await Promise.all([
      getCuentaContableModel(empresaId, dbConfig),
      getAsientoContableModel(empresaId, dbConfig),
    ]);

    // Obtener saldos de todas las cuentas a la fecha
    const saldos = await this.obtenerSaldosCuentas(
      AsientoContable,
      filtros.fechaHasta,
      filtros.ejercicio
    );

    // Obtener cuentas con sus datos
    const cuentas = await CuentaContable.find({
      activa: true,
      esMovimiento: true,
    }).lean();

    // Mapear cuentas con sus saldos
    const cuentasConSaldo = cuentas.map((cuenta: any) => ({
      ...cuenta,
      saldo: saldos[cuenta.codigo] || { debe: 0, haber: 0 },
    }));

    // Clasificar y calcular
    const activoNoCorriente = await this.calcularSeccion(
      cuentasConSaldo,
      ['2'],                      // Grupo 2: Activo no corriente
      filtros.nivelDetalle || 2
    );

    const activoCorriente = await this.calcularSeccion(
      cuentasConSaldo,
      ['3', '43', '44', '46', '47', '5'], // Existencias, deudores, tesorería
      filtros.nivelDetalle || 2
    );

    const patrimonioNeto = await this.calcularSeccion(
      cuentasConSaldo,
      ['1'],                      // Grupo 1: Financiación básica (capital, reservas...)
      filtros.nivelDetalle || 2,
      true                        // Invertir signo (naturaleza acreedora)
    );

    const pasivoNoCorriente = await this.calcularSeccion(
      cuentasConSaldo,
      ['17'],                     // Deudas a largo plazo
      filtros.nivelDetalle || 2,
      true
    );

    const pasivoCorriente = await this.calcularSeccion(
      cuentasConSaldo,
      ['40', '41', '465', '475', '476', '477', '52'], // Acreedores, deudas CP
      filtros.nivelDetalle || 2,
      true
    );

    // Calcular totales
    const totalActivoNoCorriente = this.sumarPartidas(activoNoCorriente);
    const totalActivoCorriente = this.sumarPartidas(activoCorriente);
    const totalActivo = totalActivoNoCorriente + totalActivoCorriente;

    const totalPatrimonioNeto = this.sumarPartidas(patrimonioNeto);
    const totalPasivoNoCorriente = this.sumarPartidas(pasivoNoCorriente);
    const totalPasivoCorriente = this.sumarPartidas(pasivoCorriente);
    const totalPasivoPatrimonio = totalPatrimonioNeto + totalPasivoNoCorriente + totalPasivoCorriente;

    // Añadir resultado del ejercicio al patrimonio neto
    const resultadoEjercicio = await this.calcularResultadoEjercicio(
      cuentasConSaldo
    );

    if (Math.abs(resultadoEjercicio) > 0.01) {
      patrimonioNeto.push({
        codigo: '129',
        nombre: 'Resultado del ejercicio',
        nivel: 3,
        importe: Math.round(resultadoEjercicio * 100) / 100,
      });
    }

    const totalPatrimonioNetoConResultado = totalPatrimonioNeto + resultadoEjercicio;
    const totalPasivoPatrimonioFinal = totalPatrimonioNetoConResultado + totalPasivoNoCorriente + totalPasivoCorriente;

    const diferencia = totalActivo - totalPasivoPatrimonioFinal;

    return {
      activo: {
        activoNoCorriente,
        activoCorriente,
        totalActivoNoCorriente: Math.round(totalActivoNoCorriente * 100) / 100,
        totalActivoCorriente: Math.round(totalActivoCorriente * 100) / 100,
        totalActivo: Math.round(totalActivo * 100) / 100,
      },
      pasivo: {
        patrimonioNeto,
        pasivoNoCorriente,
        pasivoCorriente,
        totalPatrimonioNeto: Math.round(totalPatrimonioNetoConResultado * 100) / 100,
        totalPasivoNoCorriente: Math.round(totalPasivoNoCorriente * 100) / 100,
        totalPasivoCorriente: Math.round(totalPasivoCorriente * 100) / 100,
        totalPasivoPatrimonio: Math.round(totalPasivoPatrimonioFinal * 100) / 100,
      },
      cuadra: Math.abs(diferencia) < 0.01,
      diferencia: Math.round(diferencia * 100) / 100,
      fecha: filtros.fechaHasta,
      ejercicio: filtros.ejercicio || filtros.fechaHasta.getFullYear(),
    };
  }

  /**
   * Obtener saldos acumulados de todas las cuentas
   */
  private async obtenerSaldosCuentas(
    AsientoContable: any,
    fechaHasta: Date,
    ejercicio?: number
  ): Promise<Record<string, { debe: number; haber: number }>> {
    const match: any = {
      fecha: { $lte: fechaHasta },
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
   * Calcular una sección del balance
   */
  private async calcularSeccion(
    cuentas: any[],
    prefijos: string[],
    nivelDetalle: number,
    invertirSigno: boolean = false
  ): Promise<IPartidaBalance[]> {
    const partidas: IPartidaBalance[] = [];

    // Filtrar cuentas que empiecen por los prefijos
    const cuentasFiltradas = cuentas.filter(cuenta =>
      prefijos.some(prefijo => cuenta.codigo.startsWith(prefijo))
    );

    // Agrupar por nivel
    const agrupadas = new Map<string, { nombre: string; importe: number }>();

    for (const cuenta of cuentasFiltradas) {
      // Calcular saldo
      let saldo = cuenta.naturaleza === NaturalezaCuenta.DEUDORA
        ? cuenta.saldo.debe - cuenta.saldo.haber
        : cuenta.saldo.haber - cuenta.saldo.debe;

      if (invertirSigno) {
        saldo = -saldo;
      }

      // Determinar clave de agrupación
      const clave = cuenta.codigo.substring(0, Math.min(nivelDetalle, cuenta.codigo.length));

      if (!agrupadas.has(clave)) {
        agrupadas.set(clave, {
          nombre: this.getNombreNivel(cuenta, nivelDetalle),
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

  private getNombreNivel(cuenta: any, nivel: number): string {
    // Nombres estándar PGC para niveles superiores
    const nombresNivel: Record<string, string> = {
      '1': 'Financiación básica',
      '10': 'Capital',
      '11': 'Reservas',
      '12': 'Resultados pendientes',
      '13': 'Subvenciones',
      '17': 'Deudas a largo plazo',
      '2': 'Activo no corriente',
      '20': 'Inmovilizaciones intangibles',
      '21': 'Inmovilizaciones materiales',
      '22': 'Inversiones inmobiliarias',
      '23': 'Inmovilizaciones materiales en curso',
      '24': 'Inversiones financieras LP',
      '28': 'Amortización acumulada inmov.',
      '29': 'Deterioro de valor',
      '3': 'Existencias',
      '30': 'Comerciales',
      '31': 'Materias primas',
      '32': 'Otros aprovisionamientos',
      '33': 'Productos en curso',
      '34': 'Productos semiterminados',
      '35': 'Productos terminados',
      '36': 'Subproductos, residuos',
      '39': 'Deterioro existencias',
      '40': 'Proveedores',
      '41': 'Acreedores varios',
      '43': 'Clientes',
      '44': 'Deudores varios',
      '46': 'Personal',
      '47': 'Administraciones Públicas',
      '5': 'Cuentas financieras',
      '52': 'Deudas CP entidades crédito',
      '57': 'Tesorería',
    };

    const codigo = cuenta.codigo.substring(0, nivel);
    return nombresNivel[codigo] || cuenta.nombre;
  }

  private sumarPartidas(partidas: IPartidaBalance[]): number {
    return partidas.reduce((sum, p) => sum + p.importe, 0);
  }

  /**
   * Calcular resultado del ejercicio (ingresos - gastos)
   */
  private async calcularResultadoEjercicio(cuentas: any[]): Promise<number> {
    let ingresos = 0;
    let gastos = 0;

    for (const cuenta of cuentas) {
      if (cuenta.codigo.startsWith('7')) {
        // Ingresos (naturaleza acreedora)
        ingresos += cuenta.saldo.haber - cuenta.saldo.debe;
      } else if (cuenta.codigo.startsWith('6')) {
        // Gastos (naturaleza deudora)
        gastos += cuenta.saldo.debe - cuenta.saldo.haber;
      }
    }

    return ingresos - gastos;
  }
}

export const balanceSituacionService = new BalanceSituacionService();
