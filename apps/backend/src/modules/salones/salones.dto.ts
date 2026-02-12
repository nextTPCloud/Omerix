/**
 * DTOs para Salones y Mesas
 */

// ============================================
// SALON DTOs
// ============================================

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
    permiteFumar?: boolean;
    tieneClimatizacion?: boolean;
    esExterior?: boolean;
    tieneMusica?: boolean;
    tieneTV?: boolean;
    accesibleMinusvalidos?: boolean;
    requiereReserva?: boolean;
    suplemento?: number;
  };
  orden?: number;
  activo?: boolean;
}

export interface UpdateSalonDTO extends Partial<CreateSalonDTO> {}

export interface SearchSalonesDTO {
  q?: string;
  activo?: boolean;
  almacenId?: string;
  tpvId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// MESA DTOs
// ============================================

export type EstadoMesa = 'libre' | 'ocupada' | 'reservada' | 'cuenta_pedida' | 'por_limpiar' | 'fuera_servicio';
export type FormaMesa = 'cuadrada' | 'rectangular' | 'redonda' | 'ovalada' | 'irregular';

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
  configuracion?: {
    prioridad?: number;
    esVIP?: boolean;
    esFumadores?: boolean;
    tieneEnchufe?: boolean;
    tieneVistas?: boolean;
    esAccesible?: boolean;
    requiereReserva?: boolean;
    tarifaEspecial?: string;
  };
  colores?: {
    fondo?: string;
    borde?: string;
    texto?: string;
  };
  orden?: number;
  activo?: boolean;
}

export interface UpdateMesaDTO extends Partial<CreateMesaDTO> {
  estadoInfo?: {
    pedidoId?: string;
    camareroId?: string;
    clienteNombre?: string;
    numComensales?: number;
    horaOcupacion?: Date;
    horaUltimaActualizacion?: Date;
    reservaId?: string;
    importePendiente?: number;
    notasServicio?: string;
  };
}

export interface SearchMesasDTO {
  q?: string;
  salonId?: string;
  estado?: EstadoMesa;
  activo?: boolean;
  esVIP?: boolean;
  camareroId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export interface MoverMesaDTO {
  x: number;
  y: number;
  rotacion?: number;
}

export interface AgruparMesasDTO {
  mesasIds: string[];
  mesaPrincipalId: string;
}
