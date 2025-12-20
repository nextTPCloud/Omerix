// ============================================
// INTERFACE FICHAJE
// ============================================

export interface Ubicacion {
  latitud: number;
  longitud: number;
  direccion?: string;
}

export interface Fichaje {
  _id: string;
  personalId: string;
  personalNombre?: string;
  personalCodigo?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  turnoId?: string;
  turnoNombre?: string;
  fecha: string;
  horaEntrada?: string;
  horaSalida?: string;
  pausaInicio?: string;
  pausaFin?: string;
  horasTrabajadas?: number;
  horasExtra?: number;
  tipo: 'normal' | 'teletrabajo' | 'viaje' | 'formacion';
  estado: 'abierto' | 'cerrado' | 'pendiente' | 'aprobado' | 'rechazado';
  ubicacionEntrada?: Ubicacion;
  ubicacionSalida?: Ubicacion;
  ipEntrada?: string;
  ipSalida?: string;
  observaciones?: string;
  incidencia?: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ============================================
// DTOs
// ============================================

export interface RegistrarFichajeDTO {
  personalId?: string;
  tipo?: 'normal' | 'teletrabajo' | 'viaje' | 'formacion';
  ubicacion?: Ubicacion;
  observaciones?: string;
}

export interface UpdateFichajeDTO {
  horaEntrada?: string;
  horaSalida?: string;
  pausaInicio?: string;
  pausaFin?: string;
  tipo?: 'normal' | 'teletrabajo' | 'viaje' | 'formacion';
  estado?: 'abierto' | 'cerrado' | 'pendiente' | 'aprobado' | 'rechazado';
  observaciones?: string;
  incidencia?: string;
}

// ============================================
// RESPUESTAS API
// ============================================

export interface FichajeResponse {
  success: boolean;
  data?: Fichaje;
  accion?: 'entrada' | 'salida';
  message?: string;
  error?: string;
}

export interface FichajesListResponse {
  success: boolean;
  data: Fichaje[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EstadoFichajeResponse {
  success: boolean;
  data: {
    fichando: boolean;
    enPausa: boolean;
    fichaje: Fichaje | null;
  };
}

export interface ResumenFichajeResponse {
  success: boolean;
  data: {
    mes: number;
    anio: number;
    totalHoras: number;
    diasTrabajados: number;
    horasExtra: number;
    fichajes: Fichaje[];
  };
}

// ============================================
// TIPOS DE FICHAJE
// ============================================

export const TIPOS_FICHAJE = [
  { value: 'normal', label: 'Normal', icon: 'Building2' },
  { value: 'teletrabajo', label: 'Teletrabajo', icon: 'Home' },
  { value: 'viaje', label: 'Viaje', icon: 'Plane' },
  { value: 'formacion', label: 'Formacion', icon: 'GraduationCap' },
];

export const ESTADOS_FICHAJE = [
  { value: 'abierto', label: 'Abierto', color: 'blue' },
  { value: 'cerrado', label: 'Cerrado', color: 'green' },
  { value: 'pendiente', label: 'Pendiente', color: 'yellow' },
  { value: 'aprobado', label: 'Aprobado', color: 'green' },
  { value: 'rechazado', label: 'Rechazado', color: 'red' },
];
