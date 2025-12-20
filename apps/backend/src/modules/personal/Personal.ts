import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoContrato {
  INDEFINIDO = 'indefinido',
  TEMPORAL = 'temporal',
  PRACTICAS = 'practicas',
  FORMACION = 'formacion',
  OBRA_SERVICIO = 'obra_servicio',
  INTERINIDAD = 'interinidad',
  AUTONOMO = 'autonomo'
}

export enum EstadoEmpleado {
  ACTIVO = 'activo',
  BAJA_TEMPORAL = 'baja_temporal',
  BAJA_DEFINITIVA = 'baja_definitiva',
  VACACIONES = 'vacaciones',
  EXCEDENCIA = 'excedencia',
  PREJUBILACION = 'prejubilacion'
}

export enum TipoJornada {
  COMPLETA = 'completa',
  PARCIAL = 'parcial',
  INTENSIVA = 'intensiva',
  TURNOS = 'turnos',
  FLEXIBLE = 'flexible'
}

export enum Genero {
  MASCULINO = 'masculino',
  FEMENINO = 'femenino',
  NO_BINARIO = 'no_binario',
  NO_ESPECIFICADO = 'no_especificado'
}

// ============================================
// INTERFACES
// ============================================

export interface IDatosPersonales {
  fechaNacimiento?: Date;
  genero?: Genero;
  nacionalidad?: string;
  lugarNacimiento?: string;
  estadoCivil?: string;
  numHijos?: number;
}

export interface IDatosContactoPersonal {
  email?: string;
  emailCorporativo?: string;
  telefono?: string;
  telefonoMovil?: string;
  telefonoEmergencia?: string;
  contactoEmergencia?: string;
}

export interface IDireccionPersonal {
  direccion?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
}

export interface IDocumentacion {
  nif?: string;
  nss?: string; // Número Seguridad Social
  numAfiliacion?: string;
  permisoTrabajo?: string;
  fechaCaducidadPermiso?: Date;
  carnetConducir?: string;
  tipoCarnet?: string[];
}

export interface IDatosLaborales {
  puesto: string;
  departamentoId?: mongoose.Types.ObjectId;
  categoriaLaboral?: string;
  nivelProfesional?: string;
  tipoContrato: TipoContrato;
  tipoJornada: TipoJornada;
  horasSemanales?: number;
  fechaInicioContrato: Date;
  fechaFinContrato?: Date;
  periodoPrueba?: boolean;
  fechaFinPrueba?: Date;
  // Configuración de fichaje
  ubicacionObligatoria?: boolean;  // Si requiere ubicación al fichar
  fotoObligatoria?: boolean;       // Si requiere foto para sincronizar con terminal
}

export interface IDatosEconomicos {
  salarioBrutoAnual?: number;
  salarioBrutoMensual?: number;
  numPagas?: number;
  irpf?: number;
  horasExtra?: number;
  plusTransporte?: number;
  plusComida?: number;
  otrosPluses?: number;
}

export interface ICuentaBancariaPersonal {
  iban: string;
  swift?: string;
  banco?: string;
  titular?: string;
  principal: boolean;
}

export interface IFormacionAcademica {
  titulo: string;
  institucion?: string;
  fechaObtencion?: Date;
  especialidad?: string;
  observaciones?: string;
}

export interface IExperienciaLaboral {
  empresa: string;
  puesto: string;
  fechaInicio: Date;
  fechaFin?: Date;
  descripcion?: string;
  motivoSalida?: string;
}

export interface IVacaciones {
  anio: number;
  diasTotales: number;
  diasDisfrutados: number;
  diasPendientes?: number;
}

export interface IAusencia {
  tipo: string; // enfermedad, permiso, otros
  fechaInicio: Date;
  fechaFin?: Date;
  motivo?: string;
  documentacion?: string;
  aprobada: boolean;
}

export interface IEvaluacion {
  fecha: Date;
  evaluadorId: mongoose.Types.ObjectId;
  puntuacion?: number;
  comentarios?: string;
  objetivosCumplidos?: boolean;
}

export interface IDocumentoPersonal {
  nombre: string;
  tipo: string;
  url: string;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
  confidencial: boolean;
}

export interface IPersonal extends Document {
  // Identificación
  codigo: string;
  nombre: string;
  apellidos: string;
  foto?: string;

  // Estado
  estado: EstadoEmpleado;
  activo: boolean;

  // Datos personales
  datosPersonales: IDatosPersonales;
  contacto: IDatosContactoPersonal;
  direccion: IDireccionPersonal;
  documentacion: IDocumentacion;

  // Datos laborales
  datosLaborales: IDatosLaborales;
  datosEconomicos: IDatosEconomicos;

  // Jerarquía
  responsableId?: mongoose.Types.ObjectId;
  subordinados?: mongoose.Types.ObjectId[];

  // Datos bancarios
  cuentasBancarias: ICuentaBancariaPersonal[];

  // Formación y experiencia
  formacionAcademica: IFormacionAcademica[];
  experienciaLaboral: IExperienciaLaboral[];

  // Gestión de tiempo
  vacaciones: IVacaciones[];
  ausencias: IAusencia[];

  // Evaluaciones
  evaluaciones: IEvaluacion[];

  // Documentos
  documentos: IDocumentoPersonal[];

  // Usuario del sistema
  usuarioId?: mongoose.Types.ObjectId;

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
  edad: number | null;
  antiguedad: number;
  salarioNeto: number;
  diasVacacionesPendientes: number;
}

export interface IPersonalModel extends Model<IPersonal> {
  generarCodigo(): Promise<string>;
  obtenerEstadisticas(): Promise<{
    total: number;
    activos: number;
    bajas: number;
    porDepartamento: { [key: string]: number };
    porTipoContrato: { [key: string]: number };
    masasSalariales: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

const DatosPersonalesSchema = new Schema<IDatosPersonales>({
  fechaNacimiento: { type: Date },
  genero: {
    type: String,
    enum: Object.values(Genero),
    default: Genero.NO_ESPECIFICADO
  },
  nacionalidad: { type: String, trim: true, default: 'Española' },
  lugarNacimiento: { type: String, trim: true },
  estadoCivil: { type: String, trim: true },
  numHijos: { type: Number, min: 0, default: 0 }
}, { _id: false });

const DatosContactoPersonalSchema = new Schema<IDatosContactoPersonal>({
  email: { type: String, lowercase: true, trim: true },
  emailCorporativo: { type: String, lowercase: true, trim: true },
  telefono: { type: String, trim: true },
  telefonoMovil: { type: String, trim: true },
  telefonoEmergencia: { type: String, trim: true },
  contactoEmergencia: { type: String, trim: true }
}, { _id: false });

const DireccionPersonalSchema = new Schema<IDireccionPersonal>({
  direccion: { type: String, trim: true },
  codigoPostal: { type: String, trim: true },
  ciudad: { type: String, trim: true },
  provincia: { type: String, trim: true },
  pais: { type: String, trim: true, default: 'España' }
}, { _id: false });

const DocumentacionSchema = new Schema<IDocumentacion>({
  nif: { type: String, trim: true, uppercase: true },
  nss: { type: String, trim: true },
  numAfiliacion: { type: String, trim: true },
  permisoTrabajo: { type: String, trim: true },
  fechaCaducidadPermiso: { type: Date },
  carnetConducir: { type: String, trim: true },
  tipoCarnet: [{ type: String, trim: true }]
}, { _id: false });

const DatosLaboralesSchema = new Schema<IDatosLaborales>({
  puesto: { type: String, required: true, trim: true },
  departamentoId: { type: Schema.Types.ObjectId, ref: 'Departamento' },
  categoriaLaboral: { type: String, trim: true },
  nivelProfesional: { type: String, trim: true },
  tipoContrato: {
    type: String,
    enum: Object.values(TipoContrato),
    default: TipoContrato.INDEFINIDO
  },
  tipoJornada: {
    type: String,
    enum: Object.values(TipoJornada),
    default: TipoJornada.COMPLETA
  },
  horasSemanales: { type: Number, min: 0, max: 60, default: 40 },
  fechaInicioContrato: { type: Date, required: true },
  fechaFinContrato: { type: Date },
  periodoPrueba: { type: Boolean, default: false },
  fechaFinPrueba: { type: Date },
  // Configuración de fichaje
  ubicacionObligatoria: { type: Boolean, default: false },
  fotoObligatoria: { type: Boolean, default: false }
}, { _id: false });

const DatosEconomicosSchema = new Schema<IDatosEconomicos>({
  salarioBrutoAnual: { type: Number, min: 0 },
  salarioBrutoMensual: { type: Number, min: 0 },
  numPagas: { type: Number, min: 12, max: 16, default: 14 },
  irpf: { type: Number, min: 0, max: 50 },
  horasExtra: { type: Number, min: 0, default: 0 },
  plusTransporte: { type: Number, min: 0, default: 0 },
  plusComida: { type: Number, min: 0, default: 0 },
  otrosPluses: { type: Number, min: 0, default: 0 }
}, { _id: false });

const CuentaBancariaPersonalSchema = new Schema<ICuentaBancariaPersonal>({
  iban: { type: String, required: true, trim: true, uppercase: true },
  swift: { type: String, trim: true, uppercase: true },
  banco: { type: String, trim: true },
  titular: { type: String, trim: true },
  principal: { type: Boolean, default: false }
}, { _id: true });

const FormacionAcademicaSchema = new Schema<IFormacionAcademica>({
  titulo: { type: String, required: true, trim: true },
  institucion: { type: String, trim: true },
  fechaObtencion: { type: Date },
  especialidad: { type: String, trim: true },
  observaciones: { type: String, trim: true }
}, { _id: true });

const ExperienciaLaboralSchema = new Schema<IExperienciaLaboral>({
  empresa: { type: String, required: true, trim: true },
  puesto: { type: String, required: true, trim: true },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date },
  descripcion: { type: String, trim: true },
  motivoSalida: { type: String, trim: true }
}, { _id: true });

const VacacionesSchema = new Schema<IVacaciones>({
  anio: { type: Number, required: true },
  diasTotales: { type: Number, required: true, min: 0 },
  diasDisfrutados: { type: Number, default: 0, min: 0 },
  diasPendientes: { type: Number }
}, { _id: true });

const AusenciaSchema = new Schema<IAusencia>({
  tipo: { type: String, required: true, trim: true },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date },
  motivo: { type: String, trim: true },
  documentacion: { type: String, trim: true },
  aprobada: { type: Boolean, default: false }
}, { _id: true });

const EvaluacionSchema = new Schema<IEvaluacion>({
  fecha: { type: Date, required: true },
  evaluadorId: { type: Schema.Types.ObjectId, ref: 'Personal', required: true },
  puntuacion: { type: Number, min: 0, max: 10 },
  comentarios: { type: String, trim: true },
  objetivosCumplidos: { type: Boolean }
}, { _id: true });

const DocumentoPersonalSchema = new Schema<IDocumentoPersonal>({
  nombre: { type: String, required: true, trim: true },
  tipo: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  confidencial: { type: Boolean, default: false }
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const PersonalSchema = new Schema<IPersonal, IPersonalModel>({
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
    required: [true, 'Los apellidos son obligatorios'],
    trim: true,
    maxlength: [150, 'Los apellidos no pueden exceder 150 caracteres']
  },
  foto: { type: String, trim: true },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoEmpleado),
    default: EstadoEmpleado.ACTIVO
  },
  activo: {
    type: Boolean,
    default: true
  },

  // Datos personales
  datosPersonales: {
    type: DatosPersonalesSchema,
    default: () => ({})
  },
  contacto: {
    type: DatosContactoPersonalSchema,
    default: () => ({})
  },
  direccion: {
    type: DireccionPersonalSchema,
    default: () => ({})
  },
  documentacion: {
    type: DocumentacionSchema,
    default: () => ({})
  },

  // Datos laborales
  datosLaborales: {
    type: DatosLaboralesSchema,
    required: true
  },
  datosEconomicos: {
    type: DatosEconomicosSchema,
    default: () => ({})
  },

  // Jerarquía
  responsableId: {
    type: Schema.Types.ObjectId,
    ref: 'Personal'
  },
  subordinados: [{
    type: Schema.Types.ObjectId,
    ref: 'Personal'
  }],

  // Datos bancarios
  cuentasBancarias: {
    type: [CuentaBancariaPersonalSchema],
    default: []
  },

  // Formación y experiencia
  formacionAcademica: {
    type: [FormacionAcademicaSchema],
    default: []
  },
  experienciaLaboral: {
    type: [ExperienciaLaboralSchema],
    default: []
  },

  // Gestión de tiempo
  vacaciones: {
    type: [VacacionesSchema],
    default: []
  },
  ausencias: {
    type: [AusenciaSchema],
    default: []
  },

  // Evaluaciones
  evaluaciones: {
    type: [EvaluacionSchema],
    default: []
  },

  // Documentos
  documentos: {
    type: [DocumentoPersonalSchema],
    default: []
  },

  // Usuario del sistema
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },

  // Observaciones
  observaciones: { type: String, trim: true },
  tags: [{ type: String, trim: true, lowercase: true }],

  // Auditoría
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  modificadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaModificacion: {
    type: Date
  }
}, {
  timestamps: false,
  collection: 'personal'
});

// ============================================
// ÍNDICES
// ============================================
// Nota: codigo ya tiene unique:true en la definición del campo, no duplicar aquí

PersonalSchema.index({ 'documentacion.nif': 1 }, { sparse: true });
PersonalSchema.index({ activo: 1 });
PersonalSchema.index({ estado: 1 });
PersonalSchema.index({ nombre: 1, apellidos: 1 });
PersonalSchema.index({ 'datosLaborales.puesto': 1 });
PersonalSchema.index({ 'datosLaborales.departamentoId': 1 });
PersonalSchema.index({ 'datosLaborales.tipoContrato': 1 });
PersonalSchema.index({ responsableId: 1 });
PersonalSchema.index({ usuarioId: 1 }, { sparse: true });
PersonalSchema.index({ tags: 1 });

// ============================================
// VIRTUALS
// ============================================

PersonalSchema.virtual('nombreCompleto').get(function(this: IPersonal) {
  return `${this.nombre} ${this.apellidos}`;
});

PersonalSchema.virtual('edad').get(function(this: IPersonal) {
  if (!this.datosPersonales?.fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(this.datosPersonales.fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
});

PersonalSchema.virtual('antiguedad').get(function(this: IPersonal) {
  if (!this.datosLaborales?.fechaInicioContrato) return 0;
  const hoy = new Date();
  const inicio = new Date(this.datosLaborales.fechaInicioContrato);
  const diffTime = Math.abs(hoy.getTime() - inicio.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(diffYears * 10) / 10; // Un decimal
});

PersonalSchema.virtual('salarioNeto').get(function(this: IPersonal) {
  if (!this.datosEconomicos?.salarioBrutoMensual) return 0;
  const irpf = this.datosEconomicos.irpf || 15;
  const ss = 6.35; // Seguridad Social aproximada
  const bruto = this.datosEconomicos.salarioBrutoMensual;
  return bruto * (1 - (irpf + ss) / 100);
});

PersonalSchema.virtual('diasVacacionesPendientes').get(function(this: IPersonal) {
  const anioActual = new Date().getFullYear();
  const vacacionesAnio = this.vacaciones?.find(v => v.anio === anioActual);
  if (!vacacionesAnio) return 0;
  return vacacionesAnio.diasTotales - vacacionesAnio.diasDisfrutados;
});

// ============================================
// MIDDLEWARES
// ============================================

PersonalSchema.pre('save', async function(next) {
  // Generar código si no existe
  if (!this.codigo) {
    this.codigo = await (this.constructor as IPersonalModel).generarCodigo();
  }

  // Actualizar fecha de modificación
  if (!this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Normalizar NIF
  if (this.documentacion?.nif) {
    this.documentacion.nif = this.documentacion.nif.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // Calcular días pendientes de vacaciones
  this.vacaciones.forEach(vac => {
    vac.diasPendientes = vac.diasTotales - vac.diasDisfrutados;
  });

  // Calcular salario mensual si solo tenemos anual
  if (this.datosEconomicos?.salarioBrutoAnual && !this.datosEconomicos.salarioBrutoMensual) {
    const pagas = this.datosEconomicos.numPagas || 14;
    this.datosEconomicos.salarioBrutoMensual = this.datosEconomicos.salarioBrutoAnual / pagas;
  }

  next();
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

PersonalSchema.statics.generarCodigo = async function(): Promise<string> {
  const prefijo = 'EMP';
  const ultimoEmpleado = await this.findOne({
    codigo: new RegExp(`^${prefijo}\\d+$`)
  }).sort({ codigo: -1 }).lean();

  let numero = 1;
  if (ultimoEmpleado && ultimoEmpleado.codigo) {
    const match = ultimoEmpleado.codigo.match(/\d+$/);
    if (match) {
      numero = parseInt(match[0], 10) + 1;
    }
  }

  return `${prefijo}${numero.toString().padStart(4, '0')}`;
};

PersonalSchema.statics.obtenerEstadisticas = async function() {
  const [total, activos, porDeptResult, porContratoResult, masaSalarialResult] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ activo: true }),
    this.aggregate([
      { $group: { _id: '$datosLaborales.departamentoId', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $group: { _id: '$datosLaborales.tipoContrato', count: { $sum: 1 } } }
    ]),
    this.aggregate([
      {
        $group: {
          _id: null,
          masaSalarial: { $sum: '$datosEconomicos.salarioBrutoAnual' }
        }
      }
    ])
  ]);

  const porDepartamento: { [key: string]: number } = {};
  porDeptResult.forEach((item: { _id: string; count: number }) => {
    porDepartamento[item._id || 'sin_departamento'] = item.count;
  });

  const porTipoContrato: { [key: string]: number } = {};
  porContratoResult.forEach((item: { _id: string; count: number }) => {
    porTipoContrato[item._id] = item.count;
  });

  const masaSalarial = masaSalarialResult[0]?.masaSalarial || 0;

  return {
    total,
    activos,
    bajas: total - activos,
    porDepartamento,
    porTipoContrato,
    masasSalariales: masaSalarial
  };
};

// ============================================
// MODELO
// ============================================

export const Personal = mongoose.model<IPersonal, IPersonalModel>(
  'Personal',
  PersonalSchema
);

export default Personal;
