// ============================================
// INTERFACE TURNO
// ============================================

export interface Turno {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  horaEntrada: string;
  horaSalida: string;
  pausaInicio?: string;
  pausaFin?: string;
  duracionPausaMinutos: number;
  horasTeoricas: number;
  diasSemana: number[];
  color?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ============================================
// INTERFACE HORARIO PERSONAL
// ============================================

export interface HorarioPersonal {
  _id: string;
  personalId: string;
  personalNombre?: string;
  turnoId: string;
  turnoNombre?: string;
  fechaInicio: string;
  fechaFin?: string;
  observaciones?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ============================================
// DTOs
// ============================================

export interface CreateTurnoDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  horaEntrada: string;
  horaSalida: string;
  pausaInicio?: string;
  pausaFin?: string;
  duracionPausaMinutos?: number;
  horasTeoricas: number;
  diasSemana?: number[];
  color?: string;
}

export interface UpdateTurnoDTO extends Partial<CreateTurnoDTO> {
  activo?: boolean;
}

export interface CreateHorarioPersonalDTO {
  personalId: string;
  personalNombre?: string;
  turnoId: string;
  turnoNombre?: string;
  fechaInicio: string;
  fechaFin?: string;
  observaciones?: string;
}

export interface UpdateHorarioPersonalDTO extends Partial<CreateHorarioPersonalDTO> {
  activo?: boolean;
}

// ============================================
// RESPUESTAS API
// ============================================

export interface TurnoResponse {
  success: boolean;
  data?: Turno;
  message?: string;
  error?: string;
}

export interface TurnosListResponse {
  success: boolean;
  data: Turno[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HorarioPersonalResponse {
  success: boolean;
  data?: HorarioPersonal;
  message?: string;
  error?: string;
}

export interface HorariosPersonalListResponse {
  success: boolean;
  data: HorarioPersonal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// DÍAS DE LA SEMANA
// ============================================

export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

// ============================================
// COLORES PREDEFINIDOS PARA TURNOS
// ============================================

export const COLORES_TURNO = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Naranja' },
  { value: '#64748B', label: 'Gris' },
];
