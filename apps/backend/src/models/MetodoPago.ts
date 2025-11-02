import mongoose, { Schema, Document } from 'mongoose';

export interface IMetodoPago extends Document {
  empresaId: mongoose.Types.ObjectId;
  
  // Tipo
  tipo: 'tarjeta' | 'paypal';
  
  // Info de la tarjeta
  ultimos4?: string;
  marca?: string; // Visa, Mastercard, etc.
  expMes?: number;
  expAno?: number;
  titular?: string;
  
  // IDs externos de las pasarelas
  stripePaymentMethodId?: string;
  stripeCustomerId?: string;
  paypalPayerId?: string;
  redsysToken?: string;
  
  // Estado
  predeterminado: boolean;
  activo: boolean;
  
  // Verificación
  verificado: boolean;
  fechaVerificacion?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const MetodoPagoSchema = new Schema<IMetodoPago>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    
    tipo: {
      type: String,
      enum: ['tarjeta', 'paypal'],
      required: true,
    },
    
    // Tarjeta
    ultimos4: String,
    marca: String,
    expMes: Number,
    expAno: Number,
    titular: String,
    
    // IDs externos
    stripePaymentMethodId: String,
    stripeCustomerId: String,
    paypalPayerId: String,
    redsysToken: String,
    
    // Estado
    predeterminado: {
      type: Boolean,
      default: false,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    
    // Verificación
    verificado: {
      type: Boolean,
      default: false,
    },
    fechaVerificacion: Date,
  },
  {
    timestamps: true,
  }
);

// Índices
MetodoPagoSchema.index({ empresaId: 1, predeterminado: 1 });
MetodoPagoSchema.index({ empresaId: 1, activo: 1 });
MetodoPagoSchema.index({ stripePaymentMethodId: 1 });
MetodoPagoSchema.index({ stripeCustomerId: 1 });

export default mongoose.model<IMetodoPago>('MetodoPago', MetodoPagoSchema);