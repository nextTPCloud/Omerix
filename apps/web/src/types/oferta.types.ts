// Tipos para el modulo de Ofertas/Promociones

export enum TipoOferta {
  NXM = 'nxm',
  SEGUNDA_UNIDAD = 'segunda_unidad',
  UNIDAD_GRATIS = 'unidad_gratis',
  DESCUENTO_PORCENTAJE = 'descuento_porcentaje',
  DESCUENTO_IMPORTE = 'descuento_importe',
  PRECIO_ESPECIAL = 'precio_especial',
  ESCALADO = 'escalado',
}

export const TipoOfertaLabels: Record<TipoOferta, string> = {
  [TipoOferta.NXM]: 'NxM (ej: 3x2)',
  [TipoOferta.SEGUNDA_UNIDAD]: '2a unidad',
  [TipoOferta.UNIDAD_GRATIS]: 'Unidad gratis',
  [TipoOferta.DESCUENTO_PORCENTAJE]: 'Descuento %',
  [TipoOferta.DESCUENTO_IMPORTE]: 'Descuento importe',
  [TipoOferta.PRECIO_ESPECIAL]: 'Precio especial',
  [TipoOferta.ESCALADO]: 'Descuento escalado',
};

export interface IEscalaDescuento {
  cantidadDesde: number;
  cantidadHasta?: number;
  descuento: number;
}

export interface IConfiguracionOferta {
  // NxM: 3x2
  cantidadLleva?: number;
  cantidadCompra?: number;

  // Segunda unidad
  descuentoSegundaUnidad?: number;
  descuentoTerceraUnidad?: number;

  // Unidad gratis
  cantidadParaGratis?: number;
  unidadesGratis?: number;
  productoGratisId?: string;

  // Descuentos
  descuento?: number;
  precioEspecial?: number;

  // Escalado
  escalas?: IEscalaDescuento[];

  // Condiciones
  cantidadMinima?: number;
  importeMinimo?: number;
}

export interface IOferta {
  _id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;

  tipo: TipoOferta;
  configuracion: IConfiguracionOferta;

  // Productos afectados
  aplicaATodos: boolean;
  productosIncluidos?: string[];
  productosExcluidos?: string[];
  familiasIncluidas?: string[];
  familiasExcluidas?: string[];

  // Vigencia
  fechaDesde: string;
  fechaHasta?: string;

  // Restricciones cliente
  aplicaATodosClientes: boolean;
  clientesIncluidos?: string[];
  clientesExcluidos?: string[];
  tarifasIncluidas?: string[];

  // Limites de uso
  usosMaximos?: number;
  usosPorCliente?: number;
  usosActuales: number;

  // Comportamiento
  acumulable: boolean;
  prioridad: number;
  activo: boolean;

  // Visual
  etiqueta?: string;
  color?: string;
  imagen?: string;

  creadoPor?: string;
  modificadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

// DTOs
export interface CreateOfertaDto {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoOferta;
  configuracion: IConfiguracionOferta;
  aplicaATodos?: boolean;
  productosIncluidos?: string[];
  productosExcluidos?: string[];
  familiasIncluidas?: string[];
  familiasExcluidas?: string[];
  fechaDesde: string;
  fechaHasta?: string;
  aplicaATodosClientes?: boolean;
  clientesIncluidos?: string[];
  clientesExcluidos?: string[];
  tarifasIncluidas?: string[];
  usosMaximos?: number;
  usosPorCliente?: number;
  acumulable?: boolean;
  prioridad?: number;
  activo?: boolean;
  etiqueta?: string;
  color?: string;
  imagen?: string;
}

export interface UpdateOfertaDto extends Partial<CreateOfertaDto> {}

// Query params
export interface GetOfertasQuery {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  activo?: boolean;
  tipo?: TipoOferta;
  vigente?: boolean;
}

// Respuestas
export interface OfertasResponse {
  success: boolean;
  data: IOferta[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OfertaResponse {
  success: boolean;
  data: IOferta;
  message?: string;
}

export interface OfertasVigentesResponse {
  success: boolean;
  data: IOferta[];
}
