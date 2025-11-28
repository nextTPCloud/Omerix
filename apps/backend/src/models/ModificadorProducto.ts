import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Modificador de Producto (Comentarios de cocina)
 * Representa modificaciones como "poco hecho", "sin sal", "extra queso", etc.
 */

export interface IModificadorProducto extends Document {
  grupoId?: mongoose.Types.ObjectId;            // Grupo al que pertenece
  nombre: string;                               // Ej: "Poco hecho", "Sin sal"
  nombreCorto?: string;                         // Para tickets: "P.HECHO", "S/SAL"
  codigo?: string;
  descripcion?: string;

  // Configuración de precio
  tipo: 'gratis' | 'cargo' | 'descuento';
  precioExtra: number;                          // Cargo o descuento
  porcentaje?: number;                          // Si es porcentaje en vez de fijo

  // Aplicación
  aplicaA: 'todos' | 'familias' | 'productos';
  familiasIds?: mongoose.Types.ObjectId[];
  productosIds?: mongoose.Types.ObjectId[];

  // Visualización en TPV
  color?: string;
  icono?: string;
  orden: number;
  mostrarEnTPV: boolean;                        // Si aparece como botón rápido

  // Comportamiento
  esMultiple: boolean;                          // Si se puede seleccionar varias veces
  cantidadMaxima?: number;                      // Máximo de veces que se puede aplicar
  obligatorio: boolean;                         // Si es obligatorio seleccionar del grupo

  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModificadorProductoSchema = new Schema<IModificadorProducto>(
  {
    grupoId: {
      type: Schema.Types.ObjectId,
      ref: 'GrupoModificadores',
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    nombreCorto: {
      type: String,
      trim: true,
      maxlength: 15,
    },
    codigo: {
      type: String,
      trim: true,
      uppercase: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    tipo: {
      type: String,
      enum: ['gratis', 'cargo', 'descuento'],
      default: 'gratis',
    },
    precioExtra: {
      type: Number,
      default: 0,
    },
    porcentaje: {
      type: Number,
    },
    aplicaA: {
      type: String,
      enum: ['todos', 'familias', 'productos'],
      default: 'todos',
    },
    familiasIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    }],
    productosIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Producto',
    }],
    color: {
      type: String,
      default: '#6b7280',
    },
    icono: String,
    orden: {
      type: Number,
      default: 0,
    },
    mostrarEnTPV: {
      type: Boolean,
      default: true,
    },
    esMultiple: {
      type: Boolean,
      default: false,
    },
    cantidadMaxima: {
      type: Number,
      default: 1,
    },
    obligatorio: {
      type: Boolean,
      default: false,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices (sin empresaId porque cada empresa tiene su propia BD)
ModificadorProductoSchema.index({ nombre: 1 }, { unique: true });
ModificadorProductoSchema.index({ grupoId: 1 });
ModificadorProductoSchema.index({ activo: 1 });

export const ModificadorProducto = mongoose.model<IModificadorProducto>('ModificadorProducto', ModificadorProductoSchema);
