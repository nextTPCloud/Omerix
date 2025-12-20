// ============================================
// ENUMS
// ============================================

export enum EstadoFactura {
  BORRADOR = 'borrador',
  EMITIDA = 'emitida',
  ENVIADA = 'enviada',
  PARCIALMENTE_COBRADA = 'parcialmente_cobrada',
  COBRADA = 'cobrada',
  VENCIDA = 'vencida',
  IMPAGADA = 'impagada',
  RECTIFICADA = 'rectificada',
  ANULADA = 'anulada',
}

export enum TipoFactura {
  ORDINARIA = 'ordinaria',
  RECTIFICATIVA = 'rectificativa',
  SIMPLIFICADA = 'simplificada',
  RECAPITULATIVA = 'recapitulativa',
  PROFORMA = 'proforma',
}

export enum MotivoRectificacion {
  ERROR_EXPEDICION = 'error_expedicion',
  DEVOLUCION = 'devolucion',
  DESCUENTO_POST_VENTA = 'descuento_post_venta',
  BONIFICACION = 'bonificacion',
  IMPAGO_CONCURSAL = 'impago_concursal',
  OTROS = 'otros',
}

export enum TipoLinea {
  PRODUCTO = 'producto',
  SERVICIO = 'servicio',
  KIT = 'kit',
  TEXTO = 'texto',
  SUBTOTAL = 'subtotal',
  DESCUENTO = 'descuento',
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  TARJETA = 'tarjeta',
  DOMICILIACION = 'domiciliacion',
  CHEQUE = 'cheque',
  PAGARE = 'pagare',
  CONFIRMING = 'confirming',
  COMPENSACION = 'compensacion',
}

export enum SistemaFiscal {
  VERIFACTU = 'verifactu',
  TICKETBAI = 'ticketbai',
  SII = 'sii',
  NINGUNO = 'ninguno',
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

export interface IVarianteSeleccionada {
  varianteId?: string;
  sku: string;
  combinacion: Record<string, string>;
  precioAdicional: number;
  costeAdicional: number;
}

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

export interface ILineaFactura {
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
  recargoEquivalencia?: number;
  recargoImporte?: number;
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
  albaranLineaId?: string;
  pedidoLineaId?: string;
}

export interface IDireccion {
  nombre?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
}

export interface IDesgloseIva {
  tipo: number;
  base: number;
  cuota: number;
  recargo?: number;
  cuotaRecargo?: number;
}

export interface ITotalesFactura {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: IDesgloseIva[];
  totalIva: number;
  totalRecargoEquivalencia: number;
  totalFactura: number;
  costeTotalMateriales: number;
  costeTotalServicios: number;
  costeTotalKits: number;
  costeTotal: number;
  margenBruto: number;
  margenPorcentaje: number;
}

export interface IVencimiento {
  _id?: string;
  numero: number;
  fecha: string | Date;
  importe: number;
  metodoPago: MetodoPago;
  cobrado: boolean;
  fechaCobro?: string | Date;
  referenciaPago?: string;
  observaciones?: string;
}

export interface ICobro {
  _id?: string;
  fecha: string | Date;
  importe: number;
  metodoPago: MetodoPago;
  referencia?: string;
  cuentaDestino?: string;
  observaciones?: string;
  registradoPor: string | { _id: string; nombre: string; email: string };
  fechaRegistro: string | Date;
}

export interface IVeriFactu {
  idFactura: string;
  hash: string;
  hashAnterior?: string;
  fechaExpedicion: string | Date;
  fechaEnvio?: string | Date;
  estadoEnvio: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado';
  codigoRespuesta?: string;
  mensajeRespuesta?: string;
  urlQR: string;
  datosQR: string;
}

export interface ITicketBAI {
  tbaiId: string;
  firma: string;
  qr: string;
  urlQR: string;
  fechaExpedicion: string | Date;
  fechaEnvio?: string | Date;
  estadoEnvio: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado';
  codigoRespuesta?: string;
  mensajeRespuesta?: string;
}

export interface IHistorialFactura {
  _id?: string;
  fecha: string | Date;
  usuarioId: string | { _id: string; nombre: string; email: string };
  accion: string;
  descripcion?: string;
  datosAnteriores?: Record<string, unknown>;
}

export interface IFactura {
  _id: string;
  codigo: string;
  serie: string;
  numero: number;
  tipo: TipoFactura;
  estado: EstadoFactura;
  fecha: string | Date;
  fechaOperacion?: string | Date;
  fechaVencimiento?: string | Date;
  fechaEnvio?: string | Date;
  periodoFacturacion?: {
    desde: string | Date;
    hasta: string | Date;
  };

  // Rectificativa
  esRectificativa: boolean;
  facturaRectificadaId?: string | { _id: string; codigo: string };
  facturaRectificadaCodigo?: string;
  motivoRectificacion?: MotivoRectificacion;
  descripcionRectificacion?: string;

  // Cliente
  clienteId: string | { _id: string; codigo: string; nombre: string; nombreComercial?: string };
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccion;

  // Orígenes
  albaranesOrigen?: (string | { _id: string; codigo: string })[];
  pedidosOrigen?: (string | { _id: string; codigo: string })[];
  presupuestosOrigen?: (string | { _id: string; codigo: string })[];

  // Relaciones
  proyectoId?: string | { _id: string; codigo: string; nombre: string };
  agenteComercialId?: string | { _id: string; codigo: string; nombre: string; apellidos: string };

  // Referencias
  referenciaCliente?: string;
  titulo?: string;
  descripcion?: string;

  // Líneas
  lineas: ILineaFactura[];

  // Totales
  totales: ITotalesFactura;

  // Descuentos
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Vencimientos y cobros
  vencimientos: IVencimiento[];
  cobros: ICobro[];
  importeCobrado: number;
  importePendiente: number;

  // Datos fiscales
  regimenIva: string;
  claveOperacion?: string;
  recargoEquivalencia: boolean;
  retencionIRPF?: number;
  importeRetencion?: number;

  // Sistema fiscal
  sistemaFiscal: SistemaFiscal;
  verifactu?: IVeriFactu;
  ticketbai?: ITicketBAI;

  // QR
  codigoQR?: string;
  urlVerificacion?: string;

  // Textos
  observaciones?: string;
  observacionesInternas?: string;
  condicionesPago?: string;
  pieFactura?: string;

  // Tags
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean;
  inmutable: boolean;

  // Configuración
  mostrarCostes: boolean;
  mostrarMargenes: boolean;
  mostrarComponentesKit: boolean;
  mostrarPrecios: boolean;

  // Auditoría
  creadoPor?: string | { _id: string; nombre: string; email: string };
  modificadoPor?: string | { _id: string; nombre: string; email: string };
  fechaCreacion: string | Date;
  fechaModificacion?: string | Date;

  // Historial
  historial?: IHistorialFactura[];

  // Log fiscal
  fiscalLogId?: string;

  // Virtuals
  diasVencimiento?: number;
  estaVencida?: boolean;
  estaCobrada?: boolean;
  porcentajeCobrado?: number;
}

// ============================================
// DTOs
// ============================================

export interface CreateFacturaDTO {
  serie?: string;
  serieId?: string;
  tipo?: TipoFactura;
  estado?: EstadoFactura;
  fecha?: string | Date;
  fechaOperacion?: string | Date;
  fechaVencimiento?: string | Date;
  periodoFacturacion?: {
    desde: string | Date;
    hasta: string | Date;
  };
  esRectificativa?: boolean;
  facturaRectificadaId?: string;
  facturaRectificadaCodigo?: string;
  motivoRectificacion?: MotivoRectificacion;
  descripcionRectificacion?: string;
  clienteId: string;
  clienteNombre?: string;
  clienteNif?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccion;
  albaranesOrigen?: string[];
  pedidosOrigen?: string[];
  presupuestosOrigen?: string[];
  proyectoId?: string;
  agenteComercialId?: string;
  referenciaCliente?: string;
  titulo?: string;
  descripcion?: string;
  lineas?: Omit<ILineaFactura, '_id'>[];
  descuentoGlobalPorcentaje?: number;
  vencimientos?: Omit<IVencimiento, '_id'>[];
  regimenIva?: string;
  claveOperacion?: string;
  recargoEquivalencia?: boolean;
  retencionIRPF?: number;
  sistemaFiscal?: SistemaFiscal;
  observaciones?: string;
  observacionesInternas?: string;
  condicionesPago?: string;
  pieFactura?: string;
  tags?: string[];
  condiciones?: {
    formaPagoId?: string;
    terminoPagoId?: string;
  };
  mostrarCostes?: boolean;
  mostrarMargenes?: boolean;
  mostrarComponentesKit?: boolean;
  mostrarPrecios?: boolean;
}

export interface UpdateFacturaDTO extends Partial<CreateFacturaDTO> {}

export interface SearchFacturasParams {
  search?: string;
  clienteId?: string;
  proyectoId?: string;
  agenteComercialId?: string;
  estado?: EstadoFactura;
  estados?: string;
  tipo?: TipoFactura;
  serie?: string;
  activo?: 'true' | 'false' | 'all';
  cobrada?: 'true' | 'false';
  vencida?: 'true' | 'false';
  rectificativa?: 'true' | 'false';
  fechaDesde?: string;
  fechaHasta?: string;
  fechaVencimientoDesde?: string;
  fechaVencimientoHasta?: string;
  importeMin?: string;
  importeMax?: string;
  albaranOrigenId?: string;
  pedidoOrigenId?: string;
  sistemaFiscal?: SistemaFiscal;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CrearDesdeAlbaranesParams {
  albaranesIds: string[];
  agruparPorCliente?: boolean;
  fechaFactura?: string | Date;
  fechaVencimiento?: string | Date;
  serie?: string;
  observaciones?: string;
  metodoPago?: MetodoPago;
}

export interface CrearRectificativaParams {
  facturaOriginalId: string;
  motivoRectificacion: MotivoRectificacion;
  descripcionRectificacion: string;
  serie?: string;
  lineas?: Omit<ILineaFactura, '_id'>[];
  importeRectificar?: number;
}

export interface RegistrarCobroParams {
  fecha: string | Date;
  importe: number;
  metodoPago: MetodoPago;
  referencia?: string;
  cuentaDestino?: string;
  observaciones?: string;
  vencimientoId?: string;
}

export interface EmitirFacturaParams {
  sistemaFiscal?: SistemaFiscal;
  enviarAHacienda?: boolean;
  generarPDF?: boolean;
  enviarPorEmail?: boolean;
  emailDestino?: string;
  // VeriFactu - envío automático a AEAT
  entornoVeriFactu?: 'test' | 'production';
  certificadoId?: string;
}

export interface AnularFacturaParams {
  motivo: string;
  crearRectificativa?: boolean;
  descripcion?: string;
}

export interface CambiarEstadoFacturaParams {
  estado: EstadoFactura;
  observaciones?: string;
}

export interface FacturaEstadisticas {
  total: number;
  porEstado: Record<string, number>;
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  totalVencido: number;
}

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_FACTURA: { value: EstadoFactura; label: string; color: string; dotColor: string }[] = [
  { value: EstadoFactura.BORRADOR, label: 'Borrador', color: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-400' },
  { value: EstadoFactura.EMITIDA, label: 'Emitida', color: 'bg-blue-100 text-blue-800', dotColor: 'bg-blue-500' },
  { value: EstadoFactura.ENVIADA, label: 'Enviada', color: 'bg-indigo-100 text-indigo-800', dotColor: 'bg-indigo-500' },
  { value: EstadoFactura.PARCIALMENTE_COBRADA, label: 'Parcialmente cobrada', color: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-500' },
  { value: EstadoFactura.COBRADA, label: 'Cobrada', color: 'bg-green-100 text-green-800', dotColor: 'bg-green-500' },
  { value: EstadoFactura.VENCIDA, label: 'Vencida', color: 'bg-orange-100 text-orange-800', dotColor: 'bg-orange-500' },
  { value: EstadoFactura.IMPAGADA, label: 'Impagada', color: 'bg-red-100 text-red-800', dotColor: 'bg-red-500' },
  { value: EstadoFactura.RECTIFICADA, label: 'Rectificada', color: 'bg-purple-100 text-purple-800', dotColor: 'bg-purple-500' },
  { value: EstadoFactura.ANULADA, label: 'Anulada', color: 'bg-gray-200 text-gray-600', dotColor: 'bg-gray-500' },
];

export const TIPOS_FACTURA: { value: TipoFactura; label: string }[] = [
  { value: TipoFactura.ORDINARIA, label: 'Ordinaria' },
  { value: TipoFactura.RECTIFICATIVA, label: 'Rectificativa' },
  { value: TipoFactura.SIMPLIFICADA, label: 'Simplificada' },
  { value: TipoFactura.RECAPITULATIVA, label: 'Recapitulativa' },
  { value: TipoFactura.PROFORMA, label: 'Proforma' },
];

export const MOTIVOS_RECTIFICACION: { value: MotivoRectificacion; label: string }[] = [
  { value: MotivoRectificacion.ERROR_EXPEDICION, label: 'Error en expedición' },
  { value: MotivoRectificacion.DEVOLUCION, label: 'Devolución' },
  { value: MotivoRectificacion.DESCUENTO_POST_VENTA, label: 'Descuento post-venta' },
  { value: MotivoRectificacion.BONIFICACION, label: 'Bonificación' },
  { value: MotivoRectificacion.IMPAGO_CONCURSAL, label: 'Impago concursal' },
  { value: MotivoRectificacion.OTROS, label: 'Otros' },
];

export const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: MetodoPago.EFECTIVO, label: 'Efectivo' },
  { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia' },
  { value: MetodoPago.TARJETA, label: 'Tarjeta' },
  { value: MetodoPago.DOMICILIACION, label: 'Domiciliación' },
  { value: MetodoPago.CHEQUE, label: 'Cheque' },
  { value: MetodoPago.PAGARE, label: 'Pagaré' },
  { value: MetodoPago.CONFIRMING, label: 'Confirming' },
  { value: MetodoPago.COMPENSACION, label: 'Compensación' },
];

export const SISTEMAS_FISCALES: { value: SistemaFiscal; label: string; descripcion: string }[] = [
  { value: SistemaFiscal.VERIFACTU, label: 'VeriFactu', descripcion: 'Sistema nacional de verificación de facturas' },
  { value: SistemaFiscal.TICKETBAI, label: 'TicketBAI', descripcion: 'Sistema del País Vasco' },
  { value: SistemaFiscal.SII, label: 'SII', descripcion: 'Suministro Inmediato de Información' },
  { value: SistemaFiscal.NINGUNO, label: 'Ninguno', descripcion: 'Sin sistema fiscal' },
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
  { value: 21, label: '21%', recargoEquivalencia: 5.2 },
  { value: 10, label: '10%', recargoEquivalencia: 1.4 },
  { value: 4, label: '4%', recargoEquivalencia: 0.5 },
  { value: 0, label: '0%', recargoEquivalencia: 0 },
];

// ============================================
// FUNCIONES HELPER
// ============================================

export const getEstadoConfig = (estado: EstadoFactura) => {
  return ESTADOS_FACTURA.find(e => e.value === estado) || ESTADOS_FACTURA[0];
};

export const getTipoFacturaLabel = (tipo: TipoFactura) => {
  return TIPOS_FACTURA.find(t => t.value === tipo)?.label || tipo;
};

export const getMotivoRectificacionLabel = (motivo: MotivoRectificacion) => {
  return MOTIVOS_RECTIFICACION.find(m => m.value === motivo)?.label || motivo;
};

export const getMetodoPagoLabel = (metodo: MetodoPago) => {
  return METODOS_PAGO.find(m => m.value === metodo)?.label || metodo;
};

export const getSistemaFiscalLabel = (sistema: SistemaFiscal) => {
  return SISTEMAS_FISCALES.find(s => s.value === sistema)?.label || sistema;
};

export const getTipoLineaLabel = (tipo: TipoLinea) => {
  return TIPOS_LINEA.find(t => t.value === tipo)?.label || tipo;
};

// Crear una línea vacía
export const crearLineaVacia = (orden: number): Omit<ILineaFactura, '_id'> => ({
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

// Calcular una línea
export const calcularLinea = (linea: Partial<ILineaFactura>, recargoEquivalencia: boolean = false): ILineaFactura => {
  const cantidad = linea.cantidad || 0;
  const precioUnitario = linea.precioUnitario || 0;
  const costeUnitario = linea.costeUnitario || 0;
  const descuento = linea.descuento || 0;
  const iva = linea.iva || 21;

  const subtotalBruto = cantidad * precioUnitario;
  const descuentoImporte = subtotalBruto * (descuento / 100);
  const subtotal = subtotalBruto - descuentoImporte;
  const ivaImporte = subtotal * (iva / 100);

  // Calcular recargo equivalencia si aplica
  let recargoImporte = 0;
  const tipoRecargo = linea.recargoEquivalencia || (recargoEquivalencia ? getRecargoEquivalencia(iva) : 0);
  if (tipoRecargo > 0) {
    recargoImporte = subtotal * (tipoRecargo / 100);
  }

  const total = subtotal + ivaImporte + recargoImporte;

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
    recargoEquivalencia: tipoRecargo,
    recargoImporte: Math.round(recargoImporte * 100) / 100,
    total: Math.round(total * 100) / 100,
    costeTotalLinea: Math.round(costeTotalLinea * 100) / 100,
    margenUnitario: Math.round(margenUnitario * 100) / 100,
    margenPorcentaje: Math.round(margenPorcentaje * 100) / 100,
    margenTotalLinea: Math.round(margenTotalLinea * 100) / 100,
  } as ILineaFactura;
};

// Obtener recargo de equivalencia según IVA
export const getRecargoEquivalencia = (iva: number): number => {
  const tipoIva = TIPOS_IVA.find(t => t.value === iva);
  return tipoIva?.recargoEquivalencia || 0;
};

// Calcular porcentaje cobrado
export const calcularPorcentajeCobrado = (importeCobrado: number, totalFactura: number): number => {
  if (totalFactura === 0) return 0;
  return Math.round((importeCobrado / totalFactura) * 100);
};

// Verificar si la factura está vencida
export const estaVencida = (factura: IFactura): boolean => {
  if (!factura.fechaVencimiento) return false;
  if (factura.estado === EstadoFactura.COBRADA || factura.estado === EstadoFactura.ANULADA) return false;
  return new Date() > new Date(factura.fechaVencimiento);
};

// Calcular días hasta vencimiento
export const diasHastaVencimiento = (fechaVencimiento?: string | Date): number => {
  if (!fechaVencimiento) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);
  const diffTime = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
