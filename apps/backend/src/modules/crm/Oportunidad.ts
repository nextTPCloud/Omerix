import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoOportunidad {
  ABIERTA = 'abierta',
  GANADA = 'ganada',
  PERDIDA = 'perdida',
  CANCELADA = 'cancelada',
}

// ============================================
// INTERFACES
// ============================================

export interface ILineaOportunidad {
  _id?: mongoose.Types.ObjectId;
  productoId?: mongoose.Types.ObjectId;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
}

export interface IOportunidad extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId?: mongoose.Types.ObjectId;

  // Relaciones
  clienteId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  contactoId?: mongoose.Types.ObjectId;

  // Datos
  nombre: string;
  descripcion?: string;

  // Pipeline
  etapaId: mongoose.Types.ObjectId;
  probabilidad: number;

  // Valores
  valorEstimado: number;
  moneda: string;

  // Fechas
  fechaCierreEstimada?: Date;
  fechaCierreReal?: Date;

  // Estado
  estado: EstadoOportunidad;
  motivoPerdida?: string;
  competidor?: string;

  // Productos/Servicios
  lineas?: ILineaOportunidad[];

  // Seguimiento
  asignadoA?: mongoose.Types.ObjectId;
  etiquetas?: string[];

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  actualizadoPor?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const LineaOportunidadSchema = new Schema<ILineaOportunidad>(
  {
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
    descripcion: { type: String, required: true, trim: true },
    cantidad: { type: Number, default: 1, min: 0 },
    precioUnitario: { type: Number, default: 0, min: 0 },
    descuento: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: true }
);

const OportunidadSchema = new Schema<IOportunidad>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa' },

    // Relaciones
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    contactoId: { type: Schema.Types.ObjectId },

    // Datos
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },

    // Pipeline
    etapaId: { type: Schema.Types.ObjectId, ref: 'EtapaPipeline', required: true },
    probabilidad: { type: Number, default: 0, min: 0, max: 100 },

    // Valores
    valorEstimado: { type: Number, default: 0, min: 0 },
    moneda: { type: String, default: 'EUR' },

    // Fechas
    fechaCierreEstimada: { type: Date },
    fechaCierreReal: { type: Date },

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoOportunidad),
      default: EstadoOportunidad.ABIERTA,
    },
    motivoPerdida: { type: String, trim: true },
    competidor: { type: String, trim: true },

    // Productos/Servicios
    lineas: [LineaOportunidadSchema],

    // Seguimiento
    asignadoA: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    etiquetas: [{ type: String, trim: true }],

    // Auditoría
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    actualizadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  },
  {
    timestamps: true,
    collection: 'oportunidades',
  }
);

// ============================================
// VIRTUALS
// ============================================

OportunidadSchema.virtual('valorPonderado').get(function () {
  return this.valorEstimado * (this.probabilidad / 100);
});

OportunidadSchema.virtual('totalLineas').get(function () {
  if (!this.lineas || this.lineas.length === 0) return 0;
  return this.lineas.reduce((sum, linea) => {
    const subtotal = linea.cantidad * linea.precioUnitario;
    const descuento = subtotal * ((linea.descuento || 0) / 100);
    return sum + (subtotal - descuento);
  }, 0);
});

// ============================================
// ÍNDICES
// ============================================

OportunidadSchema.index({ empresaId: 1 });
OportunidadSchema.index({ etapaId: 1 });
OportunidadSchema.index({ estado: 1 });
OportunidadSchema.index({ clienteId: 1 });
OportunidadSchema.index({ leadId: 1 });
OportunidadSchema.index({ asignadoA: 1 });
OportunidadSchema.index({ fechaCierreEstimada: 1 });
OportunidadSchema.index({ createdAt: -1 });
OportunidadSchema.index({ nombre: 'text', descripcion: 'text' });

// ============================================
// MODELO
// ============================================

export const Oportunidad: Model<IOportunidad> =
  mongoose.models.Oportunidad || mongoose.model<IOportunidad>('Oportunidad', OportunidadSchema);

export default Oportunidad;
