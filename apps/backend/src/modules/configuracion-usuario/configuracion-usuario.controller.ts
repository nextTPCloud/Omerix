import { Request, Response } from 'express';
import ConfiguracionUsuarioService from './configuracion-usuario.service';
import {
  GetModuleConfigQuerySchema,
  UpdateModuleConfigBodySchema,
  ResetModuleConfigBodySchema,
  UpdateColumnasBodySchema,
  UpdateSortConfigBodySchema,
  UpdateColumnFiltersBodySchema,
  UpdatePaginationLimitBodySchema,
  AddFavoritoBodySchema,
  RemoveFavoritoBodySchema,
  ReorderFavoritosBodySchema,
} from './configuracion-usuario.dto';
import { z } from 'zod';

/**
 * ============================================
 * CONFIGURACION USUARIO CONTROLLER
 * ============================================
 */

class ConfiguracionUsuarioController {
  /**
   * @route   GET /api/configuraciones
   * @desc    Obtener toda la configuración del usuario
   * @access  Private
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const configuracion = await ConfiguracionUsuarioService.findOrCreate(
        usuarioId,
        empresaId
      );

      res.status(200).json({
        success: true,
        data: configuracion,
      });
    } catch (error: any) {
      console.error('Error al obtener configuración:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la configuración del usuario',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   GET /api/configuraciones/modulo
   * @desc    Obtener configuración de un módulo específico
   * @access  Private
   */
  async getModuleConfig(req: Request, res: Response): Promise<void> {
    try {
      // Validar query params
      const validation = GetModuleConfigQuerySchema.safeParse(req.query);

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

      const { modulo } = validation.data;
      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const moduleConfig = await ConfiguracionUsuarioService.findModuleConfig(
        usuarioId,
        empresaId,
        modulo
      );

      res.status(200).json({
        success: true,
        data: moduleConfig,
      });
    } catch (error: any) {
      console.error('Error al obtener configuración del módulo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la configuración del módulo',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/configuraciones/modulo
   * @desc    Actualizar configuración completa de un módulo
   * @access  Private
   */
  async updateModuleConfig(req: Request, res: Response): Promise<void> {
    try {
      // Validar body
      const validation = UpdateModuleConfigBodySchema.safeParse(req.body);

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

      const configuracion = await ConfiguracionUsuarioService.updateModuleConfig(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Configuración del módulo actualizada correctamente',
        data: configuracion,
      });
    } catch (error: any) {
      console.error('Error al actualizar configuración del módulo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar la configuración del módulo',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   DELETE /api/configuraciones/modulo
   * @desc    Restablecer configuración de un módulo (eliminarla)
   * @access  Private
   */
  async resetModuleConfig(req: Request, res: Response): Promise<void> {
    try {
      // Validar body
      const validation = ResetModuleConfigBodySchema.safeParse(req.body);

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

      const configuracion = await ConfiguracionUsuarioService.resetModuleConfig(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Configuración del módulo restablecida correctamente',
        data: configuracion,
      });
    } catch (error: any) {
      console.error('Error al restablecer configuración del módulo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al restablecer la configuración del módulo',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/configuraciones/columnas
   * @desc    Actualizar solo las columnas de un módulo
   * @access  Private
   */
  async updateColumnas(req: Request, res: Response): Promise<void> {
    try {
      const validation = UpdateColumnasBodySchema.safeParse(req.body);

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

      const configuracion = await ConfiguracionUsuarioService.updateColumnas(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Columnas actualizadas correctamente',
        data: configuracion,
      });
    } catch (error: any) {
      console.error('Error al actualizar columnas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar las columnas',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/configuraciones/sort
   * @desc    Actualizar solo el ordenamiento de un módulo
   * @access  Private
   */
  async updateSortConfig(req: Request, res: Response): Promise<void> {
    try {
      const validation = UpdateSortConfigBodySchema.safeParse(req.body);

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

      const configuracion = await ConfiguracionUsuarioService.updateSortConfig(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Ordenamiento actualizado correctamente',
        data: configuracion,
      });
    } catch (error: any) {
      console.error('Error al actualizar ordenamiento:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el ordenamiento',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/configuraciones/filters
   * @desc    Actualizar solo los filtros de columna de un módulo
   * @access  Private
   */
  async updateColumnFilters(req: Request, res: Response): Promise<void> {
    try {
      const validation = UpdateColumnFiltersBodySchema.safeParse(req.body);

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

      const configuracion =
        await ConfiguracionUsuarioService.updateColumnFilters(
          usuarioId,
          empresaId,
          validation.data
        );

      res.status(200).json({
        success: true,
        message: 'Filtros actualizados correctamente',
        data: configuracion,
      });
    } catch (error: any) {
      console.error('Error al actualizar filtros:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar los filtros',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/configuraciones/pagination
   * @desc    Actualizar solo el límite de paginación de un módulo
   * @access  Private
   */
  async updatePaginationLimit(req: Request, res: Response): Promise<void> {
    try {
      const validation = UpdatePaginationLimitBodySchema.safeParse(req.body);

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

      const configuracion =
        await ConfiguracionUsuarioService.updatePaginationLimit(
          usuarioId,
          empresaId,
          validation.data
        );

      res.status(200).json({
        success: true,
        message: 'Límite de paginación actualizado correctamente',
        data: configuracion,
      });
    } catch (error: any) {
      console.error('Error al actualizar límite de paginación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el límite de paginación',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * ============================================
   * FAVORITOS
   * ============================================
   */

  /**
   * @route   GET /api/configuraciones/favoritos
   * @desc    Obtener favoritos del usuario
   * @access  Private
   */
  async getFavoritos(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req as any).userId;
      const empresaId = (req as any).empresaId;

      const favoritos = await ConfiguracionUsuarioService.getFavoritos(
        usuarioId,
        empresaId
      );

      res.status(200).json({
        success: true,
        data: favoritos,
      });
    } catch (error: any) {
      console.error('Error al obtener favoritos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los favoritos',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   POST /api/configuraciones/favoritos
   * @desc    Agregar un favorito
   * @access  Private
   */
  async addFavorito(req: Request, res: Response): Promise<void> {
    try {
      const validation = AddFavoritoBodySchema.safeParse(req.body);

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

      const configuracion = await ConfiguracionUsuarioService.addFavorito(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Favorito agregado correctamente',
        data: configuracion.favoritos,
      });
    } catch (error: any) {
      console.error('Error al agregar favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Error al agregar el favorito',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   DELETE /api/configuraciones/favoritos
   * @desc    Eliminar un favorito
   * @access  Private
   */
  async removeFavorito(req: Request, res: Response): Promise<void> {
    try {
      const validation = RemoveFavoritoBodySchema.safeParse(req.body);

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

      const configuracion = await ConfiguracionUsuarioService.removeFavorito(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Favorito eliminado correctamente',
        data: configuracion.favoritos,
      });
    } catch (error: any) {
      console.error('Error al eliminar favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el favorito',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }

  /**
   * @route   PUT /api/configuraciones/favoritos/reorder
   * @desc    Reordenar favoritos
   * @access  Private
   */
  async reorderFavoritos(req: Request, res: Response): Promise<void> {
    try {
      const validation = ReorderFavoritosBodySchema.safeParse(req.body);

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

      const configuracion = await ConfiguracionUsuarioService.reorderFavoritos(
        usuarioId,
        empresaId,
        validation.data
      );

      res.status(200).json({
        success: true,
        message: 'Favoritos reordenados correctamente',
        data: configuracion.favoritos,
      });
    } catch (error: any) {
      console.error('Error al reordenar favoritos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reordenar los favoritos',
        errors: [{ field: 'general', message: error.message }],
      });
    }
  }
}

export default new ConfiguracionUsuarioController();