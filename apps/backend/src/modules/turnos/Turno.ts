import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import { databaseManager } from '@/services/database-manager.service';

// ============================================
// INTERFACE TURNO
// ============================================

export interface ITurno extends Document {
  _id: mongoose.Types.ObjectId;
  codigo: string;
  nombre: string;
  descripcion?: string;
  horaEntrada: string; // "08:00"
  horaSalida: string; // "17:00"
  pausaInicio?: string; // "13:00"
  pausaFin?: string; // "14:00"
  duracionPausaMinutos: number;
  horasTeoricas: number;
  diasSemana: number[]; // [1,2,3,4,5] = Lunes a Viernes
  color?: string;
  activo: boolean;
  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion: Date;
}

// ============================================
// INTERFACE HORARIO PERSONAL
// ============================================

export interface IHorarioPersonal extends Document {
  _id: mongoose.Types.ObjectId;
  personalId: mongoose.Types.ObjectId;
  personalNombre?: string;
  turnoId: mongoose.Types.ObjectId;
  turnoNombre?: string;
  fechaInicio: Date;
  fechaFin?: Date; // null = indefinido
  observaciones?: string;
  activo: boolean;
  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion: Date;
}

// ============================================
// SCHEMA TURNO
// ============================================

const TurnoSchema = new Schema<ITurno>(
  {
    codigo: {
      type: String,
      required: [true, 'El código es requerido'],
      trim: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    horaEntrada: {
      type: String,
      required: [true, 'La hora de entrada es requerida'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'],
    },
    horaSalida: {
      type: String,
      required: [true, 'La hora de salida es requerida'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'],
    },
    pausaInicio: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'],
    },
    pausaFin: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'],
    },
    duracionPausaMinutos: {
      type: Number,
      default: 0,
      min: 0,
      max: 240,
    },
    horasTeoricas: {
      type: Number,
      required: [true, 'Las horas teóricas son requeridas'],
      min: 0,
      max: 24,
    },
    diasSemana: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Lunes a Viernes
      validate: {
        validator: function (v: number[]) {
          return v.every((d) => d >= 0 && d <= 6);
        },
        message: 'Los días deben estar entre 0 (Domingo) y 6 (Sábado)',
      },
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
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
// SCHEMA HORARIO PERSONAL
// ============================================

const HorarioPersonalSchema = new Schema<IHorarioPersonal>(
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
    turnoId: {
      type: Schema.Types.ObjectId,
      ref: 'Turno',
      required: [true, 'El turno es requerido'],
    },
    turnoNombre: {
      type: String,
      trim: true,
    },
    fechaInicio: {
      type: Date,
      required: [true, 'La fecha de inicio es requerida'],
    },
    fechaFin: {
      type: Date,
    },
    observaciones: {
      type: String,
      trim: true,
    },
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

TurnoSchema.index({ codigo: 1 }, { unique: true });
TurnoSchema.index({ activo: 1 });

HorarioPersonalSchema.index({ personalId: 1, fechaInicio: -1 });
HorarioPersonalSchema.index({ turnoId: 1 });
HorarioPersonalSchema.index({ activo: 1 });

// ============================================
// TURNOS PREDEFINIDOS
// ============================================

export const TURNOS_PREDEFINIDOS = [
  {
    codigo: 'MANANA',
    nombre: 'Turno Mañana',
    horaEntrada: '08:00',
    horaSalida: '15:00',
    horasTeoricas: 7,
    diasSemana: [1, 2, 3, 4, 5],
    color: '#10B981',
  },
  {
    codigo: 'TARDE',
    nombre: 'Turno Tarde',
    horaEntrada: '15:00',
    horaSalida: '22:00',
    horasTeoricas: 7,
    diasSemana: [1, 2, 3, 4, 5],
    color: '#F59E0B',
  },
  {
    codigo: 'PARTIDO',
    nombre: 'Turno Partido',
    horaEntrada: '09:00',
    horaSalida: '18:00',
    pausaInicio: '14:00',
    pausaFin: '15:00',
    duracionPausaMinutos: 60,
    horasTeoricas: 8,
    diasSemana: [1, 2, 3, 4, 5],
    color: '#3B82F6',
  },
  {
    codigo: 'INTENSIVO',
    nombre: 'Jornada Intensiva',
    horaEntrada: '07:00',
    horaSalida: '14:00',
    horasTeoricas: 7,
    diasSemana: [1, 2, 3, 4, 5],
    color: '#8B5CF6',
  },
];

// ============================================
// OBTENER MODELOS
// ============================================

const turnoModelCache: Map<string, Model<ITurno>> = new Map();
const horarioModelCache: Map<string, Model<IHorarioPersonal>> = new Map();

export async function getModeloTurno(
  empresaId: mongoose.Types.ObjectId,
  dbConfig: IDatabaseConfig
): Promise<Model<ITurno>> {
  const cacheKey = `${empresaId.toString()}_Turno`;

  if (turnoModelCache.has(cacheKey)) {
    return turnoModelCache.get(cacheKey)!;
  }

  // Obtener la conexión real usando el databaseManager
  const connection = await databaseManager.getEmpresaConnection(
    empresaId.toString(),
    dbConfig
  );

  if (connection.models['Turno']) {
    const model = connection.models['Turno'] as Model<ITurno>;
    turnoModelCache.set(cacheKey, model);
    return model;
  }

  const model = connection.model<ITurno>('Turno', TurnoSchema);
  turnoModelCache.set(cacheKey, model);

  return model;
}

export async function getModeloHorarioPersonal(
  empresaId: mongoose.Types.ObjectId,
  dbConfig: IDatabaseConfig
): Promise<Model<IHorarioPersonal>> {
  const cacheKey = `${empresaId.toString()}_HorarioPersonal`;

  if (horarioModelCache.has(cacheKey)) {
    return horarioModelCache.get(cacheKey)!;
  }

  // Obtener la conexión real usando el databaseManager
  const connection = await databaseManager.getEmpresaConnection(
    empresaId.toString(),
    dbConfig
  );

  if (connection.models['HorarioPersonal']) {
    const model = connection.models['HorarioPersonal'] as Model<IHorarioPersonal>;
    horarioModelCache.set(cacheKey, model);
    return model;
  }

  const model = connection.model<IHorarioPersonal>('HorarioPersonal', HorarioPersonalSchema);
  horarioModelCache.set(cacheKey, model);

  return model;
}

export { TurnoSchema, HorarioPersonalSchema };
