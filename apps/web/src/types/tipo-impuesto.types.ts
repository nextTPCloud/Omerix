export type TipoImpuestoTipo = 'IVA' | 'IGIC' | 'IPSI' | 'OTRO';

export interface TipoImpuesto {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  porcentaje: number;
  tipo: TipoImpuestoTipo;
  recargoEquivalencia: boolean;
  porcentajeRecargo?: number;
  activo: boolean;
  predeterminado: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTipoImpuestoDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  porcentaje: number;
  tipo?: TipoImpuestoTipo;
  recargoEquivalencia?: boolean;
  porcentajeRecargo?: number;
  activo?: boolean;
  predeterminado?: boolean;
}

export interface UpdateTipoImpuestoDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  porcentaje?: number;
  tipo?: TipoImpuestoTipo;
  recargoEquivalencia?: boolean;
  porcentajeRecargo?: number;
  activo?: boolean;
  predeterminado?: boolean;
}

export interface TiposImpuestoResponse {
  success: boolean;
  data: TipoImpuesto[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TipoImpuestoResponse {
  success: boolean;
  data: TipoImpuesto;
  message?: string;
}
