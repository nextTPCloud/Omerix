/**
 * Tipos para el módulo CRM
 */

// ============================================
// ENUMS - LEAD
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
// ENUMS - OPORTUNIDAD
// ============================================

export enum EstadoOportunidad {
  ABIERTA = 'abierta',
  GANADA = 'ganada',
  PERDIDA = 'perdida',
  CANCELADA = 'cancelada',
}

// ============================================
// ENUMS - ACTIVIDAD
// ============================================

export enum TipoActividad {
  LLAMADA = 'llamada',
  EMAIL = 'email',
  REUNION = 'reunion',
  VISITA = 'visita',
  TAREA = 'tarea',
  NOTA = 'nota',
  WHATSAPP = 'whatsapp',
}

export enum ResultadoActividad {
  COMPLETADA = 'completada',
  NO_CONTESTA = 'no_contesta',
  REPROGRAMADA = 'reprogramada',
  CANCELADA = 'cancelada',
}

// ============================================
// LEAD
// ============================================

export interface DireccionLead {
  calle?: string
  ciudad?: string
  provincia?: string
  codigoPostal?: string
  pais?: string
}

export interface ConversionLead {
  clienteId?: string
  oportunidadId?: string
  fecha?: Date
}

export interface Lead {
  _id: string
  empresaId?: string
  nombre: string
  apellidos?: string
  empresa?: string
  cargo?: string
  email?: string
  telefono?: string
  movil?: string
  web?: string
  direccion?: DireccionLead
  origen: OrigenLead
  estado: EstadoLead
  puntuacion: number
  interes: InteresLead
  asignadoA?: {
    _id: string
    nombre: string
    email?: string
  }
  proximoContacto?: Date
  notas?: string
  etiquetas?: string[]
  convertidoA?: ConversionLead
  creadoPor?: {
    _id: string
    nombre: string
  }
  actualizadoPor?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateLeadDTO {
  nombre: string
  apellidos?: string
  empresa?: string
  cargo?: string
  email?: string
  telefono?: string
  movil?: string
  web?: string
  direccion?: DireccionLead
  origen?: OrigenLead
  estado?: EstadoLead
  puntuacion?: number
  interes?: InteresLead
  asignadoA?: string
  proximoContacto?: string
  notas?: string
  etiquetas?: string[]
}

export interface UpdateLeadDTO extends Partial<CreateLeadDTO> {}

export interface ConvertirLeadDTO {
  crearCliente?: boolean
  crearOportunidad?: boolean
  datosCliente?: {
    nombre?: string
    nif?: string
    tipoCliente?: 'empresa' | 'particular'
  }
  datosOportunidad?: {
    nombre?: string
    valorEstimado?: number
    etapaId?: string
  }
}

export interface FiltroLeads {
  busqueda?: string
  estado?: EstadoLead
  origen?: OrigenLead
  interes?: InteresLead
  asignadoA?: string
  fechaDesde?: string
  fechaHasta?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ConversionResult {
  lead: Lead
  clienteId?: string
  oportunidadId?: string
}

export interface EstadisticasLeads {
  total: number
  porEstado: { [key: string]: number }
  porOrigen: { [key: string]: number }
  porInteres: { [key: string]: number }
  convertidos: number
  tasaConversion: number
}

// ============================================
// ETAPA PIPELINE
// ============================================

export interface EtapaPipeline {
  _id: string
  empresaId?: string
  nombre: string
  descripcion?: string
  color: string
  orden: number
  probabilidadDefecto: number
  esInicial: boolean
  esFinal: boolean
  esCierrePositivo: boolean
  activo: boolean
  createdAt: Date
  updatedAt: Date
  // Estadísticas (opcional, se agregan en algunos endpoints)
  totalOportunidades?: number
  valorTotal?: number
}

export interface CreateEtapaPipelineDTO {
  nombre: string
  descripcion?: string
  color?: string
  orden?: number
  probabilidadDefecto?: number
  esInicial?: boolean
  esFinal?: boolean
  esCierrePositivo?: boolean
  activo?: boolean
}

export interface UpdateEtapaPipelineDTO extends Partial<CreateEtapaPipelineDTO> {}

export interface ReordenarEtapasDTO {
  etapas: Array<{
    id: string
    orden: number
  }>
}

// ============================================
// OPORTUNIDAD
// ============================================

export interface LineaOportunidad {
  _id?: string
  productoId?: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento?: number
}

export interface Oportunidad {
  _id: string
  empresaId?: string
  clienteId?: {
    _id: string
    nombre: string
    nif?: string
  }
  leadId?: {
    _id: string
    nombre: string
    empresa?: string
  }
  contactoId?: string
  nombre: string
  descripcion?: string
  etapaId: {
    _id: string
    nombre: string
    color: string
    probabilidadDefecto?: number
  }
  probabilidad: number
  valorEstimado: number
  moneda: string
  fechaCierreEstimada?: Date
  fechaCierreReal?: Date
  estado: EstadoOportunidad
  motivoPerdida?: string
  competidor?: string
  lineas?: LineaOportunidad[]
  asignadoA?: {
    _id: string
    nombre: string
    email?: string
  }
  etiquetas?: string[]
  creadoPor?: {
    _id: string
    nombre: string
  }
  actualizadoPor?: string
  createdAt: Date
  updatedAt: Date
  // Virtuals
  valorPonderado?: number
  totalLineas?: number
}

export interface CreateOportunidadDTO {
  clienteId?: string
  leadId?: string
  contactoId?: string
  nombre: string
  descripcion?: string
  etapaId: string
  probabilidad?: number
  valorEstimado?: number
  moneda?: string
  fechaCierreEstimada?: string
  estado?: EstadoOportunidad
  lineas?: LineaOportunidad[]
  asignadoA?: string
  etiquetas?: string[]
}

export interface UpdateOportunidadDTO extends Partial<CreateOportunidadDTO> {}

export interface CambiarEtapaDTO {
  etapaId: string
  probabilidad?: number
}

export interface CerrarOportunidadDTO {
  estado: 'ganada' | 'perdida'
  fechaCierreReal?: string
  motivoPerdida?: string
  competidor?: string
}

export interface FiltroOportunidades {
  busqueda?: string
  estado?: EstadoOportunidad
  etapaId?: string
  clienteId?: string
  asignadoA?: string
  fechaDesde?: string
  fechaHasta?: string
  valorMinimo?: number
  valorMaximo?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OportunidadPorEtapa {
  etapa: EtapaPipeline
  oportunidades: Oportunidad[]
  total: number
  valorTotal: number
}

export interface EstadisticasOportunidades {
  total: number
  abiertas: number
  ganadas: number
  perdidas: number
  valorTotalAbierto: number
  valorPonderadoTotal: number
  tasaConversion: number
  valorPromedioGanado: number
}

export interface ForecastData {
  mes: string
  valorEstimado: number
  valorPonderado: number
  cantidad: number
}

// ============================================
// ACTIVIDAD
// ============================================

export interface Actividad {
  _id: string
  empresaId?: string
  leadId?: {
    _id: string
    nombre: string
    empresa?: string
  }
  oportunidadId?: {
    _id: string
    nombre: string
    valorEstimado?: number
  }
  clienteId?: {
    _id: string
    nombre: string
  }
  tipo: TipoActividad
  asunto: string
  descripcion?: string
  fechaProgramada?: Date
  duracionMinutos?: number
  fechaRealizacion?: Date
  resultado?: ResultadoActividad
  notasResultado?: string
  asignadoA?: {
    _id: string
    nombre: string
    email?: string
  }
  recordatorio?: Date
  completada: boolean
  creadoPor?: {
    _id: string
    nombre: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CreateActividadDTO {
  leadId?: string
  oportunidadId?: string
  clienteId?: string
  tipo: TipoActividad
  asunto: string
  descripcion?: string
  fechaProgramada?: string
  duracionMinutos?: number
  asignadoA?: string
  recordatorio?: string
}

export interface UpdateActividadDTO extends Partial<CreateActividadDTO> {}

export interface CompletarActividadDTO {
  fechaRealizacion?: string
  resultado?: ResultadoActividad
  notasResultado?: string
}

export interface FiltroActividades {
  leadId?: string
  oportunidadId?: string
  clienteId?: string
  tipo?: TipoActividad
  completada?: boolean
  asignadoA?: string
  fechaDesde?: string
  fechaHasta?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface EstadisticasActividades {
  total: number
  completadas: number
  pendientes: number
  porTipo: { [key: string]: number }
  proximasHoy: number
  vencidas: number
}

// ============================================
// RESPUESTAS PAGINADAS
// ============================================

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// ============================================
// DASHBOARD CRM
// ============================================

export interface DashboardCRM {
  leads: EstadisticasLeads
  oportunidades: EstadisticasOportunidades
  actividades: EstadisticasActividades
  forecast: ForecastData[]
}

// ============================================
// ETIQUETAS PARA VISUALIZACIÓN
// ============================================

export const ORIGEN_LEAD_LABELS: Record<OrigenLead, string> = {
  [OrigenLead.WEB]: 'Web',
  [OrigenLead.REFERIDO]: 'Referido',
  [OrigenLead.FERIA]: 'Feria',
  [OrigenLead.PUBLICIDAD]: 'Publicidad',
  [OrigenLead.LLAMADA_FRIA]: 'Llamada en frío',
  [OrigenLead.REDES_SOCIALES]: 'Redes sociales',
  [OrigenLead.EMAIL_MARKETING]: 'Email marketing',
  [OrigenLead.OTRO]: 'Otro',
}

export const ESTADO_LEAD_LABELS: Record<EstadoLead, string> = {
  [EstadoLead.NUEVO]: 'Nuevo',
  [EstadoLead.CONTACTADO]: 'Contactado',
  [EstadoLead.CALIFICADO]: 'Calificado',
  [EstadoLead.DESCALIFICADO]: 'Descalificado',
  [EstadoLead.CONVERTIDO]: 'Convertido',
}

export const INTERES_LEAD_LABELS: Record<InteresLead, string> = {
  [InteresLead.FRIO]: 'Frío',
  [InteresLead.TIBIO]: 'Tibio',
  [InteresLead.CALIENTE]: 'Caliente',
}

export const ESTADO_OPORTUNIDAD_LABELS: Record<EstadoOportunidad, string> = {
  [EstadoOportunidad.ABIERTA]: 'Abierta',
  [EstadoOportunidad.GANADA]: 'Ganada',
  [EstadoOportunidad.PERDIDA]: 'Perdida',
  [EstadoOportunidad.CANCELADA]: 'Cancelada',
}

export const TIPO_ACTIVIDAD_LABELS: Record<TipoActividad, string> = {
  [TipoActividad.LLAMADA]: 'Llamada',
  [TipoActividad.EMAIL]: 'Email',
  [TipoActividad.REUNION]: 'Reunión',
  [TipoActividad.VISITA]: 'Visita',
  [TipoActividad.TAREA]: 'Tarea',
  [TipoActividad.NOTA]: 'Nota',
  [TipoActividad.WHATSAPP]: 'WhatsApp',
}

export const RESULTADO_ACTIVIDAD_LABELS: Record<ResultadoActividad, string> = {
  [ResultadoActividad.COMPLETADA]: 'Completada',
  [ResultadoActividad.NO_CONTESTA]: 'No contesta',
  [ResultadoActividad.REPROGRAMADA]: 'Reprogramada',
  [ResultadoActividad.CANCELADA]: 'Cancelada',
}

// ============================================
// COLORES PARA ESTADOS
// ============================================

export const ESTADO_LEAD_COLORS: Record<EstadoLead, string> = {
  [EstadoLead.NUEVO]: '#3B82F6',      // blue
  [EstadoLead.CONTACTADO]: '#8B5CF6', // purple
  [EstadoLead.CALIFICADO]: '#10B981', // green
  [EstadoLead.DESCALIFICADO]: '#EF4444', // red
  [EstadoLead.CONVERTIDO]: '#059669', // emerald
}

export const INTERES_LEAD_COLORS: Record<InteresLead, string> = {
  [InteresLead.FRIO]: '#6B7280',      // gray
  [InteresLead.TIBIO]: '#F59E0B',     // amber
  [InteresLead.CALIENTE]: '#EF4444', // red
}

export const ESTADO_OPORTUNIDAD_COLORS: Record<EstadoOportunidad, string> = {
  [EstadoOportunidad.ABIERTA]: '#3B82F6',   // blue
  [EstadoOportunidad.GANADA]: '#10B981',    // green
  [EstadoOportunidad.PERDIDA]: '#EF4444',   // red
  [EstadoOportunidad.CANCELADA]: '#6B7280', // gray
}

export const TIPO_ACTIVIDAD_COLORS: Record<TipoActividad, string> = {
  [TipoActividad.LLAMADA]: '#3B82F6',   // blue
  [TipoActividad.EMAIL]: '#8B5CF6',     // purple
  [TipoActividad.REUNION]: '#10B981',   // green
  [TipoActividad.VISITA]: '#F59E0B',    // amber
  [TipoActividad.TAREA]: '#6366F1',     // indigo
  [TipoActividad.NOTA]: '#6B7280',      // gray
  [TipoActividad.WHATSAPP]: '#22C55E',  // green
}
