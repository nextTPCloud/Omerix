import { api } from './api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface IRestooConnection {
  _id: string;
  nombre: string;
  apiUrl: string;
  apiKey: string;
  apiSecret?: string;
  restauranteIdRestoo: string;
  activa: boolean;
  ultimaSync?: string;
  configuracion: {
    syncAutomatico: boolean;
    intervaloMinutos: number;
    syncReservas: boolean;
    syncDisponibilidad: boolean;
    syncCancelaciones: boolean;
    syncNoShows: boolean;
    crearClientesSiNoExisten: boolean;
    salonPorDefecto?: string;
  };
  estadisticas: {
    reservasSincronizadas: number;
    ultimoError?: string;
    ultimoErrorFecha?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IRestooSyncLog {
  _id: string;
  conexionId: string;
  tipo: string;
  direccion: string;
  estado: 'exito' | 'error' | 'parcial';
  fechaInicio: string;
  fechaFin?: string;
  resultados: {
    total: number;
    exitosos: number;
    fallidos: number;
    omitidos: number;
  };
  detalles: Array<{
    reservaId?: string;
    accion: string;
    resultado: string;
    mensaje?: string;
  }>;
}

export interface IRestooZone {
  id: string;
  name: string;
  capacity?: number;
  tables?: Array<{
    id: string;
    name: string;
    seats: number;
  }>;
}

export interface IRestooMapeoSalon {
  _id?: string;
  conexionId: string;
  salonIdLocal: string;
  zonaIdRestoo: string;
  nombreRestoo: string;
  mesasMapeo: Array<{
    mesaIdLocal: string;
    mesaIdRestoo: string;
  }>;
}

export const restooService = {
  // CRUD conexiones
  async getConexiones(): Promise<ApiResponse<IRestooConnection[]>> {
    const response = await api.get<ApiResponse<IRestooConnection[]>>('/integraciones/restoo');
    return response.data;
  },

  async getConexion(id: string): Promise<ApiResponse<IRestooConnection>> {
    const response = await api.get<ApiResponse<IRestooConnection>>(`/integraciones/restoo/${id}`);
    return response.data;
  },

  async crearConexion(data: Partial<IRestooConnection>): Promise<ApiResponse<IRestooConnection>> {
    const response = await api.post<ApiResponse<IRestooConnection>>('/integraciones/restoo', data);
    return response.data;
  },

  async actualizarConexion(id: string, data: Partial<IRestooConnection>): Promise<ApiResponse<IRestooConnection>> {
    const response = await api.put<ApiResponse<IRestooConnection>>(`/integraciones/restoo/${id}`, data);
    return response.data;
  },

  async eliminarConexion(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/integraciones/restoo/${id}`);
    return response.data;
  },

  // Test conexión
  async testConexion(id: string): Promise<ApiResponse<{ success: boolean; message: string; restaurantName?: string }>> {
    const response = await api.post<ApiResponse<any>>(`/integraciones/restoo/${id}/test`);
    return response.data;
  },

  // Sincronización
  async sincronizar(id: string, tipo: string): Promise<ApiResponse<IRestooSyncLog>> {
    const response = await api.post<ApiResponse<IRestooSyncLog>>(`/integraciones/restoo/${id}/sync`, { tipo });
    return response.data;
  },

  // Logs
  async getLogs(id: string, page = 1, limit = 20): Promise<ApiResponse<{ logs: IRestooSyncLog[]; total: number }>> {
    const response = await api.get<ApiResponse<any>>(`/integraciones/restoo/${id}/logs`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Salones Restoo
  async getSalonesRestoo(id: string): Promise<ApiResponse<IRestooZone[]>> {
    const response = await api.get<ApiResponse<IRestooZone[]>>(`/integraciones/restoo/${id}/salones-restoo`);
    return response.data;
  },

  // Mapeo salones
  async getMapeoSalones(id: string): Promise<ApiResponse<IRestooMapeoSalon[]>> {
    const response = await api.get<ApiResponse<IRestooMapeoSalon[]>>(`/integraciones/restoo/${id}/mapeo-salones`);
    return response.data;
  },

  async guardarMapeoSalones(id: string, mapeos: Omit<IRestooMapeoSalon, '_id' | 'conexionId'>[]): Promise<ApiResponse<IRestooMapeoSalon[]>> {
    const response = await api.post<ApiResponse<IRestooMapeoSalon[]>>(`/integraciones/restoo/${id}/mapeo-salones`, { mapeos });
    return response.data;
  },
};
