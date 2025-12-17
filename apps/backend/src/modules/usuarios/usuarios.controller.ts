import { Request, Response } from 'express';
import { z } from 'zod';
import usuariosService, { ROLES_GESTION_USUARIOS } from './usuarios.service';
import { Role, ROLE_HIERARCHY } from '../../types/permissions.types';

// Schemas de validación
const CreateUsuarioSchema = z.object({
  email: z.string().email('Email inválido').max(100),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios').max(100),
  telefono: z.string().max(20).optional().nullable(),
  rol: z.enum(['admin', 'gerente', 'vendedor', 'tecnico', 'almacenero', 'visualizador']),
  rolId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

const UpdateUsuarioSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  apellidos: z.string().min(1).max(100).optional(),
  telefono: z.string().max(20).optional().nullable(),
  rol: z.enum(['admin', 'gerente', 'vendedor', 'tecnico', 'almacenero', 'visualizador']).optional(),
  rolId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
  avatar: z.string().optional().nullable(),
});

const ChangePasswordSchema = z.object({
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

class UsuariosController {
  /**
   * Verificar que el usuario tiene rol de gestión de usuarios
   */
  private hasGestionUsuariosPermission(userRol: string): boolean {
    return ROLES_GESTION_USUARIOS.includes(userRol);
  }

  /**
   * GET /api/usuarios
   * Obtener todos los usuarios de la empresa
   */
  async getUsuarios(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      // Verificar permisos
      if (!userRol || !this.hasGestionUsuariosPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver usuarios',
        });
      }

      const { activo, rol, busqueda, page, limit } = req.query;

      const result = await usuariosService.getUsuariosByEmpresa(empresaId, {
        activo: activo !== undefined ? activo === 'true' : undefined,
        rol: rol as Role,
        busqueda: busqueda as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });

      res.json({
        success: true,
        data: result.usuarios,
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });
    } catch (error: any) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los usuarios',
      });
    }
  }

  /**
   * GET /api/usuarios/estadisticas
   * Obtener estadísticas de usuarios
   */
  async getEstadisticas(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionUsuariosPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver estadísticas de usuarios',
        });
      }

      const estadisticas = await usuariosService.getEstadisticas(empresaId);

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  /**
   * GET /api/usuarios/roles-disponibles
   * Obtener roles que puede asignar el usuario actual
   */
  async getRolesDisponibles(req: Request, res: Response) {
    try {
      const userRol = req.userRole;

      if (!userRol) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información del usuario',
        });
      }

      const roles = usuariosService.getRolesDisponibles(userRol as Role);

      // Añadir información adicional de cada rol
      const rolesConInfo = roles.map((rol) => ({
        codigo: rol,
        nombre: this.getNombreRol(rol),
        nivel: ROLE_HIERARCHY[rol],
      }));

      res.json({
        success: true,
        data: rolesConInfo,
      });
    } catch (error: any) {
      console.error('Error al obtener roles disponibles:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener roles disponibles',
      });
    }
  }

  /**
   * GET /api/usuarios/:id
   * Obtener un usuario por ID
   */
  async getUsuarioById(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const { id } = req.params;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionUsuariosPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver usuarios',
        });
      }

      const usuario = await usuariosService.getUsuarioById(id, empresaId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el usuario',
      });
    }
  }

  /**
   * POST /api/usuarios
   * Crear un nuevo usuario
   */
  async createUsuario(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionUsuariosPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear usuarios',
        });
      }

      const validacion = CreateUsuarioSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const usuario = await usuariosService.createUsuario(
        empresaId,
        {
          ...validacion.data,
          telefono: validacion.data.telefono || undefined,
          rolId: validacion.data.rolId || undefined,
        },
        userRol as Role
      );

      res.status(201).json({
        success: true,
        data: usuario,
        message: 'Usuario creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear el usuario',
      });
    }
  }

  /**
   * PUT /api/usuarios/:id
   * Actualizar un usuario
   */
  async updateUsuario(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const userId = req.userId;
      const { id } = req.params;

      if (!empresaId || !userId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa o usuario',
        });
      }

      if (!userRol || !this.hasGestionUsuariosPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar usuarios',
        });
      }

      const validacion = UpdateUsuarioSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const usuario = await usuariosService.updateUsuario(
        id,
        empresaId,
        {
          ...validacion.data,
          telefono: validacion.data.telefono || undefined,
          rolId: validacion.data.rolId || undefined,
          avatar: validacion.data.avatar || undefined,
        },
        userRol as Role,
        userId
      );

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      res.json({
        success: true,
        data: usuario,
        message: 'Usuario actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el usuario',
      });
    }
  }

  /**
   * PUT /api/usuarios/:id/password
   * Cambiar contraseña de un usuario (por admin)
   */
  async changePassword(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const { id } = req.params;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionUsuariosPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cambiar contraseñas',
        });
      }

      const validacion = ChangePasswordSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const success = await usuariosService.changePassword(
        id,
        empresaId,
        validacion.data.newPassword,
        userRol as Role
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Contraseña actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar la contraseña',
      });
    }
  }

  /**
   * DELETE /api/usuarios/:id
   * Desactivar un usuario
   */
  async deleteUsuario(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const userId = req.userId;
      const { id } = req.params;

      if (!empresaId || !userId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa o usuario',
        });
      }

      if (!userRol || !this.hasGestionUsuariosPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar usuarios',
        });
      }

      const success = await usuariosService.deleteUsuario(
        id,
        empresaId,
        userRol as Role,
        userId
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Usuario desactivado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el usuario',
      });
    }
  }

  /**
   * POST /api/usuarios/:id/reactivar
   * Reactivar un usuario desactivado
   */
  async reactivarUsuario(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const { id } = req.params;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionUsuariosPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para reactivar usuarios',
        });
      }

      const usuario = await usuariosService.reactivarUsuario(
        id,
        empresaId,
        userRol as Role
      );

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      res.json({
        success: true,
        data: usuario,
        message: 'Usuario reactivado correctamente',
      });
    } catch (error: any) {
      console.error('Error al reactivar usuario:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al reactivar el usuario',
      });
    }
  }

  /**
   * DELETE /api/usuarios/:id/permanente
   * Eliminar usuario permanentemente (solo superadmin)
   */
  async deleteUsuarioPermanente(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const { id } = req.params;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (userRol !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Solo superadmin puede eliminar usuarios permanentemente',
        });
      }

      const success = await usuariosService.deleteUsuarioPermanente(
        id,
        empresaId,
        userRol as Role
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Usuario eliminado permanentemente',
      });
    } catch (error: any) {
      console.error('Error al eliminar usuario permanentemente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el usuario',
      });
    }
  }

  // =========================================
  // HELPERS PRIVADOS
  // =========================================

  private getNombreRol(rol: Role): string {
    const nombres: Record<Role, string> = {
      superadmin: 'Super Administrador',
      admin: 'Administrador',
      gerente: 'Gerente',
      vendedor: 'Vendedor',
      tecnico: 'Técnico',
      almacenero: 'Almacenero',
      visualizador: 'Solo Lectura',
    };
    return nombres[rol] || rol;
  }
}

export const usuariosController = new UsuariosController();
export default usuariosController;
