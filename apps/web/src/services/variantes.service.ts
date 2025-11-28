import { api } from './api';

export interface ValorVariante {
  _id?: string;
  valor: string;
  codigo?: string;
  hexColor?: string;
  imagen?: string;
  orden: number;
  activo: boolean;
}

export interface Variante {
  _id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  tipoVisualizacion: 'botones' | 'dropdown' | 'colores' | 'imagenes';
  valores: ValorVariante[];
  obligatorio: boolean;
  aplicaA: 'todos' | 'familias' | 'productos';
  familiasIds?: string[];
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVarianteDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  tipoVisualizacion?: 'botones' | 'dropdown' | 'colores' | 'imagenes';
  valores?: Omit<ValorVariante, '_id'>[];
  obligatorio?: boolean;
  aplicaA?: 'todos' | 'familias' | 'productos';
  familiasIds?: string[];
  orden?: number;
  activo?: boolean;
}

export interface UpdateVarianteDTO extends Partial<CreateVarianteDTO> {}

export interface VariantesResponse {
  success: boolean;
  data: Variante[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const variantesService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    tipoVisualizacion?: string;
    activo?: boolean;
  }): Promise<VariantesResponse> {
    const response = await api.get('/variantes', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Variante }> {
    const response = await api.get(`/variantes/${id}`);
    return response.data;
  },

  async create(data: CreateVarianteDTO): Promise<{ success: boolean; data: Variante }> {
    const response = await api.post('/variantes', data);
    return response.data;
  },

  async update(id: string, data: UpdateVarianteDTO): Promise<{ success: boolean; data: Variante }> {
    const response = await api.put(`/variantes/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/variantes/${id}`);
    return response.data;
  },

  // Gestión de valores
  async addValor(id: string, valor: Omit<ValorVariante, '_id'>): Promise<{ success: boolean; data: Variante }> {
    const response = await api.post(`/variantes/${id}/valores`, valor);
    return response.data;
  },

  async removeValor(id: string, valorId: string): Promise<{ success: boolean; data: Variante }> {
    const response = await api.delete(`/variantes/${id}/valores/${valorId}`);
    return response.data;
  },

  async searchCodigos(prefix: string): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/variantes/search-codigos', { params: { prefix } });
    return response.data;
  },
};
