import { api } from './api';
import {
  ITarifa,
  CreateTarifaDto,
  UpdateTarifaDto,
  AddPrecioTarifaDto,
  GetTarifasQuery,
  TarifasResponse,
  TarifaResponse,
  TarifasActivasResponse,
} from '@/types/tarifa.types';

const BASE_URL = '/tarifas';

export const tarifasService = {
  /**
   * Obtener todas las tarifas con paginacion y filtros
   */
  getAll: async (query?: GetTarifasQuery): Promise<TarifasResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;
    const response = await api.get<TarifasResponse>(url);
    return response.data;
  },

  /**
   * Obtener tarifas activas (para selectores)
   */
  getActivas: async (): Promise<TarifasActivasResponse> => {
    const response = await api.get<TarifasActivasResponse>(`${BASE_URL}/activas`);
    return response.data;
  },

  /**
   * Obtener tarifa por ID
   */
  getById: async (id: string): Promise<TarifaResponse> => {
    const response = await api.get<TarifaResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Crear nueva tarifa
   */
  create: async (data: CreateTarifaDto): Promise<TarifaResponse> => {
    const response = await api.post<TarifaResponse>(BASE_URL, data);
    return response.data;
  },

  /**
   * Actualizar tarifa
   */
  update: async (id: string, data: UpdateTarifaDto): Promise<TarifaResponse> => {
    const response = await api.put<TarifaResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar tarifa
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Eliminar multiples tarifas
   */
  bulkDelete: async (ids: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    const response = await api.post(`${BASE_URL}/bulk-delete`, { ids });
    return response.data;
  },

  /**
   * Cambiar estado activo
   */
  changeStatus: async (id: string, activo: boolean): Promise<TarifaResponse> => {
    const response = await api.patch<TarifaResponse>(`${BASE_URL}/${id}/status`, { activo });
    return response.data;
  },

  /**
   * Agregar o actualizar precio de producto
   */
  addOrUpdatePrecio: async (id: string, data: AddPrecioTarifaDto): Promise<TarifaResponse> => {
    const response = await api.post<TarifaResponse>(`${BASE_URL}/${id}/precios`, data);
    return response.data;
  },

  /**
   * Eliminar precio de producto
   */
  deletePrecio: async (id: string, productoId: string, varianteId?: string): Promise<TarifaResponse> => {
    const url = varianteId
      ? `${BASE_URL}/${id}/precios/${productoId}?varianteId=${varianteId}`
      : `${BASE_URL}/${id}/precios/${productoId}`;
    const response = await api.delete(url);
    return response.data;
  },

  /**
   * Duplicar tarifa
   */
  duplicar: async (id: string, nombre?: string): Promise<TarifaResponse> => {
    const response = await api.post<TarifaResponse>(`${BASE_URL}/${id}/duplicar`, { nombre });
    return response.data;
  },

  /**
   * Buscar codigos existentes que empiezan con un prefijo
   * Usado para auto-sugerir el siguiente codigo disponible
   */
  searchCodes: async (prefix: string): Promise<string[]> => {
    try {
      const response = await api.get<TarifasResponse>(`${BASE_URL}?search=${prefix}&limit=100`);
      return (response.data?.data || []).map((t: ITarifa) => t.codigo || '').filter(Boolean);
    } catch {
      return [];
    }
  },
};

export default tarifasService;
