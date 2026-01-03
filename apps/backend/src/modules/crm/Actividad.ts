import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoActividad {
  LLAMADA = 'llamada',
  EMAIL = 'email',
  REUNION = 'reunion',
  VISITA = 'visita',
  TAREA = 'tarea',
  NOTA = 'nota',
  WHATSAPP = 'whatsapp',
}

export enum ResultadoActividad {
  COMPLETADA = 'completada',
  NO_CONTESTA = 'no_contesta',
  REPROGRAMADA = 'reprogramada',
  CANCELADA = 'cancelada',
}

// ============================================
// INTERFACES
// ============================================

export interface IActividad extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId?: mongoose.Types.ObjectId;

  // Relaciones (al menos una requerida)
  leadId?: mongoose.Types.ObjectId;
  oportunidadId?: mongoose.Types.ObjectId;
  clienteId?: mongoose.Types.ObjectId;

  // Datos
  tipo: TipoActividad;
  asunto: string;
  descripcion?: string;

  // Planificación
  fechaProgramada?: Date;
  duracionMinutos?: number;

  // Resultado
  fechaRealizacion?: Date;
  resultado?: ResultadoActividad;
  notasResultado?: string;

  // Seguimiento
  asignadoA?: mongoose.Types.ObjectId;
  recordatorio?: Date;
  completada: boolean;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const ActividadSchema = new Schema<IActividad>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa' },

    // Relaciones
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    oportunidadId: { type: Schema.Types.ObjectId, ref: 'Oportunidad' },
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },

    // Datos
    tipo: {
      type: String,
      enum: Object.values(TipoActividad),
      required: true,
    },
    asunto: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },

    // Planificación
    fechaProgramada: { type: Date },
    duracionMinutos: { type: Number, min: 0 },

    // Resultado
    fechaRealizacion: { type: Date },
    resultado: {
      type: String,
      enum: Object.values(ResultadoActividad),
    },
    notasResultado: { type: String, trim: true },

    // Seguimiento
    asignadoA: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    recordatorio: { type: Date },
    completada: { type: Boolean, default: false },

    // Auditoría
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  {
    timestamps: true,
    collection: 'actividades_crm',
  }
);

// ============================================
// ÍNDICES
// ============================================

ActividadSchema.index({ empresaId: 1 });
ActividadSchema.index({ leadId: 1 });
ActividadSchema.index({ oportunidadId: 1 });
ActividadSchema.index({ clienteId: 1 });
ActividadSchema.index({ tipo: 1 });
ActividadSchema.index({ completada: 1 });
ActividadSchema.index({ asignadoA: 1 });
ActividadSchema.index({ fechaProgramada: 1 });
ActividadSchema.index({ recordatorio: 1 });
ActividadSchema.index({ createdAt: -1 });

// ============================================
// MODELO
// ============================================

export const Actividad: Model<IActividad> =
  mongoose.models.Actividad || mongoose.model<IActividad>('Actividad', ActividadSchema);

export default Actividad;
