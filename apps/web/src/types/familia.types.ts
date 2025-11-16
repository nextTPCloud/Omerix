export interface Familia {
  _id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  familiaPadreId?: string | null;
  familiaPadre?: Familia;
  orden: number;
  activo: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;

  // Campos calculados
  totalProductos?: number;
  nivel?: number;
  hijos?: Familia[];
}

export interface CreateFamiliaDTO {
  nombre: string;
  codigo?: string;
  descripcion?: string;
  familiaPadreId?: string;
  orden?: number;
  activo?: boolean;
}

export interface UpdateFamiliaDTO {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  familiaPadreId?: string;
  orden?: number;
  activo?: boolean;
}

export interface FamiliaEstadisticas {
  totalProductos: number;
  productosActivos: number;
  productosInactivos: number;
  subfamilias: number;
}

export interface FamiliaArbol extends Familia {
  children: FamiliaArbol[];
}

export interface FamiliasResponse {
  success: boolean;
  data: Familia[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FamiliaResponse {
  success: boolean;
  data: Familia;
  message?: string;
}

export interface FamiliaArbolResponse {
  success: boolean;
  data: FamiliaArbol[];
}

export interface FamiliaEstadisticasResponse {
  success: boolean;
  data: FamiliaEstadisticas;
}
