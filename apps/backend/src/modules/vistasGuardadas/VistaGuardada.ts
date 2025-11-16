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
  empresaId?: mongoose.Types.ObjectId; // OPCIONAL: Multi-DB (cada empresa tiene su propia BD)
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
    // Multi-DB: empresaId ya no es necesario (cada empresa tiene su propia BD)
    // Mantenido como opcional para compatibilidad con datos legacy
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: false,
      index: false,
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
 * ÍNDICES (Multi-DB: Ya no necesitan empresaId)
 * ============================================
 */

// Índice compuesto para búsquedas rápidas (sin empresaId)
VistaGuardadaSchema.index({ usuarioId: 1, modulo: 1 });

// Índice único para vista default por módulo y usuario (sin empresaId)
VistaGuardadaSchema.index(
  { usuarioId: 1, modulo: 1, esDefault: 1 },
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

// Multi-DB: Antes de guardar, si es default, quitar el default de las demás vistas del mismo módulo
// Ya no necesita empresaId porque cada empresa tiene su propia BD
VistaGuardadaSchema.pre('save', async function (next) {
  if (this.isModified('esDefault') && this.esDefault) {
    await mongoose.model('VistaGuardada').updateMany(
      {
        usuarioId: this.usuarioId,
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