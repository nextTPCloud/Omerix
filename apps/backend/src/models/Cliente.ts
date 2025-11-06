import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoCliente {
  EMPRESA = 'empresa',
  PARTICULAR = 'particular',
}

export enum FormaPago {
  CONTADO = 'contado',
  TRANSFERENCIA = 'transferencia',
  DOMICILIACION = 'domiciliacion',
  CONFIRMING = 'confirming',
  PAGARE = 'pagare',
}

// ============================================
// INTERFACES
// ============================================

export interface IDireccion {
  calle: string;
  numero?: string;
  piso?: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  latitud?: number;
  longitud?: number;
}

export interface IPersonaContacto {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
}

export interface IArchivo {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
}

export interface ICliente extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  
  // Tipo
  tipoCliente: TipoCliente;
  
  // Datos básicos
  codigo: string;
  nombre: string;
  nombreComercial?: string;
  
  // Fiscal
  nif: string;
  
  // Contacto
  email?: string;
  telefono?: string;
  movil?: string;
  web?: string;
  
  // Direcciones
  direccion: IDireccion;
  direccionEnvio?: IDireccion;
  
  // Comercial
  formaPago: FormaPago;
  diasPago: number;
  descuentoGeneral?: number;
  tarifaId?: mongoose.Types.ObjectId;
  
  // Bancarios
  iban?: string;
  swift?: string;
  
  // Contacto
  personaContacto?: IPersonaContacto;
  
  // Clasificación
  categoriaId?: mongoose.Types.ObjectId;
  zona?: string;
  vendedorId?: mongoose.Types.ObjectId;
  
  // Límites
  limiteCredito?: number;
  riesgoActual: number;
  
  // Estado
  activo: boolean;
  observaciones?: string;
  
  // Tags
  tags?: string[];
  
  // Archivos
  archivos?: IArchivo[];
  
  // Campos personalizados
  camposPersonalizados?: Map<string, any>;
  
  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;
}

// Métodos estáticos del modelo
export interface IClienteModel extends Model<ICliente> {
  generarCodigo(empresaId: mongoose.Types.ObjectId): Promise<string>;
  obtenerEstadisticas(empresaId: mongoose.Types.ObjectId): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    excedenCredito: number;
    riesgoTotal: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

const DireccionSchema = new Schema<IDireccion>({
  calle: { type: String, required: true },
  numero: { type: String },
  piso: { type: String },
  codigoPostal: { type: String, required: true },
  ciudad: { type: String, required: true },
  provincia: { type: String, required: true },
  pais: { type: String, required: true, default: 'España' },
  latitud: { type: Number },
  longitud: { type: Number },
}, { _id: false });

const PersonaContactoSchema = new Schema<IPersonaContacto>({
  nombre: { type: String, required: true },
  cargo: { type: String },
  telefono: { type: String },
  email: { type: String },
}, { _id: false });

const ArchivoSchema = new Schema<IArchivo>({
  nombre: { type: String, required: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { _id: false });

// ============================================
// SCHEMA PRINCIPAL - CON _id FORZADO
// ============================================

const ClienteSchema = new Schema<ICliente, IClienteModel>({
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
  
  // Tipo
  tipoCliente: {
    type: String,
    enum: Object.values(TipoCliente),
    required: true,
    default: TipoCliente.PARTICULAR,
  },
  
  // Datos básicos
  codigo: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  nombreComercial: {
    type: String,
    trim: true,
  },
  
  // Fiscal
  nif: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  
  // Contacto
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  telefono: {
    type: String,
    trim: true,
  },
  movil: {
    type: String,
    trim: true,
  },
  web: {
    type: String,
    trim: true,
  },
  
  // Direcciones
  direccion: {
    type: DireccionSchema,
    required: true,
  },
  direccionEnvio: {
    type: DireccionSchema,
  },
  
  // Comercial
  formaPago: {
    type: String,
    enum: Object.values(FormaPago),
    required: true,
    default: FormaPago.CONTADO,
  },
  diasPago: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  descuentoGeneral: {
    type: Number,
    min: 0,
    max: 100,
  },
  tarifaId: {
    type: Schema.Types.ObjectId,
    ref: 'Tarifa',
  },
  
  // Bancarios
  iban: {
    type: String,
    uppercase: true,
    trim: true,
  },
  swift: {
    type: String,
    uppercase: true,
    trim: true,
  },
  
  // Contacto
  personaContacto: {
    type: PersonaContactoSchema,
  },
  
  // Clasificación
  categoriaId: {
    type: Schema.Types.ObjectId,
    ref: 'Categoria',
  },
  zona: {
    type: String,
    trim: true,
  },
  vendedorId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  
  // Límites
  limiteCredito: {
    type: Number,
    min: 0,
  },
  riesgoActual: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // Estado
  activo: {
    type: Boolean,
    default: true,
    index: true,
  },
  observaciones: {
    type: String,
  },
  
  // Tags
  tags: [{
    type: String,
    trim: true,
  }],
  
  // Archivos
  archivos: [ArchivoSchema],
  
  // Campos personalizados
  camposPersonalizados: {
    type: Map,
    of: Schema.Types.Mixed,
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
  collection: 'clientes',
});

// ============================================
// ÍNDICES COMPUESTOS
// ============================================

ClienteSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });
ClienteSchema.index({ empresaId: 1, nif: 1 }, { unique: true });
ClienteSchema.index({ empresaId: 1, activo: 1 });
ClienteSchema.index({ empresaId: 1, nombre: 1 });
ClienteSchema.index({ empresaId: 1, tags: 1 });
ClienteSchema.index({ empresaId: 1, vendedorId: 1 });

// ============================================
// VIRTUALS
// ============================================

ClienteSchema.virtual('nombreCompleto').get(function() {
  return this.nombreComercial || this.nombre;
});

ClienteSchema.virtual('excedeCredito').get(function() {
  return this.limiteCredito ? this.riesgoActual > this.limiteCredito : false;
});

ClienteSchema.virtual('creditoDisponible').get(function() {
  if (!this.limiteCredito) return null;
  return Math.max(0, this.limiteCredito - this.riesgoActual);
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

ClienteSchema.statics.generarCodigo = async function(
  empresaId: mongoose.Types.ObjectId
): Promise<string> {
  const ultimoCliente = await this.findOne({ empresaId })
    .sort({ codigo: -1 })
    .select('codigo');

  if (!ultimoCliente || !ultimoCliente.codigo) {
    return 'CLI-001';
  }

  const ultimoNumero = parseInt(ultimoCliente.codigo.split('-')[1] || '0');
  const nuevoNumero = ultimoNumero + 1;
  return `CLI-${nuevoNumero.toString().padStart(3, '0')}`;
};

ClienteSchema.statics.obtenerEstadisticas = async function(
  empresaId: mongoose.Types.ObjectId
) {
  const [totales, activos, inactivos, excedenCredito] = await Promise.all([
    this.countDocuments({ empresaId }),
    this.countDocuments({ empresaId, activo: true }),
    this.countDocuments({ empresaId, activo: false }),
    this.countDocuments({
      empresaId,
      activo: true,
      $expr: { $gt: ['$riesgoActual', '$limiteCredito'] }
    })
  ]);

  const riesgoTotal = await this.aggregate([
    { $match: { empresaId, activo: true } },
    { $group: { _id: null, total: { $sum: '$riesgoActual' } } }
  ]);

  return {
    total: totales,
    activos,
    inactivos,
    excedenCredito,
    riesgoTotal: riesgoTotal[0]?.total || 0
  };
};

// ============================================
// MIDDLEWARE
// ============================================

ClienteSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const ClienteModel = this.constructor as IClienteModel;
      this.codigo = await ClienteModel.generarCodigo(this.empresaId);
    }
  }
  
  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }
  
  next();
});

ClienteSchema.pre('save', function(next) {
  if (this.limiteCredito && this.limiteCredito < 0) {
    next(new Error('El límite de crédito no puede ser negativo'));
  } else {
    next();
  }
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================

ClienteSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  }
});

ClienteSchema.set('toObject', {
  virtuals: true
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const Cliente = mongoose.model<ICliente, IClienteModel>('Cliente', ClienteSchema);