import { api } from './api';
import {
  IOferta,
  CreateOfertaDto,
  UpdateOfertaDto,
  GetOfertasQuery,
  OfertasResponse,
  OfertaResponse,
  OfertasVigentesResponse,
} from '@/types/oferta.types';

const BASE_URL = '/ofertas';

export const ofertasService = {
  /**
   * Obtener todas las ofertas con paginacion y filtros
   */
  getAll: async (query?: GetOfertasQuery): Promise<OfertasResponse> => {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const url = params.toString() ? `${BASE_URL}?${params.toString()}` : BASE_URL;
    const response = await api.get<OfertasResponse>(url);
    return response.data;
  },

  /**
   * Obtener ofertas vigentes
   */
  getVigentes: async (): Promise<OfertasVigentesResponse> => {
    const response = await api.get<OfertasVigentesResponse>(`${BASE_URL}/vigentes`);
    return response.data;
  },

  /**
   * Obtener oferta por ID
   */
  getById: async (id: string): Promise<OfertaResponse> => {
    const response = await api.get<OfertaResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Crear nueva oferta
   */
  create: async (data: CreateOfertaDto): Promise<OfertaResponse> => {
    const response = await api.post<OfertaResponse>(BASE_URL, data);
    return response.data;
  },

  /**
   * Actualizar oferta
   */
  update: async (id: string, data: UpdateOfertaDto): Promise<OfertaResponse> => {
    const response = await api.put<OfertaResponse>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar oferta
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Eliminar multiples ofertas
   */
  bulkDelete: async (ids: string[]): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    const response = await api.post(`${BASE_URL}/bulk-delete`, { ids });
    return response.data;
  },

  /**
   * Cambiar estado activo
   */
  changeStatus: async (id: string, activo: boolean): Promise<OfertaResponse> => {
    const response = await api.patch<OfertaResponse>(`${BASE_URL}/${id}/status`, { activo });
    return response.data;
  },

  /**
   * Duplicar oferta
   */
  duplicar: async (id: string, nombre?: string): Promise<OfertaResponse> => {
    const response = await api.post<OfertaResponse>(`${BASE_URL}/${id}/duplicar`, { nombre });
    return response.data;
  },

  /**
   * Buscar codigos existentes que empiezan con un prefijo
   * Usado para auto-sugerir el siguiente codigo disponible
   */
  searchCodes: async (prefix: string): Promise<string[]> => {
    try {
      const response = await api.get<OfertasResponse>(`${BASE_URL}?search=${prefix}&limit=100`);
      return (response.data?.data || []).map((o: IOferta) => o.codigo || '').filter(Boolean);
    } catch {
      return [];
    }
  },
};

export default ofertasService;
