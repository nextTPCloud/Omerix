import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDatabaseConfig {
  host: string;
  port: number;
  name: string;
  user?: string;
  password?: string;
  uri?: string; // URI completa de MongoDB
}

export interface IEmpresa extends Document {
  _id: Types.ObjectId;
  nombre: string;
  nif: string;
  email: string;
  telefono?: string;
  direccion?: {
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
  };
  tipoNegocio: 'retail' | 'restauracion' | 'taller' | 'informatica' | 'servicios' | 'otro';
  estado: 'activa' | 'suspendida' | 'cancelada';
  fechaAlta: Date;

  // Configuración de base de datos dedicada
  databaseConfig: IDatabaseConfig;

  // IDs de pasarelas de pago
  stripeCustomerId?: string;
  paypalCustomerId?: string;
  redsysCustomerId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DatabaseConfigSchema = new Schema<IDatabaseConfig>({
  host: { type: String, required: true },
  port: { type: Number, required: true, default: 27017 },
  name: { type: String, required: true },
  user: { type: String },
  password: { type: String, select: false }, // No se devuelve por defecto por seguridad
  uri: { type: String, select: false }, // URI completa, tampoco se devuelve por defecto
}, { _id: false });

const EmpresaSchema = new Schema<IEmpresa>(
  {
     _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    nif: {
      type: String,
      required: [true, 'El NIF es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email no válido'],
    },
    telefono: {
      type: String,
      trim: true,
    },
    direccion: {
      calle: String,
      ciudad: String,
      provincia: String,
      codigoPostal: String,
      pais: { type: String, default: 'España' },
    },
    tipoNegocio: {
      type: String,
      enum: ['retail', 'restauracion', 'taller', 'informatica', 'servicios', 'otro'],
      default: 'retail',
    },
    estado: {
      type: String,
      enum: ['activa', 'suspendida', 'cancelada'],
      default: 'activa',
    },
    fechaAlta: {
      type: Date,
      default: Date.now,
    },

    // Configuración de base de datos dedicada para esta empresa
    databaseConfig: {
      type: DatabaseConfigSchema,
      required: true,
    },

    // IDs de pasarelas de pago
    stripeCustomerId: String,
    paypalCustomerId: String,
    redsysCustomerId: String,
  },
  {
    timestamps: true,
  }
);

// Índices adicionales (solo los que NO tienen unique: true en el campo)
// EmpresaSchema.index({ nif: 1 }); // ← ELIMINAR (ya tiene unique: true arriba)
// EmpresaSchema.index({ email: 1 }); // ← ELIMINAR (ya tiene unique: true arriba)
EmpresaSchema.index({ estado: 1 }); // Este sí, porque no está en el campo

export default mongoose.model<IEmpresa>('Empresa', EmpresaSchema);