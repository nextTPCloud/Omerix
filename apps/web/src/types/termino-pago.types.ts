// ============================================
// TIPOS PARA TÉRMINOS DE PAGO
// ============================================

export interface Vencimiento {
  dias: number
  porcentaje: number
}

export interface TerminoPago {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  vencimientos: Vencimiento[]
  activo: boolean
  resumenVencimientos?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTerminoPagoDTO {
  codigo: string
  nombre: string
  descripcion?: string
  vencimientos: Vencimiento[]
  activo?: boolean
}

export interface UpdateTerminoPagoDTO {
  codigo?: string
  nombre?: string
  descripcion?: string
  vencimientos?: Vencimiento[]
  activo?: boolean
}

export interface TerminosPagoResponse {
  success: boolean
  data: TerminoPago[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface TerminoPagoResponse {
  success: boolean
  data: TerminoPago
  message?: string
}
