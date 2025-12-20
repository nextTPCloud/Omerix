import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import { databaseManager } from '@/services/database-manager.service';

// ============================================
// INTERFACES
// ============================================

export interface IFestivo {
  _id?: mongoose.Types.ObjectId;
  fecha: Date;
  nombre: string;
  tipo: 'nacional' | 'autonomico' | 'local' | 'empresa';
  sustituible: boolean;
}

export interface ICalendarioLaboral extends Document {
  _id: mongoose.Types.ObjectId;
  anio: number;
  nombre: string;
  region?: string;
  provincia?: string;
  localidad?: string;
  esDefecto: boolean;
  festivos: IFestivo[];
  activo: boolean;
  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion: Date;
}

// ============================================
// SCHEMA DE FESTIVO
// ============================================

const FestivoSchema = new Schema<IFestivo>(
  {
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida'],
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['nacional', 'autonomico', 'local', 'empresa'],
      default: 'nacional',
    },
    sustituible: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// ============================================
// SCHEMA DE CALENDARIO
// ============================================

const CalendarioLaboralSchema = new Schema<ICalendarioLaboral>(
  {
    anio: {
      type: Number,
      required: [true, 'El año es requerido'],
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    provincia: {
      type: String,
      trim: true,
    },
    localidad: {
      type: String,
      trim: true,
    },
    esDefecto: {
      type: Boolean,
      default: false,
    },
    festivos: [FestivoSchema],
    activo: {
      type: Boolean,
      default: true,
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
// ÍNDICES
// ============================================

CalendarioLaboralSchema.index({ anio: 1, region: 1 });
CalendarioLaboralSchema.index({ esDefecto: 1 });
CalendarioLaboralSchema.index({ activo: 1 });

// ============================================
// FESTIVOS NACIONALES ESPAÑA 2025
// ============================================

export const FESTIVOS_NACIONALES_2025: IFestivo[] = [
  { fecha: new Date('2025-01-01'), nombre: 'Año Nuevo', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-01-06'), nombre: 'Epifanía del Señor', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-04-18'), nombre: 'Viernes Santo', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-05-01'), nombre: 'Fiesta del Trabajo', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-08-15'), nombre: 'Asunción de la Virgen', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-10-12'), nombre: 'Fiesta Nacional de España', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-11-01'), nombre: 'Todos los Santos', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-12-06'), nombre: 'Día de la Constitución', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-12-08'), nombre: 'Inmaculada Concepción', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2025-12-25'), nombre: 'Navidad', tipo: 'nacional', sustituible: false },
];

export const FESTIVOS_NACIONALES_2026: IFestivo[] = [
  { fecha: new Date('2026-01-01'), nombre: 'Año Nuevo', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-01-06'), nombre: 'Epifanía del Señor', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-04-03'), nombre: 'Viernes Santo', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-05-01'), nombre: 'Fiesta del Trabajo', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-08-15'), nombre: 'Asunción de la Virgen', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-10-12'), nombre: 'Fiesta Nacional de España', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-11-01'), nombre: 'Todos los Santos', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-12-06'), nombre: 'Día de la Constitución', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-12-08'), nombre: 'Inmaculada Concepción', tipo: 'nacional', sustituible: false },
  { fecha: new Date('2026-12-25'), nombre: 'Navidad', tipo: 'nacional', sustituible: false },
];

// ============================================
// OBTENER MODELO
// ============================================

const modelCache: Map<string, Model<ICalendarioLaboral>> = new Map();

export async function getModeloCalendarioLaboral(
  empresaId: mongoose.Types.ObjectId,
  dbConfig: IDatabaseConfig
): Promise<Model<ICalendarioLaboral>> {
  const cacheKey = `${empresaId.toString()}_CalendarioLaboral`;

  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey)!;
  }

  // Obtener la conexión real usando el databaseManager
  const connection = await databaseManager.getEmpresaConnection(
    empresaId.toString(),
    dbConfig
  );

  if (connection.models['CalendarioLaboral']) {
    const model = connection.models['CalendarioLaboral'] as Model<ICalendarioLaboral>;
    modelCache.set(cacheKey, model);
    return model;
  }

  const model = connection.model<ICalendarioLaboral>('CalendarioLaboral', CalendarioLaboralSchema);
  modelCache.set(cacheKey, model);

  return model;
}

export default CalendarioLaboralSchema;
