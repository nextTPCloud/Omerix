import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoAlbaran {
  BORRADOR = 'borrador',
  PENDIENTE_ENTREGA = 'pendiente_entrega',
  EN_TRANSITO = 'en_transito',
  ENTREGADO = 'entregado',
  ENTREGA_PARCIAL = 'entrega_parcial',
  RECHAZADO = 'rechazado',
  FACTURADO = 'facturado',
  ANULADO = 'anulado',
}

export enum TipoAlbaran {
  VENTA = 'venta',
  DEVOLUCION = 'devolucion',
  TRASLADO = 'traslado',
  PRESTAMO = 'prestamo',
}

export enum TipoLinea {
  PRODUCTO = 'producto',
  SERVICIO = 'servicio',
  KIT = 'kit',
  TEXTO = 'texto',
  SUBTOTAL = 'subtotal',
  DESCUENTO = 'descuento',
}

// ============================================
// INTERFACES
// ============================================

export interface IComponenteKit {
  productoId: mongoose.Types.ObjectId;
  nombre: string;
  sku?: string;
  cantidad: number;
  cantidadEntregada: number;
  precioUnitario: number;
  costeUnitario: number;
  descuento: number;
  iva: number;
  subtotal: number;
  opcional: boolean;
  seleccionado: boolean;
}

export interface IVarianteSeleccionada {
  varianteId?: string;
  sku: string;
  combinacion: Record<string, string>;
  precioAdicional: number;
  costeAdicional: number;
}

export interface ILineaAlbaran {
  _id?: mongoose.Types.ObjectId;
  orden: number;
  tipo: TipoLinea;

  // Producto/Servicio
  productoId?: mongoose.Types.ObjectId;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  descripcionLarga?: string;
  sku?: string;

  // Variante
  variante?: IVarianteSeleccionada;

  // Cantidades
  cantidadSolicitada: number; // Cantidad original del pedido
  cantidadEntregada: number; // Cantidad realmente entregada
  cantidadPendiente: number; // Cantidad que queda por entregar
  unidad?: string;

  // Lote y número de serie (para trazabilidad)
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: Date;

  // Precios
  precioUnitario: number;
  descuento: number;
  descuentoImporte: number;
  subtotal: number;
  iva: number;
  ivaImporte: number;
  total: number;

  // Costes
  costeUnitario: number;
  costeTotalLinea: number;

  // Márgenes
  margenUnitario: number;
  margenPorcentaje: number;
  margenTotalLinea: number;

  // Kit
  componentesKit?: IComponenteKit[];
  mostrarComponentes: boolean;

  // Ubicación en almacén
  almacenId?: mongoose.Types.ObjectId;
  ubicacion?: string;

  // Flags
  esEditable: boolean;
  incluidoEnTotal: boolean;

  // Referencia a línea de pedido original
  lineaPedidoId?: mongoose.Types.ObjectId;

  // Notas
  notasInternas?: string;
  notasEntrega?: string;
}

export interface IDireccionEntrega {
  tipo: 'cliente' | 'personalizada' | 'recogida';
  direccionId?: mongoose.Types.ObjectId;
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
  horarioEntrega?: string;
  instrucciones?: string;
}

export interface IDatosTransporte {
  transportistaId?: mongoose.Types.ObjectId;
  nombreTransportista?: string;
  vehiculo?: string;
  matricula?: string;
  conductor?: string;
  telefonoConductor?: string;
  numeroSeguimiento?: string;
  costeEnvio?: number;
  seguroEnvio?: number;
  portesPagados: boolean;
}

export interface IDatosEntrega {
  fechaProgramada?: Date;
  fechaEntrega?: Date;
  horaEntrega?: string;
  receptorNombre?: string;
  receptorDni?: string;
  firmaDigital?: string; // Base64 de la firma
  observacionesEntrega?: string;
  fotosEntrega?: string[]; // URLs de fotos de la entrega
  incidencias?: string;
}

export interface IBultos {
  cantidad: number;
  peso?: number;
  volumen?: number;
  descripcion?: string;
}

export interface ITotalesAlbaran {
  subtotalBruto: number;
  totalDescuentos: number;
  subtotalNeto: number;
  desgloseIva: {
    tipo: number;
    base: number;
    cuota: number;
  }[];
  totalIva: number;
  totalAlbaran: number;
  costeTotalMateriales: number;
  costeTotalServicios: number;
  costeTotalKits: number;
  costeTotal: number;
  margenBruto: number;
  margenPorcentaje: number;
}

export interface IDocumentoAlbaran {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
  visibleCliente: boolean;
}

export interface IHistorialAlbaran {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface IAlbaran extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificación
  codigo: string;
  serie: string;
  numero: number;

  // Tipo de albarán
  tipo: TipoAlbaran;

  // Origen
  pedidoOrigenId?: mongoose.Types.ObjectId;
  presupuestoOrigenId?: mongoose.Types.ObjectId;

  // Estado
  estado: EstadoAlbaran;

  // Fechas
  fecha: Date;
  fechaVencimiento?: Date;

  // Cliente
  clienteId: mongoose.Types.ObjectId;
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;

  // Entrega
  direccionEntrega?: IDireccionEntrega;
  datosTransporte?: IDatosTransporte;
  datosEntrega?: IDatosEntrega;
  bultos?: IBultos;

  // Proyecto
  proyectoId?: mongoose.Types.ObjectId;

  // Almacén de salida
  almacenId?: mongoose.Types.ObjectId;

  // Agente comercial
  agenteComercialId?: mongoose.Types.ObjectId;

  // Referencias
  referenciaCliente?: string;
  pedidoCliente?: string;

  // Título y descripción
  titulo?: string;
  descripcion?: string;

  // Líneas
  lineas: ILineaAlbaran[];

  // Totales
  totales: ITotalesAlbaran;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Textos
  observaciones?: string;
  observacionesInternas?: string;
  condicionesEntrega?: string;

  // Documentos
  documentos: IDocumentoAlbaran[];

  // Historial
  historial: IHistorialAlbaran[];

  // Tags
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean;
  facturado: boolean;
  facturaId?: mongoose.Types.ObjectId;

  // Configuración de visualización
  mostrarCostes: boolean;
  mostrarMargenes: boolean;
  mostrarComponentesKit: boolean;
  mostrarPrecios: boolean;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Virtuals
  porcentajeEntregado: number;
  estaCompleto: boolean;
  diasDesdeCreacion: number;
  valorPendiente: number;
}

export interface IAlbaranModel extends Model<IAlbaran> {
  generarCodigo(serie?: string): Promise<{ codigo: string; serie: string; numero: number }>;
  obtenerEstadisticas(): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalImporte: number;
    totalEntregados: number;
    pendientesEntrega: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

const ComponenteKitSchema = new Schema<IComponenteKit>({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  nombre: { type: String, required: true, trim: true },
  sku: { type: String, trim: true },
  cantidad: { type: Number, required: true, min: 0 },
  cantidadEntregada: { type: Number, default: 0, min: 0 },
  precioUnitario: { type: Number, required: true, min: 0 },
  costeUnitario: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  iva: { type: Number, required: true, default: 21 },
  subtotal: { type: Number, required: true, min: 0 },
  opcional: { type: Boolean, default: false },
  seleccionado: { type: Boolean, default: true },
}, { _id: false });

const VarianteSeleccionadaSchema = new Schema<IVarianteSeleccionada>({
  varianteId: { type: String },
  sku: { type: String, required: true },
  combinacion: { type: Map, of: String, required: true },
  precioAdicional: { type: Number, default: 0 },
  costeAdicional: { type: Number, default: 0 },
}, { _id: false });

const LineaAlbaranSchema = new Schema<ILineaAlbaran>({
  orden: { type: Number, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoLinea),
    default: TipoLinea.PRODUCTO,
  },

  // Producto
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  codigo: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  descripcionLarga: { type: String, trim: true },
  sku: { type: String, trim: true },

  // Variante
  variante: { type: VarianteSeleccionadaSchema },

  // Cantidades
  cantidadSolicitada: { type: Number, required: true, min: 0, default: 1 },
  cantidadEntregada: { type: Number, required: true, min: 0, default: 0 },
  cantidadPendiente: { type: Number, default: 0, min: 0 },
  unidad: { type: String, trim: true, default: 'ud' },

  // Trazabilidad
  lote: { type: String, trim: true },
  numeroSerie: { type: String, trim: true },
  fechaCaducidad: { type: Date },

  // Precios
  precioUnitario: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  descuentoImporte: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0, default: 0 },
  iva: { type: Number, required: true, default: 21 },
  ivaImporte: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0, default: 0 },

  // Costes
  costeUnitario: { type: Number, default: 0, min: 0 },
  costeTotalLinea: { type: Number, default: 0, min: 0 },

  // Márgenes
  margenUnitario: { type: Number, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
  margenTotalLinea: { type: Number, default: 0 },

  // Kit
  componentesKit: { type: [ComponenteKitSchema], default: [] },
  mostrarComponentes: { type: Boolean, default: true },

  // Ubicación
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen' },
  ubicacion: { type: String, trim: true },

  // Flags
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },

  // Referencia a pedido
  lineaPedidoId: { type: Schema.Types.ObjectId },

  // Notas
  notasInternas: { type: String },
  notasEntrega: { type: String },
}, { _id: true });

const DireccionEntregaSchema = new Schema<IDireccionEntrega>({
  tipo: {
    type: String,
    enum: ['cliente', 'personalizada', 'recogida'],
    default: 'cliente',
  },
  direccionId: { type: Schema.Types.ObjectId },
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
  horarioEntrega: { type: String, trim: true },
  instrucciones: { type: String },
}, { _id: false });

const DatosTransporteSchema = new Schema<IDatosTransporte>({
  transportistaId: { type: Schema.Types.ObjectId, ref: 'Transportista' },
  nombreTransportista: { type: String, trim: true },
  vehiculo: { type: String, trim: true },
  matricula: { type: String, trim: true },
  conductor: { type: String, trim: true },
  telefonoConductor: { type: String, trim: true },
  numeroSeguimiento: { type: String, trim: true },
  costeEnvio: { type: Number, min: 0 },
  seguroEnvio: { type: Number, min: 0 },
  portesPagados: { type: Boolean, default: false },
}, { _id: false });

const DatosEntregaSchema = new Schema<IDatosEntrega>({
  fechaProgramada: { type: Date },
  fechaEntrega: { type: Date },
  horaEntrega: { type: String, trim: true },
  receptorNombre: { type: String, trim: true },
  receptorDni: { type: String, trim: true },
  firmaDigital: { type: String },
  observacionesEntrega: { type: String },
  fotosEntrega: [{ type: String }],
  incidencias: { type: String },
}, { _id: false });

const BultosSchema = new Schema<IBultos>({
  cantidad: { type: Number, default: 1, min: 0 },
  peso: { type: Number, min: 0 },
  volumen: { type: Number, min: 0 },
  descripcion: { type: String, trim: true },
}, { _id: false });

const DesgloseIvaSchema = new Schema({
  tipo: { type: Number, required: true },
  base: { type: Number, required: true },
  cuota: { type: Number, required: true },
}, { _id: false });

const TotalesAlbaranSchema = new Schema<ITotalesAlbaran>({
  subtotalBruto: { type: Number, default: 0, min: 0 },
  totalDescuentos: { type: Number, default: 0, min: 0 },
  subtotalNeto: { type: Number, default: 0, min: 0 },
  desgloseIva: { type: [DesgloseIvaSchema], default: [] },
  totalIva: { type: Number, default: 0, min: 0 },
  totalAlbaran: { type: Number, default: 0, min: 0 },
  costeTotalMateriales: { type: Number, default: 0, min: 0 },
  costeTotalServicios: { type: Number, default: 0, min: 0 },
  costeTotalKits: { type: Number, default: 0, min: 0 },
  costeTotal: { type: Number, default: 0, min: 0 },
  margenBruto: { type: Number, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
}, { _id: false });

const DocumentoAlbaranSchema = new Schema<IDocumentoAlbaran>({
  nombre: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  visibleCliente: { type: Boolean, default: true },
}, { _id: true });

const HistorialAlbaranSchema = new Schema<IHistorialAlbaran>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const AlbaranSchema = new Schema<IAlbaran, IAlbaranModel>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },

  // Identificación
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
    default: 'ALB',
  },
  numero: {
    type: Number,
    required: true,
  },

  // Tipo
  tipo: {
    type: String,
    enum: Object.values(TipoAlbaran),
    default: TipoAlbaran.VENTA,
  },

  // Origen
  pedidoOrigenId: {
    type: Schema.Types.ObjectId,
    ref: 'Pedido',
  },
  presupuestoOrigenId: {
    type: Schema.Types.ObjectId,
    ref: 'Presupuesto',
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoAlbaran),
    default: EstadoAlbaran.BORRADOR,
  },

  // Fechas
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
  },
  fechaVencimiento: { type: Date },

  // Cliente
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El cliente es obligatorio'],
  },
  clienteNombre: {
    type: String,
    required: true,
    trim: true,
  },
  clienteNif: {
    type: String,
    required: true,
    trim: true,
  },
  clienteEmail: { type: String, trim: true },
  clienteTelefono: { type: String, trim: true },
  direccionFacturacion: { type: DireccionEntregaSchema },

  // Entrega
  direccionEntrega: { type: DireccionEntregaSchema },
  datosTransporte: { type: DatosTransporteSchema },
  datosEntrega: { type: DatosEntregaSchema },
  bultos: { type: BultosSchema },

  // Proyecto
  proyectoId: {
    type: Schema.Types.ObjectId,
    ref: 'Proyecto',
  },

  // Almacén
  almacenId: {
    type: Schema.Types.ObjectId,
    ref: 'Almacen',
  },

  // Agente comercial
  agenteComercialId: {
    type: Schema.Types.ObjectId,
    ref: 'AgenteComercial',
  },

  // Referencias
  referenciaCliente: { type: String, trim: true },
  pedidoCliente: { type: String, trim: true },

  // Título y descripción
  titulo: { type: String, trim: true },
  descripcion: { type: String },

  // Líneas
  lineas: {
    type: [LineaAlbaranSchema],
    default: [],
  },

  // Totales
  totales: {
    type: TotalesAlbaranSchema,
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
  condicionesEntrega: { type: String },

  // Documentos
  documentos: {
    type: [DocumentoAlbaranSchema],
    default: [],
  },

  // Historial
  historial: {
    type: [HistorialAlbaranSchema],
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
  facturado: {
    type: Boolean,
    default: false,
  },
  facturaId: {
    type: Schema.Types.ObjectId,
    ref: 'Factura',
  },

  // Configuración de visualización
  mostrarCostes: {
    type: Boolean,
    default: true,
  },
  mostrarMargenes: {
    type: Boolean,
    default: true,
  },
  mostrarComponentesKit: {
    type: Boolean,
    default: true,
  },
  mostrarPrecios: {
    type: Boolean,
    default: true,
  },

  // Auditoría
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
  collection: 'albaranes',
});

// ============================================
// ÍNDICES
// ============================================

AlbaranSchema.index({ serie: 1, numero: 1 });
AlbaranSchema.index({ clienteId: 1 });
AlbaranSchema.index({ proyectoId: 1 });
AlbaranSchema.index({ agenteComercialId: 1 });
AlbaranSchema.index({ almacenId: 1 });
AlbaranSchema.index({ estado: 1 });
AlbaranSchema.index({ tipo: 1 });
AlbaranSchema.index({ fecha: -1 });
AlbaranSchema.index({ 'datosEntrega.fechaProgramada': 1 });
AlbaranSchema.index({ activo: 1 });
AlbaranSchema.index({ facturado: 1 });
AlbaranSchema.index({ tags: 1 });
AlbaranSchema.index({ 'totales.totalAlbaran': 1 });
AlbaranSchema.index({ pedidoOrigenId: 1 });
AlbaranSchema.index({ facturaId: 1 });

// ============================================
// VIRTUALS
// ============================================

AlbaranSchema.virtual('porcentajeEntregado').get(function(this: IAlbaran) {
  if (!this.lineas || this.lineas.length === 0) return 0;

  const lineasConCantidad = this.lineas.filter(l => l.incluidoEnTotal && l.cantidadSolicitada > 0);
  if (lineasConCantidad.length === 0) return 0;

  const totalSolicitada = lineasConCantidad.reduce((sum, l) => sum + l.cantidadSolicitada, 0);
  const totalEntregada = lineasConCantidad.reduce((sum, l) => sum + (l.cantidadEntregada || 0), 0);

  return totalSolicitada > 0 ? Math.round((totalEntregada / totalSolicitada) * 100) : 0;
});

AlbaranSchema.virtual('estaCompleto').get(function(this: IAlbaran) {
  return this.estado === EstadoAlbaran.ENTREGADO ||
         this.estado === EstadoAlbaran.FACTURADO ||
         this.porcentajeEntregado === 100;
});

AlbaranSchema.virtual('diasDesdeCreacion').get(function(this: IAlbaran) {
  const hoy = new Date();
  const diffTime = hoy.getTime() - this.fechaCreacion.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

AlbaranSchema.virtual('valorPendiente').get(function(this: IAlbaran) {
  if (!this.lineas || this.lineas.length === 0) return 0;

  return this.lineas.reduce((sum, l) => {
    if (!l.incluidoEnTotal) return sum;
    const pendiente = l.cantidadSolicitada - (l.cantidadEntregada || 0);
    return sum + (pendiente * l.precioUnitario * (1 - l.descuento / 100));
  }, 0);
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

AlbaranSchema.statics.generarCodigo = async function(serie: string = 'ALB'): Promise<{ codigo: string; serie: string; numero: number }> {
  const año = new Date().getFullYear();

  const ultimoAlbaran = await this.findOne({
    serie,
    codigo: new RegExp(`^${serie}${año}-\\d+$`),
  }).sort({ numero: -1 }).lean();

  let numero = 1;
  if (ultimoAlbaran && ultimoAlbaran.numero) {
    numero = ultimoAlbaran.numero + 1;
  }

  const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

  return { codigo, serie, numero };
};

AlbaranSchema.statics.obtenerEstadisticas = async function() {
  const [
    total,
    porEstado,
    totales,
    entregados,
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
          totalImporte: { $sum: '$totales.totalAlbaran' },
          margenTotal: { $sum: '$totales.margenBruto' },
          costeTotal: { $sum: '$totales.costeTotal' },
        },
      },
    ]),
    this.countDocuments({ estado: { $in: [EstadoAlbaran.ENTREGADO, EstadoAlbaran.FACTURADO] } }),
    this.countDocuments({ estado: { $in: [EstadoAlbaran.PENDIENTE_ENTREGA, EstadoAlbaran.EN_TRANSITO] } }),
  ]);

  const estadisticasPorEstado: Record<string, number> = {};
  porEstado.forEach((item: any) => {
    estadisticasPorEstado[item._id] = item.count;
  });

  return {
    total,
    porEstado: estadisticasPorEstado,
    totalImporte: totales[0]?.totalImporte || 0,
    totalEntregados: entregados,
    pendientesEntrega: pendientes,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

AlbaranSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const AlbaranModel = this.constructor as IAlbaranModel;
      const { codigo, serie, numero } = await AlbaranModel.generarCodigo(this.serie);
      this.codigo = codigo;
      this.serie = serie;
      this.numero = numero;
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Calcular cantidades pendientes en líneas
  if (this.lineas) {
    this.lineas.forEach(linea => {
      linea.cantidadPendiente = Math.max(0, linea.cantidadSolicitada - (linea.cantidadEntregada || 0));
    });
  }

  next();
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================

AlbaranSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret, options) => {
    delete (ret as any).__v;

    // Si se solicita ocultar costes
    if (options.hideCosts || !ret.mostrarCostes) {
      if (ret.lineas) {
        ret.lineas = ret.lineas.map((linea: any) => {
          const { costeUnitario, costeTotalLinea, margenUnitario, margenPorcentaje, margenTotalLinea, notasInternas, ...lineaSinCostes } = linea;
          if (lineaSinCostes.componentesKit) {
            lineaSinCostes.componentesKit = lineaSinCostes.componentesKit.map((comp: any) => {
              const { costeUnitario: cc, ...compSinCoste } = comp;
              return compSinCoste;
            });
          }
          return lineaSinCostes;
        });
      }

      if (ret.totales) {
        const { costeTotalMateriales, costeTotalServicios, costeTotalKits, costeTotal, margenBruto, margenPorcentaje, ...totalesSinCostes } = ret.totales;
        ret.totales = totalesSinCostes;
      }
    }

    // Si se solicita ocultar precios
    if (options.hidePrices || !ret.mostrarPrecios) {
      if (ret.lineas) {
        ret.lineas = ret.lineas.map((linea: any) => {
          const { precioUnitario, descuento, descuentoImporte, subtotal, ivaImporte, total, ...lineaSinPrecios } = linea;
          return lineaSinPrecios;
        });
      }
      if (ret.totales) {
        ret.totales = {};
      }
    }

    return ret;
  },
});

AlbaranSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const Albaran = mongoose.model<IAlbaran, IAlbaranModel>('Albaran', AlbaranSchema);

export default Albaran;
