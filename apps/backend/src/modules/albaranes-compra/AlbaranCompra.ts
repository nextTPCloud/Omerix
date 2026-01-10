import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoAlbaranCompra {
  BORRADOR = 'borrador',
  PENDIENTE_RECEPCION = 'pendiente_recepcion',
  RECIBIDO_PARCIAL = 'recibido_parcial',
  RECIBIDO = 'recibido',
  FACTURADO = 'facturado',
  ANULADO = 'anulado',
}

export enum TipoLineaCompra {
  PRODUCTO = 'producto',
  SERVICIO = 'servicio',
  TEXTO = 'texto',
  SUBTOTAL = 'subtotal',
  DESCUENTO = 'descuento',
  KIT = 'kit',
}

// ============================================
// INTERFACES
// ============================================

export interface ILineaAlbaranCompra {
  _id?: Types.ObjectId;
  orden: number;
  tipo: TipoLineaCompra;

  // Producto
  productoId?: Types.ObjectId;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  sku?: string;
  codigoProveedor?: string;

  // Variante
  variante?: {
    varianteId?: Types.ObjectId;
    sku?: string;
    valores?: Record<string, string>;
  };

  // Cantidades
  cantidadPedida: number;
  cantidadRecibida: number;
  cantidadPendiente: number;
  unidad?: string;

  // Peso
  peso?: number; // Peso unitario en kg
  pesoTotal?: number; // Peso total de la línea (peso * cantidadRecibida)

  // Precios
  precioUnitario: number;
  descuento: number;
  descuentoImporte: number;
  subtotal: number;
  iva: number;
  ivaImporte: number;
  total: number;

  // Almacén destino
  almacenDestinoId?: Types.ObjectId;

  // Trazabilidad
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: Date;
  ubicacion?: string;

  // Flags
  esEditable: boolean;
  incluidoEnTotal: boolean;

  // Notas
  notasInternas?: string;
  notasRecepcion?: string;

  // Referencia a línea de pedido de compra
  lineaPedidoCompraId?: Types.ObjectId;
}

export interface ITotalesAlbaranCompra {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: Array<{
    tipo: number;
    base: number;
    cuota: number;
  }>;
  totalIva: number;
  totalAlbaran: number;
}

export interface IHistorialAlbaranCompra {
  fecha: Date;
  usuarioId?: Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

export interface IAlbaranCompra extends Document {
  _id: Types.ObjectId;

  // Identificación
  codigo: string;
  serie: string;
  numero: number;

  // Estado
  estado: EstadoAlbaranCompra;

  // Fechas
  fecha: Date;
  fechaRecepcion?: Date;
  fechaPrevistaRecepcion?: Date;

  // Proveedor
  proveedorId: Types.ObjectId;
  proveedorNombre: string;
  proveedorNif: string;
  proveedorEmail?: string;
  proveedorTelefono?: string;

  // Documentos origen
  pedidoCompraId?: Types.ObjectId;

  // Datos del transporte
  datosTransporte?: {
    transportista?: string;
    matricula?: string;
    conductor?: string;
    numeroBultos?: number;
    pesoTotal?: number;
    numeroSeguimiento?: string;
  };

  // Almacén de recepción
  almacenId: Types.ObjectId;

  // Referencias
  referenciaProveedor?: string;
  numeroAlbaranProveedor?: string;

  // Título y descripción
  titulo?: string;
  descripcion?: string;

  // Líneas
  lineas: ILineaAlbaranCompra[];

  // Totales
  totales: ITotalesAlbaranCompra;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Observaciones
  observaciones?: string;
  observacionesInternas?: string;

  // Tags
  tags?: string[];

  // Facturación
  facturado: boolean;
  facturaId?: Types.ObjectId;

  // Control
  activo: boolean;
  bloqueado: boolean;

  // Documentos adjuntos
  documentos?: Array<{
    nombre: string;
    url: string;
    tipo: string;
    tamaño?: number;
    fechaSubida: Date;
  }>;

  // Historial
  historial: IHistorialAlbaranCompra[];

  // Auditoría
  creadoPor?: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Virtuals
  porcentajeRecibido?: number;
  estaCompleto?: boolean;
}

export interface IAlbaranCompraModel extends Model<IAlbaranCompra> {}

// ============================================
// SCHEMAS ANIDADOS
// ============================================

const LineaAlbaranCompraSchema = new Schema({
  orden: { type: Number, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoLineaCompra),
    default: TipoLineaCompra.PRODUCTO,
  },

  // Producto
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  codigo: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  sku: { type: String, trim: true },
  codigoProveedor: { type: String, trim: true },

  // Variante
  variante: {
    varianteId: { type: Schema.Types.ObjectId },
    sku: { type: String, trim: true },
    valores: { type: Schema.Types.Mixed },
  },

  // Cantidades
  cantidadPedida: { type: Number, default: 0, min: 0 },
  cantidadRecibida: { type: Number, default: 0, min: 0 },
  cantidadPendiente: { type: Number, default: 0, min: 0 },
  unidad: { type: String, default: 'unidades' },

  // Peso
  peso: { type: Number, min: 0, default: 0 },
  pesoTotal: { type: Number, min: 0, default: 0 },

  // Precios
  precioUnitario: { type: Number, required: true, min: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  descuentoImporte: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  iva: { type: Number, default: 21 },
  ivaImporte: { type: Number, default: 0 },
  total: { type: Number, default: 0 },

  // Almacén destino
  almacenDestinoId: { type: Schema.Types.ObjectId, ref: 'Almacen' },

  // Trazabilidad
  lote: { type: String, trim: true },
  numeroSerie: { type: String, trim: true },
  fechaCaducidad: Date,
  ubicacion: { type: String, trim: true },

  // Flags
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },

  // Notas
  notasInternas: { type: String },
  notasRecepcion: { type: String },

  // Referencia
  lineaPedidoCompraId: { type: Schema.Types.ObjectId },
}, { _id: true });

const TotalesAlbaranCompraSchema = new Schema({
  subtotalBruto: { type: Number, default: 0 },
  totalDescuentos: { type: Number, default: 0 },
  subtotalNeto: { type: Number, default: 0 },
  desgloseIva: [{
    tipo: { type: Number },
    base: { type: Number },
    cuota: { type: Number },
  }],
  totalIva: { type: Number, default: 0 },
  totalAlbaran: { type: Number, default: 0 },
}, { _id: false });

const HistorialAlbaranCompraSchema = new Schema({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const AlbaranCompraSchema = new Schema<IAlbaranCompra, IAlbaranCompraModel>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },

  // Identificación
  codigo: {
    type: String,
    required: [true, 'El código es obligatorio'],
    trim: true,
    uppercase: true,
  },
  serie: {
    type: String,
    required: true,
    default: 'ALC',
    trim: true,
    uppercase: true,
  },
  numero: {
    type: Number,
    required: true,
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoAlbaranCompra),
    default: EstadoAlbaranCompra.BORRADOR,
    index: true,
  },

  // Fechas
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  fechaRecepcion: Date,
  fechaPrevistaRecepcion: Date,

  // Proveedor
  proveedorId: {
    type: Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: [true, 'El proveedor es obligatorio'],
    index: true,
  },
  proveedorNombre: {
    type: String,
    required: true,
    trim: true,
  },
  proveedorNif: {
    type: String,
    trim: true,
  },
  proveedorEmail: {
    type: String,
    trim: true,
  },
  proveedorTelefono: {
    type: String,
    trim: true,
  },

  // Documentos origen
  pedidoCompraId: {
    type: Schema.Types.ObjectId,
    ref: 'PedidoCompra',
    index: true,
  },

  // Datos del transporte
  datosTransporte: {
    transportista: { type: String, trim: true },
    matricula: { type: String, trim: true },
    conductor: { type: String, trim: true },
    numeroBultos: { type: Number, min: 0 },
    pesoTotal: { type: Number, min: 0 },
    numeroSeguimiento: { type: String, trim: true },
  },

  // Almacén
  almacenId: {
    type: Schema.Types.ObjectId,
    ref: 'Almacen',
    required: [true, 'El almacén es obligatorio'],
    index: true,
  },

  // Referencias
  referenciaProveedor: { type: String, trim: true },
  numeroAlbaranProveedor: { type: String, trim: true },

  // Título
  titulo: { type: String, trim: true },
  descripcion: { type: String },

  // Líneas
  lineas: [LineaAlbaranCompraSchema],

  // Totales
  totales: {
    type: TotalesAlbaranCompraSchema,
    default: () => ({}),
  },

  // Descuento global
  descuentoGlobalPorcentaje: { type: Number, default: 0, min: 0, max: 100 },
  descuentoGlobalImporte: { type: Number, default: 0 },

  // Observaciones
  observaciones: { type: String },
  observacionesInternas: { type: String },

  // Tags
  tags: [{ type: String, lowercase: true, trim: true }],

  // Facturación
  facturado: { type: Boolean, default: false },
  facturaId: { type: Schema.Types.ObjectId, ref: 'FacturaCompra' },

  // Control
  activo: { type: Boolean, default: true, index: true },
  bloqueado: { type: Boolean, default: false },

  // Documentos adjuntos
  documentos: [{
    nombre: { type: String, required: true },
    url: { type: String, required: true },
    tipo: { type: String },
    tamaño: { type: Number },
    fechaSubida: { type: Date, default: Date.now },
  }],

  // Historial
  historial: [HistorialAlbaranCompraSchema],

  // Auditoría
  creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  modificadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: Date,
}, {
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaModificacion' },
});

// ============================================
// ÍNDICES
// ============================================

AlbaranCompraSchema.index({ codigo: 1 }, { unique: true });
AlbaranCompraSchema.index({ serie: 1, numero: 1 });
AlbaranCompraSchema.index({ proveedorId: 1, fecha: -1 });
AlbaranCompraSchema.index({ estado: 1, fecha: -1 });
AlbaranCompraSchema.index({ facturado: 1 });
AlbaranCompraSchema.index({
  codigo: 'text',
  proveedorNombre: 'text',
  titulo: 'text',
  referenciaProveedor: 'text',
  numeroAlbaranProveedor: 'text',
});

// ============================================
// VIRTUALS
// ============================================

AlbaranCompraSchema.virtual('porcentajeRecibido').get(function() {
  if (!this.lineas || this.lineas.length === 0) return 0;

  const lineasProducto = this.lineas.filter(l =>
    l.tipo === TipoLineaCompra.PRODUCTO && l.incluidoEnTotal
  );
  if (lineasProducto.length === 0) return 100;

  const totalPedido = lineasProducto.reduce((sum, l) => sum + l.cantidadPedida, 0);
  const totalRecibido = lineasProducto.reduce((sum, l) => sum + l.cantidadRecibida, 0);

  if (totalPedido === 0) return 0;
  return Math.round((totalRecibido / totalPedido) * 100);
});

AlbaranCompraSchema.virtual('estaCompleto').get(function() {
  if (!this.lineas || this.lineas.length === 0) return true;

  return this.lineas
    .filter(l => l.tipo === TipoLineaCompra.PRODUCTO && l.incluidoEnTotal)
    .every(l => l.cantidadRecibida >= l.cantidadPedida);
});

// ============================================
// CONFIGURACIÓN JSON
// ============================================

AlbaranCompraSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

AlbaranCompraSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORTAR
// ============================================

export const AlbaranCompra = mongoose.model<IAlbaranCompra, IAlbaranCompraModel>(
  'AlbaranCompra',
  AlbaranCompraSchema
);

export default AlbaranCompra;
