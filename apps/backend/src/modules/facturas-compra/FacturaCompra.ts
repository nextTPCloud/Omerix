import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoFacturaCompra {
  BORRADOR = 'borrador',
  PENDIENTE_PAGO = 'pendiente_pago',
  PARCIALMENTE_PAGADA = 'parcialmente_pagada',
  PAGADA = 'pagada',
  VENCIDA = 'vencida',
  ANULADA = 'anulada',
}

export enum TipoLineaFacturaCompra {
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

export interface ILineaFacturaCompra {
  _id?: Types.ObjectId;
  orden: number;
  tipo: TipoLineaFacturaCompra;

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
  total: number;

  // Flags
  esEditable: boolean;
  incluidoEnTotal: boolean;

  // Notas
  notasInternas?: string;

  // Referencias
  lineaAlbaranCompraId?: Types.ObjectId;
}

export interface ITotalesFacturaCompra {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: Array<{
    tipo: number;
    base: number;
    cuota: number;
  }>;
  totalIva: number;
  totalFactura: number;
}

export interface IVencimientoFacturaCompra {
  _id?: Types.ObjectId;
  numero: number;
  fechaVencimiento: Date;
  importe: number;
  importePagado: number;
  importePendiente: number;
  estado: 'pendiente' | 'pagado' | 'parcial' | 'vencido';
  formaPagoId?: Types.ObjectId;
  fechaPago?: Date;
  referenciaPago?: string;
}

export interface IHistorialFacturaCompra {
  fecha: Date;
  usuarioId?: Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

export interface IFacturaCompra extends Document {
  _id: Types.ObjectId;

  // Identificación
  codigo: string;
  serie: string;
  numero: number;

  // Factura del proveedor
  numeroFacturaProveedor: string;
  fechaFacturaProveedor: Date;

  // Estado
  estado: EstadoFacturaCompra;

  // Fechas
  fecha: Date;
  fechaVencimiento?: Date;
  fechaContabilizacion?: Date;

  // Proveedor
  proveedorId: Types.ObjectId;
  proveedorNombre: string;
  proveedorNif: string;
  proveedorEmail?: string;
  proveedorTelefono?: string;
  proveedorDireccion?: string;

  // Documentos origen
  albaranesCompraIds?: Types.ObjectId[];
  pedidosCompraIds?: Types.ObjectId[];

  // Título y descripción
  titulo?: string;
  descripcion?: string;

  // Líneas
  lineas: ILineaFacturaCompra[];

  // Totales
  totales: ITotalesFacturaCompra;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Vencimientos
  vencimientos: IVencimientoFacturaCompra[];

  // Condiciones de pago
  formaPagoId?: Types.ObjectId;
  terminoPagoId?: Types.ObjectId;
  cuentaBancariaId?: Types.ObjectId;

  // Observaciones
  observaciones?: string;
  observacionesInternas?: string;

  // Tags
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean;
  contabilizada: boolean;

  // Documentos adjuntos
  documentos?: Array<{
    nombre: string;
    url: string;
    tipo: string;
    tamaño?: number;
    fechaSubida: Date;
  }>;

  // Historial
  historial: IHistorialFacturaCompra[];

  // Auditoría
  creadoPor?: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Virtuals
  importePagado?: number;
  importePendiente?: number;
  diasVencida?: number;
}

export interface IFacturaCompraModel extends Model<IFacturaCompra> {}

// ============================================
// SCHEMAS ANIDADOS
// ============================================

const LineaFacturaCompraSchema = new Schema({
  orden: { type: Number, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoLineaFacturaCompra),
    default: TipoLineaFacturaCompra.PRODUCTO,
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
  cantidad: { type: Number, default: 1, min: 0 },
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

  // Flags
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },

  // Notas
  notasInternas: { type: String },

  // Referencias
  lineaAlbaranCompraId: { type: Schema.Types.ObjectId },
}, { _id: true });

const TotalesFacturaCompraSchema = new Schema({
  subtotalBruto: { type: Number, default: 0 },
  totalDescuentos: { type: Number, default: 0 },
  subtotalNeto: { type: Number, default: 0 },
  desgloseIva: [{
    tipo: { type: Number },
    base: { type: Number },
    cuota: { type: Number },
  }],
  totalIva: { type: Number, default: 0 },
  totalFactura: { type: Number, default: 0 },
}, { _id: false });

const VencimientoFacturaCompraSchema = new Schema({
  numero: { type: Number, required: true },
  fechaVencimiento: { type: Date, required: true },
  importe: { type: Number, required: true },
  importePagado: { type: Number, default: 0 },
  importePendiente: { type: Number, default: 0 },
  estado: {
    type: String,
    enum: ['pendiente', 'pagado', 'parcial', 'vencido'],
    default: 'pendiente',
  },
  formaPagoId: { type: Schema.Types.ObjectId, ref: 'FormaPago' },
  fechaPago: Date,
  referenciaPago: { type: String, trim: true },
}, { _id: true });

const HistorialFacturaCompraSchema = new Schema({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const FacturaCompraSchema = new Schema<IFacturaCompra, IFacturaCompraModel>({
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
    default: 'FRC',
    trim: true,
    uppercase: true,
  },
  numero: {
    type: Number,
    required: true,
  },

  // Factura del proveedor
  numeroFacturaProveedor: {
    type: String,
    required: [true, 'El número de factura del proveedor es obligatorio'],
    trim: true,
  },
  fechaFacturaProveedor: {
    type: Date,
    required: [true, 'La fecha de factura del proveedor es obligatoria'],
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoFacturaCompra),
    default: EstadoFacturaCompra.BORRADOR,
    index: true,
  },

  // Fechas
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  fechaVencimiento: Date,
  fechaContabilizacion: Date,

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
  proveedorEmail: { type: String, trim: true },
  proveedorTelefono: { type: String, trim: true },
  proveedorDireccion: { type: String, trim: true },

  // Documentos origen
  albaranesCompraIds: [{ type: Schema.Types.ObjectId, ref: 'AlbaranCompra' }],
  pedidosCompraIds: [{ type: Schema.Types.ObjectId, ref: 'PedidoCompra' }],

  // Título
  titulo: { type: String, trim: true },
  descripcion: { type: String },

  // Líneas
  lineas: [LineaFacturaCompraSchema],

  // Totales
  totales: {
    type: TotalesFacturaCompraSchema,
    default: () => ({}),
  },

  // Descuento global
  descuentoGlobalPorcentaje: { type: Number, default: 0, min: 0, max: 100 },
  descuentoGlobalImporte: { type: Number, default: 0 },

  // Vencimientos
  vencimientos: [VencimientoFacturaCompraSchema],

  // Condiciones de pago
  formaPagoId: { type: Schema.Types.ObjectId, ref: 'FormaPago' },
  terminoPagoId: { type: Schema.Types.ObjectId, ref: 'TerminoPago' },
  cuentaBancariaId: { type: Schema.Types.ObjectId },

  // Observaciones
  observaciones: { type: String },
  observacionesInternas: { type: String },

  // Tags
  tags: [{ type: String, lowercase: true, trim: true }],

  // Control
  activo: { type: Boolean, default: true, index: true },
  bloqueado: { type: Boolean, default: false },
  contabilizada: { type: Boolean, default: false },

  // Documentos adjuntos
  documentos: [{
    nombre: { type: String, required: true },
    url: { type: String, required: true },
    tipo: { type: String },
    tamaño: { type: Number },
    fechaSubida: { type: Date, default: Date.now },
  }],

  // Historial
  historial: [HistorialFacturaCompraSchema],

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

FacturaCompraSchema.index({ codigo: 1 }, { unique: true });
FacturaCompraSchema.index({ serie: 1, numero: 1 });
FacturaCompraSchema.index({ proveedorId: 1, fecha: -1 });
FacturaCompraSchema.index({ estado: 1, fecha: -1 });
FacturaCompraSchema.index({ numeroFacturaProveedor: 1, proveedorId: 1 });
FacturaCompraSchema.index({ fechaVencimiento: 1, estado: 1 });
FacturaCompraSchema.index({
  codigo: 'text',
  proveedorNombre: 'text',
  titulo: 'text',
  numeroFacturaProveedor: 'text',
});

// ============================================
// VIRTUALS
// ============================================

FacturaCompraSchema.virtual('importePagado').get(function() {
  if (!this.vencimientos || this.vencimientos.length === 0) return 0;
  return this.vencimientos.reduce((sum, v) => sum + (v.importePagado || 0), 0);
});

FacturaCompraSchema.virtual('importePendiente').get(function() {
  if (!this.vencimientos || this.vencimientos.length === 0) {
    return this.totales?.totalFactura || 0;
  }
  return this.vencimientos.reduce((sum, v) => sum + (v.importePendiente || 0), 0);
});

FacturaCompraSchema.virtual('diasVencida').get(function() {
  if (!this.fechaVencimiento) return null;
  const hoy = new Date();
  const vencimiento = new Date(this.fechaVencimiento);
  const diff = hoy.getTime() - vencimiento.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// ============================================
// MIDDLEWARE
// ============================================

FacturaCompraSchema.pre('save', function(next) {
  // Calcular importes pendientes en vencimientos
  this.vencimientos.forEach(v => {
    v.importePendiente = v.importe - (v.importePagado || 0);
    if (v.importePendiente <= 0) {
      v.estado = 'pagado';
    } else if (v.importePagado > 0) {
      v.estado = 'parcial';
    } else if (new Date(v.fechaVencimiento) < new Date()) {
      v.estado = 'vencido';
    }
  });

  // Actualizar estado de la factura basado en vencimientos
  const todosPagados = this.vencimientos.every(v => v.estado === 'pagado');
  const algunPago = this.vencimientos.some(v => v.importePagado > 0);
  const algunVencido = this.vencimientos.some(v => v.estado === 'vencido');

  if (todosPagados && this.vencimientos.length > 0) {
    this.estado = EstadoFacturaCompra.PAGADA;
  } else if (algunVencido) {
    this.estado = EstadoFacturaCompra.VENCIDA;
  } else if (algunPago) {
    this.estado = EstadoFacturaCompra.PARCIALMENTE_PAGADA;
  }

  next();
});

// ============================================
// CONFIGURACIÓN JSON
// ============================================

FacturaCompraSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

FacturaCompraSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORTAR
// ============================================

export const FacturaCompra = mongoose.model<IFacturaCompra, IFacturaCompraModel>(
  'FacturaCompra',
  FacturaCompraSchema
);

export default FacturaCompra;
