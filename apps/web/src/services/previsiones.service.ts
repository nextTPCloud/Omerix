import { api } from './api'

// ============================================
// TIPOS
// ============================================

// Tipo de movimiento previsto
export type TipoMovimientoPrevisto =
  | 'vencimiento_cobro'
  | 'vencimiento_pago'
  | 'pagare_recibido'
  | 'pagare_emitido'
  | 'recibo'
  | 'movimiento_programado'
  | 'simulacion'

// Movimiento previsto individual
export interface MovimientoPrevisto {
  id: string
  tipo: TipoMovimientoPrevisto
  fecha: string
  importe: number
  esEntrada: boolean
  concepto: string
  terceroNombre?: string
  documentoNumero?: string
  documentoId?: string
  probabilidadCobro?: number
  esSimulacion?: boolean
  cuentaBancariaId?: string
}

// Previsión diaria
export interface PrevisionDiaria {
  fecha: string
  entradas: number
  salidas: number
  saldoDia: number
  saldoAcumulado: number
  movimientos: MovimientoPrevisto[]
  alertaDescubierto: boolean
}

// Alerta de descubierto
export interface AlertaDescubierto {
  fecha: string
  saldoPrevisto: number
  deficit: number
  diasHastaDescubierto: number
  movimientosCausantes: MovimientoPrevisto[]
  sugerencias: string[]
}

// Escenario de simulación
export interface EscenarioSimulacion {
  id?: string
  nombre: string
  movimientos: MovimientoSimulado[]
}

// Movimiento simulado
export interface MovimientoSimulado {
  id?: string
  fecha: string
  importe: number
  esEntrada: boolean
  concepto: string
  probabilidad?: number
}

// Resultado de simulación
export interface ResultadoSimulacion {
  saldoFinal: number
  saldoMinimo: number
  fechaSaldoMinimo: string
  diasDescubierto: number
  prevision: PrevisionDiaria[]
}

// Previsión completa
export interface PrevisionCompleta {
  saldoInicial: number
  saldoActualCuentas: number
  previsionDiaria: PrevisionDiaria[]
  alertasDescubierto: AlertaDescubierto[]
  resumen: {
    totalEntradas: number
    totalSalidas: number
    saldoFinal: number
    saldoMinimo: number
    fechaSaldoMinimo: string
    diasDescubierto: number
    probabilidadDescubierto: number
  }
  porCuenta?: {
    cuentaId: string
    cuentaNombre: string
    saldoActual: number
    saldoPrevisto: number
    alertas: number
  }[]
}

// Resumen ejecutivo
export interface ResumenEjecutivo {
  saldoActual: number
  prevision7Dias: { entradas: number; salidas: number; saldoFinal: number }
  prevision30Dias: { entradas: number; salidas: number; saldoFinal: number }
  prevision90Dias: { entradas: number; salidas: number; saldoFinal: number }
  alertasProximas: AlertaDescubierto[]
  riesgoDescubierto: 'bajo' | 'medio' | 'alto' | 'critico'
}

// Sugerencia
export interface Sugerencia {
  tipo: string
  descripcion: string
  impacto: string
}

// Comparativa de escenarios
export interface ComparativaEscenarios {
  escenarioBase: ResultadoSimulacion
  escenarios: { escenario: EscenarioSimulacion; resultado: ResultadoSimulacion }[]
  comparativa: {
    mejorEscenario: string
    peorEscenario: string
    diferenciaMaxima: number
  }
}

// Respuestas API
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ============================================
// SERVICIO
// ============================================

class PrevisionesService {
  private baseUrl = '/previsiones'

  /**
   * Obtener previsión completa de tesorería
   */
  async getPrevision(config: {
    dias?: number
    saldoInicial?: number
    cuentas?: string[]
    incluirProbabilidades?: boolean
    umbralAlerta?: number
  } = {}): Promise<ApiResponse<PrevisionCompleta>> {
    const params = new URLSearchParams()

    if (config.dias) params.append('dias', config.dias.toString())
    if (config.saldoInicial !== undefined) params.append('saldoInicial', config.saldoInicial.toString())
    if (config.cuentas?.length) params.append('cuentas', config.cuentas.join(','))
    if (config.incluirProbabilidades !== undefined) {
      params.append('incluirProbabilidades', config.incluirProbabilidades.toString())
    }
    if (config.umbralAlerta !== undefined) params.append('umbralAlerta', config.umbralAlerta.toString())

    const response = await api.get<ApiResponse<PrevisionCompleta>>(
      `${this.baseUrl}?${params.toString()}`
    )
    return response.data
  }

  /**
   * Obtener resumen ejecutivo
   */
  async getResumenEjecutivo(): Promise<ApiResponse<ResumenEjecutivo>> {
    const response = await api.get<ApiResponse<ResumenEjecutivo>>(`${this.baseUrl}/resumen`)
    return response.data
  }

  /**
   * Obtener alertas de descubierto
   */
  async getAlertas(dias?: number, umbral?: number): Promise<ApiResponse<AlertaDescubierto[]>> {
    const params = new URLSearchParams()
    if (dias) params.append('dias', dias.toString())
    if (umbral !== undefined) params.append('umbral', umbral.toString())

    const response = await api.get<ApiResponse<AlertaDescubierto[]>>(
      `${this.baseUrl}/alertas?${params.toString()}`
    )
    return response.data
  }

  /**
   * Obtener sugerencias para mejorar flujo de caja
   */
  async getSugerencias(dias?: number): Promise<
    ApiResponse<{
      data: Sugerencia[]
      resumen: {
        saldoActual: number
        saldoPrevisto: number
        alertasDescubierto: number
        riesgo: string
      }
    }>
  > {
    const params = new URLSearchParams()
    if (dias) params.append('dias', dias.toString())

    const response = await api.get<any>(`${this.baseUrl}/sugerencias?${params.toString()}`)
    return response.data
  }

  /**
   * Ejecutar simulación what-if
   */
  async simular(
    escenario: EscenarioSimulacion,
    dias?: number
  ): Promise<ApiResponse<ResultadoSimulacion>> {
    const response = await api.post<ApiResponse<ResultadoSimulacion>>(`${this.baseUrl}/simular`, {
      escenario,
      dias: dias || 90,
    })
    return response.data
  }

  /**
   * Comparar múltiples escenarios
   */
  async compararEscenarios(
    escenarios: EscenarioSimulacion[],
    dias?: number
  ): Promise<ApiResponse<ComparativaEscenarios>> {
    const response = await api.post<ApiResponse<ComparativaEscenarios>>(
      `${this.baseUrl}/comparar`,
      {
        escenarios,
        dias: dias || 90,
      }
    )
    return response.data
  }

  // ============================================
  // UTILIDADES
  // ============================================

  getTipoLabel(tipo: TipoMovimientoPrevisto): string {
    const labels: Record<TipoMovimientoPrevisto, string> = {
      vencimiento_cobro: 'Vencimiento Cobro',
      vencimiento_pago: 'Vencimiento Pago',
      pagare_recibido: 'Pagaré Recibido',
      pagare_emitido: 'Pagaré Emitido',
      recibo: 'Recibo',
      movimiento_programado: 'Programado',
      simulacion: 'Simulación',
    }
    return labels[tipo] || tipo
  }

  getRiesgoColor(riesgo: 'bajo' | 'medio' | 'alto' | 'critico'): string {
    const colors: Record<string, string> = {
      bajo: 'text-green-600',
      medio: 'text-yellow-600',
      alto: 'text-orange-600',
      critico: 'text-red-600',
    }
    return colors[riesgo] || 'text-gray-600'
  }

  getRiesgoBadgeVariant(
    riesgo: 'bajo' | 'medio' | 'alto' | 'critico'
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      bajo: 'default',
      medio: 'secondary',
      alto: 'destructive',
      critico: 'destructive',
    }
    return variants[riesgo] || 'outline'
  }

  getProbabilidadColor(probabilidad: number): string {
    if (probabilidad >= 90) return 'text-green-600'
    if (probabilidad >= 70) return 'text-blue-600'
    if (probabilidad >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }
}

export const previsionesService = new PrevisionesService()
