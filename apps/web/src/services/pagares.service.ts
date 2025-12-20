import api from './api';
import {
  IPagare,
  IPagareFilters,
  ICrearPagareDTO,
  IActualizarPagareDTO,
  IMarcarCobradoDTO,
  IMarcarDevueltoDTO,
} from '@/types/pagare.types';

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

class PagaresService {
  private baseUrl = '/pagares';

  /**
   * Obtener todos los pagarés con filtros
   */
  async getAll(filters?: IPagareFilters): Promise<PaginatedResponse<IPagare>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  /**
   * Obtener un pagaré por ID
   */
  async getById(id: string): Promise<SingleResponse<IPagare>> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo pagaré
   */
  async create(data: ICrearPagareDTO): Promise<SingleResponse<IPagare>> {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar un pagaré
   */
  async update(id: string, data: IActualizarPagareDTO): Promise<SingleResponse<IPagare>> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un pagaré
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Marcar pagaré como cobrado
   */
  async marcarCobrado(id: string, data?: IMarcarCobradoDTO): Promise<SingleResponse<IPagare>> {
    const response = await api.post(`${this.baseUrl}/${id}/cobrar`, data || {});
    return response.data;
  }

  /**
   * Marcar pagaré como devuelto
   */
  async marcarDevuelto(id: string, data: IMarcarDevueltoDTO): Promise<SingleResponse<IPagare>> {
    const response = await api.post(`${this.baseUrl}/${id}/devolver`, data);
    return response.data;
  }

  /**
   * Anular un pagaré
   */
  async anular(id: string, motivo?: string): Promise<SingleResponse<IPagare>> {
    const response = await api.post(`${this.baseUrl}/${id}/anular`, { motivo });
    return response.data;
  }

  /**
   * Crear pagaré desde vencimiento
   */
  async crearDesdeVencimiento(
    vencimientoId: string,
    datosPagare: Partial<ICrearPagareDTO>
  ): Promise<SingleResponse<IPagare>> {
    const response = await api.post(`${this.baseUrl}/desde-vencimiento`, {
      vencimientoId,
      ...datosPagare,
    });
    return response.data;
  }

  /**
   * Obtener próximos vencimientos
   */
  async getProximosVencimientos(dias: number = 30): Promise<{ success: boolean; data: IPagare[] }> {
    const response = await api.get(`${this.baseUrl}/proximos-vencimientos?dias=${dias}`);
    return response.data;
  }

  /**
   * Obtener pagarés devueltos
   */
  async getDevueltos(): Promise<{ success: boolean; data: IPagare[] }> {
    const response = await api.get(`${this.baseUrl}/devueltos`);
    return response.data;
  }

  /**
   * Obtener estadísticas
   */
  async getEstadisticas(fechaDesde?: string, fechaHasta?: string): Promise<{
    success: boolean;
    data: {
      totalPendientes: number;
      importePendiente: number;
      totalCobrados: number;
      importeCobrado: number;
      totalDevueltos: number;
      importeDevuelto: number;
      proximosVencimientos: number;
    };
  }> {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const response = await api.get(`${this.baseUrl}/estadisticas?${params.toString()}`);
    return response.data;
  }
}

export const pagaresService = new PagaresService();
export default pagaresService;
