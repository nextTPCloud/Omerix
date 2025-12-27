import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IPermisosEspeciales, PERMISOS_ESPECIALES_DEFAULT } from '../roles/Rol';

/**
 * Permisos personalizados del usuario (sobrescriben los del rol)
 */
export interface IPermisosUsuario {
  especiales?: Partial<IPermisosEspeciales>;
}

export interface IUsuario extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  avatar?: string;

  // Rol y permisos
  rol: string;  // Puede ser rol del sistema o personalizado
  rolId?: Types.ObjectId;  // Referencia a rol personalizado (opcional)
  permisos: IPermisosUsuario;

  // Vinculación con personal (empleado)
  personalId?: Types.ObjectId;
  
  // 2FA
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorPhone?: string;
  twoFactorMethod?: 'app' | 'sms' | null;
  
  // Estado
  activo: boolean;
  emailVerificado: boolean;
  ultimoAcceso?: Date;

  // TPV - PIN para acceso rapido en punto de venta
  pinTPV?: string;
    // Reset de contraseña ← AÑADIR AQUÍ
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  
  // Preferencias
  preferencias: {
    idioma: string;
    tema: 'light' | 'dark';
    notificaciones: any;
  };
  
  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  
  createdAt: Date;
  updatedAt: Date;
}

const UsuarioSchema = new Schema<IUsuario>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'La empresa es obligatoria'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email no válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    apellidos: {
      type: String,
      required: [true, 'Los apellidos son obligatorios'],
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    
    // Rol y permisos (acepta roles del sistema y personalizados)
    rol: {
      type: String,
      required: [true, 'El rol es obligatorio'],
      default: 'vendedor',
      trim: true,
      lowercase: true,
    },
    rolId: {
      type: Schema.Types.ObjectId,
      ref: 'Rol',
      index: true,
    },
    permisos: {
      especiales: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },

    // Vinculación con personal (empleado)
    personalId: {
      type: Schema.Types.ObjectId,
      ref: 'Personal',
      index: true,
    },
    
    // 2FA
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorPhone: {
      type: String,
    },
    twoFactorMethod: {
      type: String,
      enum: ['app', 'sms', null],
      default: null,
    },
    
    // Estado
    activo: {
      type: Boolean,
      default: true,
    },
    emailVerificado: {
      type: Boolean,
      default: false,
    },
    ultimoAcceso: {
      type: Date,
    },

    // TPV - PIN para acceso rapido (4-6 digitos)
    pinTPV: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^\d{4,6}$/.test(v);
        },
        message: 'El PIN debe tener entre 4 y 6 digitos',
      },
    },

    // Después de ultimoAcceso, antes de preferencias:

    // Reset de contraseña
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    // Preferencias
    preferencias: {
      idioma: { type: String, default: 'es' },
      tema: { type: String, enum: ['light', 'dark'], default: 'light' },
      notificaciones: { type: Schema.Types.Mixed, default: {} },
    },
  },
  {
    timestamps: true,
  }
);

// Índices compuestos y adicionales
UsuarioSchema.index({ empresaId: 1, email: 1 }, { unique: true });
UsuarioSchema.index({ empresaId: 1, activo: 1 });
UsuarioSchema.index({ empresaId: 1, pinTPV: 1 }); // Para login TPV por PIN
// UsuarioSchema.index({ email: 1 }); // ← ELIMINAR (ya tiene unique: true arriba)

// Middleware: Hashear password antes de guardar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar passwords
UsuarioSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// No devolver password en JSON
UsuarioSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete (ret as any).password;
    delete (ret as any).twoFactorSecret;
    return ret;
  },
});

export default mongoose.model<IUsuario>('Usuario', UsuarioSchema);