// ============================================
// TIPOS DE FACTURA DE COMPRA
// ============================================

// ============================================
// ENUMS
// ============================================

export type EstadoFacturaCompra =
  | 'borrador'
  | 'pendiente_pago'
  | 'parcialmente_pagada'
  | 'pagada'
  | 'vencida'
  | 'anulada'

export type TipoLineaCompra = 'producto' | 'servicio' | 'kit' | 'texto' | 'subtotal' | 'descuento'

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_FACTURA_COMPRA: { value: EstadoFacturaCompra; label: string; color: string }[] = [
  { value: 'borrador', label: 'Borrador', color: 'bg-gray-500' },
  { value: 'pendiente_pago', label: 'Pendiente Pago', color: 'bg-blue-500' },
  { value: 'parcialmente_pagada', label: 'Parc. Pagada', color: 'bg-yellow-500' },
  { value: 'pagada', label: 'Pagada', color: 'bg-green-500' },
  { value: 'vencida', label: 'Vencida', color: 'bg-red-500' },
  { value: 'anulada', label: 'Anulada', color: 'bg-gray-700' },
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

export interface LineaFacturaCompra {
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

  // Origen
  albaranCompraId?: string
  lineaAlbaranId?: string

  // Flags
  esEditable: boolean
  incluidoEnTotal: boolean

  // Notas
  notasInternas?: string
}

// ============================================
// INTERFACES - VENCIMIENTOS
// ============================================

export interface VencimientoFacturaCompra {
  _id?: string
  numero: number
  fechaVencimiento: string
  importe: number
  importePagado: number
  importePendiente: number
  pagado: boolean
  fechaPago?: string
  formaPagoId?: string
  referenciaPago?: string
  observaciones?: string
}

// ============================================
// INTERFACES - TOTALES
// ============================================

export interface DesgloseIva {
  tipo: number
  base: number
  cuota: number
}

export interface TotalesFacturaCompra {
  subtotalBruto: number
  totalDescuentos: number
  subtotalNeto: number
  desgloseIva: DesgloseIva[]
  totalIva: number
  totalFactura: number
  totalPagado: number
  totalPendiente: number
}

// ============================================
// INTERFACES - PAGOS
// ============================================

export interface PagoFacturaCompra {
  _id?: string
  fecha: string
  importe: number
  formaPagoId?: string
  referenciaPago?: string
  vencimientoId?: string
  observaciones?: string
  registradoPor: string
}

// ============================================
// INTERFACES - DOCUMENTOS E HISTORIAL
// ============================================

export interface DocumentoFacturaCompra {
  _id?: string
  nombre: string
  url: string
  tipo: string
  tamano: number
  fechaSubida: string
  subidoPor: string
}

export interface HistorialFacturaCompra {
  _id?: string
  fecha: string
  usuarioId: string
  accion: string
  descripcion?: string
  datosAnteriores?: any
}

// ============================================
// INTERFACE PRINCIPAL - FACTURA DE COMPRA
// ============================================

export interface FacturaCompra {
  _id: string

  // Identificacion
  codigo: string
  serie: string
  numero: number

  // Numero del proveedor
  numeroFacturaProveedor: string
  fechaFacturaProveedor: string

  // Estado
  estado: EstadoFacturaCompra

  // Fechas
  fecha: string
  fechaContabilizacion?: string

  // Proveedor
  proveedorId: string
  proveedorNombre: string
  proveedorNif: string
  proveedorEmail?: string
  proveedorTelefono?: string

  // Referencias
  albaranesCompraIds?: string[]

  // Titulo y descripcion
  titulo?: string
  descripcion?: string

  // Lineas
  lineas: LineaFacturaCompra[]

  // Vencimientos
  vencimientos: VencimientoFacturaCompra[]

  // Pagos
  pagos: PagoFacturaCompra[]

  // Totales
  totales: TotalesFacturaCompra

  // Descuento global
  descuentoGlobalPorcentaje: number
  descuentoGlobalImporte: number

  // Textos
  observaciones?: string

  // Contabilidad
  contabilizada: boolean
  asientoContableId?: string

  // Documentos
  documentos: DocumentoFacturaCompra[]

  // Historial
  historial: HistorialFacturaCompra[]

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
  porcentajePagado?: number
  estaPagada?: boolean
  estaVencida?: boolean
  diasVencida?: number
}

// ============================================
// DTOs
// ============================================

export interface CreateFacturaCompraDTO {
  serie?: string
  estado?: EstadoFacturaCompra
  fecha?: string
  numeroFacturaProveedor: string
  fechaFacturaProveedor: string
  fechaContabilizacion?: string
  proveedorId: string
  proveedorNombre?: string
  proveedorNif?: string
  proveedorEmail?: string
  proveedorTelefono?: string
  albaranesCompraIds?: string[]
  titulo?: string
  descripcion?: string
  lineas?: Partial<LineaFacturaCompra>[]
  vencimientos?: Partial<VencimientoFacturaCompra>[]
  totales?: Partial<TotalesFacturaCompra>
  descuentoGlobalPorcentaje?: number
  descuentoGlobalImporte?: number
  observaciones?: string
  tags?: string[]
  activo?: boolean
}

export interface UpdateFacturaCompraDTO extends Partial<CreateFacturaCompraDTO> {}

export interface RegistrarPagoDTO {
  importe: number
  fechaPago?: string
  formaPagoId?: string
  referenciaPago?: string
  vencimientoId?: string
  observaciones?: string
}

// ============================================
// FILTROS
// ============================================

export interface FacturasCompraFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  estado?: EstadoFacturaCompra
  estados?: string
  proveedorId?: string
  activo?: boolean
  contabilizada?: boolean
  fechaDesde?: string
  fechaHasta?: string
  fechaVencimientoDesde?: string
  fechaVencimientoHasta?: string
  importeMin?: number
  importeMax?: number
  numeroFacturaProveedor?: string
}

// ============================================
// RESPUESTAS API
// ============================================

export interface FacturasCompraResponse {
  success: boolean
  data: FacturaCompra[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface FacturaCompraResponse {
  success: boolean
  data: FacturaCompra
  message?: string
}

export interface FacturaCompraEstadisticas {
  total: number
  porEstado: Record<string, number>
  totalImporte: number
  totalPagado: number
  totalPendiente: number
  vencidas: number
}
