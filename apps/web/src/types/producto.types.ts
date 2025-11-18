export interface ComponenteKit {
  _id?: string;
  productoId: string;
  producto?: {
    _id: string;
    nombre: string;
    sku: string;
  };
  cantidad: number;
  opcional: boolean;
  orden: number;
}

export interface Producto {
  _id: string;
  nombre: string;
  sku: string;
  descripcion?: string;
  familiaId?: string;
  familia?: {
    _id: string;
    nombre: string;
  };
  codigoBarras?: string;
  codigosAlternativos?: string[];

  // Tipo
  tipo?: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima';

  // Kit/Partidas
  componentesKit?: ComponenteKit[];

  // Precio
  precio: {
    base: number;
    venta: number;
    moneda?: string;
  };

  // Stock
  stock: {
    cantidad: number;
    minimo: number;
    maximo?: number;
  };

  // Variantes
  esVariante: boolean;
  productoBase?: string;
  atributos?: Array<{
    nombre: string;
    valor: string;
  }>;

  // Estado
  activo: boolean;
  visible: boolean;

  // Metadata
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductoDTO {
  nombre: string;
  sku: string;
  descripcion?: string;
  familiaId?: string;
  codigoBarras?: string;
  codigosAlternativos?: string[];
  tipo?: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima';
  componentesKit?: ComponenteKit[];
  precio: {
    base: number;
    venta: number;
    moneda?: string;
  };
  stock?: {
    cantidad?: number;
    minimo?: number;
    maximo?: number;
  };
  activo?: boolean;
  visible?: boolean;
}

export interface UpdateProductoDTO {
  nombre?: string;
  descripcion?: string;
  familiaId?: string;
  codigoBarras?: string;
  codigosAlternativos?: string[];
  tipo?: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima';
  componentesKit?: ComponenteKit[];
  precio?: {
    base?: number;
    venta?: number;
    moneda?: string;
  };
  stock?: {
    cantidad?: number;
    minimo?: number;
    maximo?: number;
  };
  activo?: boolean;
  visible?: boolean;
}

export interface UpdateStockDTO {
  cantidad: number;
  minimo?: number;
}

export interface GenerarVariantesDTO {
  atributos: Array<{
    nombre: string;
    valores: string[];
  }>;
}

export interface ProductosResponse {
  success: boolean;
  data: Producto[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductoResponse {
  success: boolean;
  data: Producto;
  message?: string;
}

export interface ProductosStockBajoResponse {
  success: boolean;
  data: Producto[];
}
