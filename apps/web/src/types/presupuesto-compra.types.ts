// ============================================
// TIPOS DE PRESUPUESTO DE COMPRA
// ============================================

// ============================================
// ENUMS
// ============================================

export type EstadoPresupuestoCompra =
  | 'borrador'
  | 'enviado'
  | 'recibido'
  | 'aceptado'
  | 'rechazado'
  | 'convertido'
  | 'expirado'
  | 'cancelado'

export type TipoLineaCompra = 'producto' | 'servicio' | 'texto' | 'subtotal' | 'descuento'

export type Prioridad = 'alta' | 'media' | 'baja'

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_PRESUPUESTO_COMPRA: { value: EstadoPresupuestoCompra; label: string; color: string }[] = [
  { value: 'borrador', label: 'Borrador', color: 'bg-gray-500' },
  { value: 'enviado', label: 'Enviado', color: 'bg-blue-500' },
  { value: 'recibido', label: 'Recibido', color: 'bg-cyan-500' },
  { value: 'aceptado', label: 'Aceptado', color: 'bg-green-500' },
  { value: 'rechazado', label: 'Rechazado', color: 'bg-red-500' },
  { value: 'convertido', label: 'Convertido', color: 'bg-purple-500' },
  { value: 'expirado', label: 'Expirado', color: 'bg-orange-500' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-slate-500' },
]

export const PRIORIDADES: { value: Prioridad; label: string; color: string }[] = [
  { value: 'baja', label: 'Baja', color: 'bg-gray-500' },
  { value: 'media', label: 'Media', color: 'bg-yellow-500' },
  { value: 'alta', label: 'Alta', color: 'bg-red-500' },
]

export const TIPOS_LINEA_COMPRA: { value: TipoLineaCompra; label: string }[] = [
  { value: 'producto', label: 'Producto' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'texto', label: 'Texto' },
  { value: 'subtotal', label: 'Subtotal' },
  { value: 'descuento', label: 'Descuento' },
]

// ============================================
// INTERFACES - LINEAS
// ============================================

export interface LineaPresupuestoCompra {
  _id?: string
  orden: number
  tipo: TipoLineaCompra

  // Producto
  productoId?: string
  codigo?: string
  nombre: string
  descripcion?: string
  sku?: string
  codigoProveedor?: string

  // Cantidades
  cantidad: number
  unidad?: string

  // Precios
  precioUnitario: number
  descuento: number
  descuentoImporte: number
  subtotal: number
  iva: number
  ivaImporte: number
  total: number

  // Almacen
  almacenDestinoId?: string

  // Flags
  esEditable: boolean
  incluidoEnTotal: boolean

  // Notas
  notasInternas?: string
}

// ============================================
// INTERFACES - TOTALES
// ============================================

export interface DesgloseIva {
  tipo: number
  base: number
  cuota: number
}

export interface TotalesPresupuestoCompra {
  subtotalBruto: number
  totalDescuentos: number
  subtotalNeto: number
  desgloseIva: DesgloseIva[]
  totalIva: number
  totalPresupuesto: number
}

// ============================================
// INTERFACES - DOCUMENTOS E HISTORIAL
// ============================================

export interface DocumentoPresupuestoCompra {
  _id?: string
  nombre: string
  url: string
  tipo: string
  tamaño: number
  fechaSubida: string
  subidoPor: string
}

export interface HistorialPresupuestoCompra {
  _id?: string
  fecha: string
  usuarioId: string
  accion: string
  descripcion?: string
  datosAnteriores?: any
}

// ============================================
// INTERFACE PRINCIPAL - PRESUPUESTO DE COMPRA
// ============================================

export interface PresupuestoCompra {
  _id: string

  // Identificacion
  codigo: string
  serie: string
  numero: number

  // Estado
  estado: EstadoPresupuestoCompra

  // Prioridad
  prioridad: Prioridad

  // Fechas
  fecha: string
  fechaSolicitud?: string
  fechaRecepcion?: string
  fechaValidez?: string
  fechaAceptacion?: string
  fechaRechazo?: string

  // Proveedor
  proveedorId: string
  proveedorNombre: string
  proveedorNif: string
  proveedorEmail?: string
  proveedorTelefono?: string

  // Referencias
  referencia?: string
  referenciaProveedor?: string
  motivoRechazo?: string

  // Titulo y descripcion
  titulo?: string
  descripcion?: string

  // Lineas
  lineas: LineaPresupuestoCompra[]

  // Totales
  totales: TotalesPresupuestoCompra

  // Descuento global
  descuentoGlobalPorcentaje: number
  descuentoGlobalImporte: number

  // Textos
  observaciones?: string
  condicionesProveedor?: string

  // Documentos
  documentos: DocumentoPresupuestoCompra[]

  // Historial
  historial: HistorialPresupuestoCompra[]

  // Tags
  tags?: string[]

  // Documentos relacionados
  pedidoCompraId?: string

  // Control
  activo: boolean

  // Auditoria
  creadoPor: string
  modificadoPor?: string
  fechaCreacion: string
  fechaModificacion?: string

  // Virtuals
  diasParaExpirar?: number | null
  estaExpirado?: boolean
}

// ============================================
// DTOs
// ============================================

export interface CreatePresupuestoCompraDTO {
  serie?: string
  estado?: EstadoPresupuestoCompra
  prioridad?: Prioridad
  fecha?: string
  fechaSolicitud?: string
  fechaRecepcion?: string
  fechaValidez?: string
  proveedorId: string
  proveedorNombre?: string
  proveedorNif?: string
  proveedorEmail?: string
  proveedorTelefono?: string
  referencia?: string
  referenciaProveedor?: string
  titulo?: string
  descripcion?: string
  lineas?: Partial<LineaPresupuestoCompra>[]
  totales?: Partial<TotalesPresupuestoCompra>
  descuentoGlobalPorcentaje?: number
  descuentoGlobalImporte?: number
  observaciones?: string
  condicionesProveedor?: string
  tags?: string[]
  activo?: boolean
}

export interface UpdatePresupuestoCompraDTO extends Partial<CreatePresupuestoCompraDTO> {}

// ============================================
// FILTROS
// ============================================

export interface PresupuestosCompraFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  estado?: EstadoPresupuestoCompra
  estados?: string
  prioridad?: Prioridad
  proveedorId?: string
  activo?: boolean
  fechaDesde?: string
  fechaHasta?: string
  fechaValidezDesde?: string
  fechaValidezHasta?: string
  importeMinimo?: number
  importeMaximo?: number
  tags?: string
}

// ============================================
// RESPUESTAS API
// ============================================

export interface PresupuestosCompraResponse {
  success: boolean
  data: PresupuestoCompra[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PresupuestoCompraResponse {
  success: boolean
  data: PresupuestoCompra
  message?: string
}

export interface PresupuestoCompraEstadisticas {
  total: number
  porEstado: Record<string, number>
  totalImporte: number
  pendientesAceptar: number
  proximosExpirar: number
}
