// ============================================
// DTOs CAMAREROS
// ============================================

export interface CreateCamareroDTO {
  usuarioId: string;
  personalId?: string;
  nombre: string;
  apellidos?: string;
  alias?: string;
  codigo: string;
  pin?: string;
  color?: string;
  foto?: string;
  salonesAsignados?: string[];
  mesasAsignadas?: string[];
  zonasPreparacion?: string[];
  turnosRRHHIds?: string[];
  turnos?: {
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
    horaInicio: string;
    horaFin: string;
    activo?: boolean;
  }[];
  comisionPorcentaje?: number;
  permisos?: {
    puedeAnularLineas?: boolean;
    puedeAplicarDescuentos?: boolean;
    puedeCobrar?: boolean;
    puedeReimprimir?: boolean;
    puedeTraspasar?: boolean;
    limiteDescuento?: number;
  };
  dispositivoAsignado?: string;
}

export interface UpdateCamareroDTO {
  nombre?: string;
  apellidos?: string;
  alias?: string;
  personalId?: string | null;
  pin?: string;
  color?: string;
  foto?: string;
  salonesAsignados?: string[];
  mesasAsignadas?: string[];
  zonasPreparacion?: string[];
  turnosRRHHIds?: string[];
  turnos?: {
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
    horaInicio: string;
    horaFin: string;
    activo?: boolean;
  }[];
  comisionPorcentaje?: number;
  permisos?: {
    puedeAnularLineas?: boolean;
    puedeAplicarDescuentos?: boolean;
    puedeCobrar?: boolean;
    puedeReimprimir?: boolean;
    puedeTraspasar?: boolean;
    limiteDescuento?: number;
  };
  dispositivoAsignado?: string;
  activo?: boolean;
}

export interface CambiarEstadoCamareroDTO {
  estado: 'activo' | 'en_descanso' | 'fuera_turno' | 'inactivo';
}

export interface AsignarSalonesDTO {
  salonesIds: string[];
}

export interface AsignarMesasDTO {
  mesasIds: string[];
}

export interface RegistrarPropinaDTO {
  importe: number;
  ventaId?: string;
  mesaId?: string;
}

export interface FiltrosCamarerosDTO {
  estado?: 'activo' | 'en_descanso' | 'fuera_turno' | 'inactivo';
  salonId?: string;
  activo?: boolean;
  busqueda?: string;
  page?: number;
  limit?: number;
}
