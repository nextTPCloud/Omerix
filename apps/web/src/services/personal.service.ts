import { api } from './api';
import {
  Personal,
  PersonalFilters,
  PersonalListResponse,
  PersonalDetailResponse,
  EstadisticasPersonal,
  CreatePersonalDTO,
  UpdatePersonalDTO,
  Ausencia,
  Vacaciones,
  Evaluacion
} from '@/types/personal.types';

const BASE_URL = '/personal';

export const personalService = {
  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(filters?: PersonalFilters): Promise<PersonalListResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.tipoContrato) params.append('tipoContrato', filters.tipoContrato);
    if (filters?.departamentoId) params.append('departamentoId', filters.departamentoId);
    if (filters?.responsableId) params.append('responsableId', filters.responsableId);
    if (filters?.puesto) params.append('puesto', filters.puesto);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.tags) params.append('tags', filters.tags.join(','));

    const response = await api.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<PersonalDetailResponse> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(data: CreatePersonalDTO): Promise<PersonalDetailResponse> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdatePersonalDTO): Promise<PersonalDetailResponse> {
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

  async changeStatus(id: string, activo: boolean): Promise<PersonalDetailResponse> {
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

  async getEstadisticas(): Promise<{ success: boolean; data: EstadisticasPersonal }> {
    const response = await api.get(`${BASE_URL}/estadisticas`);
    return response.data;
  },

  async duplicar(id: string): Promise<PersonalDetailResponse> {
    const response = await api.post(`${BASE_URL}/${id}/duplicar`);
    return response.data;
  },

  // ============================================
  // SUBORDINADOS
  // ============================================

  async getSubordinados(id: string): Promise<{ success: boolean; data: Personal[] }> {
    const response = await api.get(`${BASE_URL}/${id}/subordinados`);
    return response.data;
  },

  // ============================================
  // AUSENCIAS Y VACACIONES
  // ============================================

  async registrarAusencia(id: string, ausencia: Omit<Ausencia, '_id'>): Promise<PersonalDetailResponse> {
    const response = await api.post(`${BASE_URL}/${id}/ausencias`, ausencia);
    return response.data;
  },

  async actualizarAusencia(id: string, ausenciaId: string, ausencia: Omit<Ausencia, '_id'>): Promise<PersonalDetailResponse> {
    const response = await api.put(`${BASE_URL}/${id}/ausencias/${ausenciaId}`, ausencia);
    return response.data;
  },

  async eliminarAusencia(id: string, ausenciaId: string): Promise<PersonalDetailResponse> {
    const response = await api.delete(`${BASE_URL}/${id}/ausencias/${ausenciaId}`);
    return response.data;
  },

  async actualizarVacaciones(id: string, vacaciones: { anio: number; diasTotales: number; diasDisfrutados?: number }): Promise<PersonalDetailResponse> {
    const response = await api.put(`${BASE_URL}/${id}/vacaciones`, vacaciones);
    return response.data;
  },

  async eliminarVacaciones(id: string, anio: number): Promise<PersonalDetailResponse> {
    const response = await api.delete(`${BASE_URL}/${id}/vacaciones/${anio}`);
    return response.data;
  },

  async getCalendarioAusencias(mes?: number, anio?: number): Promise<{ success: boolean; data: any[] }> {
    const params = new URLSearchParams();
    if (mes) params.append('mes', String(mes));
    if (anio) params.append('anio', String(anio));
    const response = await api.get(`${BASE_URL}/calendario-ausencias?${params.toString()}`);
    return response.data;
  },

  // ============================================
  // EVALUACIONES
  // ============================================

  async registrarEvaluacion(id: string, evaluacion: Omit<Evaluacion, '_id'>): Promise<PersonalDetailResponse> {
    const response = await api.post(`${BASE_URL}/${id}/evaluaciones`, evaluacion);
    return response.data;
  },

  // ============================================
  // EXPORTACIÓN
  // ============================================

  async exportToCSV(filters?: PersonalFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.tipoContrato) params.append('tipoContrato', filters.tipoContrato);

    const response = await api.get(`${BASE_URL}/exportar/csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // ============================================
  // ARCHIVOS
  // ============================================

  async subirFoto(id: string, file: File): Promise<PersonalDetailResponse> {
    const formData = new FormData();
    formData.append('foto', file);
    const response = await api.post(`${BASE_URL}/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async subirDocumento(id: string, file: File, opts?: { tipo?: string; nombre?: string; confidencial?: boolean }): Promise<PersonalDetailResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (opts?.tipo) formData.append('tipo', opts.tipo);
    if (opts?.nombre) formData.append('nombre', opts.nombre);
    if (opts?.confidencial) formData.append('confidencial', 'true');
    const response = await api.post(`${BASE_URL}/${id}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async eliminarDocumento(id: string, docId: string): Promise<PersonalDetailResponse> {
    const response = await api.delete(`${BASE_URL}/${id}/documentos/${docId}`);
    return response.data;
  },

  // ============================================
  // HELPERS
  // ============================================

  async search(query: string): Promise<{ success: boolean; data: Personal[] }> {
    const response = await api.get(`${BASE_URL}?search=${encodeURIComponent(query)}&limit=10`);
    return {
      success: response.data.success,
      data: response.data.data
    };
  }
};

export default personalService;
