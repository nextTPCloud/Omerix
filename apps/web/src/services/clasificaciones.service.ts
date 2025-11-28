// Servicio para gestión de Clasificaciones

import { api } from './api';
import {
  Clasificacion,
  CreateClasificacionDTO,
  UpdateClasificacionDTO,
  ClasificacionesResponse,
  ClasificacionResponse,
} from '@/types/clasificacion.types';

export interface SearchClasificacionesParams {
  q?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ClasificacionesService {
  private baseUrl = '/clasificaciones';

  /**
   * Obtener todas las clasificaciones con filtros opcionales
   */
  async getAll(params?: SearchClasificacionesParams): Promise<ClasificacionesResponse> {
    const response = await api.get<ClasificacionesResponse>(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Obtener una clasificación por ID
   */
  async getById(id: string): Promise<ClasificacionResponse> {
    const response = await api.get<ClasificacionResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear una nueva clasificación
   */
  async create(data: CreateClasificacionDTO): Promise<ClasificacionResponse> {
    const response = await api.post<ClasificacionResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar una clasificación existente
   */
  async update(id: string, data: UpdateClasificacionDTO): Promise<ClasificacionResponse> {
    const response = await api.put<ClasificacionResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar una clasificación
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Eliminar múltiples clasificaciones
   */
  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`${this.baseUrl}/bulk-delete`, { ids });
    return response.data;
  }
}

export const clasificacionesService = new ClasificacionesService();
