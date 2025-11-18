export interface Direccion {
  calle: string;
  numero?: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
}

export interface Almacen {
  _id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  direccion?: Direccion;
  esPrincipal: boolean;
  activo: boolean;
  capacidadMaxima?: number;
  unidadCapacidad?: 'unidades' | 'kg' | 'm3' | 'litros';
  responsable?: string;
  telefono?: string;
  email?: string;
  usarEnTPV: boolean;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlmacenDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  direccion?: Direccion;
  esPrincipal?: boolean;
  activo?: boolean;
  capacidadMaxima?: number;
  unidadCapacidad?: 'unidades' | 'kg' | 'm3' | 'litros';
  responsable?: string;
  telefono?: string;
  email?: string;
  usarEnTPV?: boolean;
  notas?: string;
}

export interface UpdateAlmacenDTO {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  direccion?: Direccion;
  esPrincipal?: boolean;
  activo?: boolean;
  capacidadMaxima?: number;
  unidadCapacidad?: 'unidades' | 'kg' | 'm3' | 'litros';
  responsable?: string;
  telefono?: string;
  email?: string;
  usarEnTPV?: boolean;
  notas?: string;
}

export interface AlmacenesResponse {
  success: boolean;
  data: Almacen[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AlmacenResponse {
  success: boolean;
  data: Almacen;
  message?: string;
}
