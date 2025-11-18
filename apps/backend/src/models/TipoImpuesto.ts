import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITipoImpuesto extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Identificación
  codigo: string; // Código único del impuesto (ej: IVA21, IVA10)
  nombre: string; // Nombre descriptivo
  descripcion?: string;

  // Configuración del impuesto
  porcentaje: number; // Porcentaje del impuesto (ej: 21, 10, 4)
  tipo: 'IVA' | 'IGIC' | 'IPSI' | 'OTRO'; // Tipo de impuesto

  // Recargo de equivalencia (para IVA)
  recargoEquivalencia: boolean;
  porcentajeRecargo?: number;

  // Estado
  activo: boolean;
  predeterminado: boolean; // Impuesto por defecto en productos

  createdAt: Date;
  updatedAt: Date;
}

const TipoImpuestoSchema = new Schema<ITipoImpuesto>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
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

    porcentaje: {
      type: Number,
      required: [true, 'El porcentaje es obligatorio'],
      min: [0, 'El porcentaje no puede ser negativo'],
      max: [100, 'El porcentaje no puede superar 100'],
    },

    tipo: {
      type: String,
      enum: ['IVA', 'IGIC', 'IPSI', 'OTRO'],
      default: 'IVA',
    },

    recargoEquivalencia: {
      type: Boolean,
      default: false,
    },

    porcentajeRecargo: {
      type: Number,
      min: 0,
      max: 100,
    },

    activo: {
      type: Boolean,
      default: true,
    },

    predeterminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
TipoImpuestoSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });
TipoImpuestoSchema.index({ empresaId: 1, activo: 1 });
TipoImpuestoSchema.index({ empresaId: 1, predeterminado: 1 });

// Middleware: Solo un impuesto puede ser predeterminado
TipoImpuestoSchema.pre('save', async function (next) {
  if (this.predeterminado && this.isModified('predeterminado')) {
    await mongoose.model('TipoImpuesto').updateMany(
      {
        empresaId: this.empresaId,
        _id: { $ne: this._id },
        predeterminado: true,
      },
      {
        predeterminado: false,
      }
    );
  }
  next();
});

export const TipoImpuesto = mongoose.model<ITipoImpuesto>('TipoImpuesto', TipoImpuestoSchema);
