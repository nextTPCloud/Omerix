import { Request, Response } from 'express';
import { z } from 'zod';
import usuariosService, { ROLES_GESTION_USUARIOS } from './usuarios.service';
import { Role, ROLE_HIERARCHY } from '../../types/permissions.types';
import Rol from '../roles/Rol';
import UsuarioEmpresa from './UsuarioEmpresa';
import { Types } from 'mongoose';

// Roles del sistema (predefinidos)
const ROLES_SISTEMA = ['superadmin', 'admin', 'gerente', 'vendedor', 'tecnico', 'almacenero', 'visualizador'] as const;

// Schemas de validación
const CreateUsuarioSchema = z.object({
  email: z.string().email('Email inválido').max(100),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios').max(100),
  telefono: z.string().max(20).optional().nullable(),
  // Aceptar roles del sistema o roles personalizados (cualquier string)
  rol: z.string().min(1, 'El rol es obligatorio').max(50),
  rolId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

const UpdateUsuarioSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  apellidos: z.string().min(1).max(100).optional(),
  telefono: z.string().max(20).optional().nullable(),
  // Aceptar roles del sistema o roles personalizados (cualquier string)
  rol: z.string().min(1).max(50).optional(),
  rolId: z.string().optional().nullable(),
  personalId: z.string().optional().nullable(),
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

      // Ocultar superadmin si el usuario actual no es superadmin
      const ocultarSuperadmin = userRol !== 'superadmin';

      const result = await usuariosService.getUsuariosByEmpresa(
        empresaId,
        {
          activo: activo !== undefined ? activo === 'true' : undefined,
          rol: rol as Role,
          busqueda: busqueda as string,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 50,
        },
        ocultarSuperadmin
      );

      // Obtener las relaciones UsuarioEmpresa para todos los usuarios
      // para enriquecer con personalId (que ahora está en UsuarioEmpresa, no en Usuario)
      const usuarioIds = result.usuarios.map((u) => new Types.ObjectId(String(u._id)));
      const relacionesEmpresa = await UsuarioEmpresa.find({
        usuarioId: { $in: usuarioIds },
        empresaId: new Types.ObjectId(empresaId),
        activo: true,
      });

      // Crear mapa de usuarioId -> personalId
      const personalIdMap = new Map<string, string>();
      for (const rel of relacionesEmpresa) {
        if (rel.personalId) {
          personalIdMap.set(String(rel.usuarioId), String(rel.personalId));
        }
      }

      // Enriquecer usuarios con personalId de UsuarioEmpresa
      const usuariosEnriquecidos = result.usuarios.map((usuario) => ({
        ...usuario,
        personalId: personalIdMap.get(String(usuario._id)) || null,
      }));

      res.json({
        success: true,
        data: usuariosEnriquecidos,
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
   * Incluye roles del sistema y roles personalizados de la empresa
   */
  async getRolesDisponibles(req: Request, res: Response) {
    try {
      const userRol = req.userRole;
      const empresaId = req.empresaId;

      if (!userRol) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información del usuario',
        });
      }

      // 1. Obtener roles del sistema (según jerarquía del usuario)
      const rolesDelSistema = usuariosService.getRolesDisponibles(userRol as Role);
      const rolesConInfo = rolesDelSistema.map((rol) => ({
        codigo: rol,
        nombre: this.getNombreRol(rol),
        nivel: ROLE_HIERARCHY[rol],
        esSistema: true,
      }));

      // 2. Obtener roles personalizados de la empresa (si hay empresaId)
      if (empresaId) {
        const rolesPersonalizados = await Rol.find({
          empresaId,
          activo: true,
          esSistema: false, // Solo roles personalizados, no los del sistema duplicados
        }).sort({ orden: 1, nombre: 1 });

        // Añadir roles personalizados a la lista
        for (const rolCustom of rolesPersonalizados) {
          // Determinar el nivel basado en el rolBase o usar un nivel medio
          const nivelBase = rolCustom.rolBase ? (ROLE_HIERARCHY[rolCustom.rolBase as Role] || 3) : 3;

          rolesConInfo.push({
            codigo: rolCustom.codigo,
            nombre: rolCustom.nombre,
            nivel: nivelBase,
            esSistema: false,
            // @ts-ignore - campos adicionales para roles personalizados
            _id: rolCustom._id.toString(),
            color: rolCustom.color,
            descripcion: rolCustom.descripcion,
          });
        }
      }

      // Ordenar por nivel descendente
      rolesConInfo.sort((a, b) => b.nivel - a.nivel);

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

      // Obtener personalId de UsuarioEmpresa
      const relacionEmpresa = await UsuarioEmpresa.findOne({
        usuarioId: new Types.ObjectId(id),
        empresaId: new Types.ObjectId(empresaId),
        activo: true,
      });

      // Enriquecer con personalId de UsuarioEmpresa
      const usuarioConPersonalId = {
        ...usuario,
        personalId: relacionEmpresa?.personalId
          ? String(relacionEmpresa.personalId)
          : null,
      };

      res.json({
        success: true,
        data: usuarioConPersonalId,
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

      // Crear también el registro en UsuarioEmpresa para multi-tenancy
      await UsuarioEmpresa.create({
        usuarioId: new Types.ObjectId(String(usuario._id)),
        empresaId: new Types.ObjectId(empresaId),
        rol: validacion.data.rol,
        activo: true,
        esPrincipal: true, // Primera empresa es la principal
        fechaAsignacion: new Date(),
      });

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

      // Extraer personalId para guardarlo en UsuarioEmpresa (no en Usuario)
      const { personalId, ...datosUsuario } = validacion.data;

      const usuario = await usuariosService.updateUsuario(
        id,
        empresaId,
        {
          ...datosUsuario,
          telefono: datosUsuario.telefono || undefined,
          rolId: datosUsuario.rolId || undefined,
          avatar: datosUsuario.avatar || undefined,
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

      // Guardar personalId en UsuarioEmpresa (relación usuario-empresa)
      // Esto permite que un usuario tenga diferentes empleados vinculados en diferentes empresas
      if (personalId !== undefined) {
        const updateResult = await UsuarioEmpresa.findOneAndUpdate(
          {
            usuarioId: new Types.ObjectId(id),
            empresaId: new Types.ObjectId(empresaId),
          },
          {
            $set: {
              personalId: personalId ? new Types.ObjectId(personalId) : null,
            },
            $setOnInsert: {
              usuarioId: new Types.ObjectId(id),
              empresaId: new Types.ObjectId(empresaId),
              rol: usuario.rol || 'visualizador',
              activo: true,
              esPrincipal: false,
              fechaAsignacion: new Date(),
            },
          },
          { upsert: true, new: true }
        );
        console.log('[UsuariosController] UsuarioEmpresa actualizado:', {
          usuarioId: id,
          empresaId,
          personalId,
          result: updateResult?._id,
        });
      }

      // Obtener personalId actualizado de UsuarioEmpresa para la respuesta
      const relacionEmpresa = await UsuarioEmpresa.findOne({
        usuarioId: new Types.ObjectId(id),
        empresaId: new Types.ObjectId(empresaId),
        activo: true,
      });

      // Enriquecer respuesta con personalId de UsuarioEmpresa
      const usuarioConPersonalId = {
        ...usuario,
        personalId: relacionEmpresa?.personalId
          ? String(relacionEmpresa.personalId)
          : null,
      };

      res.json({
        success: true,
        data: usuarioConPersonalId,
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
