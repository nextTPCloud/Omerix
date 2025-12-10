// backend/src/modules/certificados/certificados.schema.ts

import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

// Clave de encriptación para datos sensibles
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'omerix-encryption-key-32-chars!!';
const IV_LENGTH = 16;

// Funciones de encriptación
function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Error desencriptando:', error);
    return text;
  }
}

// ============================================
// ENUMS
// ============================================

export enum TipoCertificado {
  PERSONA_FISICA = 'persona_fisica',
  PERSONA_JURIDICA = 'persona_juridica',
  REPRESENTANTE = 'representante',
  SELLO_EMPRESA = 'sello_empresa',
}

export enum EstadoCertificado {
  ACTIVO = 'activo',
  CADUCADO = 'caducado',
  REVOCADO = 'revocado',
  PENDIENTE = 'pendiente',
}

export enum UsosCertificado {
  VERIFACTU = 'verifactu',
  TICKETBAI = 'ticketbai',
  SII = 'sii',
  FIRMA_DOCUMENTOS = 'firma_documentos',
  TODOS = 'todos',
}

export enum OrigenCertificado {
  ARCHIVO = 'archivo',           // Subido como archivo .p12/.pfx
  WINDOWS_STORE = 'windows_store', // Del almacén de certificados de Windows
}

// ============================================
// INTERFACES
// ============================================

export interface ICertificadoElectronico extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Información del certificado
  nombre: string;
  descripcion?: string;
  tipo: TipoCertificado;
  estado: EstadoCertificado;
  origen: OrigenCertificado; // Origen del certificado (archivo o Windows Store)

  // Datos del titular
  titular: {
    nombre: string;
    nif: string;
    organizacion?: string;
  };

  // Emisor del certificado
  emisor: {
    nombre: string;
    organizacion?: string;
  };

  // Validez
  fechaEmision: Date;
  fechaExpiracion: Date;

  // Número de serie único del certificado
  numeroSerie: string;

  // Archivo del certificado (encriptado) - Solo para origen ARCHIVO
  archivo?: {
    nombre: string;
    contenido: string; // Base64 encriptado del .p12/.pfx
    tipo: 'p12' | 'pfx';
    tamaño: number;
  };

  // Contraseña del certificado (encriptada) - Solo para origen ARCHIVO
  password?: string;

  // Referencia al almacén de Windows - Solo para origen WINDOWS_STORE
  windowsStore?: {
    storeName: string;       // MY, ROOT, CA, etc.
    storeLocation: string;   // CurrentUser o LocalMachine
    thumbprint: string;      // Huella SHA1 para identificar el certificado
    friendlyName?: string;   // Nombre amigable en el almacén
  };

  // Huella digital (fingerprint)
  huella: {
    sha1: string;
    sha256: string;
  };

  // Usos permitidos
  usos: UsosCertificado[];

  // Es el certificado predeterminado para esta empresa
  predeterminado: boolean;

  // Control
  activo: boolean;

  // Última vez usado
  ultimoUso?: Date;
  contadorUsos: number;

  // Auditoría
  creadoPor: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Métodos
  validarPassword(password: string): Promise<boolean>;
  obtenerContenidoDesencriptado(): string;
  obtenerPasswordDesencriptado(): string;
}

// ============================================
// SCHEMA
// ============================================

const CertificadoElectronicoSchema = new Schema<ICertificadoElectronico>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },

  empresaId: {
    type: Schema.Types.ObjectId,
    ref: 'Empresa',
    required: [true, 'La empresa es obligatoria'],
    index: true,
  },

  // Información del certificado
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: 200,
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  tipo: {
    type: String,
    enum: Object.values(TipoCertificado),
    default: TipoCertificado.PERSONA_JURIDICA,
  },
  estado: {
    type: String,
    enum: Object.values(EstadoCertificado),
    default: EstadoCertificado.ACTIVO,
  },
  origen: {
    type: String,
    enum: Object.values(OrigenCertificado),
    default: OrigenCertificado.ARCHIVO,
    required: true,
  },

  // Datos del titular
  titular: {
    nombre: { type: String, required: true, trim: true },
    nif: { type: String, required: true, trim: true, uppercase: true },
    organizacion: { type: String, trim: true },
  },

  // Emisor
  emisor: {
    nombre: { type: String, trim: true },
    organizacion: { type: String, trim: true },
  },

  // Validez
  fechaEmision: {
    type: Date,
    required: true,
  },
  fechaExpiracion: {
    type: Date,
    required: true,
    index: true,
  },

  // Número de serie
  numeroSerie: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  // Archivo del certificado (encriptado) - Solo para origen ARCHIVO
  archivo: {
    nombre: { type: String, trim: true },
    contenido: { type: String, select: false }, // No se devuelve por defecto
    tipo: { type: String, enum: ['p12', 'pfx'] },
    tamaño: { type: Number },
  },

  // Contraseña (encriptada) - Solo para origen ARCHIVO
  password: {
    type: String,
    select: false, // No se devuelve por defecto
  },

  // Referencia al almacén de Windows - Solo para origen WINDOWS_STORE
  windowsStore: {
    storeName: { type: String, trim: true },       // MY, ROOT, CA, etc.
    storeLocation: { type: String, trim: true },   // CurrentUser o LocalMachine
    thumbprint: { type: String, trim: true },      // Huella SHA1 para identificar el certificado
    friendlyName: { type: String, trim: true },    // Nombre amigable en el almacén
  },

  // Huella digital
  huella: {
    sha1: { type: String, required: true },
    sha256: { type: String, required: true },
  },

  // Usos permitidos
  usos: [{
    type: String,
    enum: Object.values(UsosCertificado),
  }],

  // Predeterminado
  predeterminado: {
    type: Boolean,
    default: false,
  },

  // Control
  activo: {
    type: Boolean,
    default: true,
    index: true,
  },

  // Estadísticas de uso
  ultimoUso: {
    type: Date,
  },
  contadorUsos: {
    type: Number,
    default: 0,
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
  collection: 'certificados_electronicos',
});

// ============================================
// ÍNDICES
// ============================================

CertificadoElectronicoSchema.index({ empresaId: 1, predeterminado: 1 });
CertificadoElectronicoSchema.index({ empresaId: 1, estado: 1 });
CertificadoElectronicoSchema.index({ 'huella.sha256': 1 });

// ============================================
// MIDDLEWARE
// ============================================

// Encriptar contenido y password antes de guardar
CertificadoElectronicoSchema.pre('save', function(next) {
  // Solo encriptar si es nuevo o se modificó
  if (this.isNew || this.isModified('archivo.contenido')) {
    if (this.archivo?.contenido && !this.archivo.contenido.includes(':')) {
      this.archivo.contenido = encrypt(this.archivo.contenido);
    }
  }

  if (this.isNew || this.isModified('password')) {
    if (this.password && !this.password.includes(':')) {
      this.password = encrypt(this.password);
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Verificar si está caducado
  if (this.fechaExpiracion && new Date() > this.fechaExpiracion) {
    this.estado = EstadoCertificado.CADUCADO;
  }

  next();
});

// ============================================
// MÉTODOS
// ============================================

// Obtener contenido desencriptado
CertificadoElectronicoSchema.methods.obtenerContenidoDesencriptado = function(): string {
  if (!this.archivo?.contenido) return '';
  return decrypt(this.archivo.contenido);
};

// Obtener password desencriptado
CertificadoElectronicoSchema.methods.obtenerPasswordDesencriptado = function(): string {
  if (!this.password) return '';
  return decrypt(this.password);
};

// Validar password del certificado
CertificadoElectronicoSchema.methods.validarPassword = async function(password: string): Promise<boolean> {
  const storedPassword = decrypt(this.password);
  return password === storedPassword;
};

// ============================================
// STATICS
// ============================================

// Obtener certificado activo predeterminado de una empresa
CertificadoElectronicoSchema.statics.obtenerPredeterminado = async function(
  empresaId: string
): Promise<ICertificadoElectronico | null> {
  return this.findOne({
    empresaId,
    predeterminado: true,
    activo: true,
    estado: EstadoCertificado.ACTIVO,
  }).select('+archivo.contenido +password');
};

// Obtener certificados próximos a caducar
CertificadoElectronicoSchema.statics.obtenerProximosACaducar = async function(
  diasAntes: number = 30
): Promise<ICertificadoElectronico[]> {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + diasAntes);

  return this.find({
    activo: true,
    estado: EstadoCertificado.ACTIVO,
    fechaExpiracion: { $lte: fechaLimite },
  });
};

// ============================================
// VIRTUALS
// ============================================

CertificadoElectronicoSchema.virtual('diasParaCaducar').get(function(this: ICertificadoElectronico) {
  if (!this.fechaExpiracion) return 0;
  const hoy = new Date();
  const expiracion = new Date(this.fechaExpiracion);
  const diffTime = expiracion.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

CertificadoElectronicoSchema.virtual('estaCaducado').get(function(this: ICertificadoElectronico) {
  if (!this.fechaExpiracion) return false;
  return new Date() > new Date(this.fechaExpiracion);
});

CertificadoElectronicoSchema.virtual('proximoACaducar').get(function(this: ICertificadoElectronico) {
  if (!this.fechaExpiracion) return false;
  const diasParaCaducar = this.diasParaCaducar;
  return diasParaCaducar > 0 && diasParaCaducar <= 30;
});

// ============================================
// CONFIGURACIÓN JSON
// ============================================

CertificadoElectronicoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    // Nunca devolver contenido ni password en JSON
    delete ret.archivo?.contenido;
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

CertificadoElectronicoSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR
// ============================================

export const CertificadoElectronico = mongoose.model<ICertificadoElectronico>(
  'CertificadoElectronico',
  CertificadoElectronicoSchema
);

export default CertificadoElectronico;
