import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoCliente {
  EMPRESA = 'empresa',
  PARTICULAR = 'particular',
}

// Enum legacy - Mantener para compatibilidad, usar formaPagoId para nuevos datos
export enum FormaPagoEnum {
  CONTADO = 'contado',
  TRANSFERENCIA = 'transferencia',
  DOMICILIACION = 'domiciliacion',
  CONFIRMING = 'confirming',
  PAGARE = 'pagare',
}

// Tipos de dirección disponibles
export enum TipoDireccion {
  FISCAL = 'fiscal',
  ENVIO = 'envio',
  ALMACEN = 'almacen',
  OBRA = 'obra',
  OTRO = 'otro',
}

// Tipos de mandato SEPA
export enum TipoMandatoSEPA {
  RECURRENTE = 'recurrente',    // RCUR - Adeudos recurrentes
  UNICO = 'unico',              // OOFF - Adeudo único
  PRIMERA_VEZ = 'primera_vez',  // FRST - Primera vez de una serie recurrente
  FINAL = 'final',              // FNAL - Último de una serie recurrente
}

// ============================================
// INTERFACES
// ============================================

// Dirección base (para compatibilidad)
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
  nombre?: string;           // Nombre descriptivo (ej: "Oficina Central", "Almacén Norte")
  personaContacto?: string;  // Persona de contacto en esta dirección
  telefonoContacto?: string; // Teléfono de contacto en esta dirección
  horario?: string;          // Horario de atención/recogida
  notas?: string;            // Notas adicionales
  predeterminada: boolean;   // Si es la dirección por defecto de su tipo
  activa: boolean;           // Si está activa
}

// Mandato SEPA
export interface IMandatoSEPA {
  referencia: string;         // Referencia única del mandato (ej: MAND-2024-00001)
  fechaFirma: Date;           // Fecha de firma del mandato
  tipoMandato: TipoMandatoSEPA;
  firmado: boolean;           // Si el mandato está firmado
  fechaRevocacion?: Date;     // Fecha si el mandato fue revocado
  acreedor?: {                // Datos del acreedor (empresa)
    identificador?: string;   // Identificador del acreedor SEPA
    nombre?: string;
  };
}

// Cuenta bancaria con datos SEPA
export interface ICuentaBancaria {
  _id?: mongoose.Types.ObjectId;
  alias?: string;             // Nombre descriptivo (ej: "Cuenta Principal", "Pagos proveedores")
  titular: string;            // Nombre del titular de la cuenta
  iban: string;               // IBAN completo
  swift?: string;             // Código SWIFT/BIC
  banco?: string;             // Nombre del banco
  sucursal?: string;          // Sucursal
  // SEPA
  mandatoSEPA?: IMandatoSEPA;
  // Control
  predeterminada: boolean;    // Si es la cuenta por defecto
  usarParaCobros: boolean;    // Usar para cobros (domiciliaciones)
  usarParaPagos: boolean;     // Usar para pagos (transferencias al cliente)
  activa: boolean;
  // Auditoría
  fechaCreacion?: Date;
  notas?: string;
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

// Tipo de entidad pública para facturación electrónica
export enum TipoEntidadPublica {
  AGE = 'AGE',       // Administración General del Estado
  CCAA = 'CCAA',     // Comunidades Autónomas
  LOCAL = 'LOCAL',   // Entidades Locales
  OTRO = 'OTRO',     // Otras entidades públicas
}

// Datos para facturación electrónica a administraciones públicas (FACE)
export interface IFacturacionElectronica {
  activa: boolean;                       // Si está habilitada la facturación electrónica
  codigoOrganoGestor: string;           // DIR3 - Código del Órgano Gestor
  codigoUnidadTramitadora: string;      // DIR3 - Código de la Unidad Tramitadora
  codigoOficinaContable: string;        // DIR3 - Código de la Oficina Contable
  codigoPuntoEntrega?: string;          // DIR3 - Código del Punto de Entrega (opcional)
  tipoEntidad: TipoEntidadPublica;      // Tipo de administración
  nombreOrganoGestor?: string;          // Nombre descriptivo (para referencia)
  nombreUnidadTramitadora?: string;     // Nombre descriptivo
  nombreOficinaContable?: string;       // Nombre descriptivo
  observaciones?: string;               // Notas adicionales
}

// Descuento por familia de productos
export interface IDescuentoFamilia {
  familiaId: mongoose.Types.ObjectId;
  nombreFamilia?: string; // Snapshot del nombre para fácil referencia
  descuento: number; // Porcentaje de descuento
}

export interface ICliente extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId?: mongoose.Types.ObjectId; // OPCIONAL: Multi-DB (cada empresa tiene su propia BD)

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

  // ============================================
  // DIRECCIONES MÚLTIPLES (NUEVO)
  // ============================================
  direcciones: IDireccionExtendida[];

  // Direcciones legacy (para compatibilidad) - DEPRECATED
  /** @deprecated Usar direcciones[] con tipo 'fiscal' */
  direccion?: IDireccion;
  /** @deprecated Usar direcciones[] con tipo 'envio' */
  direccionEnvio?: IDireccion;

  // ============================================
  // CONDICIONES COMERCIALES (MEJORADO)
  // ============================================
  // Referencias a los nuevos módulos
  formaPagoId?: mongoose.Types.ObjectId;    // Ref a FormaPago
  terminoPagoId?: mongoose.Types.ObjectId;  // Ref a TerminoPago

  // Legacy - mantener para compatibilidad
  /** @deprecated Usar formaPagoId */
  formaPago?: FormaPagoEnum;
  /** @deprecated Usar terminoPagoId */
  diasPago?: number;

  descuentoGeneral?: number;
  descuentosPorFamilia?: IDescuentoFamilia[];
  aplicarDescuentoAutomatico?: boolean; // Si aplicar automáticamente el descuento en presupuestos
  tarifaId?: mongoose.Types.ObjectId;

  // ============================================
  // CUENTAS BANCARIAS MÚLTIPLES (NUEVO)
  // ============================================
  cuentasBancarias: ICuentaBancaria[];

  // Campos legacy (para compatibilidad) - DEPRECATED
  /** @deprecated Usar cuentasBancarias[] */
  iban?: string;
  /** @deprecated Usar cuentasBancarias[] */
  swift?: string;

  // ============================================
  // CONTACTO
  // ============================================
  personaContacto?: IPersonaContacto;
  personasContacto?: IPersonaContacto[]; // Múltiples contactos

  // Clasificación
  categoriaId?: mongoose.Types.ObjectId;
  zona?: string;
  vendedorId?: mongoose.Types.ObjectId;

  // Agentes comerciales asignados (puede tener varios)
  agentesComerciales?: mongoose.Types.ObjectId[];

  // Límites
  limiteCredito?: number;
  riesgoActual: number;

  // Estado
  activo: boolean;
  observaciones?: string;

  // TPV
  usarEnTPV: boolean; // Si el cliente aparece en el selector del TPV

  // Tags
  tags?: string[];

  // ============================================
  // AUTORIZACIONES COMUNICACIONES (LOPD/RGPD)
  // ============================================
  autorizacionWhatsApp?: boolean;       // Si autoriza comunicaciones por WhatsApp
  fechaAutorizacionWhatsApp?: Date;     // Fecha de autorización
  verificadoWhatsApp?: boolean;         // Si ha verificado su número de WhatsApp
  fechaVerificacionWhatsApp?: Date;     // Fecha de verificación
  autorizacionEmail?: boolean;          // Si autoriza comunicaciones por email
  fechaAutorizacionEmail?: Date;        // Fecha de autorización email
  autorizacionSMS?: boolean;            // Si autoriza comunicaciones por SMS
  fechaAutorizacionSMS?: Date;          // Fecha de autorización SMS

  // ============================================
  // FACTURACIÓN ELECTRÓNICA (FACE/DIR3)
  // ============================================
  facturacionElectronica?: IFacturacionElectronica;

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
  generarCodigo(): Promise<string>; // Multi-DB: empresaId ya no es necesario
  obtenerEstadisticas(): Promise<{
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

// Schema de dirección base (para compatibilidad legacy)
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

// Schema de mandato SEPA
const MandatoSEPASchema = new Schema<IMandatoSEPA>({
  referencia: { type: String, required: true, uppercase: true, trim: true },
  fechaFirma: { type: Date, required: true },
  tipoMandato: {
    type: String,
    enum: Object.values(TipoMandatoSEPA),
    required: true,
    default: TipoMandatoSEPA.RECURRENTE,
  },
  firmado: { type: Boolean, default: false },
  fechaRevocacion: { type: Date },
  acreedor: {
    identificador: { type: String, trim: true },
    nombre: { type: String, trim: true },
  },
}, { _id: false });

// Schema de cuenta bancaria
const CuentaBancariaSchema = new Schema<ICuentaBancaria>({
  alias: { type: String, trim: true },
  titular: { type: String, required: true, trim: true },
  iban: { type: String, required: true, uppercase: true, trim: true },
  swift: { type: String, uppercase: true, trim: true },
  banco: { type: String, trim: true },
  sucursal: { type: String, trim: true },
  mandatoSEPA: { type: MandatoSEPASchema },
  predeterminada: { type: Boolean, default: false },
  usarParaCobros: { type: Boolean, default: true },
  usarParaPagos: { type: Boolean, default: false },
  activa: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now },
  notas: { type: String },
}, { _id: true });

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

// Schema para facturación electrónica a administraciones públicas (FACE)
const FacturacionElectronicaSchema = new Schema<IFacturacionElectronica>({
  activa: { type: Boolean, default: false },
  codigoOrganoGestor: { type: String, required: true, trim: true, uppercase: true },
  codigoUnidadTramitadora: { type: String, required: true, trim: true, uppercase: true },
  codigoOficinaContable: { type: String, required: true, trim: true, uppercase: true },
  codigoPuntoEntrega: { type: String, trim: true, uppercase: true },
  tipoEntidad: {
    type: String,
    enum: Object.values(TipoEntidadPublica),
    required: true,
    default: TipoEntidadPublica.AGE,
  },
  nombreOrganoGestor: { type: String, trim: true },
  nombreUnidadTramitadora: { type: String, trim: true },
  nombreOficinaContable: { type: String, trim: true },
  observaciones: { type: String },
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
  // Multi-DB: empresaId ya no es necesario (cada empresa tiene su propia BD)
  // Mantenido como opcional para compatibilidad con datos legacy
  empresaId: {
    type: Schema.Types.ObjectId,
    ref: 'Empresa',
    required: false,
    index: false,
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
  web: {
    type: String,
    trim: true,
  },
  
  // ============================================
  // DIRECCIONES MÚLTIPLES (NUEVO)
  // ============================================
  direcciones: {
    type: [DireccionExtendidaSchema],
    default: [],
  },

  // Direcciones legacy (para compatibilidad) - DEPRECATED
  direccion: {
    type: DireccionSchema,
    required: false, // Ya no es requerido, usar direcciones[]
  },
  direccionEnvio: {
    type: DireccionSchema,
  },

  // ============================================
  // CONDICIONES COMERCIALES (MEJORADO)
  // ============================================
  // Referencias a los nuevos módulos de FormasPago y TerminosPago
  formaPagoId: {
    type: Schema.Types.ObjectId,
    ref: 'FormaPago',
  },
  terminoPagoId: {
    type: Schema.Types.ObjectId,
    ref: 'TerminoPago',
  },

  // Legacy - mantener para compatibilidad
  formaPago: {
    type: String,
    enum: Object.values(FormaPagoEnum),
    required: false, // Ya no es requerido
  },
  diasPago: {
    type: Number,
    default: 0,
    min: 0,
  },
  descuentoGeneral: {
    type: Number,
    min: 0,
    max: 100,
  },
  descuentosPorFamilia: [{
    familiaId: { type: Schema.Types.ObjectId, ref: 'Familia', required: true },
    nombreFamilia: { type: String },
    descuento: { type: Number, required: true, min: 0, max: 100 },
  }],
  aplicarDescuentoAutomatico: {
    type: Boolean,
    default: true,
  },
  tarifaId: {
    type: Schema.Types.ObjectId,
    ref: 'Tarifa',
  },

  // ============================================
  // CUENTAS BANCARIAS MÚLTIPLES (NUEVO)
  // ============================================
  cuentasBancarias: {
    type: [CuentaBancariaSchema],
    default: [],
  },

  // Campos legacy (para compatibilidad) - DEPRECATED
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
  vendedorId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },

  // Agentes comerciales asignados (puede tener varios)
  agentesComerciales: [{
    type: Schema.Types.ObjectId,
    ref: 'AgenteComercial',
  }],

  // Límites
  limiteCredito: {
    type: Number,
    min: 0,
  },

  // ⚠️ IMPORTANTE: riesgoActual es requerido y tiene valor por defecto 0
  riesgoActual: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
  },
  
  // Estado
  activo: {
    type: Boolean,
    default: true,
  },
  observaciones: {
    type: String,
  },

  // TPV
  usarEnTPV: {
    type: Boolean,
    default: false, // Por defecto no aparece en TPV
  },

  // Tags
  tags: [{
    type: String,
    trim: true,
  }],

  // ============================================
  // AUTORIZACIONES COMUNICACIONES (LOPD/RGPD)
  // ============================================
  autorizacionWhatsApp: { type: Boolean, default: false },
  fechaAutorizacionWhatsApp: { type: Date },
  verificadoWhatsApp: { type: Boolean, default: false },
  fechaVerificacionWhatsApp: { type: Date },
  autorizacionEmail: { type: Boolean, default: true }, // Por defecto true para emails
  fechaAutorizacionEmail: { type: Date },
  autorizacionSMS: { type: Boolean, default: false },
  fechaAutorizacionSMS: { type: Date },

  // ============================================
  // FACTURACIÓN ELECTRÓNICA (FACE/DIR3)
  // ============================================
  facturacionElectronica: {
    type: FacturacionElectronicaSchema,
  },

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
// ÍNDICES (Multi-DB: Ya no necesitan empresaId)
// ============================================

// Únicos por base de datos (no por empresa, porque cada empresa tiene su propia BD)
// Los índices únicos de 'codigo' y 'nif' ya se declaran con unique: true en la definición del campo

// Búsquedas y filtros
ClienteSchema.index({ activo: 1 });
ClienteSchema.index({ nombre: 1 });
ClienteSchema.index({ tags: 1 });
ClienteSchema.index({ vendedorId: 1 });

// Índices para nuevas referencias
ClienteSchema.index({ formaPagoId: 1 });
ClienteSchema.index({ terminoPagoId: 1 });
ClienteSchema.index({ agentesComerciales: 1 });

// Índices para direcciones y cuentas bancarias (búsqueda por ciudad/provincia)
ClienteSchema.index({ 'direcciones.ciudad': 1 });
ClienteSchema.index({ 'direcciones.provincia': 1 });
ClienteSchema.index({ 'direcciones.tipo': 1 });

// Índice para facturación electrónica
ClienteSchema.index({ 'facturacionElectronica.activa': 1 });

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

// Virtual para obtener la dirección fiscal (predeterminada de tipo fiscal)
ClienteSchema.virtual('direccionFiscal').get(function() {
  if (this.direcciones && this.direcciones.length > 0) {
    // Buscar dirección fiscal predeterminada y activa
    const fiscal = this.direcciones.find(
      (d: IDireccionExtendida) => d.tipo === TipoDireccion.FISCAL && d.predeterminada && d.activa
    );
    if (fiscal) return fiscal;
    // Si no hay predeterminada, buscar cualquier fiscal activa
    const anyFiscal = this.direcciones.find(
      (d: IDireccionExtendida) => d.tipo === TipoDireccion.FISCAL && d.activa
    );
    if (anyFiscal) return anyFiscal;
  }
  // Fallback a dirección legacy
  return this.direccion || null;
});

// Virtual para obtener la dirección de envío predeterminada
ClienteSchema.virtual('direccionEnvioPredeterminada').get(function() {
  if (this.direcciones && this.direcciones.length > 0) {
    const envio = this.direcciones.find(
      (d: IDireccionExtendida) => d.tipo === TipoDireccion.ENVIO && d.predeterminada && d.activa
    );
    if (envio) return envio;
    const anyEnvio = this.direcciones.find(
      (d: IDireccionExtendida) => d.tipo === TipoDireccion.ENVIO && d.activa
    );
    if (anyEnvio) return anyEnvio;
  }
  // Fallback a dirección de envío legacy
  return this.direccionEnvio || this.direccion || null;
});

// Virtual para obtener la cuenta bancaria predeterminada
ClienteSchema.virtual('cuentaBancariaPredeterminada').get(function() {
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
  // Fallback: crear objeto con IBAN legacy si existe
  if (this.iban) {
    return { iban: this.iban, swift: this.swift, titular: this.nombre };
  }
  return null;
});

// Virtual para contar direcciones activas
ClienteSchema.virtual('numDireccionesActivas').get(function() {
  return this.direcciones?.filter((d: IDireccionExtendida) => d.activa).length || 0;
});

// Virtual para contar cuentas bancarias activas
ClienteSchema.virtual('numCuentasActivas').get(function() {
  return this.cuentasBancarias?.filter((c: ICuentaBancaria) => c.activa).length || 0;
});

// Virtual para verificar si tiene mandato SEPA válido
ClienteSchema.virtual('tieneMandatoSEPA').get(function() {
  return this.cuentasBancarias?.some(
    (c: ICuentaBancaria) => c.activa && c.mandatoSEPA?.firmado && !c.mandatoSEPA?.fechaRevocacion
  ) || false;
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

// Multi-DB: Ya no necesita empresaId (cada empresa tiene su propia BD)
ClienteSchema.statics.generarCodigo = async function(): Promise<string> {
  const ultimoCliente = await this.findOne()
    .sort({ codigo: -1 })
    .select('codigo');

  if (!ultimoCliente || !ultimoCliente.codigo) {
    return 'CLI-001';
  }

  const ultimoNumero = parseInt(ultimoCliente.codigo.split('-')[1] || '0');
  const nuevoNumero = ultimoNumero + 1;
  return `CLI-${nuevoNumero.toString().padStart(3, '0')}`;
};

// Multi-DB: Ya no necesita empresaId (cada empresa tiene su propia BD)
ClienteSchema.statics.obtenerEstadisticas = async function() {
  const [totales, activos, inactivos, excedenCredito] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ activo: true }),
    this.countDocuments({ activo: false }),
    this.countDocuments({
      activo: true,
      $expr: { $gt: ['$riesgoActual', '$limiteCredito'] }
    })
  ]);

  const riesgoTotal = await this.aggregate([
    { $match: { activo: true } },
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
      // Multi-DB: Ya no necesita empresaId
      this.codigo = await ClienteModel.generarCodigo();
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Normalizar NIF
  if (this.nif) {
    this.nif = this.nif.toUpperCase().trim();
  }

  // ⚠️ IMPORTANTE: Asegurar que riesgoActual siempre tenga un valor
  if (this.riesgoActual === undefined || this.riesgoActual === null) {
    this.riesgoActual = 0;
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