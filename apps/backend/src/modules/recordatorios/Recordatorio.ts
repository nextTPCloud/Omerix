// apps/backend/src/modules/recordatorios/Recordatorio.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoRecordatorio {
  // CRM
  ACTIVIDAD_CRM = 'actividad_crm',
  SEGUIMIENTO_LEAD = 'seguimiento_lead',
  OPORTUNIDAD_CIERRE = 'oportunidad_cierre',

  // Ventas
  PRESUPUESTO_EXPIRACION = 'presupuesto_expiracion',
  PRESUPUESTO_SEGUIMIENTO = 'presupuesto_seguimiento',
  FACTURA_VENCIMIENTO = 'factura_vencimiento',
  COBRO_PENDIENTE = 'cobro_pendiente',

  // Proyectos/Partes
  PARTE_TRABAJO = 'parte_trabajo',
  TAREA_PROYECTO = 'tarea_proyecto',

  // Genéricos
  CITA = 'cita',
  REUNION = 'reunion',
  LLAMADA = 'llamada',
  PERSONALIZADO = 'personalizado',
}

export enum PrioridadRecordatorio {
  BAJA = 'baja',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum EstadoRecordatorio {
  PENDIENTE = 'pendiente',
  ENVIADO = 'enviado',
  LEIDO = 'leido',
  COMPLETADO = 'completado',
  DESCARTADO = 'descartado',
  POSPUESTO = 'pospuesto',
}

export enum CanalNotificacion {
  APP = 'app',          // Notificación in-app
  EMAIL = 'email',      // Email
  PUSH = 'push',        // Push notification
}

// ============================================
// INTERFACES
// ============================================

export interface IRecordatorio extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;

  // Tipo y categoría
  tipo: TipoRecordatorio;
  prioridad: PrioridadRecordatorio;

  // Contenido
  titulo: string;
  mensaje: string;
  icono?: string;
  color?: string;

  // Relación con entidad (opcional)
  entidadTipo?: 'lead' | 'oportunidad' | 'cliente' | 'presupuesto' | 'factura' | 'parte_trabajo' | 'tarea' | 'actividad_crm';
  entidadId?: mongoose.Types.ObjectId;
  entidadNombre?: string;

  // Programación
  fechaProgramada: Date;
  fechaEnvio?: Date;

  // Estado
  estado: EstadoRecordatorio;
  fechaLeido?: Date;
  fechaCompletado?: Date;

  // Repetición
  repetir: boolean;
  frecuenciaRepeticion?: 'diario' | 'semanal' | 'mensual' | 'anual';
  finRepeticion?: Date;

  // Notificaciones
  canales: CanalNotificacion[];
  notificacionesEnviadas: {
    canal: CanalNotificacion;
    fecha: Date;
    exito: boolean;
    error?: string;
  }[];

  // Asignación
  usuarioId: mongoose.Types.ObjectId;
  creadoPor: mongoose.Types.ObjectId;

  // Metadata
  metadata?: Record<string, any>;

  // Auditoría
  createdAt: Date;
  updatedAt: Date;
}

export interface IAlertaConfig extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  usuarioId: mongoose.Types.ObjectId;

  // Configuración de alertas automáticas
  alertasActivas: {
    tipo: TipoRecordatorio;
    activo: boolean;
    canales: CanalNotificacion[];
    diasAnticipacion?: number;
    horaEnvio?: string; // "09:00"
  }[];

  // Horario de no molestar
  noMolestar: {
    activo: boolean;
    horaInicio?: string;
    horaFin?: string;
    diasSemana?: number[]; // 0-6 (domingo-sábado)
  };

  // Preferencias email
  emailDigest: {
    activo: boolean;
    frecuencia: 'diario' | 'semanal';
    hora?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const RecordatorioSchema = new Schema<IRecordatorio>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },

    // Tipo
    tipo: {
      type: String,
      enum: Object.values(TipoRecordatorio),
      required: true,
    },
    prioridad: {
      type: String,
      enum: Object.values(PrioridadRecordatorio),
      default: PrioridadRecordatorio.NORMAL,
    },

    // Contenido
    titulo: { type: String, required: true, trim: true, maxlength: 200 },
    mensaje: { type: String, required: true, trim: true, maxlength: 1000 },
    icono: { type: String },
    color: { type: String },

    // Relación con entidad
    entidadTipo: {
      type: String,
      enum: ['lead', 'oportunidad', 'cliente', 'presupuesto', 'factura', 'parte_trabajo', 'tarea', 'actividad_crm'],
    },
    entidadId: { type: Schema.Types.ObjectId },
    entidadNombre: { type: String },

    // Programación
    fechaProgramada: { type: Date, required: true },
    fechaEnvio: { type: Date },

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoRecordatorio),
      default: EstadoRecordatorio.PENDIENTE,
    },
    fechaLeido: { type: Date },
    fechaCompletado: { type: Date },

    // Repetición
    repetir: { type: Boolean, default: false },
    frecuenciaRepeticion: {
      type: String,
      enum: ['diario', 'semanal', 'mensual', 'anual'],
    },
    finRepeticion: { type: Date },

    // Canales
    canales: [{
      type: String,
      enum: Object.values(CanalNotificacion),
    }],
    notificacionesEnviadas: [{
      canal: { type: String, enum: Object.values(CanalNotificacion) },
      fecha: { type: Date },
      exito: { type: Boolean },
      error: { type: String },
    }],

    // Asignación
    usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },

    // Metadata
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'recordatorios',
  }
);

const AlertaConfigSchema = new Schema<IAlertaConfig>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
    usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },

    alertasActivas: [{
      tipo: { type: String, enum: Object.values(TipoRecordatorio) },
      activo: { type: Boolean, default: true },
      canales: [{ type: String, enum: Object.values(CanalNotificacion) }],
      diasAnticipacion: { type: Number, min: 0, max: 30 },
      horaEnvio: { type: String },
    }],

    noMolestar: {
      activo: { type: Boolean, default: false },
      horaInicio: { type: String },
      horaFin: { type: String },
      diasSemana: [{ type: Number, min: 0, max: 6 }],
    },

    emailDigest: {
      activo: { type: Boolean, default: false },
      frecuencia: { type: String, enum: ['diario', 'semanal'], default: 'diario' },
      hora: { type: String },
    },
  },
  {
    timestamps: true,
    collection: 'alertas_config',
  }
);

// ============================================
// ÍNDICES
// ============================================

RecordatorioSchema.index({ empresaId: 1 });
RecordatorioSchema.index({ usuarioId: 1 });
RecordatorioSchema.index({ tipo: 1 });
RecordatorioSchema.index({ estado: 1 });
RecordatorioSchema.index({ fechaProgramada: 1 });
RecordatorioSchema.index({ prioridad: 1 });
RecordatorioSchema.index({ entidadTipo: 1, entidadId: 1 });
RecordatorioSchema.index({ empresaId: 1, usuarioId: 1, estado: 1 });
RecordatorioSchema.index({ empresaId: 1, fechaProgramada: 1, estado: 1 });

AlertaConfigSchema.index({ empresaId: 1, usuarioId: 1 }, { unique: true });

// ============================================
// MODELOS
// ============================================

export const Recordatorio: Model<IRecordatorio> =
  mongoose.models.Recordatorio || mongoose.model<IRecordatorio>('Recordatorio', RecordatorioSchema);

export const AlertaConfig: Model<IAlertaConfig> =
  mongoose.models.AlertaConfig || mongoose.model<IAlertaConfig>('AlertaConfig', AlertaConfigSchema);

export default Recordatorio;
