/**
 * UsuarioEmpresa - Relación entre usuarios y empresas
 *
 * Permite que un usuario tenga acceso a múltiples empresas
 * con diferentes roles en cada una.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUsuarioEmpresa extends Document {
  _id: Types.ObjectId;
  usuarioId: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Rol del usuario en esta empresa
  rol: 'admin' | 'gerente' | 'vendedor' | 'tecnico' | 'almacenero' | 'visualizador';

  // Rol personalizado (opcional)
  rolId?: Types.ObjectId;

  // Estado
  activo: boolean;

  // Es la empresa principal/predeterminada del usuario
  esPrincipal: boolean;

  // Fechas
  fechaAsignacion: Date;
  fechaRevocacion?: Date;

  // Quién asignó este acceso
  asignadoPor?: Types.ObjectId;

  // Permisos especiales para esta empresa (sobrescriben los del rol)
  permisosEspeciales?: {
    modulos?: string[];
    restricciones?: string[];
  };

  createdAt: Date;
  updatedAt: Date;
}

const UsuarioEmpresaSchema = new Schema<IUsuarioEmpresa>(
  {
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

    rol: {
      type: String,
      enum: ['admin', 'gerente', 'vendedor', 'tecnico', 'almacenero', 'visualizador'],
      required: [true, 'El rol es obligatorio'],
      default: 'visualizador',
    },

    rolId: {
      type: Schema.Types.ObjectId,
      ref: 'Rol',
    },

    activo: {
      type: Boolean,
      default: true,
      index: true,
    },

    esPrincipal: {
      type: Boolean,
      default: false,
    },

    fechaAsignacion: {
      type: Date,
      default: Date.now,
    },

    fechaRevocacion: {
      type: Date,
    },

    asignadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },

    permisosEspeciales: {
      modulos: [String],
      restricciones: [String],
    },
  },
  {
    timestamps: true,
    collection: 'usuarios_empresas',
  }
);

// Índice compuesto único: un usuario solo puede tener una relación activa con cada empresa
UsuarioEmpresaSchema.index(
  { usuarioId: 1, empresaId: 1 },
  { unique: true }
);

// Índice para buscar empresas de un usuario
UsuarioEmpresaSchema.index({ usuarioId: 1, activo: 1 });

// Índice para buscar usuarios de una empresa
UsuarioEmpresaSchema.index({ empresaId: 1, activo: 1 });

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtener todas las empresas a las que tiene acceso un usuario
 */
UsuarioEmpresaSchema.statics.getEmpresasDeUsuario = async function(
  usuarioId: string | Types.ObjectId
): Promise<IUsuarioEmpresa[]> {
  return this.find({
    usuarioId,
    activo: true,
  })
    .populate('empresaId', 'nombre nif email logo estado')
    .sort({ esPrincipal: -1, fechaAsignacion: 1 });
};

/**
 * Obtener todos los usuarios de una empresa
 */
UsuarioEmpresaSchema.statics.getUsuariosDeEmpresa = async function(
  empresaId: string | Types.ObjectId
): Promise<IUsuarioEmpresa[]> {
  return this.find({
    empresaId,
    activo: true,
  })
    .populate('usuarioId', 'nombre apellidos email avatar activo')
    .sort({ rol: 1, fechaAsignacion: 1 });
};

/**
 * Verificar si un usuario tiene acceso a una empresa
 */
UsuarioEmpresaSchema.statics.tieneAcceso = async function(
  usuarioId: string | Types.ObjectId,
  empresaId: string | Types.ObjectId
): Promise<boolean> {
  const relacion = await this.findOne({
    usuarioId,
    empresaId,
    activo: true,
  });
  return !!relacion;
};

/**
 * Obtener la relación usuario-empresa
 */
UsuarioEmpresaSchema.statics.getRelacion = async function(
  usuarioId: string | Types.ObjectId,
  empresaId: string | Types.ObjectId
): Promise<IUsuarioEmpresa | null> {
  return this.findOne({
    usuarioId,
    empresaId,
    activo: true,
  }).populate('empresaId', 'nombre nif email logo estado');
};

/**
 * Asignar usuario a empresa
 */
UsuarioEmpresaSchema.statics.asignarUsuario = async function(
  usuarioId: string | Types.ObjectId,
  empresaId: string | Types.ObjectId,
  rol: string,
  asignadoPor?: string | Types.ObjectId,
  esPrincipal: boolean = false
): Promise<IUsuarioEmpresa> {
  // Verificar si ya existe
  const existente = await this.findOne({ usuarioId, empresaId });

  if (existente) {
    // Reactivar si estaba inactivo
    existente.activo = true;
    existente.rol = rol;
    existente.fechaRevocacion = undefined;
    existente.esPrincipal = esPrincipal;
    await existente.save();
    return existente;
  }

  // Crear nueva relación
  return this.create({
    usuarioId,
    empresaId,
    rol,
    asignadoPor,
    esPrincipal,
    activo: true,
    fechaAsignacion: new Date(),
  });
};

/**
 * Revocar acceso de usuario a empresa
 */
UsuarioEmpresaSchema.statics.revocarAcceso = async function(
  usuarioId: string | Types.ObjectId,
  empresaId: string | Types.ObjectId
): Promise<boolean> {
  const result = await this.updateOne(
    { usuarioId, empresaId },
    {
      activo: false,
      fechaRevocacion: new Date(),
    }
  );
  return result.modifiedCount > 0;
};

// ============================================
// EXPORTAR
// ============================================

export interface IUsuarioEmpresaModel extends mongoose.Model<IUsuarioEmpresa> {
  getEmpresasDeUsuario(usuarioId: string | Types.ObjectId): Promise<IUsuarioEmpresa[]>;
  getUsuariosDeEmpresa(empresaId: string | Types.ObjectId): Promise<IUsuarioEmpresa[]>;
  tieneAcceso(usuarioId: string | Types.ObjectId, empresaId: string | Types.ObjectId): Promise<boolean>;
  getRelacion(usuarioId: string | Types.ObjectId, empresaId: string | Types.ObjectId): Promise<IUsuarioEmpresa | null>;
  asignarUsuario(
    usuarioId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    rol: string,
    asignadoPor?: string | Types.ObjectId,
    esPrincipal?: boolean
  ): Promise<IUsuarioEmpresa>;
  revocarAcceso(usuarioId: string | Types.ObjectId, empresaId: string | Types.ObjectId): Promise<boolean>;
}

const UsuarioEmpresa = mongoose.model<IUsuarioEmpresa, IUsuarioEmpresaModel>(
  'UsuarioEmpresa',
  UsuarioEmpresaSchema
);

export default UsuarioEmpresa;
