import mongoose, { Schema, Document } from 'mongoose';

export interface ITPVRegistrado extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;

  // Identificacion
  codigo: string;              // "TPV-001" (auto-generado)
  nombre: string;              // "Caja Principal"
  deviceId: string;            // UUID unico generado en activacion

  // Autenticacion
  secretHash: string;          // Hash del tpvSecret
  tokenVersion: number;        // Para invalidar tokens (se incrementa al revocar)

  // Configuracion asignada
  almacenId: mongoose.Types.ObjectId;
  serieFactura: string;        // Serie para facturas simplificadas

  config: {
    permitirDescuentos: boolean;
    descuentoMaximo: number;
    permitirPrecioManual: boolean;
    modoOfflinePermitido: boolean;
    diasCacheProductos: number;
    impresoraTicket?: {
      tipo: 'usb' | 'red' | 'bluetooth' | 'serial';
      conexion: string;
      anchoTicket: 58 | 80;
    };
    impresoraCocina?: {
      tipo: 'usb' | 'red' | 'bluetooth' | 'serial';
      conexion: string;
      anchoTicket: 58 | 80;
    };
  };

  // Estado y monitoreo
  estado: 'activo' | 'suspendido' | 'desactivado';
  ultimoAcceso?: Date;
  ultimaIP?: string;
  ultimaSync?: Date;
  versionApp?: string;

  // Desactivacion
  desactivadoPor?: mongoose.Types.ObjectId;
  motivoDesactivacion?: string;
  fechaDesactivacion?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const TPVRegistradoSchema = new Schema<ITPVRegistrado>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    codigo: {
      type: String,
      required: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    secretHash: {
      type: String,
      required: true,
    },
    tokenVersion: {
      type: Number,
      default: 1,
    },
    almacenId: {
      type: Schema.Types.ObjectId,
      ref: 'Almacen',
      required: true,
    },
    serieFactura: {
      type: String,
      default: 'FS', // Factura Simplificada
    },
    config: {
      permitirDescuentos: { type: Boolean, default: true },
      descuentoMaximo: { type: Number, default: 100 },
      permitirPrecioManual: { type: Boolean, default: false },
      modoOfflinePermitido: { type: Boolean, default: true },
      diasCacheProductos: { type: Number, default: 7 },
      impresoraTicket: {
        tipo: { type: String, enum: ['usb', 'red', 'bluetooth', 'serial'] },
        conexion: String,
        anchoTicket: { type: Number, enum: [58, 80] },
      },
      impresoraCocina: {
        tipo: { type: String, enum: ['usb', 'red', 'bluetooth', 'serial'] },
        conexion: String,
        anchoTicket: { type: Number, enum: [58, 80] },
      },
    },
    estado: {
      type: String,
      enum: ['activo', 'suspendido', 'desactivado'],
      default: 'activo',
    },
    ultimoAcceso: Date,
    ultimaIP: String,
    ultimaSync: Date,
    versionApp: String,
    desactivadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    motivoDesactivacion: String,
    fechaDesactivacion: Date,
  },
  {
    timestamps: true,
  }
);

// Indices
TPVRegistradoSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });
TPVRegistradoSchema.index({ estado: 1 });

export default mongoose.model<ITPVRegistrado>('TPVRegistrado', TPVRegistradoSchema);
