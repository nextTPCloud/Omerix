/**
 * DTOs para el módulo de Alérgenos
 */

export interface CreateAlergenoDTO {
  nombre: string;
  codigo: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  esObligatorioUE?: boolean;
  orden?: number;
  activo?: boolean;
}

export interface UpdateAlergenoDTO extends Partial<CreateAlergenoDTO> {}

export interface SearchAlergenosDTO {
  q?: string;
  activo?: boolean;
  esObligatorioUE?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
