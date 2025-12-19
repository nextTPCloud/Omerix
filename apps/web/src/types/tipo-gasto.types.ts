// ============================================
// TIPOS PARA TIPOS DE GASTO
// ============================================

export type CategoriaTipoGasto = 'material' | 'transporte' | 'dietas' | 'alojamiento' | 'combustible' | 'peajes' | 'parking' | 'telefonia' | 'herramientas' | 'equipos' | 'subcontratacion' | 'otros'

export interface TipoGasto {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  categoria: CategoriaTipoGasto
  cuenta?: string
  ivaPorDefecto: number
  facturable: boolean
  margenPorDefecto: number
  orden: number
  activo: boolean
  categoriaLabel?: string
  creadoPor?: string
  modificadoPor?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTipoGastoDTO {
  codigo: string
  nombre: string
  descripcion?: string
  categoria?: CategoriaTipoGasto
  cuenta?: string
  ivaPorDefecto?: number
  facturable?: boolean
  margenPorDefecto?: number
  orden?: number
  activo?: boolean
}

export interface UpdateTipoGastoDTO {
  codigo?: string
  nombre?: string
  descripcion?: string
  categoria?: CategoriaTipoGasto
  cuenta?: string
  ivaPorDefecto?: number
  facturable?: boolean
  margenPorDefecto?: number
  orden?: number
  activo?: boolean
}

export interface TiposGastoResponse {
  success: boolean
  data: TipoGasto[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface TipoGastoResponse {
  success: boolean
  data: TipoGasto
  message?: string
}

export const CATEGORIAS_TIPO_GASTO: { value: CategoriaTipoGasto; label: string }[] = [
  { value: 'material', label: 'Material' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'dietas', label: 'Dietas' },
  { value: 'alojamiento', label: 'Alojamiento' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'peajes', label: 'Peajes' },
  { value: 'parking', label: 'Parking' },
  { value: 'telefonia', label: 'Telefonía' },
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'equipos', label: 'Equipos' },
  { value: 'subcontratacion', label: 'Subcontratación' },
  { value: 'otros', label: 'Otros' },
]
