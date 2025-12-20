import mongoose, { Schema, Document } from 'mongoose';

export interface IAddOn extends Document {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  slug: string;
  descripcion?: string;
  precioMensual: number;
  categoria: 'modulo' | 'recurso' | 'integracion' | 'otro';
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddOnSchema = new Schema<IAddOn>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    
    nombre: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    descripcion: {
      type: String,
    },
    precioMensual: {
      type: Number,
      required: true,
      default: 0,
    },
    categoria: {
      type: String,
      enum: ['modulo', 'recurso', 'integracion', 'otro'],
      default: 'modulo',
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

AddOnSchema.index({ activo: 1 });

export default mongoose.model<IAddOn>('AddOn', AddOnSchema);