import { api } from './api';
import {
  TipoImpuesto,
  CreateTipoImpuestoDTO,
  UpdateTipoImpuestoDTO,
  TiposImpuestoResponse,
  TipoImpuestoResponse,
} from '@/types/tipo-impuesto.types';

export interface SearchTiposImpuestoParams {
  q?: string;
  tipo?: 'IVA' | 'IGIC' | 'IPSI' | 'OTRO';
  activo?: boolean;
  predeterminado?: boolean;
  recargoEquivalencia?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class TiposImpuestoService {
  private baseUrl = '/tipos-impuesto';

  async getAll(params?: SearchTiposImpuestoParams): Promise<TiposImpuestoResponse> {
    const response = await api.get<TiposImpuestoResponse>(this.baseUrl, { params });
    return response.data;
  }

  async getById(id: string): Promise<TipoImpuestoResponse> {
    const response = await api.get<TipoImpuestoResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(data: CreateTipoImpuestoDTO): Promise<TipoImpuestoResponse> {
    const response = await api.post<TipoImpuestoResponse>(this.baseUrl, data);
    return response.data;
  }

  async update(id: string, data: UpdateTipoImpuestoDTO): Promise<TipoImpuestoResponse> {
    const response = await api.put<TipoImpuestoResponse>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async setPredeterminado(id: string): Promise<TipoImpuestoResponse> {
    const response = await api.post<TipoImpuestoResponse>(`${this.baseUrl}/${id}/predeterminado`);
    return response.data;
  }

  async searchCodigos(prefix: string): Promise<string[]> {
    const response = await api.get<{ success: boolean; data: string[] }>(
      `${this.baseUrl}/codigos`,
      { params: { prefix } }
    );
    return response.data.data;
  }
}

export const tiposImpuestoService = new TiposImpuestoService();
