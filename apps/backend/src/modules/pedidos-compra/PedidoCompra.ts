import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoPedidoCompra {
  BORRADOR = 'borrador',
  ENVIADO = 'enviado',
  CONFIRMADO = 'confirmado',
  PARCIALMENTE_RECIBIDO = 'parcialmente_recibido',
  RECIBIDO = 'recibido',
  FACTURADO = 'facturado',
  CANCELADO = 'cancelado',
}

export enum TipoLineaCompra {
  PRODUCTO = 'producto',
  SERVICIO = 'servicio',
  TEXTO = 'texto',
  SUBTOTAL = 'subtotal',
  DESCUENTO = 'descuento',
}

export enum Prioridad {
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
}

// ============================================
// INTERFACES
// ============================================

export interface ILineaPedidoCompra {
  _id?: mongoose.Types.ObjectId;
  orden: number;
  tipo: TipoLineaCompra;

  // Producto/Servicio
  productoId?: mongoose.Types.ObjectId;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  sku?: string;
  codigoProveedor?: string; // Referencia del proveedor

  // Variante (para productos con variantes)
  variante?: {
    varianteId?: mongoose.Types.ObjectId;
    sku?: string;
    valores?: Record<string, string>; // { talla: "M", color: "Rojo" }
  };

  // Kit/Compuesto (si el producto es un kit)
  esKit?: boolean;
  componentesKit?: Array<{
    productoId: mongoose.Types.ObjectId;
    codigo?: string;
    nombre: string;
    cantidad: number;
    precioUnitario?: number;
  }>;

  // Cantidades
  cantidad: number;
  cantidadRecibida: number;
  cantidadPendiente: number;
  unidad?: string;

  // Precios
  precioUnitario: number;
  descuento: number;
  descuentoImporte: number;
  subtotal: number;
  iva: number;
  ivaImporte: number;
  total: number;

  // Fechas
  fechaEntregaPrevista?: Date;
  fechaRecepcion?: Date;

  // Almacen destino
  almacenDestinoId?: mongoose.Types.ObjectId;

  // Flags
  esEditable: boolean;
  incluidoEnTotal: boolean;

  // Notas
  notasInternas?: string;
}

export interface IDireccionRecepcion {
  tipo: 'empresa' | 'almacen' | 'personalizada';
  almacenId?: mongoose.Types.ObjectId;
  nombre?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  personaContacto?: string;
  telefonoContacto?: string;
  horarioRecepcion?: string;
  instrucciones?: string;
}

export interface ICondicionesCompra {
  formaPagoId?: mongoose.Types.ObjectId;
  terminoPagoId?: mongoose.Types.ObjectId;
  diasPago?: number;
  portesPagados: boolean;
  portesImporte?: number;
  observacionesEntrega?: string;
}

export interface ITotalesPedidoCompra {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: {
    tipo: number;
    base: number;
    cuota: number;
  }[];
  totalIva: number;
  totalPedido: number;
}

export interface IDocumentoPedidoCompra {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
}

export interface IHistorialPedidoCompra {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface IPedidoCompra extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificacion
  codigo: string;
  serie: string;
  numero: number;

  // Estado
  estado: EstadoPedidoCompra;

  // Prioridad
  prioridad: Prioridad;

  // Fechas
  fecha: Date;
  fechaEnvio?: Date;
  fechaConfirmacion?: Date;
  fechaEntregaPrevista?: Date;
  fechaRecepcion?: Date;

  // Proveedor
  proveedorId: mongoose.Types.ObjectId;
  proveedorNombre: string;
  proveedorNif: string;
  proveedorEmail?: string;
  proveedorTelefono?: string;

  // Recepcion
  direccionRecepcion?: IDireccionRecepcion;

  // Referencias
  referenciaProveedor?: string;
  numeroConfirmacion?: string;

  // Titulo y descripcion
  titulo?: string;
  descripcion?: string;

  // Lineas
  lineas: ILineaPedidoCompra[];

  // Condiciones
  condiciones: ICondicionesCompra;

  // Totales
  totales: ITotalesPedidoCompra;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Textos
  observaciones?: string;
  observacionesAlmacen?: string;

  // Documentos
  documentos: IDocumentoPedidoCompra[];

  // Historial
  historial: IHistorialPedidoCompra[];

  // Tags
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean;

  // Auditoria
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Virtuals
  porcentajeRecibido: number;
  estaCompleto: boolean;
  diasHastaEntrega: number | null;
}

export interface IPedidoCompraModel extends Model<IPedidoCompra> {
  generarCodigo(serie?: string): Promise<{ codigo: string; serie: string; numero: number }>;
  obtenerEstadisticas(): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalImporte: number;
    pendientesRecibir: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

const LineaPedidoCompraSchema = new Schema<ILineaPedidoCompra>({
  orden: { type: Number, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoLineaCompra),
    default: TipoLineaCompra.PRODUCTO,
  },

  // Producto
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  codigo: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  sku: { type: String, trim: true },
  codigoProveedor: { type: String, trim: true },

  // Variante
  variante: {
    varianteId: { type: Schema.Types.ObjectId },
    sku: { type: String, trim: true },
    valores: { type: Schema.Types.Mixed },
  },

  // Kit/Compuesto
  esKit: { type: Boolean, default: false },
  componentesKit: [{
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
    codigo: { type: String, trim: true },
    nombre: { type: String, trim: true },
    cantidad: { type: Number, min: 0 },
    precioUnitario: { type: Number, min: 0 },
  }],

  // Cantidades
  cantidad: { type: Number, required: true, min: 0, default: 1 },
  cantidadRecibida: { type: Number, default: 0, min: 0 },
  cantidadPendiente: { type: Number, default: 0, min: 0 },
  unidad: { type: String, trim: true, default: 'ud' },

  // Precios
  precioUnitario: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  descuentoImporte: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0, default: 0 },
  iva: { type: Number, required: true, default: 21 },
  ivaImporte: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0, default: 0 },

  // Fechas
  fechaEntregaPrevista: { type: Date },
  fechaRecepcion: { type: Date },

  // Almacen
  almacenDestinoId: { type: Schema.Types.ObjectId, ref: 'Almacen' },

  // Flags
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },

  // Notas
  notasInternas: { type: String },
}, { _id: true });

const DireccionRecepcionSchema = new Schema<IDireccionRecepcion>({
  tipo: {
    type: String,
    enum: ['empresa', 'almacen', 'personalizada'],
    default: 'empresa',
  },
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen' },
  nombre: { type: String, trim: true },
  calle: { type: String, trim: true },
  numero: { type: String, trim: true },
  piso: { type: String, trim: true },
  codigoPostal: { type: String, trim: true },
  ciudad: { type: String, trim: true },
  provincia: { type: String, trim: true },
  pais: { type: String, trim: true, default: 'España' },
  personaContacto: { type: String, trim: true },
  telefonoContacto: { type: String, trim: true },
  horarioRecepcion: { type: String, trim: true },
  instrucciones: { type: String },
}, { _id: false });

const CondicionesCompraSchema = new Schema<ICondicionesCompra>({
  formaPagoId: { type: Schema.Types.ObjectId, ref: 'FormaPago' },
  terminoPagoId: { type: Schema.Types.ObjectId, ref: 'TerminoPago' },
  diasPago: { type: Number, min: 0 },
  portesPagados: { type: Boolean, default: false },
  portesImporte: { type: Number, min: 0 },
  observacionesEntrega: { type: String },
}, { _id: false });

const DesgloseIvaSchema = new Schema({
  tipo: { type: Number, required: true },
  base: { type: Number, required: true },
  cuota: { type: Number, required: true },
}, { _id: false });

const TotalesPedidoCompraSchema = new Schema<ITotalesPedidoCompra>({
  subtotalBruto: { type: Number, default: 0, min: 0 },
  totalDescuentos: { type: Number, default: 0, min: 0 },
  subtotalNeto: { type: Number, default: 0, min: 0 },
  desgloseIva: { type: [DesgloseIvaSchema], default: [] },
  totalIva: { type: Number, default: 0, min: 0 },
  totalPedido: { type: Number, default: 0, min: 0 },
}, { _id: false });

const DocumentoPedidoCompraSchema = new Schema<IDocumentoPedidoCompra>({
  nombre: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { _id: true });

const HistorialPedidoCompraSchema = new Schema<IHistorialPedidoCompra>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const PedidoCompraSchema = new Schema<IPedidoCompra, IPedidoCompraModel>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },

  // Identificacion
  codigo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  serie: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    default: 'PC',
  },
  numero: {
    type: Number,
    required: true,
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoPedidoCompra),
    default: EstadoPedidoCompra.BORRADOR,
  },

  // Prioridad
  prioridad: {
    type: String,
    enum: Object.values(Prioridad),
    default: Prioridad.MEDIA,
  },

  // Fechas
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
  },
  fechaEnvio: { type: Date },
  fechaConfirmacion: { type: Date },
  fechaEntregaPrevista: { type: Date },
  fechaRecepcion: { type: Date },

  // Proveedor
  proveedorId: {
    type: Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: [true, 'El proveedor es obligatorio'],
  },
  proveedorNombre: {
    type: String,
    required: true,
    trim: true,
  },
  proveedorNif: {
    type: String,
    required: true,
    trim: true,
  },
  proveedorEmail: { type: String, trim: true },
  proveedorTelefono: { type: String, trim: true },

  // Recepcion
  direccionRecepcion: { type: DireccionRecepcionSchema },

  // Referencias
  referenciaProveedor: { type: String, trim: true },
  numeroConfirmacion: { type: String, trim: true },

  // Titulo y descripcion
  titulo: { type: String, trim: true },
  descripcion: { type: String },

  // Lineas
  lineas: {
    type: [LineaPedidoCompraSchema],
    default: [],
  },

  // Condiciones
  condiciones: {
    type: CondicionesCompraSchema,
    default: () => ({}),
  },

  // Totales
  totales: {
    type: TotalesPedidoCompraSchema,
    default: () => ({}),
  },

  // Descuento global
  descuentoGlobalPorcentaje: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  descuentoGlobalImporte: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Textos
  observaciones: { type: String },
  observacionesAlmacen: { type: String },

  // Documentos
  documentos: {
    type: [DocumentoPedidoCompraSchema],
    default: [],
  },

  // Historial
  historial: {
    type: [HistorialPedidoCompraSchema],
    default: [],
  },

  // Tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // Control
  activo: {
    type: Boolean,
    default: true,
  },
  bloqueado: {
    type: Boolean,
    default: false,
  },

  // Auditoria
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  modificadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  fechaModificacion: {
    type: Date,
  },
}, {
  timestamps: false,
  collection: 'pedidos_compra',
});

// ============================================
// INDICES
// ============================================

PedidoCompraSchema.index({ serie: 1, numero: 1 });
PedidoCompraSchema.index({ proveedorId: 1 });
PedidoCompraSchema.index({ estado: 1 });
PedidoCompraSchema.index({ prioridad: 1 });
PedidoCompraSchema.index({ fecha: -1 });
PedidoCompraSchema.index({ fechaEntregaPrevista: 1 });
PedidoCompraSchema.index({ activo: 1 });
PedidoCompraSchema.index({ tags: 1 });
PedidoCompraSchema.index({ 'totales.totalPedido': 1 });

// ============================================
// VIRTUALS
// ============================================

PedidoCompraSchema.virtual('porcentajeRecibido').get(function(this: IPedidoCompra) {
  if (!this.lineas || this.lineas.length === 0) return 0;

  const lineasConCantidad = this.lineas.filter(l => l.incluidoEnTotal && l.cantidad > 0);
  if (lineasConCantidad.length === 0) return 0;

  const totalCantidad = lineasConCantidad.reduce((sum, l) => sum + l.cantidad, 0);
  const totalRecibida = lineasConCantidad.reduce((sum, l) => sum + (l.cantidadRecibida || 0), 0);

  return totalCantidad > 0 ? Math.round((totalRecibida / totalCantidad) * 100) : 0;
});

PedidoCompraSchema.virtual('estaCompleto').get(function(this: IPedidoCompra) {
  return this.estado === EstadoPedidoCompra.RECIBIDO ||
         this.estado === EstadoPedidoCompra.FACTURADO ||
         this.porcentajeRecibido === 100;
});

PedidoCompraSchema.virtual('diasHastaEntrega').get(function(this: IPedidoCompra) {
  if (!this.fechaEntregaPrevista) return null;
  if (this.estado === EstadoPedidoCompra.RECIBIDO || this.estado === EstadoPedidoCompra.FACTURADO) return null;
  const hoy = new Date();
  const diffTime = this.fechaEntregaPrevista.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ============================================
// METODOS ESTATICOS
// ============================================

PedidoCompraSchema.statics.generarCodigo = async function(serie: string = 'PC'): Promise<{ codigo: string; serie: string; numero: number }> {
  const año = new Date().getFullYear();

  const ultimoPedido = await this.findOne({
    serie,
    codigo: new RegExp(`^${serie}${año}-\\d+$`),
  }).sort({ numero: -1 }).lean();

  let numero = 1;
  if (ultimoPedido && ultimoPedido.numero) {
    numero = ultimoPedido.numero + 1;
  }

  const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

  return { codigo, serie, numero };
};

PedidoCompraSchema.statics.obtenerEstadisticas = async function() {
  const [
    total,
    porEstado,
    totales,
    pendientes,
  ] = await Promise.all([
    this.countDocuments(),
    this.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: { activo: true } },
      {
        $group: {
          _id: null,
          totalImporte: { $sum: '$totales.totalPedido' },
        },
      },
    ]),
    this.countDocuments({
      estado: {
        $in: [
          EstadoPedidoCompra.ENVIADO,
          EstadoPedidoCompra.CONFIRMADO,
          EstadoPedidoCompra.PARCIALMENTE_RECIBIDO,
        ],
      },
    }),
  ]);

  const estadisticasPorEstado: Record<string, number> = {};
  porEstado.forEach((item: any) => {
    estadisticasPorEstado[item._id] = item.count;
  });

  return {
    total,
    porEstado: estadisticasPorEstado,
    totalImporte: totales[0]?.totalImporte || 0,
    pendientesRecibir: pendientes,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

PedidoCompraSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const PedidoCompraModel = this.constructor as IPedidoCompraModel;
      const { codigo, serie, numero } = await PedidoCompraModel.generarCodigo(this.serie);
      this.codigo = codigo;
      this.serie = serie;
      this.numero = numero;
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Calcular cantidades pendientes en lineas
  if (this.lineas) {
    this.lineas.forEach(linea => {
      linea.cantidadPendiente = Math.max(0, linea.cantidad - (linea.cantidadRecibida || 0));
    });
  }

  next();
});

// ============================================
// CONFIGURACION DE JSON
// ============================================

PedidoCompraSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

PedidoCompraSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const PedidoCompra = mongoose.model<IPedidoCompra, IPedidoCompraModel>('PedidoCompra', PedidoCompraSchema);

export default PedidoCompra;
