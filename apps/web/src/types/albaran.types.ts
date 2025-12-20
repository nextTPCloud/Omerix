// ============================================
// ENUMS
// ============================================

export enum EstadoAlbaran {
  BORRADOR = 'borrador',
  PENDIENTE_ENTREGA = 'pendiente_entrega',
  EN_TRANSITO = 'en_transito',
  ENTREGADO = 'entregado',
  ENTREGA_PARCIAL = 'entrega_parcial',
  RECHAZADO = 'rechazado',
  FACTURADO = 'facturado',
  ANULADO = 'anulado',
}

export enum TipoAlbaran {
  VENTA = 'venta',
  DEVOLUCION = 'devolucion',
  TRASLADO = 'traslado',
  PRESTAMO = 'prestamo',
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
// TIPOS DE ORIGEN DE PRECIO
// ============================================

export type OrigenPrecio = 'producto' | 'tarifa' | 'oferta' | 'precio_cantidad' | 'manual';

export interface IDetalleOrigenPrecio {
  tarifaId?: string;
  tarifaNombre?: string;
  ofertaId?: string;
  ofertaNombre?: string;
  ofertaTipo?: string;
  descuentoAplicado?: number;
}

// ============================================
// INTERFACES
// ============================================

export interface IComponenteKit {
  productoId: string;
  nombre: string;
  sku?: string;
  cantidad: number;
  cantidadEntregada: number;
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

export interface ILineaAlbaran {
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
  cantidadSolicitada: number;
  cantidadEntregada: number;
  cantidadPendiente: number;
  unidad?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: string | Date;
  // Precios: original (PVP) y aplicado (puede ser de tarifa/oferta)
  precioOriginal?: number;
  precioUnitario: number;
  origenPrecio?: OrigenPrecio;
  detalleOrigenPrecio?: IDetalleOrigenPrecio;
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
  almacenId?: string;
  ubicacion?: string;
  esEditable: boolean;
  incluidoEnTotal: boolean;
  lineaPedidoId?: string;
  notasInternas?: string;
  notasEntrega?: string;
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

export interface IDatosTransporte {
  transportistaId?: string;
  nombreTransportista?: string;
  vehiculo?: string;
  matricula?: string;
  conductor?: string;
  telefonoConductor?: string;
  numeroSeguimiento?: string;
  costeEnvio?: number;
  seguroEnvio?: number;
  portesPagados: boolean;
}

export interface IDatosEntrega {
  fechaProgramada?: string | Date;
  fechaEntrega?: string | Date;
  horaEntrega?: string;
  receptorNombre?: string;
  receptorDni?: string;
  firmaDigital?: string;
  observacionesEntrega?: string;
  fotosEntrega?: string[];
  incidencias?: string;
}

export interface IBultos {
  cantidad: number;
  peso?: number;
  volumen?: number;
  descripcion?: string;
}

export interface IDesgloseIva {
  tipo: number;
  base: number;
  cuota: number;
}

export interface ITotalesAlbaran {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: IDesgloseIva[];
  totalIva: number;
  totalAlbaran: number;
  costeTotalMateriales: number;
  costeTotalServicios: number;
  costeTotalKits: number;
  costeTotal: number;
  margenBruto: number;
  margenPorcentaje: number;
}

export interface IHistorialAlbaran {
  _id?: string;
  fecha: string | Date;
  usuarioId: string | { _id: string; nombre: string; email: string };
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

export interface IAlbaran {
  _id: string;
  codigo: string;
  serie: string;
  numero: number;
  tipo: TipoAlbaran;
  pedidoOrigenId?: string | { _id: string; codigo: string };
  presupuestoOrigenId?: string | { _id: string; codigo: string };
  // Devolución/Rectificación (cuando tipo = DEVOLUCION)
  albaranRectificadoId?: string | { _id: string; codigo: string };
  albaranRectificadoCodigo?: string;
  motivoDevolucion?: string;
  estado: EstadoAlbaran;
  fecha: string | Date;
  fechaVencimiento?: string | Date;
  clienteId: string | { _id: string; codigo: string; nombre: string; nombreComercial?: string };
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;
  direccionEntrega?: IDireccionEntrega;
  datosTransporte?: IDatosTransporte;
  datosEntrega?: IDatosEntrega;
  bultos?: IBultos;
  proyectoId?: string | { _id: string; codigo: string; nombre: string };
  almacenId?: string | { _id: string; codigo: string; nombre: string };
  agenteComercialId?: string | { _id: string; codigo: string; nombre: string; apellidos: string };
  referenciaCliente?: string;
  pedidoCliente?: string;
  titulo?: string;
  descripcion?: string;
  lineas: ILineaAlbaran[];
  totales: ITotalesAlbaran;
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;
  observaciones?: string;
  observacionesInternas?: string;
  condicionesEntrega?: string;
  tags?: string[];
  activo: boolean;
  bloqueado: boolean;
  facturado: boolean;
  facturaId?: string | { _id: string; codigo: string };
  mostrarCostes: boolean;
  mostrarMargenes: boolean;
  mostrarComponentesKit: boolean;
  mostrarPrecios: boolean;
  creadoPor?: string | { _id: string; nombre: string; email: string };
  modificadoPor?: string | { _id: string; nombre: string; email: string };
  fechaCreacion: string | Date;
  fechaModificacion?: string | Date;
  historial?: IHistorialAlbaran[];
  // Virtuals
  porcentajeEntregado?: number;
  estaCompleto?: boolean;
  diasDesdeCreacion?: number;
  valorPendiente?: number;
}

// ============================================
// DTOs
// ============================================

export interface CreateAlbaranDTO {
  codigo?: string;
  serie?: string;
  serieId?: string;
  tipo?: TipoAlbaran;
  pedidoOrigenId?: string;
  presupuestoOrigenId?: string;
  // Devolución/Rectificación
  albaranRectificadoId?: string;
  albaranRectificadoCodigo?: string;
  motivoDevolucion?: string;
  estado?: EstadoAlbaran;
  fecha?: string | Date;
  fechaVencimiento?: string | Date;
  clienteId: string;
  clienteNombre?: string;
  clienteNif?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;
  direccionEntrega?: IDireccionEntrega;
  datosTransporte?: IDatosTransporte;
  datosEntrega?: IDatosEntrega;
  bultos?: IBultos;
  proyectoId?: string;
  almacenId?: string;
  agenteComercialId?: string;
  referenciaCliente?: string;
  pedidoCliente?: string;
  titulo?: string;
  descripcion?: string;
  lineas?: Omit<ILineaAlbaran, '_id'>[];
  descuentoGlobalPorcentaje?: number;
  observaciones?: string;
  observacionesInternas?: string;
  condicionesEntrega?: string;
  tags?: string[];
  mostrarCostes?: boolean;
  mostrarMargenes?: boolean;
  mostrarComponentesKit?: boolean;
  mostrarPrecios?: boolean;
}

export interface UpdateAlbaranDTO extends Partial<CreateAlbaranDTO> {}

export interface SearchAlbaranesParams {
  search?: string;
  clienteId?: string;
  proyectoId?: string;
  agenteComercialId?: string;
  almacenId?: string;
  estado?: EstadoAlbaran;
  estados?: string;
  tipo?: TipoAlbaran;
  serie?: string;
  activo?: 'true' | 'false' | 'all';
  facturado?: 'true' | 'false';
  fechaDesde?: string;
  fechaHasta?: string;
  fechaEntregaDesde?: string;
  fechaEntregaHasta?: string;
  importeMin?: string;
  importeMax?: string;
  pedidoOrigenId?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CrearDesdePedidoParams {
  lineasIds?: string[];
  entregarTodo?: boolean;
  almacenId?: string;
  direccionEntrega?: IDireccionEntrega;
  datosTransporte?: IDatosTransporte;
  fechaEntregaProgramada?: string | Date;
  observaciones?: string;
}

export interface LineaEntregadaDTO {
  lineaId: string;
  cantidadEntregada: number;
  lote?: string;
  numeroSerie?: string;
  observaciones?: string;
}

export interface RegistrarEntregaParams {
  fechaEntrega?: string | Date;
  horaEntrega?: string;
  receptorNombre?: string;
  receptorDni?: string;
  firmaDigital?: string;
  observaciones?: string;
  fotosEntrega?: string[];
  incidencias?: string;
  lineasEntregadas?: LineaEntregadaDTO[];
}

export interface CambiarEstadoAlbaranParams {
  estado: EstadoAlbaran;
  observaciones?: string;
}

export interface AlbaranEstadisticas {
  total: number;
  porEstado: Record<string, number>;
  porTipo: Record<string, number>;
  totalImporte: number;
  totalFacturado: number;
  totalPendienteFacturar: number;
  ultimoMes: number;
}

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_ALBARAN: { value: EstadoAlbaran; label: string; color: string; dotColor: string }[] = [
  { value: EstadoAlbaran.BORRADOR, label: 'Borrador', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-400' },
  { value: EstadoAlbaran.PENDIENTE_ENTREGA, label: 'Pendiente entrega', color: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' },
  { value: EstadoAlbaran.EN_TRANSITO, label: 'En tránsito', color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' },
  { value: EstadoAlbaran.ENTREGADO, label: 'Entregado', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
  { value: EstadoAlbaran.ENTREGA_PARCIAL, label: 'Entrega parcial', color: 'bg-orange-100 text-orange-800', dotColor: 'bg-orange-500' },
  { value: EstadoAlbaran.RECHAZADO, label: 'Rechazado', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' },
  { value: EstadoAlbaran.FACTURADO, label: 'Facturado', color: 'bg-purple-100 text-purple-800', dotColor: 'bg-purple-500' },
  { value: EstadoAlbaran.ANULADO, label: 'Anulado', color: 'bg-gray-200 text-gray-600', dotColor: 'bg-gray-500' },
];

export const TIPOS_ALBARAN: { value: TipoAlbaran; label: string }[] = [
  { value: TipoAlbaran.VENTA, label: 'Venta' },
  { value: TipoAlbaran.DEVOLUCION, label: 'Devolución' },
  { value: TipoAlbaran.TRASLADO, label: 'Traslado' },
  { value: TipoAlbaran.PRESTAMO, label: 'Préstamo' },
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

export const getEstadoConfig = (estado: EstadoAlbaran) => {
  return ESTADOS_ALBARAN.find(e => e.value === estado) || ESTADOS_ALBARAN[0];
};

export const getTipoAlbaranLabel = (tipo: TipoAlbaran) => {
  return TIPOS_ALBARAN.find(t => t.value === tipo)?.label || tipo;
};

export const getTipoLineaLabel = (tipo: TipoLinea) => {
  return TIPOS_LINEA.find(t => t.value === tipo)?.label || tipo;
};

// Función para crear una línea vacía
export const crearLineaVacia = (orden: number): Omit<ILineaAlbaran, '_id'> => ({
  orden,
  tipo: TipoLinea.PRODUCTO,
  nombre: '',
  cantidadSolicitada: 1,
  cantidadEntregada: 1,
  cantidadPendiente: 0,
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

// Función para calcular una línea
export const calcularLinea = (linea: Partial<ILineaAlbaran>): ILineaAlbaran => {
  const cantidadSolicitada = linea.cantidadSolicitada || 0;
  const cantidadEntregada = linea.cantidadEntregada || 0;
  const precioUnitario = linea.precioUnitario || 0;
  const costeUnitario = linea.costeUnitario || 0;
  const descuento = linea.descuento || 0;
  const iva = linea.iva || 21;

  const subtotalBruto = cantidadEntregada * precioUnitario;
  const descuentoImporte = subtotalBruto * (descuento / 100);
  const subtotal = subtotalBruto - descuentoImporte;
  const ivaImporte = subtotal * (iva / 100);
  const total = subtotal + ivaImporte;

  const costeTotalLinea = cantidadEntregada * costeUnitario;
  const margenUnitario = precioUnitario - costeUnitario;
  const margenPorcentaje = costeUnitario > 0 ? ((precioUnitario - costeUnitario) / costeUnitario) * 100 : 0;
  const margenTotalLinea = subtotal - costeTotalLinea;

  const cantidadPendiente = Math.max(0, cantidadSolicitada - cantidadEntregada);

  return {
    ...linea,
    cantidadSolicitada,
    cantidadEntregada,
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
  } as ILineaAlbaran;
};

// Calcular porcentaje de entrega del albarán
export const calcularPorcentajeEntregado = (lineas: ILineaAlbaran[]): number => {
  const lineasProducto = lineas.filter(l => l.tipo === TipoLinea.PRODUCTO || l.tipo === TipoLinea.SERVICIO);
  if (lineasProducto.length === 0) return 0;

  const totalSolicitada = lineasProducto.reduce((sum, l) => sum + l.cantidadSolicitada, 0);
  const totalEntregada = lineasProducto.reduce((sum, l) => sum + l.cantidadEntregada, 0);

  if (totalSolicitada === 0) return 0;
  return Math.round((totalEntregada / totalSolicitada) * 100);
};
