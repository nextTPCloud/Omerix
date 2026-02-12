import { api } from './api';

// ============================================
// TIPOS
// ============================================

export type TipoSugerencia = 'complementario' | 'upgrade' | 'alternativa' | 'acompanamiento' | 'postre' | 'bebida';
export type MomentoSugerencia = 'al_agregar' | 'al_finalizar' | 'automatico';

export interface ProductoSugerido {
  productoId: string | { _id: string; nombre: string; codigo: string; precioVenta: number; imagen?: string };
  orden: number;
  descuento?: number;
  textoPersonalizado?: string;
}

export interface CondicionHoraria {
  horaInicio: string;
  horaFin: string;
  diasSemana: number[];
  activo: boolean;
}

export interface Sugerencia {
  _id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoSugerencia;
  momento: MomentoSugerencia;
  productoBaseId?: string | { _id: string; nombre: string; codigo: string; imagen?: string };
  familiaBaseId?: string | { _id: string; nombre: string };
  productosSugeridos: ProductoSugerido[];
  condicionHoraria?: CondicionHoraria;
  activo: boolean;
  prioridad: number;
  vecesVista: number;
  vecesAceptada: number;
  tasaAceptacion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSugerenciaDTO {
  nombre: string;
  descripcion?: string;
  tipo: TipoSugerencia;
  momento?: MomentoSugerencia;
  productoBaseId?: string;
  familiaBaseId?: string;
  productosSugeridos: {
    productoId: string;
    orden?: number;
    descuento?: number;
    textoPersonalizado?: string;
  }[];
  condicionHoraria?: CondicionHoraria;
  prioridad?: number;
}

export interface SugerenciasResponse {
  success: boolean;
  data: Sugerencia[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EstadisticasSugerencias {
  porTipo: {
    _id: TipoSugerencia;
    total: number;
    vecesVista: number;
    vecesAceptada: number;
  }[];
  totales: {
    totalSugerencias: number;
    totalVistas: number;
    totalAceptadas: number;
  };
  tasaAceptacionGlobal: number;
}

// ============================================
// SERVICIO
// ============================================

export const sugerenciasService = {
  async getAll(params?: {
    tipo?: TipoSugerencia;
    momento?: MomentoSugerencia;
    productoId?: string;
    familiaId?: string;
    activo?: boolean;
    busqueda?: string;
    page?: number;
    limit?: number;
  }): Promise<SugerenciasResponse> {
    const response = await api.get('/sugerencias', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Sugerencia }> {
    const response = await api.get(`/sugerencias/${id}`);
    return response.data;
  },

  async create(data: CreateSugerenciaDTO): Promise<{ success: boolean; data: Sugerencia }> {
    const response = await api.post('/sugerencias', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateSugerenciaDTO> & { activo?: boolean }): Promise<{ success: boolean; data: Sugerencia }> {
    const response = await api.put(`/sugerencias/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/sugerencias/${id}`);
    return response.data;
  },

  async getSugerenciasParaProducto(productoId: string, familiaId?: string): Promise<{ success: boolean; data: Sugerencia[] }> {
    const params = familiaId ? { familiaId } : undefined;
    const response = await api.get(`/sugerencias/producto/${productoId}`, { params });
    return response.data;
  },

  async getSugerenciasFinalizacion(): Promise<{ success: boolean; data: Sugerencia[] }> {
    const response = await api.get('/sugerencias/finalizacion');
    return response.data;
  },

  async registrarAceptacion(id: string): Promise<{ success: boolean }> {
    const response = await api.post(`/sugerencias/${id}/aceptar`);
    return response.data;
  },

  async getEstadisticas(): Promise<{ success: boolean; data: EstadisticasSugerencias }> {
    const response = await api.get('/sugerencias/estadisticas');
    return response.data;
  },

  // ============================================
  // HELPERS
  // ============================================

  getTipoLabel(tipo: TipoSugerencia): string {
    const labels: Record<TipoSugerencia, string> = {
      complementario: 'Complementario',
      upgrade: 'Mejora',
      alternativa: 'Alternativa',
      acompanamiento: 'Acompañamiento',
      postre: 'Postre',
      bebida: 'Bebida',
    };
    return labels[tipo] || tipo;
  },

  getTipoColor(tipo: TipoSugerencia): string {
    const colores: Record<TipoSugerencia, string> = {
      complementario: '#3b82f6',  // Azul
      upgrade: '#8b5cf6',         // Morado
      alternativa: '#f59e0b',     // Amarillo
      acompanamiento: '#22c55e',  // Verde
      postre: '#ec4899',          // Rosa
      bebida: '#06b6d4',          // Cyan
    };
    return colores[tipo] || '#6b7280';
  },

  getMomentoLabel(momento: MomentoSugerencia): string {
    const labels: Record<MomentoSugerencia, string> = {
      al_agregar: 'Al agregar producto',
      al_finalizar: 'Al finalizar pedido',
      automatico: 'Automatico (por hora)',
    };
    return labels[momento] || momento;
  },

  getDiaLabel(dia: number): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[dia] || '';
  },
};
