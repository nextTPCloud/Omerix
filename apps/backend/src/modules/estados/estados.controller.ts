import { Request, Response } from 'express';
import { estadosService } from './estados.service';
import mongoose from 'mongoose';
import { CreateEstadoSchema, UpdateEstadoSchema } from './estados.dto';

export class EstadosController {

  // ============================================
  // CREAR ESTADO
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

      const validatedData = CreateEstadoSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const estado = await estadosService.crear(
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: estado,
        message: 'Estado creado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear estado:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear el estado',
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

      const { estados, total, page, limit, totalPages } = await estadosService.findAll(
        empresaId,
        req.empresaDbConfig,
        req.query
      );

      res.json({
        success: true,
        data: estados,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener estados:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los estados',
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
      const estado = await estadosService.findById(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!estado) {
        return res.status(404).json({
          success: false,
          message: 'Estado no encontrado',
        });
      }

      res.json({
        success: true,
        data: estado,
      });
    } catch (error: any) {
      console.error('Error al obtener estado:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el estado',
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

      const validatedData = UpdateEstadoSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const estado = await estadosService.actualizar(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!estado) {
        return res.status(404).json({
          success: false,
          message: 'Estado no encontrado',
        });
      }

      res.json({
        success: true,
        data: estado,
        message: 'Estado actualizado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el estado',
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
      const resultado = await estadosService.eliminar(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Estado no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Estado eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar estado:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el estado',
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

      const count = await estadosService.eliminarMultiples(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${count} estado(s) eliminado(s) exitosamente`,
        count,
      });
    } catch (error: any) {
      console.error('Error al eliminar estados:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar los estados',
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

      const estado = await estadosService.cambiarEstado(
        req.params.id,
        activo,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!estado) {
        return res.status(404).json({
          success: false,
          message: 'Estado no encontrado',
        });
      }

      res.json({
        success: true,
        data: estado,
        message: `Estado ${activo ? 'activado' : 'desactivado'} exitosamente`,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar el estado',
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
      const estadisticas = await estadosService.obtenerEstadisticas(
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

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(req: Request, res: Response) {
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

      const estado = await estadosService.duplicar(
        req.params.id,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: estado,
        message: 'Estado duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar estado:', error);
      res.status(error.message === 'Estado no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al duplicar el estado',
      });
    }
  }
}

export const estadosController = new EstadosController();
