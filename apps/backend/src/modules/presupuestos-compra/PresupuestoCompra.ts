import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoPresupuestoCompra {
  BORRADOR = 'borrador',
  ENVIADO = 'enviado',
  RECIBIDO = 'recibido',
  ACEPTADO = 'aceptado',
  RECHAZADO = 'rechazado',
  CONVERTIDO = 'convertido', // Convertido a pedido
  EXPIRADO = 'expirado',
  CANCELADO = 'cancelado',
}

export enum TipoLineaPresupuestoCompra {
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

export interface ILineaPresupuestoCompra {
  _id?: mongoose.Types.ObjectId;
  orden: number;
  tipo: TipoLineaPresupuestoCompra;

  // Producto/Servicio
  productoId?: mongoose.Types.ObjectId;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  sku?: string;
  codigoProveedor?: string;

  // Cantidades
  cantidad: number;
  unidad?: string;

  // Peso
  peso?: number; // Peso unitario en kg
  pesoTotal?: number; // Peso total de la línea (peso * cantidad)

  // Precios de compra
  precioUnitario: number; // Precio de compra unitario
  descuento: number;
  descuentoImporte: number;
  subtotal: number;
  iva: number;
  ivaImporte: number;
  total: number;

  // Precios de venta y margen
  precioVenta?: number; // PVP propuesto
  margenPorcentaje?: number; // Margen sobre coste
  margenImporte?: number; // Margen en €

  // Alternativas de precio (para comparar proveedores)
  precioAlternativo?: number;
  notasPrecio?: string;

  // Fechas
  fechaEntregaEstimada?: Date;

  // Almacen destino
  almacenDestinoId?: mongoose.Types.ObjectId;

  // Flags
  esEditable: boolean;
  incluidoEnTotal: boolean;

  // Notas
  notasInternas?: string;
}

export interface IDireccionEntrega {
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
}

export interface ICondicionesPresupuestoCompra {
  formaPagoId?: mongoose.Types.ObjectId;
  terminoPagoId?: mongoose.Types.ObjectId;
  diasPago?: number;
  portesPagados: boolean;
  portesImporte?: number;
  plazoEntrega?: string;
  garantia?: string;
  observaciones?: string;
}

export interface ITotalesPresupuestoCompra {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: {
    tipo: number;
    base: number;
    cuota: number;
  }[];
  totalIva: number;
  totalPresupuesto: number;
}

export interface IDocumentoPresupuestoCompra {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
}

export interface IHistorialPresupuestoCompra {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface IPresupuestoCompra extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificacion
  codigo: string;
  serie: string;
  numero: number;

  // Estado
  estado: EstadoPresupuestoCompra;

  // Prioridad
  prioridad: Prioridad;

  // Fechas
  fecha: Date;
  fechaSolicitud?: Date;
  fechaRecepcion?: Date;
  fechaValidez?: Date;
  fechaDecision?: Date;

  // Proveedor
  proveedorId: mongoose.Types.ObjectId;
  proveedorNombre: string;
  proveedorNif: string;
  proveedorEmail?: string;
  proveedorTelefono?: string;
  contactoProveedor?: string;

  // Entrega
  direccionEntrega?: IDireccionEntrega;

  // Referencias
  referenciaProveedor?: string;
  numeroPresupuestoProveedor?: string;

  // Titulo y descripcion
  titulo?: string;
  descripcion?: string;

  // Lineas
  lineas: ILineaPresupuestoCompra[];

  // Condiciones
  condiciones: ICondicionesPresupuestoCompra;

  // Totales
  totales: ITotalesPresupuestoCompra;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Textos
  observaciones?: string;
  observacionesInternas?: string;
  motivoRechazo?: string;

  // Documentos
  documentos: IDocumentoPresupuestoCompra[];

  // Conversiones
  pedidoCompraId?: mongoose.Types.ObjectId; // Si se convirtió a pedido

  // Historial
  historial: IHistorialPresupuestoCompra[];

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
  estaVigente: boolean;
  diasHastaExpiracion: number | null;
}

export interface IPresupuestoCompraModel extends Model<IPresupuestoCompra> {
  generarCodigo(serie?: string): Promise<{ codigo: string; serie: string; numero: number }>;
  obtenerEstadisticas(): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalImporte: number;
    pendientesDecision: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

const LineaPresupuestoCompraSchema = new Schema<ILineaPresupuestoCompra>({
  orden: { type: Number, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoLineaPresupuestoCompra),
    default: TipoLineaPresupuestoCompra.PRODUCTO,
  },

  // Producto
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  codigo: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  sku: { type: String, trim: true },
  codigoProveedor: { type: String, trim: true },

  // Cantidades
  cantidad: { type: Number, required: true, min: 0, default: 1 },
  unidad: { type: String, trim: true, default: 'ud' },

  // Peso
  peso: { type: Number, min: 0, default: 0 },
  pesoTotal: { type: Number, min: 0, default: 0 },

  // Precios de compra
  precioUnitario: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  descuentoImporte: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0, default: 0 },
  iva: { type: Number, required: true, default: 21 },
  ivaImporte: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0, default: 0 },

  // Precios de venta y margen
  precioVenta: { type: Number, min: 0, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
  margenImporte: { type: Number, default: 0 },

  // Alternativas
  precioAlternativo: { type: Number, min: 0 },
  notasPrecio: { type: String },

  // Fechas
  fechaEntregaEstimada: { type: Date },

  // Almacen
  almacenDestinoId: { type: Schema.Types.ObjectId, ref: 'Almacen' },

  // Flags
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },

  // Notas
  notasInternas: { type: String },
}, { _id: true });

const DireccionEntregaSchema = new Schema<IDireccionEntrega>({
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
}, { _id: false });

const CondicionesPresupuestoCompraSchema = new Schema<ICondicionesPresupuestoCompra>({
  formaPagoId: { type: Schema.Types.ObjectId, ref: 'FormaPago' },
  terminoPagoId: { type: Schema.Types.ObjectId, ref: 'TerminoPago' },
  diasPago: { type: Number, min: 0 },
  portesPagados: { type: Boolean, default: false },
  portesImporte: { type: Number, min: 0 },
  plazoEntrega: { type: String },
  garantia: { type: String },
  observaciones: { type: String },
}, { _id: false });

const DesgloseIvaSchema = new Schema({
  tipo: { type: Number, required: true },
  base: { type: Number, required: true },
  cuota: { type: Number, required: true },
}, { _id: false });

const TotalesPresupuestoCompraSchema = new Schema<ITotalesPresupuestoCompra>({
  subtotalBruto: { type: Number, default: 0, min: 0 },
  totalDescuentos: { type: Number, default: 0, min: 0 },
  subtotalNeto: { type: Number, default: 0, min: 0 },
  desgloseIva: { type: [DesgloseIvaSchema], default: [] },
  totalIva: { type: Number, default: 0, min: 0 },
  totalPresupuesto: { type: Number, default: 0, min: 0 },
}, { _id: false });

const DocumentoPresupuestoCompraSchema = new Schema<IDocumentoPresupuestoCompra>({
  nombre: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { _id: true });

const HistorialPresupuestoCompraSchema = new Schema<IHistorialPresupuestoCompra>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const PresupuestoCompraSchema = new Schema<IPresupuestoCompra, IPresupuestoCompraModel>({
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
    default: 'PSC', // Presupuesto Compra
  },
  numero: {
    type: Number,
    required: true,
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoPresupuestoCompra),
    default: EstadoPresupuestoCompra.BORRADOR,
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
  fechaSolicitud: { type: Date },
  fechaRecepcion: { type: Date },
  fechaValidez: { type: Date },
  fechaDecision: { type: Date },

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
  contactoProveedor: { type: String, trim: true },

  // Entrega
  direccionEntrega: { type: DireccionEntregaSchema },

  // Referencias
  referenciaProveedor: { type: String, trim: true },
  numeroPresupuestoProveedor: { type: String, trim: true },

  // Titulo y descripcion
  titulo: { type: String, trim: true },
  descripcion: { type: String },

  // Lineas
  lineas: {
    type: [LineaPresupuestoCompraSchema],
    default: [],
  },

  // Condiciones
  condiciones: {
    type: CondicionesPresupuestoCompraSchema,
    default: () => ({}),
  },

  // Totales
  totales: {
    type: TotalesPresupuestoCompraSchema,
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
  observacionesInternas: { type: String },
  motivoRechazo: { type: String },

  // Documentos
  documentos: {
    type: [DocumentoPresupuestoCompraSchema],
    default: [],
  },

  // Conversiones
  pedidoCompraId: { type: Schema.Types.ObjectId, ref: 'PedidoCompra' },

  // Historial
  historial: {
    type: [HistorialPresupuestoCompraSchema],
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
  collection: 'presupuestos_compra',
});

// ============================================
// INDICES
// ============================================

PresupuestoCompraSchema.index({ serie: 1, numero: 1 });
PresupuestoCompraSchema.index({ proveedorId: 1 });
PresupuestoCompraSchema.index({ estado: 1 });
PresupuestoCompraSchema.index({ prioridad: 1 });
PresupuestoCompraSchema.index({ fecha: -1 });
PresupuestoCompraSchema.index({ fechaValidez: 1 });
PresupuestoCompraSchema.index({ activo: 1 });
PresupuestoCompraSchema.index({ tags: 1 });
PresupuestoCompraSchema.index({ 'totales.totalPresupuesto': 1 });

// ============================================
// VIRTUALS
// ============================================

PresupuestoCompraSchema.virtual('estaVigente').get(function(this: IPresupuestoCompra) {
  if (!this.fechaValidez) return true;
  if (this.estado === EstadoPresupuestoCompra.EXPIRADO) return false;
  if (this.estado === EstadoPresupuestoCompra.CONVERTIDO) return false;
  if (this.estado === EstadoPresupuestoCompra.CANCELADO) return false;
  if (this.estado === EstadoPresupuestoCompra.RECHAZADO) return false;
  return new Date() <= this.fechaValidez;
});

PresupuestoCompraSchema.virtual('diasHastaExpiracion').get(function(this: IPresupuestoCompra) {
  if (!this.fechaValidez) return null;
  if (!this.estaVigente) return 0;
  const hoy = new Date();
  const diffTime = this.fechaValidez.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ============================================
// METODOS ESTATICOS
// ============================================

PresupuestoCompraSchema.statics.generarCodigo = async function(serie: string = 'PSC'): Promise<{ codigo: string; serie: string; numero: number }> {
  const año = new Date().getFullYear();

  const ultimoPresupuesto = await this.findOne({
    serie,
    codigo: new RegExp(`^${serie}${año}-\\d+$`),
  }).sort({ numero: -1 }).lean();

  let numero = 1;
  if (ultimoPresupuesto && ultimoPresupuesto.numero) {
    numero = ultimoPresupuesto.numero + 1;
  }

  const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

  return { codigo, serie, numero };
};

PresupuestoCompraSchema.statics.obtenerEstadisticas = async function() {
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
          totalImporte: { $sum: '$totales.totalPresupuesto' },
        },
      },
    ]),
    this.countDocuments({
      estado: {
        $in: [
          EstadoPresupuestoCompra.ENVIADO,
          EstadoPresupuestoCompra.RECIBIDO,
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
    pendientesDecision: pendientes,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

PresupuestoCompraSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const PresupuestoCompraModel = this.constructor as IPresupuestoCompraModel;
      const { codigo, serie, numero } = await PresupuestoCompraModel.generarCodigo(this.serie);
      this.codigo = codigo;
      this.serie = serie;
      this.numero = numero;
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Verificar si ha expirado
  if (this.fechaValidez && new Date() > this.fechaValidez) {
    if (this.estado === EstadoPresupuestoCompra.ENVIADO ||
        this.estado === EstadoPresupuestoCompra.RECIBIDO) {
      this.estado = EstadoPresupuestoCompra.EXPIRADO;
    }
  }

  next();
});

// ============================================
// CONFIGURACION DE JSON
// ============================================

PresupuestoCompraSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

PresupuestoCompraSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const PresupuestoCompra = mongoose.model<IPresupuestoCompra, IPresupuestoCompraModel>('PresupuestoCompra', PresupuestoCompraSchema);

export default PresupuestoCompra;
