// ============================================
// INTERFACE DEPARTAMENTO
// ============================================

export interface Departamento {
  _id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  responsableId?: string;
  responsableNombre?: string;
  color?: string;
  orden: number;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ============================================
// DTOs
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

export interface UpdateDepartamentoDTO extends Partial<CreateDepartamentoDTO> {
  activo?: boolean;
}

// ============================================
// RESPUESTAS API
// ============================================

export interface DepartamentoResponse {
  success: boolean;
  data?: Departamento;
  message?: string;
  error?: string;
}

export interface DepartamentosListResponse {
  success: boolean;
  data: Departamento[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// COLORES PREDEFINIDOS
// ============================================

export const COLORES_DEPARTAMENTO = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Naranja' },
  { value: '#64748B', label: 'Gris' },
];
