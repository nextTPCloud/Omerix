import mongoose, { Schema, Document, Types } from 'mongoose';

// Estado del movimiento del extracto
export enum EstadoExtracto {
  PENDIENTE = 'pendiente',     // Sin procesar
  SUGERIDO = 'sugerido',       // Match sugerido automaticamente
  CONCILIADO = 'conciliado',   // Conciliado (aprobado o manual)
  DESCARTADO = 'descartado',   // Descartado por el usuario
}

// Origen del extracto (formato de archivo)
export enum OrigenExtracto {
  CSV = 'csv',
  NORMA43 = 'norma43',
  OFX = 'ofx',
  QFX = 'qfx',
}

// Tipo de movimiento basico del extracto
export enum TipoMovimientoExtracto {
  CARGO = 'cargo',       // Salida de dinero
  ABONO = 'abono',       // Entrada de dinero
}

// Interface del documento
export interface IMovimientoExtracto extends Document {
  _id: Types.ObjectId;

  // Identificacion de importacion
  importacionId: Types.ObjectId;    // Referencia a la sesion de importacion
  numeroLinea: number;              // Linea en el archivo original

  // Datos del extracto bancario
  tipo: TipoMovimientoExtracto;
  fecha: Date;
  fechaValor?: Date;
  concepto: string;                 // Concepto limpio/procesado
  conceptoOriginal: string;         // Texto sin procesar del banco
  importe: number;                  // Valor absoluto (siempre positivo)
  saldo?: number;                   // Saldo tras movimiento (si disponible)

  // Identificadores bancarios
  referenciaBanco?: string;         // Referencia unica del banco
  codigoOperacion?: string;         // Codigo de operacion bancaria

  // Cuenta bancaria
  cuentaBancariaId: Types.ObjectId;
  cuentaBancariaNombre?: string;

  // Estado de conciliacion
  estado: EstadoExtracto;

  // Match/Conciliacion
  movimientoBancarioId?: Types.ObjectId;  // MovimientoBancario vinculado
  confianzaMatch?: number;                // 0-100, confianza del algoritmo
  motivoMatch?: string;                   // Explicacion del match
  criteriosMatch?: string[];              // Criterios que cumple

  // Auditoria
  creadoPor: Types.ObjectId;
  fechaCreacion: Date;
  conciliadoPor?: Types.ObjectId;
  fechaConciliacion?: Date;
  descartadoPor?: Types.ObjectId;
  fechaDescarte?: Date;
  motivoDescarte?: string;

  activo: boolean;
}

const MovimientoExtractoSchema = new Schema<IMovimientoExtracto>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    importacionId: {
      type: Schema.Types.ObjectId,
      ref: 'ImportacionExtracto',
      required: true,
      index: true,
    },

    numeroLinea: {
      type: Number,
      required: true,
    },

    tipo: {
      type: String,
      enum: Object.values(TipoMovimientoExtracto),
      required: true,
      index: true,
    },

    fecha: {
      type: Date,
      required: true,
      index: true,
    },

    fechaValor: Date,

    concepto: {
      type: String,
      required: true,
      trim: true,
    },

    conceptoOriginal: {
      type: String,
      required: true,
      trim: true,
    },

    importe: {
      type: Number,
      required: true,
      min: 0,
    },

    saldo: Number,

    referenciaBanco: {
      type: String,
      trim: true,
      index: true,
    },

    codigoOperacion: {
      type: String,
      trim: true,
    },

    cuentaBancariaId: {
      type: Schema.Types.ObjectId,
      ref: 'CuentaBancaria',
      required: true,
      index: true,
    },

    cuentaBancariaNombre: String,

    estado: {
      type: String,
      enum: Object.values(EstadoExtracto),
      default: EstadoExtracto.PENDIENTE,
      index: true,
    },

    movimientoBancarioId: {
      type: Schema.Types.ObjectId,
      ref: 'MovimientoBancario',
      index: true,
    },

    confianzaMatch: {
      type: Number,
      min: 0,
      max: 100,
    },

    motivoMatch: String,

    criteriosMatch: [String],

    // Auditoria
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },

    fechaCreacion: {
      type: Date,
      default: Date.now,
    },

    conciliadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },

    fechaConciliacion: Date,

    descartadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },

    fechaDescarte: Date,

    motivoDescarte: String,

    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'movimientos_extracto',
  }
);

// Indices compuestos
MovimientoExtractoSchema.index({ importacionId: 1, numeroLinea: 1 });
MovimientoExtractoSchema.index({ cuentaBancariaId: 1, fecha: -1 });
MovimientoExtractoSchema.index({ estado: 1, importacionId: 1 });
MovimientoExtractoSchema.index({ importe: 1, fecha: 1 }); // Para matching

// Virtuals
MovimientoExtractoSchema.virtual('importeConSigno').get(function() {
  return this.tipo === TipoMovimientoExtracto.CARGO ? -this.importe : this.importe;
});

MovimientoExtractoSchema.virtual('importeFormateado').get(function() {
  const signo = this.tipo === TipoMovimientoExtracto.ABONO ? '+' : '-';
  return `${signo}${this.importe.toFixed(2)} EUR`;
});

export default mongoose.model<IMovimientoExtracto>('MovimientoExtracto', MovimientoExtractoSchema);
