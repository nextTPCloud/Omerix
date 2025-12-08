// ============================================
// ENUMS
// ============================================

export enum EstadoPresupuesto {
  BORRADOR = 'borrador',
  ENVIADO = 'enviado',
  PENDIENTE = 'pendiente',
  ACEPTADO = 'aceptado',
  RECHAZADO = 'rechazado',
  CADUCADO = 'caducado',
  CONVERTIDO = 'convertido',
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

export interface ILineaPresupuesto {
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
  validezDias: number;
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

export interface ITotalesPresupuesto {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: IDesgloseIva[];
  totalIva: number;
  totalPresupuesto: number;
  costeTotalMateriales: number;
  costeTotalServicios: number;
  costeTotalKits: number;
  costeTotal: number;
  margenBruto: number;
  margenPorcentaje: number;
}

// Historial de cambios del presupuesto
export interface IHistorialPresupuesto {
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

export interface IPresupuesto {
  _id: string;
  codigo: string;
  serie: string;
  numero: number;
  version: number;
  presupuestoOrigenId?: string;
  estado: EstadoPresupuesto;
  fecha: string | Date;
  fechaValidez: string | Date;
  fechaEnvio?: string | Date;
  fechaRespuesta?: string | Date;
  contadorEnvios?: number;
  clienteId: string | { _id: string; codigo: string; nombre: string; nombreComercial?: string };
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;
  direccionEntrega?: IDireccionEntrega;
  fechaEntregaPrevista?: string | Date;
  proyectoId?: string | { _id: string; codigo: string; nombre: string };
  parteTrabajoId?: string;
  agenteComercialId?: string | { _id: string; codigo: string; nombre: string; apellidos: string };
  referenciaCliente?: string;
  pedidoCliente?: string;
  titulo?: string;
  descripcion?: string;
  lineas: ILineaPresupuesto[];
  condiciones: ICondicionesComerciales;
  totales: ITotalesPresupuesto;
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;
  observaciones?: string;
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
  historial?: IHistorialPresupuesto[];
  notasSeguimiento?: INotaSeguimiento[];
  // Portal de cliente
  tokenAccesoPortal?: string;
  tokenExpirado?: boolean;
  urlPortal?: string;
  respuestaCliente?: {
    fecha: string;
    aceptado: boolean;
    comentarios?: string;
    nombreFirmante?: string;
  };
  // Virtuals
  diasParaCaducar?: number | null;
  estaVigente?: boolean;
  puedeConvertirse?: boolean;
}

// ============================================
// DTOs
// ============================================

export interface CreatePresupuestoDTO {
  codigo?: string;
  serie?: string;
  estado?: EstadoPresupuesto;
  fecha?: string | Date;
  fechaValidez?: string | Date;
  clienteId: string;
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;
  direccionEntrega?: IDireccionEntrega;
  fechaEntregaPrevista?: string | Date;
  proyectoId?: string;
  parteTrabajoId?: string;
  agenteComercialId?: string;
  referenciaCliente?: string;
  pedidoCliente?: string;
  titulo?: string;
  descripcion?: string;
  lineas?: Omit<ILineaPresupuesto, '_id'>[];
  condiciones?: Partial<ICondicionesComerciales>;
  descuentoGlobalPorcentaje?: number;
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;
  observaciones?: string;
  tags?: string[];
  mostrarCostes?: boolean;
  mostrarMargenes?: boolean;
  mostrarComponentesKit?: boolean;
}

export interface UpdatePresupuestoDTO extends Partial<CreatePresupuestoDTO> {}

export interface SearchPresupuestosParams {
  search?: string;
  clienteId?: string;
  proyectoId?: string;
  agenteComercialId?: string;
  estado?: EstadoPresupuesto;
  estados?: string;
  serie?: string;
  activo?: 'true' | 'false' | 'all';
  fechaDesde?: string;
  fechaHasta?: string;
  fechaValidezDesde?: string;
  fechaValidezHasta?: string;
  importeMin?: string;
  importeMax?: string;
  vigentes?: 'true' | 'false';
  caducados?: 'true' | 'false';
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AplicarMargenParams {
  tipo: 'porcentaje' | 'importe';
  valor: number;
  aplicarA?: 'todas' | 'productos' | 'servicios' | 'seleccionadas';
  lineasIds?: string[];
  sobreCoste?: boolean;
}

export interface ImportarLineasParams {
  origen: 'presupuesto' | 'pedido' | 'factura' | 'productos';
  documentoId?: string;
  productosIds?: string[];
  incluirPrecios?: boolean;
  incluirDescuentos?: boolean;
  incluirCostes?: boolean;
  multiplicador?: number;
}

export interface PresupuestoEstadisticas {
  total: number;
  porEstado: Record<string, number>;
  totalImporte: number;
  totalAceptados: number;
  tasaConversion: number;
  margenPromedio: number;
}

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_PRESUPUESTO: { value: EstadoPresupuesto; label: string; color: string; dotColor: string }[] = [
  { value: EstadoPresupuesto.BORRADOR, label: 'Borrador', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-400' },
  { value: EstadoPresupuesto.ENVIADO, label: 'Enviado', color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' },
  { value: EstadoPresupuesto.PENDIENTE, label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' },
  { value: EstadoPresupuesto.ACEPTADO, label: 'Aceptado', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
  { value: EstadoPresupuesto.RECHAZADO, label: 'Rechazado', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' },
  { value: EstadoPresupuesto.CADUCADO, label: 'Caducado', color: 'bg-orange-100 text-orange-800', dotColor: 'bg-orange-500' },
  { value: EstadoPresupuesto.CONVERTIDO, label: 'Convertido', color: 'bg-purple-100 text-purple-800', dotColor: 'bg-purple-500' },
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

export const getEstadoConfig = (estado: EstadoPresupuesto) => {
  return ESTADOS_PRESUPUESTO.find(e => e.value === estado) || ESTADOS_PRESUPUESTO[0];
};

export const getTipoLineaLabel = (tipo: TipoLinea) => {
  return TIPOS_LINEA.find(t => t.value === tipo)?.label || tipo;
};

// Función para crear una línea vacía
export const crearLineaVacia = (orden: number): Omit<ILineaPresupuesto, '_id'> => ({
  orden,
  tipo: TipoLinea.PRODUCTO,
  nombre: '',
  cantidad: 1,
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
export const calcularLinea = (linea: Partial<ILineaPresupuesto>): ILineaPresupuesto => {
  const cantidad = linea.cantidad || 0;
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

  return {
    ...linea,
    cantidad,
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
  } as ILineaPresupuesto;
};
