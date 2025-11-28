// Tipos para el módulo de Situaciones

export interface Situacion {
  _id: string;
  nombre: string;
  activo: boolean;
  creadoPor?: string;
  modificadoPor?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSituacionDTO {
  nombre: string;
  activo?: boolean;
}

export interface UpdateSituacionDTO {
  nombre?: string;
  activo?: boolean;
}

export interface SituacionesResponse {
  success: boolean;
  data: Situacion[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SituacionResponse {
  success: boolean;
  data: Situacion;
  message?: string;
}
