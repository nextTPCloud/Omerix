import { api } from './api';

// ============================================
// TIPOS - SALON
// ============================================

export interface Salon {
  _id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  color: string;
  icono?: string;
  plano?: {
    ancho: number;
    alto: number;
    imagenFondo?: string;
    escala: number;
  };
  capacidadTotal?: number;
  capacidadMesas?: number;
  almacenId?: string;
  almacen?: { _id: string; nombre: string };
  tpvsIds?: string[];
  tpvs?: Array<{ _id: string; nombre: string; codigo: string }>;
  zonasPreparacionIds?: string[];
  zonasPreparacion?: Array<{ _id: string; nombre: string; color: string }>;
  horarios?: {
    lunes?: { desde: string; hasta: string; cerrado?: boolean };
    martes?: { desde: string; hasta: string; cerrado?: boolean };
    miercoles?: { desde: string; hasta: string; cerrado?: boolean };
    jueves?: { desde: string; hasta: string; cerrado?: boolean };
    viernes?: { desde: string; hasta: string; cerrado?: boolean };
    sabado?: { desde: string; hasta: string; cerrado?: boolean };
    domingo?: { desde: string; hasta: string; cerrado?: boolean };
  };
  configuracion?: {
    permiteFumar: boolean;
    tieneClimatizacion: boolean;
    esExterior: boolean;
    tieneMusica: boolean;
    tieneTV: boolean;
    accesibleMinusvalidos: boolean;
    requiereReserva: boolean;
    suplemento?: number;
  };
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalonDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  plano?: {
    ancho?: number;
    alto?: number;
    imagenFondo?: string;
    escala?: number;
  };
  capacidadTotal?: number;
  capacidadMesas?: number;
  almacenId?: string;
  tpvsIds?: string[];
  zonasPreparacionIds?: string[];
  horarios?: Salon['horarios'];
  configuracion?: Salon['configuracion'];
  orden?: number;
  activo?: boolean;
}

export interface UpdateSalonDTO extends Partial<CreateSalonDTO> {}

// ============================================
// TIPOS - MESA
// ============================================

export type EstadoMesa = 'libre' | 'ocupada' | 'reservada' | 'cuenta_pedida' | 'por_limpiar' | 'fuera_servicio';
export type FormaMesa = 'cuadrada' | 'rectangular' | 'redonda' | 'ovalada' | 'irregular';

export interface Mesa {
  _id: string;
  numero: string;
  nombre?: string;
  salonId: string;
  salon?: { _id: string; nombre: string; color: string };
  posicion: {
    x: number;
    y: number;
    rotacion: number;
  };
  forma: FormaMesa;
  dimensiones: {
    ancho: number;
    alto: number;
  };
  capacidadMinima: number;
  capacidadMaxima: number;
  capacidadOptima?: number;
  estado: EstadoMesa;
  estadoInfo?: {
    pedidoId?: string;
    pedido?: { _id: string; codigo: string; total: number };
    camareroId?: string;
    camarero?: { _id: string; nombre: string; apellidos?: string };
    clienteNombre?: string;
    numComensales?: number;
    horaOcupacion?: string;
    horaUltimaActualizacion?: string;
    reservaId?: string;
    importePendiente?: number;
    notasServicio?: string;
  };
  configuracion?: {
    prioridad: number;
    esVIP: boolean;
    esFumadores: boolean;
    tieneEnchufe: boolean;
    tieneVistas: boolean;
    esAccesible: boolean;
    requiereReserva: boolean;
    tarifaEspecial?: string;
  };
  grupo?: {
    grupoId?: string;
    mesasPrincipales?: string[];
    esPrincipal: boolean;
  };
  colores?: {
    fondo?: string;
    borde?: string;
    texto?: string;
  };
  estadisticas?: {
    ocupacionesHoy: number;
    tiempoMedioOcupacion: number;
    importeMedioMesa: number;
    ultimaOcupacion?: string;
  };
  orden: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMesaDTO {
  numero: string;
  nombre?: string;
  salonId: string;
  posicion?: {
    x?: number;
    y?: number;
    rotacion?: number;
  };
  forma?: FormaMesa;
  dimensiones?: {
    ancho?: number;
    alto?: number;
  };
  capacidadMinima?: number;
  capacidadMaxima?: number;
  capacidadOptima?: number;
  estado?: EstadoMesa;
  configuracion?: Mesa['configuracion'];
  colores?: Mesa['colores'];
  orden?: number;
  activo?: boolean;
}

export interface UpdateMesaDTO extends Partial<CreateMesaDTO> {
  estadoInfo?: Mesa['estadoInfo'];
}

export interface CambiarEstadoMesaDTO {
  estado: EstadoMesa;
  pedidoId?: string;
  camareroId?: string;
  clienteNombre?: string;
  numComensales?: number;
  reservaId?: string;
  notasServicio?: string;
}

// ============================================
// TIPOS - ESTADISTICAS
// ============================================

export interface EstadisticasSalon {
  totalMesas: number;
  mesasLibres: number;
  mesasOcupadas: number;
  mesasReservadas: number;
  mesasPorLimpiar: number;
  mesasCuentaPedida: number;
  mesasFueraServicio: number;
  capacidadTotal: number;
  comensalesActuales: number;
  importePendienteTotal: number;
}

// ============================================
// RESPONSES
// ============================================

export interface SalonesResponse {
  success: boolean;
  data: Salon[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MesasResponse {
  success: boolean;
  data: Mesa[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// SERVICIO DE SALONES
// ============================================

export const salonesService = {
  // SALONES
  async getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    activo?: boolean;
    almacenId?: string;
    tpvId?: string;
  }): Promise<SalonesResponse> {
    const response = await api.get('/salones', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Salon }> {
    const response = await api.get(`/salones/${id}`);
    return response.data;
  },

  async create(data: CreateSalonDTO): Promise<{ success: boolean; data: Salon }> {
    const response = await api.post('/salones', data);
    return response.data;
  },

  async update(id: string, data: UpdateSalonDTO): Promise<{ success: boolean; data: Salon }> {
    const response = await api.put(`/salones/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/salones/${id}`);
    return response.data;
  },

  async getEstadisticas(salonId: string): Promise<{ success: boolean; data: EstadisticasSalon }> {
    const response = await api.get(`/salones/${salonId}/estadisticas`);
    return response.data;
  },

  async getMesasBySalon(salonId: string): Promise<{ success: boolean; data: Mesa[] }> {
    const response = await api.get(`/salones/${salonId}/mesas`);
    return response.data;
  },

  async sugerirSiguienteCodigo(prefijo: string = 'SAL'): Promise<{ success: boolean; data: { codigo: string } }> {
    const response = await api.get('/salones/siguiente-codigo', { params: { prefijo } });
    return response.data;
  },
};

// ============================================
// SERVICIO DE MESAS
// ============================================

export const mesasService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    q?: string;
    salonId?: string;
    estado?: EstadoMesa;
    activo?: boolean;
    esVIP?: boolean;
    camareroId?: string;
  }): Promise<MesasResponse> {
    const response = await api.get('/mesas', { params });
    return response.data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Mesa }> {
    const response = await api.get(`/mesas/${id}`);
    return response.data;
  },

  async create(data: CreateMesaDTO): Promise<{ success: boolean; data: Mesa }> {
    const response = await api.post('/mesas', data);
    return response.data;
  },

  async createBulk(salonId: string, cantidad: number, prefijo: string = ''): Promise<{ success: boolean; created: number; message: string }> {
    const response = await api.post('/mesas/bulk', { salonId, cantidad, prefijo });
    return response.data;
  },

  async update(id: string, data: UpdateMesaDTO): Promise<{ success: boolean; data: Mesa }> {
    const response = await api.put(`/mesas/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/mesas/${id}`);
    return response.data;
  },

  async cambiarEstado(id: string, data: CambiarEstadoMesaDTO): Promise<{ success: boolean; data: Mesa }> {
    const response = await api.put(`/mesas/${id}/estado`, data);
    return response.data;
  },

  async mover(id: string, x: number, y: number, rotacion?: number): Promise<{ success: boolean; data: Mesa }> {
    const response = await api.put(`/mesas/${id}/mover`, { x, y, rotacion });
    return response.data;
  },

  async actualizarPosiciones(mesas: Array<{ id: string; x: number; y: number; rotacion?: number }>): Promise<{ success: boolean; updated: number; message: string }> {
    const response = await api.put('/mesas/posiciones', { mesas });
    return response.data;
  },

  async agrupar(mesasIds: string[], mesaPrincipalId: string): Promise<{ success: boolean; grupoId: string; message: string }> {
    const response = await api.post('/mesas/agrupar', { mesasIds, mesaPrincipalId });
    return response.data;
  },

  async desagrupar(grupoId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/mesas/desagrupar/${grupoId}`);
    return response.data;
  },

  // Helpers
  getEstadoColor(estado: EstadoMesa): string {
    const colores: Record<EstadoMesa, string> = {
      libre: '#22c55e',           // Verde
      ocupada: '#ef4444',         // Rojo
      reservada: '#3b82f6',       // Azul
      cuenta_pedida: '#f59e0b',   // Amarillo
      por_limpiar: '#8b5cf6',     // Morado
      fuera_servicio: '#6b7280',  // Gris
    };
    return colores[estado] || '#6b7280';
  },

  getEstadoLabel(estado: EstadoMesa): string {
    const labels: Record<EstadoMesa, string> = {
      libre: 'Libre',
      ocupada: 'Ocupada',
      reservada: 'Reservada',
      cuenta_pedida: 'Cuenta pedida',
      por_limpiar: 'Por limpiar',
      fuera_servicio: 'Fuera de servicio',
    };
    return labels[estado] || estado;
  },
};
