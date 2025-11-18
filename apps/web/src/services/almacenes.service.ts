import apiClient from './api.client';
import {
  Almacen,
  CreateAlmacenDTO,
  UpdateAlmacenDTO,
  AlmacenesResponse,
  AlmacenResponse,
} from '@/types/almacen.types';

interface SearchParams {
  q?: string;
  activo?: string;
  esPrincipal?: string;
  usarEnTPV?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class AlmacenesService {
  private readonly BASE_URL = '/almacenes';

  async getAll(params?: SearchParams): Promise<AlmacenesResponse> {
    const response = await apiClient.get<AlmacenesResponse>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<AlmacenResponse> {
    const response = await apiClient.get<AlmacenResponse>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: CreateAlmacenDTO): Promise<AlmacenResponse> {
    const response = await apiClient.post<AlmacenResponse>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: UpdateAlmacenDTO): Promise<AlmacenResponse> {
    const response = await apiClient.put<AlmacenResponse>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${this.BASE_URL}/${id}`
    );
    return response.data;
  }

  async setPrincipal(id: string): Promise<AlmacenResponse> {
    const response = await apiClient.post<AlmacenResponse>(
      `${this.BASE_URL}/${id}/principal`
    );
    return response.data;
  }

  async getPrincipal(): Promise<AlmacenResponse> {
    const response = await apiClient.get<AlmacenResponse>(`${this.BASE_URL}/principal`);
    return response.data;
  }

  async getActivos(): Promise<{ success: boolean; data: Almacen[] }> {
    const response = await apiClient.get<{ success: boolean; data: Almacen[] }>(
      `${this.BASE_URL}/activos`
    );
    return response.data;
  }
}

export const almacenesService = new AlmacenesService();
