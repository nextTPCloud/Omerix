/**
 * DTOs para el módulo de Variantes
 */

export interface CreateValorVarianteDTO {
  valor: string;
  codigo?: string;
  hexColor?: string;
  imagen?: string;
  orden?: number;
  activo?: boolean;
}

export interface CreateVarianteDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  tipoVisualizacion?: 'botones' | 'dropdown' | 'colores' | 'imagenes';
  valores?: CreateValorVarianteDTO[];
  obligatorio?: boolean;
  aplicaA?: 'todos' | 'familias' | 'productos';
  familiasIds?: string[];
  orden?: number;
  activo?: boolean;
}

export interface UpdateVarianteDTO extends Partial<CreateVarianteDTO> {}

export interface SearchVariantesDTO {
  q?: string;
  activo?: boolean;
  tipoVisualizacion?: string;
  aplicaA?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
