// ============================================
// TIPOS DE CLIENTE
// ============================================

export interface Direccion {
  calle: string
  numero?: string
  piso?: string
  codigoPostal: string
  ciudad: string
  provincia: string
  pais: string
}

export interface PersonaContacto {
  nombre: string
  cargo?: string
  telefono?: string
  email?: string
}

export interface Cliente {
  _id: string
  empresaId: string
  tipoCliente: 'empresa' | 'particular'
  codigo: string
  nombre: string
  nombreComercial?: string
  nif: string
  email?: string
  telefono?: string
  movil?: string
  web?: string
  direccion: Direccion
  direccionEnvio?: Direccion
  formaPago: 'contado' | 'transferencia' | 'domiciliacion' | 'confirming' | 'pagare'
  diasPago: number
  descuentoGeneral?: number
  tarifaId?: string
  iban?: string
  swift?: string
  personaContacto?: PersonaContacto
  categoriaId?: string
  zona?: string
  vendedorId?: string
  limiteCredito?: number
  riesgoActual?: number
  activo: boolean
  observaciones?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// ============================================
// DTOs PARA CREAR/ACTUALIZAR
// ============================================

export interface CreateClienteDTO {
  tipoCliente?: 'empresa' | 'particular'
  codigo?: string
  nombre: string
  nombreComercial?: string
  nif: string
  email?: string
  telefono?: string
  movil?: string
  web?: string
  direccion: Direccion
  direccionEnvio?: Direccion
  formaPago?: 'contado' | 'transferencia' | 'domiciliacion' | 'confirming' | 'pagare'
  diasPago?: number
  descuentoGeneral?: number
  tarifaId?: string
  iban?: string
  swift?: string
  personaContacto?: PersonaContacto
  categoriaId?: string
  zona?: string
  vendedorId?: string
  limiteCredito?: number
  activo?: boolean
  observaciones?: string
  tags?: string[]
}

export interface UpdateClienteDTO extends Partial<CreateClienteDTO> {}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

export interface ClientesFilters {
  search?: string
  tipoCliente?: 'empresa' | 'particular'
  activo?: boolean
  formaPago?: string
  categoriaId?: string
  vendedorId?: string
  zona?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ============================================
// RESPUESTAS DE LA API
// ============================================

export interface ClientesListResponse {
  success: boolean
  data: Cliente[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ClienteDetailResponse {
  success: boolean
  data: Cliente
}

export interface EstadisticasClientes {
  total: number
  activos: number
  inactivos: number
  empresas: number
  particulares: number
  conRiesgo: number
}