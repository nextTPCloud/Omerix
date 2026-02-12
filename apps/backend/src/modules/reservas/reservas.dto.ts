// ============================================
// DTOs RESERVAS
// ============================================

export interface CreateReservaDTO {
  clienteId?: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  duracionMinutos?: number;
  comensales: number;
  salonId?: string;
  mesasIds?: string[];
  camareroId?: string;
  origen?: 'telefono' | 'web' | 'app' | 'presencial' | 'thefork' | 'google';
  notas?: string;
  notasInternas?: string;
  ocasionEspecial?: string;
  peticionesEspeciales?: string;
}

export interface UpdateReservaDTO extends Partial<CreateReservaDTO> {
  estado?: 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada' | 'no_show';
  motivoCancelacion?: string;
}

export interface FiltrosReservasDTO {
  fecha?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  salonId?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}

export interface DisponibilidadDTO {
  fecha: string;
  comensales: number;
  duracionMinutos?: number;
  salonId?: string;
}
