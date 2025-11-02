// backend/src/modules/logs/schemas/system-log.schema.ts

import mongoose, { Schema, Model } from 'mongoose';
import {
  ISystemLog,
  LogLevel,
  LogModule,
} from '../interfaces/log.interface';

// ============================================
// INTERFACE DEL MODELO CON MÉTODOS ESTÁTICOS
// ============================================

interface ISystemLogMethods {}

interface ISystemLogModel extends Model<ISystemLog, {}, ISystemLogMethods> {
  findByLevel(nivel: LogLevel, limit?: number): Promise<(ISystemLog & ISystemLogMethods)[]>;
  findRecentErrors(minutosAtras?: number, limit?: number): Promise<(ISystemLog & ISystemLogMethods)[]>;
  findByModule(modulo: LogModule, fechaDesde?: Date, fechaHasta?: Date): Promise<(ISystemLog & ISystemLogMethods)[]>;
  findByErrorCode(errorCode: string, limit?: number): Promise<(ISystemLog & ISystemLogMethods)[]>;
  getErrorStats(horasAtras?: number): Promise<any[]>;
  getModuleStats(fechaDesde: Date, fechaHasta: Date): Promise<any[]>;
  checkSystemHealth(): Promise<any>;
}

// ============================================
// SCHEMA DE SYSTEM LOG
// ============================================

const SystemLogSchema = new Schema<ISystemLog>(
  {
    // Nivel y mensaje
    nivel: {
      type: String,
      enum: Object.values(LogLevel),
      required: [true, 'El nivel es obligatorio'],
      index: true,
    },
    mensaje: {
      type: String,
      required: [true, 'El mensaje es obligatorio'],
      maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres'],
    },

    // Contexto
    modulo: {
      type: String,
      enum: Object.values(LogModule),
      required: [true, 'El módulo es obligatorio'],
      index: true,
    },
    accion: {
      type: String,
      index: true,
    },

    // Error info (si es error)
    stack: {
      type: String,
    },
    errorCode: {
      type: String,
      index: true,
    },

    // Empresa y usuario (opcional, algunos logs son globales)
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      index: true,
    },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      index: true,
    },

    // Contexto adicional
    contexto: {
      type: Schema.Types.Mixed,
    },

    // Request info (opcional)
    ip: {
      type: String,
    },
    url: {
      type: String,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'system_logs',
  }
);

// ============================================
// ÍNDICES COMPUESTOS
// ============================================

// Índice para búsquedas por nivel y fecha
SystemLogSchema.index({ nivel: 1, timestamp: -1 });

// Índice para búsquedas por módulo y fecha
SystemLogSchema.index({ modulo: 1, timestamp: -1 });

// Índice para búsquedas por empresa (si aplica)
SystemLogSchema.index({ empresaId: 1, timestamp: -1 });

// Índice para errores críticos
SystemLogSchema.index({ nivel: 1, errorCode: 1, timestamp: -1 });

// ============================================
// ÍNDICE TTL (Time To Live)
// ============================================

// Los logs de sistema se eliminan automáticamente después de 90 días
// Esto ahorra espacio en BD y cumple con políticas de retención
SystemLogSchema.index(
  { timestamp: 1 },
  { 
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 días
    name: 'system_log_ttl'
  }
);

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Buscar logs por nivel
 */
SystemLogSchema.statics.findByLevel = function (
  nivel: LogLevel,
  limit: number = 100
) {
  return this.find({ nivel })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Buscar errores recientes
 */
SystemLogSchema.statics.findRecentErrors = function (
  minutosAtras: number = 60,
  limit: number = 50
) {
  const fechaDesde = new Date(Date.now() - minutosAtras * 60 * 1000);
  
  return this.find({
    nivel: { $in: [LogLevel.ERROR, LogLevel.FATAL] },
    timestamp: { $gte: fechaDesde },
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Buscar logs por módulo
 */
SystemLogSchema.statics.findByModule = function (
  modulo: LogModule,
  fechaDesde?: Date,
  fechaHasta?: Date
) {
  const query: any = { modulo };

  if (fechaDesde || fechaHasta) {
    query.timestamp = {};
    if (fechaDesde) query.timestamp.$gte = fechaDesde;
    if (fechaHasta) query.timestamp.$lte = fechaHasta;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(200)
    .lean();
};

/**
 * Buscar logs por código de error
 */
SystemLogSchema.statics.findByErrorCode = function (
  errorCode: string,
  limit: number = 50
) {
  return this.find({ errorCode })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Obtener estadísticas de errores
 */
SystemLogSchema.statics.getErrorStats = async function (
  horasAtras: number = 24
) {
  const fechaDesde = new Date(Date.now() - horasAtras * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        nivel: { $in: [LogLevel.ERROR, LogLevel.FATAL] },
        timestamp: { $gte: fechaDesde },
      },
    },
    {
      $group: {
        _id: {
          nivel: '$nivel',
          modulo: '$modulo',
          errorCode: '$errorCode',
        },
        count: { $sum: 1 },
        ultimoError: { $max: '$timestamp' },
        primerError: { $min: '$timestamp' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

/**
 * Obtener logs agrupados por módulo
 */
SystemLogSchema.statics.getModuleStats = async function (
  fechaDesde: Date,
  fechaHasta: Date
) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: fechaDesde, $lte: fechaHasta },
      },
    },
    {
      $group: {
        _id: {
          modulo: '$modulo',
          nivel: '$nivel',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.modulo',
        niveles: {
          $push: {
            nivel: '$_id.nivel',
            count: '$count',
          },
        },
        total: { $sum: '$count' },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);
};

/**
 * Verificar salud del sistema (health check)
 */
SystemLogSchema.statics.checkSystemHealth = async function () {
  const ultimos30min = new Date(Date.now() - 30 * 60 * 1000);

  const [erroresRecientes, warningsRecientes, totalLogs] = await Promise.all([
    this.countDocuments({
      nivel: { $in: [LogLevel.ERROR, LogLevel.FATAL] },
      timestamp: { $gte: ultimos30min },
    }),
    this.countDocuments({
      nivel: LogLevel.WARN,
      timestamp: { $gte: ultimos30min },
    }),
    this.countDocuments({
      timestamp: { $gte: ultimos30min },
    }),
  ]);

  const health = {
    status: 'healthy' as 'healthy' | 'warning' | 'critical',
    erroresRecientes,
    warningsRecientes,
    totalLogs,
    timestamp: new Date(),
  };

  // Determinar estado de salud
  if (erroresRecientes > 10) {
    health.status = 'critical';
  } else if (erroresRecientes > 5 || warningsRecientes > 20) {
    health.status = 'warning';
  }

  return health;
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Verificar si es un log crítico
 */
SystemLogSchema.methods.esCritico = function (): boolean {
  return this.nivel === LogLevel.FATAL || this.nivel === LogLevel.ERROR;
};

/**
 * Obtener resumen del log
 */
SystemLogSchema.methods.getResumen = function (): string {
  return `[${this.nivel.toUpperCase()}] ${this.modulo}: ${this.mensaje}`;
};

// ============================================
// MIDDLEWARE
// ============================================

// Prevenir modificación de logs (solo lectura)
SystemLogSchema.pre('findOneAndUpdate', function (next) {
  const error = new Error(
    '❌ Los logs de sistema no pueden modificarse (solo lectura)'
  );
  next(error);
});

SystemLogSchema.pre('updateOne', function (next) {
  const error = new Error(
    '❌ Los logs de sistema no pueden modificarse (solo lectura)'
  );
  next(error);
});

SystemLogSchema.pre('updateMany', function (next) {
  const error = new Error(
    '❌ Los logs de sistema no pueden modificarse (solo lectura)'
  );
  next(error);
});

// ============================================
// OPCIONES DE TOJSON
// ============================================

SystemLogSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// ============================================
// EXPORT
// ============================================

const SystemLog = mongoose.model<ISystemLog, ISystemLogModel>('SystemLog', SystemLogSchema);

export default SystemLog;