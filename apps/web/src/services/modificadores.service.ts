import { api } from './api';

export interface ModificadorProducto {
  _id: string;
  codigo?: string;
  nombre: string;
  nombreCorto?: string;
  descripcion?: string;
  tipo: 'gratis' | 'cargo' | 'descuento';
  precioExtra: number;
  porcentaje?: number;
  aplicaA: 'todos' | 'familias' | 'productos';
  familiasIds?: string[];
  productosIds?: string[];
  color?: string;
  icono?: string;
  orden: number;
  mostrarEnTPV: boolean;
  esMultiple: boolean;
  cantidadMaxima?: number;
  obligatorio: boolean;
  activo: boolean;
  grupoId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrupoModificadores {
  _id: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipo: 'exclusivo' | 'multiple';
  minSelecciones: number;
  maxSelecciones?: number;
  modificadores?: ModificadorProducto[];
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModificadorDTO {
  codigo?: string;
  nombre: string;
  nombreCorto?: string;
  descripcion?: string;
  tipo?: 'gratis' | 'cargo' | 'descuento';
  precioExtra?: number;
  porcentaje?: number;
  aplicaA?: 'todos' | 'familias' | 'productos';
  familiasIds?: string[];
  productosIds?: string[];
  color?: string;
  icono?: string;
  orden?: number;
  mostrarEnTPV?: boolean;
  esMultiple?: boolean;
  cantidadMaxima?: number;
  obligatorio?: boolean;
  activo?: boolean;
  grupoId?: string;
}

export interface CreateGrupoModificadoresDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipo?: 'exclusivo' | 'multiple';
  minSelecciones?: number;
  maxSelecciones?: number;
  orden?: number;
  activo?: boolean;
}

export interface ModificadoresResponse {
  success: boolean;
  data: ModificadorProducto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GruposModificadoresResponse {
  success: boolean;
  data: GrupoModificadores[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const modificadoresService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    tipo?: string;
    grupoId?: string;
    activo?: boolean;
  }): Promise<ModificadoresResponse> {
    const response = await api.get('/modificadores', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: ModificadorProducto }> {
    const response = await api.get(`/modificadores/${id}`);
    return response.data;
  },

  async create(data: CreateModificadorDTO): Promise<{ success: boolean; data: ModificadorProducto }> {
    const response = await api.post('/modificadores', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateModificadorDTO>): Promise<{ success: boolean; data: ModificadorProducto }> {
    const response = await api.put(`/modificadores/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/modificadores/${id}`);
    return response.data;
  },

  async searchCodigos(prefix: string): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/modificadores/search-codigos', { params: { prefix } });
    return response.data;
  },
};

export const gruposModificadoresService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    tipo?: string;
    activo?: boolean;
    includeModificadores?: boolean;
  }): Promise<GruposModificadoresResponse> {
    const response = await api.get('/grupos-modificadores', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: GrupoModificadores }> {
    const response = await api.get(`/grupos-modificadores/${id}`);
    return response.data;
  },

  async create(data: CreateGrupoModificadoresDTO): Promise<{ success: boolean; data: GrupoModificadores }> {
    const response = await api.post('/grupos-modificadores', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateGrupoModificadoresDTO>): Promise<{ success: boolean; data: GrupoModificadores }> {
    const response = await api.put(`/grupos-modificadores/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/grupos-modificadores/${id}`);
    return response.data;
  },

  async addModificador(grupoId: string, modificadorId: string): Promise<{ success: boolean; data: GrupoModificadores }> {
    const response = await api.post(`/grupos-modificadores/${grupoId}/modificadores/${modificadorId}`);
    return response.data;
  },

  async removeModificador(grupoId: string, modificadorId: string): Promise<{ success: boolean; data: GrupoModificadores }> {
    const response = await api.delete(`/grupos-modificadores/${grupoId}/modificadores/${modificadorId}`);
    return response.data;
  },

  async searchCodigos(prefix: string): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/grupos-modificadores/search-codigos', { params: { prefix } });
    return response.data;
  },
};
