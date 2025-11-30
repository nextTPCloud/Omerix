// ============================================
// ENUMS
// ============================================

export enum EstadoProyecto {
  BORRADOR = 'borrador',
  PLANIFICACION = 'planificacion',
  EN_CURSO = 'en_curso',
  PAUSADO = 'pausado',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
  CERRADO = 'cerrado',
}

export enum PrioridadProyecto {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum TipoProyecto {
  INTERNO = 'interno',
  CLIENTE = 'cliente',
  MANTENIMIENTO = 'mantenimiento',
  DESARROLLO = 'desarrollo',
  CONSULTORIA = 'consultoria',
  INSTALACION = 'instalacion',
  OTRO = 'otro',
}

// ============================================
// INTERFACES
// ============================================

export interface IHito {
  _id?: string;
  nombre: string;
  descripcion?: string;
  fechaPrevista: string | Date;
  fechaReal?: string | Date;
  completado: boolean;
  orden: number;
}

export interface IParticipante {
  _id?: string;
  usuarioId?: string | { _id: string; nombre: string; email: string };
  personalId?: string | { _id: string; codigo: string; nombre: string; apellidos: string };
  rol: string;
  horasAsignadas?: number;
  horasTrabajadas?: number;
  activo: boolean;
}

export interface IDireccionProyecto {
  nombre?: string;
  calle: string;
  numero?: string;
  piso?: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  latitud?: number;
  longitud?: number;
  notas?: string;
}

export interface IProyecto {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  clienteId: string | { _id: string; codigo: string; nombre: string; nombreComercial?: string };
  agenteComercialId?: string | { _id: string; codigo: string; nombre: string; apellidos: string };
  tipo: TipoProyecto;
  estado: EstadoProyecto;
  prioridad: PrioridadProyecto;
  fechaInicio?: string | Date;
  fechaFinPrevista?: string | Date;
  fechaFinReal?: string | Date;
  direccion?: IDireccionProyecto;
  presupuestoEstimado?: number;
  presupuestoAprobado?: number;
  costeReal?: number;
  margenPrevisto?: number;
  margenReal?: number;
  horasEstimadas?: number;
  horasReales?: number;
  hitos: IHito[];
  responsableId?: string | { _id: string; codigo: string; nombre: string; apellidos: string };
  participantes: IParticipante[];
  presupuestosIds?: string[];
  pedidosIds?: string[];
  facturasIds?: string[];
  partesTrabajoIds?: string[];
  tags?: string[];
  observaciones?: string;
  activo: boolean;
  creadoPor?: string | { _id: string; nombre: string; email: string };
  modificadoPor?: string | { _id: string; nombre: string; email: string };
  fechaCreacion: string | Date;
  fechaModificacion?: string | Date;
  // Virtuals
  diasRestantes?: number | null;
  progreso?: number;
  estaRetrasado?: boolean;
  rentabilidad?: number | null;
}

// ============================================
// DTOs
// ============================================

export interface CreateProyectoDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  clienteId: string;
  agenteComercialId?: string;
  tipo?: TipoProyecto;
  estado?: EstadoProyecto;
  prioridad?: PrioridadProyecto;
  fechaInicio?: string | Date;
  fechaFinPrevista?: string | Date;
  direccion?: IDireccionProyecto;
  presupuestoEstimado?: number;
  presupuestoAprobado?: number;
  margenPrevisto?: number;
  horasEstimadas?: number;
  hitos?: Omit<IHito, '_id'>[];
  responsableId?: string;
  participantes?: Omit<IParticipante, '_id'>[];
  tags?: string[];
  observaciones?: string;
  activo?: boolean;
}

export interface UpdateProyectoDTO extends Partial<CreateProyectoDTO> {}

export interface SearchProyectosParams {
  search?: string;
  clienteId?: string;
  agenteComercialId?: string;
  tipo?: TipoProyecto;
  estado?: EstadoProyecto;
  estados?: string;
  prioridad?: PrioridadProyecto;
  responsableId?: string;
  activo?: 'true' | 'false' | 'all';
  fechaInicioDesde?: string;
  fechaInicioHasta?: string;
  fechaFinDesde?: string;
  fechaFinHasta?: string;
  presupuestoMin?: string;
  presupuestoMax?: string;
  retrasados?: 'true' | 'false';
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProyectoEstadisticas {
  total: number;
  activos: number;
  enCurso: number;
  completados: number;
  retrasados: number;
  porEstado: Record<string, number>;
  porTipo: Record<string, number>;
  presupuestoTotal: number;
  costeTotal: number;
  horasEstimadas: number;
  horasReales: number;
  margenGlobal: number;
}

// ============================================
// CONSTANTES
// ============================================

export const ESTADOS_PROYECTO: { value: EstadoProyecto; label: string; color: string }[] = [
  { value: EstadoProyecto.BORRADOR, label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: EstadoProyecto.PLANIFICACION, label: 'Planificación', color: 'bg-blue-100 text-blue-800' },
  { value: EstadoProyecto.EN_CURSO, label: 'En curso', color: 'bg-green-100 text-green-800' },
  { value: EstadoProyecto.PAUSADO, label: 'Pausado', color: 'bg-yellow-100 text-yellow-800' },
  { value: EstadoProyecto.COMPLETADO, label: 'Completado', color: 'bg-emerald-100 text-emerald-800' },
  { value: EstadoProyecto.CANCELADO, label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: EstadoProyecto.CERRADO, label: 'Cerrado', color: 'bg-slate-100 text-slate-800' },
];

export const PRIORIDADES_PROYECTO: { value: PrioridadProyecto; label: string; color: string }[] = [
  { value: PrioridadProyecto.BAJA, label: 'Baja', color: 'bg-slate-100 text-slate-800' },
  { value: PrioridadProyecto.MEDIA, label: 'Media', color: 'bg-blue-100 text-blue-800' },
  { value: PrioridadProyecto.ALTA, label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: PrioridadProyecto.URGENTE, label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

export const TIPOS_PROYECTO: { value: TipoProyecto; label: string }[] = [
  { value: TipoProyecto.INTERNO, label: 'Interno' },
  { value: TipoProyecto.CLIENTE, label: 'Cliente' },
  { value: TipoProyecto.MANTENIMIENTO, label: 'Mantenimiento' },
  { value: TipoProyecto.DESARROLLO, label: 'Desarrollo' },
  { value: TipoProyecto.CONSULTORIA, label: 'Consultoría' },
  { value: TipoProyecto.INSTALACION, label: 'Instalación' },
  { value: TipoProyecto.OTRO, label: 'Otro' },
];

export const getEstadoConfig = (estado: EstadoProyecto) => {
  return ESTADOS_PROYECTO.find(e => e.value === estado) || ESTADOS_PROYECTO[0];
};

export const getPrioridadConfig = (prioridad: PrioridadProyecto) => {
  return PRIORIDADES_PROYECTO.find(p => p.value === prioridad) || PRIORIDADES_PROYECTO[1];
};

export const getTipoLabel = (tipo: TipoProyecto) => {
  return TIPOS_PROYECTO.find(t => t.value === tipo)?.label || tipo;
};
