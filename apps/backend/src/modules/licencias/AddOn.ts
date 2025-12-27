import mongoose, { Schema, Document } from 'mongoose';

export interface IAddOn extends Document {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;

  // Tipo de add-on
  tipo: 'modulo' | 'usuarios' | 'almacenamiento' | 'tokens' | 'otro';

  // Precios (IVA incluido)
  precioMensual: number;
  precioAnual?: number;

  // Para add-ons con cantidad (tokens, storage, usuarios)
  unidad?: string; // 'usuario', 'GB', 'tokens'
  cantidad?: number; // Cantidad incluida (ej: 10 GB, 1000 tokens)

  // Tipo de cobro
  esRecurrente: boolean; // true = mensual/anual, false = pago único

  // IDs en pasarelas de pago (para suscripciones)
  stripePriceId?: string;
  stripePriceIdAnual?: string;
  paypalPlanId?: string;
  paypalPlanIdAnual?: string;

  // Características que otorga
  caracteristicas?: string[];

  // Límites que modifica (se suman al plan base)
  limitesExtra?: {
    usuariosSimultaneos?: number; // Sesiones simultáneas adicionales
    usuariosTotales?: number;
    almacenamientoGB?: number;
    tokensIA?: number;
    tpvs?: number;
  };

  // Orden de visualización
  orden: number;
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
    icono: {
      type: String,
    },
    tipo: {
      type: String,
      enum: ['modulo', 'usuarios', 'almacenamiento', 'tokens', 'otro'],
      default: 'modulo',
    },
    precioMensual: {
      type: Number,
      required: true,
      default: 0,
    },
    precioAnual: {
      type: Number,
    },
    unidad: {
      type: String,
    },
    cantidad: {
      type: Number,
    },
    esRecurrente: {
      type: Boolean,
      default: true,
    },
    // IDs en pasarelas de pago
    stripePriceId: String,
    stripePriceIdAnual: String,
    paypalPlanId: String,
    paypalPlanIdAnual: String,
    caracteristicas: [{
      type: String,
    }],
    limitesExtra: {
      usuariosSimultaneos: { type: Number }, // Sesiones simultáneas adicionales
      usuariosTotales: { type: Number },
      almacenamientoGB: { type: Number },
      tokensIA: { type: Number },
      tpvs: { type: Number },
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

AddOnSchema.index({ activo: 1 });
AddOnSchema.index({ tipo: 1 });
AddOnSchema.index({ orden: 1 });

export default mongoose.model<IAddOn>('AddOn', AddOnSchema);