import { api } from './api'
import {
  Vencimiento,
  VencimientoFilters,
  VencimientoStats,
  CreateVencimientoDTO,
  UpdateVencimientoDTO,
  RegistrarCobroDTO,
  CrearRemesaDTO,
  Remesa,
  ResumenTesoreria,
} from '@/types/vencimiento.types';

// ============================================
// TIPOS DE RESPUESTA
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: VencimientoStats;
}

// ============================================
// SERVICIO DE VENCIMIENTOS
// ============================================

class VencimientosService {
  private baseUrl = '/vencimientos';

  /**
   * Obtener todos los vencimientos con filtros y paginación
   */
  async getAll(filters: VencimientoFilters = {}): Promise<PaginatedResponse<Vencimiento>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await api.get<PaginatedResponse<Vencimiento>>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Obtener cobros (vencimientos de tipo cobro)
   */
  async getCobros(filters: Omit<VencimientoFilters, 'tipo'> = {}): Promise<PaginatedResponse<Vencimiento>> {
    return this.getAll({ ...filters, tipo: 'cobro' });
  }

  /**
   * Obtener pagos (vencimientos de tipo pago)
   */
  async getPagos(filters: Omit<VencimientoFilters, 'tipo'> = {}): Promise<PaginatedResponse<Vencimiento>> {
    return this.getAll({ ...filters, tipo: 'pago' });
  }

  /**
   * Obtener un vencimiento por ID
   */
  async getById(id: string): Promise<ApiResponse<Vencimiento>> {
    const response = await api.get<ApiResponse<Vencimiento>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo vencimiento
   */
  async create(data: CreateVencimientoDTO): Promise<ApiResponse<Vencimiento>> {
    const response = await api.post<ApiResponse<Vencimiento>>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Actualizar un vencimiento
   */
  async update(id: string, data: UpdateVencimientoDTO): Promise<ApiResponse<Vencimiento>> {
    const response = await api.put<ApiResponse<Vencimiento>>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Eliminar un vencimiento
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Registrar cobro/pago
   */
  async registrarCobro(id: string, data: RegistrarCobroDTO): Promise<ApiResponse<Vencimiento>> {
    const response = await api.post<ApiResponse<Vencimiento>>(`${this.baseUrl}/${id}/cobro`, data);
    return response.data;
  }

  /**
   * Marcar como impagado
   */
  async marcarImpagado(id: string): Promise<ApiResponse<Vencimiento>> {
    const response = await api.post<ApiResponse<Vencimiento>>(`${this.baseUrl}/${id}/impagado`);
    return response.data;
  }

  /**
   * Anular vencimiento
   */
  async anular(id: string): Promise<ApiResponse<Vencimiento>> {
    const response = await api.post<ApiResponse<Vencimiento>>(`${this.baseUrl}/${id}/anular`);
    return response.data;
  }

  /**
   * Obtener vencimientos de un cliente
   */
  async getByCliente(clienteId: string): Promise<ApiResponse<Vencimiento[]>> {
    const response = await api.get<ApiResponse<Vencimiento[]>>(`${this.baseUrl}/cliente/${clienteId}`);
    return response.data;
  }

  /**
   * Obtener vencimientos de un proveedor
   */
  async getByProveedor(proveedorId: string): Promise<ApiResponse<Vencimiento[]>> {
    const response = await api.get<ApiResponse<Vencimiento[]>>(`${this.baseUrl}/proveedor/${proveedorId}`);
    return response.data;
  }

  /**
   * Crear remesa
   */
  async crearRemesa(data: CrearRemesaDTO): Promise<ApiResponse<Remesa>> {
    const response = await api.post<ApiResponse<Remesa>>(`${this.baseUrl}/remesa`, data);
    return response.data;
  }

  /**
   * Obtener resumen de tesorería
   */
  async getResumen(tipo?: 'cobro' | 'pago'): Promise<ApiResponse<ResumenTesoreria>> {
    const params = tipo ? `?tipo=${tipo}` : '';
    const response = await api.get<ApiResponse<ResumenTesoreria>>(`${this.baseUrl}/resumen${params}`);
    return response.data;
  }

  /**
   * Obtener vencimientos vencidos
   */
  async getVencidos(tipo?: 'cobro' | 'pago'): Promise<PaginatedResponse<Vencimiento>> {
    return this.getAll({ tipo, vencidos: true });
  }
}

export const vencimientosService = new VencimientosService();
