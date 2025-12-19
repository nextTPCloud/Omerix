// ============================================
// TIPOS PARA MAQUINARIA
// ============================================

export type TipoMaquinaria = 'vehiculo' | 'maquinaria' | 'herramienta' | 'equipo'
export type EstadoMaquinaria = 'disponible' | 'en_uso' | 'mantenimiento' | 'baja'

export interface Mantenimiento {
  _id?: string
  fecha: string
  tipo: 'preventivo' | 'correctivo' | 'revision'
  descripcion: string
  coste?: number
  kmEnMantenimiento?: number
  horasEnMantenimiento?: number
  proximoMantenimientoKm?: number
  proximoMantenimientoHoras?: number
  proximoMantenimientoFecha?: string
  realizadoPor?: string
  observaciones?: string
}

export interface Maquinaria {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  tipo: TipoMaquinaria

  // Datos vehiculo
  matricula?: string
  marca?: string
  modelo?: string
  anio?: number
  numeroSerie?: string

  // Estado
  estado: EstadoMaquinaria
  ubicacionActual?: string

  // Tarifas
  tarifaHoraCoste: number
  tarifaHoraVenta: number
  tarifaDiaCoste?: number
  tarifaDiaVenta?: number
  tarifaKmCoste?: number
  tarifaKmVenta?: number

  // Contadores
  kmActuales?: number
  horasUso?: number

  // Mantenimiento
  proximoMantenimientoFecha?: string
  proximoMantenimientoKm?: number
  proximoMantenimientoHoras?: number
  historialMantenimientos?: Mantenimiento[]

  // Documentacion
  fechaITV?: string
  fechaSeguro?: string
  polizaSeguro?: string

  // Imagen
  imagen?: string

  // Metadatos
  orden: number
  activo: boolean
  observaciones?: string

  // Virtuals
  tipoLabel?: string
  estadoLabel?: string
  necesitaMantenimiento?: boolean
  documentacionVencida?: boolean

  // Auditoria
  creadoPor?: string
  modificadoPor?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaquinariaDTO {
  codigo: string
  nombre: string
  descripcion?: string
  tipo?: TipoMaquinaria
  matricula?: string
  marca?: string
  modelo?: string
  anio?: number
  numeroSerie?: string
  estado?: EstadoMaquinaria
  ubicacionActual?: string
  tarifaHoraCoste?: number
  tarifaHoraVenta?: number
  tarifaDiaCoste?: number
  tarifaDiaVenta?: number
  tarifaKmCoste?: number
  tarifaKmVenta?: number
  kmActuales?: number
  horasUso?: number
  proximoMantenimientoFecha?: string
  proximoMantenimientoKm?: number
  proximoMantenimientoHoras?: number
  fechaITV?: string
  fechaSeguro?: string
  polizaSeguro?: string
  imagen?: string
  orden?: number
  activo?: boolean
  observaciones?: string
}

export interface UpdateMaquinariaDTO extends Partial<CreateMaquinariaDTO> {}

export interface RegistrarMantenimientoDTO {
  fecha: string
  tipo: 'preventivo' | 'correctivo' | 'revision'
  descripcion: string
  coste?: number
  kmEnMantenimiento?: number
  horasEnMantenimiento?: number
  proximoMantenimientoKm?: number
  proximoMantenimientoHoras?: number
  proximoMantenimientoFecha?: string
  realizadoPor?: string
  observaciones?: string
}

export interface MaquinariaResponse {
  success: boolean
  data: Maquinaria[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface MaquinariaDetailResponse {
  success: boolean
  data: Maquinaria
  message?: string
}

export interface MaquinariaEstadisticas {
  total: number
  activas: number
  disponibles: number
  enUso: number
  enMantenimiento: number
  porTipo: Record<string, number>
}

export interface MaquinariaAlertas {
  mantenimientoVencido: Maquinaria[]
  mantenimientoProximo: Maquinaria[]
  itvVencida: Maquinaria[]
  itvProxima: Maquinaria[]
  seguroVencido: Maquinaria[]
  seguroProximo: Maquinaria[]
  resumen: {
    mantenimientoVencido: number
    mantenimientoProximo: number
    itvVencida: number
    itvProxima: number
    seguroVencido: number
    seguroProximo: number
  }
}

export const TIPOS_MAQUINARIA: { value: TipoMaquinaria; label: string }[] = [
  { value: 'vehiculo', label: 'Vehículo' },
  { value: 'maquinaria', label: 'Maquinaria' },
  { value: 'herramienta', label: 'Herramienta' },
  { value: 'equipo', label: 'Equipo' },
]

export const ESTADOS_MAQUINARIA: { value: EstadoMaquinaria; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'en_uso', label: 'En uso' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'baja', label: 'Baja' },
]

export const TIPOS_MANTENIMIENTO: { value: 'preventivo' | 'correctivo' | 'revision'; label: string }[] = [
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'revision', label: 'Revisión' },
]
