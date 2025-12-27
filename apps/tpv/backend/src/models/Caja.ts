// ===========================================
// MODELO CAJA TPV
// ===========================================

import mongoose, { Schema, Document } from 'mongoose';
import { EstadoSync } from './Venta';

// Enums
export enum EstadoCaja {
  ABIERTA = 'abierta',
  CERRADA = 'cerrada',
}

export enum TipoMovimientoCaja {
  APERTURA = 'apertura',
  CIERRE = 'cierre',
  VENTA = 'venta',
  DEVOLUCION = 'devolucion',
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  COBRO_FACTURA = 'cobro_factura',
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  BIZUM = 'bizum',
}

// Interfaces
export interface IMovimientoCaja {
  tipo: TipoMovimientoCaja;
  importe: number;
  descripcion?: string;
  ventaId?: mongoose.Types.ObjectId;
  facturaId?: mongoose.Types.ObjectId;
  metodoPago?: MetodoPago;
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  usuarioNombre: string;
}

export interface IArqueoCaja {
  efectivo: number;
  tarjeta: number;
  otros: number;
  total: number;
}

export interface IAperturaCaja {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  usuarioNombre: string;
  importeInicial: number;
}

export interface ICierreCaja {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  usuarioNombre: string;
  arqueoTeorico: IArqueoCaja;
  arqueoReal: IArqueoCaja;
  diferencia: number;
  observaciones?: string;
}

export interface ICaja extends Document {
  empresaId: mongoose.Types.ObjectId;
  localId: string;
  codigo: string;
  nombre: string;
  almacenId: mongoose.Types.ObjectId;
  almacenNombre: string;
  estado: EstadoCaja;
  apertura?: IAperturaCaja;
  cierre?: ICierreCaja;
  movimientos: IMovimientoCaja[];
  totalEfectivo: number;
  totalTarjeta: number;
  totalOtros: number;
  totalVentas: number;
  numeroVentas: number;
  syncEstado: EstadoSync;
  syncFecha?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schemas
const MovimientoCajaSchema = new Schema<IMovimientoCaja>(
  {
    tipo: { type: String, enum: Object.values(TipoMovimientoCaja), required: true },
    importe: { type: Number, required: true },
    descripcion: { type: String },
    ventaId: { type: Schema.Types.ObjectId },
    facturaId: { type: Schema.Types.ObjectId },
    metodoPago: { type: String, enum: Object.values(MetodoPago) },
    fecha: { type: Date, default: Date.now },
    usuarioId: { type: Schema.Types.ObjectId, required: true },
    usuarioNombre: { type: String, required: true },
  },
  { _id: true }
);

const ArqueoSchema = new Schema<IArqueoCaja>(
  {
    efectivo: { type: Number, required: true },
    tarjeta: { type: Number, required: true },
    otros: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const AperturaSchema = new Schema<IAperturaCaja>(
  {
    fecha: { type: Date, required: true },
    usuarioId: { type: Schema.Types.ObjectId, required: true },
    usuarioNombre: { type: String, required: true },
    importeInicial: { type: Number, required: true },
  },
  { _id: false }
);

const CierreSchema = new Schema<ICierreCaja>(
  {
    fecha: { type: Date, required: true },
    usuarioId: { type: Schema.Types.ObjectId, required: true },
    usuarioNombre: { type: String, required: true },
    arqueoTeorico: ArqueoSchema,
    arqueoReal: ArqueoSchema,
    diferencia: { type: Number, required: true },
    observaciones: { type: String },
  },
  { _id: false }
);

const CajaSchema = new Schema<ICaja>(
  {
    empresaId: { type: Schema.Types.ObjectId, required: true, index: true },
    localId: { type: String, required: true, unique: true },
    codigo: { type: String, required: true },
    nombre: { type: String, required: true },
    almacenId: { type: Schema.Types.ObjectId, required: true },
    almacenNombre: { type: String, required: true },
    estado: { type: String, enum: Object.values(EstadoCaja), default: EstadoCaja.CERRADA },
    apertura: AperturaSchema,
    cierre: CierreSchema,
    movimientos: [MovimientoCajaSchema],
    totalEfectivo: { type: Number, default: 0 },
    totalTarjeta: { type: Number, default: 0 },
    totalOtros: { type: Number, default: 0 },
    totalVentas: { type: Number, default: 0 },
    numeroVentas: { type: Number, default: 0 },
    syncEstado: { type: String, enum: ['pendiente', 'sincronizado', 'error'], default: 'pendiente' },
    syncFecha: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Índices
CajaSchema.index({ empresaId: 1, codigo: 1 });
CajaSchema.index({ estado: 1 });

export const Caja = mongoose.model<ICaja>('Caja', CajaSchema);
