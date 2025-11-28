import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

export interface IClasificacion extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId?: mongoose.Types.ObjectId; // OPCIONAL: Multi-DB (cada empresa tiene su propia BD)

  // Datos básicos
  nombre: string;
  activo: boolean;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;
}

// Métodos estáticos del modelo
export interface IClasificacionModel extends Model<IClasificacion> {
  obtenerEstadisticas(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
  }>;
}

// ============================================
// SCHEMA
// ============================================

const ClasificacionSchema = new Schema<IClasificacion, IClasificacionModel>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  // Multi-DB: empresaId ya no es necesario (cada empresa tiene su propia BD)
  // Mantenido como opcional para compatibilidad con datos legacy
  empresaId: {
    type: Schema.Types.ObjectId,
    ref: 'Empresa',
    required: false,
    index: false,
  },

  // Datos básicos
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },

  // Estado
  activo: {
    type: Boolean,
    default: true,
  },

  // Auditoría
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  modificadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  fechaModificacion: {
    type: Date,
  },
}, {
  timestamps: false,
  collection: 'clasificaciones',
});

// ============================================
// ÍNDICES
// ============================================

// nombre ya tiene unique: true, lo que crea un índice automáticamente
ClasificacionSchema.index({ activo: 1 });

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

ClasificacionSchema.statics.obtenerEstadisticas = async function() {
  const [totales, activos, inactivos] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ activo: true }),
    this.countDocuments({ activo: false }),
  ]);

  return {
    total: totales,
    activos,
    inactivos,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

ClasificacionSchema.pre('save', async function(next) {
  if (this.isNew && !this._id) {
    this._id = new mongoose.Types.ObjectId();
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  next();
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================

ClasificacionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  }
});

ClasificacionSchema.set('toObject', {
  virtuals: true
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const Clasificacion = mongoose.model<IClasificacion, IClasificacionModel>('Clasificacion', ClasificacionSchema);
