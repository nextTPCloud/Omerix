/**
 * DTOs para el módulo de Grupos de Modificadores
 */

export interface CreateGrupoModificadoresDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  tipoSeleccion?: 'unico' | 'multiple';
  minimoSelecciones?: number;
  maximoSelecciones?: number;
  aplicaA?: 'todos' | 'familias' | 'productos';
  familiasIds?: string[];
  productosIds?: string[];
  color?: string;
  icono?: string;
  orden?: number;
  mostrarEnTPV?: boolean;
  colapsado?: boolean;
  activo?: boolean;
}

export interface UpdateGrupoModificadoresDTO extends Partial<CreateGrupoModificadoresDTO> {}

export interface SearchGruposModificadoresDTO {
  q?: string;
  activo?: boolean;
  aplicaA?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
