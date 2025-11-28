// Tipos para el módulo de Estados

export interface Estado {
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

export interface CreateEstadoDTO {
  nombre: string;
  activo?: boolean;
}

export interface UpdateEstadoDTO {
  nombre?: string;
  activo?: boolean;
}

export interface EstadosResponse {
  success: boolean;
  data: Estado[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EstadoResponse {
  success: boolean;
  data: Estado;
  message?: string;
}
