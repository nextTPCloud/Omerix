import { api } from './api';
import {
  CalendarioLaboral,
  CalendarioResponse,
  CalendariosListResponse,
  CreateCalendarioDTO,
  UpdateCalendarioDTO,
  CreateFestivoDTO,
  Festivo,
} from '@/types/calendario.types';

const BASE_URL = '/calendarios';

export interface SearchCalendariosParams {
  search?: string;
  anio?: number;
  region?: string;
  activo?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class CalendariosService {
  /**
   * Obtener lista de calendarios con filtros
   */
  async getAll(params?: SearchCalendariosParams): Promise<CalendariosListResponse> {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener un calendario por ID
   */
  async getById(id: string): Promise<CalendarioResponse> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo calendario
   */
  async create(data: CreateCalendarioDTO): Promise<CalendarioResponse> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  }

  /**
   * Actualizar un calendario
   */
  async update(id: string, data: UpdateCalendarioDTO): Promise<CalendarioResponse> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un calendario (soft delete)
   */
  async delete(id: string): Promise<CalendarioResponse> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Obtener calendarios activos (para selects)
   */
  async getActivos(): Promise<{ success: boolean; data: CalendarioLaboral[] }> {
    const response = await api.get(`${BASE_URL}/activos`);
    return response.data;
  }

  /**
   * Obtener calendario por defecto del año
   */
  async getDefecto(anio?: number): Promise<CalendarioResponse> {
    const params = anio ? { anio } : {};
    const response = await api.get(`${BASE_URL}/defecto`, { params });
    return response.data;
  }

  /**
   * Establecer calendario como defecto
   */
  async setDefecto(id: string): Promise<CalendarioResponse> {
    const response = await api.put(`${BASE_URL}/${id}/defecto`);
    return response.data;
  }

  /**
   * Añadir festivo a un calendario
   */
  async addFestivo(id: string, festivo: CreateFestivoDTO): Promise<CalendarioResponse> {
    const response = await api.post(`${BASE_URL}/${id}/festivos`, festivo);
    return response.data;
  }

  /**
   * Actualizar festivo de un calendario
   */
  async updateFestivo(
    calendarioId: string,
    festivoId: string,
    festivo: Partial<CreateFestivoDTO>
  ): Promise<CalendarioResponse> {
    const response = await api.put(`${BASE_URL}/${calendarioId}/festivos/${festivoId}`, festivo);
    return response.data;
  }

  /**
   * Eliminar festivo de un calendario
   */
  async deleteFestivo(calendarioId: string, festivoId: string): Promise<CalendarioResponse> {
    const response = await api.delete(`${BASE_URL}/${calendarioId}/festivos/${festivoId}`);
    return response.data;
  }

  /**
   * Copiar calendario de un año a otro
   */
  async copiarCalendario(
    id: string,
    nuevoAnio: number
  ): Promise<CalendarioResponse> {
    const response = await api.post(`${BASE_URL}/${id}/copiar`, { nuevoAnio });
    return response.data;
  }

  /**
   * Cargar festivos nacionales
   */
  async cargarFestivosNacionales(id: string): Promise<CalendarioResponse> {
    const response = await api.post(`${BASE_URL}/${id}/cargar-nacionales`);
    return response.data;
  }

  /**
   * Verificar si una fecha es festivo
   */
  async esFestivo(
    fecha: string,
    calendarioId?: string
  ): Promise<{ success: boolean; data: { esFestivo: boolean; festivo?: Festivo } }> {
    const params = calendarioId ? { calendarioId } : {};
    const response = await api.get(`${BASE_URL}/es-festivo/${fecha}`, { params });
    return response.data;
  }
}

export const calendariosService = new CalendariosService();
