import { api } from './api';
import {
  Departamento,
  DepartamentoResponse,
  DepartamentosListResponse,
  CreateDepartamentoDTO,
  UpdateDepartamentoDTO,
} from '@/types/departamento.types';

const BASE_URL = '/departamentos';

export interface SearchDepartamentosParams {
  search?: string;
  activo?: 'true' | 'false' | 'all';
  responsableId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class DepartamentosService {
  /**
   * Obtener lista de departamentos con filtros
   */
  async getAll(params?: SearchDepartamentosParams): Promise<DepartamentosListResponse> {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener un departamento por ID
   */
  async getById(id: string): Promise<DepartamentoResponse> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo departamento
   */
  async create(data: CreateDepartamentoDTO): Promise<DepartamentoResponse> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  }

  /**
   * Actualizar un departamento
   */
  async update(id: string, data: UpdateDepartamentoDTO): Promise<DepartamentoResponse> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un departamento (soft delete)
   */
  async delete(id: string): Promise<DepartamentoResponse> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Obtener departamentos activos (para selects)
   */
  async getActivos(): Promise<{ success: boolean; data: Departamento[] }> {
    const response = await api.get(`${BASE_URL}/activos`);
    return response.data;
  }

  /**
   * Sugerir siguiente código
   */
  async sugerirCodigo(): Promise<{ success: boolean; data: { codigo: string } }> {
    const response = await api.get(`${BASE_URL}/sugerir-codigo`);
    return response.data;
  }

  /**
   * Buscar códigos existentes (para autocompletado)
   */
  async searchCodigos(prefix: string): Promise<string[]> {
    try {
      const response = await api.get<{ success: boolean; data: string[] }>(
        `${BASE_URL}/codigos`,
        { params: { prefix } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al buscar codigos:', error);
      return [];
    }
  }
}

export const departamentosService = new DepartamentosService();
