/**
 * DTOs para Comandas de Cocina
 */

export type EstadoComanda = 'pendiente' | 'en_preparacion' | 'parcial' | 'listo' | 'servido' | 'cancelado';
export type EstadoLinea = 'pendiente' | 'en_preparacion' | 'listo' | 'servido' | 'cancelado';
export type PrioridadComanda = 'normal' | 'urgente' | 'baja';
export type TipoServicio = 'mesa' | 'barra' | 'llevar' | 'delivery' | 'recoger';

export interface LineaComandaDTO {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  modificadores?: {
    modificadorId: string;
    nombre: string;
    precioExtra: number;
  }[];
  comentario?: string;
  alergenosNombres?: string[];
  tiempoEstimado?: number;
  prioridad?: PrioridadComanda;
}

export interface CreateComandaDTO {
  pedidoId?: string;
  mesaId?: string;
  zonaPreparacionId: string;
  numeroMesa?: string;
  numeroPedido?: string;
  cliente?: string;
  tipoServicio?: TipoServicio;
  lineas: LineaComandaDTO[];
  prioridad?: PrioridadComanda;
  tiempoObjetivo?: number;
  notas?: string;
  notasInternas?: string;
}

export interface UpdateComandaDTO {
  estado?: EstadoComanda;
  prioridad?: PrioridadComanda;
  notas?: string;
  notasInternas?: string;
}

export interface UpdateLineaComandaDTO {
  estado: EstadoLinea;
}

export interface SearchComandasDTO {
  zonaPreparacionId?: string;
  estado?: EstadoComanda;
  estados?: EstadoComanda[];
  prioridad?: PrioridadComanda;
  tipoServicio?: TipoServicio;
  mesaId?: string;
  pedidoId?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ComandasKDSDTO {
  zonaPreparacionId: string;
  estados?: EstadoComanda[];
  limit?: number;
}
