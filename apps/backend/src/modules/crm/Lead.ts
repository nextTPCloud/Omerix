import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum OrigenLead {
  WEB = 'web',
  REFERIDO = 'referido',
  FERIA = 'feria',
  PUBLICIDAD = 'publicidad',
  LLAMADA_FRIA = 'llamada_fria',
  REDES_SOCIALES = 'redes_sociales',
  EMAIL_MARKETING = 'email_marketing',
  OTRO = 'otro',
}

export enum EstadoLead {
  NUEVO = 'nuevo',
  CONTACTADO = 'contactado',
  CALIFICADO = 'calificado',
  DESCALIFICADO = 'descalificado',
  CONVERTIDO = 'convertido',
}

export enum InteresLead {
  FRIO = 'frio',
  TIBIO = 'tibio',
  CALIENTE = 'caliente',
}

// ============================================
// INTERFACES
// ============================================

export interface IDireccionLead {
  calle?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  pais?: string;
}

export interface IConversionLead {
  clienteId?: mongoose.Types.ObjectId;
  oportunidadId?: mongoose.Types.ObjectId;
  fecha?: Date;
}

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId?: mongoose.Types.ObjectId;

  // Datos básicos
  nombre: string;
  apellidos?: string;
  empresa?: string;
  cargo?: string;

  // Contacto
  email?: string;
  telefono?: string;
  movil?: string;
  web?: string;

  // Dirección
  direccion?: IDireccionLead;

  // CRM
  origen: OrigenLead;
  estado: EstadoLead;
  puntuacion: number;
  interes: InteresLead;

  // Seguimiento
  asignadoA?: mongoose.Types.ObjectId;
  proximoContacto?: Date;
  notas?: string;
  etiquetas?: string[];

  // Conversión
  convertidoA?: IConversionLead;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  actualizadoPor?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const DireccionLeadSchema = new Schema<IDireccionLead>(
  {
    calle: { type: String },
    ciudad: { type: String },
    provincia: { type: String },
    codigoPostal: { type: String },
    pais: { type: String, default: 'España' },
  },
  { _id: false }
);

const ConversionLeadSchema = new Schema<IConversionLead>(
  {
    clienteId: { type: Schema.Types.ObjectId, ref: 'Cliente' },
    oportunidadId: { type: Schema.Types.ObjectId, ref: 'Oportunidad' },
    fecha: { type: Date },
  },
  { _id: false }
);

const LeadSchema = new Schema<ILead>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa' },

    // Datos básicos
    nombre: { type: String, required: true, trim: true },
    apellidos: { type: String, trim: true },
    empresa: { type: String, trim: true },
    cargo: { type: String, trim: true },

    // Contacto
    email: { type: String, trim: true, lowercase: true },
    telefono: { type: String, trim: true },
    movil: { type: String, trim: true },
    web: { type: String, trim: true },

    // Dirección
    direccion: { type: DireccionLeadSchema },

    // CRM
    origen: {
      type: String,
      enum: Object.values(OrigenLead),
      default: OrigenLead.OTRO,
    },
    estado: {
      type: String,
      enum: Object.values(EstadoLead),
      default: EstadoLead.NUEVO,
    },
    puntuacion: { type: Number, default: 0, min: 0, max: 100 },
    interes: {
      type: String,
      enum: Object.values(InteresLead),
      default: InteresLead.FRIO,
    },

    // Seguimiento
    asignadoA: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    proximoContacto: { type: Date },
    notas: { type: String },
    etiquetas: [{ type: String, trim: true }],

    // Conversión
    convertidoA: { type: ConversionLeadSchema },

    // Auditoría
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    actualizadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  },
  {
    timestamps: true,
    collection: 'leads',
  }
);

// ============================================
// ÍNDICES
// ============================================

LeadSchema.index({ empresaId: 1 });
LeadSchema.index({ estado: 1 });
LeadSchema.index({ origen: 1 });
LeadSchema.index({ interes: 1 });
LeadSchema.index({ asignadoA: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ empresa: 'text', nombre: 'text', apellidos: 'text' });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ proximoContacto: 1 });

// ============================================
// MODELO
// ============================================

export const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
