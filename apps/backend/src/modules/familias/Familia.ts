import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFamilia extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Identificación
  codigo: string; // Código único de familia
  nombre: string;
  descripcion?: string;

  // Jerarquía
  familiaPadreId?: Types.ObjectId; // Para subfamilias
  nivel: number; // Nivel en la jerarquía (0 = raíz, 1 = subfamilia, etc.)
  ruta: string[]; // Array de IDs de familias desde raíz hasta esta

  // Configuración
  imagenUrl?: string;
  color?: string; // Color para identificación visual
  icono?: string; // Icono representativo

  // Orden
  orden: number; // Para ordenar en listados

  // TPV
  usarEnTPV: boolean; // Mostrar en TPV
  posicionTPV?: number; // Posición visual en TPV
  descripcionAbreviada?: string; // Descripción corta para TPV

  // Módulos específicos
  obligatorio: boolean; // Para módulo de lavanderías
  renting: boolean; // Familia para renting

  // Estado
  activo: boolean;

  // Estadísticas
  estadisticas: {
    totalProductos: number;
    totalSubfamilias: number;
  };

  // Configuración de precios
  aplicarMargenAutomatico: boolean;
  margenPorDefecto?: number; // % de margen para productos de esta familia

  createdAt: Date;
  updatedAt: Date;
}

const FamiliaSchema = new Schema<IFamilia>(
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

    // Jerarquía
    familiaPadreId: {
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    },

    nivel: {
      type: Number,
      default: 0,
      min: 0,
    },

    ruta: [{
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    }],

    // Configuración
    imagenUrl: String,
    color: String,
    icono: String,

    // Orden
    orden: {
      type: Number,
      default: 0,
    },

    // TPV
    usarEnTPV: {
      type: Boolean,
      default: false,
    },
    posicionTPV: {
      type: Number,
      min: 0,
    },
    descripcionAbreviada: {
      type: String,
      trim: true,
    },

    // Módulos específicos
    obligatorio: {
      type: Boolean,
      default: false,
    },
    renting: {
      type: Boolean,
      default: false,
    },

    // Estado
    activo: {
      type: Boolean,
      default: true,
    },

    // Estadísticas
    estadisticas: {
      totalProductos: { type: Number, default: 0 },
      totalSubfamilias: { type: Number, default: 0 },
    },

    // Configuración de precios
    aplicarMargenAutomatico: {
      type: Boolean,
      default: false,
    },
    margenPorDefecto: {
      type: Number,
      min: 0,
      max: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
FamiliaSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });
FamiliaSchema.index({ empresaId: 1, familiaPadreId: 1 });
FamiliaSchema.index({ empresaId: 1, activo: 1 });
FamiliaSchema.index({ empresaId: 1, nivel: 1 });
FamiliaSchema.index({ nombre: 'text', descripcion: 'text', codigo: 'text' });

// NOTA: El middleware pre('save') para calcular nivel y ruta ha sido desactivado
// porque no funciona correctamente con la arquitectura multi-tenant (modelos dinámicos).
// El cálculo de nivel y ruta se hace ahora en el servicio (familias.service.ts)
// antes de crear/actualizar la familia.

// NOTA: El middleware post('save') para actualizar estadísticas del padre también
// ha sido desactivado por el mismo motivo (multi-tenant).
// Las estadísticas se calculan bajo demanda en el servicio.

// Virtual para obtener subfamilias
FamiliaSchema.virtual('subfamilias', {
  ref: 'Familia',
  localField: '_id',
  foreignField: 'familiaPadreId',
});

// Incluir virtuals en JSON
FamiliaSchema.set('toJSON', { virtuals: true });
FamiliaSchema.set('toObject', { virtuals: true });

export const Familia = mongoose.model<IFamilia>('Familia', FamiliaSchema);
