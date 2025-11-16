import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPrecio {
  compra: number;
  venta: number;
  pvp: number; // Precio venta al público
  margen: number; // Porcentaje de margen
}

export interface IStock {
  cantidad: number;
  minimo: number; // Stock mínimo para alerta
  maximo: number; // Stock máximo
  ubicacion?: string; // Ubicación en almacén
}

// Valor de un atributo
export interface IValorAtributo {
  valor: string; // Ej: "M", "Rojo"
  hexColor?: string; // Para colores
  codigoProveedor?: string; // Código del proveedor para este valor
  activo: boolean;
}

// Atributo de variante (Talla, Color, Material, etc.)
export interface IAtributo {
  nombre: string; // Ej: "Talla", "Color"
  valores: IValorAtributo[]; // Los valores posibles
  tipoVisualizacion: 'botones' | 'dropdown' | 'colores'; // Cómo mostrar en UI
  obligatorio: boolean; // Si es obligatorio seleccionar
}

// Variante es una combinación específica de atributos
export interface IVariante {
  sku: string; // SKU único de la variante
  codigoBarras?: string;
  combinacion: Record<string, string>; // Ej: { talla: "M", color: "Rojo" }
  stock?: IStock;
  precioExtra: number; // Precio adicional sobre el precio base
  imagenes?: string[]; // Imágenes específicas de esta variante
  activo: boolean;
  peso?: number; // Peso específico si difiere
}

export interface IProducto extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Identificación
  nombre: string;
  descripcion?: string;
  sku: string; // Stock Keeping Unit
  codigoBarras?: string;
  referencia?: string; // Referencia del proveedor

  // Categorización
  familiaId?: Types.ObjectId; // Referencia a Familia
  marca?: string;
  tags: string[];

  // Tipo de producto
  tipo: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima';

  // Precios
  precios: IPrecio;

  // Stock (si no tiene variantes)
  stock: IStock;
  gestionaStock: boolean; // Si controla o no el inventario

  // Sistema de variantes (tallas, colores, etc.)
  tieneVariantes: boolean;
  atributos: IAtributo[]; // Definición de atributos (Talla, Color, etc.)
  variantes: IVariante[]; // Combinaciones generadas

  // Impuestos
  iva: number; // Porcentaje de IVA
  tipoImpuesto: 'iva' | 'igic' | 'exento';

  // Proveedor
  proveedorId?: Types.ObjectId;

  // Características físicas
  peso?: number; // kg
  dimensiones?: {
    largo: number; // cm
    ancho: number;
    alto: number;
  };

  // Imágenes
  imagenes: string[]; // URLs de imágenes
  imagenPrincipal?: string;

  // Estado
  activo: boolean;
  disponible: boolean; // Si está disponible para venta
  destacado: boolean;

  // Notas
  notas?: string;

  // Estadísticas
  estadisticas: {
    vecesVendido: number;
    ingresoTotal: number;
    ultimaVenta?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const PrecioSchema = new Schema({
  compra: { type: Number, default: 0, min: 0 },
  venta: { type: Number, required: true, min: 0 },
  pvp: { type: Number, default: 0, min: 0 },
  margen: { type: Number, default: 0 },
}, { _id: false });

const StockSchema = new Schema({
  cantidad: { type: Number, default: 0 },
  minimo: { type: Number, default: 0 },
  maximo: { type: Number, default: 0 },
  ubicacion: String,
}, { _id: false });

const ValorAtributoSchema = new Schema({
  valor: { type: String, required: true },
  hexColor: String,
  codigoProveedor: String,
  activo: { type: Boolean, default: true },
}, { _id: false });

const AtributoSchema = new Schema({
  nombre: { type: String, required: true },
  valores: [ValorAtributoSchema],
  tipoVisualizacion: {
    type: String,
    enum: ['botones', 'dropdown', 'colores'],
    default: 'botones',
  },
  obligatorio: { type: Boolean, default: true },
}, { _id: false });

const VarianteSchema = new Schema({
  sku: { type: String, required: true },
  codigoBarras: String,
  combinacion: {
    type: Schema.Types.Mixed,
    required: true,
  },
  stock: StockSchema,
  precioExtra: { type: Number, default: 0 },
  imagenes: [String],
  activo: { type: Boolean, default: true },
  peso: Number,
}, { _id: true });

const ProductoSchema = new Schema<IProducto>(
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
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'El SKU es obligatorio'],
      trim: true,
      uppercase: true,
    },
    codigoBarras: {
      type: String,
      trim: true,
    },
    referencia: {
      type: String,
      trim: true,
    },

    // Categorización
    familiaId: {
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    },
    marca: String,
    tags: [String],

    // Tipo de producto
    tipo: {
      type: String,
      enum: ['simple', 'variantes', 'compuesto', 'servicio', 'materia_prima'],
      default: 'simple',
    },

    // Precios
    precios: {
      type: PrecioSchema,
      required: true,
    },

    // Stock
    stock: {
      type: StockSchema,
      default: () => ({
        cantidad: 0,
        minimo: 0,
        maximo: 0,
      }),
    },
    gestionaStock: {
      type: Boolean,
      default: true,
    },

    // Variantes
    tieneVariantes: {
      type: Boolean,
      default: false,
    },
    atributos: [AtributoSchema],
    variantes: [VarianteSchema],

    // Impuestos
    iva: {
      type: Number,
      default: 21,
      min: 0,
      max: 100,
    },
    tipoImpuesto: {
      type: String,
      enum: ['iva', 'igic', 'exento'],
      default: 'iva',
    },

    // Proveedor
    proveedorId: {
      type: Schema.Types.ObjectId,
      ref: 'Proveedor',
    },

    // Características físicas
    peso: Number,
    dimensiones: {
      largo: Number,
      ancho: Number,
      alto: Number,
    },

    // Imágenes
    imagenes: [String],
    imagenPrincipal: String,

    // Estado
    activo: {
      type: Boolean,
      default: true,
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    destacado: {
      type: Boolean,
      default: false,
    },

    // Notas
    notas: String,

    // Estadísticas
    estadisticas: {
      vecesVendido: { type: Number, default: 0 },
      ingresoTotal: { type: Number, default: 0 },
      ultimaVenta: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Índices compuestos
ProductoSchema.index({ empresaId: 1, sku: 1 }, { unique: true });
ProductoSchema.index({ empresaId: 1, codigoBarras: 1 });
ProductoSchema.index({ empresaId: 1, activo: 1 });
ProductoSchema.index({ empresaId: 1, familiaId: 1 });
ProductoSchema.index({ empresaId: 1, marca: 1 });
ProductoSchema.index({ empresaId: 1, tags: 1 });
ProductoSchema.index({ empresaId: 1, disponible: 1 });
ProductoSchema.index({ empresaId: 1, tipo: 1 });

// Índice de texto para búsqueda
ProductoSchema.index({
  nombre: 'text',
  descripcion: 'text',
  sku: 'text',
  codigoBarras: 'text',
  marca: 'text',
});

// Calcular margen automáticamente antes de guardar
ProductoSchema.pre('save', function (next) {
  if (this.precios.compra > 0 && this.precios.venta > 0) {
    this.precios.margen = ((this.precios.venta - this.precios.compra) / this.precios.compra) * 100;
  }

  // Si no tiene PVP, usar precio de venta
  if (!this.precios.pvp || this.precios.pvp === 0) {
    this.precios.pvp = this.precios.venta;
  }

  // Si tiene variantes, establecer tipo
  if (this.tieneVariantes && this.variantes.length > 0) {
    this.tipo = 'variantes';
  }

  next();
});

// Virtual para stock total (incluyendo variantes)
ProductoSchema.virtual('stockTotal').get(function () {
  if (!this.tieneVariantes) {
    return this.stock.cantidad;
  }

  return this.variantes.reduce((total, variante) => {
    return total + (variante.stock?.cantidad || 0);
  }, 0);
});

// Virtual para obtener familia
ProductoSchema.virtual('familia', {
  ref: 'Familia',
  localField: 'familiaId',
  foreignField: '_id',
  justOne: true,
});

// Incluir virtuals en JSON
ProductoSchema.set('toJSON', { virtuals: true });
ProductoSchema.set('toObject', { virtuals: true });

export const Producto = mongoose.model<IProducto>('Producto', ProductoSchema);