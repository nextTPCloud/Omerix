// ============================================
// TIPOS DE PEDIDO DE COMPRA
// ============================================

// ============================================
// ENUMS
// ============================================

export type EstadoPedidoCompra =
  | 'borrador'
  | 'enviado'
  | 'confirmado'
  | 'parcialmente_recibido'
  | 'recibido'
  | 'facturado'
  | 'cancelado'

export type TipoLineaCompra = 'producto' | 'servicio' | 'kit' | 'texto' | 'subtotal' | 'descuento'

export type Prioridad = 'alta' | 'media' | 'baja'

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_PEDIDO_COMPRA: { value: EstadoPedidoCompra; label: string; color: string }[] = [
  { value: 'borrador', label: 'Borrador', color: 'bg-gray-500' },
  { value: 'enviado', label: 'Enviado', color: 'bg-blue-500' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-500' },
  { value: 'parcialmente_recibido', label: 'Parcialmente Recibido', color: 'bg-yellow-500' },
  { value: 'recibido', label: 'Recibido', color: 'bg-emerald-500' },
  { value: 'facturado', label: 'Facturado', color: 'bg-purple-500' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500' },
]

export const PRIORIDADES: { value: Prioridad; label: string; color: string }[] = [
  { value: 'baja', label: 'Baja', color: 'bg-gray-500' },
  { value: 'media', label: 'Media', color: 'bg-yellow-500' },
  { value: 'alta', label: 'Alta', color: 'bg-red-500' },
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
// INTERFACES - VARIANTES Y KITS
// ============================================

export interface IVarianteSeleccionada {
  varianteId: string
  sku: string
  combinacion: Record<string, string>
  precioAdicional?: number
  costeAdicional?: number
}

export interface IComponenteKitCompra {
  productoId: string
  nombre: string
  sku?: string
  cantidad: number
  precioUnitario: number
  costeUnitario: number
  descuento: number
  iva: number
  subtotal: number
  opcional: boolean
  seleccionado: boolean
}

// ============================================
// INTERFACES - LINEAS
// ============================================

export interface LineaPedidoCompra {
  _id?: string
  orden: number
  tipo: TipoLineaCompra

  // Producto
  productoId?: string
  codigo?: string
  nombre: string
  descripcion?: string
  descripcionLarga?: string
  sku?: string
  codigoProveedor?: string

  // Variante
  variante?: IVarianteSeleccionada

  // Kit
  componentesKit?: IComponenteKitCompra[]
  mostrarComponentes?: boolean

  // Cantidades
  cantidad: number
  cantidadRecibida: number
  cantidadPendiente: number
  unidad?: string

  // Precios
  precioUnitario: number
  costeUnitario?: number
  descuento: number
  descuentoImporte: number
  subtotal: number
  iva: number
  ivaImporte: number
  total: number

  // Fechas
  fechaEntregaPrevista?: string
  fechaRecepcion?: string

  // Almacen
  almacenDestinoId?: string

  // Flags
  esEditable: boolean
  incluidoEnTotal: boolean

  // Notas
  notasInternas?: string
}

// ============================================
// INTERFACES - DIRECCION
// ============================================

export interface DireccionRecepcion {
  tipo: 'empresa' | 'almacen' | 'personalizada'
  almacenId?: string
  nombre?: string
  calle?: string
  numero?: string
  piso?: string
  codigoPostal?: string
  ciudad?: string
  provincia?: string
  pais?: string
  personaContacto?: string
  telefonoContacto?: string
  horarioRecepcion?: string
  instrucciones?: string
}

// ============================================
// INTERFACES - CONDICIONES
// ============================================

export interface CondicionesCompra {
  formaPagoId?: string
  terminoPagoId?: string
  diasPago?: number
  portesPagados: boolean
  portesImporte?: number
  observacionesEntrega?: string
}

// ============================================
// INTERFACES - TOTALES
// ============================================

export interface DesgloseIva {
  tipo: number
  base: number
  cuota: number
}

export interface TotalesPedidoCompra {
  subtotalBruto: number
  totalDescuentos: number
  subtotalNeto: number
  desgloseIva: DesgloseIva[]
  totalIva: number
  totalPedido: number
}

// ============================================
// INTERFACES - DOCUMENTOS E HISTORIAL
// ============================================

export interface DocumentoPedidoCompra {
  _id?: string
  nombre: string
  url: string
  tipo: string
  tamaño: number
  fechaSubida: string
  subidoPor: string
}

export interface HistorialPedidoCompra {
  _id?: string
  fecha: string
  usuarioId: string
  accion: string
  descripcion?: string
  datosAnteriores?: any
}

// ============================================
// INTERFACE PRINCIPAL - PEDIDO DE COMPRA
// ============================================

export interface PedidoCompra {
  _id: string

  // Identificacion
  codigo: string
  serie: string
  numero: number

  // Estado
  estado: EstadoPedidoCompra

  // Prioridad
  prioridad: Prioridad

  // Fechas
  fecha: string
  fechaEnvio?: string
  fechaConfirmacion?: string
  fechaEntregaPrevista?: string
  fechaRecepcion?: string

  // Proveedor
  proveedorId: string
  proveedorNombre: string
  proveedorNif: string
  proveedorEmail?: string
  proveedorTelefono?: string
  proveedorDireccion?: string

  // Recepcion
  direccionRecepcion?: DireccionRecepcion

  // Referencias
  referenciaProveedor?: string
  numeroConfirmacion?: string

  // Titulo y descripcion
  titulo?: string
  descripcion?: string

  // Lineas
  lineas: LineaPedidoCompra[]

  // Condiciones
  condiciones: CondicionesCompra

  // Totales
  totales: TotalesPedidoCompra

  // Descuento global
  descuentoGlobalPorcentaje: number
  descuentoGlobalImporte: number

  // Textos
  observaciones?: string
  observacionesAlmacen?: string

  // Documentos
  documentos: DocumentoPedidoCompra[]

  // Historial
  historial: HistorialPedidoCompra[]

  // Tags
  tags?: string[]

  // Control
  activo: boolean
  bloqueado: boolean

  // Auditoria
  creadoPor: string
  modificadoPor?: string
  fechaCreacion: string
  fechaModificacion?: string

  // Virtuals
  porcentajeRecibido?: number
  estaCompleto?: boolean
  diasHastaEntrega?: number | null
}

// ============================================
// DTOs
// ============================================

export interface CreatePedidoCompraDTO {
  serie?: string
  estado?: EstadoPedidoCompra
  prioridad?: Prioridad
  fecha?: string
  fechaEnvio?: string
  fechaConfirmacion?: string
  fechaEntregaPrevista?: string
  fechaRecepcion?: string
  proveedorId: string
  proveedorNombre?: string
  proveedorNif?: string
  proveedorEmail?: string
  proveedorTelefono?: string
  direccionRecepcion?: DireccionRecepcion
  referenciaProveedor?: string
  numeroConfirmacion?: string
  titulo?: string
  descripcion?: string
  lineas?: Partial<LineaPedidoCompra>[]
  condiciones?: Partial<CondicionesCompra>
  totales?: Partial<TotalesPedidoCompra>
  descuentoGlobalPorcentaje?: number
  descuentoGlobalImporte?: number
  observaciones?: string
  observacionesAlmacen?: string
  tags?: string[]
  activo?: boolean
}

export interface UpdatePedidoCompraDTO extends Partial<CreatePedidoCompraDTO> {}

// ============================================
// FILTROS
// ============================================

export interface PedidosCompraFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  estado?: EstadoPedidoCompra
  prioridad?: Prioridad
  proveedorId?: string
  activo?: boolean
  fechaDesde?: string
  fechaHasta?: string
  fechaEntregaDesde?: string
  fechaEntregaHasta?: string
  importeMinimo?: number
  importeMaximo?: number
}

// ============================================
// RESPUESTAS API
// ============================================

export interface PedidosCompraResponse {
  success: boolean
  data: PedidoCompra[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PedidoCompraResponse {
  success: boolean
  data: PedidoCompra
  message?: string
}

export interface PedidoCompraEstadisticas {
  total: number
  porEstado: Record<string, number>
  totalImporte: number
  pendientesRecibir: number
}
