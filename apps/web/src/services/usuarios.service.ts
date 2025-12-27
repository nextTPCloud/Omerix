import { api } from './api';

/**
 * Roles del sistema (predefinidos)
 */
export type SystemRoleType = 'superadmin' | 'admin' | 'gerente' | 'vendedor' | 'tecnico' | 'almacenero' | 'visualizador';

/**
 * Tipos de roles disponibles (sistema + personalizados)
 */
export type RoleType = SystemRoleType | string;

/**
 * Interface del usuario
 */
/**
 * Personal populado cuando viene del backend
 */
export interface IPersonalPopulated {
  _id: string;
  codigo?: string;
  nombre: string;
  apellidos: string;
}

export interface IUsuario {
  _id: string;
  empresaId: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  avatar?: string;
  rol: RoleType;
  rolId?: string;
  rolCustom?: {
    _id: string;
    nombre: string;
    codigo: string;
    color?: string;
  };
  personalId?: string | IPersonalPopulated;  // Puede venir como string o populado
  activo: boolean;
  emailVerificado: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'app' | 'sms' | null;
  ultimoAcceso?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para crear un usuario
 */
export interface CreateUsuarioDTO {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  rol: Exclude<RoleType, 'superadmin'>;
  rolId?: string;
  activo?: boolean;
}

/**
 * DTO para actualizar un usuario
 */
export interface UpdateUsuarioDTO {
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  rol?: Exclude<RoleType, 'superadmin'>;
  rolId?: string | null;
  personalId?: string | null;  // Vinculación con empleado
  activo?: boolean;
  avatar?: string;
}

/**
 * Respuesta API estándar
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Información de rol disponible para asignar
 */
export interface RolDisponible {
  codigo: string; // Puede ser RoleType o código de rol personalizado
  nombre: string;
  nivel: number;
  esSistema?: boolean;
  _id?: string; // Solo para roles personalizados
  color?: string;
  descripcion?: string;
}

/**
 * Estadísticas de usuarios
 */
export interface EstadisticasUsuarios {
  total: number;
  activos: number;
  inactivos: number;
  porRol: { rol: string; count: number }[];
}

/**
 * Parámetros de filtrado para listar usuarios
 */
export interface UsuariosFilterParams {
  activo?: boolean;
  rol?: RoleType;
  busqueda?: string;
  page?: number;
  limit?: number;
}

class UsuariosService {
  private basePath = '/usuarios';

  /**
   * Obtener todos los usuarios de la empresa
   */
  async getAll(params?: UsuariosFilterParams): Promise<ApiResponse<IUsuario[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.activo !== undefined) queryParams.set('activo', String(params.activo));
      if (params?.rol) queryParams.set('rol', params.rol);
      if (params?.busqueda) queryParams.set('busqueda', params.busqueda);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.limit) queryParams.set('limit', String(params.limit));

      const url = queryParams.toString()
        ? `${this.basePath}?${queryParams.toString()}`
        : this.basePath;

      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener usuarios');
    }
  }

  /**
   * Obtener un usuario por ID
   */
  async getById(id: string): Promise<ApiResponse<IUsuario>> {
    try {
      const response = await api.get(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener usuario');
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getEstadisticas(): Promise<ApiResponse<EstadisticasUsuarios>> {
    try {
      const response = await api.get(`${this.basePath}/estadisticas`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }

  /**
   * Obtener roles disponibles para asignar según el rol del usuario actual
   */
  async getRolesDisponibles(): Promise<ApiResponse<RolDisponible[]>> {
    try {
      const response = await api.get(`${this.basePath}/roles-disponibles`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener roles disponibles');
    }
  }

  /**
   * Crear un nuevo usuario
   */
  async create(data: CreateUsuarioDTO): Promise<ApiResponse<IUsuario>> {
    try {
      const response = await api.post(this.basePath, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear usuario');
    }
  }

  /**
   * Actualizar un usuario
   */
  async update(id: string, data: UpdateUsuarioDTO): Promise<ApiResponse<IUsuario>> {
    try {
      const response = await api.put(`${this.basePath}/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar usuario');
    }
  }

  /**
   * Cambiar contraseña de un usuario
   */
  async changePassword(id: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.put(`${this.basePath}/${id}/password`, { newPassword });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cambiar contraseña');
    }
  }

  /**
   * Desactivar un usuario
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${this.basePath}/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al desactivar usuario');
    }
  }

  /**
   * Reactivar un usuario
   */
  async reactivar(id: string): Promise<ApiResponse<IUsuario>> {
    try {
      const response = await api.post(`${this.basePath}/${id}/reactivar`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al reactivar usuario');
    }
  }

  /**
   * Eliminar usuario permanentemente (solo superadmin)
   */
  async deletePermanente(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`${this.basePath}/${id}/permanente`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar usuario');
    }
  }

  /**
   * Obtener nombre descriptivo del rol
   */
  getNombreRol(rol: RoleType): string {
    const nombres: Record<SystemRoleType, string> = {
      superadmin: 'Super Administrador',
      admin: 'Administrador',
      gerente: 'Gerente',
      vendedor: 'Vendedor',
      tecnico: 'Técnico',
      almacenero: 'Almacenero',
      visualizador: 'Solo Lectura',
    };
    // Para roles del sistema, usar el nombre predefinido
    // Para roles personalizados, capitalizar el código
    return nombres[rol as SystemRoleType] || rol.charAt(0).toUpperCase() + rol.slice(1);
  }

  /**
   * Obtener color del badge según el rol
   */
  getColorRol(rol: RoleType): string {
    const colores: Record<SystemRoleType, string> = {
      superadmin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      gerente: 'bg-orange-100 text-orange-800',
      vendedor: 'bg-green-100 text-green-800',
      tecnico: 'bg-blue-100 text-blue-800',
      almacenero: 'bg-violet-100 text-violet-800',
      visualizador: 'bg-gray-100 text-gray-800',
    };
    // Para roles personalizados, usar un color neutro
    return colores[rol as SystemRoleType] || 'bg-cyan-100 text-cyan-800';
  }
}

export const usuariosService = new UsuariosService();
export default usuariosService;
