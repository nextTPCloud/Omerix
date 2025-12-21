import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoPedido {
  BORRADOR = 'borrador',
  CONFIRMADO = 'confirmado',
  EN_PROCESO = 'en_proceso',
  PARCIALMENTE_SERVIDO = 'parcialmente_servido',
  SERVIDO = 'servido',
  FACTURADO = 'facturado',
  CANCELADO = 'cancelado',
}

export enum TipoLinea {
  PRODUCTO = 'producto',
  SERVICIO = 'servicio',
  KIT = 'kit',
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

export interface IComponenteKit {
  productoId: mongoose.Types.ObjectId;
  nombre: string;
  sku?: string;
  cantidad: number;
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

export interface ILineaPedido {
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
  cantidad: number;
  cantidadServida: number; // Para control de entregas parciales
  cantidadPendiente: number;
  unidad?: string;

  // Peso
  peso?: number; // Peso unitario en kg
  pesoTotal?: number; // Peso total de la línea (peso * cantidad)

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

  // Flags
  esEditable: boolean;
  incluidoEnTotal: boolean;

  // Notas
  notasInternas?: string;
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

export interface ICondicionesComerciales {
  formaPagoId?: mongoose.Types.ObjectId;
  terminoPagoId?: mongoose.Types.ObjectId;
  tiempoEntrega?: string;
  garantia?: string;
  portesPagados: boolean;
  portesImporte?: number;
  observacionesEntrega?: string;
}

export interface ITotalesPedido {
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
  costeTotalMateriales: number;
  costeTotalServicios: number;
  costeTotalKits: number;
  costeTotal: number;
  margenBruto: number;
  margenPorcentaje: number;
}

export interface IDocumentoPedido {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
  visibleCliente: boolean;
}

export interface IHistorialPedido {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

export interface INotaSeguimiento {
  _id?: mongoose.Types.ObjectId;
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  tipo: 'llamada' | 'email' | 'reunion' | 'nota' | 'recordatorio';
  contenido: string;
  resultado?: string;
  proximaAccion?: string;
  fechaProximaAccion?: Date;
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface IPedido extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificación
  codigo: string;
  serie: string;
  numero: number;

  // Origen
  presupuestoOrigenId?: mongoose.Types.ObjectId;

  // Estado
  estado: EstadoPedido;

  // Prioridad
  prioridad: Prioridad;

  // Fechas
  fecha: Date;
  fechaConfirmacion?: Date;
  fechaEntregaComprometida?: Date;
  fechaEntregaReal?: Date;
  fechaEnvio?: Date; // Fecha de envío del pedido al cliente (email/etc)
  contadorEnvios: number;

  // Cliente
  clienteId: mongoose.Types.ObjectId;
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;

  // Entrega
  direccionEntrega?: IDireccionEntrega;

  // Proyecto y parte de trabajo
  proyectoId?: mongoose.Types.ObjectId;
  parteTrabajoId?: mongoose.Types.ObjectId;

  // Agente comercial
  agenteComercialId?: mongoose.Types.ObjectId;

  // Referencias
  referenciaCliente?: string;
  pedidoCliente?: string;

  // Título y descripción
  titulo?: string;
  descripcion?: string;

  // Líneas
  lineas: ILineaPedido[];

  // Condiciones
  condiciones: ICondicionesComerciales;

  // Totales
  totales: ITotalesPedido;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Textos
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;

  // Documentos
  documentos: IDocumentoPedido[];

  // Historial
  historial: IHistorialPedido[];

  // Notas de seguimiento
  notasSeguimiento: INotaSeguimiento[];

  // Observaciones
  observaciones?: string;
  observacionesAlmacen?: string;

  // Tags
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean;

  // Configuración de visualización
  mostrarCostes: boolean;
  mostrarMargenes: boolean;
  mostrarComponentesKit: boolean;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Virtuals
  porcentajeServido: number;
  estaCompleto: boolean;
  diasDesdeConfirmacion: number | null;
  diasHastaEntrega: number | null;
}

export interface IPedidoModel extends Model<IPedido> {
  generarCodigo(serie?: string): Promise<{ codigo: string; serie: string; numero: number }>;
  obtenerEstadisticas(): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalImporte: number;
    totalServidos: number;
    tiempoMedioEntrega: number;
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

const LineaPedidoSchema = new Schema<ILineaPedido>({
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
  cantidad: { type: Number, required: true, min: 0, default: 1 },
  cantidadServida: { type: Number, default: 0, min: 0 },
  cantidadPendiente: { type: Number, default: 0, min: 0 },
  unidad: { type: String, trim: true, default: 'ud' },

  // Peso
  peso: { type: Number, min: 0, default: 0 },
  pesoTotal: { type: Number, min: 0, default: 0 },

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

  // Flags
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },

  // Notas
  notasInternas: { type: String },
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

const CondicionesComercialesSchema = new Schema<ICondicionesComerciales>({
  formaPagoId: { type: Schema.Types.ObjectId, ref: 'FormaPago' },
  terminoPagoId: { type: Schema.Types.ObjectId, ref: 'TerminoPago' },
  tiempoEntrega: { type: String, trim: true },
  garantia: { type: String, trim: true },
  portesPagados: { type: Boolean, default: false },
  portesImporte: { type: Number, min: 0 },
  observacionesEntrega: { type: String },
}, { _id: false });

const DesgloseIvaSchema = new Schema({
  tipo: { type: Number, required: true },
  base: { type: Number, required: true },
  cuota: { type: Number, required: true },
}, { _id: false });

const TotalesPedidoSchema = new Schema<ITotalesPedido>({
  subtotalBruto: { type: Number, default: 0, min: 0 },
  totalDescuentos: { type: Number, default: 0, min: 0 },
  subtotalNeto: { type: Number, default: 0, min: 0 },
  desgloseIva: { type: [DesgloseIvaSchema], default: [] },
  totalIva: { type: Number, default: 0, min: 0 },
  totalPedido: { type: Number, default: 0, min: 0 },
  costeTotalMateriales: { type: Number, default: 0, min: 0 },
  costeTotalServicios: { type: Number, default: 0, min: 0 },
  costeTotalKits: { type: Number, default: 0, min: 0 },
  costeTotal: { type: Number, default: 0, min: 0 },
  margenBruto: { type: Number, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
}, { _id: false });

const DocumentoPedidoSchema = new Schema<IDocumentoPedido>({
  nombre: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  visibleCliente: { type: Boolean, default: true },
}, { _id: true });

const HistorialPedidoSchema = new Schema<IHistorialPedido>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

const NotaSeguimientoSchema = new Schema<INotaSeguimiento>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: {
    type: String,
    enum: ['llamada', 'email', 'reunion', 'nota', 'recordatorio'],
    default: 'nota',
  },
  contenido: { type: String, required: true },
  resultado: { type: String },
  proximaAccion: { type: String },
  fechaProximaAccion: { type: Date },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const PedidoSchema = new Schema<IPedido, IPedidoModel>({
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
    default: 'PV',
  },
  numero: {
    type: Number,
    required: true,
  },

  // Origen
  presupuestoOrigenId: {
    type: Schema.Types.ObjectId,
    ref: 'Presupuesto',
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoPedido),
    default: EstadoPedido.BORRADOR,
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
  fechaConfirmacion: { type: Date },
  fechaEntregaComprometida: { type: Date },
  fechaEntregaReal: { type: Date },
  fechaEnvio: { type: Date },
  contadorEnvios: { type: Number, default: 0 },

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

  // Proyecto y parte de trabajo
  proyectoId: {
    type: Schema.Types.ObjectId,
    ref: 'Proyecto',
  },
  parteTrabajoId: {
    type: Schema.Types.ObjectId,
    ref: 'ParteTrabajo',
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
    type: [LineaPedidoSchema],
    default: [],
  },

  // Condiciones
  condiciones: {
    type: CondicionesComercialesSchema,
    default: () => ({}),
  },

  // Totales
  totales: {
    type: TotalesPedidoSchema,
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
  introduccion: { type: String },
  piePagina: { type: String },
  condicionesLegales: { type: String },

  // Documentos
  documentos: {
    type: [DocumentoPedidoSchema],
    default: [],
  },

  // Historial
  historial: {
    type: [HistorialPedidoSchema],
    default: [],
  },

  // Notas de seguimiento
  notasSeguimiento: {
    type: [NotaSeguimientoSchema],
    default: [],
  },

  // Observaciones
  observaciones: { type: String },
  observacionesAlmacen: { type: String },

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
  collection: 'pedidos',
});

// ============================================
// ÍNDICES
// ============================================

PedidoSchema.index({ serie: 1, numero: 1 });
PedidoSchema.index({ clienteId: 1 });
PedidoSchema.index({ proyectoId: 1 });
PedidoSchema.index({ agenteComercialId: 1 });
PedidoSchema.index({ estado: 1 });
PedidoSchema.index({ prioridad: 1 });
PedidoSchema.index({ fecha: -1 });
PedidoSchema.index({ fechaEntregaComprometida: 1 });
PedidoSchema.index({ activo: 1 });
PedidoSchema.index({ tags: 1 });
PedidoSchema.index({ 'totales.totalPedido': 1 });
PedidoSchema.index({ presupuestoOrigenId: 1 });

// ============================================
// VIRTUALS
// ============================================

PedidoSchema.virtual('porcentajeServido').get(function(this: IPedido) {
  if (!this.lineas || this.lineas.length === 0) return 0;

  const lineasConCantidad = this.lineas.filter(l => l.incluidoEnTotal && l.cantidad > 0);
  if (lineasConCantidad.length === 0) return 0;

  const totalCantidad = lineasConCantidad.reduce((sum, l) => sum + l.cantidad, 0);
  const totalServida = lineasConCantidad.reduce((sum, l) => sum + (l.cantidadServida || 0), 0);

  return totalCantidad > 0 ? Math.round((totalServida / totalCantidad) * 100) : 0;
});

PedidoSchema.virtual('estaCompleto').get(function(this: IPedido) {
  return this.estado === EstadoPedido.SERVIDO ||
         this.estado === EstadoPedido.FACTURADO ||
         this.porcentajeServido === 100;
});

PedidoSchema.virtual('diasDesdeConfirmacion').get(function(this: IPedido) {
  if (!this.fechaConfirmacion) return null;
  const hoy = new Date();
  const diffTime = hoy.getTime() - this.fechaConfirmacion.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

PedidoSchema.virtual('diasHastaEntrega').get(function(this: IPedido) {
  if (!this.fechaEntregaComprometida) return null;
  if (this.estado === EstadoPedido.SERVIDO || this.estado === EstadoPedido.FACTURADO) return null;
  const hoy = new Date();
  const diffTime = this.fechaEntregaComprometida.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

PedidoSchema.statics.generarCodigo = async function(serie: string = 'PV'): Promise<{ codigo: string; serie: string; numero: number }> {
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

PedidoSchema.statics.obtenerEstadisticas = async function() {
  const [
    total,
    porEstado,
    totales,
    servidos,
    tiemposEntrega,
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
          margenTotal: { $sum: '$totales.margenBruto' },
          costeTotal: { $sum: '$totales.costeTotal' },
        },
      },
    ]),
    this.countDocuments({ estado: { $in: [EstadoPedido.SERVIDO, EstadoPedido.FACTURADO] } }),
    this.aggregate([
      {
        $match: {
          fechaConfirmacion: { $exists: true },
          fechaEntregaReal: { $exists: true },
        }
      },
      {
        $project: {
          tiempoEntrega: {
            $divide: [
              { $subtract: ['$fechaEntregaReal', '$fechaConfirmacion'] },
              1000 * 60 * 60 * 24, // Convertir a días
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          tiempoMedio: { $avg: '$tiempoEntrega' },
        },
      },
    ]),
  ]);

  const estadisticasPorEstado: Record<string, number> = {};
  porEstado.forEach((item: any) => {
    estadisticasPorEstado[item._id] = item.count;
  });

  return {
    total,
    porEstado: estadisticasPorEstado,
    totalImporte: totales[0]?.totalImporte || 0,
    totalServidos: servidos,
    tiempoMedioEntrega: tiemposEntrega[0]?.tiempoMedio ? Math.round(tiemposEntrega[0].tiempoMedio) : 0,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

PedidoSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const PedidoModel = this.constructor as IPedidoModel;
      const { codigo, serie, numero } = await PedidoModel.generarCodigo(this.serie);
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
      linea.cantidadPendiente = Math.max(0, linea.cantidad - (linea.cantidadServida || 0));
    });
  }

  next();
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================

PedidoSchema.set('toJSON', {
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

    return ret;
  },
});

PedidoSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const Pedido = mongoose.model<IPedido, IPedidoModel>('Pedido', PedidoSchema);

export default Pedido;
