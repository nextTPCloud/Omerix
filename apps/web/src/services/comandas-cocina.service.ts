import { api } from './api';

// ============================================
// TIPOS
// ============================================

export type EstadoComanda = 'pendiente' | 'en_preparacion' | 'parcial' | 'listo' | 'servido' | 'cancelado';
export type EstadoLinea = 'pendiente' | 'en_preparacion' | 'listo' | 'servido' | 'cancelado';
export type PrioridadComanda = 'normal' | 'urgente' | 'baja';
export type TipoServicio = 'mesa' | 'barra' | 'llevar' | 'delivery' | 'recoger';

export interface LineaComanda {
  _id: string;
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  modificadores?: {
    modificadorId: string;
    nombre: string;
    precioExtra: number;
  }[];
  comentario?: string;
  estado: EstadoLinea;
  tiempoEstimado?: number;
  prioridad: PrioridadComanda;
  preparadoPor?: {
    _id: string;
    nombre: string;
    apellidos?: string;
  };
  inicioPreparacion?: string;
  finPreparacion?: string;
}

export interface ComandaCocina {
  _id: string;
  pedidoId?: string;
  mesaId?: string;
  mesa?: { _id: string; numero: string };
  numeroComanda: number;
  zonaPreparacionId: string;
  zonaPreparacion?: { _id: string; nombre: string; color: string };
  numeroMesa?: string;
  numeroPedido?: string;
  cliente?: string;
  tipoServicio: TipoServicio;
  lineas: LineaComanda[];
  estado: EstadoComanda;
  prioridad: PrioridadComanda;
  horaRecepcion: string;
  horaInicio?: string;
  horaFin?: string;
  horaServido?: string;
  tiempoObjetivo?: number;
  impreso: boolean;
  vecesPimpreso: number;
  notas?: string;
  notasInternas?: string;
  creadoPor: {
    _id: string;
    nombre: string;
    apellidos?: string;
  };
  // Campos calculados (KDS)
  tiempoTranscurrido?: number;
  estaRetrasada?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComandaDTO {
  pedidoId?: string;
  mesaId?: string;
  zonaPreparacionId: string;
  numeroMesa?: string;
  numeroPedido?: string;
  cliente?: string;
  tipoServicio?: TipoServicio;
  lineas: {
    productoId: string;
    nombreProducto: string;
    cantidad: number;
    modificadores?: {
      modificadorId: string;
      nombre: string;
      precioExtra: number;
    }[];
    comentario?: string;
    tiempoEstimado?: number;
    prioridad?: PrioridadComanda;
  }[];
  prioridad?: PrioridadComanda;
  tiempoObjetivo?: number;
  notas?: string;
  notasInternas?: string;
}

export interface EstadisticasKDS {
  pendientes: number;
  enPreparacion: number;
  listas: number;
  servidas: number;
  canceladas: number;
  totalHoy: number;
  tiempoMedioPreparacion: number;
}

// ============================================
// RESPONSES
// ============================================

export interface ComandasResponse {
  success: boolean;
  data: ComandaCocina[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// SERVICIO
// ============================================

export const comandasCocinaService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    zonaPreparacionId?: string;
    estado?: EstadoComanda;
    estados?: EstadoComanda[];
    prioridad?: PrioridadComanda;
    tipoServicio?: TipoServicio;
    mesaId?: string;
    pedidoId?: string;
    desde?: string;
    hasta?: string;
  }): Promise<ComandasResponse> {
    const queryParams: any = { ...params };
    if (params?.estados) {
      queryParams.estados = params.estados.join(',');
    }
    const response = await api.get('/comandas-cocina', { params: queryParams });
    return response.data;
  },

  async getForKDS(
    zonaPreparacionId: string,
    estados?: EstadoComanda[],
    limit?: number
  ): Promise<{ success: boolean; data: ComandaCocina[] }> {
    const params: any = { zonaPreparacionId, limit };
    if (estados) {
      params.estados = estados.join(',');
    }
    const response = await api.get('/comandas-cocina/kds', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: ComandaCocina }> {
    const response = await api.get(`/comandas-cocina/${id}`);
    return response.data;
  },

  async create(data: CreateComandaDTO): Promise<{ success: boolean; data: ComandaCocina }> {
    const response = await api.post('/comandas-cocina', data);
    return response.data;
  },

  async update(
    id: string,
    data: { estado?: EstadoComanda; prioridad?: PrioridadComanda; notas?: string }
  ): Promise<{ success: boolean; data: ComandaCocina }> {
    const response = await api.put(`/comandas-cocina/${id}`, data);
    return response.data;
  },

  async updateLinea(
    comandaId: string,
    lineaId: string,
    estado: EstadoLinea
  ): Promise<{ success: boolean; data: ComandaCocina }> {
    const response = await api.put(`/comandas-cocina/${comandaId}/linea/${lineaId}`, { estado });
    return response.data;
  },

  async marcarLista(id: string): Promise<{ success: boolean; data: ComandaCocina }> {
    const response = await api.post(`/comandas-cocina/${id}/lista`);
    return response.data;
  },

  async marcarServida(id: string): Promise<{ success: boolean; data: ComandaCocina }> {
    const response = await api.post(`/comandas-cocina/${id}/servida`);
    return response.data;
  },

  async cancelar(id: string): Promise<{ success: boolean; data: ComandaCocina }> {
    const response = await api.post(`/comandas-cocina/${id}/cancelar`);
    return response.data;
  },

  async reimprimir(id: string): Promise<{ success: boolean; data: ComandaCocina }> {
    const response = await api.post(`/comandas-cocina/${id}/reimprimir`);
    return response.data;
  },

  async getEstadisticas(zonaPreparacionId: string): Promise<{ success: boolean; data: EstadisticasKDS }> {
    const response = await api.get(`/comandas-cocina/estadisticas/${zonaPreparacionId}`);
    return response.data;
  },

  // Helpers
  getEstadoColor(estado: EstadoComanda): string {
    const colores: Record<EstadoComanda, string> = {
      pendiente: '#f59e0b',       // Amarillo
      en_preparacion: '#3b82f6', // Azul
      parcial: '#8b5cf6',        // Morado
      listo: '#22c55e',          // Verde
      servido: '#6b7280',        // Gris
      cancelado: '#ef4444',      // Rojo
    };
    return colores[estado] || '#6b7280';
  },

  getEstadoLabel(estado: EstadoComanda): string {
    const labels: Record<EstadoComanda, string> = {
      pendiente: 'Pendiente',
      en_preparacion: 'En preparacion',
      parcial: 'Parcial',
      listo: 'Listo',
      servido: 'Servido',
      cancelado: 'Cancelado',
    };
    return labels[estado] || estado;
  },

  getPrioridadColor(prioridad: PrioridadComanda): string {
    const colores: Record<PrioridadComanda, string> = {
      urgente: '#ef4444',
      normal: '#6b7280',
      baja: '#a1a1aa',
    };
    return colores[prioridad] || '#6b7280';
  },

  getTipoServicioLabel(tipo: TipoServicio): string {
    const labels: Record<TipoServicio, string> = {
      mesa: 'Mesa',
      barra: 'Barra',
      llevar: 'Para llevar',
      delivery: 'Delivery',
      recoger: 'Recoger',
    };
    return labels[tipo] || tipo;
  },

  formatTiempo(minutos: number): string {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  },
};
