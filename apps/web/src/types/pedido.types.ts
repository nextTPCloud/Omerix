// ============================================
// ENUMS
// ============================================

export enum EstadoPedido {
  BORRADOR = 'borrador',
  CONFIRMADO = 'confirmado',
  EN_PROCESO = 'en_proceso',
  PARCIALMENTE_SERVIDO = 'parcialmente_servido',
  SERVIDO = 'servido',
  FACTURADO = 'facturado',
  CANCELADO = 'cancelado',
}

export enum Prioridad {
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
}

export enum TipoLinea {
  PRODUCTO = 'producto',
  SERVICIO = 'servicio',
  KIT = 'kit',
  TEXTO = 'texto',
  SUBTOTAL = 'subtotal',
  DESCUENTO = 'descuento',
}

// ============================================
// INTERFACES
// ============================================

export interface IComponenteKit {
  productoId: string;
  nombre: string;
  sku?: string;
  cantidad: number;
  precioUnitario: number;
  costeUnitario: number;
  descuento: number;
  iva: number;
  subtotal: number;
  opcional: boolean;
  seleccionado: boolean;
}

export interface IVarianteSeleccionada {
  varianteId?: string;
  sku: string;
  combinacion: Record<string, string>;
  precioAdicional: number;
  costeAdicional: number;
}

export interface ILineaPedido {
  _id?: string;
  orden: number;
  tipo: TipoLinea;
  productoId?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  descripcionLarga?: string;
  sku?: string;
  variante?: IVarianteSeleccionada;
  cantidad: number;
  cantidadServida: number;
  cantidadPendiente: number;
  unidad?: string;
  precioUnitario: number;
  descuento: number;
  descuentoImporte: number;
  subtotal: number;
  iva: number;
  ivaImporte: number;
  total: number;
  costeUnitario: number;
  costeTotalLinea: number;
  margenUnitario: number;
  margenPorcentaje: number;
  margenTotalLinea: number;
  componentesKit?: IComponenteKit[];
  mostrarComponentes: boolean;
  esEditable: boolean;
  incluidoEnTotal: boolean;
  notasInternas?: string;
}

export interface IDireccionEntrega {
  tipo: 'cliente' | 'personalizada' | 'recogida';
  direccionId?: string;
  nombre?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  personaContacto?: string;
  telefonoContacto?: string;
  horarioEntrega?: string;
  instrucciones?: string;
}

export interface ICondicionesComerciales {
  formaPagoId?: string;
  terminoPagoId?: string;
  tiempoEntrega?: string;
  garantia?: string;
  portesPagados: boolean;
  portesImporte?: number;
  observacionesEntrega?: string;
}

export interface IDesgloseIva {
  tipo: number;
  base: number;
  cuota: number;
}

export interface ITotalesPedido {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: IDesgloseIva[];
  totalIva: number;
  totalPedido: number;
  costeTotalMateriales: number;
  costeTotalServicios: number;
  costeTotalKits: number;
  costeTotal: number;
  margenBruto: number;
  margenPorcentaje: number;
}

// Historial de cambios del pedido
export interface IHistorialPedido {
  _id?: string;
  fecha: string | Date;
  usuarioId: string | { _id: string; nombre: string; email: string };
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

// Notas de seguimiento (llamadas, contactos, etc.)
export interface INotaSeguimiento {
  _id?: string;
  fecha: string | Date;
  usuarioId: string | { _id: string; nombre: string; email: string };
  tipo: 'llamada' | 'email' | 'reunion' | 'nota' | 'recordatorio';
  contenido: string;
  resultado?: string;
  proximaAccion?: string;
  fechaProximaAccion?: string | Date;
}

export interface IPedido {
  _id: string;
  codigo: string;
  serie: string;
  numero: number;
  presupuestoOrigenId?: string | { _id: string; codigo: string };
  estado: EstadoPedido;
  prioridad: Prioridad;
  fecha: string | Date;
  fechaConfirmacion?: string | Date;
  fechaEntregaComprometida?: string | Date;
  fechaEntregaReal?: string | Date;
  contadorEnvios?: number;
  clienteId: string | { _id: string; codigo: string; nombre: string; nombreComercial?: string };
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;
  direccionEntrega?: IDireccionEntrega;
  proyectoId?: string | { _id: string; codigo: string; nombre: string };
  parteTrabajoId?: string;
  agenteComercialId?: string | { _id: string; codigo: string; nombre: string; apellidos: string };
  referenciaCliente?: string;
  pedidoCliente?: string;
  titulo?: string;
  descripcion?: string;
  lineas: ILineaPedido[];
  condiciones: ICondicionesComerciales;
  totales: ITotalesPedido;
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;
  observaciones?: string;
  observacionesAlmacen?: string;
  tags?: string[];
  activo: boolean;
  bloqueado: boolean;
  mostrarCostes: boolean;
  mostrarMargenes: boolean;
  mostrarComponentesKit: boolean;
  creadoPor?: string | { _id: string; nombre: string; email: string };
  modificadoPor?: string | { _id: string; nombre: string; email: string };
  fechaCreacion: string | Date;
  fechaModificacion?: string | Date;
  // Historial y seguimiento
  historial?: IHistorialPedido[];
  notasSeguimiento?: INotaSeguimiento[];
  // Virtuals
  porcentajeServido?: number;
  estaCompleto?: boolean;
  diasDesdeConfirmacion?: number | null;
  diasHastaEntrega?: number | null;
}

// ============================================
// DTOs
// ============================================

export interface CreatePedidoDTO {
  codigo?: string;
  serie?: string;
  serieId?: string;
  estado?: EstadoPedido;
  prioridad?: Prioridad;
  fecha?: string | Date;
  fechaConfirmacion?: string | Date;
  fechaEntregaComprometida?: string | Date;
  presupuestoOrigenId?: string;
  clienteId: string;
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;
  direccionEntrega?: IDireccionEntrega;
  proyectoId?: string;
  parteTrabajoId?: string;
  agenteComercialId?: string;
  referenciaCliente?: string;
  pedidoCliente?: string;
  titulo?: string;
  descripcion?: string;
  lineas?: Omit<ILineaPedido, '_id'>[];
  condiciones?: Partial<ICondicionesComerciales>;
  descuentoGlobalPorcentaje?: number;
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;
  observaciones?: string;
  observacionesAlmacen?: string;
  tags?: string[];
  mostrarCostes?: boolean;
  mostrarMargenes?: boolean;
  mostrarComponentesKit?: boolean;
}

export interface UpdatePedidoDTO extends Partial<CreatePedidoDTO> {}

export interface SearchPedidosParams {
  search?: string;
  clienteId?: string;
  proyectoId?: string;
  agenteComercialId?: string;
  estado?: EstadoPedido;
  estados?: string;
  prioridad?: Prioridad;
  serie?: string;
  activo?: 'true' | 'false' | 'all';
  fechaDesde?: string;
  fechaHasta?: string;
  fechaEntregaDesde?: string;
  fechaEntregaHasta?: string;
  importeMin?: string;
  importeMax?: string;
  pendientesEntrega?: 'true' | 'false';
  retrasados?: 'true' | 'false';
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CambiarEstadoPedidoParams {
  estado: EstadoPedido;
  observaciones?: string;
}

export interface AplicarMargenParams {
  tipo: 'porcentaje' | 'importe';
  valor: number;
  aplicarA?: 'todas' | 'productos' | 'servicios' | 'seleccionadas';
  lineasIds?: string[];
  sobreCoste?: boolean;
}

export interface ImportarLineasParams {
  origen: 'presupuesto' | 'pedido' | 'albaran' | 'productos';
  documentoId?: string;
  productosIds?: string[];
  incluirPrecios?: boolean;
  incluirDescuentos?: boolean;
  incluirCostes?: boolean;
  multiplicador?: number;
}

export interface CrearDesdePresupuestoParams {
  copiarNotas?: boolean;
  fechaEntregaComprometida?: string | Date;
  prioridad?: Prioridad;
}

export interface PedidoEstadisticas {
  total: number;
  porEstado: Record<string, number>;
  totalImporte: number;
  totalServidos: number;
  tasaCompletado: number;
  tiempoMedioEntrega: number;
}

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_PEDIDO: { value: EstadoPedido; label: string; color: string; dotColor: string }[] = [
  { value: EstadoPedido.BORRADOR, label: 'Borrador', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-400' },
  { value: EstadoPedido.CONFIRMADO, label: 'Confirmado', color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' },
  { value: EstadoPedido.EN_PROCESO, label: 'En proceso', color: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' },
  { value: EstadoPedido.PARCIALMENTE_SERVIDO, label: 'Parcialmente servido', color: 'bg-orange-100 text-orange-800', dotColor: 'bg-orange-500' },
  { value: EstadoPedido.SERVIDO, label: 'Servido', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
  { value: EstadoPedido.FACTURADO, label: 'Facturado', color: 'bg-purple-100 text-purple-800', dotColor: 'bg-purple-500' },
  { value: EstadoPedido.CANCELADO, label: 'Cancelado', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' },
];

export const PRIORIDADES: { value: Prioridad; label: string; color: string; dotColor: string }[] = [
  { value: Prioridad.ALTA, label: 'Alta', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' },
  { value: Prioridad.MEDIA, label: 'Media', color: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' },
  { value: Prioridad.BAJA, label: 'Baja', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
];

export const TIPOS_LINEA: { value: TipoLinea; label: string }[] = [
  { value: TipoLinea.PRODUCTO, label: 'Producto' },
  { value: TipoLinea.SERVICIO, label: 'Servicio' },
  { value: TipoLinea.KIT, label: 'Kit' },
  { value: TipoLinea.TEXTO, label: 'Texto' },
  { value: TipoLinea.SUBTOTAL, label: 'Subtotal' },
  { value: TipoLinea.DESCUENTO, label: 'Descuento' },
];

export const TIPOS_IVA = [
  { value: 21, label: '21%' },
  { value: 10, label: '10%' },
  { value: 4, label: '4%' },
  { value: 0, label: '0%' },
];

export const getEstadoConfig = (estado: EstadoPedido) => {
  return ESTADOS_PEDIDO.find(e => e.value === estado) || ESTADOS_PEDIDO[0];
};

export const getPrioridadConfig = (prioridad: Prioridad) => {
  return PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[1];
};

export const getTipoLineaLabel = (tipo: TipoLinea) => {
  return TIPOS_LINEA.find(t => t.value === tipo)?.label || tipo;
};

// Funcion para crear una linea vacia
export const crearLineaVacia = (orden: number): Omit<ILineaPedido, '_id'> => ({
  orden,
  tipo: TipoLinea.PRODUCTO,
  nombre: '',
  cantidad: 1,
  cantidadServida: 0,
  cantidadPendiente: 1,
  unidad: 'ud',
  precioUnitario: 0,
  costeUnitario: 0,
  descuento: 0,
  descuentoImporte: 0,
  subtotal: 0,
  iva: 21,
  ivaImporte: 0,
  total: 0,
  costeTotalLinea: 0,
  margenUnitario: 0,
  margenPorcentaje: 0,
  margenTotalLinea: 0,
  mostrarComponentes: true,
  esEditable: true,
  incluidoEnTotal: true,
});

// Funcion para calcular una linea
export const calcularLinea = (linea: Partial<ILineaPedido>): ILineaPedido => {
  const cantidad = linea.cantidad || 0;
  const cantidadServida = linea.cantidadServida || 0;
  const precioUnitario = linea.precioUnitario || 0;
  const costeUnitario = linea.costeUnitario || 0;
  const descuento = linea.descuento || 0;
  const iva = linea.iva || 21;

  const subtotalBruto = cantidad * precioUnitario;
  const descuentoImporte = subtotalBruto * (descuento / 100);
  const subtotal = subtotalBruto - descuentoImporte;
  const ivaImporte = subtotal * (iva / 100);
  const total = subtotal + ivaImporte;

  const costeTotalLinea = cantidad * costeUnitario;
  const margenUnitario = precioUnitario - costeUnitario;
  const margenPorcentaje = costeUnitario > 0 ? ((precioUnitario - costeUnitario) / costeUnitario) * 100 : 0;
  const margenTotalLinea = subtotal - costeTotalLinea;

  const cantidadPendiente = Math.max(0, cantidad - cantidadServida);

  return {
    ...linea,
    cantidad,
    cantidadServida,
    cantidadPendiente,
    precioUnitario,
    costeUnitario,
    descuento,
    descuentoImporte: Math.round(descuentoImporte * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    iva,
    ivaImporte: Math.round(ivaImporte * 100) / 100,
    total: Math.round(total * 100) / 100,
    costeTotalLinea: Math.round(costeTotalLinea * 100) / 100,
    margenUnitario: Math.round(margenUnitario * 100) / 100,
    margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    margenTotalLinea: Math.round(margenTotalLinea * 100) / 100,
  } as ILineaPedido;
};

// Calcular porcentaje de servido del pedido
export const calcularPorcentajeServido = (lineas: ILineaPedido[]): number => {
  const lineasProducto = lineas.filter(l => l.tipo === TipoLinea.PRODUCTO || l.tipo === TipoLinea.SERVICIO);
  if (lineasProducto.length === 0) return 0;

  const totalCantidad = lineasProducto.reduce((sum, l) => sum + l.cantidad, 0);
  const totalServida = lineasProducto.reduce((sum, l) => sum + l.cantidadServida, 0);

  if (totalCantidad === 0) return 0;
  return Math.round((totalServida / totalCantidad) * 100);
};

// Verificar si el pedido esta retrasado
export const estaRetrasado = (pedido: IPedido): boolean => {
  if (!pedido.fechaEntregaComprometida) return false;
  if ([EstadoPedido.SERVIDO, EstadoPedido.FACTURADO, EstadoPedido.CANCELADO].includes(pedido.estado)) return false;

  const fechaEntrega = new Date(pedido.fechaEntregaComprometida);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return fechaEntrega < hoy;
};
