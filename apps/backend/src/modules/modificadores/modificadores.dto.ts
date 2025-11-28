/**
 * DTOs para el módulo de Modificadores de Producto
 */

export interface CreateModificadorDTO {
  grupoId?: string;
  nombre: string;
  nombreCorto?: string;
  codigo?: string;
  descripcion?: string;
  tipo?: 'gratis' | 'cargo' | 'descuento';
  precioExtra?: number;
  porcentaje?: number;
  aplicaA?: 'todos' | 'familias' | 'productos';
  familiasIds?: string[];
  productosIds?: string[];
  color?: string;
  icono?: string;
  orden?: number;
  mostrarEnTPV?: boolean;
  esMultiple?: boolean;
  cantidadMaxima?: number;
  obligatorio?: boolean;
  activo?: boolean;
}

export interface UpdateModificadorDTO extends Partial<CreateModificadorDTO> {}

export interface SearchModificadoresDTO {
  q?: string;
  grupoId?: string;
  tipo?: string;
  activo?: boolean;
  aplicaA?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
