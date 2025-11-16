import { api } from './api';

// Tipos
export interface EmpresaStats {
  totalUsuarios: number;
  usuariosActivos: number;
  adminCount?: number;
}

export interface EmpresaListItem {
  _id: string;
  nombre: string;
  nif: string;
  email: string;
  estado: 'activa' | 'suspendida' | 'cancelada';
  tipoNegocio: string;
  fechaAlta: string;
  stats: EmpresaStats;
}

export interface EmpresaDetalle extends EmpresaListItem {
  telefono?: string;
  direccion?: {
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
  };
  usuarios: any[];
  databaseConfig: {
    host: string;
    port: number;
    name: string;
  };
}

export interface SystemStats {
  empresas: {
    total: number;
    activas: number;
    suspendidas: number;
    canceladas: number;
  };
  usuarios: {
    total: number;
    activos: number;
  };
  empresasPorTipo: Array<{
    _id: string;
    count: number;
  }>;
  empresasPorMes: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
}

export interface EmpresasResponse {
  success: boolean;
  data: EmpresaListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Servicio para operaciones administrativas
 * Requiere rol de superadmin
 */
export const adminService = {
  /**
   * Obtener estadísticas generales del sistema
   */
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await api.get('/admin/stats');
    return response.data.data;
  },

  /**
   * Obtener lista de empresas con paginación y filtros
   */
  getEmpresas: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    estado?: 'activa' | 'suspendida' | 'cancelada';
    tipoNegocio?: string;
  }): Promise<EmpresasResponse> => {
    const response = await api.get('/admin/empresas', { params });
    return response.data;
  },

  /**
   * Obtener detalles completos de una empresa
   */
  getEmpresaById: async (id: string): Promise<EmpresaDetalle> => {
    const response = await api.get(`/admin/empresas/${id}`);
    return response.data.data;
  },

  /**
   * Actualizar datos de una empresa
   */
  updateEmpresa: async (
    id: string,
    data: Partial<{
      nombre: string;
      email: string;
      telefono: string;
      estado: 'activa' | 'suspendida' | 'cancelada';
      tipoNegocio: string;
      direccion: any;
    }>
  ): Promise<EmpresaDetalle> => {
    const response = await api.put(`/admin/empresas/${id}`, data);
    return response.data.data;
  },

  /**
   * Cambiar estado de una empresa
   */
  updateEmpresaEstado: async (
    id: string,
    estado: 'activa' | 'suspendida' | 'cancelada',
    razon?: string
  ): Promise<EmpresaDetalle> => {
    const response = await api.put(`/admin/empresas/${id}/estado`, {
      estado,
      razon,
    });
    return response.data.data;
  },

  /**
   * Eliminar empresa completamente (cuidado!)
   */
  deleteEmpresa: async (id: string): Promise<void> => {
    await api.delete(`/admin/empresas/${id}`);
  },
};