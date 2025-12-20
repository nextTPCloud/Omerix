import api from './api';
import {
  IRecibo,
  IReciboFilters,
  ICrearReciboDTO,
  IGenerarRecibosDesdeFacturaDTO,
  IGenerarRecibosDesdeVencimientosDTO,
  ICrearRemesaDTO,
  IRemesa,
} from '@/types/recibo.types';

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

class RecibosService {
  private baseUrl = '/recibos';

  /**
   * Obtener todos los recibos con filtros
   */
  async getAll(filters?: IReciboFilters): Promise<PaginatedResponse<IRecibo>> {
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
   * Obtener un recibo por ID
   */
  async getById(id: string): Promise<SingleResponse<IRecibo>> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo recibo
   */
  async create(data: ICrearReciboDTO): Promise<SingleResponse<IRecibo>> {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar un recibo
   */
  async update(id: string, data: Partial<ICrearReciboDTO>): Promise<SingleResponse<IRecibo>> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un recibo
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Generar recibos desde una factura
   */
  async generarDesdeFactura(data: IGenerarRecibosDesdeFacturaDTO): Promise<{
    success: boolean;
    data: IRecibo[];
  }> {
    const response = await api.post(`${this.baseUrl}/desde-factura`, data);
    return response.data;
  }

  /**
   * Generar recibos desde vencimientos
   */
  async generarDesdeVencimientos(data: IGenerarRecibosDesdeVencimientosDTO): Promise<{
    success: boolean;
    data: IRecibo[];
  }> {
    const response = await api.post(`${this.baseUrl}/desde-vencimientos`, data);
    return response.data;
  }

  /**
   * Marcar recibo como enviado al banco
   */
  async marcarEnviado(id: string, fechaEnvio?: string): Promise<SingleResponse<IRecibo>> {
    const response = await api.post(`${this.baseUrl}/${id}/enviar`, { fechaEnvio });
    return response.data;
  }

  /**
   * Marcar recibo como cobrado
   */
  async marcarCobrado(id: string, data?: { fechaCobro?: string; observaciones?: string }): Promise<SingleResponse<IRecibo>> {
    const response = await api.post(`${this.baseUrl}/${id}/cobrar`, data || {});
    return response.data;
  }

  /**
   * Marcar recibo como devuelto
   */
  async marcarDevuelto(id: string, data: {
    motivo: string;
    comision?: number;
    observaciones?: string;
  }): Promise<SingleResponse<IRecibo>> {
    const response = await api.post(`${this.baseUrl}/${id}/devolver`, data);
    return response.data;
  }

  /**
   * Anular un recibo
   */
  async anular(id: string, motivo?: string): Promise<SingleResponse<IRecibo>> {
    const response = await api.post(`${this.baseUrl}/${id}/anular`, { motivo });
    return response.data;
  }

  /**
   * Obtener recibos pendientes de envío a banco
   */
  async getPendientesEnvio(): Promise<{ success: boolean; data: IRecibo[] }> {
    const response = await api.get(`${this.baseUrl}/pendientes-envio`);
    return response.data;
  }

  /**
   * Crear remesa de recibos
   */
  async crearRemesa(data: ICrearRemesaDTO): Promise<SingleResponse<IRemesa>> {
    const response = await api.post(`${this.baseUrl}/remesa`, data);
    return response.data;
  }

  /**
   * Generar fichero SEPA
   */
  async generarFicheroSEPA(remesaId: string): Promise<{
    success: boolean;
    data: {
      xml: string;
      nombreArchivo: string;
    };
  }> {
    const response = await api.get(`${this.baseUrl}/remesa/${remesaId}/sepa`);
    return response.data;
  }

  /**
   * Descargar fichero SEPA
   */
  async descargarFicheroSEPA(remesaId: string): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/remesa/${remesaId}/sepa/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const recibosService = new RecibosService();
export default recibosService;
