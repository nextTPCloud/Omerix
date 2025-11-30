import { api } from './api';
import {
  AgenteComercial,
  AgentesFilters,
  AgentesListResponse,
  AgenteDetailResponse,
  EstadisticasAgentes,
  CreateAgenteDTO,
  UpdateAgenteDTO
} from '@/types/agente-comercial.types';

const BASE_URL = '/agentes-comerciales';

export const agentesService = {
  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(filters?: AgentesFilters): Promise<AgentesListResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.zona) params.append('zona', filters.zona);
    if (filters?.supervisorId) params.append('supervisorId', filters.supervisorId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.tags) params.append('tags', filters.tags.join(','));

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<AgenteDetailResponse> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(data: CreateAgenteDTO): Promise<AgenteDetailResponse> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateAgenteDTO): Promise<AgenteDetailResponse> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  async deleteMany(ids: string[]): Promise<{ success: boolean; message: string; count: number }> {
    const response = await api.post(`${BASE_URL}/bulk-delete`, { ids });
    return response.data;
  },

  // ============================================
  // ESTADO
  // ============================================

  async changeStatus(id: string, activo: boolean): Promise<AgenteDetailResponse> {
    const response = await api.patch(`${BASE_URL}/${id}/estado`, { activo });
    return response.data;
  },

  // ============================================
  // UTILIDADES
  // ============================================

  async sugerirCodigo(prefijo?: string): Promise<{ success: boolean; data: { codigo: string } }> {
    const params = prefijo ? `?prefijo=${prefijo}` : '';
    const response = await api.get(`${BASE_URL}/sugerir-codigo${params}`);
    return response.data;
  },

  async getEstadisticas(): Promise<{ success: boolean; data: EstadisticasAgentes }> {
    const response = await api.get(`${BASE_URL}/estadisticas`);
    return response.data;
  },

  async duplicar(id: string): Promise<AgenteDetailResponse> {
    const response = await api.post(`${BASE_URL}/${id}/duplicar`);
    return response.data;
  },

  // ============================================
  // ASIGNACIONES
  // ============================================

  async asignarClientes(id: string, clienteIds: string[]): Promise<AgenteDetailResponse> {
    const response = await api.post(`${BASE_URL}/${id}/clientes`, { clienteIds });
    return response.data;
  },

  async registrarVenta(id: string, importe: number, comision?: number): Promise<AgenteDetailResponse> {
    const response = await api.post(`${BASE_URL}/${id}/venta`, { importe, comision });
    return response.data;
  },

  // ============================================
  // EXPORTACIÓN
  // ============================================

  async exportToCSV(filters?: AgentesFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.estado) params.append('estado', filters.estado);

    const response = await api.get(`${BASE_URL}/exportar/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ============================================
  // HELPERS
  // ============================================

  async search(query: string): Promise<{ success: boolean; data: AgenteComercial[] }> {
    const response = await api.get(`${BASE_URL}?search=${encodeURIComponent(query)}&limit=10`);
    return {
      success: response.data.success,
      data: response.data.data
    };
  }
};

export default agentesService;
