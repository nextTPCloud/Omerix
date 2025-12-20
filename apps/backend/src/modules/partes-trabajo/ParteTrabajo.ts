import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoParteTrabajo {
  BORRADOR = 'borrador',
  PLANIFICADO = 'planificado',
  EN_CURSO = 'en_curso',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  FACTURADO = 'facturado',
  ANULADO = 'anulado',
}

export enum TipoParteTrabajo {
  MANTENIMIENTO = 'mantenimiento',
  INSTALACION = 'instalacion',
  REPARACION = 'reparacion',
  SERVICIO = 'servicio',
  PROYECTO = 'proyecto',
  OTRO = 'otro',
}

export enum Prioridad {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

// ============================================
// INTERFACES DE LINEAS
// ============================================

// Linea de Personal/Mano de obra
export interface ILineaPersonal {
  _id?: mongoose.Types.ObjectId;
  personalId?: mongoose.Types.ObjectId;
  personalCodigo?: string;
  personalNombre: string;
  categoria?: string;
  // Producto servicio para obtener precios
  productoServicioId?: mongoose.Types.ObjectId;
  productoServicioCodigo?: string;
  productoServicioNombre?: string;
  fecha: Date;
  horaInicio?: string;
  horaFin?: string;
  horasTrabajadas: number;
  horasExtras?: number;
  tarifaHoraCoste: number;
  tarifaHoraVenta: number;
  costeTotal: number;
  ventaTotal: number;
  descripcionTrabajo?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

// Linea de Material
export interface ILineaMaterial {
  _id?: mongoose.Types.ObjectId;
  productoId?: mongoose.Types.ObjectId;
  productoCodigo?: string;
  productoNombre: string;
  descripcion?: string;
  cantidad: number;
  unidad: string;
  precioCoste: number;
  precioVenta: number;
  descuento: number;
  iva: number;
  costeTotal: number;
  ventaTotal: number;
  almacenId?: mongoose.Types.ObjectId;
  lote?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

// Linea de Maquinaria
export interface ILineaMaquinaria {
  _id?: mongoose.Types.ObjectId;
  maquinariaId?: mongoose.Types.ObjectId;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipoUnidad: 'horas' | 'dias' | 'km' | 'unidades';
  cantidad: number;
  tarifaCoste: number;
  tarifaVenta: number;
  costeTotal: number;
  ventaTotal: number;
  operadorId?: mongoose.Types.ObjectId;
  operadorNombre?: string;
  fechaUso: Date;
  observaciones?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

// Linea de Transporte
export interface ILineaTransporte {
  _id?: mongoose.Types.ObjectId;
  vehiculoNombre: string;
  matricula?: string;
  conductorId?: mongoose.Types.ObjectId;
  conductorNombre?: string;
  fecha: Date;
  origen?: string;
  destino?: string;
  kmRecorridos: number;
  tarifaPorKm: number;
  importeFijoViaje: number;
  peajes: number;
  combustible: number;
  costeTotal: number;
  precioVenta: number;
  observaciones?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

// Linea de Gastos
export interface ILineaGasto {
  _id?: mongoose.Types.ObjectId;
  tipoGastoId?: mongoose.Types.ObjectId;
  tipoGastoNombre: string;
  descripcion?: string;
  fecha: Date;
  proveedor?: string;
  numeroFactura?: string;
  importe: number;
  margen: number;
  importeFacturable: number;
  iva: number;
  adjunto?: string;
  facturable: boolean;
  incluidoEnAlbaran: boolean;
}

// ============================================
// INTERFACES DE TOTALES
// ============================================

export interface ITotalesParteTrabajo {
  // Costes
  costePersonal: number;
  costeMaterial: number;
  costeMaquinaria: number;
  costeTransporte: number;
  costeGastos: number;
  costeTotal: number;

  // Ventas
  ventaPersonal: number;
  ventaMaterial: number;
  ventaMaquinaria: number;
  ventaTransporte: number;
  ventaGastos: number;
  subtotalVenta: number;

  // Impuestos y total
  totalIva: number;
  totalVenta: number;

  // Margen
  margenBruto: number;
  margenPorcentaje: number;
}

// ============================================
// INTERFACES DE SOPORTE
// ============================================

export interface IDireccionTrabajo {
  calle?: string;
  numero?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
  observaciones?: string;
}

export interface IDocumentoParteTrabajo {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
}

export interface IHistorialParteTrabajo {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface IParteTrabajo extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificacion
  codigo: string;
  serie: string;
  numero: number;

  // Tipo y clasificacion
  tipo: TipoParteTrabajo;
  estado: EstadoParteTrabajo;
  prioridad: Prioridad;

  // Fechas
  fecha: Date;
  fechaInicio?: Date;
  fechaFin?: Date;
  fechaPrevista?: Date;

  // Cliente (requerido)
  clienteId: mongoose.Types.ObjectId;
  clienteNombre: string;
  clienteNif: string;
  clienteEmail?: string;
  clienteTelefono?: string;

  // Proyecto (opcional)
  proyectoId?: mongoose.Types.ObjectId;
  proyectoCodigo?: string;
  proyectoNombre?: string;

  // Direccion de trabajo
  direccionTrabajo?: IDireccionTrabajo;

  // Responsable
  responsableId?: mongoose.Types.ObjectId;
  responsableNombre?: string;

  // Descripcion
  titulo?: string;
  descripcion?: string;
  trabajoRealizado?: string;
  observacionesInternas?: string;

  // Lineas (5 tipos)
  lineasPersonal: ILineaPersonal[];
  lineasMaterial: ILineaMaterial[];
  lineasMaquinaria: ILineaMaquinaria[];
  lineasTransporte: ILineaTransporte[];
  lineasGastos: ILineaGasto[];

  // Totales calculados
  totales: ITotalesParteTrabajo;

  // Descuento global
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Documentos generados
  albaranesGeneradosIds: mongoose.Types.ObjectId[];

  // Firmas
  firmaTecnico?: string;
  nombreTecnico?: string;
  fechaFirmaTecnico?: Date;
  firmaCliente?: string;
  nombreCliente?: string;
  fechaFirmaCliente?: Date;
  dniCliente?: string;

  // Historial, documentos adjuntos, tags
  historial: IHistorialParteTrabajo[];
  documentos: IDocumentoParteTrabajo[];
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean;

  // Configuracion de visualizacion
  mostrarCostes: boolean;
  mostrarMargenes: boolean;
  mostrarPrecios: boolean;

  // Auditoria
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Virtuals
  totalHorasTrabajadas: number;
  diasDesdeCreacion: number;
  estaCompletado: boolean;
}

export interface IParteTrabajoModel extends Model<IParteTrabajo> {
  generarCodigo(serie?: string): Promise<{ codigo: string; serie: string; numero: number }>;
  obtenerEstadisticas(): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalVenta: number;
    totalCoste: number;
    margenTotal: number;
    pendientesFacturar: number;
  }>;
}

// ============================================
// SCHEMAS DE LINEAS
// ============================================

const LineaPersonalSchema = new Schema<ILineaPersonal>({
  personalId: { type: Schema.Types.ObjectId, ref: 'Personal' },
  personalCodigo: { type: String, trim: true },
  personalNombre: { type: String, required: true, trim: true },
  categoria: { type: String, trim: true },
  // Producto servicio para obtener precios
  productoServicioId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  productoServicioCodigo: { type: String, trim: true },
  productoServicioNombre: { type: String, trim: true },
  fecha: { type: Date, required: true, default: Date.now },
  horaInicio: { type: String, trim: true },
  horaFin: { type: String, trim: true },
  horasTrabajadas: { type: Number, required: true, min: 0, default: 0 },
  horasExtras: { type: Number, min: 0, default: 0 },
  tarifaHoraCoste: { type: Number, required: true, min: 0, default: 0 },
  tarifaHoraVenta: { type: Number, required: true, min: 0, default: 0 },
  costeTotal: { type: Number, min: 0, default: 0 },
  ventaTotal: { type: Number, min: 0, default: 0 },
  descripcionTrabajo: { type: String },
  facturable: { type: Boolean, default: true },
  incluidoEnAlbaran: { type: Boolean, default: false },
}, { _id: true });

const LineaMaterialSchema = new Schema<ILineaMaterial>({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  productoCodigo: { type: String, trim: true },
  productoNombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  cantidad: { type: Number, required: true, min: 0, default: 1 },
  unidad: { type: String, trim: true, default: 'ud' },
  precioCoste: { type: Number, required: true, min: 0, default: 0 },
  precioVenta: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, min: 0, max: 100, default: 0 },
  iva: { type: Number, required: true, default: 21 },
  costeTotal: { type: Number, min: 0, default: 0 },
  ventaTotal: { type: Number, min: 0, default: 0 },
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen' },
  lote: { type: String, trim: true },
  facturable: { type: Boolean, default: true },
  incluidoEnAlbaran: { type: Boolean, default: false },
}, { _id: true });

const LineaMaquinariaSchema = new Schema<ILineaMaquinaria>({
  maquinariaId: { type: Schema.Types.ObjectId, ref: 'Maquinaria' },
  codigo: { type: String, trim: true },
  nombre: { type: String, trim: true, default: '' },
  descripcion: { type: String, trim: true },
  tipoUnidad: {
    type: String,
    enum: ['horas', 'dias', 'km', 'unidades'],
    default: 'horas',
  },
  cantidad: { type: Number, required: true, min: 0, default: 1 },
  tarifaCoste: { type: Number, required: true, min: 0, default: 0 },
  tarifaVenta: { type: Number, required: true, min: 0, default: 0 },
  costeTotal: { type: Number, min: 0, default: 0 },
  ventaTotal: { type: Number, min: 0, default: 0 },
  operadorId: { type: Schema.Types.ObjectId, ref: 'Personal' },
  operadorNombre: { type: String, trim: true },
  fechaUso: { type: Date, required: true, default: Date.now },
  observaciones: { type: String },
  facturable: { type: Boolean, default: true },
  incluidoEnAlbaran: { type: Boolean, default: false },
}, { _id: true });

const LineaTransporteSchema = new Schema<ILineaTransporte>({
  vehiculoNombre: { type: String, trim: true, default: '' },
  matricula: { type: String, trim: true },
  conductorId: { type: Schema.Types.ObjectId, ref: 'Personal' },
  conductorNombre: { type: String, trim: true },
  fecha: { type: Date, required: true, default: Date.now },
  origen: { type: String, trim: true },
  destino: { type: String, trim: true },
  kmRecorridos: { type: Number, min: 0, default: 0 },
  tarifaPorKm: { type: Number, min: 0, default: 0 },
  importeFijoViaje: { type: Number, min: 0, default: 0 },
  peajes: { type: Number, min: 0, default: 0 },
  combustible: { type: Number, min: 0, default: 0 },
  costeTotal: { type: Number, min: 0, default: 0 },
  precioVenta: { type: Number, min: 0, default: 0 },
  observaciones: { type: String },
  facturable: { type: Boolean, default: true },
  incluidoEnAlbaran: { type: Boolean, default: false },
}, { _id: true });

const LineaGastoSchema = new Schema<ILineaGasto>({
  tipoGastoId: { type: Schema.Types.ObjectId, ref: 'TipoGasto' },
  tipoGastoNombre: { type: String, trim: true, default: '' },
  descripcion: { type: String, trim: true },
  fecha: { type: Date, required: true, default: Date.now },
  proveedor: { type: String, trim: true },
  numeroFactura: { type: String, trim: true },
  importe: { type: Number, required: true, min: 0, default: 0 },
  margen: { type: Number, min: 0, default: 0 },
  importeFacturable: { type: Number, min: 0, default: 0 },
  iva: { type: Number, required: true, default: 21 },
  adjunto: { type: String },
  facturable: { type: Boolean, default: true },
  incluidoEnAlbaran: { type: Boolean, default: false },
}, { _id: true });

// ============================================
// SCHEMAS DE SOPORTE
// ============================================

const DireccionTrabajoSchema = new Schema<IDireccionTrabajo>({
  calle: { type: String, trim: true },
  numero: { type: String, trim: true },
  codigoPostal: { type: String, trim: true },
  ciudad: { type: String, trim: true },
  provincia: { type: String, trim: true },
  pais: { type: String, trim: true, default: 'España' },
  coordenadas: {
    lat: { type: Number },
    lng: { type: Number },
  },
  observaciones: { type: String },
}, { _id: false });

const TotalesParteTrabajoSchema = new Schema<ITotalesParteTrabajo>({
  costePersonal: { type: Number, default: 0, min: 0 },
  costeMaterial: { type: Number, default: 0, min: 0 },
  costeMaquinaria: { type: Number, default: 0, min: 0 },
  costeTransporte: { type: Number, default: 0, min: 0 },
  costeGastos: { type: Number, default: 0, min: 0 },
  costeTotal: { type: Number, default: 0, min: 0 },
  ventaPersonal: { type: Number, default: 0, min: 0 },
  ventaMaterial: { type: Number, default: 0, min: 0 },
  ventaMaquinaria: { type: Number, default: 0, min: 0 },
  ventaTransporte: { type: Number, default: 0, min: 0 },
  ventaGastos: { type: Number, default: 0, min: 0 },
  subtotalVenta: { type: Number, default: 0, min: 0 },
  totalIva: { type: Number, default: 0, min: 0 },
  totalVenta: { type: Number, default: 0, min: 0 },
  margenBruto: { type: Number, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
}, { _id: false });

const DocumentoParteTrabajoSchema = new Schema<IDocumentoParteTrabajo>({
  nombre: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { _id: true });

const HistorialParteTrabajoSchema = new Schema<IHistorialParteTrabajo>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const ParteTrabajoSchema = new Schema<IParteTrabajo, IParteTrabajoModel>({
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
    default: 'PT',
  },
  numero: {
    type: Number,
    required: true,
  },

  // Tipo y clasificacion
  tipo: {
    type: String,
    enum: Object.values(TipoParteTrabajo),
    default: TipoParteTrabajo.SERVICIO,
  },
  estado: {
    type: String,
    enum: Object.values(EstadoParteTrabajo),
    default: EstadoParteTrabajo.BORRADOR,
  },
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
  fechaInicio: { type: Date },
  fechaFin: { type: Date },
  fechaPrevista: { type: Date },

  // Cliente (requerido)
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

  // Proyecto (opcional)
  proyectoId: {
    type: Schema.Types.ObjectId,
    ref: 'Proyecto',
  },
  proyectoCodigo: { type: String, trim: true },
  proyectoNombre: { type: String, trim: true },

  // Direccion de trabajo
  direccionTrabajo: { type: DireccionTrabajoSchema },

  // Responsable
  responsableId: {
    type: Schema.Types.ObjectId,
    ref: 'Personal',
  },
  responsableNombre: { type: String, trim: true },

  // Descripcion
  titulo: { type: String, trim: true },
  descripcion: { type: String },
  trabajoRealizado: { type: String },
  observacionesInternas: { type: String },

  // Lineas
  lineasPersonal: {
    type: [LineaPersonalSchema],
    default: [],
  },
  lineasMaterial: {
    type: [LineaMaterialSchema],
    default: [],
  },
  lineasMaquinaria: {
    type: [LineaMaquinariaSchema],
    default: [],
  },
  lineasTransporte: {
    type: [LineaTransporteSchema],
    default: [],
  },
  lineasGastos: {
    type: [LineaGastoSchema],
    default: [],
  },

  // Totales
  totales: {
    type: TotalesParteTrabajoSchema,
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

  // Documentos generados
  albaranesGeneradosIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Albaran',
  }],

  // Firmas
  firmaTecnico: { type: String },
  nombreTecnico: { type: String, trim: true },
  fechaFirmaTecnico: { type: Date },
  firmaCliente: { type: String },
  nombreCliente: { type: String, trim: true },
  fechaFirmaCliente: { type: Date },
  dniCliente: { type: String, trim: true },

  // Historial y documentos
  historial: {
    type: [HistorialParteTrabajoSchema],
    default: [],
  },
  documentos: {
    type: [DocumentoParteTrabajoSchema],
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

  // Configuracion de visualizacion
  mostrarCostes: {
    type: Boolean,
    default: true,
  },
  mostrarMargenes: {
    type: Boolean,
    default: true,
  },
  mostrarPrecios: {
    type: Boolean,
    default: true,
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
  collection: 'partes_trabajo',
});

// ============================================
// INDICES
// ============================================

ParteTrabajoSchema.index({ serie: 1, numero: 1 });
ParteTrabajoSchema.index({ clienteId: 1 });
ParteTrabajoSchema.index({ proyectoId: 1 });
ParteTrabajoSchema.index({ responsableId: 1 });
ParteTrabajoSchema.index({ estado: 1 });
ParteTrabajoSchema.index({ tipo: 1 });
ParteTrabajoSchema.index({ prioridad: 1 });
ParteTrabajoSchema.index({ fecha: -1 });
ParteTrabajoSchema.index({ fechaInicio: 1 });
ParteTrabajoSchema.index({ fechaPrevista: 1 });
ParteTrabajoSchema.index({ activo: 1 });
ParteTrabajoSchema.index({ tags: 1 });
ParteTrabajoSchema.index({ 'totales.totalVenta': 1 });

// ============================================
// VIRTUALS
// ============================================

ParteTrabajoSchema.virtual('totalHorasTrabajadas').get(function(this: IParteTrabajo) {
  if (!this.lineasPersonal || this.lineasPersonal.length === 0) return 0;
  return this.lineasPersonal.reduce((sum, l) => sum + (l.horasTrabajadas || 0) + (l.horasExtras || 0), 0);
});

ParteTrabajoSchema.virtual('diasDesdeCreacion').get(function(this: IParteTrabajo) {
  const hoy = new Date();
  const diffTime = hoy.getTime() - this.fechaCreacion.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

ParteTrabajoSchema.virtual('estaCompletado').get(function(this: IParteTrabajo) {
  return this.estado === EstadoParteTrabajo.COMPLETADO ||
         this.estado === EstadoParteTrabajo.FACTURADO;
});

// ============================================
// METODOS ESTATICOS
// ============================================

ParteTrabajoSchema.statics.generarCodigo = async function(serie: string = 'PT'): Promise<{ codigo: string; serie: string; numero: number }> {
  const año = new Date().getFullYear();

  const ultimoParte = await this.findOne({
    serie,
    codigo: new RegExp(`^${serie}${año}-\\d+$`),
  }).sort({ numero: -1 }).lean();

  let numero = 1;
  if (ultimoParte && ultimoParte.numero) {
    numero = ultimoParte.numero + 1;
  }

  const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

  return { codigo, serie, numero };
};

ParteTrabajoSchema.statics.obtenerEstadisticas = async function() {
  const [
    total,
    porEstado,
    totales,
    pendientesFacturar,
  ] = await Promise.all([
    this.countDocuments({ activo: true }),
    this.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: { activo: true } },
      {
        $group: {
          _id: null,
          totalVenta: { $sum: '$totales.totalVenta' },
          totalCoste: { $sum: '$totales.costeTotal' },
          margenTotal: { $sum: '$totales.margenBruto' },
        },
      },
    ]),
    this.countDocuments({
      activo: true,
      estado: EstadoParteTrabajo.COMPLETADO,
    }),
  ]);

  const estadisticasPorEstado: Record<string, number> = {};
  porEstado.forEach((item: any) => {
    estadisticasPorEstado[item._id] = item.count;
  });

  return {
    total,
    porEstado: estadisticasPorEstado,
    totalVenta: totales[0]?.totalVenta || 0,
    totalCoste: totales[0]?.totalCoste || 0,
    margenTotal: totales[0]?.margenTotal || 0,
    pendientesFacturar,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

ParteTrabajoSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const ParteTrabajoModel = this.constructor as IParteTrabajoModel;
      const { codigo, serie, numero } = await ParteTrabajoModel.generarCodigo(this.serie);
      this.codigo = codigo;
      this.serie = serie;
      this.numero = numero;
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Recalcular totales de lineas
  this.recalcularTotales();

  next();
});

// Metodo para recalcular totales
ParteTrabajoSchema.methods.recalcularTotales = function() {
  const totales: ITotalesParteTrabajo = {
    costePersonal: 0,
    costeMaterial: 0,
    costeMaquinaria: 0,
    costeTransporte: 0,
    costeGastos: 0,
    costeTotal: 0,
    ventaPersonal: 0,
    ventaMaterial: 0,
    ventaMaquinaria: 0,
    ventaTransporte: 0,
    ventaGastos: 0,
    subtotalVenta: 0,
    totalIva: 0,
    totalVenta: 0,
    margenBruto: 0,
    margenPorcentaje: 0,
  };

  // Personal
  this.lineasPersonal.forEach((l: ILineaPersonal) => {
    const horas = (l.horasTrabajadas || 0) + (l.horasExtras || 0);
    l.costeTotal = horas * (l.tarifaHoraCoste || 0);
    l.ventaTotal = horas * (l.tarifaHoraVenta || 0);
    totales.costePersonal += l.costeTotal;
    if (l.facturable) {
      totales.ventaPersonal += l.ventaTotal;
    }
  });

  // Material
  this.lineasMaterial.forEach((l: ILineaMaterial) => {
    l.costeTotal = (l.cantidad || 0) * (l.precioCoste || 0);
    const subtotal = (l.cantidad || 0) * (l.precioVenta || 0);
    const descuentoImporte = subtotal * ((l.descuento || 0) / 100);
    l.ventaTotal = subtotal - descuentoImporte;
    totales.costeMaterial += l.costeTotal;
    if (l.facturable) {
      totales.ventaMaterial += l.ventaTotal;
      totales.totalIva += l.ventaTotal * ((l.iva || 21) / 100);
    }
  });

  // Maquinaria
  this.lineasMaquinaria.forEach((l: ILineaMaquinaria) => {
    l.costeTotal = (l.cantidad || 0) * (l.tarifaCoste || 0);
    l.ventaTotal = (l.cantidad || 0) * (l.tarifaVenta || 0);
    totales.costeMaquinaria += l.costeTotal;
    if (l.facturable) {
      totales.ventaMaquinaria += l.ventaTotal;
    }
  });

  // Transporte
  this.lineasTransporte.forEach((l: ILineaTransporte) => {
    const costeKm = (l.kmRecorridos || 0) * (l.tarifaPorKm || 0);
    l.costeTotal = costeKm + (l.importeFijoViaje || 0) + (l.peajes || 0) + (l.combustible || 0);
    totales.costeTransporte += l.costeTotal;
    if (l.facturable) {
      totales.ventaTransporte += l.precioVenta || 0;
    }
  });

  // Gastos
  this.lineasGastos.forEach((l: ILineaGasto) => {
    l.importeFacturable = (l.importe || 0) * (1 + (l.margen || 0) / 100);
    totales.costeGastos += l.importe || 0;
    if (l.facturable) {
      totales.ventaGastos += l.importeFacturable;
      totales.totalIva += l.importeFacturable * ((l.iva || 21) / 100);
    }
  });

  // Totales
  totales.costeTotal = totales.costePersonal + totales.costeMaterial + totales.costeMaquinaria + totales.costeTransporte + totales.costeGastos;
  totales.subtotalVenta = totales.ventaPersonal + totales.ventaMaterial + totales.ventaMaquinaria + totales.ventaTransporte + totales.ventaGastos;

  // Aplicar descuento global
  const descuento = (totales.subtotalVenta * (this.descuentoGlobalPorcentaje || 0) / 100) + (this.descuentoGlobalImporte || 0);
  totales.subtotalVenta -= descuento;

  // Total con IVA (simplificado - los servicios normalmente llevan 21%)
  totales.totalIva += (totales.ventaPersonal + totales.ventaMaquinaria + totales.ventaTransporte) * 0.21;
  totales.totalVenta = totales.subtotalVenta + totales.totalIva;

  // Margen
  totales.margenBruto = totales.subtotalVenta - totales.costeTotal;
  totales.margenPorcentaje = totales.subtotalVenta > 0
    ? (totales.margenBruto / totales.subtotalVenta) * 100
    : 0;

  this.totales = totales;
};

// ============================================
// CONFIGURACION DE JSON
// ============================================

ParteTrabajoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret, options) => {
    delete (ret as any).__v;

    // Si se solicita ocultar costes
    if (options.hideCosts || !ret.mostrarCostes) {
      // Ocultar costes en lineas
      ['lineasPersonal', 'lineasMaterial', 'lineasMaquinaria', 'lineasTransporte', 'lineasGastos'].forEach(key => {
        if (ret[key]) {
          ret[key] = ret[key].map((linea: any) => {
            const { tarifaHoraCoste, tarifaCoste, precioCoste, costeTotal, importe, ...lineaSinCoste } = linea;
            return lineaSinCoste;
          });
        }
      });

      // Ocultar costes en totales
      if (ret.totales) {
        const {
          costePersonal, costeMaterial, costeMaquinaria, costeTransporte, costeGastos, costeTotal,
          margenBruto, margenPorcentaje,
          ...totalesSinCostes
        } = ret.totales;
        ret.totales = totalesSinCostes;
      }
    }

    return ret;
  },
});

ParteTrabajoSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const ParteTrabajo = mongoose.model<IParteTrabajo, IParteTrabajoModel>('ParteTrabajo', ParteTrabajoSchema);

export default ParteTrabajo;
