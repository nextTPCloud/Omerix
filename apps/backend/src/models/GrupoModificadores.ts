import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Grupo de Modificadores
 * Agrupa modificadores relacionados: "Punto de cocción", "Alérgenos", "Extras", etc.
 */

export interface IGrupoModificadores extends Document {
  nombre: string;                               // Ej: "Punto de cocción", "Extras"
  codigo?: string;
  descripcion?: string;

  // Configuración de selección
  tipoSeleccion: 'unico' | 'multiple';          // Si solo puede elegir 1 o varios
  minimoSelecciones: number;                    // Mínimo a seleccionar (0 = opcional)
  maximoSelecciones?: number;                   // Máximo a seleccionar

  // Aplicación
  aplicaA: 'todos' | 'familias' | 'productos';
  familiasIds?: mongoose.Types.ObjectId[];
  productosIds?: mongoose.Types.ObjectId[];

  // Visualización
  color?: string;
  icono?: string;
  orden: number;
  mostrarEnTPV: boolean;
  colapsado: boolean;                           // Si inicia colapsado en TPV

  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GrupoModificadoresSchema = new Schema<IGrupoModificadores>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
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
    tipoSeleccion: {
      type: String,
      enum: ['unico', 'multiple'],
      default: 'unico',
    },
    minimoSelecciones: {
      type: Number,
      default: 0,
    },
    maximoSelecciones: {
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
      default: '#3b82f6',
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
    colapsado: {
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
GrupoModificadoresSchema.index({ nombre: 1 }, { unique: true });
GrupoModificadoresSchema.index({ activo: 1 });

export const GrupoModificadores = mongoose.model<IGrupoModificadores>('GrupoModificadores', GrupoModificadoresSchema);
