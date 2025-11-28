// Servicio para gestión de Estados

import { api } from './api';
import {
  Estado,
  CreateEstadoDTO,
  UpdateEstadoDTO,
  EstadosResponse,
  EstadoResponse,
} from '@/types/estado.types';

export interface SearchEstadosParams {
  q?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class EstadosService {
  private baseUrl = '/estados';

  /**
   * Obtener todos los estados con filtros opcionales
   */
  async getAll(params?: SearchEstadosParams): Promise<EstadosResponse> {
    const response = await api.get<EstadosResponse>(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Obtener un estado por ID
   */
  async getById(id: string): Promise<EstadoResponse> {
    const response = await api.get<EstadoResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo estado
   */
  async create(data: CreateEstadoDTO): Promise<EstadoResponse> {
    const response = await api.post<EstadoResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar un estado existente
   */
  async update(id: string, data: UpdateEstadoDTO): Promise<EstadoResponse> {
    const response = await api.put<EstadoResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un estado
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Eliminar múltiples estados
   */
  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`${this.baseUrl}/bulk-delete`, { ids });
    return response.data;
  }
}

export const estadosService = new EstadosService();
