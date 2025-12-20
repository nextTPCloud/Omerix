// ============================================
// CREAR DEPARTAMENTO
// ============================================

export interface CreateDepartamentoDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  responsableId?: string;
  responsableNombre?: string;
  color?: string;
  orden?: number;
}

// ============================================
// ACTUALIZAR DEPARTAMENTO
// ============================================

export interface UpdateDepartamentoDTO extends Partial<CreateDepartamentoDTO> {
  activo?: boolean;
}

// ============================================
// BUSCAR DEPARTAMENTOS
// ============================================

export interface SearchDepartamentosDTO {
  search?: string;
  activo?: 'true' | 'false' | 'all';
  responsableId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// RESPUESTAS
// ============================================

export interface DepartamentoResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface DepartamentosListResponse {
  success: boolean;
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
