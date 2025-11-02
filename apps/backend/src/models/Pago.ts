import mongoose, { Schema, Document } from 'mongoose';

export interface IPago extends Document {
  empresaId: mongoose.Types.ObjectId;
  
  // Referencia
  concepto: 'suscripcion' | 'upgrade' | 'addon' | 'factura' | 'otro';
  referenciaId?: mongoose.Types.ObjectId; // ID de licencia, factura, etc.
  descripcion: string;
  
  // Montos
  cantidad: number; // Cantidad en euros
  moneda: string; // EUR, USD, etc.
  impuestos?: number;
  total: number;
  
  // Pasarela de pago
  pasarela: 'stripe' | 'paypal' | 'redsys' | 'transferencia' | 'efectivo';
  
  // IDs de transacción externa
  transaccionExternaId?: string; // ID de Stripe, PayPal, Redsys
  clienteExternoId?: string; // Customer ID en la pasarela
  
  // Estado
  estado: 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'cancelado' | 'reembolsado';
  estadoDetalle?: string;
  
  // Método de pago
  metodoPago: {
    tipo: 'tarjeta' | 'paypal' | 'transferencia' | 'efectivo';
    ultimos4?: string; // Últimos 4 dígitos de tarjeta
    marca?: string; // Visa, Mastercard, etc.
  };
  
  // Fechas
  fechaPago?: Date;
  fechaReembolso?: Date;
  
  // Datos adicionales
  metadata?: Record<string, any>;
  
  // Facturación
  facturaId?: mongoose.Types.ObjectId;
  numeroFactura?: string;
  
  // Errores
  errorCodigo?: string;
  errorMensaje?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PagoSchema = new Schema<IPago>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    
    // Referencia
    concepto: {
      type: String,
      enum: ['suscripcion', 'upgrade', 'addon', 'factura', 'otro'],
      required: true,
    },
    referenciaId: {
      type: Schema.Types.ObjectId,
    },
    descripcion: {
      type: String,
      required: true,
    },
    
    // Montos
    cantidad: {
      type: Number,
      required: true,
      min: 0,
    },
    moneda: {
      type: String,
      default: 'EUR',
      uppercase: true,
    },
    impuestos: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Pasarela
    pasarela: {
      type: String,
      enum: ['stripe', 'paypal', 'redsys', 'transferencia', 'efectivo'],
      required: true,
    },
    
    // IDs externos
    transaccionExternaId: String,
    clienteExternoId: String,
    
    // Estado
    estado: {
      type: String,
      enum: ['pendiente', 'procesando', 'completado', 'fallido', 'cancelado', 'reembolsado'],
      default: 'pendiente',
      index: true,
    },
    estadoDetalle: String,
    
    // Método de pago
    metodoPago: {
      tipo: {
        type: String,
        enum: ['tarjeta', 'paypal', 'transferencia', 'efectivo'],
        required: true,
      },
      ultimos4: String,
      marca: String,
    },
    
    // Fechas
    fechaPago: Date,
    fechaReembolso: Date,
    
    // Metadata
    metadata: Schema.Types.Mixed,
    
    // Facturación
    facturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Factura',
    },
    numeroFactura: String,
    
    // Errores
    errorCodigo: String,
    errorMensaje: String,
  },
  {
    timestamps: true,
  }
);

// Índices
PagoSchema.index({ empresaId: 1, estado: 1 });
PagoSchema.index({ empresaId: 1, pasarela: 1 });
PagoSchema.index({ empresaId: 1, concepto: 1 });
PagoSchema.index({ transaccionExternaId: 1 });
PagoSchema.index({ clienteExternoId: 1 });
PagoSchema.index({ createdAt: -1 });

export default mongoose.model<IPago>('Pago', PagoSchema);