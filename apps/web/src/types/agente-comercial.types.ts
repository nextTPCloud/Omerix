// ============================================
// TIPOS PARA AGENTES COMERCIALES
// ============================================

export type TipoAgenteComercial = 'vendedor' | 'representante' | 'comercial' | 'delegado' | 'agente_externo';
export type EstadoAgenteComercial = 'activo' | 'inactivo' | 'baja' | 'vacaciones';
export type TipoComision = 'porcentaje' | 'fijo' | 'mixto';

// Constantes para selects
export const TIPOS_AGENTE: { value: TipoAgenteComercial; label: string }[] = [
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'representante', label: 'Representante' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'delegado', label: 'Delegado' },
  { value: 'agente_externo', label: 'Agente Externo' }
];

export const ESTADOS_AGENTE: { value: EstadoAgenteComercial; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'baja', label: 'Baja' },
  { value: 'vacaciones', label: 'Vacaciones' }
];

export const TIPOS_COMISION: { value: TipoComision; label: string }[] = [
  { value: 'porcentaje', label: 'Porcentaje' },
  { value: 'fijo', label: 'Importe Fijo' },
  { value: 'mixto', label: 'Mixto' }
];

// ============================================
// INTERFACES
// ============================================

export interface DatosContactoAgente {
  email?: string;
  emailSecundario?: string;
  telefono?: string;
  telefonoMovil?: string;
  fax?: string;
}

export interface DireccionAgente {
  direccion?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
}

export interface Comision {
  tipo: TipoComision;
  porcentaje?: number;
  importeFijo?: number;
  porcentajeMinimo?: number;
  porcentajeMaximo?: number;
}

export interface ZonaAsignada {
  _id?: string;
  zona: string;
  descripcion?: string;
  activa: boolean;
  fechaAsignacion: string;
}

export interface ObjetivoVentas {
  _id?: string;
  periodo: string;
  objetivo: number;
  conseguido: number;
  porcentajeCumplimiento?: number;
}

export interface AgenteComercial {
  _id: string;
  codigo: string;
  nombre: string;
  apellidos?: string;
  nif?: string;

  tipo: TipoAgenteComercial;
  estado: EstadoAgenteComercial;
  activo: boolean;

  contacto: DatosContactoAgente;
  direccion: DireccionAgente;
  comision: Comision;

  zonasAsignadas: ZonaAsignada[];
  clientesAsignados: string[];
  familiasAsignadas: string[];

  iban?: string;
  swift?: string;
  banco?: string;

  objetivosVentas: ObjetivoVentas[];
  ventasTotales: number;
  comisionesAcumuladas: number;

  supervisorId?: string;
  supervisor?: { codigo: string; nombre: string; apellidos?: string };

  fechaAlta: string;
  fechaBaja?: string;

  observaciones?: string;
  tags?: string[];

  creadoPor: string;
  fechaCreacion: string;
  modificadoPor?: string;
  fechaModificacion?: string;

  // Virtuals
  nombreCompleto?: string;
  comisionEfectiva?: number;
}

// ============================================
// DTOs
// ============================================

export interface CreateAgenteDTO {
  codigo?: string;
  nombre: string;
  apellidos?: string;
  nif?: string;
  tipo?: TipoAgenteComercial;
  estado?: EstadoAgenteComercial;
  activo?: boolean;
  contacto?: DatosContactoAgente;
  direccion?: DireccionAgente;
  comision?: Comision;
  zonasAsignadas?: Omit<ZonaAsignada, '_id'>[];
  clientesAsignados?: string[];
  familiasAsignadas?: string[];
  iban?: string;
  swift?: string;
  banco?: string;
  supervisorId?: string;
  fechaAlta?: string;
  observaciones?: string;
  tags?: string[];
}

export interface UpdateAgenteDTO extends Partial<CreateAgenteDTO> {}

// ============================================
// FILTROS Y RESPUESTAS
// ============================================

export interface AgentesFilters {
  search?: string;
  activo?: boolean;
  tipo?: TipoAgenteComercial;
  estado?: EstadoAgenteComercial;
  zona?: string;
  supervisorId?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AgentesListResponse {
  success: boolean;
  data: AgenteComercial[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AgenteDetailResponse {
  success: boolean;
  data: AgenteComercial;
}

export interface EstadisticasAgentes {
  total: number;
  activos: number;
  inactivos: number;
  porTipo: { [key: string]: number };
  ventasTotales: number;
  comisionesTotales: number;
}
