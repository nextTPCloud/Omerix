// ============================================
// INTERFACE FESTIVO
// ============================================

export interface Festivo {
  _id?: string;
  fecha: string;
  nombre: string;
  tipo: 'nacional' | 'autonomico' | 'local' | 'empresa';
  sustituible: boolean;
}

// ============================================
// INTERFACE CALENDARIO LABORAL
// ============================================

export interface CalendarioLaboral {
  _id: string;
  anio: number;
  nombre: string;
  region?: string;
  provincia?: string;
  localidad?: string;
  esDefecto: boolean;
  festivos: Festivo[];
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ============================================
// DTOs
// ============================================

export interface CreateCalendarioDTO {
  anio: number;
  nombre: string;
  region?: string;
  provincia?: string;
  localidad?: string;
  esDefecto?: boolean;
  festivos?: Festivo[];
}

export interface UpdateCalendarioDTO extends Partial<CreateCalendarioDTO> {
  activo?: boolean;
}

export interface CreateFestivoDTO {
  fecha: string;
  nombre: string;
  tipo?: 'nacional' | 'autonomico' | 'local' | 'empresa';
  sustituible?: boolean;
}

// ============================================
// RESPUESTAS API
// ============================================

export interface CalendarioResponse {
  success: boolean;
  data?: CalendarioLaboral;
  message?: string;
  error?: string;
}

export interface CalendariosListResponse {
  success: boolean;
  data: CalendarioLaboral[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// TIPOS DE FESTIVO
// ============================================

export const TIPOS_FESTIVO = [
  { value: 'nacional', label: 'Nacional' },
  { value: 'autonomico', label: 'Autonómico' },
  { value: 'local', label: 'Local' },
  { value: 'empresa', label: 'Empresa' },
];

// ============================================
// REGIONES DE ESPAÑA
// ============================================

export const REGIONES_ESPANA = [
  { value: 'andalucia', label: 'Andalucía' },
  { value: 'aragon', label: 'Aragón' },
  { value: 'asturias', label: 'Asturias' },
  { value: 'baleares', label: 'Islas Baleares' },
  { value: 'canarias', label: 'Canarias' },
  { value: 'cantabria', label: 'Cantabria' },
  { value: 'castilla-leon', label: 'Castilla y León' },
  { value: 'castilla-mancha', label: 'Castilla-La Mancha' },
  { value: 'cataluna', label: 'Cataluña' },
  { value: 'extremadura', label: 'Extremadura' },
  { value: 'galicia', label: 'Galicia' },
  { value: 'madrid', label: 'Madrid' },
  { value: 'murcia', label: 'Murcia' },
  { value: 'navarra', label: 'Navarra' },
  { value: 'pais-vasco', label: 'País Vasco' },
  { value: 'rioja', label: 'La Rioja' },
  { value: 'valencia', label: 'Comunidad Valenciana' },
  { value: 'ceuta', label: 'Ceuta' },
  { value: 'melilla', label: 'Melilla' },
];
