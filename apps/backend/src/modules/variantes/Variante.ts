import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Variante (Atributos globales como Talla, Color, Material)
 * Representa un tipo de atributo que puede aplicarse a múltiples productos
 */

export interface IValorVariante {
  _id?: string;
  valor: string;                    // Ej: "S", "M", "L", "Rojo", "Azul"
  codigo?: string;                  // Código interno opcional
  hexColor?: string;                // Color hex para visualización (solo para colores)
  imagen?: string;                  // URL de imagen opcional
  orden: number;                    // Orden de visualización
  activo: boolean;
}

export interface IVariante extends Document {
  nombre: string;                   // Ej: "Talla", "Color", "Material"
  codigo?: string;                  // Código único dentro de la empresa
  descripcion?: string;
  tipoVisualizacion: 'botones' | 'dropdown' | 'colores' | 'imagenes';
  valores: IValorVariante[];
  obligatorio: boolean;             // Si es obligatorio seleccionar al vender
  aplicaA: 'todos' | 'familias' | 'productos';  // A qué productos aplica
  familiasIds?: mongoose.Types.ObjectId[];      // Si aplicaA = 'familias'
  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ValorVarianteSchema = new Schema<IValorVariante>({
  valor: { type: String, required: true },
  codigo: { type: String },
  hexColor: { type: String },
  imagen: { type: String },
  orden: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
});

const VarianteSchema = new Schema<IVariante>(
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
    tipoVisualizacion: {
      type: String,
      enum: ['botones', 'dropdown', 'colores', 'imagenes'],
      default: 'botones',
    },
    valores: [ValorVarianteSchema],
    obligatorio: {
      type: Boolean,
      default: true,
    },
    aplicaA: {
      type: String,
      enum: ['todos', 'familias', 'productos'],
      default: 'productos',
    },
    familiasIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    }],
    orden: {
      type: Number,
      default: 0,
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
VarianteSchema.index({ nombre: 1 }, { unique: true });
VarianteSchema.index({ codigo: 1 }, { sparse: true });
VarianteSchema.index({ activo: 1 });

export const Variante = mongoose.model<IVariante>('Variante', VarianteSchema);
