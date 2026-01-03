import { api } from './api'

// ============================================
// TIPOS
// ============================================

// Tipos de movimiento
export type TipoMovimiento = 'entrada' | 'salida'

// Origen del movimiento
export type OrigenMovimiento =
  | 'tpv'
  | 'factura_venta'
  | 'factura_compra'
  | 'vencimiento'
  | 'pagare'
  | 'recibo'
  | 'transferencia'
  | 'manual'
  | 'apertura_caja'
  | 'cierre_caja'
  | 'devolucion'

// Método de pago/cobro
export type MetodoMovimiento =
  | 'efectivo'
  | 'tarjeta'
  | 'transferencia'
  | 'bizum'
  | 'domiciliacion'
  | 'cheque'
  | 'pagare'
  | 'otro'

// Estado del movimiento
export type EstadoMovimiento = 'pendiente' | 'confirmado' | 'conciliado' | 'anulado'

export interface MovimientoBancario {
  _id: string
  numero: string
  tipo: TipoMovimiento
  origen: OrigenMovimiento
  metodo: MetodoMovimiento
  estado: EstadoMovimiento
  importe: number
  fecha: string
  fechaValor?: string
  fechaConciliacion?: string
  cuentaBancariaId?: string
  cuentaBancariaNombre?: string
  terceroTipo?: 'cliente' | 'proveedor'
  terceroId?: string
  terceroNombre?: string
  terceroNif?: string
  documentoOrigenTipo?: string
  documentoOrigenId?: string
  documentoOrigenNumero?: string
  tpvId?: string
  tpvNombre?: string
  ticketId?: string
  ticketNumero?: string
  concepto: string
  observaciones?: string
  referenciaBancaria?: string
  conciliado: boolean
  movimientoExtractoId?: string
  creadoPor: string
  fechaCreacion: string
  modificadoPor?: string
  fechaModificacion?: string
  anuladoPor?: string
  fechaAnulacion?: string
  motivoAnulacion?: string
  activo: boolean
}

export interface MovimientoFilters {
  tipo?: TipoMovimiento
  origen?: OrigenMovimiento | OrigenMovimiento[]
  metodo?: MetodoMovimiento
  estado?: EstadoMovimiento
  cuentaBancariaId?: string
  terceroId?: string
  tpvId?: string
  fechaDesde?: string
  fechaHasta?: string
  importeMin?: number
  importeMax?: number
  conciliado?: boolean
  busqueda?: string
  pagina?: number
  limite?: number
  ordenarPor?: string
  orden?: 'asc' | 'desc'
}

export interface CreateMovimientoDTO {
  tipo: TipoMovimiento
  origen: OrigenMovimiento
  metodo: MetodoMovimiento
  importe: number
  fecha?: string
  concepto: string
  fechaValor?: string
  cuentaBancariaId?: string
  cuentaBancariaNombre?: string
  terceroTipo?: 'cliente' | 'proveedor'
  terceroId?: string
  terceroNombre?: string
  terceroNif?: string
  documentoOrigenTipo?: string
  documentoOrigenId?: string
  documentoOrigenNumero?: string
  observaciones?: string
  referenciaBancaria?: string
}

export interface EstadisticasMovimientos {
  totalEntradas: number
  totalSalidas: number
  saldoNeto: number
  porMetodo: Array<{
    metodo: string
    entradas: number
    salidas: number
  }>
  porOrigen: Array<{
    origen: string
    cantidad: number
    importe: number
  }>
  movimientosPorDia: Array<{
    fecha: string
    entradas: number
    salidas: number
  }>
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
    limit: number
    pages: number
  }
}

// ============================================
// SERVICIO
// ============================================

class MovimientosBancariosService {
  private baseUrl = '/movimientos-bancarios'

  /**
   * Listar movimientos con filtros y paginación
   */
  async getAll(filters: MovimientoFilters = {}): Promise<PaginatedResponse<MovimientoBancario>> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','))
        } else {
          params.append(key, String(value))
        }
      }
    })

    const response = await api.get<PaginatedResponse<MovimientoBancario>>(
      `${this.baseUrl}?${params.toString()}`
    )
    return response.data
  }

  /**
   * Obtener solo entradas (cobros)
   */
  async getEntradas(filters: Omit<MovimientoFilters, 'tipo'> = {}): Promise<PaginatedResponse<MovimientoBancario>> {
    return this.getAll({ ...filters, tipo: 'entrada' })
  }

  /**
   * Obtener solo salidas (pagos)
   */
  async getSalidas(filters: Omit<MovimientoFilters, 'tipo'> = {}): Promise<PaginatedResponse<MovimientoBancario>> {
    return this.getAll({ ...filters, tipo: 'salida' })
  }

  /**
   * Obtener movimientos de TPV
   */
  async getFromTPV(filters: Omit<MovimientoFilters, 'origen'> = {}): Promise<PaginatedResponse<MovimientoBancario>> {
    return this.getAll({ ...filters, origen: 'tpv' })
  }

  /**
   * Obtener un movimiento por ID
   */
  async getById(id: string): Promise<ApiResponse<MovimientoBancario>> {
    const response = await api.get<ApiResponse<MovimientoBancario>>(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Crear un nuevo movimiento manual
   */
  async create(data: CreateMovimientoDTO): Promise<ApiResponse<MovimientoBancario>> {
    const response = await api.post<ApiResponse<MovimientoBancario>>(this.baseUrl, data)
    return response.data
  }

  /**
   * Anular un movimiento
   */
  async anular(id: string, motivo: string): Promise<ApiResponse<MovimientoBancario>> {
    const response = await api.post<ApiResponse<MovimientoBancario>>(
      `${this.baseUrl}/${id}/anular`,
      { motivo }
    )
    return response.data
  }

  /**
   * Marcar como conciliado
   */
  async conciliar(id: string, movimientoExtractoId?: string): Promise<ApiResponse<MovimientoBancario>> {
    const response = await api.post<ApiResponse<MovimientoBancario>>(
      `${this.baseUrl}/${id}/conciliar`,
      { movimientoExtractoId }
    )
    return response.data
  }

  /**
   * Obtener estadísticas
   */
  async getEstadisticas(fechaDesde?: string, fechaHasta?: string): Promise<ApiResponse<EstadisticasMovimientos>> {
    const params = new URLSearchParams()
    if (fechaDesde) params.append('fechaDesde', fechaDesde)
    if (fechaHasta) params.append('fechaHasta', fechaHasta)

    const response = await api.get<ApiResponse<EstadisticasMovimientos>>(
      `${this.baseUrl}/estadisticas?${params.toString()}`
    )
    return response.data
  }

  /**
   * Obtener movimientos de un TPV específico
   */
  async getByTPV(
    tpvId: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<ApiResponse<MovimientoBancario[]>> {
    const params = new URLSearchParams()
    if (fechaDesde) params.append('fechaDesde', fechaDesde)
    if (fechaHasta) params.append('fechaHasta', fechaHasta)

    const response = await api.get<ApiResponse<MovimientoBancario[]>>(
      `${this.baseUrl}/tpv/${tpvId}?${params.toString()}`
    )
    return response.data
  }

  /**
   * Obtener etiqueta legible del origen
   */
  getOrigenLabel(origen: OrigenMovimiento): string {
    const labels: Record<OrigenMovimiento, string> = {
      tpv: 'TPV',
      factura_venta: 'Factura Venta',
      factura_compra: 'Factura Compra',
      vencimiento: 'Vencimiento',
      pagare: 'Pagaré',
      recibo: 'Recibo',
      transferencia: 'Transferencia',
      manual: 'Manual',
      apertura_caja: 'Apertura Caja',
      cierre_caja: 'Cierre Caja',
      devolucion: 'Devolución',
    }
    return labels[origen] || origen
  }

  /**
   * Obtener etiqueta legible del método
   */
  getMetodoLabel(metodo: MetodoMovimiento): string {
    const labels: Record<MetodoMovimiento, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      bizum: 'Bizum',
      domiciliacion: 'Domiciliación',
      cheque: 'Cheque',
      pagare: 'Pagaré',
      otro: 'Otro',
    }
    return labels[metodo] || metodo
  }

  /**
   * Obtener color del estado
   */
  getEstadoColor(estado: EstadoMovimiento): string {
    const colors: Record<EstadoMovimiento, string> = {
      pendiente: 'warning',
      confirmado: 'success',
      conciliado: 'info',
      anulado: 'destructive',
    }
    return colors[estado] || 'secondary'
  }
}

export const movimientosBancariosService = new MovimientosBancariosService()
