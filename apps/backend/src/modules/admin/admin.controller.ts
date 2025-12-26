import { Request, Response } from 'express';
import AdminService from './admin.service';
import {
  GetEmpresasQuerySchema,
  AdminUpdateEmpresaSchema,
  UpdateEmpresaEstadoSchema,
  CreateEmpresaSchema,
} from './admin.dto';

/**
 * ============================================
 * ADMIN CONTROLLER
 * ============================================
 */

class AdminController {
  /**
   * @route   GET /api/admin/empresas
   * @desc    Obtener todas las empresas (con paginación y filtros)
   * @access  Super Admin
   */
  async getAllEmpresas(req: Request, res: Response): Promise<void> {
    try {
      const validation = GetEmpresasQuerySchema.safeParse(req.query);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Parámetros de consulta inválidos',
          errors: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const result = await AdminService.getAllEmpresas(validation.data);

      res.status(200).json({
        success: true,
        data: result.empresas,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error al obtener empresas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las empresas',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   GET /api/admin/empresas/:id
   * @desc    Obtener detalles de una empresa
   * @access  Super Admin
   */
  async getEmpresaById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const empresa = await AdminService.getEmpresaById(id);

      if (!empresa) {
        res.status(404).json({
          success: false,
          message: 'Empresa no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: empresa,
      });
    } catch (error: any) {
      console.error('Error al obtener empresa:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la empresa',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/admin/empresas/:id/estado
   * @desc    Actualizar estado de una empresa (activar/suspender/cancelar)
   * @access  Super Admin
   */
  async updateEmpresaEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validation = UpdateEmpresaEstadoSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const adminId = (req as any).userId;

      const empresa = await AdminService.updateEmpresaEstado(
        id,
        validation.data,
        adminId
      );

      if (!empresa) {
        res.status(404).json({
          success: false,
          message: 'Empresa no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Estado de empresa actualizado',
        data: empresa,
      });
    } catch (error: any) {
      console.error('Error al actualizar estado de empresa:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el estado',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/admin/empresas/:id
   * @desc    Actualizar datos de una empresa
   * @access  Super Admin
   */
  async updateEmpresa(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validation = AdminUpdateEmpresaSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const empresa = await AdminService.updateEmpresa(id, validation.data);

      if (!empresa) {
        res.status(404).json({
          success: false,
          message: 'Empresa no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Empresa actualizada correctamente',
        data: empresa,
      });
    } catch (error: any) {
      console.error('Error al actualizar empresa:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la empresa',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   GET /api/admin/stats
   * @desc    Obtener estadísticas generales del sistema
   * @access  Super Admin
   */
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await AdminService.getSystemStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   DELETE /api/admin/empresas/:id
   * @desc    Eliminar una empresa completamente
   * @access  Super Admin
   */
  async deleteEmpresa(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await AdminService.deleteEmpresa(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Empresa no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Empresa eliminada correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar empresa:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la empresa',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   POST /api/admin/empresas
   * @desc    Crear una nueva empresa de negocio (para superadmin)
   * @access  Super Admin
   */
  async createEmpresa(req: Request, res: Response): Promise<void> {
    try {
      const validation = CreateEmpresaSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: validation.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      const superadminId = (req as any).userId;

      const result = await AdminService.createEmpresa(validation.data, superadminId);

      res.status(201).json({
        success: true,
        message: 'Empresa creada exitosamente',
        data: result,
      });
    } catch (error: any) {
      console.error('Error al crear empresa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear la empresa',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }
}

export default new AdminController();