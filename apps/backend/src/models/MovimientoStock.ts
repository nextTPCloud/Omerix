import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoMovimiento {
  ENTRADA_COMPRA = 'entrada_compra',           // Entrada por albarán de compra
  SALIDA_VENTA = 'salida_venta',               // Salida por albarán de venta
  DEVOLUCION_CLIENTE = 'devolucion_cliente',   // Entrada por devolución de cliente
  DEVOLUCION_PROVEEDOR = 'devolucion_proveedor', // Salida por devolución a proveedor
  AJUSTE_POSITIVO = 'ajuste_positivo',         // Ajuste manual (incremento)
  AJUSTE_NEGATIVO = 'ajuste_negativo',         // Ajuste manual (decremento)
  TRANSFERENCIA_ENTRADA = 'transferencia_entrada', // Entrada por transferencia entre almacenes
  TRANSFERENCIA_SALIDA = 'transferencia_salida',   // Salida por transferencia entre almacenes
  INVENTARIO_INICIAL = 'inventario_inicial',   // Carga inicial de stock
  REGULARIZACION = 'regularizacion',           // Ajuste por inventario físico
  MERMA = 'merma',                             // Pérdida por deterioro/caducidad
  PRODUCCION_ENTRADA = 'produccion_entrada',   // Entrada por fabricación
  PRODUCCION_SALIDA = 'produccion_salida',     // Salida de componentes para fabricación
}

export enum OrigenMovimiento {
  ALBARAN_VENTA = 'albaran_venta',
  ALBARAN_COMPRA = 'albaran_compra',
  PEDIDO_VENTA = 'pedido_venta',
  PEDIDO_COMPRA = 'pedido_compra',
  FACTURA_VENTA = 'factura_venta',
  FACTURA_COMPRA = 'factura_compra',
  AJUSTE_MANUAL = 'ajuste_manual',
  TRANSFERENCIA = 'transferencia',
  INVENTARIO = 'inventario',
  DEVOLUCION = 'devolucion',
  PRODUCCION = 'produccion',
}

// ============================================
// INTERFACES
// ============================================

export interface IMovimientoStock extends Document {
  _id: mongoose.Types.ObjectId;

  // Producto afectado
  productoId: mongoose.Types.ObjectId;
  productoCodigo: string;
  productoNombre: string;
  productoSku?: string;

  // Variante (si aplica)
  varianteId?: string;
  varianteSku?: string;
  varianteNombre?: string;

  // Almacén
  almacenId: mongoose.Types.ObjectId;
  almacenNombre: string;

  // Para transferencias
  almacenDestinoId?: mongoose.Types.ObjectId;
  almacenDestinoNombre?: string;

  // Tipo y origen
  tipo: TipoMovimiento;
  origen: OrigenMovimiento;

  // Documento origen
  documentoOrigenId?: mongoose.Types.ObjectId;
  documentoOrigenCodigo?: string;
  documentoOrigenTipo?: string;

  // Tercero (cliente/proveedor)
  terceroId?: mongoose.Types.ObjectId;
  terceroNombre?: string;
  terceroTipo?: 'cliente' | 'proveedor';

  // Cantidades
  cantidad: number;                    // Cantidad del movimiento (siempre positivo)
  stockAnterior: number;               // Stock antes del movimiento
  stockPosterior: number;              // Stock después del movimiento

  // Precios y costes
  precioUnitario: number;              // Precio unitario del movimiento
  costeUnitario: number;               // Coste unitario
  valorMovimiento: number;             // cantidad * costeUnitario

  // Trazabilidad
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: Date;
  ubicacion?: string;

  // Motivo y observaciones
  motivo?: string;
  observaciones?: string;

  // Auditoría
  usuarioId: mongoose.Types.ObjectId;
  usuarioNombre: string;
  fecha: Date;

  // Control
  anulado: boolean;
  fechaAnulacion?: Date;
  usuarioAnulacionId?: mongoose.Types.ObjectId;
  motivoAnulacion?: string;
  movimientoAnulacionId?: mongoose.Types.ObjectId; // Referencia al movimiento que lo anula

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IMovimientoStockModel extends Model<IMovimientoStock> {
  obtenerHistorialProducto(productoId: string, opciones?: {
    almacenId?: string;
    varianteId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    tipo?: TipoMovimiento;
    limit?: number;
  }): Promise<IMovimientoStock[]>;

  obtenerStockActual(productoId: string, almacenId?: string, varianteId?: string): Promise<number>;

  calcularCosteMedio(productoId: string, almacenId?: string): Promise<number>;

  calcularCosteUltimo(productoId: string): Promise<number>;

  obtenerValoracionInventario(almacenId?: string): Promise<{
    totalProductos: number;
    valorTotal: number;
    detalle: { productoId: string; cantidad: number; valoracion: number }[];
  }>;
}

// ============================================
// SCHEMA
// ============================================

const MovimientoStockSchema = new Schema<IMovimientoStock, IMovimientoStockModel>({
  // Producto
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: [true, 'El producto es obligatorio'],
    index: true,
  },
  productoCodigo: {
    type: String,
    required: true,
    trim: true,
  },
  productoNombre: {
    type: String,
    required: true,
    trim: true,
  },
  productoSku: {
    type: String,
    trim: true,
  },

  // Variante
  varianteId: {
    type: String,
    index: true,
  },
  varianteSku: {
    type: String,
    trim: true,
  },
  varianteNombre: {
    type: String,
    trim: true,
  },

  // Almacén
  almacenId: {
    type: Schema.Types.ObjectId,
    ref: 'Almacen',
    required: [true, 'El almacén es obligatorio'],
    index: true,
  },
  almacenNombre: {
    type: String,
    required: true,
    trim: true,
  },

  // Almacén destino (transferencias)
  almacenDestinoId: {
    type: Schema.Types.ObjectId,
    ref: 'Almacen',
  },
  almacenDestinoNombre: {
    type: String,
    trim: true,
  },

  // Tipo y origen
  tipo: {
    type: String,
    enum: Object.values(TipoMovimiento),
    required: [true, 'El tipo de movimiento es obligatorio'],
    index: true,
  },
  origen: {
    type: String,
    enum: Object.values(OrigenMovimiento),
    required: [true, 'El origen del movimiento es obligatorio'],
  },

  // Documento origen
  documentoOrigenId: {
    type: Schema.Types.ObjectId,
    index: true,
  },
  documentoOrigenCodigo: {
    type: String,
    trim: true,
  },
  documentoOrigenTipo: {
    type: String,
    trim: true,
  },

  // Tercero
  terceroId: {
    type: Schema.Types.ObjectId,
  },
  terceroNombre: {
    type: String,
    trim: true,
  },
  terceroTipo: {
    type: String,
    enum: ['cliente', 'proveedor'],
  },

  // Cantidades
  cantidad: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [0, 'La cantidad no puede ser negativa'],
  },
  stockAnterior: {
    type: Number,
    required: true,
    default: 0,
  },
  stockPosterior: {
    type: Number,
    required: true,
    default: 0,
  },

  // Precios
  precioUnitario: {
    type: Number,
    default: 0,
    min: 0,
  },
  costeUnitario: {
    type: Number,
    default: 0,
    min: 0,
  },
  valorMovimiento: {
    type: Number,
    default: 0,
  },

  // Trazabilidad
  lote: {
    type: String,
    trim: true,
    index: true,
  },
  numeroSerie: {
    type: String,
    trim: true,
    index: true,
  },
  fechaCaducidad: {
    type: Date,
  },
  ubicacion: {
    type: String,
    trim: true,
  },

  // Motivo
  motivo: {
    type: String,
    trim: true,
  },
  observaciones: {
    type: String,
  },

  // Auditoría
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  usuarioNombre: {
    type: String,
    required: true,
    trim: true,
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },

  // Control de anulación
  anulado: {
    type: Boolean,
    default: false,
  },
  fechaAnulacion: {
    type: Date,
  },
  usuarioAnulacionId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  motivoAnulacion: {
    type: String,
  },
  movimientoAnulacionId: {
    type: Schema.Types.ObjectId,
    ref: 'MovimientoStock',
  },
}, {
  timestamps: true,
  collection: 'movimientos_stock',
});

// ============================================
// ÍNDICES COMPUESTOS
// ============================================

MovimientoStockSchema.index({ productoId: 1, almacenId: 1, fecha: -1 });
MovimientoStockSchema.index({ productoId: 1, varianteId: 1, almacenId: 1, fecha: -1 });
MovimientoStockSchema.index({ documentoOrigenId: 1, documentoOrigenTipo: 1 });
MovimientoStockSchema.index({ terceroId: 1, terceroTipo: 1, fecha: -1 });
MovimientoStockSchema.index({ fecha: -1, tipo: 1 });
MovimientoStockSchema.index({ lote: 1, productoId: 1 });
MovimientoStockSchema.index({ numeroSerie: 1 });

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

MovimientoStockSchema.statics.obtenerHistorialProducto = async function(
  productoId: string,
  opciones: {
    almacenId?: string;
    varianteId?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    tipo?: TipoMovimiento;
    limit?: number;
  } = {}
): Promise<IMovimientoStock[]> {
  const filter: any = {
    productoId: new mongoose.Types.ObjectId(productoId),
    anulado: false,
  };

  if (opciones.almacenId) {
    filter.almacenId = new mongoose.Types.ObjectId(opciones.almacenId);
  }
  if (opciones.varianteId) {
    filter.varianteId = opciones.varianteId;
  }
  if (opciones.tipo) {
    filter.tipo = opciones.tipo;
  }
  if (opciones.fechaDesde || opciones.fechaHasta) {
    filter.fecha = {};
    if (opciones.fechaDesde) filter.fecha.$gte = opciones.fechaDesde;
    if (opciones.fechaHasta) filter.fecha.$lte = opciones.fechaHasta;
  }

  return this.find(filter)
    .sort({ fecha: -1 })
    .limit(opciones.limit || 100)
    .lean();
};

MovimientoStockSchema.statics.obtenerStockActual = async function(
  productoId: string,
  almacenId?: string,
  varianteId?: string
): Promise<number> {
  const filter: any = {
    productoId: new mongoose.Types.ObjectId(productoId),
    anulado: false,
  };

  if (almacenId) {
    filter.almacenId = new mongoose.Types.ObjectId(almacenId);
  }
  if (varianteId) {
    filter.varianteId = varianteId;
  }

  // Obtener el último movimiento para ese producto/almacén/variante
  const ultimoMovimiento = await this.findOne(filter)
    .sort({ fecha: -1, createdAt: -1 })
    .select('stockPosterior')
    .lean();

  return ultimoMovimiento?.stockPosterior || 0;
};

MovimientoStockSchema.statics.calcularCosteMedio = async function(
  productoId: string,
  almacenId?: string
): Promise<number> {
  const filter: any = {
    productoId: new mongoose.Types.ObjectId(productoId),
    anulado: false,
    tipo: { $in: [TipoMovimiento.ENTRADA_COMPRA, TipoMovimiento.INVENTARIO_INICIAL] },
    costeUnitario: { $gt: 0 },
  };

  if (almacenId) {
    filter.almacenId = new mongoose.Types.ObjectId(almacenId);
  }

  const resultado = await this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalCantidad: { $sum: '$cantidad' },
        totalValor: { $sum: { $multiply: ['$cantidad', '$costeUnitario'] } },
      },
    },
  ]);

  if (resultado.length === 0 || resultado[0].totalCantidad === 0) {
    return 0;
  }

  return resultado[0].totalValor / resultado[0].totalCantidad;
};

MovimientoStockSchema.statics.calcularCosteUltimo = async function(
  productoId: string
): Promise<number> {
  const ultimaEntrada = await this.findOne({
    productoId: new mongoose.Types.ObjectId(productoId),
    anulado: false,
    tipo: TipoMovimiento.ENTRADA_COMPRA,
    costeUnitario: { $gt: 0 },
  })
    .sort({ fecha: -1 })
    .select('costeUnitario')
    .lean();

  return ultimaEntrada?.costeUnitario || 0;
};

MovimientoStockSchema.statics.obtenerValoracionInventario = async function(
  almacenId?: string
): Promise<{
  totalProductos: number;
  valorTotal: number;
  detalle: { productoId: string; cantidad: number; valoracion: number }[];
}> {
  const matchStage: any = { anulado: false };
  if (almacenId) {
    matchStage.almacenId = new mongoose.Types.ObjectId(almacenId);
  }

  // Obtener stock actual por producto
  const resultado = await this.aggregate([
    { $match: matchStage },
    { $sort: { productoId: 1, almacenId: 1, varianteId: 1, fecha: -1 } },
    {
      $group: {
        _id: {
          productoId: '$productoId',
          almacenId: '$almacenId',
          varianteId: '$varianteId',
        },
        stockActual: { $first: '$stockPosterior' },
        ultimoCoste: { $first: '$costeUnitario' },
      },
    },
    {
      $group: {
        _id: '$_id.productoId',
        cantidad: { $sum: '$stockActual' },
        valoracion: { $sum: { $multiply: ['$stockActual', '$ultimoCoste'] } },
      },
    },
    {
      $project: {
        productoId: '$_id',
        cantidad: 1,
        valoracion: 1,
        _id: 0,
      },
    },
  ]);

  const totalProductos = resultado.length;
  const valorTotal = resultado.reduce((sum, item) => sum + item.valoracion, 0);

  return {
    totalProductos,
    valorTotal,
    detalle: resultado,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

MovimientoStockSchema.pre('save', function(next) {
  // Calcular valor del movimiento
  this.valorMovimiento = this.cantidad * this.costeUnitario;

  // Validar que stockPosterior sea coherente
  const esEntrada = [
    TipoMovimiento.ENTRADA_COMPRA,
    TipoMovimiento.DEVOLUCION_CLIENTE,
    TipoMovimiento.AJUSTE_POSITIVO,
    TipoMovimiento.TRANSFERENCIA_ENTRADA,
    TipoMovimiento.INVENTARIO_INICIAL,
    TipoMovimiento.PRODUCCION_ENTRADA,
  ].includes(this.tipo as TipoMovimiento);

  if (esEntrada) {
    this.stockPosterior = this.stockAnterior + this.cantidad;
  } else {
    this.stockPosterior = this.stockAnterior - this.cantidad;
  }

  next();
});

// ============================================
// CONFIGURACIÓN JSON
// ============================================

MovimientoStockSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const MovimientoStock = mongoose.model<IMovimientoStock, IMovimientoStockModel>(
  'MovimientoStock',
  MovimientoStockSchema
);

export default MovimientoStock;
