import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface del documento
export interface ICuentaBancaria extends Document {
  _id: Types.ObjectId;

  // Datos de la cuenta
  iban: string;              // IBAN completo (ES + 22 dígitos)
  banco: string;             // Nombre del banco
  bic?: string;              // BIC/SWIFT code
  titular: string;           // Nombre del titular
  alias?: string;            // Nombre corto para identificar

  // Saldos (para conciliación futura)
  saldoInicial: number;
  saldoActual: number;
  fechaUltimoMovimiento?: Date;

  // Estado
  activa: boolean;
  predeterminada: boolean;

  // Configuración adicional
  usarParaCobros: boolean;   // Se puede usar para cobrar
  usarParaPagos: boolean;    // Se puede usar para pagar

  // Auditoría
  creadoPor: Types.ObjectId;
  fechaCreacion: Date;
  modificadoPor?: Types.ObjectId;
  fechaModificacion?: Date;
}

const CuentaBancariaSchema = new Schema<ICuentaBancaria>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    iban: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function(v: string) {
          // Validar formato IBAN español (puede ampliarse para otros países)
          return /^[A-Z]{2}\d{22}$/.test(v.replace(/\s/g, ''));
        },
        message: 'IBAN no tiene formato válido',
      },
    },

    banco: {
      type: String,
      required: true,
      trim: true,
    },

    bic: {
      type: String,
      trim: true,
      uppercase: true,
    },

    titular: {
      type: String,
      required: true,
      trim: true,
    },

    alias: {
      type: String,
      trim: true,
    },

    saldoInicial: {
      type: Number,
      default: 0,
    },

    saldoActual: {
      type: Number,
      default: 0,
    },

    fechaUltimoMovimiento: Date,

    activa: {
      type: Boolean,
      default: true,
      index: true,
    },

    predeterminada: {
      type: Boolean,
      default: false,
      index: true,
    },

    usarParaCobros: {
      type: Boolean,
      default: true,
    },

    usarParaPagos: {
      type: Boolean,
      default: true,
    },

    // Auditoría
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaModificacion: Date,
  },
  {
    timestamps: false,
    collection: 'cuentas_bancarias',
  }
);

// Índices
CuentaBancariaSchema.index({ iban: 1 }, { unique: true });
CuentaBancariaSchema.index({ activa: 1, predeterminada: -1 });

// Virtual para mostrar IBAN formateado
CuentaBancariaSchema.virtual('ibanFormateado').get(function() {
  // ES12 3456 7890 1234 5678 9012
  const iban = this.iban.replace(/\s/g, '');
  return iban.match(/.{1,4}/g)?.join(' ') || iban;
});

// Virtual para nombre display
CuentaBancariaSchema.virtual('nombreDisplay').get(function() {
  return this.alias || `${this.banco} - ...${this.iban.slice(-4)}`;
});

export default mongoose.model<ICuentaBancaria>('CuentaBancaria', CuentaBancariaSchema);
