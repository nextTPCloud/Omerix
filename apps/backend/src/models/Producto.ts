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
  almacenId?: Types.ObjectId; // Referencia al almacén
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

// Precios específicos de una variante
export interface IPrecioVariante {
  compra: number;         // Precio de compra
  venta: number;          // Precio de venta (sin IVA)
  pvp: number;            // Precio venta al público
  margen?: number;        // Porcentaje de margen calculado
  usarPrecioBase?: boolean; // Si es true, usa los precios del producto padre
}

// Stock de variante por almacén
export interface IStockVarianteAlmacen {
  almacenId: Types.ObjectId;
  cantidad: number;
  minimo: number;
  maximo: number;
  ubicacion?: string;     // Pasillo, estantería, etc.
  ultimaActualizacion?: Date;
}

// Dimensiones de la variante (si difieren del producto base)
export interface IDimensionesVariante {
  largo: number;  // cm
  ancho: number;  // cm
  alto: number;   // cm
}

// Variante es una combinación específica de atributos con precios y stock propios
export interface IVariante {
  _id?: Types.ObjectId;
  sku: string;                              // SKU único de la variante
  codigoBarras?: string;                    // Código de barras principal
  codigosBarrasAlternativos?: string[];     // Códigos de barras alternativos
  combinacion: Record<string, string>;      // Ej: { talla: "M", color: "Rojo" }

  // Precios específicos de la variante
  precios: IPrecioVariante;

  // Stock multi-almacén
  stockPorAlmacen: IStockVarianteAlmacen[];

  // Imágenes específicas de esta variante
  imagenes?: string[];

  // Características físicas (si difieren del producto base)
  peso?: number;
  dimensiones?: IDimensionesVariante;

  // Estado
  activo: boolean;

  // Referencia del proveedor para esta variante específica
  referenciaProveedor?: string;

  // Notas internas
  notas?: string;
}

// Trazabilidad para números de serie
export interface INumeroSerie {
  numero: string;
  estado: 'disponible' | 'vendido' | 'defectuoso' | 'reservado';
  almacenId?: Types.ObjectId;
  fechaEntrada: Date;
  fechaSalida?: Date;
  clienteId?: Types.ObjectId; // Si está vendido
  notas?: string;
}

// Trazabilidad para lotes
export interface ILote {
  numero: string;
  cantidad: number;
  fechaFabricacion?: Date;
  fechaCaducidad?: Date;
  almacenId?: Types.ObjectId;
  proveedorId?: Types.ObjectId;
  estado: 'activo' | 'caducado' | 'retirado';
  notas?: string;
}

// Stock por almacén (multi-almacén)
export interface IStockAlmacen {
  almacenId: Types.ObjectId;
  cantidad: number;
  minimo: number;
  maximo: number;
  ubicacion?: string; // Pasillo, estantería, etc.
  ultimaActualizacion: Date;
}

// Componente de producto compuesto (kit/partidas)
export interface IComponenteKit {
  productoId: Types.ObjectId; // Producto que forma parte del kit
  cantidad: number; // Cantidad necesaria
  opcional: boolean; // Si el componente es opcional
  orden: number; // Orden de visualización
  // Precios del componente en el kit
  precioUnitarioOriginal?: number; // Precio original del producto
  precioUnitario?: number; // Precio modificado para el kit (si se quiere dar descuento)
  descuentoPorcentaje?: number; // Descuento aplicado (%)
  precioExtra?: number; // Suplemento adicional (para menus)
}

export interface IProducto extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Identificación
  nombre: string;
  descripcion?: string;
  descripcionCorta?: string; // Descripción breve para listados
  sku: string; // Stock Keeping Unit
  codigoBarras?: string;
  codigosAlternativos: string[]; // Códigos alternativos (proveedores, antiguos, etc.)
  referencia?: string; // Referencia del proveedor

  // Categorización
  familiaId?: Types.ObjectId; // Referencia a Familia
  marca?: string;
  tags: string[];

  // Estados y situaciones
  estadoId?: Types.ObjectId; // Referencia a Estado
  situacionId?: Types.ObjectId; // Referencia a Situación
  clasificacionId?: Types.ObjectId; // Referencia a Clasificación

  // Tipo de producto
  tipo: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima';

  // Kit/Partidas (para productos compuestos)
  componentesKit: IComponenteKit[]; // Componentes si es un producto tipo 'compuesto'

  // Precios
  precios: IPrecio;

  // Precios por cantidad (descuentos por volumen)
  preciosPorCantidad: Array<{
    cantidadMinima: number;
    precio: number;
    descuentoPorcentaje?: number;
  }>;

  // Stock (si no tiene variantes)
  stock: IStock;
  gestionaStock: boolean; // Si controla o no el inventario
  permitirStockNegativo: boolean; // Permitir ventas con stock negativo

  // Multi-almacén
  stockPorAlmacen: IStockAlmacen[]; // Stock distribuido por almacenes

  // Trazabilidad
  trazabilidad: {
    tipo: 'ninguna' | 'lote' | 'numero_serie'; // Tipo de trazabilidad
    lotes: ILote[]; // Si usa trazabilidad por lote
    numerosSerie: INumeroSerie[]; // Si usa números de serie
  };

  // Sistema de variantes (tallas, colores, etc.)
  tieneVariantes: boolean;
  atributos: IAtributo[]; // Definición de atributos (Talla, Color, etc.)
  variantes: IVariante[]; // Combinaciones generadas

  // Impuestos
  iva: number; // Porcentaje de IVA
  tipoImpuesto: 'iva' | 'igic' | 'exento';
  tipoImpuestoId?: Types.ObjectId; // Referencia a TipoImpuesto

  // Proveedor
  proveedorId?: Types.ObjectId;
  proveedorPrincipal?: {
    proveedorId: Types.ObjectId;
    referencia?: string;
    precioCompra?: number;
    plazoEntrega?: number; // días
  };

  // Características físicas
  peso?: number; // kg
  volumen?: number; // m³
  dimensiones?: {
    largo: number; // cm
    ancho: number;
    alto: number;
  };

  // Unidades
  unidadMedida?: string; // ej: 'unidades', 'kg', 'metros', 'litros'
  unidadesEmbalaje?: number; // Unidades por caja/embalaje
  pesoEmbalaje?: number; // Peso del embalaje completo

  // Imágenes
  imagenes: string[]; // URLs de imágenes
  imagenPrincipal?: string;

  // Estado
  activo: boolean;
  disponible: boolean; // Si está disponible para venta
  destacado: boolean;
  nuevo: boolean; // Producto nuevo
  oferta: boolean; // En oferta

  // TPV
  usarEnTPV: boolean; // Si el producto está disponible en el TPV
  permiteDescuento: boolean; // Si permite aplicar descuentos en TPV
  precioModificable: boolean; // Si el precio se puede modificar en TPV
  imprimirEnTicket: boolean; // Si aparece en el ticket

  // E-commerce
  publicarWeb: boolean; // Publicar en tienda online
  metaTitle?: string; // SEO
  metaDescription?: string; // SEO
  metaKeywords?: string[]; // SEO

  // Notas y observaciones
  notas?: string;
  notasInternas?: string; // Notas privadas, no visibles para clientes
  instruccionesUso?: string; // Instrucciones de uso del producto

  // Garantía y soporte
  garantiaMeses?: number; // Meses de garantía
  requiereInstalacion: boolean; // Si necesita instalación
  requiereMantenimiento: boolean; // Si necesita mantenimiento periódico

  // Estadísticas
  estadisticas: {
    vecesVendido: number;
    vecesComprado: number;
    ingresoTotal: number;
    costoTotal: number;
    ultimaVenta?: Date;
    ultimaCompra?: Date;
  };

  // Costes calculados (actualizados automáticamente por el sistema de stock)
  costes: {
    costeUltimo: number;           // Precio de la última compra
    costeMedio: number;            // Coste medio ponderado
    costeEstandar?: number;        // Coste estándar (fijo, definido manualmente)
    ultimaActualizacion?: Date;    // Fecha de última actualización de costes
  };

  // Auditoría
  creadoPor?: Types.ObjectId; // Usuario que creó
  modificadoPor?: Types.ObjectId; // Último usuario que modificó

  createdAt: Date;
  updatedAt: Date;
}

const PrecioSchema = new Schema({
  compra: { type: Number, default: 0, min: 0 },
  venta: { type: Number, required: true, min: 0, default: 0 }, // Permitir precio 0
  pvp: { type: Number, default: 0, min: 0 },
  margen: { type: Number, default: 0 },
}, { _id: false });

const StockSchema = new Schema({
  cantidad: { type: Number, default: 0 },
  minimo: { type: Number, default: 0 },
  maximo: { type: Number, default: 0 },
  ubicacion: String,
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen' },
}, { _id: false });

const NumeroSerieSchema = new Schema({
  numero: { type: String, required: true }, // No usar unique aqui, se valida a nivel de aplicacion
  estado: {
    type: String,
    enum: ['disponible', 'vendido', 'defectuoso', 'reservado'],
    default: 'disponible',
  },
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen' },
  fechaEntrada: { type: Date, default: Date.now },
  fechaSalida: Date,
  clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  notas: String,
}, { _id: true, timestamps: true });

const LoteSchema = new Schema({
  numero: { type: String, required: true },
  cantidad: { type: Number, required: true, min: 0 },
  fechaFabricacion: Date,
  fechaCaducidad: Date,
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen' },
  proveedorId: { type: Schema.Types.ObjectId, ref: 'Proveedor' },
  estado: {
    type: String,
    enum: ['activo', 'caducado', 'retirado'],
    default: 'activo',
  },
  notas: String,
}, { _id: true, timestamps: true });

const StockAlmacenSchema = new Schema({
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen', required: true },
  cantidad: { type: Number, default: 0, min: 0 },
  minimo: { type: Number, default: 0, min: 0 },
  maximo: { type: Number, default: 0, min: 0 },
  ubicacion: String,
  ultimaActualizacion: { type: Date, default: Date.now },
}, { _id: false });

const ComponenteKitSchema = new Schema({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidad: { type: Number, required: true, min: 1, default: 1 },
  opcional: { type: Boolean, default: false },
  orden: { type: Number, default: 0 },
  // Precios del componente
  precioUnitarioOriginal: { type: Number, min: 0 }, // Precio original del producto
  precioUnitario: { type: Number, min: 0 }, // Precio modificado para el kit
  descuentoPorcentaje: { type: Number, min: 0, max: 100, default: 0 }, // Descuento %
  precioExtra: { type: Number, min: 0, default: 0 }, // Suplemento
}, { _id: true });

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

// Schema para precios de variante
const PrecioVarianteSchema = new Schema({
  compra: { type: Number, default: 0, min: 0 },
  venta: { type: Number, default: 0, min: 0 },
  pvp: { type: Number, default: 0, min: 0 },
  margen: { type: Number, default: 0 },
  usarPrecioBase: { type: Boolean, default: false },
}, { _id: false });

// Schema para stock de variante por almacén
const StockVarianteAlmacenSchema = new Schema({
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen', required: true },
  cantidad: { type: Number, default: 0 },
  minimo: { type: Number, default: 0, min: 0 },
  maximo: { type: Number, default: 0, min: 0 },
  ubicacion: String,
  ultimaActualizacion: { type: Date, default: Date.now },
}, { _id: false });

// Schema para dimensiones de variante
const DimensionesVarianteSchema = new Schema({
  largo: { type: Number, min: 0 },
  ancho: { type: Number, min: 0 },
  alto: { type: Number, min: 0 },
}, { _id: false });

const VarianteSchema = new Schema({
  sku: { type: String, required: true },
  codigoBarras: String,
  codigosBarrasAlternativos: [String],
  combinacion: {
    type: Schema.Types.Mixed,
    required: true,
  },
  // Precios propios de la variante
  precios: {
    type: PrecioVarianteSchema,
    default: () => ({
      compra: 0,
      venta: 0,
      pvp: 0,
      margen: 0,
      usarPrecioBase: true,
    }),
  },
  // Stock multi-almacén
  stockPorAlmacen: {
    type: [StockVarianteAlmacenSchema],
    default: [],
  },
  imagenes: [String],
  peso: Number,
  dimensiones: DimensionesVarianteSchema,
  activo: { type: Boolean, default: true },
  referenciaProveedor: String,
  notas: String,
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
    descripcionCorta: {
      type: String,
      trim: true,
      maxlength: 200,
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
    codigosAlternativos: {
      type: [String],
      default: [],
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

    // Estados y situaciones
    estadoId: {
      type: Schema.Types.ObjectId,
      ref: 'Estado',
    },
    situacionId: {
      type: Schema.Types.ObjectId,
      ref: 'Situacion',
    },
    clasificacionId: {
      type: Schema.Types.ObjectId,
      ref: 'Clasificacion',
    },

    // Tipo de producto
    tipo: {
      type: String,
      enum: ['simple', 'variantes', 'compuesto', 'servicio', 'materia_prima'],
      default: 'simple',
    },

    // Kit/Partidas (para productos compuestos)
    componentesKit: {
      type: [ComponenteKitSchema],
      default: [],
    },

    // Precios
    precios: {
      type: PrecioSchema,
      required: true,
    },

    // Precios por cantidad
    preciosPorCantidad: [{
      cantidadMinima: { type: Number, required: true, min: 1 },
      precio: { type: Number, required: true, min: 0 },
      descuentoPorcentaje: Number,
    }],

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
    permitirStockNegativo: {
      type: Boolean,
      default: false,
    },

    // Multi-almacén
    stockPorAlmacen: [StockAlmacenSchema],

    // Trazabilidad
    trazabilidad: {
      tipo: {
        type: String,
        enum: ['ninguna', 'lote', 'numero_serie'],
        default: 'ninguna',
      },
      lotes: [LoteSchema],
      numerosSerie: [NumeroSerieSchema],
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
    tipoImpuestoId: {
      type: Schema.Types.ObjectId,
      ref: 'TipoImpuesto',
    },

    // Proveedor
    proveedorId: {
      type: Schema.Types.ObjectId,
      ref: 'Proveedor',
    },
    proveedorPrincipal: {
      proveedorId: { type: Schema.Types.ObjectId, ref: 'Proveedor' },
      referencia: String,
      precioCompra: Number,
      plazoEntrega: Number,
    },

    // Características físicas
    peso: Number,
    volumen: Number,
    dimensiones: {
      largo: Number,
      ancho: Number,
      alto: Number,
    },

    // Unidades
    unidadMedida: {
      type: String,
      default: 'unidades',
    },
    unidadesEmbalaje: Number,
    pesoEmbalaje: Number,

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
    nuevo: {
      type: Boolean,
      default: false,
    },
    oferta: {
      type: Boolean,
      default: false,
    },

    // TPV
    usarEnTPV: {
      type: Boolean,
      default: true,
    },
    permiteDescuento: {
      type: Boolean,
      default: true,
    },
    precioModificable: {
      type: Boolean,
      default: false,
    },
    imprimirEnTicket: {
      type: Boolean,
      default: true,
    },

    // E-commerce
    publicarWeb: {
      type: Boolean,
      default: false,
    },
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],

    // Notas
    notas: String,
    notasInternas: String,
    instruccionesUso: String,

    // Garantía
    garantiaMeses: Number,
    requiereInstalacion: {
      type: Boolean,
      default: false,
    },
    requiereMantenimiento: {
      type: Boolean,
      default: false,
    },

    // Estadísticas
    estadisticas: {
      vecesVendido: { type: Number, default: 0 },
      vecesComprado: { type: Number, default: 0 },
      ingresoTotal: { type: Number, default: 0 },
      costoTotal: { type: Number, default: 0 },
      ultimaVenta: Date,
      ultimaCompra: Date,
    },

    // Costes calculados (actualizados automáticamente por el sistema de stock)
    costes: {
      costeUltimo: { type: Number, default: 0, min: 0 },      // Última compra
      costeMedio: { type: Number, default: 0, min: 0 },       // Coste medio ponderado
      costeEstandar: { type: Number, min: 0 },                // Coste estándar manual
      ultimaActualizacion: Date,                               // Última actualización
    },

    // Auditoría
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
  codigosAlternativos: 'text',
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

// Virtual para stock total (incluyendo variantes y multi-almacén)
ProductoSchema.virtual('stockTotal').get(function () {
  if (!this.tieneVariantes) {
    // Para productos simples, sumar stock de todos los almacenes
    if (this.stockPorAlmacen && this.stockPorAlmacen.length > 0) {
      return this.stockPorAlmacen.reduce((total, almacen) => total + almacen.cantidad, 0);
    }
    return this.stock.cantidad;
  }

  // Para productos con variantes, sumar el stock de cada variante en cada almacén
  return this.variantes.reduce((total, variante) => {
    if (variante.stockPorAlmacen && variante.stockPorAlmacen.length > 0) {
      return total + variante.stockPorAlmacen.reduce((sum, almacen) => sum + almacen.cantidad, 0);
    }
    return total;
  }, 0);
});

// Virtual para obtener stock de una variante específica
ProductoSchema.virtual('stockPorVariante').get(function () {
  if (!this.tieneVariantes) return null;

  return this.variantes.map(variante => ({
    varianteId: variante._id,
    sku: variante.sku,
    combinacion: variante.combinacion,
    stockTotal: variante.stockPorAlmacen?.reduce((sum, a) => sum + a.cantidad, 0) || 0,
    stockPorAlmacen: variante.stockPorAlmacen || [],
  }));
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