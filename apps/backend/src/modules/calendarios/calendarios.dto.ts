// ============================================
// CREAR FESTIVO
// ============================================

export interface CreateFestivoDTO {
  fecha: string;
  nombre: string;
  tipo?: 'nacional' | 'autonomico' | 'local' | 'empresa';
  sustituible?: boolean;
}

// ============================================
// CREAR CALENDARIO
// ============================================

export interface CreateCalendarioDTO {
  anio: number;
  nombre: string;
  region?: string;
  provincia?: string;
  localidad?: string;
  esDefecto?: boolean;
  festivos?: CreateFestivoDTO[];
}

// ============================================
// ACTUALIZAR CALENDARIO
// ============================================

export interface UpdateCalendarioDTO extends Partial<CreateCalendarioDTO> {
  activo?: boolean;
}

// ============================================
// BUSCAR CALENDARIOS
// ============================================

export interface SearchCalendariosDTO {
  anio?: number;
  region?: string;
  activo?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// RESPUESTAS
// ============================================

export interface CalendarioResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface CalendariosListResponse {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
