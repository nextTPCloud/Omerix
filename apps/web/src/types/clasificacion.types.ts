// Tipos para el módulo de Clasificaciones

export interface Clasificacion {
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

export interface CreateClasificacionDTO {
  nombre: string;
  activo?: boolean;
}

export interface UpdateClasificacionDTO {
  nombre?: string;
  activo?: boolean;
}

export interface ClasificacionesResponse {
  success: boolean;
  data: Clasificacion[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ClasificacionResponse {
  success: boolean;
  data: Clasificacion;
  message?: string;
}
