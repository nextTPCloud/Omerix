import { api } from './api';
import { IRol, IPermisos, IPermisosEspeciales, RecursoSistema, AccionRecurso } from '@/types/permissions.types';

/**
 * DTO para crear un rol
 */
export interface CreateRolDTO {
  codigo: string;
  nombre: string;
  descripcion?: string;
  rolBase?: string;
  permisos?: Partial<IPermisos>;
  color?: string;
  icono?: string;
  orden?: number;
}

/**
 * DTO para actualizar un rol
 */
export interface UpdateRolDTO {
  nombre?: string;
  descripcion?: string;
  permisos?: Partial<IPermisos>;
  color?: string;
  icono?: string;
  orden?: number;
  activo?: boolean;
}

/**
 * Respuesta API estándar
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}

/**
 * Información de recursos disponibles
 */
export interface RecursoInfo {
  recurso: RecursoSistema;
  nombre: string;
  acciones: AccionRecurso[];
  grupo: string;
}

/**
 * Información de permisos especiales disponibles
 */
export interface PermisoEspecialInfo {
  codigo: keyof IPermisosEspeciales;
  nombre: string;
  descripcion: string;
  tipo: 'boolean' | 'number';
  grupo: string;
}

class RolesService {
  private basePath = '/roles';

  /**
   * Obtener todos los roles de la empresa
   */
  async getAll(params?: {
    activo?: boolean;
    incluirSistema?: boolean;
    busqueda?: string;
  }): Promise<ApiResponse<IRol[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.activo !== undefined) queryParams.set('activo', String(params.activo));
      if (params?.incluirSistema !== undefined) queryParams.set('incluirSistema', String(params.incluirSistema));
      if (params?.busqueda) queryParams.set('busqueda', params.busqueda);

      const url = queryParams.toString()
        ? `${this.basePath}?${queryParams.toString()}`
        : this.basePath;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener roles');
    }
  }

  /**
   * Obtener un rol por ID
   */
  async getById(id: string): Promise<ApiResponse<IRol>> {
    try {
      const response = await api.get(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener rol');
    }
  }

  /**
   * Obtener plantillas de roles del sistema
   */
  async getRolesSistema(): Promise<ApiResponse<Partial<IRol>[]>> {
    try {
      const response = await api.get(`${this.basePath}/sistema`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener roles del sistema');
    }
  }

  /**
   * Obtener lista de recursos y permisos disponibles
   */
  async getRecursos(): Promise<ApiResponse<{
    recursos: RecursoInfo[];
    especiales: PermisoEspecialInfo[];
  }>> {
    try {
      const response = await api.get(`${this.basePath}/recursos`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener recursos');
    }
  }

  /**
   * Crear un nuevo rol
   */
  async create(data: CreateRolDTO): Promise<ApiResponse<IRol>> {
    try {
      const response = await api.post(this.basePath, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear rol');
    }
  }

  /**
   * Actualizar un rol
   */
  async update(id: string, data: UpdateRolDTO): Promise<ApiResponse<IRol>> {
    try {
      const response = await api.put(`${this.basePath}/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar rol');
    }
  }

  /**
   * Eliminar un rol
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar rol');
    }
  }

  /**
   * Duplicar un rol
   */
  async duplicar(id: string, codigo: string, nombre: string): Promise<ApiResponse<IRol>> {
    try {
      const response = await api.post(`${this.basePath}/${id}/duplicar`, { codigo, nombre });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al duplicar rol');
    }
  }

  /**
   * Inicializar roles del sistema para la empresa
   */
  async inicializar(): Promise<ApiResponse<IRol[]>> {
    try {
      const response = await api.post(`${this.basePath}/inicializar`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al inicializar roles');
    }
  }
}

export const rolesService = new RolesService();
export default rolesService;
