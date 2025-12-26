import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPlan extends Document {
  _id: Types.ObjectId;
  nombre: string;
  slug: string;
  descripcion?: string;
  precio: {
    mensual: number;
    anual: number;
  };
  
  // Límites del plan
  limites: {
    usuariosSimultaneos: number;
    usuariosTotales: number;
    facturasMes: number;
    productosCatalogo: number;
    almacenes: number;
    clientes: number;
    tpvsActivos: number;
    almacenamientoGB: number;
    llamadasAPIDia: number;
    emailsMes: number;
    smsMes: number;
    whatsappMes: number;
  };
  
  // Módulos incluidos
  modulosIncluidos: string[];
  
  // Estado
  activo: boolean;
  visible: boolean;
  
  // IDs en pasarelas de pago
  stripePriceId?: string; // Precio mensual
  stripePriceIdAnual?: string; // Precio anual
  paypalPlanId?: string; // Plan mensual en PayPal
  paypalPlanIdAnual?: string; // Plan anual en PayPal


  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
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
    precio: {
      mensual: {
        type: Number,
        required: true,
        default: 0,
      },
      anual: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    limites: {
      usuariosSimultaneos: { type: Number, default: -1 }, // -1 = ilimitado
      usuariosTotales: { type: Number, default: -1 },
      facturasMes: { type: Number, default: -1 },
      productosCatalogo: { type: Number, default: -1 },
      almacenes: { type: Number, default: -1 },
      clientes: { type: Number, default: -1 },
      tpvsActivos: { type: Number, default: -1 },
      almacenamientoGB: { type: Number, default: 1 },
      llamadasAPIDia: { type: Number, default: 1000 },
      emailsMes: { type: Number, default: 100 },
      smsMes: { type: Number, default: 0 },
      whatsappMes: { type: Number, default: 0 },
    },
    modulosIncluidos: {
      type: [String],
      default: ['clientes', 'productos', 'ventas', 'compras', 'inventario'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
    visible: {
      type: Boolean,
      default: true,
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

PlanSchema.index({ activo: 1, visible: 1 });

export default mongoose.model<IPlan>('Plan', PlanSchema);