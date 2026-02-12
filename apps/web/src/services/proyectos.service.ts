import {api} from './api';
import { IProyecto, CreateProyectoDTO, UpdateProyectoDTO, SearchProyectosParams, ProyectoEstadisticas, IHito, IParticipante } from '@/types/proyecto.types';

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

export const proyectosService = {
  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(params?: SearchProyectosParams): Promise<ApiResponse<IProyecto[]>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await api.get<ApiResponse<IProyecto[]>>(`/proyectos?${queryParams.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<IProyecto>> {
    const response = await api.get<ApiResponse<IProyecto>>(`/proyectos/${id}`);
    return response.data;
  },

  async create(data: CreateProyectoDTO): Promise<ApiResponse<IProyecto>> {
    const response = await api.post<ApiResponse<IProyecto>>('/proyectos', data);
    return response.data;
  },

  async update(id: string, data: UpdateProyectoDTO): Promise<ApiResponse<IProyecto>> {
    const response = await api.put<ApiResponse<IProyecto>>(`/proyectos/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/proyectos/${id}`);
    return response.data;
  },

  async deleteMany(ids: string[]): Promise<ApiResponse<{ eliminados: number }>> {
    const response = await api.post<ApiResponse<{ eliminados: number }>>('/proyectos/bulk-delete', { ids });
    return response.data;
  },

  // ============================================
  // ACCIONES ESPECIALES
  // ============================================

  async cambiarEstado(id: string, estado: string, observaciones?: string): Promise<ApiResponse<IProyecto>> {
    const response = await api.patch<ApiResponse<IProyecto>>(`/proyectos/${id}/estado`, {
      estado,
      observaciones,
    });
    return response.data;
  },

  async duplicar(id: string): Promise<ApiResponse<IProyecto>> {
    const response = await api.post<ApiResponse<IProyecto>>(`/proyectos/${id}/duplicar`);
    return response.data;
  },

  async sugerirCodigo(): Promise<ApiResponse<{ codigo: string }>> {
    const response = await api.get<ApiResponse<{ codigo: string }>>('/proyectos/sugerir-codigo');
    return response.data;
  },

  async searchCodigos(prefix: string): Promise<string[]> {
    try {
      const response = await api.get<ApiResponse<string[]>>(
        `/proyectos/codigos`,
        { params: { prefix } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error al buscar códigos:', error);
      return [];
    }
  },

  async getEstadisticas(): Promise<ApiResponse<ProyectoEstadisticas>> {
    const response = await api.get<ApiResponse<ProyectoEstadisticas>>('/proyectos/estadisticas');
    return response.data;
  },

  // ============================================
  // GESTIÓN DE HITOS
  // ============================================

  async agregarHito(proyectoId: string, hito: Omit<IHito, '_id' | 'completado'>): Promise<ApiResponse<IProyecto>> {
    const response = await api.post<ApiResponse<IProyecto>>(`/proyectos/${proyectoId}/hitos`, hito);
    return response.data;
  },

  async actualizarHito(proyectoId: string, hitoId: string, data: Partial<IHito>): Promise<ApiResponse<IProyecto>> {
    const response = await api.patch<ApiResponse<IProyecto>>(`/proyectos/${proyectoId}/hitos/${hitoId}`, data);
    return response.data;
  },

  async eliminarHito(proyectoId: string, hitoId: string): Promise<ApiResponse<IProyecto>> {
    const response = await api.delete<ApiResponse<IProyecto>>(`/proyectos/${proyectoId}/hitos/${hitoId}`);
    return response.data;
  },

  async completarHito(proyectoId: string, hitoId: string, completado: boolean): Promise<ApiResponse<IProyecto>> {
    const response = await api.patch<ApiResponse<IProyecto>>(`/proyectos/${proyectoId}/hitos/${hitoId}`, {
      completado,
      fechaReal: completado ? new Date().toISOString() : undefined,
    });
    return response.data;
  },

  // ============================================
  // GESTIÓN DE PARTICIPANTES
  // ============================================

  async agregarParticipante(proyectoId: string, participante: Omit<IParticipante, '_id' | 'activo' | 'horasTrabajadas'>): Promise<ApiResponse<IProyecto>> {
    const response = await api.post<ApiResponse<IProyecto>>(`/proyectos/${proyectoId}/participantes`, participante);
    return response.data;
  },

  async eliminarParticipante(proyectoId: string, participanteId: string): Promise<ApiResponse<IProyecto>> {
    const response = await api.delete<ApiResponse<IProyecto>>(`/proyectos/${proyectoId}/participantes/${participanteId}`);
    return response.data;
  },

  // ============================================
  // CONSULTAS POR RELACIÓN
  // ============================================

  async getByClienteId(clienteId: string): Promise<ApiResponse<IProyecto[]>> {
    const response = await api.get<ApiResponse<IProyecto[]>>(`/proyectos/cliente/${clienteId}`);
    return response.data;
  },

  // ============================================
  // OBTENER PERSONAL DISPONIBLE
  // ============================================

  async getPersonalDisponible(search?: string): Promise<ApiResponse<any[]>> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get<ApiResponse<any[]>>(`/proyectos/personal-disponible${params}`);
    return response.data;
  },

  // ============================================
  // RECURRENCIA / PERIODICIDAD
  // ============================================

  async configurarRecurrencia(
    proyectoId: string,
    config: {
      activo: boolean;
      frecuencia: string;
      diaGeneracion: number;
      fechaInicio: string;
      fechaFin?: string;
      generarParteTrabajo: boolean;
      generarAlbaran: boolean;
      generarFactura: boolean;
      lineasPlantilla?: any[];
    }
  ): Promise<ApiResponse<IProyecto>> {
    const response = await api.put<ApiResponse<IProyecto>>(`/proyectos/${proyectoId}/recurrencia`, config);
    return response.data;
  },

  async getProyectosPendientesGeneracion(): Promise<ApiResponse<IProyecto[]>> {
    const response = await api.get<ApiResponse<IProyecto[]>>('/proyectos/recurrencia/pendientes');
    return response.data;
  },

  async ejecutarGeneracionMasiva(): Promise<ApiResponse<{
    fecha: string;
    totalProyectosProcessados: number;
    totalExitos: number;
    totalErrores: number;
    resultados: any[];
  }>> {
    const response = await api.post<ApiResponse<any>>('/proyectos/recurrencia/generar-masivo');
    return response.data;
  },

  async procesarRecurrente(proyectoId: string): Promise<ApiResponse<{
    exito: boolean;
    proyectoId: string;
    parteTrabajoId?: string;
    parteTrabajoNumero?: string;
    albaranId?: string;
    albaranNumero?: string;
    error?: string;
  }>> {
    const response = await api.post<ApiResponse<any>>(`/proyectos/${proyectoId}/recurrencia/generar`);
    return response.data;
  },

  async getHistorialGeneraciones(proyectoId: string): Promise<ApiResponse<any[]>> {
    const response = await api.get<ApiResponse<any[]>>(`/proyectos/${proyectoId}/recurrencia/historial`);
    return response.data;
  },

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboard(): Promise<ApiResponse<any>> {
    const response = await api.get<ApiResponse<any>>('/proyectos/dashboard');
    return response.data;
  },
};

export default proyectosService;
