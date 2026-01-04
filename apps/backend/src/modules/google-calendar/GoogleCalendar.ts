// apps/backend/src/modules/google-calendar/GoogleCalendar.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// Tipos de entidades sincronizables
export type TipoEntidadCalendario =
  | 'parte_trabajo'
  | 'tarea'
  | 'actividad_crm'
  | 'recordatorio'
  | 'evento'
  | 'cita';

// Estado de sincronización
export type EstadoSincronizacion = 'pendiente' | 'sincronizado' | 'error' | 'conflicto';

// Dirección de sincronización
export type DireccionSync = 'bidireccional' | 'solo_google' | 'solo_local';

// ============================================
// INTERFACE: CONFIGURACIÓN DE CALENDARIO
// ============================================

export interface ICalendarConfig extends Document {
  _id: mongoose.Types.ObjectId;

  // Token de acceso
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;

  // Información de la cuenta
  email: string;
  nombre?: string;

  // Calendarios disponibles
  calendarios: {
    id: string;
    nombre: string;
    color: string;
    principal: boolean;
    activo: boolean;
  }[];

  // Calendario por defecto para cada tipo de entidad
  calendarioPartes?: string;
  calendarioTareas?: string;
  calendarioActividadesCRM?: string;
  calendarioRecordatorios?: string;
  calendarioEventos?: string;

  // Configuración de sincronización
  sincronizacion: {
    direccion: DireccionSync;
    sincPartesActivos: boolean;
    sincTareasPendientes: boolean;
    sincActividadesCRM: boolean;
    sincRecordatorios: boolean;
    sincEventos: boolean;
    frecuenciaMinutos: number;
    ultimaSincronizacion?: Date;
  };

  // Estado
  activo: boolean;
  errorMensaje?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INTERFACE: EVENTO DE CALENDARIO
// ============================================

export interface ICalendarEvent extends Document {
  _id: mongoose.Types.ObjectId;

  // Referencia a entidad local
  tipoEntidad: TipoEntidadCalendario;
  entidadId: mongoose.Types.ObjectId;
  entidadInfo?: {
    titulo?: string;
    descripcion?: string;
    clienteNombre?: string;
    proyectoNombre?: string;
  };

  // Referencia a Google Calendar
  googleEventId?: string;
  googleCalendarId?: string;
  googleEtag?: string;

  // Datos del evento
  titulo: string;
  descripcion?: string;
  ubicacion?: string;

  // Fechas
  fechaInicio: Date;
  fechaFin: Date;
  todoElDia: boolean;

  // Recurrencia
  recurrente: boolean;
  reglaRecurrencia?: string;

  // Recordatorios
  recordatorios: {
    metodo: 'email' | 'popup';
    minutos: number;
  }[];

  // Participantes
  participantes: {
    email: string;
    nombre?: string;
    estado?: 'aceptado' | 'rechazado' | 'pendiente' | 'tentativo';
  }[];

  // Estado de sincronización
  estadoSync: EstadoSincronizacion;
  ultimaSync?: Date;
  errorSync?: string;

  // Hash para detectar cambios
  hashLocal?: string;
  hashRemoto?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INTERFACE: LOG DE SINCRONIZACIÓN
// ============================================

export interface ICalendarSyncLog extends Document {
  _id: mongoose.Types.ObjectId;

  // Detalles
  tipo: 'sync_completa' | 'sync_parcial' | 'push' | 'pull' | 'error';
  direccion: 'google_to_local' | 'local_to_google' | 'bidireccional';

  // Resultados
  eventosCreados: number;
  eventosActualizados: number;
  eventosEliminados: number;
  conflictos: number;
  errores: number;

  // Detalles de errores
  detallesErrores?: string[];

  // Duración
  inicioEjecucion: Date;
  finEjecucion?: Date;
  duracionMs?: number;

  // Timestamps
  createdAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const CalendarConfigSchema = new Schema<ICalendarConfig>({
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiry: { type: Date, required: true },

  email: { type: String, required: true },
  nombre: String,

  calendarios: [{
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    color: { type: String, default: '#4285F4' },
    principal: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
  }],

  calendarioPartes: String,
  calendarioTareas: String,
  calendarioActividadesCRM: String,
  calendarioRecordatorios: String,
  calendarioEventos: String,

  sincronizacion: {
    direccion: {
      type: String,
      enum: ['bidireccional', 'solo_google', 'solo_local'],
      default: 'bidireccional',
    },
    sincPartesActivos: { type: Boolean, default: true },
    sincTareasPendientes: { type: Boolean, default: true },
    sincActividadesCRM: { type: Boolean, default: true },
    sincRecordatorios: { type: Boolean, default: true },
    sincEventos: { type: Boolean, default: true },
    frecuenciaMinutos: { type: Number, default: 15 },
    ultimaSincronizacion: Date,
  },

  activo: { type: Boolean, default: true },
  errorMensaje: String,
}, {
  timestamps: true,
});

const CalendarEventSchema = new Schema<ICalendarEvent>({
  tipoEntidad: {
    type: String,
    enum: ['parte_trabajo', 'tarea', 'actividad_crm', 'recordatorio', 'evento', 'cita'],
    required: true,
  },
  entidadId: { type: Schema.Types.ObjectId, required: true },
  entidadInfo: {
    titulo: String,
    descripcion: String,
    clienteNombre: String,
    proyectoNombre: String,
  },

  googleEventId: String,
  googleCalendarId: String,
  googleEtag: String,

  titulo: { type: String, required: true },
  descripcion: String,
  ubicacion: String,

  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  todoElDia: { type: Boolean, default: false },

  recurrente: { type: Boolean, default: false },
  reglaRecurrencia: String,

  recordatorios: [{
    metodo: { type: String, enum: ['email', 'popup'], default: 'popup' },
    minutos: { type: Number, default: 30 },
  }],

  participantes: [{
    email: { type: String, required: true },
    nombre: String,
    estado: { type: String, enum: ['aceptado', 'rechazado', 'pendiente', 'tentativo'] },
  }],

  estadoSync: {
    type: String,
    enum: ['pendiente', 'sincronizado', 'error', 'conflicto'],
    default: 'pendiente',
  },
  ultimaSync: Date,
  errorSync: String,

  hashLocal: String,
  hashRemoto: String,
}, {
  timestamps: true,
});

const CalendarSyncLogSchema = new Schema<ICalendarSyncLog>({
  tipo: {
    type: String,
    enum: ['sync_completa', 'sync_parcial', 'push', 'pull', 'error'],
    required: true,
  },
  direccion: {
    type: String,
    enum: ['google_to_local', 'local_to_google', 'bidireccional'],
    required: true,
  },

  eventosCreados: { type: Number, default: 0 },
  eventosActualizados: { type: Number, default: 0 },
  eventosEliminados: { type: Number, default: 0 },
  conflictos: { type: Number, default: 0 },
  errores: { type: Number, default: 0 },

  detallesErrores: [String],

  inicioEjecucion: { type: Date, required: true },
  finEjecucion: Date,
  duracionMs: Number,
}, {
  timestamps: true,
});

// Índices
CalendarConfigSchema.index({ email: 1 });
CalendarEventSchema.index({ tipoEntidad: 1, entidadId: 1 });
CalendarEventSchema.index({ googleEventId: 1 });
CalendarEventSchema.index({ estadoSync: 1 });
CalendarSyncLogSchema.index({ createdAt: -1 });

// ============================================
// MODELOS
// ============================================

export const CalendarConfig: Model<ICalendarConfig> =
  mongoose.models.CalendarConfig ||
  mongoose.model<ICalendarConfig>('CalendarConfig', CalendarConfigSchema);

export const CalendarEvent: Model<ICalendarEvent> =
  mongoose.models.CalendarEvent ||
  mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);

export const CalendarSyncLog: Model<ICalendarSyncLog> =
  mongoose.models.CalendarSyncLog ||
  mongoose.model<ICalendarSyncLog>('CalendarSyncLog', CalendarSyncLogSchema);
