import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

export interface IVencimiento {
  dias: number;           // Días desde la fecha de factura
  porcentaje: number;     // Porcentaje del total a pagar
}

export interface ITerminoPago extends Document {
  _id: Types.ObjectId;
  codigo: string;
  nombre: string;
  descripcion?: string;
  vencimientos: IVencimiento[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const VencimientoSchema = new Schema<IVencimiento>({
  dias: {
    type: Number,
    required: [true, 'Los días son obligatorios'],
    min: [0, 'Los días no pueden ser negativos'],
  },
  porcentaje: {
    type: Number,
    required: [true, 'El porcentaje es obligatorio'],
    min: [0, 'El porcentaje no puede ser negativo'],
    max: [100, 'El porcentaje no puede ser mayor a 100'],
  },
}, { _id: false });

const TerminoPagoSchema = new Schema<ITerminoPago>(
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
    vencimientos: {
      type: [VencimientoSchema],
      default: [{ dias: 0, porcentaje: 100 }], // Por defecto: pago al contado
      validate: {
        validator: function(v: IVencimiento[]) {
          if (!v || v.length === 0) return false;
          const totalPorcentaje = v.reduce((sum, venc) => sum + venc.porcentaje, 0);
          return Math.abs(totalPorcentaje - 100) < 0.01; // Tolerancia para decimales
        },
        message: 'La suma de los porcentajes de los vencimientos debe ser 100%',
      },
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
TerminoPagoSchema.index({ codigo: 1 }, { unique: true });

// Búsquedas comunes
TerminoPagoSchema.index({ activo: 1 });
TerminoPagoSchema.index({ nombre: 1 });

// Índice de texto para búsqueda
TerminoPagoSchema.index({
  nombre: 'text',
  descripcion: 'text',
  codigo: 'text',
});

// ============================================
// VIRTUALS
// ============================================

// Virtual para obtener descripción resumida de vencimientos
TerminoPagoSchema.virtual('resumenVencimientos').get(function() {
  if (!this.vencimientos || this.vencimientos.length === 0) {
    return 'Sin vencimientos';
  }

  if (this.vencimientos.length === 1 && this.vencimientos[0].dias === 0) {
    return 'Pago al contado';
  }

  return this.vencimientos
    .map(v => `${v.porcentaje}% a ${v.dias} días`)
    .join(', ');
});

TerminoPagoSchema.set('toJSON', { virtuals: true });
TerminoPagoSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT
// ============================================

export const TerminoPago = mongoose.model<ITerminoPago>('TerminoPago', TerminoPagoSchema);
