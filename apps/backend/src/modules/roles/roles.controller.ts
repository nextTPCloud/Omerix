import { Request, Response } from 'express';
import { z } from 'zod';
import rolesService, { ROLES_GESTION_ROLES } from './roles.service';

// Schemas de validación
const CreateRolSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio').max(50).regex(/^[a-z0-9_-]+$/, 'El código solo puede contener letras minúsculas, números, guiones y guiones bajos'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  descripcion: z.string().max(500).optional().nullable(),
  rolBase: z.enum(['admin', 'gerente', 'vendedor', 'tecnico', 'almacenero', 'visualizador']).optional(),
  permisos: z.object({
    recursos: z.record(z.array(z.enum(['create', 'read', 'update', 'delete', 'export', 'import']))).optional(),
    especiales: z.object({
      verCostes: z.boolean().optional(),
      verMargenes: z.boolean().optional(),
      verDatosFacturacion: z.boolean().optional(),
      modificarPVP: z.boolean().optional(),
      modificarPrecioCompra: z.boolean().optional(),
      aplicarDescuentos: z.boolean().optional(),
      descuentoMaximo: z.number().min(0).max(100).optional(),
      accederConfiguracion: z.boolean().optional(),
      gestionarUsuarios: z.boolean().optional(),
      gestionarRoles: z.boolean().optional(),
      exportarDatos: z.boolean().optional(),
      importarDatos: z.boolean().optional(),
      anularDocumentos: z.boolean().optional(),
      eliminarDocumentos: z.boolean().optional(),
      verHistorialCambios: z.boolean().optional(),
      accesoVentas: z.boolean().optional(),
      accesoCompras: z.boolean().optional(),
      accesoAlmacen: z.boolean().optional(),
      accesoContabilidad: z.boolean().optional(),
      accesoTPV: z.boolean().optional(),
      accesoCobroVencimientosTPV: z.boolean().optional(),
      accesoPagoVencimientosTPV: z.boolean().optional(),
    }).optional(),
  }).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido').optional(),
  icono: z.string().max(50).optional().nullable(),
  orden: z.number().int().min(0).optional(),
});

const UpdateRolSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  descripcion: z.string().max(500).optional().nullable(),
  permisos: z.object({
    recursos: z.record(z.array(z.enum(['create', 'read', 'update', 'delete', 'export', 'import']))).optional(),
    especiales: z.object({
      verCostes: z.boolean().optional(),
      verMargenes: z.boolean().optional(),
      verDatosFacturacion: z.boolean().optional(),
      modificarPVP: z.boolean().optional(),
      modificarPrecioCompra: z.boolean().optional(),
      aplicarDescuentos: z.boolean().optional(),
      descuentoMaximo: z.number().min(0).max(100).optional(),
      accederConfiguracion: z.boolean().optional(),
      gestionarUsuarios: z.boolean().optional(),
      gestionarRoles: z.boolean().optional(),
      exportarDatos: z.boolean().optional(),
      importarDatos: z.boolean().optional(),
      anularDocumentos: z.boolean().optional(),
      eliminarDocumentos: z.boolean().optional(),
      verHistorialCambios: z.boolean().optional(),
      accesoVentas: z.boolean().optional(),
      accesoCompras: z.boolean().optional(),
      accesoAlmacen: z.boolean().optional(),
      accesoContabilidad: z.boolean().optional(),
      accesoTPV: z.boolean().optional(),
      accesoCobroVencimientosTPV: z.boolean().optional(),
      accesoPagoVencimientosTPV: z.boolean().optional(),
    }).optional(),
  }).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icono: z.string().max(50).optional().nullable(),
  orden: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

const DuplicarRolSchema = z.object({
  codigo: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  nombre: z.string().min(1).max(100),
});

class RolesController {
  /**
   * Verificar que el usuario tiene rol de gestión de roles
   */
  private hasGestionRolesPermission(userRol: string): boolean {
    return ROLES_GESTION_ROLES.includes(userRol);
  }

  /**
   * GET /api/roles
   * Obtener todos los roles de la empresa
   */
  async getRoles(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      const { activo, incluirSistema, busqueda } = req.query;

      const roles = await rolesService.getRolesByEmpresa(empresaId, {
        activo: activo !== undefined ? activo === 'true' : undefined,
        incluirSistema: incluirSistema !== undefined ? incluirSistema === 'true' : true,
        busqueda: busqueda as string,
      });

      res.json({
        success: true,
        data: roles,
        total: roles.length,
      });
    } catch (error: any) {
      console.error('Error al obtener roles:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los roles',
      });
    }
  }

  /**
   * GET /api/roles/sistema
   * Obtener plantillas de roles del sistema
   */
  async getRolesSistema(_req: Request, res: Response) {
    try {
      const rolesSistema = rolesService.getRolesSistema();

      res.json({
        success: true,
        data: rolesSistema,
      });
    } catch (error: any) {
      console.error('Error al obtener roles del sistema:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener roles del sistema',
      });
    }
  }

  /**
   * GET /api/roles/recursos
   * Obtener lista de recursos y acciones disponibles
   */
  async getRecursos(_req: Request, res: Response) {
    try {
      const recursos = rolesService.getRecursosDisponibles();
      const especiales = rolesService.getPermisosEspecialesDisponibles();

      res.json({
        success: true,
        data: {
          recursos,
          especiales,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener recursos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener recursos',
      });
    }
  }

  /**
   * GET /api/roles/:id
   * Obtener un rol por ID
   */
  async getRolById(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const { id } = req.params;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      const rol = await rolesService.getRolById(id, empresaId);
      if (!rol) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado',
        });
      }

      res.json({
        success: true,
        data: rol,
      });
    } catch (error: any) {
      console.error('Error al obtener rol:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el rol',
      });
    }
  }

  /**
   * POST /api/roles
   * Crear un nuevo rol (solo admin)
   */
  async createRol(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const userId = req.userId;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRolesPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear roles',
        });
      }

      const validacion = CreateRolSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const rol = await rolesService.createRol(empresaId, validacion.data as any, userId);

      res.status(201).json({
        success: true,
        data: rol,
        message: 'Rol creado correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear rol:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear el rol',
      });
    }
  }

  /**
   * PUT /api/roles/:id
   * Actualizar un rol (solo admin)
   */
  async updateRol(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const userId = req.userId;
      const { id } = req.params;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRolesPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar roles',
        });
      }

      const validacion = UpdateRolSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const rol = await rolesService.updateRol(id, empresaId, validacion.data as any, userId);
      if (!rol) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado',
        });
      }

      res.json({
        success: true,
        data: rol,
        message: 'Rol actualizado correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar rol:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el rol',
      });
    }
  }

  /**
   * DELETE /api/roles/:id
   * Eliminar un rol (solo admin)
   */
  async deleteRol(req: Request, res: Response) {
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

      if (!userRol || !this.hasGestionRolesPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar roles',
        });
      }

      const eliminado = await rolesService.deleteRol(id, empresaId);
      if (!eliminado) {
        return res.status(404).json({
          success: false,
          message: 'Rol no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Rol eliminado correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar rol:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el rol',
      });
    }
  }

  /**
   * POST /api/roles/:id/duplicar
   * Duplicar un rol existente (solo admin)
   */
  async duplicarRol(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;
      const userId = req.userId;
      const { id } = req.params;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRolesPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para duplicar roles',
        });
      }

      const validacion = DuplicarRolSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const rol = await rolesService.duplicarRol(
        id,
        empresaId,
        validacion.data.codigo,
        validacion.data.nombre,
        userId
      );

      res.status(201).json({
        success: true,
        data: rol,
        message: 'Rol duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar rol:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al duplicar el rol',
      });
    }
  }

  /**
   * POST /api/roles/inicializar
   * Inicializar roles del sistema para la empresa (solo admin)
   */
  async inicializarRoles(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      const userRol = req.userRole;

      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No se encontró información de la empresa',
        });
      }

      if (!userRol || !this.hasGestionRolesPermission(userRol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para inicializar roles',
        });
      }

      const roles = await rolesService.initializeRolesEmpresa(empresaId);

      res.status(201).json({
        success: true,
        data: roles,
        message: `Se han inicializado ${roles.length} roles`,
      });
    } catch (error: any) {
      console.error('Error al inicializar roles:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al inicializar roles',
      });
    }
  }
}

export const rolesController = new RolesController();
export default rolesController;
