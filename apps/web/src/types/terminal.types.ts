// ============================================
// TIPOS PARA TERMINALES BIOMÉTRICOS
// ============================================

export type MarcaTerminal = 'ZKTeco' | 'ANVIZ' | 'Hikvision' | 'otro';
export type EstadoTerminal = 'activo' | 'inactivo' | 'error';
export type EstadoConexion = 'conectado' | 'desconectado' | 'desconocido';

// Constantes para selects
export const MARCAS_TERMINAL: { value: MarcaTerminal; label: string; puerto: number }[] = [
  { value: 'ZKTeco', label: 'ZKTeco', puerto: 4370 },
  { value: 'ANVIZ', label: 'ANVIZ', puerto: 5010 },
  { value: 'Hikvision', label: 'Hikvision', puerto: 8000 },
  { value: 'otro', label: 'Otro', puerto: 4370 },
];

export const ESTADOS_TERMINAL: { value: EstadoTerminal; label: string; color: string }[] = [
  { value: 'activo', label: 'Activo', color: 'green' },
  { value: 'inactivo', label: 'Inactivo', color: 'gray' },
  { value: 'error', label: 'Error', color: 'red' },
];

export const ESTADOS_CONEXION: { value: EstadoConexion; label: string; color: string }[] = [
  { value: 'conectado', label: 'Conectado', color: 'green' },
  { value: 'desconectado', label: 'Desconectado', color: 'red' },
  { value: 'desconocido', label: 'Desconocido', color: 'gray' },
];

// ============================================
// INTERFACES
// ============================================

export interface ConfiguracionTerminal {
  frecuenciaMinutos: number;
  sincronizarAsistencia: boolean;
  sincronizarEmpleados: boolean;
  timezone: string;
  eliminarRegistrosSincronizados: boolean;
}

export interface EmpleadoSincronizado {
  personalId: string;
  codigoTerminal: number;
  sincronizadoEn: string;
  conFoto: boolean;
  personal?: {
    _id: string;
    codigo: string;
    nombre: string;
    apellidos: string;
    foto?: string;
  };
}

export interface HistorialSync {
  fecha: string;
  tipo: 'asistencia' | 'empleados';
  direccion: 'descarga' | 'carga';
  estado: 'exitoso' | 'error' | 'parcial';
  registrosProcesados: number;
  registrosNuevos: number;
  registrosError: number;
  duracionMs: number;
  error?: string;
  detalles?: string;
}

export interface Terminal {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;

  // Conexión
  ip: string;
  puerto: number;
  mac?: string;

  // Dispositivo
  marca: MarcaTerminal;
  modelo?: string;
  numeroSerie?: string;
  firmware?: string;

  // Configuración
  configuracion: ConfiguracionTerminal;

  // Estado
  estado: EstadoTerminal;
  estadoConexion: EstadoConexion;
  ultimaConexion?: string;
  ultimaSincronizacion?: string;
  ultimoError?: string;

  // Empleados sincronizados
  empleadosSincronizados: EmpleadoSincronizado[];

  // Historial
  historialSync: HistorialSync[];

  // Metadata
  activo: boolean;
  orden: number;
  creadoPor: string;
  fechaCreacion: string;
  modificadoPor?: string;
  fechaModificacion?: string;
}

// ============================================
// DTOs
// ============================================

export interface CreateTerminalDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  ip: string;
  puerto?: number;
  mac?: string;
  marca?: MarcaTerminal;
  modelo?: string;
  numeroSerie?: string;
  configuracion?: Partial<ConfiguracionTerminal>;
  estado?: EstadoTerminal;
  activo?: boolean;
  orden?: number;
}

export interface UpdateTerminalDTO extends Partial<CreateTerminalDTO> {}

export interface SincronizarEmpleadosDTO {
  personalIds?: string[];
  soloConFoto?: boolean;
  eliminarNoIncluidos?: boolean;
}

export interface SincronizarAsistenciaDTO {
  desde?: string;
  hasta?: string;
  limpiarDespues?: boolean;
}

// ============================================
// FILTROS Y RESPUESTAS
// ============================================

export interface TerminalFilters {
  search?: string;
  marca?: MarcaTerminal;
  estado?: EstadoTerminal;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TerminalListResponse {
  success: boolean;
  data: Terminal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TerminalDetailResponse {
  success: boolean;
  data: Terminal;
}

export interface DeviceInfo {
  serialNumber?: string;
  firmware?: string;
  platform?: string;
  deviceName?: string;
  mac?: string;
  usersCount?: number;
  logsCount?: number;
  fingerprintsCount?: number;
  facesCount?: number;
}

export interface ProbarConexionResponse {
  success: boolean;
  data?: DeviceInfo;
  message: string;
}

export interface SincronizarResponse {
  success: boolean;
  data: HistorialSync;
  message: string;
}
