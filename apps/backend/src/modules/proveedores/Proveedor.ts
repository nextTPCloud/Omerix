import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoProveedor {
  EMPRESA = 'empresa',
  AUTONOMO = 'autonomo',
  PARTICULAR = 'particular',
}

// Tipos de dirección disponibles
export enum TipoDireccion {
  FISCAL = 'fiscal',
  ALMACEN = 'almacen',
  RECOGIDA = 'recogida',
  OTRO = 'otro',
}

// ============================================
// INTERFACES
// ============================================

// Dirección base
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

// Dirección extendida con tipo
export interface IDireccionExtendida extends IDireccion {
  _id?: mongoose.Types.ObjectId;
  tipo: TipoDireccion;
  nombre?: string;
  personaContacto?: string;
  telefonoContacto?: string;
  horario?: string;
  notas?: string;
  predeterminada: boolean;
  activa: boolean;
}

// Cuenta bancaria
export interface ICuentaBancaria {
  _id?: mongoose.Types.ObjectId;
  alias?: string;
  titular: string;
  iban: string;
  swift?: string;
  banco?: string;
  sucursal?: string;
  predeterminada: boolean;
  activa: boolean;
  fechaCreacion?: Date;
  notas?: string;
}

export interface IPersonaContacto {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  departamento?: string;
}

export interface IArchivo {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
}

export interface IProveedor extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId?: mongoose.Types.ObjectId;

  // Tipo
  tipoProveedor: TipoProveedor;

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
  fax?: string;
  web?: string;

  // ============================================
  // DIRECCIONES MÚLTIPLES
  // ============================================
  direcciones: IDireccionExtendida[];

  // Dirección legacy (para compatibilidad)
  /** @deprecated Usar direcciones[] con tipo 'fiscal' */
  direccion?: IDireccion;

  // ============================================
  // CONDICIONES COMERCIALES
  // ============================================
  formaPagoId?: mongoose.Types.ObjectId;
  terminoPagoId?: mongoose.Types.ObjectId;

  // Días de pago (ej: 30, 60, 90 días)
  diasPago?: number;

  // Descuento general del proveedor
  descuentoGeneral?: number;

  // Portes
  portesMinimosPedido?: number; // Pedido mínimo para portes gratis
  portesImporte?: number; // Importe de portes si no se alcanza el mínimo

  // ============================================
  // CUENTAS BANCARIAS MÚLTIPLES
  // ============================================
  cuentasBancarias: ICuentaBancaria[];

  // Campos legacy (para compatibilidad)
  /** @deprecated Usar cuentasBancarias[] */
  iban?: string;
  /** @deprecated Usar cuentasBancarias[] */
  swift?: string;

  // ============================================
  // CONTACTOS
  // ============================================
  personaContacto?: IPersonaContacto;
  personasContacto?: IPersonaContacto[];

  // Clasificación
  categoriaId?: mongoose.Types.ObjectId;
  zona?: string;

  // Evaluación del proveedor
  calificacion?: number; // 1-5 estrellas
  tiempoEntregaPromedio?: number; // Días promedio de entrega
  fiabilidad?: number; // Porcentaje de cumplimiento

  // Estado
  activo: boolean;
  observaciones?: string;

  // Certificaciones
  certificaciones?: string[];

  // Tags
  tags?: string[];

  // Archivos
  archivos?: IArchivo[];

  // Campos personalizados
  camposPersonalizados?: Map<string, any>;

  // Estadísticas (calculadas)
  totalCompras?: number;
  ultimaCompra?: Date;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;
}

// Métodos estáticos del modelo
export interface IProveedorModel extends Model<IProveedor> {
  generarCodigo(): Promise<string>;
  obtenerEstadisticas(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    totalCompras: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

// Schema de dirección base
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

// Schema de dirección extendida con tipo
const DireccionExtendidaSchema = new Schema<IDireccionExtendida>({
  tipo: {
    type: String,
    enum: Object.values(TipoDireccion),
    required: true,
    default: TipoDireccion.FISCAL,
  },
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
  personaContacto: { type: String, trim: true },
  telefonoContacto: { type: String, trim: true },
  horario: { type: String, trim: true },
  notas: { type: String },
  predeterminada: { type: Boolean, default: false },
  activa: { type: Boolean, default: true },
}, { _id: true });

// Schema de cuenta bancaria
const CuentaBancariaSchema = new Schema<ICuentaBancaria>({
  alias: { type: String, trim: true },
  titular: { type: String, required: true, trim: true },
  iban: { type: String, required: true, uppercase: true, trim: true },
  swift: { type: String, uppercase: true, trim: true },
  banco: { type: String, trim: true },
  sucursal: { type: String, trim: true },
  predeterminada: { type: Boolean, default: false },
  activa: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now },
  notas: { type: String },
}, { _id: true });

const PersonaContactoSchema = new Schema<IPersonaContacto>({
  nombre: { type: String, required: true },
  cargo: { type: String },
  telefono: { type: String },
  email: { type: String },
  departamento: { type: String },
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
// SCHEMA PRINCIPAL
// ============================================

const ProveedorSchema = new Schema<IProveedor, IProveedorModel>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },
  empresaId: {
    type: Schema.Types.ObjectId,
    ref: 'Empresa',
    required: false,
    index: false,
  },

  // Tipo
  tipoProveedor: {
    type: String,
    enum: Object.values(TipoProveedor),
    required: true,
    default: TipoProveedor.EMPRESA,
  },

  // Datos básicos
  codigo: {
    type: String,
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
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
  fax: {
    type: String,
    trim: true,
  },
  web: {
    type: String,
    trim: true,
  },

  // ============================================
  // DIRECCIONES MÚLTIPLES
  // ============================================
  direcciones: {
    type: [DireccionExtendidaSchema],
    default: [],
  },

  // Dirección legacy
  direccion: {
    type: DireccionSchema,
    required: false,
  },

  // ============================================
  // CONDICIONES COMERCIALES
  // ============================================
  formaPagoId: {
    type: Schema.Types.ObjectId,
    ref: 'FormaPago',
  },
  terminoPagoId: {
    type: Schema.Types.ObjectId,
    ref: 'TerminoPago',
  },
  diasPago: {
    type: Number,
    default: 30,
    min: 0,
  },
  descuentoGeneral: {
    type: Number,
    min: 0,
    max: 100,
  },
  portesMinimosPedido: {
    type: Number,
    min: 0,
  },
  portesImporte: {
    type: Number,
    min: 0,
  },

  // ============================================
  // CUENTAS BANCARIAS MÚLTIPLES
  // ============================================
  cuentasBancarias: {
    type: [CuentaBancariaSchema],
    default: [],
  },

  // Campos legacy
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

  // ============================================
  // CONTACTOS
  // ============================================
  personaContacto: {
    type: PersonaContactoSchema,
  },
  personasContacto: {
    type: [PersonaContactoSchema],
    default: [],
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

  // Evaluación del proveedor
  calificacion: {
    type: Number,
    min: 1,
    max: 5,
  },
  tiempoEntregaPromedio: {
    type: Number,
    min: 0,
  },
  fiabilidad: {
    type: Number,
    min: 0,
    max: 100,
  },

  // Estado
  activo: {
    type: Boolean,
    default: true,
  },
  observaciones: {
    type: String,
  },

  // Certificaciones
  certificaciones: [{
    type: String,
    trim: true,
  }],

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

  // Estadísticas
  totalCompras: {
    type: Number,
    default: 0,
    min: 0,
  },
  ultimaCompra: {
    type: Date,
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
  collection: 'proveedores',
});

// ============================================
// ÍNDICES
// ============================================

ProveedorSchema.index({ activo: 1 });
ProveedorSchema.index({ nombre: 1 });
ProveedorSchema.index({ tags: 1 });
ProveedorSchema.index({ formaPagoId: 1 });
ProveedorSchema.index({ terminoPagoId: 1 });
ProveedorSchema.index({ categoriaId: 1 });
ProveedorSchema.index({ 'direcciones.ciudad': 1 });
ProveedorSchema.index({ 'direcciones.provincia': 1 });
ProveedorSchema.index({ 'direcciones.tipo': 1 });
ProveedorSchema.index({ calificacion: -1 });

// Índice de texto para búsquedas
ProveedorSchema.index({
  nombre: 'text',
  nombreComercial: 'text',
  nif: 'text',
  email: 'text',
}, {
  weights: {
    nombre: 10,
    nombreComercial: 5,
    nif: 8,
    email: 3,
  },
  name: 'proveedor_text_search',
});

// ============================================
// VIRTUALS
// ============================================

ProveedorSchema.virtual('nombreCompleto').get(function() {
  return this.nombreComercial || this.nombre;
});

// Virtual para obtener la dirección fiscal
ProveedorSchema.virtual('direccionFiscal').get(function() {
  if (this.direcciones && this.direcciones.length > 0) {
    const fiscal = this.direcciones.find(
      (d: IDireccionExtendida) => d.tipo === TipoDireccion.FISCAL && d.predeterminada && d.activa
    );
    if (fiscal) return fiscal;
    const anyFiscal = this.direcciones.find(
      (d: IDireccionExtendida) => d.tipo === TipoDireccion.FISCAL && d.activa
    );
    if (anyFiscal) return anyFiscal;
  }
  return this.direccion || null;
});

// Virtual para obtener la cuenta bancaria predeterminada
ProveedorSchema.virtual('cuentaBancariaPredeterminada').get(function() {
  if (this.cuentasBancarias && this.cuentasBancarias.length > 0) {
    const predeterminada = this.cuentasBancarias.find(
      (c: ICuentaBancaria) => c.predeterminada && c.activa
    );
    if (predeterminada) return predeterminada;
    const anyActiva = this.cuentasBancarias.find(
      (c: ICuentaBancaria) => c.activa
    );
    if (anyActiva) return anyActiva;
  }
  if (this.iban) {
    return { iban: this.iban, swift: this.swift, titular: this.nombre };
  }
  return null;
});

// Virtual para contar direcciones activas
ProveedorSchema.virtual('numDireccionesActivas').get(function() {
  return this.direcciones?.filter((d: IDireccionExtendida) => d.activa).length || 0;
});

// Virtual para contar cuentas bancarias activas
ProveedorSchema.virtual('numCuentasActivas').get(function() {
  return this.cuentasBancarias?.filter((c: ICuentaBancaria) => c.activa).length || 0;
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

ProveedorSchema.statics.generarCodigo = async function(): Promise<string> {
  const ultimoProveedor = await this.findOne()
    .sort({ codigo: -1 })
    .select('codigo');

  if (!ultimoProveedor || !ultimoProveedor.codigo) {
    return 'PROV-001';
  }

  const ultimoNumero = parseInt(ultimoProveedor.codigo.split('-')[1] || '0');
  const nuevoNumero = ultimoNumero + 1;
  return `PROV-${nuevoNumero.toString().padStart(3, '0')}`;
};

ProveedorSchema.statics.obtenerEstadisticas = async function() {
  const [totales, activos, inactivos] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ activo: true }),
    this.countDocuments({ activo: false }),
  ]);

  const totalCompras = await this.aggregate([
    { $match: { activo: true } },
    { $group: { _id: null, total: { $sum: '$totalCompras' } } }
  ]);

  return {
    total: totales,
    activos,
    inactivos,
    totalCompras: totalCompras[0]?.total || 0
  };
};

// ============================================
// MIDDLEWARE
// ============================================

ProveedorSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const ProveedorModel = this.constructor as IProveedorModel;
      this.codigo = await ProveedorModel.generarCodigo();
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Normalizar NIF
  if (this.nif) {
    this.nif = this.nif.toUpperCase().trim();
  }

  next();
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================

ProveedorSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  }
});

ProveedorSchema.set('toObject', {
  virtuals: true
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const Proveedor = mongoose.model<IProveedor, IProveedorModel>('Proveedor', ProveedorSchema);
