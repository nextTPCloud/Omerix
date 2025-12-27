// ===========================================
// MODELO VENTA TPV
// ===========================================

import mongoose, { Schema, Document } from 'mongoose';

// Enums
export enum EstadoVenta {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada',
  PARCIAL = 'parcial',
  ANULADA = 'anulada',
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  BIZUM = 'bizum',
  MIXTO = 'mixto',
}

export enum EstadoSync {
  PENDIENTE = 'pendiente',
  SINCRONIZADO = 'sincronizado',
  ERROR = 'error',
}

// Interfaces
export interface ILineaVenta {
  productoId: mongoose.Types.ObjectId;
  varianteId?: mongoose.Types.ObjectId;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tipoIva: number;
  importeIva: number;
  subtotal: number;
  total: number;
}

export interface IPago {
  metodo: MetodoPago;
  importe: number;
  referencia?: string;
  fecha: Date;
}

export interface IVeriFactu {
  hash: string;
  hashAnterior?: string;
  fechaGeneracion: Date;
  xml?: string;
  enviado: boolean;
  fechaEnvio?: Date;
  respuesta?: string;
}

export interface IVenta extends Document {
  empresaId: mongoose.Types.ObjectId;
  localId: string;
  numero: string;
  serie: string;
  cajaId: mongoose.Types.ObjectId;
  cajaNombre: string;
  clienteId?: mongoose.Types.ObjectId;
  clienteNombre?: string;
  clienteNif?: string;
  almacenId: mongoose.Types.ObjectId;
  almacenNombre: string;
  lineas: ILineaVenta[];
  baseImponible: number;
  totalIva: number;
  totalDescuento: number;
  total: number;
  pagos: IPago[];
  totalPagado: number;
  cambio: number;
  estado: EstadoVenta;
  verifactu?: IVeriFactu;
  syncEstado: EstadoSync;
  syncFecha?: Date;
  syncError?: string;
  vendedorId: mongoose.Types.ObjectId;
  vendedorNombre: string;
  ticketImpreso: boolean;
  facturaId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema
const LineaVentaSchema = new Schema<ILineaVenta>(
  {
    productoId: { type: Schema.Types.ObjectId, required: true },
    varianteId: { type: Schema.Types.ObjectId },
    codigo: { type: String, required: true },
    nombre: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 0 },
    precioUnitario: { type: Number, required: true },
    descuento: { type: Number, default: 0 },
    tipoIva: { type: Number, required: true },
    importeIva: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: true }
);

const PagoSchema = new Schema<IPago>(
  {
    metodo: { type: String, enum: Object.values(MetodoPago), required: true },
    importe: { type: Number, required: true },
    referencia: { type: String },
    fecha: { type: Date, default: Date.now },
  },
  { _id: true }
);

const VeriFactuSchema = new Schema<IVeriFactu>(
  {
    hash: { type: String, required: true },
    hashAnterior: { type: String },
    fechaGeneracion: { type: Date, required: true },
    xml: { type: String },
    enviado: { type: Boolean, default: false },
    fechaEnvio: { type: Date },
    respuesta: { type: String },
  },
  { _id: false }
);

const VentaSchema = new Schema<IVenta>(
  {
    empresaId: { type: Schema.Types.ObjectId, required: true, index: true },
    localId: { type: String, required: true, unique: true },
    numero: { type: String, required: true },
    serie: { type: String, required: true },
    cajaId: { type: Schema.Types.ObjectId, required: true },
    cajaNombre: { type: String, required: true },
    clienteId: { type: Schema.Types.ObjectId },
    clienteNombre: { type: String },
    clienteNif: { type: String },
    almacenId: { type: Schema.Types.ObjectId, required: true },
    almacenNombre: { type: String, required: true },
    lineas: [LineaVentaSchema],
    baseImponible: { type: Number, required: true },
    totalIva: { type: Number, required: true },
    totalDescuento: { type: Number, default: 0 },
    total: { type: Number, required: true },
    pagos: [PagoSchema],
    totalPagado: { type: Number, required: true },
    cambio: { type: Number, default: 0 },
    estado: { type: String, enum: Object.values(EstadoVenta), default: EstadoVenta.PENDIENTE },
    verifactu: VeriFactuSchema,
    syncEstado: { type: String, enum: Object.values(EstadoSync), default: EstadoSync.PENDIENTE },
    syncFecha: { type: Date },
    syncError: { type: String },
    vendedorId: { type: Schema.Types.ObjectId, required: true },
    vendedorNombre: { type: String, required: true },
    ticketImpreso: { type: Boolean, default: false },
    facturaId: { type: Schema.Types.ObjectId },
  },
  {
    timestamps: true,
  }
);

// Índices
VentaSchema.index({ empresaId: 1, numero: 1 });
VentaSchema.index({ empresaId: 1, createdAt: -1 });
VentaSchema.index({ syncEstado: 1 });

export const Venta = mongoose.model<IVenta>('Venta', VentaSchema);
