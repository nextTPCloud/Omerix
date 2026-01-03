import { api } from './api'

// ============================================
// TIPOS
// ============================================

// Estado del movimiento del extracto
export type EstadoExtracto = 'pendiente' | 'sugerido' | 'conciliado' | 'descartado'

// Origen del extracto
export type OrigenExtracto = 'csv' | 'norma43' | 'ofx' | 'qfx'

// Tipo de movimiento
export type TipoMovimientoExtracto = 'cargo' | 'abono'

// Estado de la importación
export type EstadoImportacion = 'en_proceso' | 'completada' | 'cancelada' | 'error'

// Movimiento del extracto bancario
export interface MovimientoExtracto {
  _id: string
  importacionId: string
  numeroLinea: number
  tipo: TipoMovimientoExtracto
  fecha: string
  fechaValor?: string
  concepto: string
  conceptoOriginal: string
  importe: number
  saldo?: number
  referenciaBanco?: string
  codigoOperacion?: string
  cuentaBancariaId: string
  cuentaBancariaNombre?: string
  estado: EstadoExtracto
  movimientoBancarioId?: string
  confianzaMatch?: number
  motivoMatch?: string
  criteriosMatch?: string[]
  creadoPor: string
  fechaCreacion: string
  conciliadoPor?: string
  fechaConciliacion?: string
  descartadoPor?: string
  fechaDescarte?: string
  motivoDescarte?: string
  activo: boolean
}

// Importación de extracto
export interface ImportacionExtracto {
  _id: string
  nombreArchivo: string
  formatoOrigen: OrigenExtracto
  tamanoArchivo?: number
  hashArchivo?: string
  cuentaBancariaId: string
  cuentaBancariaNombre?: string
  fechaInicio: string
  fechaFin: string
  saldoInicial?: number
  saldoFinal?: number
  totalMovimientos: number
  movimientosConciliados: number
  movimientosPendientes: number
  movimientosSugeridos: number
  movimientosDescartados: number
  estado: EstadoImportacion
  mensajeError?: string
  creadoPor: string
  fechaCreacion: string
  finalizadoPor?: string
  fechaFinalizacion?: string
  activo: boolean
}

// Configuración para CSV
export interface CSVConfig {
  separador: string
  formatoFecha: string
  columnaFecha: number
  columnaConcepto: number
  columnaImporte: number
  columnaSaldo?: number
  columnaReferencia?: number
  tieneEncabezado: boolean
  signoNegativoEntrada?: boolean
}

// Resultado del matching
export interface MatchResult {
  movimientoExtractoId: string
  movimientoBancarioId: string
  confianza: number
  motivo: string
  criterios: string[]
}

// Respuestas API
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    pages: number
  }
}

// ============================================
// SERVICIO
// ============================================

class ConciliacionService {
  private baseUrl = '/conciliacion'

  /**
   * Importar extracto bancario
   */
  async importar(
    cuentaBancariaId: string,
    nombreArchivo: string,
    contenido: string,
    configCSV?: CSVConfig
  ): Promise<ApiResponse<ImportacionExtracto>> {
    const response = await api.post<ApiResponse<ImportacionExtracto>>(
      `${this.baseUrl}/importar`,
      { cuentaBancariaId, nombreArchivo, contenido, configCSV }
    )
    return response.data
  }

  /**
   * Listar importaciones
   */
  async getImportaciones(cuentaBancariaId?: string): Promise<ApiResponse<ImportacionExtracto[]>> {
    const params = new URLSearchParams()
    if (cuentaBancariaId) params.append('cuentaBancariaId', cuentaBancariaId)

    const response = await api.get<ApiResponse<ImportacionExtracto[]>>(
      `${this.baseUrl}/importaciones?${params.toString()}`
    )
    return response.data
  }

  /**
   * Obtener una importación
   */
  async getImportacion(id: string): Promise<ApiResponse<ImportacionExtracto>> {
    const response = await api.get<ApiResponse<ImportacionExtracto>>(
      `${this.baseUrl}/importaciones/${id}`
    )
    return response.data
  }

  /**
   * Listar movimientos de extracto de una importación
   */
  async getMovimientosExtracto(
    importacionId: string,
    filtros: { estado?: EstadoExtracto; pagina?: number; limite?: number } = {}
  ): Promise<PaginatedResponse<MovimientoExtracto>> {
    const params = new URLSearchParams()
    if (filtros.estado) params.append('estado', filtros.estado)
    if (filtros.pagina) params.append('pagina', filtros.pagina.toString())
    if (filtros.limite) params.append('limite', filtros.limite.toString())

    const response = await api.get<PaginatedResponse<MovimientoExtracto>>(
      `${this.baseUrl}/importaciones/${importacionId}/movimientos?${params.toString()}`
    )
    return response.data
  }

  /**
   * Ejecutar matching automático
   */
  async ejecutarMatching(importacionId: string): Promise<ApiResponse<MatchResult[]>> {
    const response = await api.post<ApiResponse<MatchResult[]>>(
      `${this.baseUrl}/importaciones/${importacionId}/matching`
    )
    return response.data
  }

  /**
   * Aprobar match sugerido
   */
  async aprobarMatch(movimientoExtractoId: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(
      `${this.baseUrl}/movimientos/${movimientoExtractoId}/aprobar`
    )
    return response.data
  }

  /**
   * Rechazar match sugerido
   */
  async rechazarMatch(movimientoExtractoId: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(
      `${this.baseUrl}/movimientos/${movimientoExtractoId}/rechazar`
    )
    return response.data
  }

  /**
   * Conciliar manualmente
   */
  async conciliarManual(
    movimientoExtractoId: string,
    movimientoBancarioId: string
  ): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(
      `${this.baseUrl}/movimientos/${movimientoExtractoId}/conciliar`,
      { movimientoBancarioId }
    )
    return response.data
  }

  /**
   * Descartar movimiento
   */
  async descartarMovimiento(
    movimientoExtractoId: string,
    motivo: string
  ): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(
      `${this.baseUrl}/movimientos/${movimientoExtractoId}/descartar`,
      { motivo }
    )
    return response.data
  }

  /**
   * Buscar movimientos bancarios para conciliación manual
   */
  async buscarMovimientosBancarios(
    cuentaBancariaId: string,
    tipo: TipoMovimientoExtracto,
    importe: number,
    fecha: string,
    margenDias?: number
  ): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams()
    params.append('cuentaBancariaId', cuentaBancariaId)
    params.append('tipo', tipo)
    params.append('importe', importe.toString())
    params.append('fecha', fecha)
    if (margenDias) params.append('margenDias', margenDias.toString())

    const response = await api.get<ApiResponse<any[]>>(
      `${this.baseUrl}/buscar-movimientos?${params.toString()}`
    )
    return response.data
  }

  /**
   * Finalizar importación
   */
  async finalizarImportacion(importacionId: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(
      `${this.baseUrl}/importaciones/${importacionId}/finalizar`
    )
    return response.data
  }

  // ============================================
  // UTILIDADES
  // ============================================

  getEstadoLabel(estado: EstadoExtracto): string {
    const labels: Record<EstadoExtracto, string> = {
      pendiente: 'Pendiente',
      sugerido: 'Sugerido',
      conciliado: 'Conciliado',
      descartado: 'Descartado',
    }
    return labels[estado] || estado
  }

  getEstadoColor(estado: EstadoExtracto): 'default' | 'secondary' | 'destructive' | 'outline' {
    const colors: Record<EstadoExtracto, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pendiente: 'outline',
      sugerido: 'secondary',
      conciliado: 'default',
      descartado: 'destructive',
    }
    return colors[estado] || 'outline'
  }

  getTipoLabel(tipo: TipoMovimientoExtracto): string {
    return tipo === 'abono' ? 'Entrada' : 'Salida'
  }

  getFormatoLabel(formato: OrigenExtracto): string {
    const labels: Record<OrigenExtracto, string> = {
      csv: 'CSV',
      norma43: 'Norma 43',
      ofx: 'OFX',
      qfx: 'QFX',
    }
    return labels[formato] || formato
  }

  getConfianzaColor(confianza: number): string {
    if (confianza >= 90) return 'text-green-600'
    if (confianza >= 75) return 'text-blue-600'
    if (confianza >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  /**
   * Leer archivo como texto
   */
  async leerArchivo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * Detectar formato de archivo
   */
  detectarFormato(nombreArchivo: string): OrigenExtracto {
    const ext = nombreArchivo.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'n43':
      case 'aeb':
        return 'norma43'
      case 'ofx':
        return 'ofx'
      case 'qfx':
        return 'qfx'
      default:
        return 'csv'
    }
  }
}

export const conciliacionService = new ConciliacionService()
