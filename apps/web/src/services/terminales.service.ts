import { api } from './api'
import {
  Terminal,
  TerminalFilters,
  TerminalListResponse,
  TerminalDetailResponse,
  CreateTerminalDTO,
  UpdateTerminalDTO,
  SincronizarEmpleadosDTO,
  SincronizarAsistenciaDTO,
  ProbarConexionResponse,
  SincronizarResponse,
  EmpleadoSincronizado,
  HistorialSync,
} from '@/types/terminal.types';

const BASE_URL = '/terminales';

export const terminalesService = {
  /**
   * Obtener lista de terminales con filtros
   */
  async getAll(filters: TerminalFilters = {}): Promise<TerminalListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.marca) params.append('marca', filters.marca);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener terminales activos
   */
  async getActivos(): Promise<{ success: boolean; data: Terminal[] }> {
    const response = await api.get(`${BASE_URL}/activos`);
    return response.data;
  },

  /**
   * Obtener terminal por ID
   */
  async getById(id: string): Promise<TerminalDetailResponse> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Sugerir código para nuevo terminal
   */
  async sugerirCodigo(prefijo: string = 'TRM'): Promise<{ success: boolean; data: { codigo: string } }> {
    const response = await api.get(`${BASE_URL}/sugerir-codigo?prefijo=${prefijo}`);
    return response.data;
  },

  /**
   * Buscar códigos existentes por prefijo (para CodeInput)
   */
  async searchCodigos(prefijo: string): Promise<string[]> {
    try {
      const response = await api.get(`${BASE_URL}?search=${prefijo}&limit=100`);
      if (response.data.success && response.data.data) {
        return response.data.data.map((t: Terminal) => t.codigo);
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Crear nuevo terminal
   */
  async create(data: CreateTerminalDTO): Promise<TerminalDetailResponse> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  /**
   * Actualizar terminal
   */
  async update(id: string, data: UpdateTerminalDTO): Promise<TerminalDetailResponse> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Desactivar terminal
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Eliminar terminal permanentemente
   */
  async deletePermanente(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${BASE_URL}/${id}/permanente`);
    return response.data;
  },

  /**
   * Probar conexión con el terminal
   */
  async probarConexion(id: string): Promise<ProbarConexionResponse> {
    const response = await api.post(`${BASE_URL}/${id}/probar-conexion`);
    return response.data;
  },

  /**
   * Sincronizar empleados al terminal
   */
  async sincronizarEmpleados(id: string, data: SincronizarEmpleadosDTO = {}): Promise<SincronizarResponse> {
    const response = await api.post(`${BASE_URL}/${id}/sincronizar-empleados`, data);
    return response.data;
  },

  /**
   * Sincronizar fichajes desde el terminal
   */
  async sincronizarAsistencia(id: string, data: SincronizarAsistenciaDTO = {}): Promise<SincronizarResponse> {
    const response = await api.post(`${BASE_URL}/${id}/sincronizar`, data);
    return response.data;
  },

  /**
   * Obtener historial de sincronizaciones
   */
  async getHistorial(id: string, limite: number = 50): Promise<{ success: boolean; data: HistorialSync[] }> {
    const response = await api.get(`${BASE_URL}/${id}/historial?limite=${limite}`);
    return response.data;
  },

  /**
   * Obtener empleados sincronizados en el terminal
   */
  async getEmpleados(id: string): Promise<{ success: boolean; data: EmpleadoSincronizado[] }> {
    const response = await api.get(`${BASE_URL}/${id}/empleados`);
    return response.data;
  },
};

export default terminalesService;
