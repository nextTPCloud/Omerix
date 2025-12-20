import { api } from './api';
import {
  Turno,
  TurnoResponse,
  TurnosListResponse,
  CreateTurnoDTO,
  UpdateTurnoDTO,
  HorarioPersonal,
  HorarioPersonalResponse,
  HorariosPersonalListResponse,
  CreateHorarioPersonalDTO,
  UpdateHorarioPersonalDTO,
} from '@/types/turno.types';

const BASE_URL = '/turnos';

export interface SearchTurnosParams {
  search?: string;
  activo?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchHorariosParams {
  personalId?: string;
  turnoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  activo?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class TurnosService {
  // ============================================
  // TURNOS
  // ============================================

  /**
   * Obtener lista de turnos con filtros
   */
  async getAll(params?: SearchTurnosParams): Promise<TurnosListResponse> {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  }

  /**
   * Obtener un turno por ID
   */
  async getById(id: string): Promise<TurnoResponse> {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo turno
   */
  async create(data: CreateTurnoDTO): Promise<TurnoResponse> {
    const response = await api.post(BASE_URL, data);
    return response.data;
  }

  /**
   * Actualizar un turno
   */
  async update(id: string, data: UpdateTurnoDTO): Promise<TurnoResponse> {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un turno (soft delete)
   */
  async delete(id: string): Promise<TurnoResponse> {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Obtener turnos activos (para selects)
   */
  async getActivos(): Promise<{ success: boolean; data: Turno[] }> {
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

  /**
   * Crear turnos predefinidos
   */
  async crearPredefinidos(): Promise<{ success: boolean; data: Turno[]; message: string }> {
    const response = await api.post(`${BASE_URL}/crear-predefinidos`);
    return response.data;
  }

  // ============================================
  // HORARIOS DE PERSONAL
  // ============================================

  /**
   * Obtener horarios de personal
   */
  async getHorarios(params?: SearchHorariosParams): Promise<HorariosPersonalListResponse> {
    const response = await api.get(`${BASE_URL}/horarios`, { params });
    return response.data;
  }

  /**
   * Obtener horario por ID
   */
  async getHorarioById(id: string): Promise<HorarioPersonalResponse> {
    const response = await api.get(`${BASE_URL}/horarios/${id}`);
    return response.data;
  }

  /**
   * Obtener horario actual de un empleado
   */
  async getHorarioActual(personalId: string): Promise<HorarioPersonalResponse> {
    const response = await api.get(`${BASE_URL}/horarios/personal/${personalId}/actual`);
    return response.data;
  }

  /**
   * Obtener historial de horarios de un empleado
   */
  async getHistorialHorarios(personalId: string): Promise<HorariosPersonalListResponse> {
    const response = await api.get(`${BASE_URL}/horarios/personal/${personalId}/historial`);
    return response.data;
  }

  /**
   * Asignar horario a un empleado
   */
  async asignarHorario(data: CreateHorarioPersonalDTO): Promise<HorarioPersonalResponse> {
    const response = await api.post(`${BASE_URL}/horarios`, data);
    return response.data;
  }

  /**
   * Actualizar horario de un empleado
   */
  async updateHorario(id: string, data: UpdateHorarioPersonalDTO): Promise<HorarioPersonalResponse> {
    const response = await api.put(`${BASE_URL}/horarios/${id}`, data);
    return response.data;
  }

  /**
   * Finalizar horario de un empleado
   */
  async finalizarHorario(id: string, fechaFin: string): Promise<HorarioPersonalResponse> {
    const response = await api.put(`${BASE_URL}/horarios/${id}/finalizar`, { fechaFin });
    return response.data;
  }

  /**
   * Eliminar horario
   */
  async deleteHorario(id: string): Promise<HorarioPersonalResponse> {
    const response = await api.delete(`${BASE_URL}/horarios/${id}`);
    return response.data;
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Calcular horas teóricas entre dos horas
   */
  calcularHorasTeoricas(
    horaEntrada: string,
    horaSalida: string,
    pausaMinutos: number = 0
  ): number {
    const [horaE, minE] = horaEntrada.split(':').map(Number);
    const [horaS, minS] = horaSalida.split(':').map(Number);

    let minutosTotales = (horaS * 60 + minS) - (horaE * 60 + minE);
    if (minutosTotales < 0) minutosTotales += 24 * 60; // Turno nocturno

    return (minutosTotales - pausaMinutos) / 60;
  }

  /**
   * Formatear días de la semana
   */
  formatearDiasSemana(dias: number[]): string {
    const nombresCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias.map(d => nombresCortos[d]).join(', ');
  }
}

export const turnosService = new TurnosService();
