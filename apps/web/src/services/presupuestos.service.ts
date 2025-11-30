import { api } from './api';
import {
  IPresupuesto,
  CreatePresupuestoDTO,
  UpdatePresupuestoDTO,
  SearchPresupuestosParams,
  PresupuestoEstadisticas,
  AplicarMargenParams,
  ImportarLineasParams,
} from '@/types/presupuesto.types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const presupuestosService = {
  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(params?: SearchPresupuestosParams): Promise<ApiResponse<IPresupuesto[]>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await api.get<ApiResponse<IPresupuesto[]>>(`/presupuestos?${queryParams.toString()}`);
    return response.data;
  },

  async getById(id: string, ocultarCostes?: boolean): Promise<ApiResponse<IPresupuesto>> {
    const params = ocultarCostes ? '?ocultarCostes=true' : '';
    const response = await api.get<ApiResponse<IPresupuesto>>(`/presupuestos/${id}${params}`);
    return response.data;
  },

  async create(data: CreatePresupuestoDTO): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>('/presupuestos', data);
    return response.data;
  },

  async update(id: string, data: UpdatePresupuestoDTO): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.put<ApiResponse<IPresupuesto>>(`/presupuestos/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/presupuestos/${id}`);
    return response.data;
  },

  async deleteMany(ids: string[]): Promise<ApiResponse<{ eliminados: number }>> {
    const response = await api.post<ApiResponse<{ eliminados: number }>>('/presupuestos/bulk-delete', { ids });
    return response.data;
  },

  // ============================================
  // ACCIONES DE ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    estado: string,
    observaciones?: string,
    fechaRespuesta?: string
  ): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.patch<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/estado`, {
      estado,
      observaciones,
      fechaRespuesta,
    });
    return response.data;
  },

  async enviar(id: string): Promise<ApiResponse<IPresupuesto>> {
    return this.cambiarEstado(id, 'enviado');
  },

  async aceptar(id: string, observaciones?: string): Promise<ApiResponse<IPresupuesto>> {
    return this.cambiarEstado(id, 'aceptado', observaciones);
  },

  async rechazar(id: string, observaciones?: string): Promise<ApiResponse<IPresupuesto>> {
    return this.cambiarEstado(id, 'rechazado', observaciones);
  },

  // ============================================
  // DUPLICAR Y REVISIONES
  // ============================================

  async duplicar(
    id: string,
    opciones?: {
      nuevoCliente?: string;
      mantenerPrecios?: boolean;
      mantenerCostes?: boolean;
      nuevaFecha?: string;
    }
  ): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/duplicar`, opciones || {});
    return response.data;
  },

  async crearRevision(id: string): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/revision`);
    return response.data;
  },

  // ============================================
  // OPERACIONES CON LÍNEAS
  // ============================================

  async aplicarMargen(id: string, params: AplicarMargenParams): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/aplicar-margen`, params);
    return response.data;
  },

  async importarLineas(id: string, params: ImportarLineasParams): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/importar-lineas`, params);
    return response.data;
  },

  // ============================================
  // TOGGLE COSTES
  // ============================================

  async toggleMostrarCostes(id: string, mostrarCostes: boolean): Promise<ApiResponse<{ mostrarCostes: boolean }>> {
    const response = await api.patch<ApiResponse<{ mostrarCostes: boolean }>>(`/presupuestos/${id}/toggle-costes`, {
      mostrarCostes,
    });
    return response.data;
  },

  // ============================================
  // UTILIDADES
  // ============================================

  async sugerirCodigo(serie?: string): Promise<ApiResponse<{ codigo: string; serie: string; numero: number }>> {
    const params = serie ? `?serie=${serie}` : '';
    const response = await api.get<ApiResponse<{ codigo: string; serie: string; numero: number }>>(
      `/presupuestos/sugerir-codigo${params}`
    );
    return response.data;
  },

  async getEstadisticas(): Promise<ApiResponse<PresupuestoEstadisticas>> {
    const response = await api.get<ApiResponse<PresupuestoEstadisticas>>('/presupuestos/estadisticas');
    return response.data;
  },

  // ============================================
  // CONSULTAS POR RELACIÓN
  // ============================================

  async getByClienteId(clienteId: string): Promise<ApiResponse<IPresupuesto[]>> {
    const response = await api.get<ApiResponse<IPresupuesto[]>>(`/presupuestos/cliente/${clienteId}`);
    return response.data;
  },

  async getByProyectoId(proyectoId: string): Promise<ApiResponse<IPresupuesto[]>> {
    const response = await api.get<ApiResponse<IPresupuesto[]>>(`/presupuestos/proyecto/${proyectoId}`);
    return response.data;
  },
};

export default presupuestosService;
