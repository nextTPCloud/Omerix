// Tipos para el modulo de Tarifas

export interface IPrecioTarifa {
  _id?: string;
  productoId: string;
  productoNombre?: string;
  productoSku?: string;
  varianteId?: string;
  varianteSku?: string;
  precio?: number;
  descuentoPorcentaje?: number;
  activo: boolean;
}

export interface ITarifa {
  _id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;

  // Tipo de tarifa
  tipo: 'fija' | 'porcentaje';
  basePrecio: 'venta' | 'pvp';
  porcentajeGeneral?: number;

  // Precios especificos por producto
  precios: IPrecioTarifa[];

  // Vigencia
  fechaDesde?: string;
  fechaHasta?: string;

  // Restricciones por familia
  familiasIncluidas?: string[];
  familiasExcluidas?: string[];

  prioridad: number;
  activo: boolean;

  creadoPor?: string;
  modificadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

// DTOs
export interface CreateTarifaDto {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipo: 'fija' | 'porcentaje';
  basePrecio?: 'venta' | 'pvp';
  porcentajeGeneral?: number;
  precios?: Omit<IPrecioTarifa, '_id'>[];
  fechaDesde?: string;
  fechaHasta?: string;
  familiasIncluidas?: string[];
  familiasExcluidas?: string[];
  prioridad?: number;
  activo?: boolean;
}

export interface UpdateTarifaDto extends Partial<CreateTarifaDto> {}

export interface AddPrecioTarifaDto {
  productoId: string;
  varianteId?: string;
  precio?: number;
  descuentoPorcentaje?: number;
  activo?: boolean;
}

// Query params
export interface GetTarifasQuery {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  activo?: boolean;
  tipo?: 'fija' | 'porcentaje';
  vigente?: boolean;
}

// Respuestas
export interface TarifasResponse {
  success: boolean;
  data: ITarifa[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TarifaResponse {
  success: boolean;
  data: ITarifa;
  message?: string;
}

export interface TarifasActivasResponse {
  success: boolean;
  data: Pick<ITarifa, '_id' | 'codigo' | 'nombre' | 'tipo'>[];
}
