// ============================================
// DTOs FICHAJES
// ============================================

export interface CreateFichajeDTO {
  personalId: string;
  personalNombre?: string;
  personalCodigo?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  turnoId?: string;
  turnoNombre?: string;
  fecha?: string;
  horaEntrada?: string;
  tipo?: 'normal' | 'teletrabajo' | 'viaje' | 'formacion';
  ubicacionEntrada?: {
    latitud: number;
    longitud: number;
    direccion?: string;
  };
  ipEntrada?: string;
  observaciones?: string;
}

export interface RegistrarEntradaDTO {
  personalId: string;
  tipo?: 'normal' | 'teletrabajo' | 'viaje' | 'formacion';
  ubicacion?: {
    latitud: number;
    longitud: number;
    direccion?: string;
  };
  observaciones?: string;
}

export interface RegistrarSalidaDTO {
  fichajeId: string;
  ubicacion?: {
    latitud: number;
    longitud: number;
    direccion?: string;
  };
  observaciones?: string;
}

export interface RegistrarPausaDTO {
  fichajeId: string;
  tipo: 'inicio' | 'fin';
}

export interface UpdateFichajeDTO {
  horaEntrada?: string;
  horaSalida?: string;
  pausaInicio?: string;
  pausaFin?: string;
  tipo?: 'normal' | 'teletrabajo' | 'viaje' | 'formacion';
  estado?: 'abierto' | 'cerrado' | 'pendiente' | 'aprobado' | 'rechazado';
  observaciones?: string;
  incidencia?: string;
}

export interface FichajeQueryDTO {
  personalId?: string;
  departamentoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  tipo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
