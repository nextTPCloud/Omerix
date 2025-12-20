import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import { databaseManager } from '@/services/database-manager.service';

// ============================================
// INTERFACE FICHAJE
// ============================================

export interface IFichaje extends Document {
  _id: mongoose.Types.ObjectId;
  personalId: mongoose.Types.ObjectId;
  personalNombre?: string;
  personalCodigo?: string;
  departamentoId?: mongoose.Types.ObjectId;
  departamentoNombre?: string;
  turnoId?: mongoose.Types.ObjectId;
  turnoNombre?: string;
  fecha: Date;
  horaEntrada?: Date;
  horaSalida?: Date;
  pausaInicio?: Date;
  pausaFin?: Date;
  horasTrabajadas?: number;
  horasExtra?: number;
  tipo: 'normal' | 'teletrabajo' | 'viaje' | 'formacion';
  estado: 'abierto' | 'cerrado' | 'pendiente' | 'aprobado' | 'rechazado';
  ubicacionEntrada?: {
    latitud: number;
    longitud: number;
    direccion?: string;
  };
  ubicacionSalida?: {
    latitud: number;
    longitud: number;
    direccion?: string;
  };
  ipEntrada?: string;
  ipSalida?: string;
  observaciones?: string;
  incidencia?: string;
  aprobadoPor?: mongoose.Types.ObjectId;
  fechaAprobacion?: Date;
  // Auditoria
  creadoPor?: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion: Date;
}

// ============================================
// SCHEMA FICHAJE
// ============================================

const UbicacionSchema = new Schema({
  latitud: { type: Number },
  longitud: { type: Number },
  direccion: { type: String, trim: true },
}, { _id: false });

const FichajeSchema = new Schema<IFichaje>(
  {
    personalId: {
      type: Schema.Types.ObjectId,
      ref: 'Personal',
      required: [true, 'El personal es requerido'],
    },
    personalNombre: {
      type: String,
      trim: true,
    },
    personalCodigo: {
      type: String,
      trim: true,
    },
    departamentoId: {
      type: Schema.Types.ObjectId,
      ref: 'Departamento',
    },
    departamentoNombre: {
      type: String,
      trim: true,
    },
    turnoId: {
      type: Schema.Types.ObjectId,
      ref: 'Turno',
    },
    turnoNombre: {
      type: String,
      trim: true,
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida'],
    },
    horaEntrada: {
      type: Date,
    },
    horaSalida: {
      type: Date,
    },
    pausaInicio: {
      type: Date,
    },
    pausaFin: {
      type: Date,
    },
    horasTrabajadas: {
      type: Number,
      default: 0,
      min: 0,
    },
    horasExtra: {
      type: Number,
      default: 0,
    },
    tipo: {
      type: String,
      enum: ['normal', 'teletrabajo', 'viaje', 'formacion'],
      default: 'normal',
    },
    estado: {
      type: String,
      enum: ['abierto', 'cerrado', 'pendiente', 'aprobado', 'rechazado'],
      default: 'abierto',
    },
    ubicacionEntrada: UbicacionSchema,
    ubicacionSalida: UbicacionSchema,
    ipEntrada: {
      type: String,
      trim: true,
    },
    ipSalida: {
      type: String,
      trim: true,
    },
    observaciones: {
      type: String,
      trim: true,
    },
    incidencia: {
      type: String,
      trim: true,
    },
    aprobadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaAprobacion: {
      type: Date,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaModificacion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: 'fechaCreacion',
      updatedAt: 'fechaModificacion',
    },
  }
);

// ============================================
// INDICES
// ============================================

FichajeSchema.index({ personalId: 1, fecha: -1 });
FichajeSchema.index({ fecha: -1 });
FichajeSchema.index({ estado: 1 });
FichajeSchema.index({ departamentoId: 1, fecha: -1 });

// ============================================
// METODOS
// ============================================

FichajeSchema.methods.calcularHorasTrabajadas = function() {
  if (!this.horaEntrada || !this.horaSalida) return 0;

  let minutos = (this.horaSalida.getTime() - this.horaEntrada.getTime()) / (1000 * 60);

  // Restar pausa si existe
  if (this.pausaInicio && this.pausaFin) {
    const pausaMinutos = (this.pausaFin.getTime() - this.pausaInicio.getTime()) / (1000 * 60);
    minutos -= pausaMinutos;
  }

  return Math.max(0, minutos / 60);
};

// ============================================
// OBTENER MODELO
// ============================================

const modelCache: Map<string, Model<IFichaje>> = new Map();

export async function getModeloFichaje(
  empresaId: mongoose.Types.ObjectId,
  dbConfig: IDatabaseConfig
): Promise<Model<IFichaje>> {
  const cacheKey = `${empresaId.toString()}_Fichaje`;

  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey)!;
  }

  // Obtener la conexión real usando el databaseManager
  const connection = await databaseManager.getEmpresaConnection(
    empresaId.toString(),
    dbConfig
  );

  if (connection.models['Fichaje']) {
    const model = connection.models['Fichaje'] as Model<IFichaje>;
    modelCache.set(cacheKey, model);
    return model;
  }

  const model = connection.model<IFichaje>('Fichaje', FichajeSchema);
  modelCache.set(cacheKey, model);

  return model;
}

export default FichajeSchema;
