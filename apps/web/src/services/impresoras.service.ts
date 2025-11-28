import { api } from './api';

export interface Impresora {
  _id: string;
  nombre: string;
  tipo: 'ticket' | 'cocina' | 'etiquetas' | 'fiscal';
  tipoConexion: 'usb' | 'red' | 'bluetooth' | 'serie';
  ip?: string;
  puerto?: number;
  mac?: string;
  puertoSerie?: string;
  baudRate?: number;
  modelo?: string;
  fabricante?: string;
  anchoPapel: 58 | 80;
  cortarPapel: boolean;
  abrirCajon: boolean;
  imprimirLogo: boolean;
  copias: number;
  zonaPreparacionId?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImpresoraDTO {
  nombre: string;
  tipo: 'ticket' | 'cocina' | 'etiquetas' | 'fiscal';
  tipoConexion: 'usb' | 'red' | 'bluetooth' | 'serie';
  ip?: string;
  puerto?: number;
  mac?: string;
  puertoSerie?: string;
  baudRate?: number;
  modelo?: string;
  fabricante?: string;
  anchoPapel?: 58 | 80;
  cortarPapel?: boolean;
  abrirCajon?: boolean;
  imprimirLogo?: boolean;
  copias?: number;
  zonaPreparacionId?: string;
  activo?: boolean;
}

export interface UpdateImpresoraDTO extends Partial<CreateImpresoraDTO> {}

export interface ImpresorasResponse {
  success: boolean;
  data: Impresora[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const impresorasService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    tipo?: string;
    activo?: boolean;
  }): Promise<ImpresorasResponse> {
    const response = await api.get('/impresoras', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Impresora }> {
    const response = await api.get(`/impresoras/${id}`);
    return response.data;
  },

  async create(data: CreateImpresoraDTO): Promise<{ success: boolean; data: Impresora }> {
    const response = await api.post('/impresoras', data);
    return response.data;
  },

  async update(id: string, data: UpdateImpresoraDTO): Promise<{ success: boolean; data: Impresora }> {
    const response = await api.put(`/impresoras/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/impresoras/${id}`);
    return response.data;
  },

  async test(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/impresoras/${id}/test`);
    return response.data;
  },

  async searchCodigos(prefix: string): Promise<{ success: boolean; data: string[] }> {
    const response = await api.get('/impresoras/search-codigos', { params: { prefix } });
    return response.data;
  },
};
