// Servicio para gestión de Situaciones

import { api } from './api';
import {
  Situacion,
  CreateSituacionDTO,
  UpdateSituacionDTO,
  SituacionesResponse,
  SituacionResponse,
} from '@/types/situacion.types';

export interface SearchSituacionesParams {
  q?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class SituacionesService {
  private baseUrl = '/situaciones';

  /**
   * Obtener todas las situaciones con filtros opcionales
   */
  async getAll(params?: SearchSituacionesParams): Promise<SituacionesResponse> {
    const response = await api.get<SituacionesResponse>(this.baseUrl, { params });
    return response.data;
  }

  /**
   * Obtener una situación por ID
   */
  async getById(id: string): Promise<SituacionResponse> {
    const response = await api.get<SituacionResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear una nueva situación
   */
  async create(data: CreateSituacionDTO): Promise<SituacionResponse> {
    const response = await api.post<SituacionResponse>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar una situación existente
   */
  async update(id: string, data: UpdateSituacionDTO): Promise<SituacionResponse> {
    const response = await api.put<SituacionResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar una situación
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Eliminar múltiples situaciones
   */
  async bulkDelete(ids: string[]): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`${this.baseUrl}/bulk-delete`, { ids });
    return response.data;
  }

  /**
   * Duplicar una situación
   */
  async duplicar(id: string): Promise<SituacionResponse> {
    const response = await api.post<SituacionResponse>(`${this.baseUrl}/${id}/duplicar`);
    return response.data;
  }
}

export const situacionesService = new SituacionesService();
