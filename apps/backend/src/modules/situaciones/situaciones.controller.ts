import { Request, Response } from 'express';
import { situacionesService } from './situaciones.service';
import mongoose from 'mongoose';
import { CreateSituacionSchema, UpdateSituacionSchema } from './situaciones.dto';

export class SituacionesController {

  // ============================================
  // CREAR SITUACION
  // ============================================

  async create(req: Request, res: Response) {
    try {
      // Validar autenticación
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      // Verificar que existe configuración de DB
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const validatedData = CreateSituacionSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const situacion = await situacionesService.crear(
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: situacion,
        message: 'Situación creada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear situación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear la situación',
      });
    }
  }

  // ============================================
  // OBTENER TODOS
  // ============================================

  async findAll(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      const { situaciones, total, page, limit, totalPages } = await situacionesService.findAll(
        empresaId,
        req.empresaDbConfig,
        req.query
      );

      res.json({
        success: true,
        data: situaciones,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener situaciones:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las situaciones',
      });
    }
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async findById(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const situacion = await situacionesService.findById(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!situacion) {
        return res.status(404).json({
          success: false,
          message: 'Situación no encontrada',
        });
      }

      res.json({
        success: true,
        data: situacion,
      });
    } catch (error: any) {
      console.error('Error al obtener situación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener la situación',
      });
    }
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async update(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const validatedData = UpdateSituacionSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const situacion = await situacionesService.actualizar(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!situacion) {
        return res.status(404).json({
          success: false,
          message: 'Situación no encontrada',
        });
      }

      res.json({
        success: true,
        data: situacion,
        message: 'Situación actualizada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar situación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar la situación',
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async delete(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const resultado = await situacionesService.eliminar(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Situación no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Situación eliminada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar situación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar la situación',
      });
    }
  }

  // ============================================
  // ELIMINACIÓN MÚLTIPLE
  // ============================================

  async bulkDelete(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de IDs',
        });
      }

      const count = await situacionesService.eliminarMultiples(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${count} situación(es) eliminada(s) exitosamente`,
        count,
      });
    } catch (error: any) {
      console.error('Error al eliminar situaciones:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar las situaciones',
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
  // ============================================

  async changeStatus(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);
      const { activo } = req.body;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo "activo" debe ser un booleano',
        });
      }

      const situacion = await situacionesService.cambiarEstado(
        req.params.id,
        activo,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!situacion) {
        return res.status(404).json({
          success: false,
          message: 'Situación no encontrada',
        });
      }

      res.json({
        success: true,
        data: situacion,
        message: `Situación ${activo ? 'activada' : 'desactivada'} exitosamente`,
      });
    } catch (error: any) {
      console.error('Error al cambiar situación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar la situación',
      });
    }
  }

  // ============================================
  // OBTENER ESTADÍSTICAS
  // ============================================

  async obtenerEstadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaId || !req.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const estadisticas = await situacionesService.obtenerEstadisticas(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las estadísticas',
      });
    }
  }
}

export const situacionesController = new SituacionesController();
