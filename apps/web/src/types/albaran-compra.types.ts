// ============================================
// TIPOS DE ALBARAN DE COMPRA
// ============================================

// ============================================
// ENUMS
// ============================================

export type EstadoAlbaranCompra =
  | 'borrador'
  | 'pendiente_recepcion'
  | 'recibido_parcial'
  | 'recibido'
  | 'facturado'
  | 'anulado'

export type TipoLineaCompra = 'producto' | 'servicio' | 'kit' | 'texto' | 'subtotal' | 'descuento'

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_ALBARAN_COMPRA: { value: EstadoAlbaranCompra; label: string; color: string }[] = [
  { value: 'borrador', label: 'Borrador', color: 'bg-gray-500' },
  { value: 'pendiente_recepcion', label: 'Pendiente Recepcion', color: 'bg-blue-500' },
  { value: 'recibido_parcial', label: 'Recibido Parcial', color: 'bg-yellow-500' },
  { value: 'recibido', label: 'Recibido', color: 'bg-green-500' },
  { value: 'facturado', label: 'Facturado', color: 'bg-purple-500' },
  { value: 'anulado', label: 'Anulado', color: 'bg-red-500' },
]

export const TIPOS_LINEA_COMPRA: { value: TipoLineaCompra; label: string }[] = [
  { value: 'producto', label: 'Producto' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'kit', label: 'Kit' },
  { value: 'texto', label: 'Texto' },
  { value: 'subtotal', label: 'Subtotal' },
  { value: 'descuento', label: 'Descuento' },
]

// ============================================
// INTERFACES - LINEAS
// ============================================

export interface LineaAlbaranCompra {
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
  cantidadRecibida: number
  cantidadPendiente: number
  unidad?: string

  // Precios
  precioUnitario: number
  descuento: number
  descuentoImporte: number
  subtotal: number
  iva: number
  ivaImporte: number
  total: number

  // Stock
  almacenId?: string
  lote?: string
  numeroSerie?: string
  fechaCaducidad?: string

  // Pedido origen
  pedidoCompraId?: string
  lineaPedidoId?: string

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

export interface TotalesAlbaranCompra {
  subtotalBruto: number
  totalDescuentos: number
  subtotalNeto: number
  desgloseIva: DesgloseIva[]
  totalIva: number
  totalAlbaran: number
}

// ============================================
// INTERFACES - DOCUMENTOS E HISTORIAL
// ============================================

export interface DocumentoAlbaranCompra {
  _id?: string
  nombre: string
  url: string
  tipo: string
  tamano: number
  fechaSubida: string
  subidoPor: string
}

export interface HistorialAlbaranCompra {
  _id?: string
  fecha: string
  usuarioId: string
  accion: string
  descripcion?: string
  datosAnteriores?: any
}

// ============================================
// INTERFACE PRINCIPAL - ALBARAN DE COMPRA
// ============================================

export interface AlbaranCompra {
  _id: string

  // Identificacion
  codigo: string
  serie: string
  numero: number

  // Estado
  estado: EstadoAlbaranCompra

  // Fechas
  fecha: string
  fechaRecepcion?: string

  // Proveedor
  proveedorId: string
  proveedorNombre: string
  proveedorNif: string
  proveedorEmail?: string
  proveedorTelefono?: string

  // Referencias
  pedidoCompraId?: string
  albaranProveedor?: string

  // Titulo y descripcion
  titulo?: string
  descripcion?: string

  // Lineas
  lineas: LineaAlbaranCompra[]

  // Totales
  totales: TotalesAlbaranCompra

  // Descuento global
  descuentoGlobalPorcentaje: number
  descuentoGlobalImporte: number

  // Textos
  observaciones?: string
  observacionesAlmacen?: string

  // Facturacion
  facturado: boolean
  facturaCompraId?: string

  // Documentos
  documentos: DocumentoAlbaranCompra[]

  // Historial
  historial: HistorialAlbaranCompra[]

  // Tags
  tags?: string[]

  // Control
  activo: boolean

  // Auditoria
  creadoPor: string
  modificadoPor?: string
  fechaCreacion: string
  fechaModificacion?: string

  // Virtuals
  porcentajeRecibido?: number
  estaCompleto?: boolean
}

// ============================================
// DTOs
// ============================================

export interface CreateAlbaranCompraDTO {
  serie?: string
  estado?: EstadoAlbaranCompra
  fecha?: string
  fechaRecepcion?: string
  proveedorId: string
  proveedorNombre?: string
  proveedorNif?: string
  proveedorEmail?: string
  proveedorTelefono?: string
  pedidoCompraId?: string
  albaranProveedor?: string
  titulo?: string
  descripcion?: string
  lineas?: Partial<LineaAlbaranCompra>[]
  totales?: Partial<TotalesAlbaranCompra>
  descuentoGlobalPorcentaje?: number
  descuentoGlobalImporte?: number
  observaciones?: string
  observacionesAlmacen?: string
  tags?: string[]
  activo?: boolean
}

export interface UpdateAlbaranCompraDTO extends Partial<CreateAlbaranCompraDTO> {}

// ============================================
// FILTROS
// ============================================

export interface AlbaranesCompraFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  estado?: EstadoAlbaranCompra
  proveedorId?: string
  activo?: boolean
  facturado?: boolean
  fechaDesde?: string
  fechaHasta?: string
  fechaRecepcionDesde?: string
  fechaRecepcionHasta?: string
  importeMinimo?: number
  importeMaximo?: number
}

// ============================================
// RESPUESTAS API
// ============================================

export interface AlbaranesCompraResponse {
  success: boolean
  data: AlbaranCompra[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AlbaranCompraResponse {
  success: boolean
  data: AlbaranCompra
  message?: string
}

export interface AlbaranCompraEstadisticas {
  total: number
  porEstado: Record<string, number>
  totalImporte: number
  pendientesRecibir: number
  pendientesFacturar: number
}
