import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

export interface ITipoGasto extends Document {
  _id: Types.ObjectId;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria?: 'material' | 'transporte' | 'dietas' | 'alojamiento' | 'herramientas' | 'subcontratacion' | 'otros';
  cuenta?: string; // Codigo contable
  ivaPorDefecto: number;
  facturable: boolean; // Por defecto facturable al cliente
  margenPorDefecto?: number; // Margen de beneficio por defecto
  orden: number;
  activo: boolean;
  creadoPor?: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const TipoGastoSchema = new Schema<ITipoGasto>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    codigo: {
      type: String,
      required: [true, 'El codigo es obligatorio'],
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
    categoria: {
      type: String,
      enum: ['material', 'transporte', 'dietas', 'alojamiento', 'herramientas', 'subcontratacion', 'otros'],
      default: 'otros',
    },
    cuenta: {
      type: String,
      trim: true,
    },
    ivaPorDefecto: {
      type: Number,
      default: 21,
      min: 0,
      max: 100,
    },
    facturable: {
      type: Boolean,
      default: true,
    },
    margenPorDefecto: {
      type: Number,
      default: 0,
      min: 0,
      max: 1000,
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDICES
// ============================================

// Codigo unico
TipoGastoSchema.index({ codigo: 1 }, { unique: true });

// Busquedas comunes
TipoGastoSchema.index({ activo: 1 });
TipoGastoSchema.index({ categoria: 1 });
TipoGastoSchema.index({ orden: 1 });

// Indice de texto para busqueda
TipoGastoSchema.index({
  nombre: 'text',
  descripcion: 'text',
  codigo: 'text',
});

// ============================================
// VIRTUALS
// ============================================

// Virtual para obtener etiqueta de la categoria
TipoGastoSchema.virtual('categoriaLabel').get(function() {
  const labels: Record<string, string> = {
    material: 'Material',
    transporte: 'Transporte',
    dietas: 'Dietas',
    alojamiento: 'Alojamiento',
    herramientas: 'Herramientas',
    subcontratacion: 'Subcontratacion',
    otros: 'Otros',
  };
  return this.categoria ? labels[this.categoria] || this.categoria : 'Otros';
});

TipoGastoSchema.set('toJSON', { virtuals: true });
TipoGastoSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT
// ============================================

export const TipoGasto = mongoose.model<ITipoGasto>('TipoGasto', TipoGastoSchema);
