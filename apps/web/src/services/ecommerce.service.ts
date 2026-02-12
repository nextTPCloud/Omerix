import { api } from './api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface IConexionEcommerce {
  _id: string;
  nombre: string;
  plataforma: 'prestashop' | 'woocommerce';
  url: string;
  apiKey: string;
  apiSecret?: string;
  activa: boolean;
  ultimaSync?: string;
  configuracion: {
    syncAutomatico: boolean;
    intervaloMinutos: number;
    almacenId?: string;
    tarifaId?: string;
    sincronizarStock: boolean;
    sincronizarPrecios: boolean;
    sincronizarImagenes: boolean;
    sincronizarDescripciones: boolean;
    mapeoCategoriasAuto: boolean;
    crearProductosNuevos: boolean;
    actualizarExistentes: boolean;
  };
  estadisticas: {
    productosSync: number;
    categoriasSync: number;
    ultimoError?: string;
    ultimoErrorFecha?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ISyncLog {
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
    productoId?: string;
    sku?: string;
    accion: string;
    resultado: string;
    mensaje?: string;
  }>;
}

export const ecommerceService = {
  async getConexiones(): Promise<ApiResponse<IConexionEcommerce[]>> {
    const response = await api.get<ApiResponse<IConexionEcommerce[]>>('/ecommerce');
    return response.data;
  },

  async getConexion(id: string): Promise<ApiResponse<IConexionEcommerce>> {
    const response = await api.get<ApiResponse<IConexionEcommerce>>(`/ecommerce/${id}`);
    return response.data;
  },

  async crearConexion(data: Partial<IConexionEcommerce>): Promise<ApiResponse<IConexionEcommerce>> {
    const response = await api.post<ApiResponse<IConexionEcommerce>>('/ecommerce', data);
    return response.data;
  },

  async actualizarConexion(id: string, data: Partial<IConexionEcommerce>): Promise<ApiResponse<IConexionEcommerce>> {
    const response = await api.put<ApiResponse<IConexionEcommerce>>(`/ecommerce/${id}`, data);
    return response.data;
  },

  async eliminarConexion(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/ecommerce/${id}`);
    return response.data;
  },

  async testConexion(id: string): Promise<ApiResponse<{ success: boolean; message: string; version?: string }>> {
    const response = await api.post<ApiResponse<any>>(`/ecommerce/${id}/test`);
    return response.data;
  },

  async sincronizar(id: string, tipo: string, direccion?: string): Promise<ApiResponse<ISyncLog>> {
    const response = await api.post<ApiResponse<ISyncLog>>(`/ecommerce/${id}/sync`, { tipo, direccion: direccion || 'subir' });
    return response.data;
  },

  async getLogs(id: string): Promise<ApiResponse<ISyncLog[]>> {
    const response = await api.get<ApiResponse<ISyncLog[]>>(`/ecommerce/${id}/logs`);
    return response.data;
  },
};
