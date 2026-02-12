import { api } from './api';

// ============================================
// TIPOS
// ============================================

export type EstadoCamarero = 'activo' | 'en_descanso' | 'fuera_turno' | 'inactivo';

export interface Turno {
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface PermisosCamarero {
  puedeAnularLineas: boolean;
  puedeAplicarDescuentos: boolean;
  puedeCobrar: boolean;
  puedeReimprimir: boolean;
  puedeTraspasar: boolean;
  limiteDescuento?: number;
}

export interface Camarero {
  _id: string;
  usuarioId: string | { _id: string; email: string; nombre: string; apellidos?: string };
  personalId?: string | { _id: string; nombre: string; apellidos?: string; email?: string; telefono?: string } | null;
  nombre: string;
  apellidos?: string;
  alias?: string;
  codigo: string;
  color?: string;
  foto?: string;
  salonesAsignados: string[] | { _id: string; nombre: string; color?: string }[];
  mesasAsignadas?: string[] | { _id: string; numero: string; estado: string }[];
  zonasPreparacion?: string[];
  turnosRRHHIds?: string[] | { _id: string; nombre: string; codigo?: string; horaInicio?: string; horaFin?: string; diasSemana?: string[]; color?: string }[];
  estado: EstadoCamarero;
  turnos: Turno[];
  comisionPorcentaje?: number;
  propinasAcumuladas: number;
  permisos: PermisosCamarero;
  dispositivoAsignado?: string;
  activo: boolean;
  fechaAlta: string;
  fechaBaja?: string;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  nombreCompleto?: string;
  nombreCorto?: string;
}

export interface CreateCamareroDTO {
  usuarioId: string;
  personalId?: string;
  nombre: string;
  apellidos?: string;
  alias?: string;
  codigo: string;
  pin?: string;
  color?: string;
  foto?: string;
  salonesAsignados?: string[];
  mesasAsignadas?: string[];
  zonasPreparacion?: string[];
  turnosRRHHIds?: string[];
  turnos?: Turno[];
  comisionPorcentaje?: number;
  permisos?: Partial<PermisosCamarero>;
  dispositivoAsignado?: string;
}

export interface UpdateCamareroDTO {
  nombre?: string;
  apellidos?: string;
  alias?: string;
  personalId?: string | null;
  pin?: string;
  color?: string;
  foto?: string;
  salonesAsignados?: string[];
  mesasAsignadas?: string[];
  zonasPreparacion?: string[];
  turnosRRHHIds?: string[];
  turnos?: Turno[];
  comisionPorcentaje?: number;
  permisos?: Partial<PermisosCamarero>;
  dispositivoAsignado?: string;
  activo?: boolean;
}

export interface ResumenCamareros {
  totalCamareros: number;
  activos: number;
  enDescanso: number;
  fueraTurno: number;
  totalPropinas: number;
}

export interface EstadisticasCamarero {
  camareroId: string;
  nombre: string;
  propinasAcumuladas: number;
  estado: EstadoCamarero;
  salonesAsignados: number;
  ventasHoy: number;
  propinasHoy: number;
  mesasAtendidas: number;
  tiempoMedioServicio: number;
}

export interface CamarerosResponse {
  success: boolean;
  data: Camarero[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// SERVICIO
// ============================================

export const camarerosService = {
  async getAll(params?: {
    estado?: EstadoCamarero;
    salonId?: string;
    activo?: boolean;
    busqueda?: string;
    page?: number;
    limit?: number;
  }): Promise<CamarerosResponse> {
    const response = await api.get('/camareros', { params });
    return response.data;
  },

  async getActivos(): Promise<{ success: boolean; data: Camarero[] }> {
    const response = await api.get('/camareros/activos');
    return response.data;
  },

  async getResumen(): Promise<{ success: boolean; data: ResumenCamareros }> {
    const response = await api.get('/camareros/resumen');
    return response.data;
  },

  async getPorSalon(salonId: string): Promise<{ success: boolean; data: Camarero[] }> {
    const response = await api.get(`/camareros/salon/${salonId}`);
    return response.data;
  },

  async getByUsuario(usuarioId: string): Promise<{ success: boolean; data: Camarero | null }> {
    const response = await api.get(`/camareros/usuario/${usuarioId}`);
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Camarero }> {
    const response = await api.get(`/camareros/${id}`);
    return response.data;
  },

  async create(data: CreateCamareroDTO): Promise<{ success: boolean; data: Camarero }> {
    const response = await api.post('/camareros', data);
    return response.data;
  },

  async update(id: string, data: UpdateCamareroDTO): Promise<{ success: boolean; data: Camarero }> {
    const response = await api.put(`/camareros/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/camareros/${id}`);
    return response.data;
  },

  async cambiarEstado(id: string, estado: EstadoCamarero): Promise<{ success: boolean; data: Camarero }> {
    const response = await api.put(`/camareros/${id}/estado`, { estado });
    return response.data;
  },

  async verificarPIN(id: string, pin: string): Promise<{ success: boolean; data: { valido: boolean } }> {
    const response = await api.post(`/camareros/${id}/verificar-pin`, { pin });
    return response.data;
  },

  async asignarSalones(id: string, salonesIds: string[]): Promise<{ success: boolean; data: Camarero }> {
    const response = await api.put(`/camareros/${id}/salones`, { salonesIds });
    return response.data;
  },

  async asignarMesas(id: string, mesasIds: string[]): Promise<{ success: boolean; data: Camarero }> {
    const response = await api.put(`/camareros/${id}/mesas`, { mesasIds });
    return response.data;
  },

  async registrarPropina(id: string, importe: number, ventaId?: string, mesaId?: string): Promise<{ success: boolean; data: Camarero }> {
    const response = await api.post(`/camareros/${id}/propina`, { importe, ventaId, mesaId });
    return response.data;
  },

  async resetearPropinas(id: string): Promise<{ success: boolean; propinasResetadas: number }> {
    const response = await api.post(`/camareros/${id}/propinas/reset`);
    return response.data;
  },

  async getEstadisticas(id: string, fecha?: string): Promise<{ success: boolean; data: EstadisticasCamarero }> {
    const params = fecha ? { fecha } : undefined;
    const response = await api.get(`/camareros/${id}/estadisticas`, { params });
    return response.data;
  },

  async sugerirSiguienteCodigo(prefijo: string = 'CAM'): Promise<{ success: boolean; data: { codigo: string } }> {
    const response = await api.get('/camareros/siguiente-codigo', { params: { prefijo } });
    return response.data;
  },

  // ============================================
  // HELPERS
  // ============================================

  getEstadoColor(estado: EstadoCamarero): string {
    const colores: Record<EstadoCamarero, string> = {
      activo: '#22c55e',       // Verde
      en_descanso: '#f59e0b',  // Amarillo
      fuera_turno: '#6b7280',  // Gris
      inactivo: '#ef4444',     // Rojo
    };
    return colores[estado] || '#6b7280';
  },

  getEstadoLabel(estado: EstadoCamarero): string {
    const labels: Record<EstadoCamarero, string> = {
      activo: 'Activo',
      en_descanso: 'En descanso',
      fuera_turno: 'Fuera de turno',
      inactivo: 'Inactivo',
    };
    return labels[estado] || estado;
  },

  getDiaLabel(dia: Turno['dia']): string {
    const labels: Record<Turno['dia'], string> = {
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sábado',
      domingo: 'Domingo',
    };
    return labels[dia] || dia;
  },

  getNombreCompleto(camarero: Camarero): string {
    return camarero.apellidos
      ? `${camarero.nombre} ${camarero.apellidos}`
      : camarero.nombre;
  },

  getNombreCorto(camarero: Camarero): string {
    return camarero.alias || camarero.nombre.split(' ')[0];
  },
};
