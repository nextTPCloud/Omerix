import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoProyecto {
  BORRADOR = 'borrador',
  PLANIFICACION = 'planificacion',
  EN_CURSO = 'en_curso',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  CERRADO = 'cerrado',
}

export enum PrioridadProyecto {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum TipoProyecto {
  INTERNO = 'interno',
  CLIENTE = 'cliente',
  MANTENIMIENTO = 'mantenimiento',
  DESARROLLO = 'desarrollo',
  CONSULTORIA = 'consultoria',
  INSTALACION = 'instalacion',
  OTRO = 'otro',
}

export enum FrecuenciaRecurrencia {
  SEMANAL = 'semanal',
  QUINCENAL = 'quincenal',
  MENSUAL = 'mensual',
  BIMESTRAL = 'bimestral',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual',
}

export enum EstadoGeneracion {
  PENDIENTE = 'pendiente',
  ALBARAN_GENERADO = 'albaran_generado',
  FACTURADO = 'facturado',
  CANCELADO = 'cancelado',
}

// ============================================
// INTERFACES
// ============================================

export interface IHito {
  _id?: mongoose.Types.ObjectId;
  nombre: string;
  descripcion?: string;
  fechaPrevista: Date;
  fechaReal?: Date;
  completado: boolean;
  orden: number;
}

export interface IParticipante {
  usuarioId?: mongoose.Types.ObjectId;
  personalId?: mongoose.Types.ObjectId;
  rol: string; // 'responsable', 'tecnico', 'comercial', 'colaborador'
  horasAsignadas?: number;
  horasTrabajadas?: number;
  activo: boolean;
}

export interface IDocumentoProyecto {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
  categoria?: string; // 'contrato', 'plano', 'especificacion', 'entregable', 'otro'
}

// Línea de plantilla para generación recurrente
export interface ILineaPlantilla {
  _id?: mongoose.Types.ObjectId;
  tipo: 'mano_obra' | 'material' | 'gasto' | 'maquinaria' | 'transporte';
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  productoId?: mongoose.Types.ObjectId; // Si es un producto del catálogo
  personalId?: mongoose.Types.ObjectId; // Si es mano de obra de personal específico
  incluirEnAlbaran: boolean;
}

// Registro de generación de instancias recurrentes
export interface IInstanciaGenerada {
  _id?: mongoose.Types.ObjectId;
  fechaGeneracion: Date;
  periodoInicio: Date;
  periodoFin: Date;
  estado: EstadoGeneracion;
  parteTrabajoId?: mongoose.Types.ObjectId;
  albaranId?: mongoose.Types.ObjectId;
  facturaId?: mongoose.Types.ObjectId;
  observaciones?: string;
}

// Configuración de recurrencia
export interface IConfiguracionRecurrencia {
  activo: boolean;
  frecuencia: FrecuenciaRecurrencia;
  diaGeneracion: number; // 1-31 para el día del mes, 1-7 para día de la semana
  fechaInicio: Date;
  fechaFin?: Date; // Hasta cuándo generar (opcional)
  proximaGeneracion?: Date;

  // Acciones automáticas
  generarParteTrabajo: boolean;
  generarAlbaran: boolean;
  generarFactura: boolean;

  // Plantilla de líneas para cada instancia
  lineasPlantilla: ILineaPlantilla[];

  // Historial de generaciones
  instanciasGeneradas: IInstanciaGenerada[];
}

export interface IDireccionProyecto {
  nombre?: string;
  calle: string;
  numero?: string;
  piso?: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  latitud?: number;
  longitud?: number;
  notas?: string;
}

export interface IProyecto extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificación
  codigo: string;
  nombre: string;
  descripcion?: string;

  // Cliente asociado
  clienteId: mongoose.Types.ObjectId;

  // Agente comercial responsable
  agenteComercialId?: mongoose.Types.ObjectId;

  // Clasificación
  tipo: TipoProyecto;
  estado: EstadoProyecto;
  prioridad: PrioridadProyecto;

  // Fechas
  fechaInicio?: Date;
  fechaFinPrevista?: Date;
  fechaFinReal?: Date;

  // Ubicación/Dirección del proyecto (obra, instalación, etc.)
  direccion?: IDireccionProyecto;

  // Presupuesto y costes
  presupuestoEstimado?: number;
  presupuestoAprobado?: number;
  costeReal?: number;
  margenPrevisto?: number;
  margenReal?: number;

  // Horas
  horasEstimadas?: number;
  horasReales?: number;

  // Hitos y fases
  hitos: IHito[];

  // Equipo
  responsableId?: mongoose.Types.ObjectId;
  participantes: IParticipante[];

  // Documentos del proyecto
  documentos: IDocumentoProyecto[];

  // Relaciones con otros documentos
  presupuestosIds?: mongoose.Types.ObjectId[]; // Presupuestos asociados
  pedidosIds?: mongoose.Types.ObjectId[]; // Pedidos asociados
  facturasIds?: mongoose.Types.ObjectId[]; // Facturas asociadas
  partesTrabajoIds?: mongoose.Types.ObjectId[]; // Partes de trabajo

  // Tags y categorización
  tags?: string[];

  // Observaciones
  observaciones?: string;

  // Recurrencia/Periodicidad (para proyectos de mantenimiento)
  esRecurrente: boolean;
  recurrencia?: IConfiguracionRecurrencia;

  // Control
  activo: boolean;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Virtuals
  diasRestantes: number | null;
  progreso: number;
  estaRetrasado: boolean;
  rentabilidad: number | null;
}

export interface IProyectoModel extends Model<IProyecto> {
  generarCodigo(): Promise<string>;
  obtenerEstadisticas(): Promise<{
    total: number;
    activos: number;
    enCurso: number;
    completados: number;
    retrasados: number;
    presupuestoTotal: number;
    costeTotal: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

const HitoSchema = new Schema<IHito>({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  fechaPrevista: { type: Date, required: true },
  fechaReal: { type: Date },
  completado: { type: Boolean, default: false },
  orden: { type: Number, default: 0 },
}, { _id: true });

const ParticipanteSchema = new Schema<IParticipante>({
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  personalId: { type: Schema.Types.ObjectId, ref: 'Personal' },
  rol: { type: String, required: true, trim: true },
  horasAsignadas: { type: Number, min: 0 },
  horasTrabajadas: { type: Number, min: 0, default: 0 },
  activo: { type: Boolean, default: true },
}, { _id: true });

const DocumentoProyectoSchema = new Schema<IDocumentoProyecto>({
  nombre: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  categoria: { type: String, trim: true },
}, { _id: true });

const DireccionProyectoSchema = new Schema<IDireccionProyecto>({
  nombre: { type: String, trim: true },
  calle: { type: String, required: true, trim: true },
  numero: { type: String, trim: true },
  piso: { type: String, trim: true },
  codigoPostal: { type: String, required: true, trim: true },
  ciudad: { type: String, required: true, trim: true },
  provincia: { type: String, required: true, trim: true },
  pais: { type: String, required: true, default: 'España', trim: true },
  latitud: { type: Number },
  longitud: { type: Number },
  notas: { type: String },
}, { _id: false });

// Schema para líneas de plantilla (generación recurrente)
const LineaPlantillaSchema = new Schema<ILineaPlantilla>({
  tipo: {
    type: String,
    enum: ['mano_obra', 'material', 'gasto', 'maquinaria', 'transporte'],
    required: true,
  },
  descripcion: { type: String, required: true, trim: true },
  cantidad: { type: Number, required: true, min: 0 },
  unidad: { type: String, required: true, default: 'ud' },
  precioUnitario: { type: Number, required: true, min: 0 },
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  personalId: { type: Schema.Types.ObjectId, ref: 'Personal' },
  incluirEnAlbaran: { type: Boolean, default: true },
}, { _id: true });

// Schema para instancias generadas
const InstanciaGeneradaSchema = new Schema<IInstanciaGenerada>({
  fechaGeneracion: { type: Date, required: true },
  periodoInicio: { type: Date, required: true },
  periodoFin: { type: Date, required: true },
  estado: {
    type: String,
    enum: Object.values(EstadoGeneracion),
    default: EstadoGeneracion.PENDIENTE,
  },
  parteTrabajoId: { type: Schema.Types.ObjectId, ref: 'ParteTrabajo' },
  albaranId: { type: Schema.Types.ObjectId, ref: 'Albaran' },
  facturaId: { type: Schema.Types.ObjectId, ref: 'Factura' },
  observaciones: { type: String },
}, { _id: true });

// Schema de configuración de recurrencia
const ConfiguracionRecurrenciaSchema = new Schema<IConfiguracionRecurrencia>({
  activo: { type: Boolean, default: true },
  frecuencia: {
    type: String,
    enum: Object.values(FrecuenciaRecurrencia),
    required: true,
  },
  diaGeneracion: { type: Number, min: 1, max: 31, default: 1 },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date },
  proximaGeneracion: { type: Date },

  // Acciones automáticas
  generarParteTrabajo: { type: Boolean, default: true },
  generarAlbaran: { type: Boolean, default: false },
  generarFactura: { type: Boolean, default: false },

  // Plantilla e historial
  lineasPlantilla: { type: [LineaPlantillaSchema], default: [] },
  instanciasGeneradas: { type: [InstanciaGeneradaSchema], default: [] },
}, { _id: false });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const ProyectoSchema = new Schema<IProyecto, IProyectoModel>({
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
  nombre: {
    type: String,
    required: [true, 'El nombre del proyecto es obligatorio'],
    trim: true,
    maxlength: [200, 'El nombre no puede exceder 200 caracteres'],
  },
  descripcion: {
    type: String,
    trim: true,
  },

  // Cliente
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El cliente es obligatorio'],
  },

  // Agente comercial
  agenteComercialId: {
    type: Schema.Types.ObjectId,
    ref: 'AgenteComercial',
  },

  // Clasificación
  tipo: {
    type: String,
    enum: Object.values(TipoProyecto),
    default: TipoProyecto.CLIENTE,
  },
  estado: {
    type: String,
    enum: Object.values(EstadoProyecto),
    default: EstadoProyecto.BORRADOR,
  },
  prioridad: {
    type: String,
    enum: Object.values(PrioridadProyecto),
    default: PrioridadProyecto.MEDIA,
  },

  // Fechas
  fechaInicio: { type: Date },
  fechaFinPrevista: { type: Date },
  fechaFinReal: { type: Date },

  // Ubicación
  direccion: { type: DireccionProyectoSchema },

  // Presupuesto y costes
  presupuestoEstimado: { type: Number, min: 0 },
  presupuestoAprobado: { type: Number, min: 0 },
  costeReal: { type: Number, min: 0, default: 0 },
  margenPrevisto: { type: Number }, // Porcentaje
  margenReal: { type: Number }, // Porcentaje

  // Horas
  horasEstimadas: { type: Number, min: 0 },
  horasReales: { type: Number, min: 0, default: 0 },

  // Hitos
  hitos: {
    type: [HitoSchema],
    default: [],
  },

  // Equipo
  responsableId: {
    type: Schema.Types.ObjectId,
    ref: 'Personal',
  },
  participantes: {
    type: [ParticipanteSchema],
    default: [],
  },

  // Documentos
  documentos: {
    type: [DocumentoProyectoSchema],
    default: [],
  },

  // Relaciones
  presupuestosIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Presupuesto',
  }],
  pedidosIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Pedido',
  }],
  facturasIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Factura',
  }],
  partesTrabajoIds: [{
    type: Schema.Types.ObjectId,
    ref: 'ParteTrabajo',
  }],

  // Tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // Observaciones
  observaciones: { type: String },

  // Recurrencia/Periodicidad (para proyectos de mantenimiento)
  esRecurrente: {
    type: Boolean,
    default: false,
  },
  recurrencia: {
    type: ConfiguracionRecurrenciaSchema,
  },

  // Control
  activo: {
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
  collection: 'proyectos',
});

// ============================================
// ÍNDICES
// ============================================
// Nota: codigo ya tiene unique:true en la definición del campo, no duplicar aquí

ProyectoSchema.index({ clienteId: 1 });
ProyectoSchema.index({ agenteComercialId: 1 });
ProyectoSchema.index({ estado: 1 });
ProyectoSchema.index({ tipo: 1 });
ProyectoSchema.index({ prioridad: 1 });
ProyectoSchema.index({ activo: 1 });
ProyectoSchema.index({ responsableId: 1 });
ProyectoSchema.index({ fechaInicio: 1 });
ProyectoSchema.index({ fechaFinPrevista: 1 });
ProyectoSchema.index({ nombre: 'text', descripcion: 'text' });
ProyectoSchema.index({ tags: 1 });
ProyectoSchema.index({ esRecurrente: 1 });
ProyectoSchema.index({ 'recurrencia.proximaGeneracion': 1 });
ProyectoSchema.index({ 'recurrencia.activo': 1 });

// ============================================
// VIRTUALS
// ============================================

ProyectoSchema.virtual('diasRestantes').get(function(this: IProyecto) {
  if (!this.fechaFinPrevista) return null;
  if (this.estado === EstadoProyecto.COMPLETADO || this.estado === EstadoProyecto.CERRADO) return 0;
  const hoy = new Date();
  const diffTime = this.fechaFinPrevista.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

ProyectoSchema.virtual('progreso').get(function(this: IProyecto) {
  if (!this.hitos || this.hitos.length === 0) {
    // Si no hay hitos, calcular por estado
    const estadoProgreso: Record<string, number> = {
      [EstadoProyecto.BORRADOR]: 0,
      [EstadoProyecto.PLANIFICACION]: 10,
      [EstadoProyecto.EN_CURSO]: 50,
      [EstadoProyecto.PAUSADO]: 50,
      [EstadoProyecto.COMPLETADO]: 100,
      [EstadoProyecto.CANCELADO]: 0,
      [EstadoProyecto.CERRADO]: 100,
    };
    return estadoProgreso[this.estado] || 0;
  }
  const completados = this.hitos.filter(h => h.completado).length;
  return Math.round((completados / this.hitos.length) * 100);
});

ProyectoSchema.virtual('estaRetrasado').get(function(this: IProyecto) {
  if (!this.fechaFinPrevista) return false;
  if (this.estado === EstadoProyecto.COMPLETADO || this.estado === EstadoProyecto.CERRADO) return false;
  return new Date() > this.fechaFinPrevista;
});

ProyectoSchema.virtual('rentabilidad').get(function(this: IProyecto) {
  if (!this.presupuestoAprobado || this.presupuestoAprobado === 0) return null;
  if (!this.costeReal) return 100;
  return Math.round(((this.presupuestoAprobado - this.costeReal) / this.presupuestoAprobado) * 100);
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

ProyectoSchema.statics.generarCodigo = async function(): Promise<string> {
  const año = new Date().getFullYear();
  const prefijo = `PRY-${año}-`;

  const ultimoProyecto = await this.findOne({
    codigo: new RegExp(`^${prefijo}\\d+$`),
  }).sort({ codigo: -1 }).lean();

  let numero = 1;
  if (ultimoProyecto && ultimoProyecto.codigo) {
    const match = ultimoProyecto.codigo.match(/\d+$/);
    if (match) {
      numero = parseInt(match[0], 10) + 1;
    }
  }

  return `${prefijo}${numero.toString().padStart(4, '0')}`;
};

ProyectoSchema.statics.obtenerEstadisticas = async function() {
  const hoy = new Date();

  const [
    total,
    activos,
    enCurso,
    completados,
    retrasados,
    totales,
  ] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ activo: true }),
    this.countDocuments({ estado: EstadoProyecto.EN_CURSO }),
    this.countDocuments({ estado: { $in: [EstadoProyecto.COMPLETADO, EstadoProyecto.CERRADO] } }),
    this.countDocuments({
      estado: { $nin: [EstadoProyecto.COMPLETADO, EstadoProyecto.CERRADO, EstadoProyecto.CANCELADO] },
      fechaFinPrevista: { $lt: hoy },
    }),
    this.aggregate([
      {
        $group: {
          _id: null,
          presupuestoTotal: { $sum: '$presupuestoAprobado' },
          costeTotal: { $sum: '$costeReal' },
        },
      },
    ]),
  ]);

  return {
    total,
    activos,
    enCurso,
    completados,
    retrasados,
    presupuestoTotal: totales[0]?.presupuestoTotal || 0,
    costeTotal: totales[0]?.costeTotal || 0,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

ProyectoSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const ProyectoModel = this.constructor as IProyectoModel;
      this.codigo = await ProyectoModel.generarCodigo();
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Calcular margen real si hay datos
  if (this.presupuestoAprobado && this.costeReal) {
    this.margenReal = Math.round(((this.presupuestoAprobado - this.costeReal) / this.presupuestoAprobado) * 100);
  }

  next();
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================

ProyectoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

ProyectoSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const Proyecto = mongoose.model<IProyecto, IProyectoModel>('Proyecto', ProyectoSchema);

export default Proyecto;
