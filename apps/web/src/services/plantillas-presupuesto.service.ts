import { api } from './api';

// ============================================
// INTERFACES
// ============================================

export interface ILineaPlantilla {
  _id?: string;
  orden: number;
  tipo: string;
  productoId?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  descripcionLarga?: string;
  sku?: string;
  cantidad: number;
  unidad?: string;
  precioUnitario: number;
  costeUnitario: number;
  descuento: number;
  iva: number;
  esEditable: boolean;
  incluidoEnTotal: boolean;
  notasInternas?: string;
}

export interface IPlantillaPresupuesto {
  _id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  categoria?: string;
  lineas: ILineaPlantilla[];
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;
  condiciones?: {
    formaPagoId?: string;
    terminoPagoId?: string;
    validezDias?: number;
    tiempoEntrega?: string;
    garantia?: string;
    portesPagados?: boolean;
    portesImporte?: number;
    observacionesEntrega?: string;
  };
  descuentoGlobalPorcentaje?: number;
  activo: boolean;
  esPublica: boolean;
  tags?: string[];
  vecesUsada: number;
  ultimoUso?: string;
  creadoPor: { _id: string; nombre: string; email: string };
  fechaCreacion: string;
  fechaModificacion?: string;
}

export interface CreatePlantillaDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  categoria?: string;
  lineas?: Partial<ILineaPlantilla>[];
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;
  condiciones?: Record<string, any>;
  descuentoGlobalPorcentaje?: number;
  esPublica?: boolean;
  tags?: string[];
}

export interface SearchPlantillasParams {
  search?: string;
  categoria?: string;
  activo?: string;
  creadoPor?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

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

// ============================================
// SERVICE
// ============================================

export const plantillasPresupuestoService = {
  // ============================================
  // CRUD
  // ============================================

  async getAll(params?: SearchPlantillasParams): Promise<ApiResponse<IPlantillaPresupuesto[]>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await api.get<ApiResponse<IPlantillaPresupuesto[]>>(
      `/plantillas-presupuesto?${queryParams.toString()}`
    );
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<IPlantillaPresupuesto>> {
    const response = await api.get<ApiResponse<IPlantillaPresupuesto>>(`/plantillas-presupuesto/${id}`);
    return response.data;
  },

  async create(data: CreatePlantillaDTO): Promise<ApiResponse<IPlantillaPresupuesto>> {
    const response = await api.post<ApiResponse<IPlantillaPresupuesto>>('/plantillas-presupuesto', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreatePlantillaDTO>): Promise<ApiResponse<IPlantillaPresupuesto>> {
    const response = await api.put<ApiResponse<IPlantillaPresupuesto>>(`/plantillas-presupuesto/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/plantillas-presupuesto/${id}`);
    return response.data;
  },

  // ============================================
  // CREAR DESDE PRESUPUESTO
  // ============================================

  async crearDesdePresupuesto(
    presupuestoId: string,
    opciones: {
      nombre: string;
      descripcion?: string;
      categoria?: string;
      mantenerPrecios?: boolean;
      mantenerCostes?: boolean;
      esPublica?: boolean;
    }
  ): Promise<ApiResponse<IPlantillaPresupuesto>> {
    const response = await api.post<ApiResponse<IPlantillaPresupuesto>>(
      `/plantillas-presupuesto/desde-presupuesto/${presupuestoId}`,
      opciones
    );
    return response.data;
  },

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(id: string, nombre: string): Promise<ApiResponse<IPlantillaPresupuesto>> {
    const response = await api.post<ApiResponse<IPlantillaPresupuesto>>(
      `/plantillas-presupuesto/${id}/duplicar`,
      { nombre }
    );
    return response.data;
  },

  // ============================================
  // REGISTRAR USO
  // ============================================

  async registrarUso(id: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(`/plantillas-presupuesto/${id}/registrar-uso`);
    return response.data;
  },

  // ============================================
  // UTILIDADES
  // ============================================

  async getCategorias(): Promise<ApiResponse<string[]>> {
    const response = await api.get<ApiResponse<string[]>>('/plantillas-presupuesto/categorias');
    return response.data;
  },

  async getMasUsadas(limite?: number): Promise<ApiResponse<IPlantillaPresupuesto[]>> {
    const params = limite ? `?limite=${limite}` : '';
    const response = await api.get<ApiResponse<IPlantillaPresupuesto[]>>(
      `/plantillas-presupuesto/mas-usadas${params}`
    );
    return response.data;
  },
};

export default plantillasPresupuestoService;
