import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

export interface IAlmacen extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Identificación
  codigo: string; // Código único del almacén
  nombre: string;
  descripcion?: string;

  // Ubicación
  direccion?: {
    calle: string;
    numero?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
  };

  // Configuración
  esPrincipal: boolean; // Si es el almacén principal
  activo: boolean;

  // Capacidad
  capacidadMaxima?: number; // En unidades, kg, m³, etc.
  unidadCapacidad?: 'unidades' | 'kg' | 'm3' | 'litros';

  // Contacto
  responsable?: string;
  telefono?: string;
  email?: string;

  // Configuración de TPV
  usarEnTPV: boolean; // Si aparece en el selector de almacén del TPV

  // Notas
  notas?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const DireccionAlmacenSchema = new Schema({
  calle: { type: String, required: true },
  numero: String,
  codigoPostal: { type: String, required: true },
  ciudad: { type: String, required: true },
  provincia: { type: String, required: true },
  pais: { type: String, required: true, default: 'España' },
}, { _id: false });

const AlmacenSchema = new Schema<IAlmacen>(
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

    // Identificación
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

    // Ubicación
    direccion: DireccionAlmacenSchema,

    // Configuración
    esPrincipal: {
      type: Boolean,
      default: false,
    },
    activo: {
      type: Boolean,
      default: true,
    },

    // Capacidad
    capacidadMaxima: {
      type: Number,
      min: 0,
    },
    unidadCapacidad: {
      type: String,
      enum: ['unidades', 'kg', 'm3', 'litros'],
      default: 'unidades',
    },

    // Contacto
    responsable: String,
    telefono: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // TPV
    usarEnTPV: {
      type: Boolean,
      default: true,
    },

    // Notas
    notas: String,
  },
  {
    timestamps: true,
  }
);

// ============================================
// ÍNDICES
// ============================================

// Código único por empresa
AlmacenSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });

// Búsquedas comunes
AlmacenSchema.index({ empresaId: 1, activo: 1 });
AlmacenSchema.index({ empresaId: 1, esPrincipal: 1 });
AlmacenSchema.index({ empresaId: 1, usarEnTPV: 1 });

// Índice de texto para búsqueda
AlmacenSchema.index({
  nombre: 'text',
  descripcion: 'text',
  codigo: 'text',
});

// ============================================
// MIDDLEWARE
// ============================================

// Solo puede haber un almacén principal por empresa
AlmacenSchema.pre('save', async function (next) {
  if (this.esPrincipal && this.isModified('esPrincipal')) {
    // Desmarcar otros almacenes principales de la misma empresa
    await mongoose.model('Almacen').updateMany(
      {
        empresaId: this.empresaId,
        _id: { $ne: this._id },
        esPrincipal: true,
      },
      { esPrincipal: false }
    );
  }
  next();
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

AlmacenSchema.statics.obtenerPrincipal = async function (empresaId: Types.ObjectId) {
  return this.findOne({ empresaId, esPrincipal: true, activo: true });
};

AlmacenSchema.statics.obtenerActivos = async function (empresaId: Types.ObjectId) {
  return this.find({ empresaId, activo: true }).sort({ nombre: 1 });
};

// ============================================
// VIRTUALS
// ============================================

AlmacenSchema.set('toJSON', { virtuals: true });
AlmacenSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT
// ============================================

export const Almacen = mongoose.model<IAlmacen>('Almacen', AlmacenSchema);
