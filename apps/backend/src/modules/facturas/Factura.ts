import mongoose, { Schema, Document, Model } from 'mongoose';

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
  SIMPLIFICADA = 'simplificada', // Ticket
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
// INTERFACES
// ============================================

export interface IComponenteKit {
  productoId: mongoose.Types.ObjectId;
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

export interface ILineaFactura {
  _id?: mongoose.Types.ObjectId;
  orden: number;
  tipo: TipoLinea;

  // Producto/Servicio
  productoId?: mongoose.Types.ObjectId;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  descripcionLarga?: string;
  sku?: string;

  // Variante
  variante?: IVarianteSeleccionada;

  // Cantidades
  cantidad: number;
  unidad?: string;

  // Peso
  peso?: number; // Peso unitario en kg
  pesoTotal?: number; // Peso total de la línea (peso * cantidad)

  // Precios
  precioUnitario: number;
  descuento: number;
  descuentoImporte: number;
  subtotal: number;
  iva: number;
  ivaImporte: number;
  recargoEquivalencia?: number;
  recargoImporte?: number;
  total: number;

  // Costes
  costeUnitario: number;
  costeTotalLinea: number;

  // Márgenes
  margenUnitario: number;
  margenPorcentaje: number;
  margenTotalLinea: number;

  // Kit
  componentesKit?: IComponenteKit[];
  mostrarComponentes: boolean;

  // Flags
  esEditable: boolean;
  incluidoEnTotal: boolean;

  // Referencias a documentos origen
  albaranLineaId?: mongoose.Types.ObjectId;
  pedidoLineaId?: mongoose.Types.ObjectId;
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
  numero: number;
  fecha: Date;
  importe: number;
  metodoPago: MetodoPago;
  cobrado: boolean;
  fechaCobro?: Date;
  referenciaPago?: string;
  observaciones?: string;
}

export interface ICobro {
  fecha: Date;
  importe: number;
  metodoPago: MetodoPago;
  referencia?: string;
  cuentaDestino?: string;
  observaciones?: string;
  registradoPor: mongoose.Types.ObjectId;
  fechaRegistro: Date;
}

// Interfaces para normativa fiscal
export interface IVeriFactu {
  idFactura: string;
  hash: string;
  hashAnterior?: string;
  fechaExpedicion: Date;
  fechaEnvio?: Date;
  estadoEnvio: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado';
  codigoRespuesta?: string;
  mensajeRespuesta?: string;
  urlQR: string;
  datosQR: string;
  xml?: string;
  huella?: string;
}

export interface ITicketBAI {
  tbaiId: string;
  firma: string;
  qr: string;
  urlQR: string;
  fechaExpedicion: Date;
  fechaEnvio?: Date;
  estadoEnvio: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado';
  codigoRespuesta?: string;
  mensajeRespuesta?: string;
  xml?: string;
}

export interface ISII {
  idPeticion: string;
  fechaEnvio?: Date;
  estadoEnvio: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado' | 'aceptado_con_errores';
  codigoRespuesta?: string;
  mensajeRespuesta?: string;
  csv?: string;
}

export interface IDocumentoFactura {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
  visibleCliente: boolean;
}

export interface IHistorialFactura {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: Record<string, unknown>;
}

// Historial de acciones de factura electrónica
export interface IHistorialFacturaElectronica {
  fecha: Date;
  accion: 'generada' | 'firmada' | 'enviada' | 'consultada' | 'rechazada' | 'anulada';
  detalle?: string;
  usuarioId: mongoose.Types.ObjectId;
}

// Datos de factura electrónica (FacturaE/FACE)
export interface IFacturaElectronica {
  // Generación
  generada: boolean;
  fechaGeneracion?: Date;
  xmlGenerado?: string;              // Nombre del archivo o referencia

  // Firma
  firmada: boolean;
  fechaFirma?: Date;
  xmlFirmado?: string;               // Nombre del archivo firmado
  certificadoId?: mongoose.Types.ObjectId;

  // Estado FACE
  enviadaFACE: boolean;
  fechaEnvio?: Date;
  numeroRegistroFACE?: string;       // Número de registro en FACE
  estadoFACE?: string;               // Código de estado (1200, 1300, etc.)
  ultimaConsulta?: Date;

  // Historial de acciones
  historial: IHistorialFacturaElectronica[];
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface IFactura extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificación
  codigo: string;
  serie: string;
  numero: number;

  // Tipo de factura
  tipo: TipoFactura;

  // Estado
  estado: EstadoFactura;

  // Fechas
  fecha: Date;
  fechaOperacion?: Date;
  fechaVencimiento?: Date;
  fechaEnvio?: Date;
  periodoFacturacion?: {
    desde: Date;
    hasta: Date;
  };

  // Rectificativa
  esRectificativa: boolean;
  facturaRectificadaId?: mongoose.Types.ObjectId;
  facturaRectificadaCodigo?: string;
  motivoRectificacion?: MotivoRectificacion;
  descripcionRectificacion?: string;

  // Cliente
  clienteId: mongoose.Types.ObjectId;
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccion;

  // Orígenes
  albaranesOrigen?: mongoose.Types.ObjectId[];
  pedidosOrigen?: mongoose.Types.ObjectId[];
  presupuestosOrigen?: mongoose.Types.ObjectId[];

  // Proyecto
  proyectoId?: mongoose.Types.ObjectId;

  // Agente comercial
  agenteComercialId?: mongoose.Types.ObjectId;

  // Referencias
  referenciaCliente?: string;

  // Título y descripción
  titulo?: string;
  descripcion?: string;

  // Líneas
  lineas: ILineaFactura[];

  // Totales
  totales: ITotalesFactura;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Vencimientos y cobros
  vencimientos: IVencimiento[];
  cobros: ICobro[];
  importeCobrado: number;
  importePendiente: number;

  // Datos fiscales adicionales
  regimenIva: string;
  claveOperacion?: string;
  recargoEquivalencia: boolean;
  retencionIRPF?: number;
  importeRetencion?: number;

  // Normativa fiscal
  sistemaFiscal: SistemaFiscal;
  verifactu?: IVeriFactu;
  ticketbai?: ITicketBAI;
  sii?: ISII;

  // Factura electrónica (FacturaE/FACE)
  facturaElectronica?: IFacturaElectronica;

  // Código QR y verificación
  codigoQR?: string;
  urlVerificacion?: string;

  // Textos
  observaciones?: string;
  observacionesInternas?: string;
  condicionesPago?: string;
  pieFactura?: string;

  // Documentos
  documentos: IDocumentoFactura[];

  // Historial
  historial: IHistorialFactura[];

  // Tags
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean;
  inmutable: boolean;

  // Configuración de visualización
  mostrarCostes: boolean;
  mostrarMargenes: boolean;
  mostrarComponentesKit: boolean;
  mostrarPrecios: boolean;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Log fiscal asociado
  fiscalLogId?: mongoose.Types.ObjectId;

  // Virtuals
  diasVencimiento: number;
  estaVencida: boolean;
  estaCobrada: boolean;
  porcentajeCobrado: number;
}

export interface IFacturaModel extends Model<IFactura> {
  generarCodigo(serie?: string): Promise<{ codigo: string; serie: string; numero: number }>;
  obtenerEstadisticas(): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalFacturado: number;
    totalCobrado: number;
    totalPendiente: number;
    totalVencido: number;
  }>;
  obtenerUltimaFactura(empresaId?: string): Promise<IFactura | null>;
}

// ============================================
// SCHEMAS
// ============================================

const ComponenteKitSchema = new Schema<IComponenteKit>({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  nombre: { type: String, required: true, trim: true },
  sku: { type: String, trim: true },
  cantidad: { type: Number, required: true, min: 0 },
  precioUnitario: { type: Number, required: true, min: 0 },
  costeUnitario: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  iva: { type: Number, required: true, default: 21 },
  subtotal: { type: Number, required: true, min: 0 },
  opcional: { type: Boolean, default: false },
  seleccionado: { type: Boolean, default: true },
}, { _id: false });

const VarianteSeleccionadaSchema = new Schema<IVarianteSeleccionada>({
  varianteId: { type: String },
  sku: { type: String, required: true },
  combinacion: { type: Map, of: String, required: true },
  precioAdicional: { type: Number, default: 0 },
  costeAdicional: { type: Number, default: 0 },
}, { _id: false });

const LineaFacturaSchema = new Schema<ILineaFactura>({
  orden: { type: Number, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoLinea),
    default: TipoLinea.PRODUCTO,
  },

  // Producto
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  codigo: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  descripcionLarga: { type: String, trim: true },
  sku: { type: String, trim: true },

  // Variante
  variante: { type: VarianteSeleccionadaSchema },

  // Cantidades
  cantidad: { type: Number, required: true, min: 0, default: 1 },
  unidad: { type: String, trim: true, default: 'ud' },

  // Peso
  peso: { type: Number, min: 0, default: 0 },
  pesoTotal: { type: Number, min: 0, default: 0 },

  // Precios
  precioUnitario: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  descuentoImporte: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0, default: 0 },
  iva: { type: Number, required: true, default: 21 },
  ivaImporte: { type: Number, default: 0, min: 0 },
  recargoEquivalencia: { type: Number, min: 0 },
  recargoImporte: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0, default: 0 },

  // Costes
  costeUnitario: { type: Number, default: 0, min: 0 },
  costeTotalLinea: { type: Number, default: 0, min: 0 },

  // Márgenes
  margenUnitario: { type: Number, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
  margenTotalLinea: { type: Number, default: 0 },

  // Kit
  componentesKit: { type: [ComponenteKitSchema], default: [] },
  mostrarComponentes: { type: Boolean, default: true },

  // Flags
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },

  // Referencias a documentos origen
  albaranLineaId: { type: Schema.Types.ObjectId },
  pedidoLineaId: { type: Schema.Types.ObjectId },
}, { _id: true });

const DireccionSchema = new Schema<IDireccion>({
  nombre: { type: String, trim: true },
  calle: { type: String, trim: true },
  numero: { type: String, trim: true },
  piso: { type: String, trim: true },
  codigoPostal: { type: String, trim: true },
  ciudad: { type: String, trim: true },
  provincia: { type: String, trim: true },
  pais: { type: String, trim: true, default: 'España' },
}, { _id: false });

const DesgloseIvaSchema = new Schema<IDesgloseIva>({
  tipo: { type: Number, required: true },
  base: { type: Number, required: true },
  cuota: { type: Number, required: true },
  recargo: { type: Number },
  cuotaRecargo: { type: Number },
}, { _id: false });

const TotalesFacturaSchema = new Schema<ITotalesFactura>({
  subtotalBruto: { type: Number, default: 0, min: 0 },
  totalDescuentos: { type: Number, default: 0, min: 0 },
  subtotalNeto: { type: Number, default: 0, min: 0 },
  desgloseIva: { type: [DesgloseIvaSchema], default: [] },
  totalIva: { type: Number, default: 0, min: 0 },
  totalRecargoEquivalencia: { type: Number, default: 0, min: 0 },
  totalFactura: { type: Number, default: 0, min: 0 },
  costeTotalMateriales: { type: Number, default: 0, min: 0 },
  costeTotalServicios: { type: Number, default: 0, min: 0 },
  costeTotalKits: { type: Number, default: 0, min: 0 },
  costeTotal: { type: Number, default: 0, min: 0 },
  margenBruto: { type: Number, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
}, { _id: false });

const VencimientoSchema = new Schema<IVencimiento>({
  numero: { type: Number, required: true },
  fecha: { type: Date, required: true },
  importe: { type: Number, required: true, min: 0 },
  metodoPago: {
    type: String,
    enum: Object.values(MetodoPago),
    default: MetodoPago.TRANSFERENCIA,
  },
  cobrado: { type: Boolean, default: false },
  fechaCobro: { type: Date },
  referenciaPago: { type: String, trim: true },
  observaciones: { type: String },
}, { _id: true });

const CobroSchema = new Schema<ICobro>({
  fecha: { type: Date, required: true },
  importe: { type: Number, required: true, min: 0 },
  metodoPago: {
    type: String,
    enum: Object.values(MetodoPago),
    required: true,
  },
  referencia: { type: String, trim: true },
  cuentaDestino: { type: String, trim: true },
  observaciones: { type: String },
  registradoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaRegistro: { type: Date, default: Date.now },
}, { _id: true });

const VeriFactuSchema = new Schema<IVeriFactu>({
  idFactura: { type: String, required: true, index: true },
  hash: { type: String, required: true },
  hashAnterior: { type: String },
  fechaExpedicion: { type: Date, required: true },
  fechaEnvio: { type: Date },
  estadoEnvio: {
    type: String,
    enum: ['pendiente', 'enviado', 'aceptado', 'rechazado'],
    default: 'pendiente',
  },
  codigoRespuesta: { type: String },
  mensajeRespuesta: { type: String },
  urlQR: { type: String, required: true },
  datosQR: { type: String, required: true },
  xml: { type: String },
  huella: { type: String },
}, { _id: false });

const TicketBAISchema = new Schema<ITicketBAI>({
  tbaiId: { type: String, required: true, index: true },
  firma: { type: String, required: true },
  qr: { type: String, required: true },
  urlQR: { type: String, required: true },
  fechaExpedicion: { type: Date, required: true },
  fechaEnvio: { type: Date },
  estadoEnvio: {
    type: String,
    enum: ['pendiente', 'enviado', 'aceptado', 'rechazado'],
    default: 'pendiente',
  },
  codigoRespuesta: { type: String },
  mensajeRespuesta: { type: String },
  xml: { type: String },
}, { _id: false });

const SIISchema = new Schema<ISII>({
  idPeticion: { type: String, required: true, index: true },
  fechaEnvio: { type: Date },
  estadoEnvio: {
    type: String,
    enum: ['pendiente', 'enviado', 'aceptado', 'rechazado', 'aceptado_con_errores'],
    default: 'pendiente',
  },
  codigoRespuesta: { type: String },
  mensajeRespuesta: { type: String },
  csv: { type: String },
}, { _id: false });

// Schema para historial de factura electrónica
const HistorialFacturaElectronicaSchema = new Schema<IHistorialFacturaElectronica>({
  fecha: { type: Date, default: Date.now },
  accion: {
    type: String,
    enum: ['generada', 'firmada', 'enviada', 'consultada', 'rechazada', 'anulada'],
    required: true,
  },
  detalle: { type: String },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { _id: true });

// Schema para factura electrónica (FacturaE/FACE)
const FacturaElectronicaSchema = new Schema<IFacturaElectronica>({
  // Generación
  generada: { type: Boolean, default: false },
  fechaGeneracion: { type: Date },
  xmlGenerado: { type: String },

  // Firma
  firmada: { type: Boolean, default: false },
  fechaFirma: { type: Date },
  xmlFirmado: { type: String },
  certificadoId: { type: Schema.Types.ObjectId, ref: 'Certificado' },

  // Estado FACE
  enviadaFACE: { type: Boolean, default: false },
  fechaEnvio: { type: Date },
  numeroRegistroFACE: { type: String, index: true },
  estadoFACE: { type: String },
  ultimaConsulta: { type: Date },

  // Historial
  historial: { type: [HistorialFacturaElectronicaSchema], default: [] },
}, { _id: false });

const DocumentoFacturaSchema = new Schema<IDocumentoFactura>({
  nombre: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  visibleCliente: { type: Boolean, default: true },
}, { _id: true });

const HistorialFacturaSchema = new Schema<IHistorialFactura>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const FacturaSchema = new Schema<IFactura, IFacturaModel>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },

  // Identificación
  codigo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  serie: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    default: 'FAC',
  },
  numero: {
    type: Number,
    required: true,
  },

  // Tipo
  tipo: {
    type: String,
    enum: Object.values(TipoFactura),
    default: TipoFactura.ORDINARIA,
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoFactura),
    default: EstadoFactura.BORRADOR,
  },

  // Fechas
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
  },
  fechaOperacion: { type: Date },
  fechaVencimiento: { type: Date },
  fechaEnvio: { type: Date },
  periodoFacturacion: {
    desde: { type: Date },
    hasta: { type: Date },
  },

  // Rectificativa
  esRectificativa: {
    type: Boolean,
    default: false,
  },
  facturaRectificadaId: {
    type: Schema.Types.ObjectId,
    ref: 'Factura',
  },
  facturaRectificadaCodigo: { type: String, trim: true },
  motivoRectificacion: {
    type: String,
    enum: Object.values(MotivoRectificacion),
  },
  descripcionRectificacion: { type: String },

  // Cliente
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El cliente es obligatorio'],
  },
  clienteNombre: {
    type: String,
    required: true,
    trim: true,
  },
  clienteNif: {
    type: String,
    required: true,
    trim: true,
  },
  clienteEmail: { type: String, trim: true },
  clienteTelefono: { type: String, trim: true },
  direccionFacturacion: { type: DireccionSchema },

  // Orígenes
  albaranesOrigen: [{
    type: Schema.Types.ObjectId,
    ref: 'Albaran',
  }],
  pedidosOrigen: [{
    type: Schema.Types.ObjectId,
    ref: 'Pedido',
  }],
  presupuestosOrigen: [{
    type: Schema.Types.ObjectId,
    ref: 'Presupuesto',
  }],

  // Proyecto
  proyectoId: {
    type: Schema.Types.ObjectId,
    ref: 'Proyecto',
  },

  // Agente comercial
  agenteComercialId: {
    type: Schema.Types.ObjectId,
    ref: 'AgenteComercial',
  },

  // Referencias
  referenciaCliente: { type: String, trim: true },

  // Título y descripción
  titulo: { type: String, trim: true },
  descripcion: { type: String },

  // Líneas
  lineas: {
    type: [LineaFacturaSchema],
    default: [],
  },

  // Totales
  totales: {
    type: TotalesFacturaSchema,
    default: () => ({}),
  },

  // Descuento global
  descuentoGlobalPorcentaje: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  descuentoGlobalImporte: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Vencimientos y cobros
  vencimientos: {
    type: [VencimientoSchema],
    default: [],
  },
  cobros: {
    type: [CobroSchema],
    default: [],
  },
  importeCobrado: {
    type: Number,
    default: 0,
    min: 0,
  },
  importePendiente: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Datos fiscales adicionales
  regimenIva: {
    type: String,
    trim: true,
    default: 'general',
  },
  claveOperacion: { type: String, trim: true },
  recargoEquivalencia: {
    type: Boolean,
    default: false,
  },
  retencionIRPF: {
    type: Number,
    min: 0,
    max: 100,
  },
  importeRetencion: {
    type: Number,
    min: 0,
    default: 0,
  },

  // Normativa fiscal
  sistemaFiscal: {
    type: String,
    enum: Object.values(SistemaFiscal),
    default: SistemaFiscal.VERIFACTU,
  },
  verifactu: { type: VeriFactuSchema },
  ticketbai: { type: TicketBAISchema },
  sii: { type: SIISchema },

  // Factura electrónica (FacturaE/FACE)
  facturaElectronica: { type: FacturaElectronicaSchema },

  // Código QR y verificación
  codigoQR: { type: String },
  urlVerificacion: { type: String },

  // Textos
  observaciones: { type: String },
  observacionesInternas: { type: String },
  condicionesPago: { type: String },
  pieFactura: { type: String },

  // Documentos
  documentos: {
    type: [DocumentoFacturaSchema],
    default: [],
  },

  // Historial
  historial: {
    type: [HistorialFacturaSchema],
    default: [],
  },

  // Tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // Control
  activo: {
    type: Boolean,
    default: true,
  },
  bloqueado: {
    type: Boolean,
    default: false,
  },
  inmutable: {
    type: Boolean,
    default: false,
  },

  // Configuración de visualización
  mostrarCostes: {
    type: Boolean,
    default: true,
  },
  mostrarMargenes: {
    type: Boolean,
    default: true,
  },
  mostrarComponentesKit: {
    type: Boolean,
    default: true,
  },
  mostrarPrecios: {
    type: Boolean,
    default: true,
  },

  // Auditoría
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  modificadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  fechaModificacion: {
    type: Date,
  },

  // Log fiscal asociado
  fiscalLogId: {
    type: Schema.Types.ObjectId,
    ref: 'FiscalLog',
  },
}, {
  timestamps: false,
  collection: 'facturas',
});

// ============================================
// ÍNDICES
// ============================================

FacturaSchema.index({ serie: 1, numero: 1 });
FacturaSchema.index({ clienteId: 1 });
FacturaSchema.index({ proyectoId: 1 });
FacturaSchema.index({ agenteComercialId: 1 });
FacturaSchema.index({ estado: 1 });
FacturaSchema.index({ tipo: 1 });
FacturaSchema.index({ fecha: -1 });
FacturaSchema.index({ fechaVencimiento: 1 });
FacturaSchema.index({ activo: 1 });
FacturaSchema.index({ tags: 1 });
FacturaSchema.index({ 'totales.totalFactura': 1 });
FacturaSchema.index({ albaranesOrigen: 1 });
FacturaSchema.index({ pedidosOrigen: 1 });
FacturaSchema.index({ facturaRectificadaId: 1 });
FacturaSchema.index({ fiscalLogId: 1 });
FacturaSchema.index({ sistemaFiscal: 1 });
FacturaSchema.index({ 'verifactu.idFactura': 1 });
FacturaSchema.index({ 'ticketbai.tbaiId': 1 });
FacturaSchema.index({ inmutable: 1 });
FacturaSchema.index({ importePendiente: 1 });
FacturaSchema.index({ 'facturaElectronica.enviadaFACE': 1 });
FacturaSchema.index({ 'facturaElectronica.estadoFACE': 1 });

// ============================================
// VIRTUALS
// ============================================

FacturaSchema.virtual('diasVencimiento').get(function(this: IFactura) {
  if (!this.fechaVencimiento) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(this.fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);
  const diffTime = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

FacturaSchema.virtual('estaVencida').get(function(this: IFactura) {
  if (!this.fechaVencimiento) return false;
  if (this.estado === EstadoFactura.COBRADA || this.estado === EstadoFactura.ANULADA) return false;
  return new Date() > new Date(this.fechaVencimiento);
});

FacturaSchema.virtual('estaCobrada').get(function(this: IFactura) {
  return this.estado === EstadoFactura.COBRADA || this.importePendiente <= 0;
});

FacturaSchema.virtual('porcentajeCobrado').get(function(this: IFactura) {
  if (!this.totales?.totalFactura || this.totales.totalFactura === 0) return 0;
  return Math.round((this.importeCobrado / this.totales.totalFactura) * 100);
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

FacturaSchema.statics.generarCodigo = async function(serie: string = 'FAC'): Promise<{ codigo: string; serie: string; numero: number }> {
  const año = new Date().getFullYear();

  const ultimaFactura = await this.findOne({
    serie,
    codigo: new RegExp(`^${serie}${año}-\\d+$`),
  }).sort({ numero: -1 }).lean();

  let numero = 1;
  if (ultimaFactura && ultimaFactura.numero) {
    numero = ultimaFactura.numero + 1;
  }

  const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

  return { codigo, serie, numero };
};

FacturaSchema.statics.obtenerEstadisticas = async function() {
  const [
    total,
    porEstado,
    totales,
  ] = await Promise.all([
    this.countDocuments(),
    this.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: { activo: true, estado: { $ne: EstadoFactura.ANULADA } } },
      {
        $group: {
          _id: null,
          totalFacturado: { $sum: '$totales.totalFactura' },
          totalCobrado: { $sum: '$importeCobrado' },
          totalPendiente: { $sum: '$importePendiente' },
        },
      },
    ]),
  ]);

  // Calcular facturas vencidas
  const vencidas = await this.countDocuments({
    activo: true,
    estado: { $nin: [EstadoFactura.COBRADA, EstadoFactura.ANULADA] },
    fechaVencimiento: { $lt: new Date() },
    importePendiente: { $gt: 0 },
  });

  const estadisticasPorEstado: Record<string, number> = {};
  porEstado.forEach((item: { _id: string; count: number }) => {
    estadisticasPorEstado[item._id] = item.count;
  });

  return {
    total,
    porEstado: estadisticasPorEstado,
    totalFacturado: totales[0]?.totalFacturado || 0,
    totalCobrado: totales[0]?.totalCobrado || 0,
    totalPendiente: totales[0]?.totalPendiente || 0,
    totalVencido: vencidas,
  };
};

FacturaSchema.statics.obtenerUltimaFactura = async function(empresaId?: string) {
  const query: Record<string, unknown> = { inmutable: true };
  return this.findOne(query).sort({ fechaCreacion: -1 }).lean();
};

// ============================================
// MIDDLEWARE
// ============================================

FacturaSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const FacturaModel = this.constructor as IFacturaModel;
      const { codigo, serie, numero } = await FacturaModel.generarCodigo(this.serie);
      this.codigo = codigo;
      this.serie = serie;
      this.numero = numero;
    }
  }

  // Calcular importes de cobro
  this.importeCobrado = this.cobros.reduce((sum, c) => sum + c.importe, 0);
  this.importePendiente = Math.max(0, (this.totales?.totalFactura || 0) - this.importeCobrado);

  // Actualizar estado según cobros
  if (this.importeCobrado > 0 && this.importePendiente <= 0) {
    this.estado = EstadoFactura.COBRADA;
  } else if (this.importeCobrado > 0 && this.importePendiente > 0) {
    this.estado = EstadoFactura.PARCIALMENTE_COBRADA;
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  next();
});

// PROTECCIÓN: Una vez emitida y con datos fiscales, no se puede modificar
FacturaSchema.pre('findOneAndUpdate', async function(next) {
  const docToUpdate = await this.model.findOne(this.getFilter()).lean();

  if (docToUpdate && docToUpdate.inmutable) {
    const error = new Error(
      '🚨 PROHIBIDO: Esta factura es INMUTABLE y no puede modificarse (cumplimiento ley anti-fraude)'
    );
    return next(error);
  }

  next();
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================

FacturaSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret, options) => {
    delete (ret as Record<string, unknown>).__v;

    // Si se solicita ocultar costes
    if (options.hideCosts || !ret.mostrarCostes) {
      if (ret.lineas) {
        ret.lineas = ret.lineas.map((linea: Record<string, unknown>) => {
          const { costeUnitario, costeTotalLinea, margenUnitario, margenPorcentaje, margenTotalLinea, ...lineaSinCostes } = linea;
          return lineaSinCostes;
        });
      }

      if (ret.totales) {
        const { costeTotalMateriales, costeTotalServicios, costeTotalKits, costeTotal, margenBruto, margenPorcentaje, ...totalesSinCostes } = ret.totales;
        ret.totales = totalesSinCostes;
      }
    }

    // Si se solicita ocultar precios
    if (options.hidePrices || !ret.mostrarPrecios) {
      if (ret.lineas) {
        ret.lineas = ret.lineas.map((linea: Record<string, unknown>) => {
          const { precioUnitario, descuento, descuentoImporte, subtotal, ivaImporte, total, ...lineaSinPrecios } = linea;
          return lineaSinPrecios;
        });
      }
      if (ret.totales) {
        ret.totales = {};
      }
    }

    return ret;
  },
});

FacturaSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const Factura = mongoose.model<IFactura, IFacturaModel>('Factura', FacturaSchema);

export default Factura;
