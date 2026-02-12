import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoSyncRestoo {
  RESERVAS = 'reservas',
  DISPONIBILIDAD = 'disponibilidad',
  CLIENTES = 'clientes',
}

export enum DireccionSyncRestoo {
  PULL = 'pull',
  PUSH = 'push',
}

export enum EstadoSyncRestoo {
  EXITO = 'exito',
  ERROR = 'error',
  PARCIAL = 'parcial',
}

// ============================================
// INTERFACES
// ============================================

export interface IRestooConnection extends Document {
  nombre: string;
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
  restauranteIdRestoo: string;
  activa: boolean;
  ultimaSync?: Date;
  configuracion: {
    syncAutomatico: boolean;
    intervaloMinutos: number;
    syncReservas: boolean;
    syncDisponibilidad: boolean;
    syncCancelaciones: boolean;
    syncNoShows: boolean;
    crearClientesSiNoExisten: boolean;
    salonPorDefecto?: mongoose.Types.ObjectId;
  };
  estadisticas: {
    reservasSincronizadas: number;
    ultimoError?: string;
    ultimoErrorFecha?: Date;
  };
  empresaId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestooSyncLog extends Document {
  conexionId: mongoose.Types.ObjectId;
  tipo: TipoSyncRestoo;
  direccion: DireccionSyncRestoo;
  estado: EstadoSyncRestoo;
  fechaInicio: Date;
  fechaFin?: Date;
  resultados: {
    total: number;
    exitosos: number;
    fallidos: number;
    omitidos: number;
  };
  detalles: Array<{
    reservaId?: string;
    accion: string;
    resultado: 'exito' | 'error' | 'omitido';
    mensaje?: string;
  }>;
  empresaId: string;
}

export interface IRestooMapeoSalon extends Document {
  conexionId: mongoose.Types.ObjectId;
  salonIdLocal: mongoose.Types.ObjectId;
  zonaIdRestoo: string;
  nombreRestoo: string;
  mesasMapeo: Array<{
    mesaIdLocal: mongoose.Types.ObjectId;
    mesaIdRestoo: string;
  }>;
  empresaId: string;
}

// ============================================
// SCHEMAS
// ============================================

export const RestooConnectionSchema = new Schema<IRestooConnection>(
  {
    nombre: { type: String, required: true },
    apiUrl: { type: String, required: true },
    apiKey: { type: String, required: true },
    apiSecret: { type: String },
    restauranteIdRestoo: { type: String, required: true },
    activa: { type: Boolean, default: true },
    ultimaSync: { type: Date },
    configuracion: {
      syncAutomatico: { type: Boolean, default: false },
      intervaloMinutos: { type: Number, default: 5 },
      syncReservas: { type: Boolean, default: true },
      syncDisponibilidad: { type: Boolean, default: false },
      syncCancelaciones: { type: Boolean, default: true },
      syncNoShows: { type: Boolean, default: true },
      crearClientesSiNoExisten: { type: Boolean, default: true },
      salonPorDefecto: { type: Schema.Types.ObjectId, ref: 'Salon' },
    },
    estadisticas: {
      reservasSincronizadas: { type: Number, default: 0 },
      ultimoError: { type: String },
      ultimoErrorFecha: { type: Date },
    },
    empresaId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const RestooSyncLogSchema = new Schema<IRestooSyncLog>(
  {
    conexionId: { type: Schema.Types.ObjectId, ref: 'RestooConnection', required: true },
    tipo: { type: String, enum: Object.values(TipoSyncRestoo), required: true },
    direccion: { type: String, enum: Object.values(DireccionSyncRestoo), required: true },
    estado: { type: String, enum: Object.values(EstadoSyncRestoo), required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date },
    resultados: {
      total: { type: Number, default: 0 },
      exitosos: { type: Number, default: 0 },
      fallidos: { type: Number, default: 0 },
      omitidos: { type: Number, default: 0 },
    },
    detalles: [
      {
        reservaId: String,
        accion: String,
        resultado: { type: String, enum: ['exito', 'error', 'omitido'] },
        mensaje: String,
      },
    ],
    empresaId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const RestooMapeoSalonSchema = new Schema<IRestooMapeoSalon>(
  {
    conexionId: { type: Schema.Types.ObjectId, ref: 'RestooConnection', required: true },
    salonIdLocal: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },
    zonaIdRestoo: { type: String, required: true },
    nombreRestoo: { type: String, required: true },
    mesasMapeo: [
      {
        mesaIdLocal: { type: Schema.Types.ObjectId, ref: 'Mesa' },
        mesaIdRestoo: { type: String },
      },
    ],
    empresaId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Indices
RestooConnectionSchema.index({ empresaId: 1 });
RestooSyncLogSchema.index({ conexionId: 1, fechaInicio: -1 });
RestooSyncLogSchema.index({ empresaId: 1, fechaInicio: -1 });
RestooMapeoSalonSchema.index({ conexionId: 1 });
RestooMapeoSalonSchema.index({ empresaId: 1 });

// Modelos por defecto
export const RestooConnection = mongoose.model<IRestooConnection>('RestooConnection', RestooConnectionSchema);
export const RestooSyncLog = mongoose.model<IRestooSyncLog>('RestooSyncLog', RestooSyncLogSchema);
export const RestooMapeoSalon = mongoose.model<IRestooMapeoSalon>('RestooMapeoSalon', RestooMapeoSalonSchema);
