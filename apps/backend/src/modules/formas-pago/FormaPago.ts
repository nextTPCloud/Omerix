import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

export interface IConfiguracionPasarela {
  tipo: 'stripe' | 'redsys' | 'paypal' | 'transferencia' | 'efectivo' | 'otro';
  // Stripe
  stripePublicKey?: string;
  stripeSecretKey?: string;
  // Redsys
  redsysMerchantCode?: string;
  redsysTerminal?: string;
  redsysSecretKey?: string;
  redsysEnvironment?: 'test' | 'production';
  // PayPal
  paypalClientId?: string;
  paypalClientSecret?: string;
  paypalEnvironment?: 'sandbox' | 'production';
  // Genérico
  webhookUrl?: string;
  habilitado: boolean;
}

export interface IFormaPago extends Document {
  _id: Types.ObjectId;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'efectivo' | 'tarjeta' | 'transferencia' | 'domiciliacion' | 'cheque' | 'pagare' | 'otro';
  icono?: string;
  color?: string;
  requiereDatosBancarios: boolean;
  configuracionPasarela?: IConfiguracionPasarela;
  comision?: number; // Porcentaje de comisión
  cuentaBancariaId?: Types.ObjectId; // Cuenta bancaria predeterminada para esta forma de pago
  cuentaBancariaNombre?: string; // Nombre denormalizado de la cuenta
  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const ConfiguracionPasarelaSchema = new Schema<IConfiguracionPasarela>({
  tipo: {
    type: String,
    enum: ['stripe', 'redsys', 'paypal', 'transferencia', 'efectivo', 'otro'],
    required: true,
  },
  // Stripe
  stripePublicKey: String,
  stripeSecretKey: String,
  // Redsys
  redsysMerchantCode: String,
  redsysTerminal: String,
  redsysSecretKey: String,
  redsysEnvironment: {
    type: String,
    enum: ['test', 'production'],
    default: 'test',
  },
  // PayPal
  paypalClientId: String,
  paypalClientSecret: String,
  paypalEnvironment: {
    type: String,
    enum: ['sandbox', 'production'],
    default: 'sandbox',
  },
  // Genérico
  webhookUrl: String,
  habilitado: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const FormaPagoSchema = new Schema<IFormaPago>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      trim: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'transferencia', 'domiciliacion', 'cheque', 'pagare', 'otro'],
      required: [true, 'El tipo es obligatorio'],
    },
    icono: {
      type: String,
      default: 'credit-card',
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    requiereDatosBancarios: {
      type: Boolean,
      default: false,
    },
    configuracionPasarela: ConfiguracionPasarelaSchema,
    comision: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    cuentaBancariaId: {
      type: Schema.Types.ObjectId,
      ref: 'CuentaBancaria',
    },
    cuentaBancariaNombre: {
      type: String,
      trim: true,
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// ÍNDICES
// ============================================

// Código único
FormaPagoSchema.index({ codigo: 1 }, { unique: true });

// Búsquedas comunes
FormaPagoSchema.index({ activo: 1 });
FormaPagoSchema.index({ tipo: 1 });
FormaPagoSchema.index({ orden: 1 });

// Índice de texto para búsqueda
FormaPagoSchema.index({
  nombre: 'text',
  descripcion: 'text',
  codigo: 'text',
});

// ============================================
// VIRTUALS
// ============================================

// Virtual para obtener etiqueta del tipo
FormaPagoSchema.virtual('tipoLabel').get(function() {
  const labels: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    domiciliacion: 'Domiciliación bancaria',
    cheque: 'Cheque',
    pagare: 'Pagaré',
    otro: 'Otro',
  };
  return labels[this.tipo] || this.tipo;
});

FormaPagoSchema.set('toJSON', { virtuals: true });
FormaPagoSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT
// ============================================

export const FormaPago = mongoose.model<IFormaPago>('FormaPago', FormaPagoSchema);
