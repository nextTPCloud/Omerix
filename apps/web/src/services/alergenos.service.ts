import { api } from './api';

export interface Alergeno {
  _id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  icono?: string;
  color: string;
  esObligatorioUE: boolean;
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlergenoDTO {
  nombre: string;
  codigo: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  esObligatorioUE?: boolean;
  orden?: number;
  activo?: boolean;
}

export interface UpdateAlergenoDTO extends Partial<CreateAlergenoDTO> {}

export interface AlergenosResponse {
  success: boolean;
  data: Alergeno[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Lista de los 14 alérgenos obligatorios de la UE
export const ALERGENOS_UE = [
  { codigo: 'GLUTEN', nombre: 'Gluten', color: '#F59E0B' },
  { codigo: 'CRUSTACEOS', nombre: 'Crustáceos', color: '#EF4444' },
  { codigo: 'HUEVOS', nombre: 'Huevos', color: '#FCD34D' },
  { codigo: 'PESCADO', nombre: 'Pescado', color: '#3B82F6' },
  { codigo: 'CACAHUETES', nombre: 'Cacahuetes', color: '#92400E' },
  { codigo: 'SOJA', nombre: 'Soja', color: '#84CC16' },
  { codigo: 'LACTEOS', nombre: 'Lácteos', color: '#F9FAFB' },
  { codigo: 'FRUTOS_CASCARA', nombre: 'Frutos de cáscara', color: '#A16207' },
  { codigo: 'APIO', nombre: 'Apio', color: '#22C55E' },
  { codigo: 'MOSTAZA', nombre: 'Mostaza', color: '#EAB308' },
  { codigo: 'SESAMO', nombre: 'Sésamo', color: '#D4A574' },
  { codigo: 'SULFITOS', nombre: 'Sulfitos', color: '#8B5CF6' },
  { codigo: 'ALTRAMUCES', nombre: 'Altramuces', color: '#F472B6' },
  { codigo: 'MOLUSCOS', nombre: 'Moluscos', color: '#64748B' },
];

export const alergenosService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    esObligatorioUE?: boolean;
    activo?: boolean;
  }): Promise<AlergenosResponse> {
    const response = await api.get('/alergenos', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Alergeno }> {
    const response = await api.get(`/alergenos/${id}`);
    return response.data;
  },

  async create(data: CreateAlergenoDTO): Promise<{ success: boolean; data: Alergeno }> {
    const response = await api.post('/alergenos', data);
    return response.data;
  },

  async update(id: string, data: UpdateAlergenoDTO): Promise<{ success: boolean; data: Alergeno }> {
    const response = await api.put(`/alergenos/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/alergenos/${id}`);
    return response.data;
  },

  // Inicializar los 14 alérgenos obligatorios de la UE
  async initializeUE(): Promise<{ success: boolean; message: string; data?: { created: number; existing: number } }> {
    const response = await api.post('/alergenos/initialize-ue');
    return response.data;
  },

  async searchCodigos(prefix: string): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/alergenos/search-codigos', { params: { prefix } });
    return response.data;
  },
};
