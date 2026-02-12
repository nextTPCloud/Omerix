import { api } from './api';

export interface TurnoServicio {
  _id: string;
  nombre: string;
  codigo: string;
  horaInicio: string;
  horaFin: string;
  diasSemana: string[];
  salonesIds: string[] | { _id: string; nombre: string; color?: string }[];
  maxCamareros?: number;
  activo: boolean;
  color?: string;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTurnoServicioDTO {
  nombre: string;
  codigo: string;
  horaInicio: string;
  horaFin: string;
  diasSemana: string[];
  salonesIds?: string[];
  maxCamareros?: number;
  color?: string;
  descripcion?: string;
}

export interface UpdateTurnoServicioDTO {
  nombre?: string;
  codigo?: string;
  horaInicio?: string;
  horaFin?: string;
  diasSemana?: string[];
  salonesIds?: string[];
  maxCamareros?: number;
  activo?: boolean;
  color?: string;
  descripcion?: string;
}

export const turnosServicioService = {
  async getAll(params?: {
    activo?: boolean;
    busqueda?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/turnos-servicio', { params });
    return response.data;
  },

  async getActivos() {
    const response = await api.get('/turnos-servicio/activos');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/turnos-servicio/${id}`);
    return response.data;
  },

  async create(data: CreateTurnoServicioDTO) {
    const response = await api.post('/turnos-servicio', data);
    return response.data;
  },

  async update(id: string, data: UpdateTurnoServicioDTO) {
    const response = await api.put(`/turnos-servicio/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/turnos-servicio/${id}`);
    return response.data;
  },

  getDiaLabel(dia: string): string {
    const labels: Record<string, string> = {
      lunes: 'Lun',
      martes: 'Mar',
      miercoles: 'Mie',
      jueves: 'Jue',
      viernes: 'Vie',
      sabado: 'Sab',
      domingo: 'Dom',
    };
    return labels[dia] || dia;
  },
};
