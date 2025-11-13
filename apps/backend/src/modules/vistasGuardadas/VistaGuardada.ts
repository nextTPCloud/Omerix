import mongoose, { Schema, Document } from 'mongoose';
import { IModuleConfig } from '../configuracion-usuario/ConfiguracionUsuario';

/**
 * ============================================
 * INTERFACES - VISTAS GUARDADAS
 * ============================================
 */

export interface IVistaGuardada extends Document {
  _id: mongoose.Types.ObjectId;
  usuarioId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  modulo: string; // 'clientes', 'productos', etc.
  nombre: string; // Nombre personalizado de la vista
  descripcion?: string; // Descripción opcional
  configuracion: IModuleConfig; // Configuración completa del módulo
  esDefault?: boolean; // Si es la vista por defecto para este módulo
  compartida?: boolean; // Si está compartida con otros usuarios
  icono?: string; // Icono opcional (lucide icon name)
  color?: string; // Color opcional para identificar la vista
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ============================================
 * SCHEMA
 * ============================================
 */

const VistaGuardadaSchema = new Schema<IVistaGuardada>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario es obligatorio'],
      index: true,
    },
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'La empresa es obligatoria'],
      index: true,
    },
    modulo: {
      type: String,
      required: [true, 'El módulo es obligatorio'],
      index: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la vista es obligatorio'],
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    },
    descripcion: {
      type: String,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
    },
    configuracion: {
      type: Schema.Types.Mixed,
      required: [true, 'La configuración es obligatoria'],
    },
    esDefault: {
      type: Boolean,
      default: false,
    },
    compartida: {
      type: Boolean,
      default: false,
    },
    icono: {
      type: String,
      default: 'Eye',
    },
    color: {
      type: String,
      default: 'blue',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ============================================
 * ÍNDICES
 * ============================================
 */

// Índice compuesto para búsquedas rápidas
VistaGuardadaSchema.index({ usuarioId: 1, empresaId: 1, modulo: 1 });

// Índice único para vista default por módulo y usuario
VistaGuardadaSchema.index(
  { usuarioId: 1, empresaId: 1, modulo: 1, esDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { esDefault: true },
  }
);

/**
 * ============================================
 * MÉTODOS
 * ============================================
 */

// Antes de guardar, si es default, quitar el default de las demás vistas del mismo módulo
VistaGuardadaSchema.pre('save', async function (next) {
  if (this.isModified('esDefault') && this.esDefault) {
    await mongoose.model('VistaGuardada').updateMany(
      {
        usuarioId: this.usuarioId,
        empresaId: this.empresaId,
        modulo: this.modulo,
        _id: { $ne: this._id },
      },
      { $set: { esDefault: false } }
    );
  }
  next();
});

/**
 * ============================================
 * EXPORT
 * ============================================
 */

export default mongoose.model<IVistaGuardada>(
  'VistaGuardada',
  VistaGuardadaSchema
);