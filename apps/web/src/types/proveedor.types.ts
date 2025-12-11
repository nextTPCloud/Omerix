// ============================================
// TIPOS DE PROVEEDOR
// ============================================

// ============================================
// ENUMS
// ============================================

export type TipoProveedor = 'empresa' | 'autonomo' | 'particular'

export type TipoDireccionProveedor = 'fiscal' | 'almacen' | 'recogida' | 'otro'

// ============================================
// CONSTANTES
// ============================================

export const TIPOS_PROVEEDOR: { value: TipoProveedor; label: string }[] = [
  { value: 'empresa', label: 'Empresa' },
  { value: 'autonomo', label: 'Autónomo' },
  { value: 'particular', label: 'Particular' },
]

export const TIPOS_DIRECCION_PROVEEDOR: { value: TipoDireccionProveedor; label: string }[] = [
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'recogida', label: 'Recogida' },
  { value: 'otro', label: 'Otro' },
]

// ============================================
// INTERFACES - DIRECCIONES
// ============================================

// Dirección base
export interface DireccionProveedor {
  calle: string
  numero?: string
  piso?: string
  codigoPostal: string
  ciudad: string
  provincia: string
  pais: string
  latitud?: number
  longitud?: number
}

// Dirección extendida con tipo
export interface DireccionExtendidaProveedor extends DireccionProveedor {
  _id?: string
  tipo: TipoDireccionProveedor
  nombre?: string
  personaContacto?: string
  telefonoContacto?: string
  horario?: string
  notas?: string
  predeterminada: boolean
  activa: boolean
}

// ============================================
// INTERFACES - CUENTAS BANCARIAS
// ============================================

export interface CuentaBancariaProveedor {
  _id?: string
  alias?: string
  titular: string
  iban: string
  swift?: string
  banco?: string
  sucursal?: string
  predeterminada: boolean
  activa: boolean
  fechaCreacion?: string
  notas?: string
}

// ============================================
// INTERFACES - CONTACTOS
// ============================================

export interface PersonaContactoProveedor {
  nombre: string
  cargo?: string
  telefono?: string
  email?: string
  departamento?: string
}

// ============================================
// INTERFACE PRINCIPAL - PROVEEDOR
// ============================================

export interface Proveedor {
  _id: string
  empresaId?: string
  tipoProveedor: TipoProveedor
  codigo: string
  nombre: string
  nombreComercial?: string
  nif: string
  email?: string
  telefono?: string
  movil?: string
  fax?: string
  web?: string

  // Direcciones múltiples
  direcciones: DireccionExtendidaProveedor[]

  // Dirección legacy (para compatibilidad)
  direccion?: DireccionProveedor

  // Condiciones comerciales
  formaPagoId?: string
  terminoPagoId?: string
  diasPago?: number
  descuentoGeneral?: number
  portesMinimosPedido?: number
  portesImporte?: number

  // Cuentas bancarias múltiples
  cuentasBancarias: CuentaBancariaProveedor[]

  // Legacy
  iban?: string
  swift?: string

  // Contactos
  personaContacto?: PersonaContactoProveedor
  personasContacto?: PersonaContactoProveedor[]

  // Clasificación
  categoriaId?: string
  zona?: string

  // Evaluación del proveedor
  calificacion?: number // 1-5 estrellas
  tiempoEntregaPromedio?: number // Días promedio de entrega
  fiabilidad?: number // Porcentaje de cumplimiento

  // Estado
  activo: boolean
  observaciones?: string

  // Certificaciones
  certificaciones?: string[]

  // Tags
  tags?: string[]

  // Estadísticas
  totalCompras?: number
  ultimaCompra?: string

  // Auditoría
  creadoPor: string
  modificadoPor?: string
  fechaCreacion: string
  fechaModificacion?: string
}

// ============================================
// DTOs
// ============================================

export interface CreateProveedorDTO {
  tipoProveedor?: TipoProveedor
  codigo?: string
  nombre: string
  nombreComercial?: string
  nif: string
  email?: string
  telefono?: string
  movil?: string
  fax?: string
  web?: string
  direcciones?: DireccionExtendidaProveedor[]
  direccion?: DireccionProveedor
  formaPagoId?: string
  terminoPagoId?: string
  diasPago?: number
  descuentoGeneral?: number
  portesMinimosPedido?: number
  portesImporte?: number
  cuentasBancarias?: CuentaBancariaProveedor[]
  iban?: string
  swift?: string
  personaContacto?: PersonaContactoProveedor
  personasContacto?: PersonaContactoProveedor[]
  categoriaId?: string
  zona?: string
  calificacion?: number
  tiempoEntregaPromedio?: number
  fiabilidad?: number
  activo?: boolean
  observaciones?: string
  certificaciones?: string[]
  tags?: string[]
}

export interface UpdateProveedorDTO extends Partial<CreateProveedorDTO> {}

// ============================================
// FILTROS
// ============================================

export interface ProveedoresFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  activo?: boolean
  tipoProveedor?: TipoProveedor
  formaPagoId?: string
  terminoPagoId?: string
  categoriaId?: string
  zona?: string
  calificacionMinima?: number
}

// ============================================
// RESPUESTAS API
// ============================================

export interface ProveedoresResponse {
  success: boolean
  data: Proveedor[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface ProveedorResponse {
  success: boolean
  data: Proveedor
  message?: string
}

export interface ProveedorEstadisticas {
  total: number
  activos: number
  inactivos: number
  totalCompras: number
  promedioCalificacion: number
}

// Para selector/autocompletado
export interface ProveedorSelector {
  _id: string
  codigo: string
  nombre: string
  nif: string
}
