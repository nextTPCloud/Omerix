import { api } from './api';
import {
  Familia,
  CreateFamiliaDTO,
  UpdateFamiliaDTO,
  FamiliasResponse,
  FamiliaResponse,
  FamiliaArbolResponse,
  FamiliaEstadisticasResponse,
} from '@/types/familia.types';

export const familiasService = {
  // Obtener todas las familias con paginación y filtros
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    activo?: boolean;
  }): Promise<FamiliasResponse> {
    const response = await api.get('/familias', { params });
    return response.data;
  },

  // Obtener árbol jerárquico de familias
  async getArbol(): Promise<FamiliaArbolResponse> {
    const response = await api.get('/familias/arbol');
    return response.data;
  },

  // Obtener familia por ID
  async getById(id: string): Promise<FamiliaResponse> {
    const response = await api.get(`/familias/${id}`);
    return response.data;
  },

  // Obtener estadísticas de una familia
  async getEstadisticas(id: string): Promise<FamiliaEstadisticasResponse> {
    const response = await api.get(`/familias/${id}/estadisticas`);
    return response.data;
  },

  // Crear familia
  async create(data: CreateFamiliaDTO): Promise<FamiliaResponse> {
    const response = await api.post('/familias', data);
    return response.data;
  },

  // Actualizar familia
  async update(id: string, data: UpdateFamiliaDTO): Promise<FamiliaResponse> {
    const response = await api.put(`/familias/${id}`, data);
    return response.data;
  },

  // Eliminar familia
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/familias/${id}`);
    return response.data;
  },

  // Reordenar familias
  async reordenar(items: Array<{ id: string; orden: number }>): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/familias/reordenar', { items });
    return response.data;
  },

  // Sugerir siguiente código disponible
  async sugerirSiguienteCodigo(prefijo?: string): Promise<{ success: boolean; data: { codigo: string } }> {
    const params = prefijo ? { prefijo } : {};
    const response = await api.get('/familias/sugerir-codigo', { params });
    return response.data;
  },

  // Duplicar familia
  async duplicar(id: string): Promise<FamiliaResponse> {
    const response = await api.post(`/familias/${id}/duplicar`);
    return response.data;
  },
};
