import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

/**
 * Precio especifico de un producto en la tarifa
 */
export interface IPrecioTarifa {
  productoId: Types.ObjectId;
  varianteId?: Types.ObjectId;
  // Precio fijo (alternativa a descuento)
  precio?: number;
  // Descuento % sobre precio base (alternativa a precio fijo)
  descuentoPorcentaje?: number;
  activo: boolean;
}

/**
 * Tarifa de precios para clientes
 */
export interface ITarifa extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Identificacion
  codigo: string;
  nombre: string;
  descripcion?: string;

  // Tipo de tarifa
  tipo: 'fija' | 'porcentaje';
  // Base sobre la que se calcula el % (solo si tipo='porcentaje')
  basePrecio: 'venta' | 'pvp';
  // % general para todos los productos (solo si tipo='porcentaje')
  porcentajeGeneral?: number;

  // Precios especificos por producto (sobreescriben el % general)
  precios: IPrecioTarifa[];

  // Vigencia
  fechaDesde?: Date;
  fechaHasta?: Date;

  // Restricciones por familia
  familiasIncluidas?: Types.ObjectId[];
  familiasExcluidas?: Types.ObjectId[];

  // Prioridad (para resolver conflictos si un cliente tiene varias tarifas)
  prioridad: number;

  // Estado
  activo: boolean;

  // Auditoria
  creadoPor?: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const PrecioTarifaSchema = new Schema<IPrecioTarifa>(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    varianteId: {
      type: Schema.Types.ObjectId,
      ref: 'Variante',
    },
    precio: {
      type: Number,
      min: 0,
    },
    descuentoPorcentaje: {
      type: Number,
      min: 0,
      max: 100,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const TarifaSchema = new Schema<ITarifa>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    codigo: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    tipo: {
      type: String,
      enum: ['fija', 'porcentaje'],
      default: 'fija',
    },
    basePrecio: {
      type: String,
      enum: ['venta', 'pvp'],
      default: 'venta',
    },
    porcentajeGeneral: {
      type: Number,
      min: -100, // Permite recargos negativos (precios mas altos)
      max: 100,
    },
    precios: {
      type: [PrecioTarifaSchema],
      default: [],
    },
    fechaDesde: {
      type: Date,
    },
    fechaHasta: {
      type: Date,
    },
    familiasIncluidas: [{
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    }],
    familiasExcluidas: [{
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    }],
    prioridad: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDICES
// ============================================

// Indice unico por codigo dentro de empresa
TarifaSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });

// Indice para buscar tarifas activas
TarifaSchema.index({ empresaId: 1, activo: 1 });

// Indice para buscar por producto en precios
TarifaSchema.index({ 'precios.productoId': 1 });

// Indice para vigencia
TarifaSchema.index({ empresaId: 1, fechaDesde: 1, fechaHasta: 1 });

// ============================================
// VIRTUALS
// ============================================

TarifaSchema.virtual('cantidadProductos').get(function () {
  return this.precios?.filter(p => p.activo).length || 0;
});

TarifaSchema.virtual('vigente').get(function () {
  if (!this.activo) return false;
  const ahora = new Date();
  if (this.fechaDesde && ahora < this.fechaDesde) return false;
  if (this.fechaHasta && ahora > this.fechaHasta) return false;
  return true;
});

// ============================================
// METODOS
// ============================================

/**
 * Obtiene el precio de un producto en esta tarifa
 */
TarifaSchema.methods.getPrecioProducto = function (
  productoId: string,
  varianteId?: string,
  precioBase?: number
): { precio?: number; descuento?: number } | null {
  // Buscar precio especifico del producto
  const precioProducto = this.precios.find((p: IPrecioTarifa) => {
    if (!p.activo) return false;
    if (p.productoId.toString() !== productoId) return false;
    if (varianteId && p.varianteId && p.varianteId.toString() !== varianteId) return false;
    return true;
  });

  if (precioProducto) {
    if (precioProducto.precio !== undefined && precioProducto.precio !== null) {
      return { precio: precioProducto.precio };
    }
    if (precioProducto.descuentoPorcentaje !== undefined) {
      return { descuento: precioProducto.descuentoPorcentaje };
    }
  }

  // Si no hay precio especifico, usar % general (si es tipo porcentaje)
  if (this.tipo === 'porcentaje' && this.porcentajeGeneral !== undefined && precioBase !== undefined) {
    return { descuento: this.porcentajeGeneral };
  }

  return null;
};

// ============================================
// MIDDLEWARE
// ============================================

// Generar codigo automatico si no se proporciona
TarifaSchema.pre('save', async function (next) {
  if (!this.codigo) {
    const TarifaModel = this.constructor as Model<ITarifa>;
    const count = await TarifaModel.countDocuments({ empresaId: this.empresaId });
    this.codigo = `TAR-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// ============================================
// EXPORT
// ============================================

export const Tarifa = mongoose.model<ITarifa>('Tarifa', TarifaSchema);

export default Tarifa;
