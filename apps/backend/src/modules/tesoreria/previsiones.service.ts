import mongoose, { Types } from 'mongoose';
import { IDatabaseConfig } from '../../types/database.types';
import Empresa from '../empresa/Empresa';
import {
  getVencimientoModel,
  getPagareModel,
  getReciboModel,
  getMovimientoBancarioModel,
  getCuentaBancariaModel,
} from '../../utils/dynamic-models.helper';
import { EstadoVencimiento, TipoVencimiento } from '../../models/Vencimiento';
import { EstadoPagare, TipoPagare } from './Pagare';
import { TipoMovimiento, EstadoMovimiento } from './models/MovimientoBancario';

// ============================================
// TIPOS
// ============================================

// Tipo de movimiento previsto
export enum TipoMovimientoPrevisto {
  VENCIMIENTO_COBRO = 'vencimiento_cobro',
  VENCIMIENTO_PAGO = 'vencimiento_pago',
  PAGARE_RECIBIDO = 'pagare_recibido',
  PAGARE_EMITIDO = 'pagare_emitido',
  RECIBO = 'recibo',
  MOVIMIENTO_PROGRAMADO = 'movimiento_programado',
  SIMULACION = 'simulacion',
}

// Movimiento previsto individual
export interface MovimientoPrevisto {
  id: string;
  tipo: TipoMovimientoPrevisto;
  fecha: Date;
  importe: number;
  esEntrada: boolean;
  concepto: string;
  terceroNombre?: string;
  documentoNumero?: string;
  documentoId?: string;
  probabilidadCobro?: number; // 0-100 para cobros
  esSimulacion?: boolean;
  cuentaBancariaId?: string;
}

// Previsión diaria
export interface PrevisionDiaria {
  fecha: string;
  entradas: number;
  salidas: number;
  saldoDia: number;
  saldoAcumulado: number;
  movimientos: MovimientoPrevisto[];
  alertaDescubierto: boolean;
}

// Alerta de descubierto
export interface AlertaDescubierto {
  fecha: string;
  saldoPrevisto: number;
  deficit: number;
  diasHastaDescubierto: number;
  movimientosCausantes: MovimientoPrevisto[];
  sugerencias: string[];
}

// Escenario de simulación
export interface EscenarioSimulacion {
  id: string;
  nombre: string;
  movimientos: MovimientoSimulado[];
  resultados?: ResultadoSimulacion;
}

// Movimiento simulado
export interface MovimientoSimulado {
  id: string;
  fecha: string;
  importe: number;
  esEntrada: boolean;
  concepto: string;
  probabilidad?: number; // 0-100
}

// Resultado de simulación
export interface ResultadoSimulacion {
  saldoFinal: number;
  saldoMinimo: number;
  fechaSaldoMinimo: string;
  diasDescubierto: number;
  prevision: PrevisionDiaria[];
}

// Previsión completa
export interface PrevisionCompleta {
  saldoInicial: number;
  saldoActualCuentas: number;
  previsionDiaria: PrevisionDiaria[];
  alertasDescubierto: AlertaDescubierto[];
  resumen: {
    totalEntradas: number;
    totalSalidas: number;
    saldoFinal: number;
    saldoMinimo: number;
    fechaSaldoMinimo: string;
    diasDescubierto: number;
    probabilidadDescubierto: number;
  };
  porCuenta?: {
    cuentaId: string;
    cuentaNombre: string;
    saldoActual: number;
    saldoPrevisto: number;
    alertas: number;
  }[];
}

// Configuración de previsión
export interface ConfiguracionPrevision {
  dias: number;
  saldoInicial?: number;
  incluirCuentas?: string[];
  incluirProbabilidades?: boolean;
  umbralAlerta?: number; // Saldo mínimo antes de alertar
  escenarios?: EscenarioSimulacion[];
}

// ============================================
// SERVICIO
// ============================================

class PrevisionesService {
  /**
   * Obtiene la configuración de BD de una empresa
   */
  private async getDbConfig(empresaId: string): Promise<IDatabaseConfig> {
    const empresa = await Empresa.findById(empresaId).lean();
    if (!empresa) {
      throw new Error('Empresa no encontrada');
    }
    if (!empresa.databaseConfig) {
      throw new Error('Configuracion de base de datos no encontrada para esta empresa');
    }
    return empresa.databaseConfig;
  }

  /**
   * Obtener previsión completa de tesorería
   */
  async getPrevisionCompleta(
    empresaId: string,
    config: ConfiguracionPrevision
  ): Promise<PrevisionCompleta> {
    const dbConfig = await this.getDbConfig(empresaId);
    const VencimientoModel = await getVencimientoModel(empresaId, dbConfig);
    const PagareModel = await getPagareModel(empresaId, dbConfig);
    const CuentaBancaria = await getCuentaBancariaModel(empresaId, dbConfig);
    const MovimientoBancario = await getMovimientoBancarioModel(empresaId, dbConfig);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaFin = new Date(hoy);
    fechaFin.setDate(fechaFin.getDate() + config.dias);

    // Obtener saldo actual de cuentas bancarias
    let saldoActualCuentas = 0;
    const cuentasQuery: any = { activa: true };
    if (config.incluirCuentas?.length) {
      cuentasQuery._id = { $in: config.incluirCuentas.map(id => new Types.ObjectId(id)) };
    }

    const cuentas = await CuentaBancaria.find(cuentasQuery).lean();
    saldoActualCuentas = cuentas.reduce((sum, c: any) => sum + (c.saldoActual || 0), 0);

    // Saldo inicial: proporcionado o el actual de las cuentas
    const saldoInicial = config.saldoInicial ?? saldoActualCuentas;

    // Recolectar todos los movimientos previstos
    const movimientosPrevistos: MovimientoPrevisto[] = [];

    // 1. Vencimientos de cobro y pago
    const vencimientos = await VencimientoModel.find({
      estado: { $in: [EstadoVencimiento.PENDIENTE, EstadoVencimiento.PARCIAL] },
      fechaVencimiento: { $gte: hoy, $lte: fechaFin },
    }).lean();

    for (const v of vencimientos) {
      movimientosPrevistos.push({
        id: v._id.toString(),
        tipo: v.tipo === TipoVencimiento.COBRO
          ? TipoMovimientoPrevisto.VENCIMIENTO_COBRO
          : TipoMovimientoPrevisto.VENCIMIENTO_PAGO,
        fecha: new Date(v.fechaVencimiento),
        importe: v.importePendiente,
        esEntrada: v.tipo === TipoVencimiento.COBRO,
        concepto: `Vencimiento ${v.documentoNumero || ''}`,
        terceroNombre: v.terceroNombre,
        documentoNumero: v.documentoNumero,
        documentoId: v.documentoId?.toString(),
        probabilidadCobro: this.calcularProbabilidadCobro(v),
      });
    }

    // 2. Pagarés pendientes
    const pagares = await PagareModel.find({
      estado: { $in: [EstadoPagare.PENDIENTE, EstadoPagare.EN_CARTERA] },
      fechaVencimiento: { $gte: hoy, $lte: fechaFin },
    }).lean();

    for (const p of pagares) {
      movimientosPrevistos.push({
        id: p._id.toString(),
        tipo: p.tipo === TipoPagare.RECIBIDO
          ? TipoMovimientoPrevisto.PAGARE_RECIBIDO
          : TipoMovimientoPrevisto.PAGARE_EMITIDO,
        fecha: new Date(p.fechaVencimiento),
        importe: p.importe,
        esEntrada: p.tipo === TipoPagare.RECIBIDO,
        concepto: `Pagaré ${p.numero}`,
        terceroNombre: p.terceroNombre,
        documentoNumero: p.numero,
        documentoId: p._id.toString(),
        probabilidadCobro: p.tipo === TipoPagare.RECIBIDO ? 95 : undefined,
      });
    }

    // 3. Añadir movimientos de simulación si existen
    if (config.escenarios?.length) {
      for (const escenario of config.escenarios) {
        for (const mov of escenario.movimientos) {
          movimientosPrevistos.push({
            id: `sim_${escenario.id}_${mov.id}`,
            tipo: TipoMovimientoPrevisto.SIMULACION,
            fecha: new Date(mov.fecha),
            importe: mov.importe,
            esEntrada: mov.esEntrada,
            concepto: `[Simulación] ${mov.concepto}`,
            probabilidadCobro: mov.probabilidad,
            esSimulacion: true,
          });
        }
      }
    }

    // Ordenar por fecha
    movimientosPrevistos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    // Construir previsión diaria
    const previsionDiaria: PrevisionDiaria[] = [];
    const alertasDescubierto: AlertaDescubierto[] = [];
    const umbralAlerta = config.umbralAlerta ?? 0;

    let saldoAcumulado = saldoInicial;
    let saldoMinimo = saldoInicial;
    let fechaSaldoMinimo = hoy.toISOString().slice(0, 10);
    let diasDescubierto = 0;
    let totalEntradas = 0;
    let totalSalidas = 0;

    // Inicializar mapa de días
    const diasMap = new Map<string, PrevisionDiaria>();
    for (let i = 0; i <= config.dias; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + i);
      const fechaStr = fecha.toISOString().slice(0, 10);
      diasMap.set(fechaStr, {
        fecha: fechaStr,
        entradas: 0,
        salidas: 0,
        saldoDia: 0,
        saldoAcumulado: 0,
        movimientos: [],
        alertaDescubierto: false,
      });
    }

    // Agregar movimientos a cada día
    for (const mov of movimientosPrevistos) {
      const fechaStr = mov.fecha.toISOString().slice(0, 10);
      const dia = diasMap.get(fechaStr);
      if (dia) {
        dia.movimientos.push(mov);

        // Aplicar probabilidad si está activado
        let importeEfectivo = mov.importe;
        if (config.incluirProbabilidades && mov.probabilidadCobro !== undefined && mov.esEntrada) {
          importeEfectivo = mov.importe * (mov.probabilidadCobro / 100);
        }

        if (mov.esEntrada) {
          dia.entradas += importeEfectivo;
          totalEntradas += importeEfectivo;
        } else {
          dia.salidas += importeEfectivo;
          totalSalidas += importeEfectivo;
        }
      }
    }

    // Calcular saldos acumulados y detectar descubiertos
    for (const [fechaStr, dia] of diasMap) {
      dia.saldoDia = dia.entradas - dia.salidas;
      saldoAcumulado += dia.saldoDia;
      dia.saldoAcumulado = saldoAcumulado;

      // Detectar descubierto
      if (saldoAcumulado < umbralAlerta) {
        dia.alertaDescubierto = true;
        diasDescubierto++;

        // Crear alerta detallada
        const diasHasta = Math.floor(
          (new Date(fechaStr).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Encontrar movimientos causantes (salidas grandes del día)
        const causantes = dia.movimientos
          .filter(m => !m.esEntrada && m.importe > 0)
          .sort((a, b) => b.importe - a.importe)
          .slice(0, 3);

        alertasDescubierto.push({
          fecha: fechaStr,
          saldoPrevisto: saldoAcumulado,
          deficit: umbralAlerta - saldoAcumulado,
          diasHastaDescubierto: diasHasta,
          movimientosCausantes: causantes,
          sugerencias: this.generarSugerencias(dia, saldoAcumulado, umbralAlerta),
        });
      }

      // Actualizar mínimo
      if (saldoAcumulado < saldoMinimo) {
        saldoMinimo = saldoAcumulado;
        fechaSaldoMinimo = fechaStr;
      }

      previsionDiaria.push(dia);
    }

    // Calcular probabilidad de descubierto
    const probabilidadDescubierto = config.dias > 0
      ? Math.round((diasDescubierto / config.dias) * 100)
      : 0;

    // Previsión por cuenta bancaria
    const porCuenta = cuentas.map((c: any) => ({
      cuentaId: c._id.toString(),
      cuentaNombre: c.alias || `${c.banco} - ...${c.iban?.slice(-4)}`,
      saldoActual: c.saldoActual || 0,
      saldoPrevisto: (c.saldoActual || 0) + (saldoAcumulado - saldoInicial),
      alertas: alertasDescubierto.length,
    }));

    return {
      saldoInicial,
      saldoActualCuentas,
      previsionDiaria,
      alertasDescubierto,
      resumen: {
        totalEntradas,
        totalSalidas,
        saldoFinal: saldoAcumulado,
        saldoMinimo,
        fechaSaldoMinimo,
        diasDescubierto,
        probabilidadDescubierto,
      },
      porCuenta,
    };
  }

  /**
   * Ejecutar simulación what-if
   */
  async ejecutarSimulacion(
    empresaId: string,
    escenario: EscenarioSimulacion,
    diasPrevision: number = 90
  ): Promise<ResultadoSimulacion> {
    const prevision = await this.getPrevisionCompleta(empresaId, {
      dias: diasPrevision,
      escenarios: [escenario],
      incluirProbabilidades: true,
    });

    return {
      saldoFinal: prevision.resumen.saldoFinal,
      saldoMinimo: prevision.resumen.saldoMinimo,
      fechaSaldoMinimo: prevision.resumen.fechaSaldoMinimo,
      diasDescubierto: prevision.resumen.diasDescubierto,
      prevision: prevision.previsionDiaria,
    };
  }

  /**
   * Comparar múltiples escenarios
   */
  async compararEscenarios(
    empresaId: string,
    escenarios: EscenarioSimulacion[],
    diasPrevision: number = 90
  ): Promise<{
    escenarioBase: ResultadoSimulacion;
    escenarios: { escenario: EscenarioSimulacion; resultado: ResultadoSimulacion }[];
    comparativa: {
      mejorEscenario: string;
      peorEscenario: string;
      diferenciaMaxima: number;
    };
  }> {
    // Escenario base (sin simulaciones)
    const previsionBase = await this.getPrevisionCompleta(empresaId, {
      dias: diasPrevision,
      incluirProbabilidades: true,
    });

    const escenarioBase: ResultadoSimulacion = {
      saldoFinal: previsionBase.resumen.saldoFinal,
      saldoMinimo: previsionBase.resumen.saldoMinimo,
      fechaSaldoMinimo: previsionBase.resumen.fechaSaldoMinimo,
      diasDescubierto: previsionBase.resumen.diasDescubierto,
      prevision: previsionBase.previsionDiaria,
    };

    // Ejecutar cada escenario
    const resultados = await Promise.all(
      escenarios.map(async (esc) => ({
        escenario: esc,
        resultado: await this.ejecutarSimulacion(empresaId, esc, diasPrevision),
      }))
    );

    // Encontrar mejor y peor escenario
    let mejorIdx = 0;
    let peorIdx = 0;
    let maxSaldo = resultados[0]?.resultado.saldoMinimo ?? 0;
    let minSaldo = resultados[0]?.resultado.saldoMinimo ?? 0;

    resultados.forEach((r, i) => {
      if (r.resultado.saldoMinimo > maxSaldo) {
        maxSaldo = r.resultado.saldoMinimo;
        mejorIdx = i;
      }
      if (r.resultado.saldoMinimo < minSaldo) {
        minSaldo = r.resultado.saldoMinimo;
        peorIdx = i;
      }
    });

    return {
      escenarioBase,
      escenarios: resultados,
      comparativa: {
        mejorEscenario: resultados[mejorIdx]?.escenario.nombre || 'N/A',
        peorEscenario: resultados[peorIdx]?.escenario.nombre || 'N/A',
        diferenciaMaxima: maxSaldo - minSaldo,
      },
    };
  }

  /**
   * Obtener alertas de descubierto activas
   */
  async getAlertasDescubierto(
    empresaId: string,
    dias: number = 30,
    umbral: number = 0
  ): Promise<AlertaDescubierto[]> {
    const prevision = await this.getPrevisionCompleta(empresaId, {
      dias,
      umbralAlerta: umbral,
    });

    return prevision.alertasDescubierto;
  }

  /**
   * Obtener resumen ejecutivo de previsión
   */
  async getResumenEjecutivo(empresaId: string): Promise<{
    saldoActual: number;
    prevision7Dias: { entradas: number; salidas: number; saldoFinal: number };
    prevision30Dias: { entradas: number; salidas: number; saldoFinal: number };
    prevision90Dias: { entradas: number; salidas: number; saldoFinal: number };
    alertasProximas: AlertaDescubierto[];
    riesgoDescubierto: 'bajo' | 'medio' | 'alto' | 'critico';
  }> {
    const [prev7, prev30, prev90] = await Promise.all([
      this.getPrevisionCompleta(empresaId, { dias: 7, umbralAlerta: 0 }),
      this.getPrevisionCompleta(empresaId, { dias: 30, umbralAlerta: 0 }),
      this.getPrevisionCompleta(empresaId, { dias: 90, umbralAlerta: 0 }),
    ]);

    // Determinar nivel de riesgo
    let riesgoDescubierto: 'bajo' | 'medio' | 'alto' | 'critico';
    if (prev7.alertasDescubierto.length > 0) {
      riesgoDescubierto = 'critico';
    } else if (prev30.alertasDescubierto.length > 0) {
      riesgoDescubierto = 'alto';
    } else if (prev90.alertasDescubierto.length > 0) {
      riesgoDescubierto = 'medio';
    } else {
      riesgoDescubierto = 'bajo';
    }

    return {
      saldoActual: prev7.saldoActualCuentas,
      prevision7Dias: {
        entradas: prev7.resumen.totalEntradas,
        salidas: prev7.resumen.totalSalidas,
        saldoFinal: prev7.resumen.saldoFinal,
      },
      prevision30Dias: {
        entradas: prev30.resumen.totalEntradas,
        salidas: prev30.resumen.totalSalidas,
        saldoFinal: prev30.resumen.saldoFinal,
      },
      prevision90Dias: {
        entradas: prev90.resumen.totalEntradas,
        salidas: prev90.resumen.totalSalidas,
        saldoFinal: prev90.resumen.saldoFinal,
      },
      alertasProximas: prev30.alertasDescubierto.slice(0, 5),
      riesgoDescubierto,
    };
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Calcular probabilidad de cobro basada en historial del cliente
   */
  private calcularProbabilidadCobro(vencimiento: any): number {
    // Factores que afectan la probabilidad:
    // - Días vencido: si ya está vencido, menor probabilidad
    // - Historial de pagos del cliente (futuro: implementar)
    // - Tipo de documento
    // - Importe (importes muy altos suelen tener más retraso)

    let probabilidad = 90; // Base

    const hoy = new Date();
    const fechaVenc = new Date(vencimiento.fechaVencimiento);
    const diasVencido = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));

    if (diasVencido > 0) {
      // Ya vencido
      if (diasVencido <= 7) probabilidad = 80;
      else if (diasVencido <= 30) probabilidad = 60;
      else if (diasVencido <= 60) probabilidad = 40;
      else if (diasVencido <= 90) probabilidad = 25;
      else probabilidad = 10;
    } else {
      // Aún no vencido
      const diasHastaVenc = Math.abs(diasVencido);
      if (diasHastaVenc <= 7) probabilidad = 95;
      else if (diasHastaVenc <= 30) probabilidad = 90;
      else if (diasHastaVenc <= 60) probabilidad = 85;
      else probabilidad = 80;
    }

    // Ajuste por importe (importes > 10000€ tienen ligera reducción)
    if (vencimiento.importe > 10000) {
      probabilidad -= 5;
    }
    if (vencimiento.importe > 50000) {
      probabilidad -= 5;
    }

    return Math.max(5, Math.min(100, probabilidad));
  }

  /**
   * Generar sugerencias para evitar descubierto
   */
  private generarSugerencias(
    dia: PrevisionDiaria,
    saldoPrevisto: number,
    umbral: number
  ): string[] {
    const sugerencias: string[] = [];
    const deficit = umbral - saldoPrevisto;

    // Sugerencia 1: Adelantar cobros
    const cobrosPendientes = dia.movimientos.filter(
      m => m.esEntrada && m.tipo !== TipoMovimientoPrevisto.SIMULACION
    );
    if (cobrosPendientes.length > 0) {
      sugerencias.push(
        `Adelantar cobro de ${cobrosPendientes.length} vencimiento(s) pendiente(s)`
      );
    }

    // Sugerencia 2: Negociar aplazamiento de pagos
    const pagosDia = dia.movimientos.filter(m => !m.esEntrada);
    if (pagosDia.length > 0) {
      const importeTotalPagos = pagosDia.reduce((sum, m) => sum + m.importe, 0);
      if (importeTotalPagos > deficit) {
        sugerencias.push(
          `Negociar aplazamiento de pagos por valor de ${deficit.toFixed(2)}€`
        );
      }
    }

    // Sugerencia 3: Línea de crédito
    if (deficit > 5000) {
      sugerencias.push(`Considerar uso de línea de crédito o póliza de ${deficit.toFixed(2)}€`);
    }

    // Sugerencia 4: Factoring
    if (cobrosPendientes.length > 0 && deficit > 1000) {
      const importeCobros = cobrosPendientes.reduce((sum, m) => sum + m.importe, 0);
      if (importeCobros >= deficit) {
        sugerencias.push('Valorar anticipar facturas mediante factoring');
      }
    }

    return sugerencias;
  }
}

export const previsionesService = new PrevisionesService();
