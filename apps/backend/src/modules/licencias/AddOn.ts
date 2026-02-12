import mongoose, { Schema, Document } from 'mongoose';

export interface IAddOn extends Document {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  slug: string;
  descripcion: string;

  // Precios (IVA incluido)
  precio: {
    mensual: number;
    anual: number;
  };

  // Módulos que incluye este add-on
  modulosIncluidos: string[];

  // Si es un add-on con cantidad variable (ej: usuarios extra, GB extra)
  tieneCantidad: boolean;
  unidad?: string; // 'usuarios', 'GB', 'tokens', etc.
  cantidadMinima?: number;
  cantidadMaxima?: number;
  precioPorUnidad?: number;

  // Tipo de add-on
  tipo: 'modulo' | 'usuarios' | 'almacenamiento' | 'tokens' | 'otro';
  esRecurrente: boolean; // Si se cobra cada mes/año

  // Si permite comprar múltiples unidades (ej: TPVs extra)
  permiteMultiples?: boolean;

  // Límites adicionales que añade este add-on
  limitesExtra?: {
    usuariosTotales?: number;
    almacenamientoGB?: number;
    tokensIA?: number;
    tpvs?: number;
    kioskos?: number;
  };

  // Características para mostrar en UI
  caracteristicas?: string[];

  // Estado
  activo: boolean;
  visible: boolean; // Si se muestra en la página de planes

  // Orden de visualización
  orden: number;

  // IDs en pasarelas de pago
  stripePriceId?: string;
  stripePriceIdAnual?: string;
  paypalPlanId?: string;
  paypalPlanIdAnual?: string;

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
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    precio: {
      mensual: { type: Number, required: true, default: 0 },
      anual: { type: Number, required: true, default: 0 },
    },
    modulosIncluidos: [{
      type: String,
      trim: true,
    }],
    tieneCantidad: {
      type: Boolean,
      default: false,
    },
    unidad: String,
    cantidadMinima: Number,
    cantidadMaxima: Number,
    precioPorUnidad: Number,
    tipo: {
      type: String,
      enum: ['modulo', 'usuarios', 'almacenamiento', 'tokens', 'otro'],
      default: 'modulo',
    },
    esRecurrente: {
      type: Boolean,
      default: true,
    },
    permiteMultiples: {
      type: Boolean,
      default: false,
    },
    limitesExtra: {
      usuariosTotales: Number,
      almacenamientoGB: Number,
      tokensIA: Number,
      tpvs: Number,
      kioskos: Number,
    },
    caracteristicas: [String],
    activo: {
      type: Boolean,
      default: true,
    },
    visible: {
      type: Boolean,
      default: true,
    },
    orden: {
      type: Number,
      default: 0,
    },
    // IDs en pasarelas de pago
    stripePriceId: String,
    stripePriceIdAnual: String,
    paypalPlanId: String,
    paypalPlanIdAnual: String,
  },
  {
    timestamps: true,
  }
);

// Índices (slug ya tiene unique: true en la definición del campo)
AddOnSchema.index({ activo: 1, visible: 1 });

export default mongoose.model<IAddOn>('AddOn', AddOnSchema);
