import { api }  from './api';

/**
 * ============================================
 * TYPES - CONFIGURACIONES
 * ============================================
 */

export interface ColumnaConfig {
  key: string;
  visible: boolean;
  orden: number;
  ancho?: number;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface ColumnFilters {
  [key: string]: string | boolean | number;
}

// Tipos para filtros avanzados (sincronizado con advanced-filters/types.ts)
export interface SavedAdvancedFilter {
  field: string;
  operator: string;
  value: string | number | boolean | string[];
  valueTo?: string | number;
}

export interface ModuleConfig {
  columnas: ColumnaConfig[];
  sortConfig?: SortConfig;
  columnFilters?: ColumnFilters;
  advancedFilters?: SavedAdvancedFilter[]; // Filtros avanzados guardados
  paginacion?: {
    limit: 10 | 25 | 50 | 100;
  };
  filtrosAdicionales?: any;
  densidad?: 'compact' | 'normal' | 'comfortable';
}

export interface ConfiguracionUsuario {
  _id: string;
  usuarioId: string;
  empresaId: string;
  configuraciones: {
    [modulo: string]: ModuleConfig;
  };
  createdAt: string;
  updatedAt: string;
}


/**
 * ============================================
 * API CALLS
 * ============================================
 */

export const configuracionService = {
  /**
   * Obtener toda la configuración del usuario
   */
  getAll: async (): Promise<ConfiguracionUsuario> => {
    const { data } = await api.get('/configuraciones');
    return data.data;
  },

  /**
   * Obtener configuración de un módulo específico
   */
  getModuleConfig: async (modulo: string): Promise<ModuleConfig | null> => {
    const { data } = await api.get('/configuraciones/modulo', {
      params: { modulo },
    });
    return data.data;
  },

  /**
   * Actualizar configuración completa de un módulo
   */
  updateModuleConfig: async (
    modulo: string,
    configuracion: ModuleConfig
  ): Promise<ConfiguracionUsuario> => {
    const { data } = await api.put('/configuraciones/modulo', {
      modulo,
      configuracion,
    });
    return data.data;
  },

  /**
   * Restablecer configuración de un módulo
   */
  resetModuleConfig: async (modulo: string): Promise<ConfiguracionUsuario> => {
    const { data } = await api.delete('/configuraciones/modulo', {
      data: { modulo },
    });
    return data.data;
  },

  /**
   * Actualizar solo las columnas de un módulo
   */
  updateColumnas: async (
    modulo: string,
    columnas: ColumnaConfig[]
  ): Promise<ConfiguracionUsuario> => {
    const { data } = await api.put('/configuraciones/columnas', {
      modulo,
      columnas,
    });
    return data.data;
  },

  /**
   * Actualizar solo el ordenamiento de un módulo
   */
  updateSortConfig: async (
    modulo: string,
    sortConfig: SortConfig
  ): Promise<ConfiguracionUsuario> => {
    const { data } = await api.put('/configuraciones/sort', {
      modulo,
      sortConfig,
    });
    return data.data;
  },

  /**
   * Actualizar solo los filtros de columna de un módulo
   */
  updateColumnFilters: async (
    modulo: string,
    columnFilters: ColumnFilters
  ): Promise<ConfiguracionUsuario> => {
    const { data } = await api.put('/configuraciones/filters', {
      modulo,
      columnFilters,
    });
    return data.data;
  },

  /**
   * Actualizar solo el límite de paginación de un módulo
   */
  updatePaginationLimit: async (
    modulo: string,
    limit: 10 | 25 | 50 | 100
  ): Promise<ConfiguracionUsuario> => {
    const { data } = await api.put('/configuraciones/pagination', {
      modulo,
      limit,
    });
    return data.data;
  },

  async updateDensidad(
    modulo: string,
    densidad: 'compact' | 'normal' | 'comfortable'
  ): Promise<void> {
    await api.put('/configuraciones/densidad', {
      modulo,
      densidad,
    });
  }
};