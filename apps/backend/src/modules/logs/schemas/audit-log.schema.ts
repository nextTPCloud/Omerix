// backend/src/modules/logs/schemas/audit-log.schema.ts

import mongoose, { Schema, Model } from 'mongoose';
import {
  IAuditLog,
  LogAction,
  LogModule,
  LogResult,
} from '../interfaces/log.interface';

// ============================================
// INTERFACE DEL MODELO CON MÉTODOS ESTÁTICOS
// ============================================

interface IAuditLogMethods {}

interface IAuditLogModel extends Model<IAuditLog, {}, IAuditLogMethods> {
  findByEntity(empresaId: string, entidadTipo: string, entidadId: string): Promise<(IAuditLog & IAuditLogMethods)[]>;
  findByUser(empresaId: string, usuarioId: string, limit?: number): Promise<(IAuditLog & IAuditLogMethods)[]>;
  findByModule(empresaId: string, modulo: LogModule, limit?: number): Promise<(IAuditLog & IAuditLogMethods)[]>;
  findErrors(empresaId: string, fechaDesde?: Date, fechaHasta?: Date): Promise<(IAuditLog & IAuditLogMethods)[]>;
  getStats(empresaId: string, fechaDesde: Date, fechaHasta: Date): Promise<any[]>;
  getUserActivity(empresaId: string, fechaDesde: Date, fechaHasta: Date): Promise<any[]>;
}

// ============================================
// SCHEMA DE AUDIT LOG
// ============================================

const AuditLogSchema = new Schema<IAuditLog>(
  {
    // Identificadores
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'La empresa es obligatoria'],
      index: true,
    },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario es obligatorio'],
      index: true,
    },

    // Información de la acción
    accion: {
      type: String,
      enum: Object.values(LogAction),
      required: [true, 'La acción es obligatoria'],
      index: true,
    },
    modulo: {
      type: String,
      enum: Object.values(LogModule),
      required: [true, 'El módulo es obligatorio'],
      index: true,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },

    // Entidad afectada (opcional)
    entidadTipo: {
      type: String,
      index: true,
    },
    entidadId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    // Datos del cambio (para auditoría completa)
    datosAnteriores: {
      type: Schema.Types.Mixed,
    },
    datosNuevos: {
      type: Schema.Types.Mixed,
    },

    // Información de red
    ip: {
      type: String,
      required: [true, 'La IP es obligatoria'],
    },
    userAgent: {
      type: String,
    },

    // Resultado
    resultado: {
      type: String,
      enum: Object.values(LogResult),
      required: [true, 'El resultado es obligatorio'],
      default: LogResult.SUCCESS,
      index: true,
    },
    mensajeError: {
      type: String,
    },

    // Metadatos adicionales
    metadata: {
      type: Schema.Types.Mixed,
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
    timestamps: true, // Añade createdAt y updatedAt automáticamente
    collection: 'audit_logs',
  }
);

// ============================================
// ÍNDICES COMPUESTOS PARA QUERIES RÁPIDAS
// ============================================

// Índice para búsquedas por empresa y fecha
AuditLogSchema.index({ empresaId: 1, timestamp: -1 });

// Índice para búsquedas por usuario y fecha
AuditLogSchema.index({ usuarioId: 1, timestamp: -1 });

// Índice para búsquedas por empresa, módulo y fecha
AuditLogSchema.index({ empresaId: 1, modulo: 1, timestamp: -1 });

// Índice para búsquedas por entidad
AuditLogSchema.index({ empresaId: 1, entidadTipo: 1, entidadId: 1 });

// Índice para búsquedas por resultado y fecha
AuditLogSchema.index({ empresaId: 1, resultado: 1, timestamp: -1 });

// Índice para búsquedas por acción
AuditLogSchema.index({ empresaId: 1, accion: 1, timestamp: -1 });

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Buscar logs de una entidad específica
 */
AuditLogSchema.statics.findByEntity = function (
  empresaId: string,
  entidadTipo: string,
  entidadId: string
) {
  return this.find({
    empresaId,
    entidadTipo,
    entidadId,
  })
    .sort({ timestamp: -1 })
    .populate('usuarioId', 'nombre apellidos email')
    .lean();
};

/**
 * Buscar logs de un usuario
 */
AuditLogSchema.statics.findByUser = function (
  empresaId: string,
  usuarioId: string,
  limit: number = 50
) {
  return this.find({
    empresaId,
    usuarioId,
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

/**
 * Buscar logs por módulo
 */
AuditLogSchema.statics.findByModule = function (
  empresaId: string,
  modulo: LogModule,
  limit: number = 100
) {
  return this.find({
    empresaId,
    modulo,
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('usuarioId', 'nombre apellidos email')
    .lean();
};

/**
 * Buscar logs con errores
 */
AuditLogSchema.statics.findErrors = function (
  empresaId: string,
  fechaDesde?: Date,
  fechaHasta?: Date
) {
  const query: any = {
    empresaId,
    resultado: LogResult.FAILURE,
  };

  if (fechaDesde || fechaHasta) {
    query.timestamp = {};
    if (fechaDesde) query.timestamp.$gte = fechaDesde;
    if (fechaHasta) query.timestamp.$lte = fechaHasta;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('usuarioId', 'nombre apellidos email')
    .lean();
};

/**
 * Obtener estadísticas de logs
 */
AuditLogSchema.statics.getStats = async function (
  empresaId: string,
  fechaDesde: Date,
  fechaHasta: Date
) {
  return this.aggregate([
    {
      $match: {
        empresaId: new mongoose.Types.ObjectId(empresaId),
        timestamp: { $gte: fechaDesde, $lte: fechaHasta },
      },
    },
    {
      $group: {
        _id: {
          modulo: '$modulo',
          resultado: '$resultado',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

/**
 * Obtener actividad por usuario
 */
AuditLogSchema.statics.getUserActivity = async function (
  empresaId: string,
  fechaDesde: Date,
  fechaHasta: Date
) {
  return this.aggregate([
    {
      $match: {
        empresaId: new mongoose.Types.ObjectId(empresaId),
        timestamp: { $gte: fechaDesde, $lte: fechaHasta },
      },
    },
    {
      $group: {
        _id: '$usuarioId',
        totalAcciones: { $sum: 1 },
        exitosas: {
          $sum: {
            $cond: [{ $eq: ['$resultado', LogResult.SUCCESS] }, 1, 0],
          },
        },
        fallidas: {
          $sum: {
            $cond: [{ $eq: ['$resultado', LogResult.FAILURE] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'usuarios',
        localField: '_id',
        foreignField: '_id',
        as: 'usuario',
      },
    },
    {
      $unwind: '$usuario',
    },
    {
      $project: {
        _id: 1,
        nombre: '$usuario.nombre',
        apellidos: '$usuario.apellidos',
        email: '$usuario.email',
        totalAcciones: 1,
        exitosas: 1,
        fallidas: 1,
      },
    },
    {
      $sort: { totalAcciones: -1 },
    },
  ]);
};

// ============================================
// MIDDLEWARE
// ============================================

// Prevenir modificación de logs (solo lectura después de crear)
AuditLogSchema.pre('findOneAndUpdate', function (next) {
  const error = new Error(
    '❌ Los logs de auditoría no pueden modificarse (solo lectura)'
  );
  next(error);
});

AuditLogSchema.pre('updateOne', function (next) {
  const error = new Error(
    '❌ Los logs de auditoría no pueden modificarse (solo lectura)'
  );
  next(error);
});

AuditLogSchema.pre('updateMany', function (next) {
  const error = new Error(
    '❌ Los logs de auditoría no pueden modificarse (solo lectura)'
  );
  next(error);
});

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Obtener resumen legible del log
 */
AuditLogSchema.methods.getResumen = function (): string {
  return `[${this.accion}] ${this.descripcion} - ${this.resultado}`;
};

/**
 * Verificar si el log tiene cambios de datos
 */
AuditLogSchema.methods.tieneCambios = function (): boolean {
  return !!(this.datosAnteriores || this.datosNuevos);
};

// ============================================
// OPCIONES DE TOJSON
// ============================================

AuditLogSchema.set('toJSON', {
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

const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', AuditLogSchema);

export default AuditLog;