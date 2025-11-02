// backend/src/modules/logs/schemas/fiscal-log.schema.ts

import mongoose, { Schema, Model } from 'mongoose';
import {
  IFiscalLog,
  DocumentType,
} from '../interfaces/log.interface';

// ============================================
// INTERFACE DEL MODELO CON MÉTODOS ESTÁTICOS
// ============================================

interface IFiscalLogMethods {}

interface IFiscalLogModel extends Model<IFiscalLog, {}, IFiscalLogMethods> {
  getUltimoLog(empresaId: string): Promise<(IFiscalLog & IFiscalLogMethods) | null>;
  findByDocumentType(empresaId: string, documentoTipo: DocumentType, limit?: number): Promise<(IFiscalLog & IFiscalLogMethods)[]>;
  findByNumeroDocumento(empresaId: string, numeroDocumento: string): Promise<(IFiscalLog & IFiscalLogMethods) | null>;
  verificarCadena(empresaId: string, fechaDesde?: Date, fechaHasta?: Date): Promise<any>;
  getEstadisticas(empresaId: string, fechaDesde: Date, fechaHasta: Date): Promise<any[]>;
  contarPorPeriodo(empresaId: string, fechaDesde: Date, fechaHasta: Date): Promise<any[]>;
  getLogsProximosAExpirar(diasAntes?: number): Promise<(IFiscalLog & IFiscalLogMethods)[]>;
}

// ============================================
// SCHEMA DE FISCAL LOG (INMUTABLE)
// ============================================

const FiscalLogSchema = new Schema<IFiscalLog>(
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
      index: true,
    },

    // Documento fiscal
    documentoTipo: {
      type: String,
      enum: Object.values(DocumentType),
      required: [true, 'El tipo de documento es obligatorio'],
      index: true,
    },
    documentoId: {
      type: Schema.Types.ObjectId,
      required: [true, 'El ID del documento es obligatorio'],
      index: true,
    },
    numeroDocumento: {
      type: String,
      required: [true, 'El número de documento es obligatorio'],
      index: true,
    },
    serie: {
      type: String,
      index: true,
    },

    // Datos fiscales
    importe: {
      type: Number,
      required: [true, 'El importe es obligatorio'],
      min: [0, 'El importe no puede ser negativo'],
    },
    iva: {
      type: Number,
      required: [true, 'El IVA es obligatorio'],
      min: [0, 'El IVA no puede ser negativo'],
    },
    total: {
      type: Number,
      required: [true, 'El total es obligatorio'],
      min: [0, 'El total no puede ser negativo'],
    },

    // Seguridad e inmutabilidad (BLOCKCHAIN)
    hash: {
      type: String,
      required: [true, 'El hash es obligatorio'],
      unique: true,
      index: true,
    },
    hashAnterior: {
      type: String,
      index: true,
      default: null,
    },
    firma: {
      type: String,
      required: [true, 'La firma es obligatoria'],
    },

    // Normativa TicketBAI (País Vasco)
    ticketBAI: {
      tbaiId: {
        type: String,
        index: true,
      },
      qr: {
        type: String,
      },
      firma: {
        type: String,
      },
    },

    // Normativa Verifactu (Nacional)
    verifactu: {
      idFactura: {
        type: String,
        index: true,
      },
      hash: {
        type: String,
      },
      fechaExpedicion: {
        type: Date,
      },
    },

    // Metadatos adicionales
    metadata: {
      type: Schema.Types.Mixed,
    },

    // Control de inmutabilidad
    inmutable: {
      type: Boolean,
      default: true,
      required: true,
    },
    retencionHasta: {
      type: Date,
      required: true,
      index: true,
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
    collection: 'fiscal_logs',
  }
);

// ============================================
// ÍNDICES COMPUESTOS
// ============================================

// Índice para búsquedas por empresa y fecha
FiscalLogSchema.index({ empresaId: 1, timestamp: -1 });

// Índice para búsquedas por tipo de documento
FiscalLogSchema.index({ empresaId: 1, documentoTipo: 1, timestamp: -1 });

// Índice para búsquedas por número de documento
FiscalLogSchema.index({ empresaId: 1, numeroDocumento: 1 });

// Índice para búsquedas por serie y número
FiscalLogSchema.index({ empresaId: 1, serie: 1, numeroDocumento: 1 });

// Índice para verificación de cadena blockchain
FiscalLogSchema.index({ empresaId: 1, hashAnterior: 1 });


// ============================================
// MIDDLEWARE - PROTECCIÓN INMUTABILIDAD
// ============================================

// CRÍTICO: Prevenir CUALQUIER modificación de logs fiscales
FiscalLogSchema.pre('findOneAndUpdate', function (next) {
  const error = new Error(
    '🚨 PROHIBIDO: Los logs fiscales son INMUTABLES y no pueden modificarse según normativa anti-fraude'
  );
  next(error);
});

FiscalLogSchema.pre('updateOne', function (next) {
  const error = new Error(
    '🚨 PROHIBIDO: Los logs fiscales son INMUTABLES y no pueden modificarse según normativa anti-fraude'
  );
  next(error);
});

FiscalLogSchema.pre('updateMany', function (next) {
  const error = new Error(
    '🚨 PROHIBIDO: Los logs fiscales son INMUTABLES y no pueden modificarse según normativa anti-fraude'
  );
  next(error);
});

// CRÍTICO: Prevenir eliminación de logs fiscales
FiscalLogSchema.pre('findOneAndDelete', function (next) {
  const error = new Error(
    '🚨 PROHIBIDO: Los logs fiscales no pueden eliminarse (retención mínima 4 años)'
  );
  next(error);
});

FiscalLogSchema.pre('deleteOne', function (next) {
  const error = new Error(
    '🚨 PROHIBIDO: Los logs fiscales no pueden eliminarse (retención mínima 4 años)'
  );
  next(error);
});

FiscalLogSchema.pre('deleteMany', function (next) {
  const error = new Error(
    '🚨 PROHIBIDO: Los logs fiscales no pueden eliminarse (retención mínima 4 años)'
  );
  next(error);
});

// Middleware pre-save: calcular fecha de retención automáticamente
FiscalLogSchema.pre('save', function (next) {
  if (!this.retencionHasta) {
    // Retención mínima: 4 años (1460 días) desde la fecha de creación
    const fechaRetencion = new Date();
    fechaRetencion.setFullYear(fechaRetencion.getFullYear() + 4);
    this.retencionHasta = fechaRetencion;
  }
  next();
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtener el último log fiscal de una empresa (para blockchain)
 */
FiscalLogSchema.statics.getUltimoLog = async function (empresaId: string) {
  return this.findOne({ empresaId })
    .sort({ timestamp: -1 })
    .lean();
};

/**
 * Buscar logs por tipo de documento
 */
FiscalLogSchema.statics.findByDocumentType = function (
  empresaId: string,
  documentoTipo: DocumentType,
  limit: number = 50
) {
  return this.find({
    empresaId,
    documentoTipo,
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('usuarioId', 'nombre apellidos email')
    .lean();
};

/**
 * Buscar log por número de documento
 */
FiscalLogSchema.statics.findByNumeroDocumento = function (
  empresaId: string,
  numeroDocumento: string
) {
  return this.findOne({
    empresaId,
    numeroDocumento,
  })
    .populate('usuarioId', 'nombre apellidos email')
    .lean();
};

/**
 * Verificar integridad de la cadena blockchain
 */
FiscalLogSchema.statics.verificarCadena = async function (
  empresaId: string,
  fechaDesde?: Date,
  fechaHasta?: Date
) {
  const query: any = { empresaId };

  if (fechaDesde || fechaHasta) {
    query.timestamp = {};
    if (fechaDesde) query.timestamp.$gte = fechaDesde;
    if (fechaHasta) query.timestamp.$lte = fechaHasta;
  }

  const logs = await this.find(query).sort({ timestamp: 1 }).lean();

  if (logs.length === 0) {
    return {
      isValid: true,
      totalLogs: 0,
      message: 'No hay logs para verificar',
    };
  }

  // Verificar cadena
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Verificar que el primer log no tenga hashAnterior o sea 'GENESIS'
    if (i === 0) {
      if (log.hashAnterior && log.hashAnterior !== 'GENESIS') {
        return {
          isValid: false,
          brokenAt: 0,
          brokenLog: log.numeroDocumento,
          message: 'El primer log debe tener hashAnterior nulo o GENESIS',
        };
      }
    } else {
      // Verificar encadenamiento
      const logAnterior = logs[i - 1];
      if (log.hashAnterior !== logAnterior.hash) {
        return {
          isValid: false,
          brokenAt: i,
          brokenLog: log.numeroDocumento,
          previousLog: logAnterior.numeroDocumento,
          message: `Cadena rota: ${log.numeroDocumento} no apunta correctamente a ${logAnterior.numeroDocumento}`,
        };
      }
    }
  }

  return {
    isValid: true,
    totalLogs: logs.length,
    primerLog: logs[0].numeroDocumento,
    ultimoLog: logs[logs.length - 1].numeroDocumento,
    message: `Cadena válida: ${logs.length} documentos verificados`,
  };
};

/**
 * Obtener estadísticas fiscales
 */
FiscalLogSchema.statics.getEstadisticas = async function (
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
        _id: '$documentoTipo',
        cantidad: { $sum: 1 },
        importeTotal: { $sum: '$importe' },
        ivaTotal: { $sum: '$iva' },
        total: { $sum: '$total' },
      },
    },
    {
      $sort: { cantidad: -1 },
    },
  ]);
};

/**
 * Obtener logs próximos a expirar retención
 */
FiscalLogSchema.statics.getLogsProximosAExpirar = function (
  diasAntes: number = 30
) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + diasAntes);

  return this.find({
    retencionHasta: { $lte: fechaLimite },
  })
    .sort({ retencionHasta: 1 })
    .limit(100)
    .lean();
};

/**
 * Contar documentos por periodo
 */
FiscalLogSchema.statics.contarPorPeriodo = async function (
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
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          tipo: '$documentoTipo',
        },
        count: { $sum: 1 },
        totalImporte: { $sum: '$total' },
      },
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 },
    },
  ]);
};

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Verificar si el log tiene TicketBAI
 */
FiscalLogSchema.methods.tieneTicketBAI = function (): boolean {
  return !!(this.ticketBAI && this.ticketBAI.tbaiId);
};

/**
 * Verificar si el log tiene Verifactu
 */
FiscalLogSchema.methods.tieneVerifactu = function (): boolean {
  return !!(this.verifactu && this.verifactu.idFactura);
};

/**
 * Obtener resumen del documento
 */
FiscalLogSchema.methods.getResumen = function (): string {
  return `${this.documentoTipo} ${this.numeroDocumento} - €${this.total.toFixed(2)}`;
};

/**
 * Verificar si está dentro del periodo de retención
 */
FiscalLogSchema.methods.estaEnPeriodoRetencion = function (): boolean {
  return new Date() < this.retencionHasta;
};

// ============================================
// OPCIONES DE TOJSON
// ============================================

FiscalLogSchema.set('toJSON', {
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

const FiscalLog = mongoose.model<IFiscalLog, IFiscalLogModel>('FiscalLog', FiscalLogSchema);

export default FiscalLog;   