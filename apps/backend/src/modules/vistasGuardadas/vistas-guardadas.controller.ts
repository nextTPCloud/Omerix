import { Request, Response } from 'express';
import VistasGuardadasService from './vistas-guardadas.service';
import {
  CreateVistaGuardadaSchema,
  UpdateVistaGuardadaSchema,
  GetVistasGuardadasQuerySchema,
} from './vistas-guardadas.dto';

/**
 * ============================================
 * VISTAS GUARDADAS CONTROLLER
 * ============================================
 */

class VistasGuardadasController {
  /**
   * @route   GET /api/vistas-guardadas
   * @desc    Obtener todas las vistas de un módulo
   * @access  Private
   */
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const validation = GetVistasGuardadasQuerySchema.safeParse(req.query);

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

      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const vistas = await VistasGuardadasService.findAll(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(200).json({
        success: true,
        data: vistas,
      });
    } catch (error: any) {
      console.error('Error al obtener vistas guardadas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las vistas guardadas',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   GET /api/vistas-guardadas/:id
   * @desc    Obtener una vista por ID
   * @access  Private
   */
  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const vista = await VistasGuardadasService.findById(
        id,
        usuarioId,
        empresaId
      );

      if (!vista) {
        res.status(404).json({
          success: false,
          message: 'Vista no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: vista,
      });
    } catch (error: any) {
      console.error('Error al obtener vista:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la vista',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   GET /api/vistas-guardadas/default/:modulo
   * @desc    Obtener la vista por defecto de un módulo
   * @access  Private
   */
  async findDefault(req: Request, res: Response): Promise<void> {
    try {
      const { modulo } = req.params;
      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const vista = await VistasGuardadasService.findDefault(
        usuarioId,
        empresaId,
        modulo
      );

      if (!vista) {
        res.status(404).json({
          success: false,
          message: 'No hay vista por defecto para este módulo',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: vista,
      });
    } catch (error: any) {
      console.error('Error al obtener vista por defecto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la vista por defecto',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   POST /api/vistas-guardadas
   * @desc    Crear una nueva vista
   * @access  Private
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validation = CreateVistaGuardadaSchema.safeParse(req.body);

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

      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const vista = await VistasGuardadasService.create(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(201).json({
        success: true,
        message: 'Vista creada correctamente',
        data: vista,
      });
    } catch (error: any) {
      console.error('Error al crear vista:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear la vista',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/vistas-guardadas/:id
   * @desc    Actualizar una vista
   * @access  Private
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validation = UpdateVistaGuardadaSchema.safeParse(req.body);

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

      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const vista = await VistasGuardadasService.update(
        id,
        usuarioId,
        empresaId,
        validation.data
      );

      if (!vista) {
        res.status(404).json({
          success: false,
          message: 'Vista no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Vista actualizada correctamente',
        data: vista,
      });
    } catch (error: any) {
      console.error('Error al actualizar vista:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la vista',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   DELETE /api/vistas-guardadas/:id
   * @desc    Eliminar una vista
   * @access  Private
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const deleted = await VistasGuardadasService.delete(
        id,
        usuarioId,
        empresaId
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Vista no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Vista eliminada correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar vista:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar la vista',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   POST /api/vistas-guardadas/:id/duplicate
   * @desc    Duplicar una vista
   * @access  Private
   */
  async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nuevoNombre } = req.body;
      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const vistaDuplicada = await VistasGuardadasService.duplicate(
        id,
        usuarioId,
        empresaId,
        nuevoNombre
      );

      if (!vistaDuplicada) {
        res.status(404).json({
          success: false,
          message: 'Vista no encontrada',
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Vista duplicada correctamente',
        data: vistaDuplicada,
      });
    } catch (error: any) {
      console.error('Error al duplicar vista:', error);
      res.status(500).json({
        success: false,
        message: 'Error al duplicar la vista',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/vistas-guardadas/:id/set-default
   * @desc    Establecer una vista como predeterminada
   * @access  Private
   */
  async setDefault(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const vista = await VistasGuardadasService.setDefault(
        id,
        usuarioId,
        empresaId
      );

      if (!vista) {
        res.status(404).json({
          success: false,
          message: 'Vista no encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Vista establecida como predeterminada',
        data: vista,
      });
    } catch (error: any) {
      console.error('Error al establecer vista por defecto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al establecer la vista por defecto',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }
}

export default new VistasGuardadasController();