import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

// Clave de encriptación (en producción debería estar en variables de entorno)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'omerix-encryption-key-32-chars!!'; // 32 caracteres
const IV_LENGTH = 16;

// Funciones de encriptación/desencriptación
export function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
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
    return text; // Devolver original si falla (por si no está encriptado)
  }
}

export interface IDatabaseConfig {
  host: string;
  port: number;
  name: string;
  user?: string;
  password?: string;
  uri?: string; // URI completa de MongoDB
}

export interface IEmailConfig {
  // Tipo de autenticación: oauth2 (Gmail/Microsoft) o smtp (manual)
  authType: 'oauth2' | 'smtp';

  // Proveedor OAuth2 (solo si authType === 'oauth2')
  provider?: 'google' | 'microsoft';

  // Tokens OAuth2 (solo si authType === 'oauth2')
  oauth2?: {
    accessToken: string; // Almacenado encriptado
    refreshToken: string; // Almacenado encriptado
    expiresAt: Date;
    scope?: string;
  };

  // Configuración SMTP manual (solo si authType === 'smtp')
  host?: string;
  port?: number;
  secure?: boolean; // true para 465, false para otros puertos
  password?: string; // Almacenado encriptado

  // Común para ambos tipos
  user: string; // Email del usuario
  fromName?: string; // Nombre que aparece como remitente
  fromEmail?: string; // Email del remitente (si es diferente al user)
  replyTo?: string; // Email de respuesta
}

// Cuenta bancaria de la empresa
export interface ICuentaBancariaEmpresa {
  _id?: Types.ObjectId;
  alias?: string;
  titular: string;
  iban: string;
  swift?: string;
  banco?: string;
  sucursal?: string;
  predeterminada: boolean;
  activa: boolean;
}

// Textos legales configurables
export interface ITextosLegales {
  // Para presupuestos
  presupuestoIntroduccion?: string;
  presupuestoPiePagina?: string;
  presupuestoCondiciones?: string;
  // Para facturas
  facturaIntroduccion?: string;
  facturaPiePagina?: string;
  facturaCondiciones?: string;
  // Para emails
  emailFirma?: string;
  emailDisclaimer?: string;
  // LOPD / RGPD
  textoLOPD?: string;
  textoRGPD?: string;
  // Política de privacidad, cookies, etc.
  politicaPrivacidad?: string;
  condicionesVenta?: string;
}

// Datos de registro mercantil
export interface IDatosRegistro {
  registroMercantil?: string;
  tomo?: string;
  libro?: string;
  folio?: string;
  seccion?: string;
  hoja?: string;
  inscripcion?: string;
}

// Configuración de IA
export interface IAIConfig {
  // Proveedor de IA: gemini es el único implementado actualmente
  provider: 'gemini' | 'openai' | 'claude' | 'ollama';
  // API Key encriptada (si no se proporciona, usa la global del .env)
  apiKey?: string;
  // Modelo a usar (por defecto gemini-2.0-flash)
  model?: string;
}

// Configuración de VeriFactu / Facturación Electrónica
export interface IVerifactuConfig {
  // Entorno activo: test para pruebas, production para producción real
  entorno: 'test' | 'production';
  // ID del certificado digital activo para firmar facturas
  certificadoId?: string;
  // Sistema fiscal a usar por defecto
  sistemaFiscal?: 'verifactu' | 'ticketbai' | 'sii';
  // Territorio para TicketBAI (si aplica)
  territorioTicketBAI?: 'araba' | 'bizkaia' | 'gipuzkoa';
  // Activar envío automático al emitir factura
  envioAutomatico: boolean;
  // Generar QR automáticamente
  generarQR: boolean;
  // Incluir firma digital
  firmaDigital: boolean;
}

export interface IEmpresa extends Document {
  _id: Types.ObjectId;
  nombre: string;
  nombreComercial?: string;
  nif: string;
  email: string;
  telefono?: string;
  movil?: string;
  fax?: string;
  web?: string;
  logo?: string; // URL del logo
  direccion?: {
    calle: string;
    numero?: string;
    piso?: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
  };
  tipoNegocio: 'retail' | 'restauracion' | 'taller' | 'informatica' | 'servicios' | 'otro';
  estado: 'activa' | 'suspendida' | 'cancelada';
  fechaAlta: Date;

  // Datos de registro mercantil
  datosRegistro?: IDatosRegistro;

  // Cuentas bancarias de la empresa
  cuentasBancarias?: ICuentaBancariaEmpresa[];

  // Textos legales configurables
  textosLegales?: ITextosLegales;

  // Series de documentos
  seriesDocumentos?: {
    presupuestos?: string;
    pedidos?: string;
    albaranes?: string;
    facturas?: string;
    facturasRectificativas?: string;
  };

  // Configuración de numeración
  numeracion?: {
    presupuestoActual?: number;
    pedidoActual?: number;
    albaranActual?: number;
    facturaActual?: number;
    facturaRectificativaActual?: number;
    reiniciarAnualmente?: boolean;
  };

  // Moneda y formato
  moneda?: string;
  formatoFecha?: string;
  formatoNumero?: string;
  // Configuración de decimales
  decimalesCantidad?: number;
  decimalesPrecios?: number;

  // Configuración de base de datos dedicada
  databaseConfig: IDatabaseConfig;

  // Configuración de email SMTP
  emailConfig?: IEmailConfig;

  // Configuración de VeriFactu / Facturación Electrónica
  verifactuConfig?: IVerifactuConfig;

  // Configuración de IA (API keys propias de la empresa)
  aiConfig?: IAIConfig;

  // IDs de pasarelas de pago
  stripeCustomerId?: string;
  paypalCustomerId?: string;
  redsysCustomerId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DatabaseConfigSchema = new Schema<IDatabaseConfig>({
  host: { type: String, required: true },
  port: { type: Number, required: true, default: 27017 },
  name: { type: String, required: true },
  user: { type: String },
  password: { type: String, select: false }, // No se devuelve por defecto por seguridad
  uri: { type: String, select: false }, // URI completa, tampoco se devuelve por defecto
}, { _id: false });

const OAuth2Schema = new Schema({
  accessToken: { type: String, select: false }, // Encriptado
  refreshToken: { type: String, select: false }, // Encriptado
  expiresAt: { type: Date },
  scope: { type: String },
}, { _id: false });

const EmailConfigSchema = new Schema<IEmailConfig>({
  // Tipo de autenticación
  authType: { type: String, enum: ['oauth2', 'smtp'], required: true, default: 'smtp' },

  // OAuth2
  provider: { type: String, enum: ['google', 'microsoft'] },
  oauth2: { type: OAuth2Schema },

  // SMTP manual
  host: { type: String, trim: true },
  port: { type: Number, default: 587 },
  secure: { type: Boolean, default: false },
  password: { type: String, select: false }, // Encriptado

  // Común
  user: { type: String, required: true, trim: true },
  fromName: { type: String, trim: true },
  fromEmail: { type: String, trim: true, lowercase: true },
  replyTo: { type: String, trim: true, lowercase: true },
}, { _id: false });

const CuentaBancariaEmpresaSchema = new Schema<ICuentaBancariaEmpresa>({
  alias: { type: String, trim: true },
  titular: { type: String, required: true, trim: true },
  iban: { type: String, required: true, trim: true, uppercase: true },
  swift: { type: String, trim: true, uppercase: true },
  banco: { type: String, trim: true },
  sucursal: { type: String, trim: true },
  predeterminada: { type: Boolean, default: false },
  activa: { type: Boolean, default: true },
});

const TextosLegalesSchema = new Schema<ITextosLegales>({
  presupuestoIntroduccion: { type: String },
  presupuestoPiePagina: { type: String },
  presupuestoCondiciones: { type: String },
  facturaIntroduccion: { type: String },
  facturaPiePagina: { type: String },
  facturaCondiciones: { type: String },
  emailFirma: { type: String },
  emailDisclaimer: { type: String },
  textoLOPD: { type: String },
  textoRGPD: { type: String },
  politicaPrivacidad: { type: String },
  condicionesVenta: { type: String },
}, { _id: false });

const DatosRegistroSchema = new Schema<IDatosRegistro>({
  registroMercantil: { type: String, trim: true },
  tomo: { type: String, trim: true },
  libro: { type: String, trim: true },
  folio: { type: String, trim: true },
  seccion: { type: String, trim: true },
  hoja: { type: String, trim: true },
  inscripcion: { type: String, trim: true },
}, { _id: false });

const VerifactuConfigSchema = new Schema<IVerifactuConfig>({
  entorno: { type: String, enum: ['test', 'production'], default: 'test' },
  certificadoId: { type: String },
  sistemaFiscal: { type: String, enum: ['verifactu', 'ticketbai', 'sii'], default: 'verifactu' },
  territorioTicketBAI: { type: String, enum: ['araba', 'bizkaia', 'gipuzkoa'] },
  envioAutomatico: { type: Boolean, default: true },
  generarQR: { type: Boolean, default: true },
  firmaDigital: { type: Boolean, default: true },
}, { _id: false });

const AIConfigSchema = new Schema<IAIConfig>({
  provider: { type: String, enum: ['gemini', 'openai', 'claude', 'ollama'], default: 'gemini' },
  apiKey: { type: String, select: false }, // Encriptado, no se devuelve por defecto
  model: { type: String, default: 'gemini-2.0-flash' },
}, { _id: false });

const EmpresaSchema = new Schema<IEmpresa>(
  {
     _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    nombreComercial: {
      type: String,
      trim: true,
      maxlength: [100, 'El nombre comercial no puede exceder 100 caracteres'],
    },
    nif: {
      type: String,
      required: [true, 'El NIF es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Email no válido'],
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
    logo: {
      type: String,
      trim: true,
    },
    direccion: {
      calle: String,
      numero: String,
      piso: String,
      ciudad: String,
      provincia: String,
      codigoPostal: String,
      pais: { type: String, default: 'España' },
    },
    tipoNegocio: {
      type: String,
      enum: ['retail', 'restauracion', 'taller', 'informatica', 'servicios', 'otro'],
      default: 'retail',
    },
    estado: {
      type: String,
      enum: ['activa', 'suspendida', 'cancelada'],
      default: 'activa',
    },
    fechaAlta: {
      type: Date,
      default: Date.now,
    },

    // Datos de registro mercantil
    datosRegistro: {
      type: DatosRegistroSchema,
    },

    // Cuentas bancarias de la empresa
    cuentasBancarias: {
      type: [CuentaBancariaEmpresaSchema],
      default: [],
    },

    // Textos legales configurables
    textosLegales: {
      type: TextosLegalesSchema,
    },

    // Series de documentos
    seriesDocumentos: {
      presupuestos: { type: String, default: 'P' },
      pedidos: { type: String, default: 'PED' },
      albaranes: { type: String, default: 'ALB' },
      facturas: { type: String, default: 'F' },
      facturasRectificativas: { type: String, default: 'FR' },
    },

    // Configuración de numeración
    numeracion: {
      presupuestoActual: { type: Number, default: 0 },
      pedidoActual: { type: Number, default: 0 },
      albaranActual: { type: Number, default: 0 },
      facturaActual: { type: Number, default: 0 },
      facturaRectificativaActual: { type: Number, default: 0 },
      reiniciarAnualmente: { type: Boolean, default: true },
    },

    // Moneda y formato
    moneda: { type: String, default: 'EUR' },
    formatoFecha: { type: String, default: 'DD/MM/YYYY' },
    formatoNumero: { type: String, default: 'es-ES' },
    // Configuración de decimales
    decimalesCantidad: { type: Number, default: 2, min: 0, max: 6 },
    decimalesPrecios: { type: Number, default: 2, min: 0, max: 6 },

    // Configuración de base de datos dedicada para esta empresa
    databaseConfig: {
      type: DatabaseConfigSchema,
      required: true,
    },

    // Configuración de email SMTP
    emailConfig: {
      type: EmailConfigSchema,
    },

    // Configuración de VeriFactu / Facturación Electrónica
    verifactuConfig: {
      type: VerifactuConfigSchema,
      default: {
        entorno: 'test',
        sistemaFiscal: 'verifactu',
        envioAutomatico: true,
        generarQR: true,
        firmaDigital: true,
      },
    },

    // Configuración de IA (API keys propias de la empresa)
    aiConfig: {
      type: AIConfigSchema,
      default: {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
      },
    },

    // IDs de pasarelas de pago
    stripeCustomerId: String,
    paypalCustomerId: String,
    redsysCustomerId: String,
  },
  {
    timestamps: true,
  }
);

// Índices adicionales (solo los que NO tienen unique: true en el campo)
// EmpresaSchema.index({ nif: 1 }); // ← ELIMINAR (ya tiene unique: true arriba)
// EmpresaSchema.index({ email: 1 }); // ← ELIMINAR (ya tiene unique: true arriba)
EmpresaSchema.index({ estado: 1 }); // Este sí, porque no está en el campo

export default mongoose.model<IEmpresa>('Empresa', EmpresaSchema);