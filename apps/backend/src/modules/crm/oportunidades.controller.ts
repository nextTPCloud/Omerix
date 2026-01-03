import { Request, Response } from 'express';
import { oportunidadesService } from './oportunidades.service';
import mongoose from 'mongoose';
import {
  CreateOportunidadSchema,
  UpdateOportunidadSchema,
  CambiarEtapaOportunidadSchema,
  CerrarOportunidadSchema,
} from './crm.dto';

export class OportunidadesController {

  // ============================================
  // CREAR OPORTUNIDAD
  // ============================================

  async crear(req: Request, res: Response) {
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

      const validatedData = CreateOportunidadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const oportunidad = await oportunidadesService.crear(
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: oportunidad,
        message: 'Oportunidad creada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear oportunidad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear la oportunidad',
      });
    }
  }

  // ============================================
  // OBTENER TODAS
  // ============================================

  async obtenerTodas(req: Request, res: Response) {
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

      const filtros = {
        busqueda: req.query.busqueda as string,
        estado: req.query.estado as any,
        etapaId: req.query.etapaId as string,
        clienteId: req.query.clienteId as string,
        asignadoA: req.query.asignadoA as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        valorMinimo: req.query.valorMinimo ? parseFloat(req.query.valorMinimo as string) : undefined,
        valorMaximo: req.query.valorMaximo ? parseFloat(req.query.valorMaximo as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const { oportunidades, total, page, limit, totalPages } = await oportunidadesService.obtenerTodas(
        empresaId,
        req.empresaDbConfig,
        filtros
      );

      res.json({
        success: true,
        data: oportunidades,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener oportunidades:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las oportunidades',
      });
    }
  }

  // ============================================
  // OBTENER PIPELINE (KANBAN)
  // ============================================

  async obtenerPipeline(req: Request, res: Response) {
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

      const filtros = {
        asignadoA: req.query.asignadoA as string,
        clienteId: req.query.clienteId as string,
      };

      const pipeline = await oportunidadesService.obtenerPorEtapa(
        empresaId,
        req.empresaDbConfig,
        filtros
      );

      res.json({
        success: true,
        data: pipeline,
      });
    } catch (error: any) {
      console.error('Error al obtener pipeline:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el pipeline',
      });
    }
  }

  // ============================================
  // OBTENER POR ID
  // ============================================

  async obtenerPorId(req: Request, res: Response) {
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
      const oportunidad = await oportunidadesService.obtenerPorId(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!oportunidad) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      res.json({
        success: true,
        data: oportunidad,
      });
    } catch (error: any) {
      console.error('Error al obtener oportunidad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener la oportunidad',
      });
    }
  }

  // ============================================
  // ACTUALIZAR
  // ============================================

  async actualizar(req: Request, res: Response) {
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

      const validatedData = UpdateOportunidadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const oportunidad = await oportunidadesService.actualizar(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!oportunidad) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      res.json({
        success: true,
        data: oportunidad,
        message: 'Oportunidad actualizada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar oportunidad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar la oportunidad',
      });
    }
  }

  // ============================================
  // ELIMINAR
  // ============================================

  async eliminar(req: Request, res: Response) {
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
      const resultado = await oportunidadesService.eliminar(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Oportunidad eliminada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar oportunidad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar la oportunidad',
      });
    }
  }

  // ============================================
  // CAMBIAR ETAPA
  // ============================================

  async cambiarEtapa(req: Request, res: Response) {
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

      const validatedData = CambiarEtapaOportunidadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const oportunidad = await oportunidadesService.cambiarEtapa(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!oportunidad) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      res.json({
        success: true,
        data: oportunidad,
        message: 'Etapa actualizada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al cambiar etapa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar la etapa',
      });
    }
  }

  // ============================================
  // CERRAR OPORTUNIDAD
  // ============================================

  async cerrar(req: Request, res: Response) {
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

      const validatedData = CerrarOportunidadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const oportunidad = await oportunidadesService.cerrar(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!oportunidad) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      res.json({
        success: true,
        data: oportunidad,
        message: `Oportunidad marcada como ${validatedData.estado}`,
      });
    } catch (error: any) {
      console.error('Error al cerrar oportunidad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cerrar la oportunidad',
      });
    }
  }

  // ============================================
  // REABRIR OPORTUNIDAD
  // ============================================

  async reabrir(req: Request, res: Response) {
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

      const oportunidad = await oportunidadesService.reabrir(
        req.params.id,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!oportunidad) {
        return res.status(404).json({
          success: false,
          message: 'Oportunidad no encontrada',
        });
      }

      res.json({
        success: true,
        data: oportunidad,
        message: 'Oportunidad reabierta exitosamente',
      });
    } catch (error: any) {
      console.error('Error al reabrir oportunidad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al reabrir la oportunidad',
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
      const estadisticas = await oportunidadesService.obtenerEstadisticas(
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
  // OBTENER FORECAST
  // ============================================

  async obtenerForecast(req: Request, res: Response) {
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
      const meses = req.query.meses ? parseInt(req.query.meses as string) : 6;

      const forecast = await oportunidadesService.calcularForecast(
        empresaId,
        req.empresaDbConfig,
        meses
      );

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error: any) {
      console.error('Error al obtener forecast:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el forecast',
      });
    }
  }
}

export const oportunidadesController = new OportunidadesController();
