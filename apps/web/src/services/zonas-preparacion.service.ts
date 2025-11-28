import { api } from './api';

export interface ZonaPreparacion {
  _id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  color: string;
  icono?: string;
  impresoraId?: string;
  orden: number;
  tiempoPreparacionPromedio?: number;
  notificarRetraso: boolean;
  tiempoAlertaMinutos: number;
  activo: boolean;
  kds?: {
    habilitado: boolean;
    dispositivoId?: string;
    mostrarTiempo: boolean;
    mostrarPrioridad: boolean;
    sonidoNuevaComanda: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateZonaPreparacionDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  impresoraId?: string;
  orden?: number;
  tiempoPreparacionPromedio?: number;
  notificarRetraso?: boolean;
  tiempoAlertaMinutos?: number;
  activo?: boolean;
  kds?: {
    habilitado?: boolean;
    dispositivoId?: string;
    mostrarTiempo?: boolean;
    mostrarPrioridad?: boolean;
    sonidoNuevaComanda?: boolean;
  };
}

export interface UpdateZonaPreparacionDTO extends Partial<CreateZonaPreparacionDTO> {}

export interface ZonasPreparacionResponse {
  success: boolean;
  data: ZonaPreparacion[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const zonasPreparacionService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    activo?: boolean;
  }): Promise<ZonasPreparacionResponse> {
    const response = await api.get('/zonas-preparacion', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: ZonaPreparacion }> {
    const response = await api.get(`/zonas-preparacion/${id}`);
    return response.data;
  },

  async create(data: CreateZonaPreparacionDTO): Promise<{ success: boolean; data: ZonaPreparacion }> {
    const response = await api.post('/zonas-preparacion', data);
    return response.data;
  },

  async update(id: string, data: UpdateZonaPreparacionDTO): Promise<{ success: boolean; data: ZonaPreparacion }> {
    const response = await api.put(`/zonas-preparacion/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/zonas-preparacion/${id}`);
    return response.data;
  },

  async reordenar(items: Array<{ id: string; orden: number }>): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/zonas-preparacion/reordenar', { items });
    return response.data;
  },

  async searchCodigos(prefix: string): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/zonas-preparacion/search-codigos', { params: { prefix } });
    return response.data;
  },
};
