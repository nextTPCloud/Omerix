import { api } from './api';
import {
  IAlbaran,
  CreateAlbaranDTO,
  UpdateAlbaranDTO,
  SearchAlbaranesParams,
  CrearDesdePedidoParams,
  RegistrarEntregaParams,
  CambiarEstadoAlbaranParams,
  EstadoAlbaran,
  AlbaranEstadisticas,
} from '@/types/albaran.types';

// ============================================
// TIPOS DE RESPUESTA
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// SERVICIO DE ALBARANES
// ============================================

class AlbaranesService {
  private baseUrl = '/albaranes';

  // ============================================
  // CRUD BÁSICO
  // ============================================

  /**
   * Obtiene todos los albaranes con paginación y filtros opcionales
   */
  async getAll(params?: SearchAlbaranesParams): Promise<PaginatedResponse<IAlbaran>> {
    try {
      const response = await api.get<PaginatedResponse<IAlbaran>>(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener albaranes:', error);
      throw error;
    }
  }

  /**
   * Obtiene un albarán por su ID
   */
  async getById(id: string): Promise<ApiResponse<IAlbaran>> {
    try {
      const response = await api.get<ApiResponse<IAlbaran>>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener albarán:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo albarán
   */
  async create(data: CreateAlbaranDTO): Promise<ApiResponse<IAlbaran>> {
    try {
      const response = await api.post<ApiResponse<IAlbaran>>(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error al crear albarán:', error);
      throw error;
    }
  }

  /**
   * Actualiza un albarán existente
   */
  async update(id: string, data: UpdateAlbaranDTO): Promise<ApiResponse<IAlbaran>> {
    try {
      const response = await api.put<ApiResponse<IAlbaran>>(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar albarán:', error);
      throw error;
    }
  }

  /**
   * Elimina un albarán (soft delete)
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar albarán:', error);
      throw error;
    }
  }

  // ============================================
  // ACCIONES ESPECIALES
  // ============================================

  /**
   * Crear albarán desde un pedido
   */
  async crearDesdePedido(pedidoId: string, params: CrearDesdePedidoParams): Promise<ApiResponse<IAlbaran>> {
    try {
      const response = await api.post<ApiResponse<IAlbaran>>(
        `${this.baseUrl}/desde-pedido/${pedidoId}`,
        params
      );
      return response.data;
    } catch (error) {
      console.error('Error al crear albarán desde pedido:', error);
      throw error;
    }
  }

  /**
   * Registrar entrega del albarán
   */
  async registrarEntrega(id: string, params: RegistrarEntregaParams): Promise<ApiResponse<IAlbaran>> {
    try {
      const response = await api.post<ApiResponse<IAlbaran>>(
        `${this.baseUrl}/${id}/registrar-entrega`,
        params
      );
      return response.data;
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      throw error;
    }
  }

  /**
   * Cambiar estado del albarán
   */
  async cambiarEstado(id: string, params: CambiarEstadoAlbaranParams): Promise<ApiResponse<IAlbaran>> {
    try {
      const response = await api.post<ApiResponse<IAlbaran>>(
        `${this.baseUrl}/${id}/cambiar-estado`,
        params
      );
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      throw error;
    }
  }

  /**
   * Duplicar un albarán
   */
  async duplicar(id: string): Promise<ApiResponse<IAlbaran>> {
    try {
      const response = await api.post<ApiResponse<IAlbaran>>(`${this.baseUrl}/${id}/duplicar`);
      return response.data;
    } catch (error) {
      console.error('Error al duplicar albarán:', error);
      throw error;
    }
  }

  // ============================================
  // CONSULTAS
  // ============================================

  /**
   * Obtener estadísticas de albaranes
   */
  async getEstadisticas(): Promise<ApiResponse<AlbaranEstadisticas>> {
    try {
      const response = await api.get<ApiResponse<AlbaranEstadisticas>>(`${this.baseUrl}/estadisticas`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener albaranes de un pedido específico
   */
  async getAlbaranesDePedido(pedidoId: string): Promise<ApiResponse<IAlbaran[]>> {
    try {
      const response = await api.get<ApiResponse<IAlbaran[]>>(`${this.baseUrl}/pedido/${pedidoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener albaranes del pedido:', error);
      throw error;
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Marcar como pendiente de entrega
   */
  async marcarPendienteEntrega(id: string, observaciones?: string): Promise<ApiResponse<IAlbaran>> {
    return this.cambiarEstado(id, {
      estado: EstadoAlbaran.PENDIENTE_ENTREGA,
      observaciones,
    });
  }

  /**
   * Marcar como en tránsito
   */
  async marcarEnTransito(id: string, observaciones?: string): Promise<ApiResponse<IAlbaran>> {
    return this.cambiarEstado(id, {
      estado: EstadoAlbaran.EN_TRANSITO,
      observaciones,
    });
  }

  /**
   * Marcar como entregado
   */
  async marcarEntregado(id: string, observaciones?: string): Promise<ApiResponse<IAlbaran>> {
    return this.cambiarEstado(id, {
      estado: EstadoAlbaran.ENTREGADO,
      observaciones,
    });
  }

  /**
   * Anular albarán
   */
  async anular(id: string, observaciones?: string): Promise<ApiResponse<IAlbaran>> {
    return this.cambiarEstado(id, {
      estado: EstadoAlbaran.ANULADO,
      observaciones,
    });
  }

  /**
   * Buscar albaranes por texto
   */
  async buscar(texto: string, limite: number = 10): Promise<PaginatedResponse<IAlbaran>> {
    return this.getAll({
      search: texto,
      limit: limite,
      activo: 'true',
    });
  }

  /**
   * Obtener albaranes pendientes de entrega
   */
  async getPendientesEntrega(): Promise<PaginatedResponse<IAlbaran>> {
    return this.getAll({
      estados: `${EstadoAlbaran.PENDIENTE_ENTREGA},${EstadoAlbaran.EN_TRANSITO}`,
      activo: 'true',
      sortBy: 'datosEntrega.fechaProgramada',
      sortOrder: 'asc',
    });
  }

  /**
   * Obtener albaranes pendientes de facturar
   */
  async getPendientesFacturar(): Promise<PaginatedResponse<IAlbaran>> {
    return this.getAll({
      estado: EstadoAlbaran.ENTREGADO,
      facturado: 'false',
      activo: 'true',
      sortBy: 'fecha',
      sortOrder: 'asc',
    });
  }

  /**
   * Obtener albaranes de un cliente
   */
  async getAlbaranesCliente(clienteId: string, params?: SearchAlbaranesParams): Promise<PaginatedResponse<IAlbaran>> {
    return this.getAll({
      ...params,
      clienteId,
    });
  }

  /**
   * Obtener albaranes de un proyecto
   */
  async getAlbaranesProyecto(proyectoId: string, params?: SearchAlbaranesParams): Promise<PaginatedResponse<IAlbaran>> {
    return this.getAll({
      ...params,
      proyectoId,
    });
  }

  // ============================================
  // ACCIONES MASIVAS
  // ============================================

  /**
   * Eliminar varios albaranes
   */
  async deleteMany(ids: string[]): Promise<ApiResponse<{ eliminados: number; errores: string[] }>> {
    try {
      const response = await api.post<ApiResponse<{ eliminados: number; errores: string[] }>>(
        `${this.baseUrl}/bulk-delete`,
        { ids }
      );
      return response.data;
    } catch (error) {
      console.error('Error al eliminar albaranes:', error);
      throw error;
    }
  }

  /**
   * Enviar varios albaranes por email
   */
  async enviarVariosPorEmail(ids: string[], opciones?: { asunto?: string; mensaje?: string }): Promise<ApiResponse<{
    enviados: number;
    resultados: { id: string; codigo: string; success: boolean; error?: string }[];
  }>> {
    try {
      const response = await api.post<ApiResponse<{
        enviados: number;
        resultados: { id: string; codigo: string; success: boolean; error?: string }[];
      }>>(`${this.baseUrl}/bulk-email`, { ids, ...opciones });
      return response.data;
    } catch (error) {
      console.error('Error al enviar albaranes por email:', error);
      throw error;
    }
  }

  /**
   * Generar URLs de WhatsApp para varios albaranes
   */
  async generarURLsWhatsApp(ids: string[], mensaje?: string): Promise<ApiResponse<{
    generados: number;
    resultados: { id: string; codigo: string; url?: string; telefono?: string; success: boolean; error?: string }[];
  }>> {
    try {
      const response = await api.post<ApiResponse<{
        generados: number;
        resultados: { id: string; codigo: string; url?: string; telefono?: string; success: boolean; error?: string }[];
      }>>(`${this.baseUrl}/bulk-whatsapp`, { ids, mensaje });
      return response.data;
    } catch (error) {
      console.error('Error al generar URLs de WhatsApp:', error);
      throw error;
    }
  }
}

export const albaranesService = new AlbaranesService();
export default albaranesService;
