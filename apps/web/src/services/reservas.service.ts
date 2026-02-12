import { api } from './api';

// ============================================
// TIPOS
// ============================================

export type EstadoReserva = 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_show';
export type OrigenReserva = 'telefono' | 'web' | 'app' | 'presencial' | 'thefork' | 'google';

export interface Reserva {
  _id: string;
  clienteId?: string | { _id: string; nombre: string; email?: string; telefono?: string };
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  horaFinCalculada?: string;
  duracionMinutos: number;
  comensales: number;
  salonId?: string | { _id: string; nombre: string; color?: string };
  mesasIds: (string | { _id: string; numero: string; capacidad: number })[];
  camareroId?: string | { _id: string; nombre: string; alias?: string };
  estado: EstadoReserva;
  origen: OrigenReserva;
  notas?: string;
  notasInternas?: string;
  ocasionEspecial?: string;
  peticionesEspeciales?: string;
  confirmadaEn?: string;
  canceladaEn?: string;
  motivoCancelacion?: string;
  llegadaReal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservaDTO {
  clienteId?: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  duracionMinutos?: number;
  comensales: number;
  salonId?: string;
  mesasIds?: string[];
  camareroId?: string;
  origen?: OrigenReserva;
  notas?: string;
  notasInternas?: string;
  ocasionEspecial?: string;
  peticionesEspeciales?: string;
}

export interface ReservasResponse {
  success: boolean;
  data: Reserva[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EstadisticasReservas {
  total: number;
  confirmadas: number;
  completadas: number;
  canceladas: number;
  noShows: number;
  tasaCancelacion: number;
  tasaNoShow: number;
  porOrigen: { _id: OrigenReserva; count: number }[];
}

// ============================================
// SERVICIO
// ============================================

export const reservasService = {
  async getAll(params?: {
    fecha?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    estado?: EstadoReserva;
    salonId?: string;
    busqueda?: string;
    page?: number;
    limit?: number;
  }): Promise<ReservasResponse> {
    const response = await api.get('/reservas', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Reserva }> {
    const response = await api.get(`/reservas/${id}`);
    return response.data;
  },

  async getDelDia(fecha?: string): Promise<{ success: boolean; data: Reserva[] }> {
    const response = await api.get(`/reservas/dia/${fecha || ''}`);
    return response.data;
  },

  async create(data: CreateReservaDTO): Promise<{ success: boolean; data: Reserva }> {
    const response = await api.post('/reservas', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateReservaDTO>): Promise<{ success: boolean; data: Reserva }> {
    const response = await api.put(`/reservas/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/reservas/${id}`);
    return response.data;
  },

  async confirmar(id: string): Promise<{ success: boolean; data: Reserva }> {
    const response = await api.post(`/reservas/${id}/confirmar`);
    return response.data;
  },

  async iniciar(id: string): Promise<{ success: boolean; data: Reserva }> {
    const response = await api.post(`/reservas/${id}/iniciar`);
    return response.data;
  },

  async completar(id: string): Promise<{ success: boolean; data: Reserva }> {
    const response = await api.post(`/reservas/${id}/completar`);
    return response.data;
  },

  async cancelar(id: string, motivo?: string): Promise<{ success: boolean; data: Reserva }> {
    const response = await api.post(`/reservas/${id}/cancelar`, { motivo });
    return response.data;
  },

  async marcarNoShow(id: string): Promise<{ success: boolean; data: Reserva }> {
    const response = await api.post(`/reservas/${id}/no-show`);
    return response.data;
  },

  async verificarDisponibilidad(params: {
    fecha: string;
    comensales: number;
    horaInicio?: string;
    duracionMinutos?: number;
    salonId?: string;
  }): Promise<{ success: boolean; data: { disponible: boolean; horasDisponibles: string[] } }> {
    const response = await api.get('/reservas/disponibilidad', { params });
    return response.data;
  },

  async getEstadisticas(fechaDesde?: string, fechaHasta?: string): Promise<{ success: boolean; data: EstadisticasReservas }> {
    const params = { fechaDesde, fechaHasta };
    const response = await api.get('/reservas/estadisticas', { params });
    return response.data;
  },

  // ============================================
  // HELPERS
  // ============================================

  getEstadoColor(estado: EstadoReserva): string {
    const colores: Record<EstadoReserva, string> = {
      pendiente: '#f59e0b',
      confirmada: '#3b82f6',
      en_curso: '#22c55e',
      completada: '#6b7280',
      cancelada: '#ef4444',
      no_show: '#dc2626',
    };
    return colores[estado] || '#6b7280';
  },

  getEstadoLabel(estado: EstadoReserva): string {
    const labels: Record<EstadoReserva, string> = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      en_curso: 'En curso',
      completada: 'Completada',
      cancelada: 'Cancelada',
      no_show: 'No show',
    };
    return labels[estado] || estado;
  },

  getOrigenLabel(origen: OrigenReserva): string {
    const labels: Record<OrigenReserva, string> = {
      telefono: 'Teléfono',
      web: 'Web',
      app: 'App',
      presencial: 'Presencial',
      thefork: 'TheFork',
      google: 'Google',
    };
    return labels[origen] || origen;
  },

  formatHora(hora: string): string {
    return hora;
  },
};
