// ============================================
// TIPOS PARA PERSONAL / EMPLEADOS
// ============================================

export type TipoContrato = 'indefinido' | 'temporal' | 'practicas' | 'formacion' | 'obra_servicio' | 'interinidad' | 'autonomo';
export type EstadoEmpleado = 'activo' | 'baja_temporal' | 'baja_definitiva' | 'vacaciones' | 'excedencia' | 'prejubilacion';
export type TipoJornada = 'completa' | 'parcial' | 'intensiva' | 'turnos' | 'flexible';
export type Genero = 'masculino' | 'femenino' | 'no_binario' | 'no_especificado';

// Constantes para selects
export const TIPOS_CONTRATO: { value: TipoContrato; label: string }[] = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'temporal', label: 'Temporal' },
  { value: 'practicas', label: 'Prácticas' },
  { value: 'formacion', label: 'Formación' },
  { value: 'obra_servicio', label: 'Obra y Servicio' },
  { value: 'interinidad', label: 'Interinidad' },
  { value: 'autonomo', label: 'Autónomo' }
];

export const ESTADOS_EMPLEADO: { value: EstadoEmpleado; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'baja_temporal', label: 'Baja Temporal' },
  { value: 'baja_definitiva', label: 'Baja Definitiva' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'excedencia', label: 'Excedencia' },
  { value: 'prejubilacion', label: 'Prejubilación' }
];

export const TIPOS_JORNADA: { value: TipoJornada; label: string }[] = [
  { value: 'completa', label: 'Jornada Completa' },
  { value: 'parcial', label: 'Jornada Parcial' },
  { value: 'intensiva', label: 'Jornada Intensiva' },
  { value: 'turnos', label: 'Turnos' },
  { value: 'flexible', label: 'Flexible' }
];

export const GENEROS: { value: Genero; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'no_binario', label: 'No Binario' },
  { value: 'no_especificado', label: 'No Especificado' }
];

// ============================================
// INTERFACES
// ============================================

export interface DatosPersonales {
  fechaNacimiento?: string;
  genero?: Genero;
  nacionalidad?: string;
  lugarNacimiento?: string;
  estadoCivil?: string;
  numHijos?: number;
}

export interface DatosContactoPersonal {
  email?: string;
  emailCorporativo?: string;
  telefono?: string;
  telefonoMovil?: string;
  telefonoEmergencia?: string;
  contactoEmergencia?: string;
}

export interface DireccionPersonal {
  direccion?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
}

export interface Documentacion {
  nif?: string;
  nss?: string;
  numAfiliacion?: string;
  permisoTrabajo?: string;
  fechaCaducidadPermiso?: string;
  carnetConducir?: string;
  tipoCarnet?: string[];
}

export interface DatosLaborales {
  puesto: string;
  departamentoId?: string;
  departamento?: { codigo: string; nombre: string };
  categoriaLaboral?: string;
  nivelProfesional?: string;
  tipoContrato: TipoContrato;
  tipoJornada: TipoJornada;
  horasSemanales?: number;
  fechaInicioContrato: string;
  fechaFinContrato?: string;
  periodoPrueba?: boolean;
  fechaFinPrueba?: string;
  // Configuración de fichaje
  ubicacionObligatoria?: boolean;
  fotoObligatoria?: boolean;
}

export interface DatosEconomicos {
  salarioBrutoAnual?: number;
  salarioBrutoMensual?: number;
  numPagas?: number;
  irpf?: number;
  horasExtra?: number;
  plusTransporte?: number;
  plusComida?: number;
  otrosPluses?: number;
}

export interface CuentaBancariaPersonal {
  _id?: string;
  iban: string;
  swift?: string;
  banco?: string;
  titular?: string;
  principal: boolean;
}

export interface FormacionAcademica {
  _id?: string;
  titulo: string;
  institucion?: string;
  fechaObtencion?: string;
  especialidad?: string;
  observaciones?: string;
}

export interface ExperienciaLaboral {
  _id?: string;
  empresa: string;
  puesto: string;
  fechaInicio: string;
  fechaFin?: string;
  descripcion?: string;
  motivoSalida?: string;
}

export interface Vacaciones {
  _id?: string;
  anio: number;
  diasTotales: number;
  diasDisfrutados: number;
  diasPendientes?: number;
}

export interface Ausencia {
  _id?: string;
  tipo: string;
  fechaInicio: string;
  fechaFin?: string;
  motivo?: string;
  documentacion?: string;
  aprobada: boolean;
}

export interface Evaluacion {
  _id?: string;
  fecha: string;
  evaluadorId: string;
  evaluador?: { codigo: string; nombre: string; apellidos: string };
  puntuacion?: number;
  comentarios?: string;
  objetivosCumplidos?: boolean;
}

export interface DocumentoPersonal {
  _id?: string;
  nombre: string;
  tipo: string;
  url: string;
  fechaSubida: string;
  subidoPor: string;
  confidencial: boolean;
}

export interface Personal {
  _id: string;
  codigo: string;
  nombre: string;
  apellidos: string;
  foto?: string;

  estado: EstadoEmpleado;
  activo: boolean;

  datosPersonales: DatosPersonales;
  contacto: DatosContactoPersonal;
  direccion: DireccionPersonal;
  documentacion: Documentacion;

  datosLaborales: DatosLaborales;
  datosEconomicos: DatosEconomicos;

  responsableId?: string;
  responsable?: { codigo: string; nombre: string; apellidos: string };
  subordinados?: string[];

  cuentasBancarias: CuentaBancariaPersonal[];
  formacionAcademica: FormacionAcademica[];
  experienciaLaboral: ExperienciaLaboral[];
  vacaciones: Vacaciones[];
  ausencias: Ausencia[];
  evaluaciones: Evaluacion[];
  documentos: DocumentoPersonal[];

  usuarioId?: string;
  usuario?: { email: string; nombre: string };

  observaciones?: string;
  tags?: string[];

  creadoPor: string;
  fechaCreacion: string;
  modificadoPor?: string;
  fechaModificacion?: string;

  // Virtuals
  nombreCompleto?: string;
  edad?: number;
  antiguedad?: number;
  salarioNeto?: number;
  diasVacacionesPendientes?: number;
}

// ============================================
// DTOs
// ============================================

export interface CreatePersonalDTO {
  codigo?: string;
  nombre: string;
  apellidos: string;
  foto?: string;
  estado?: EstadoEmpleado;
  activo?: boolean;
  datosPersonales?: DatosPersonales;
  contacto?: DatosContactoPersonal;
  direccion?: DireccionPersonal;
  documentacion?: Documentacion;
  datosLaborales: {
    puesto: string;
    departamentoId?: string;
    categoriaLaboral?: string;
    nivelProfesional?: string;
    tipoContrato?: TipoContrato;
    tipoJornada?: TipoJornada;
    horasSemanales?: number;
    fechaInicioContrato: string;
    fechaFinContrato?: string;
    periodoPrueba?: boolean;
    fechaFinPrueba?: string;
    ubicacionObligatoria?: boolean;
    fotoObligatoria?: boolean;
  };
  datosEconomicos?: DatosEconomicos;
  responsableId?: string;
  cuentasBancarias?: Omit<CuentaBancariaPersonal, '_id'>[];
  formacionAcademica?: Omit<FormacionAcademica, '_id'>[];
  experienciaLaboral?: Omit<ExperienciaLaboral, '_id'>[];
  vacaciones?: Omit<Vacaciones, '_id'>[];
  usuarioId?: string;
  observaciones?: string;
  tags?: string[];
}

export interface UpdatePersonalDTO extends Partial<CreatePersonalDTO> {}

// ============================================
// FILTROS Y RESPUESTAS
// ============================================

export interface PersonalFilters {
  search?: string;
  activo?: boolean;
  estado?: EstadoEmpleado;
  tipoContrato?: TipoContrato;
  departamentoId?: string;
  responsableId?: string;
  puesto?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PersonalListResponse {
  success: boolean;
  data: Personal[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PersonalDetailResponse {
  success: boolean;
  data: Personal;
}

export interface EstadisticasPersonal {
  total: number;
  activos: number;
  bajas: number;
  porDepartamento: { [key: string]: number };
  porTipoContrato: { [key: string]: number };
  masasSalariales: number;
}

// ============================================
// TIPOS PARA AUSENCIAS Y VACACIONES
// ============================================

export const TIPOS_AUSENCIA: { value: string; label: string }[] = [
  { value: 'enfermedad', label: 'Enfermedad' },
  { value: 'accidente', label: 'Accidente' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'maternidad', label: 'Maternidad' },
  { value: 'paternidad', label: 'Paternidad' },
  { value: 'asuntos_propios', label: 'Asuntos Propios' },
  { value: 'formacion', label: 'Formación' },
  { value: 'otros', label: 'Otros' }
];
