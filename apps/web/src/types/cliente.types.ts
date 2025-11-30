// ============================================
// TIPOS DE CLIENTE
// ============================================

// ============================================
// ENUMS
// ============================================

export type TipoCliente = 'empresa' | 'particular'

export type TipoDireccion = 'fiscal' | 'envio' | 'almacen' | 'obra' | 'otro'

export type TipoMandatoSEPA = 'recurrente' | 'unico' | 'primera_vez' | 'final'

// Legacy - mantener para compatibilidad
export type FormaPagoLegacy = 'contado' | 'transferencia' | 'domiciliacion' | 'confirming' | 'pagare'

// ============================================
// CONSTANTES
// ============================================

export const TIPOS_DIRECCION: { value: TipoDireccion; label: string }[] = [
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'envio', label: 'Envío' },
  { value: 'almacen', label: 'Almacén' },
  { value: 'obra', label: 'Obra' },
  { value: 'otro', label: 'Otro' },
]

export const TIPOS_MANDATO_SEPA: { value: TipoMandatoSEPA; label: string }[] = [
  { value: 'recurrente', label: 'Recurrente (RCUR)' },
  { value: 'unico', label: 'Único (OOFF)' },
  { value: 'primera_vez', label: 'Primera vez (FRST)' },
  { value: 'final', label: 'Final (FNAL)' },
]

// ============================================
// INTERFACES - DIRECCIONES
// ============================================

// Dirección base (para compatibilidad legacy)
export interface Direccion {
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

// Dirección extendida con tipo (NUEVO)
export interface DireccionExtendida extends Direccion {
  _id?: string
  tipo: TipoDireccion
  nombre?: string           // Nombre descriptivo (ej: "Oficina Central")
  personaContacto?: string  // Persona de contacto en esta dirección
  telefonoContacto?: string // Teléfono de contacto
  horario?: string          // Horario de atención/recogida
  notas?: string            // Notas adicionales
  predeterminada: boolean   // Si es la dirección por defecto de su tipo
  activa: boolean           // Si está activa
}

// ============================================
// INTERFACES - CUENTAS BANCARIAS
// ============================================

// Mandato SEPA
export interface MandatoSEPA {
  referencia: string         // Referencia única del mandato (ej: MAND-2024-00001)
  fechaFirma: string         // Fecha de firma del mandato
  tipoMandato: TipoMandatoSEPA
  firmado: boolean           // Si el mandato está firmado
  fechaRevocacion?: string   // Fecha si el mandato fue revocado
  acreedor?: {               // Datos del acreedor (empresa)
    identificador?: string   // Identificador del acreedor SEPA
    nombre?: string
  }
}

// Cuenta bancaria con datos SEPA
export interface CuentaBancaria {
  _id?: string
  alias?: string             // Nombre descriptivo (ej: "Cuenta Principal")
  titular: string            // Nombre del titular de la cuenta
  iban: string               // IBAN completo
  swift?: string             // Código SWIFT/BIC
  banco?: string             // Nombre del banco
  sucursal?: string          // Sucursal
  mandatoSEPA?: MandatoSEPA  // Datos del mandato SEPA
  predeterminada: boolean    // Si es la cuenta por defecto
  usarParaCobros: boolean    // Usar para cobros (domiciliaciones)
  usarParaPagos: boolean     // Usar para pagos (transferencias al cliente)
  activa: boolean
  fechaCreacion?: string
  notas?: string
}

// ============================================
// INTERFACES - CONTACTOS
// ============================================

export interface PersonaContacto {
  nombre: string
  cargo?: string
  telefono?: string
  email?: string
}

// ============================================
// INTERFACE PRINCIPAL - CLIENTE
// ============================================

export interface Cliente {
  _id: string
  empresaId?: string  // Opcional en multi-DB
  tipoCliente: TipoCliente
  codigo: string
  nombre: string
  nombreComercial?: string
  nif: string
  email?: string
  telefono?: string
  movil?: string
  web?: string

  // ============================================
  // DIRECCIONES MÚLTIPLES (NUEVO)
  // ============================================
  direcciones: DireccionExtendida[]

  // Direcciones legacy (para compatibilidad) - DEPRECATED
  /** @deprecated Usar direcciones[] con tipo 'fiscal' */
  direccion?: Direccion
  /** @deprecated Usar direcciones[] con tipo 'envio' */
  direccionEnvio?: Direccion

  // ============================================
  // CONDICIONES COMERCIALES (MEJORADO)
  // ============================================
  formaPagoId?: string    // Ref a FormaPago
  terminoPagoId?: string  // Ref a TerminoPago

  // Legacy - mantener para compatibilidad
  /** @deprecated Usar formaPagoId */
  formaPago?: FormaPagoLegacy
  /** @deprecated Usar terminoPagoId */
  diasPago?: number

  descuentoGeneral?: number
  tarifaId?: string

  // ============================================
  // CUENTAS BANCARIAS MÚLTIPLES (NUEVO)
  // ============================================
  cuentasBancarias: CuentaBancaria[]

  // Campos legacy (para compatibilidad) - DEPRECATED
  /** @deprecated Usar cuentasBancarias[] */
  iban?: string
  /** @deprecated Usar cuentasBancarias[] */
  swift?: string

  // ============================================
  // CONTACTOS
  // ============================================
  personaContacto?: PersonaContacto
  personasContacto?: PersonaContacto[]

  // Clasificación
  categoriaId?: string
  zona?: string
  vendedorId?: string

  // Agentes comerciales asignados (puede tener varios)
  agentesComerciales?: string[]

  // Límites y riesgo
  limiteCredito?: number
  riesgoActual: number  // REQUERIDO

  // Estado
  activo: boolean
  usarEnTPV?: boolean
  observaciones?: string
  tags?: string[]

  // Auditoría
  creadoPor?: string
  modificadoPor?: string
  createdAt: string
  updatedAt: string

  // Virtuals (calculados)
  nombreCompleto?: string
  excedeCredito?: boolean
  creditoDisponible?: number | null
  direccionFiscal?: DireccionExtendida | Direccion | null
  direccionEnvioPredeterminada?: DireccionExtendida | Direccion | null
  cuentaBancariaPredeterminada?: CuentaBancaria | null
  numDireccionesActivas?: number
  numCuentasActivas?: number
  tieneMandatoSEPA?: boolean
}

// ============================================
// DTOs PARA CREAR/ACTUALIZAR
// ============================================

export interface CreateClienteDTO {
  tipoCliente?: TipoCliente
  codigo?: string
  nombre: string
  nombreComercial?: string
  nif: string
  email?: string
  telefono?: string
  movil?: string
  web?: string

  // Direcciones múltiples (NUEVO)
  direcciones?: Omit<DireccionExtendida, '_id'>[]

  // Direcciones legacy (para compatibilidad)
  direccion?: Direccion
  direccionEnvio?: Direccion

  // Condiciones comerciales
  formaPagoId?: string
  terminoPagoId?: string
  formaPago?: FormaPagoLegacy
  diasPago?: number
  descuentoGeneral?: number
  tarifaId?: string

  // Cuentas bancarias múltiples (NUEVO)
  cuentasBancarias?: Omit<CuentaBancaria, '_id'>[]

  // Campos legacy
  iban?: string
  swift?: string

  // Contactos
  personaContacto?: PersonaContacto
  personasContacto?: PersonaContacto[]

  // Otros
  categoriaId?: string
  zona?: string
  vendedorId?: string

  // Agentes comerciales (puede tener varios)
  agentesComerciales?: string[]

  limiteCredito?: number
  activo?: boolean
  usarEnTPV?: boolean
  observaciones?: string
  tags?: string[]
}

export interface UpdateClienteDTO extends Partial<CreateClienteDTO> {
  // Las direcciones y cuentas se reemplazan completamente al actualizar
  direcciones?: DireccionExtendida[]
  cuentasBancarias?: CuentaBancaria[]
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

export interface ClientesFilters {
  search?: string
  tipoCliente?: TipoCliente
  activo?: boolean
  formaPago?: FormaPagoLegacy
  formaPagoId?: string
  terminoPagoId?: string
  categoriaId?: string
  vendedorId?: string
  agenteComercialId?: string  // Filtrar por agente comercial
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

// ============================================
// TIPOS PARA COMPONENTES DE UI
// ============================================

// Para el componente de direcciones
export interface DireccionFormData {
  tipo: TipoDireccion
  nombre?: string
  calle: string
  numero?: string
  piso?: string
  codigoPostal: string
  ciudad: string
  provincia: string
  pais: string
  latitud?: number
  longitud?: number
  personaContacto?: string
  telefonoContacto?: string
  horario?: string
  notas?: string
  predeterminada: boolean
  activa: boolean
}

// Para el componente de cuentas bancarias
export interface CuentaBancariaFormData {
  alias?: string
  titular: string
  iban: string
  swift?: string
  banco?: string
  sucursal?: string
  mandatoSEPA?: {
    referencia: string
    fechaFirma: string
    tipoMandato: TipoMandatoSEPA
    firmado: boolean
  }
  predeterminada: boolean
  usarParaCobros: boolean
  usarParaPagos: boolean
  activa: boolean
  notas?: string
}
