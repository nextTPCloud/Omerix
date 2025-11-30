import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoAgenteComercial {
  VENDEDOR = 'vendedor',
  REPRESENTANTE = 'representante',
  COMERCIAL = 'comercial',
  DELEGADO = 'delegado',
  AGENTE_EXTERNO = 'agente_externo'
}

export enum EstadoAgenteComercial {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  BAJA = 'baja',
  VACACIONES = 'vacaciones'
}

export enum TipoComision {
  PORCENTAJE = 'porcentaje',
  FIJO = 'fijo',
  MIXTO = 'mixto'
}

// ============================================
// INTERFACES
// ============================================

export interface IDatosContacto {
  email?: string;
  emailSecundario?: string;
  telefono?: string;
  telefonoMovil?: string;
  fax?: string;
}

export interface IDireccionAgente {
  direccion?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
}

export interface IComision {
  tipo: TipoComision;
  porcentaje?: number; // Porcentaje de comisión (0-100)
  importeFijo?: number; // Importe fijo por venta
  porcentajeMinimo?: number; // Porcentaje mínimo garantizado
  porcentajeMaximo?: number; // Porcentaje máximo permitido
}

export interface IZonaAsignada {
  zona: string;
  descripcion?: string;
  activa: boolean;
  fechaAsignacion: Date;
}

export interface IObjetivoVentas {
  periodo: string; // Ej: "2024-Q1", "2024-01"
  objetivo: number;
  conseguido: number;
  porcentajeCumplimiento?: number;
}

export interface IAgenteComercial extends Document {
  // Identificación
  codigo: string;
  nombre: string;
  apellidos?: string;
  nif?: string;

  // Tipo y estado
  tipo: TipoAgenteComercial;
  estado: EstadoAgenteComercial;
  activo: boolean;

  // Datos de contacto
  contacto: IDatosContacto;
  direccion: IDireccionAgente;

  // Comisiones
  comision: IComision;

  // Asignaciones
  zonasAsignadas: IZonaAsignada[];
  clientesAsignados: mongoose.Types.ObjectId[];
  familiasAsignadas: mongoose.Types.ObjectId[];

  // Datos bancarios
  iban?: string;
  swift?: string;
  banco?: string;

  // Objetivos y rendimiento
  objetivosVentas: IObjetivoVentas[];
  ventasTotales: number;
  comisionesAcumuladas: number;

  // Jerarquía
  supervisorId?: mongoose.Types.ObjectId;

  // Fechas
  fechaAlta: Date;
  fechaBaja?: Date;

  // Observaciones
  observaciones?: string;
  tags?: string[];

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaModificacion?: Date;

  // Virtuals
  nombreCompleto: string;
  comisionEfectiva: number;
}

export interface IAgenteComercialModel extends Model<IAgenteComercial> {
  generarCodigo(): Promise<string>;
  obtenerEstadisticas(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    porTipo: { [key: string]: number };
    ventasTotales: number;
    comisionesTotales: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

const DatosContactoSchema = new Schema<IDatosContacto>({
  email: { type: String, lowercase: true, trim: true },
  emailSecundario: { type: String, lowercase: true, trim: true },
  telefono: { type: String, trim: true },
  telefonoMovil: { type: String, trim: true },
  fax: { type: String, trim: true }
}, { _id: false });

const DireccionAgenteSchema = new Schema<IDireccionAgente>({
  direccion: { type: String, trim: true },
  codigoPostal: { type: String, trim: true },
  ciudad: { type: String, trim: true },
  provincia: { type: String, trim: true },
  pais: { type: String, trim: true, default: 'España' }
}, { _id: false });

const ComisionSchema = new Schema<IComision>({
  tipo: {
    type: String,
    enum: Object.values(TipoComision),
    default: TipoComision.PORCENTAJE
  },
  porcentaje: { type: Number, min: 0, max: 100, default: 0 },
  importeFijo: { type: Number, min: 0, default: 0 },
  porcentajeMinimo: { type: Number, min: 0, max: 100 },
  porcentajeMaximo: { type: Number, min: 0, max: 100 }
}, { _id: false });

const ZonaAsignadaSchema = new Schema<IZonaAsignada>({
  zona: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  activa: { type: Boolean, default: true },
  fechaAsignacion: { type: Date, default: Date.now }
}, { _id: true });

const ObjetivoVentasSchema = new Schema<IObjetivoVentas>({
  periodo: { type: String, required: true },
  objetivo: { type: Number, required: true, min: 0 },
  conseguido: { type: Number, default: 0, min: 0 },
  porcentajeCumplimiento: { type: Number }
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const AgenteComercialSchema = new Schema<IAgenteComercial, IAgenteComercialModel>({
  // Identificación
  codigo: {
    type: String,
    required: [true, 'El código es obligatorio'],
    unique: true,
    trim: true,
    uppercase: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  apellidos: {
    type: String,
    trim: true,
    maxlength: [150, 'Los apellidos no pueden exceder 150 caracteres']
  },
  nif: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true
  },

  // Tipo y estado
  tipo: {
    type: String,
    enum: Object.values(TipoAgenteComercial),
    default: TipoAgenteComercial.COMERCIAL
  },
  estado: {
    type: String,
    enum: Object.values(EstadoAgenteComercial),
    default: EstadoAgenteComercial.ACTIVO
  },
  activo: {
    type: Boolean,
    default: true
  },

  // Datos de contacto
  contacto: {
    type: DatosContactoSchema,
    default: () => ({})
  },
  direccion: {
    type: DireccionAgenteSchema,
    default: () => ({})
  },

  // Comisiones
  comision: {
    type: ComisionSchema,
    default: () => ({ tipo: TipoComision.PORCENTAJE, porcentaje: 0 })
  },

  // Asignaciones
  zonasAsignadas: {
    type: [ZonaAsignadaSchema],
    default: []
  },
  clientesAsignados: [{
    type: Schema.Types.ObjectId,
    ref: 'Cliente'
  }],
  familiasAsignadas: [{
    type: Schema.Types.ObjectId,
    ref: 'Familia'
  }],

  // Datos bancarios
  iban: { type: String, trim: true, uppercase: true },
  swift: { type: String, trim: true, uppercase: true },
  banco: { type: String, trim: true },

  // Objetivos y rendimiento
  objetivosVentas: {
    type: [ObjetivoVentasSchema],
    default: []
  },
  ventasTotales: {
    type: Number,
    default: 0,
    min: 0
  },
  comisionesAcumuladas: {
    type: Number,
    default: 0,
    min: 0
  },

  // Jerarquía
  supervisorId: {
    type: Schema.Types.ObjectId,
    ref: 'AgenteComercial'
  },

  // Fechas
  fechaAlta: {
    type: Date,
    default: Date.now
  },
  fechaBaja: {
    type: Date
  },

  // Observaciones
  observaciones: { type: String, trim: true },
  tags: [{ type: String, trim: true, lowercase: true }],

  // Auditoría
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  modificadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  fechaModificacion: {
    type: Date
  }
}, {
  timestamps: false,
  collection: 'agentesComerciales'
});

// ============================================
// ÍNDICES
// ============================================
// Nota: codigo ya tiene unique:true en la definición del campo, no duplicar aquí

AgenteComercialSchema.index({ nif: 1 }, { sparse: true });
AgenteComercialSchema.index({ activo: 1 });
AgenteComercialSchema.index({ tipo: 1 });
AgenteComercialSchema.index({ estado: 1 });
AgenteComercialSchema.index({ nombre: 1, apellidos: 1 });
AgenteComercialSchema.index({ 'zonasAsignadas.zona': 1 });
AgenteComercialSchema.index({ supervisorId: 1 });
AgenteComercialSchema.index({ tags: 1 });

// ============================================
// VIRTUALS
// ============================================

AgenteComercialSchema.virtual('nombreCompleto').get(function(this: IAgenteComercial) {
  return this.apellidos ? `${this.nombre} ${this.apellidos}` : this.nombre;
});

AgenteComercialSchema.virtual('comisionEfectiva').get(function(this: IAgenteComercial) {
  if (this.comision.tipo === TipoComision.PORCENTAJE) {
    return this.comision.porcentaje || 0;
  } else if (this.comision.tipo === TipoComision.FIJO) {
    return this.comision.importeFijo || 0;
  }
  return this.comision.porcentaje || 0;
});

// ============================================
// MIDDLEWARES
// ============================================

AgenteComercialSchema.pre('save', async function(next) {
  // Generar código si no existe
  if (!this.codigo) {
    this.codigo = await (this.constructor as IAgenteComercialModel).generarCodigo();
  }

  // Actualizar fecha de modificación
  if (!this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Normalizar NIF
  if (this.nif) {
    this.nif = this.nif.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // Calcular porcentaje de cumplimiento en objetivos
  this.objetivosVentas.forEach(obj => {
    if (obj.objetivo > 0) {
      obj.porcentajeCumplimiento = (obj.conseguido / obj.objetivo) * 100;
    }
  });

  next();
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

AgenteComercialSchema.statics.generarCodigo = async function(): Promise<string> {
  const prefijo = 'AG';
  const ultimoAgente = await this.findOne({
    codigo: new RegExp(`^${prefijo}\\d+$`)
  }).sort({ codigo: -1 }).lean();

  let numero = 1;
  if (ultimoAgente && ultimoAgente.codigo) {
    const match = ultimoAgente.codigo.match(/\d+$/);
    if (match) {
      numero = parseInt(match[0], 10) + 1;
    }
  }

  return `${prefijo}${numero.toString().padStart(4, '0')}`;
};

AgenteComercialSchema.statics.obtenerEstadisticas = async function() {
  const [total, activos, porTipoResult, totalesResult] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ activo: true }),
    this.aggregate([
      { $group: { _id: '$tipo', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      {
        $group: {
          _id: null,
          ventasTotales: { $sum: '$ventasTotales' },
          comisionesTotales: { $sum: '$comisionesAcumuladas' }
        }
      }
    ])
  ]);

  const porTipo: { [key: string]: number } = {};
  porTipoResult.forEach((item: { _id: string; count: number }) => {
    porTipo[item._id] = item.count;
  });

  const totales = totalesResult[0] || { ventasTotales: 0, comisionesTotales: 0 };

  return {
    total,
    activos,
    inactivos: total - activos,
    porTipo,
    ventasTotales: totales.ventasTotales,
    comisionesTotales: totales.comisionesTotales
  };
};

// ============================================
// MODELO
// ============================================

export const AgenteComercial = mongoose.model<IAgenteComercial, IAgenteComercialModel>(
  'AgenteComercial',
  AgenteComercialSchema
);

export default AgenteComercial;
