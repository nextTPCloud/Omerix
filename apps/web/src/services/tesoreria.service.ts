// apps/web/src/services/tesoreria.service.ts

import { api } from './api'

// ============================================
// TIPOS
// ============================================

export interface EstadisticasTesoreria {
  saldoPendienteCobro: number
  saldoPendientePago: number
  saldoNeto: number
  vencimientosSemana: { cobros: number; pagos: number }
  vencimientosMes: { cobros: number; pagos: number }
  vencimientosTrimestre: { cobros: number; pagos: number }
  pagaresPendientesRecibidos: number
  pagaresPendientesEmitidos: number
  recibosPendientes: number
  devolucionesMes: number
  importeDevuelto: number
  tasaDevolucion: number
  clientesMorosos: ClienteMoroso[]
  vencimientosProximosDias: VencimientoDia[]
}

export interface ClienteMoroso {
  clienteId: string
  nombre: string
  importePendiente: number
  diasMoraProm: number
  documentosPendientes: number
}

export interface VencimientoDia {
  fecha: string
  cobros: number
  pagos: number
}

export interface PrevisionCaja {
  saldoInicial: number
  prevision: PrevisionDia[]
  totales: {
    totalCobros: number
    totalPagos: number
    saldoFinal: number
  }
}

export interface PrevisionDia {
  fecha: string
  cobros: number
  pagos: number
  saldoDia: number
  saldoAcumulado: number
}

export interface ResumenCliente {
  vencimientos: {
    pendiente: number
    vencido: number
    countPendientes: number
    countVencidos: number
    diasMoraProm: number
    detalle: any[]
  }
  pagares: {
    porEstado: any[]
  }
  recibos: {
    porEstado: any[]
  }
}

// ============================================
// SERVICIO
// ============================================

class TesoreriaService {
  private baseUrl = '/api/tesoreria'

  /**
   * Obtener estadísticas generales de tesorería
   */
  async getEstadisticas(): Promise<{ success: boolean; data: EstadisticasTesoreria }> {
    const response = await api.get(`${this.baseUrl}/estadisticas`)
    return response.data
  }

  /**
   * Obtener previsión de caja
   */
  async getPrevisionCaja(
    dias: number = 30,
    saldoInicial: number = 0
  ): Promise<{ success: boolean; data: PrevisionCaja }> {
    const response = await api.get(`${this.baseUrl}/prevision-caja`, {
      params: { dias, saldoInicial },
    })
    return response.data
  }

  /**
   * Obtener resumen de tesorería de un cliente
   */
  async getResumenCliente(
    clienteId: string
  ): Promise<{ success: boolean; data: ResumenCliente }> {
    const response = await api.get(`${this.baseUrl}/cliente/${clienteId}/resumen`)
    return response.data
  }

  /**
   * Generar fichero SEPA Direct Debit
   */
  async generarSEPADirectDebit(data: {
    reciboIds: string[]
    fechaCobro: string
    cuentaBancariaEmpresa: string
  }): Promise<{ success: boolean; data: { contenido: string; nombreArchivo: string; totalImporte: number } }> {
    const response = await api.post(`${this.baseUrl}/ficheros-bancarios/sepa-dd`, data)
    return response.data
  }

  /**
   * Generar fichero SEPA Credit Transfer
   */
  async generarSEPACreditTransfer(data: {
    vencimientoIds: string[]
    fechaPago: string
    cuentaBancariaEmpresa: string
  }): Promise<{ success: boolean; data: { contenido: string; nombreArchivo: string; totalImporte: number } }> {
    const response = await api.post(`${this.baseUrl}/ficheros-bancarios/sepa-ct`, data)
    return response.data
  }

  /**
   * Generar fichero Norma 19
   */
  async generarNorma19(data: {
    reciboIds: string[]
    fechaCobro: string
    cuentaBancariaEmpresa: string
    codigoOrdenante: string
  }): Promise<{ success: boolean; data: { contenido: string; nombreArchivo: string; totalImporte: number } }> {
    const response = await api.post(`${this.baseUrl}/ficheros-bancarios/norma19`, data)
    return response.data
  }

  /**
   * Descargar fichero generado
   */
  descargarFichero(contenido: string, nombreArchivo: string): void {
    const blob = new Blob([contenido], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export const tesoreriaService = new TesoreriaService()
