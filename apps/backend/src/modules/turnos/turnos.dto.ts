// ============================================
// CREAR TURNO
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

// ============================================
// ACTUALIZAR TURNO
// ============================================

export interface UpdateTurnoDTO extends Partial<CreateTurnoDTO> {
  activo?: boolean;
}

// ============================================
// BUSCAR TURNOS
// ============================================

export interface SearchTurnosDTO {
  search?: string;
  activo?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// HORARIO PERSONAL
// ============================================

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

export interface SearchHorarioPersonalDTO {
  personalId?: string;
  turnoId?: string;
  activo?: 'true' | 'false' | 'all';
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

// ============================================
// RESPUESTAS
// ============================================

export interface TurnoResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface TurnosListResponse {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
