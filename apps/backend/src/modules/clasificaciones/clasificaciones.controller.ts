import { Request, Response } from 'express';
import { clasificacionesService } from './clasificaciones.service';
import mongoose from 'mongoose';
import { CreateClasificacionSchema, UpdateClasificacionSchema } from './clasificaciones.dto';

export class ClasificacionesController {

  // ============================================
  // CREAR CLASIFICACION
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

      const validatedData = CreateClasificacionSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const clasificacion = await clasificacionesService.crear(
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: clasificacion,
        message: 'Clasificación creada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear clasificación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear la clasificación',
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

      const { clasificaciones, total, page, limit, totalPages } = await clasificacionesService.findAll(
        empresaId,
        req.empresaDbConfig,
        req.query
      );

      res.json({
        success: true,
        data: clasificaciones,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener clasificaciones:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las clasificaciones',
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
      const clasificacion = await clasificacionesService.findById(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!clasificacion) {
        return res.status(404).json({
          success: false,
          message: 'Clasificación no encontrada',
        });
      }

      res.json({
        success: true,
        data: clasificacion,
      });
    } catch (error: any) {
      console.error('Error al obtener clasificación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener la clasificación',
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

      const validatedData = UpdateClasificacionSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const clasificacion = await clasificacionesService.actualizar(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!clasificacion) {
        return res.status(404).json({
          success: false,
          message: 'Clasificación no encontrada',
        });
      }

      res.json({
        success: true,
        data: clasificacion,
        message: 'Clasificación actualizada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar clasificación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar la clasificación',
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
      const resultado = await clasificacionesService.eliminar(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Clasificación no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Clasificación eliminada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar clasificación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar la clasificación',
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

      const count = await clasificacionesService.eliminarMultiples(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${count} clasificación(es) eliminada(s) exitosamente`,
        count,
      });
    } catch (error: any) {
      console.error('Error al eliminar clasificaciones:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar las clasificaciones',
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

      const clasificacion = await clasificacionesService.cambiarEstado(
        req.params.id,
        activo,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!clasificacion) {
        return res.status(404).json({
          success: false,
          message: 'Clasificación no encontrada',
        });
      }

      res.json({
        success: true,
        data: clasificacion,
        message: `Clasificación ${activo ? 'activada' : 'desactivada'} exitosamente`,
      });
    } catch (error: any) {
      console.error('Error al cambiar clasificación:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar la clasificación',
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
      const estadisticas = await clasificacionesService.obtenerEstadisticas(
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

export const clasificacionesController = new ClasificacionesController();
