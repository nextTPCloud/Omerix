import mongoose from 'mongoose';
import { databaseManager } from '@/services/database-manager.service';
import { IDatabaseConfig } from '@/modules/empresa/Empresa';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type MarcaTerminal = 'ZKTeco' | 'ANVIZ' | 'Hikvision' | 'otro';
export type EstadoTerminal = 'activo' | 'inactivo' | 'error';
export type EstadoConexion = 'conectado' | 'desconectado' | 'desconocido';

export interface IEmpleadoSincronizado {
  personalId: mongoose.Types.ObjectId;
  codigoTerminal: number;    // ID único en el terminal
  sincronizadoEn: Date;
  conFoto: boolean;
}

export interface IHistorialSync {
  fecha: Date;
  tipo: 'asistencia' | 'empleados';
  direccion: 'descarga' | 'carga';  // descarga = terminal->sistema, carga = sistema->terminal
  estado: 'exitoso' | 'error' | 'parcial';
  registrosProcesados: number;
  registrosNuevos: number;
  registrosError: number;
  duracionMs: number;
  error?: string;
  detalles?: string;
}

export interface IConfiguracionTerminal {
  frecuenciaMinutos: number;         // Cada X minutos sincronizar
  sincronizarAsistencia: boolean;    // Descargar fichajes automáticamente
  sincronizarEmpleados: boolean;     // Enviar empleados automáticamente
  timezone: string;                  // Zona horaria del terminal
  eliminarRegistrosSincronizados: boolean;  // Limpiar registros del terminal después de sincronizar
}

export interface ITerminal extends mongoose.Document {
  codigo: string;
  nombre: string;
  descripcion?: string;

  // Conexión
  ip: string;
  puerto: number;
  mac?: string;

  // Dispositivo
  marca: MarcaTerminal;
  modelo?: string;
  numeroSerie?: string;
  firmware?: string;

  // Configuración
  configuracion: IConfiguracionTerminal;

  // Estado
  estado: EstadoTerminal;
  estadoConexion: EstadoConexion;
  ultimaConexion?: Date;
  ultimaSincronizacion?: Date;
  ultimoError?: string;

  // Empleados sincronizados
  empleadosSincronizados: IEmpleadoSincronizado[];

  // Historial de sincronizaciones
  historialSync: IHistorialSync[];

  // Metadata
  activo: boolean;
  orden: number;
  creadoPor: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaModificacion?: Date;
}

// ============================================
// SCHEMA
// ============================================

const EmpleadoSincronizadoSchema = new mongoose.Schema<IEmpleadoSincronizado>(
  {
    personalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Personal', required: true },
    codigoTerminal: { type: Number, required: true },
    sincronizadoEn: { type: Date, default: Date.now },
    conFoto: { type: Boolean, default: false },
  },
  { _id: false }
);

const HistorialSyncSchema = new mongoose.Schema<IHistorialSync>(
  {
    fecha: { type: Date, default: Date.now },
    tipo: { type: String, enum: ['asistencia', 'empleados'], required: true },
    direccion: { type: String, enum: ['descarga', 'carga'], required: true },
    estado: { type: String, enum: ['exitoso', 'error', 'parcial'], required: true },
    registrosProcesados: { type: Number, default: 0 },
    registrosNuevos: { type: Number, default: 0 },
    registrosError: { type: Number, default: 0 },
    duracionMs: { type: Number, default: 0 },
    error: { type: String },
    detalles: { type: String },
  },
  { _id: false }
);

const ConfiguracionTerminalSchema = new mongoose.Schema<IConfiguracionTerminal>(
  {
    frecuenciaMinutos: { type: Number, default: 15, min: 1, max: 1440 },
    sincronizarAsistencia: { type: Boolean, default: true },
    sincronizarEmpleados: { type: Boolean, default: true },
    timezone: { type: String, default: 'Europe/Madrid' },
    eliminarRegistrosSincronizados: { type: Boolean, default: false },
  },
  { _id: false }
);

const TerminalSchema = new mongoose.Schema<ITerminal>(
  {
    codigo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Conexión
    ip: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(v),
        message: 'IP inválida',
      },
    },
    puerto: {
      type: Number,
      required: true,
      min: 1,
      max: 65535,
      default: 4370,  // Puerto por defecto ZKTeco
    },
    mac: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Dispositivo
    marca: {
      type: String,
      enum: ['ZKTeco', 'ANVIZ', 'Hikvision', 'otro'],
      default: 'ZKTeco',
    },
    modelo: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    numeroSerie: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    firmware: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    // Configuración
    configuracion: {
      type: ConfiguracionTerminalSchema,
      default: () => ({}),
    },

    // Estado
    estado: {
      type: String,
      enum: ['activo', 'inactivo', 'error'],
      default: 'activo',
    },
    estadoConexion: {
      type: String,
      enum: ['conectado', 'desconectado', 'desconocido'],
      default: 'desconocido',
    },
    ultimaConexion: Date,
    ultimaSincronizacion: Date,
    ultimoError: String,

    // Empleados sincronizados
    empleadosSincronizados: [EmpleadoSincronizadoSchema],

    // Historial (mantener últimos 100 registros)
    historialSync: {
      type: [HistorialSyncSchema],
      default: [],
    },

    // Metadata
    activo: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechaCreacion: { type: Date, default: Date.now },
    modificadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fechaModificacion: Date,
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices
TerminalSchema.index({ codigo: 1 }, { unique: true });
TerminalSchema.index({ ip: 1, puerto: 1 }, { unique: true });
TerminalSchema.index({ estado: 1 });
TerminalSchema.index({ activo: 1 });
TerminalSchema.index({ marca: 1 });

// Pre-save: limitar historial a 100 registros
TerminalSchema.pre('save', function (next) {
  if (this.historialSync && this.historialSync.length > 100) {
    this.historialSync = this.historialSync.slice(-100);
  }
  next();
});

// ============================================
// HELPER: Obtener modelo dinámico por empresa
// ============================================

const modelCache = new Map<string, mongoose.Model<ITerminal>>();

export async function getModeloTerminal(
  empresaId: mongoose.Types.ObjectId,
  dbConfig: IDatabaseConfig
): Promise<mongoose.Model<ITerminal>> {
  const cacheKey = `Terminal_${empresaId.toString()}`;

  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey)!;
  }

  const connection = await databaseManager.getEmpresaConnection(empresaId, dbConfig);
  const model = connection.model<ITerminal>('Terminal', TerminalSchema);

  modelCache.set(cacheKey, model);
  return model;
}

export default TerminalSchema;
