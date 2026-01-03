import { Request, Response } from 'express';
import { actividadesService } from './actividades.service';
import mongoose from 'mongoose';
import {
  CreateActividadSchema,
  UpdateActividadSchema,
  CompletarActividadSchema,
} from './crm.dto';

export class ActividadesController {

  // ============================================
  // CREAR ACTIVIDAD
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

      const validatedData = CreateActividadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const actividad = await actividadesService.crear(
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: actividad,
        message: 'Actividad creada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear actividad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear la actividad',
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
        leadId: req.query.leadId as string,
        oportunidadId: req.query.oportunidadId as string,
        clienteId: req.query.clienteId as string,
        tipo: req.query.tipo as any,
        completada: req.query.completada === 'true' ? true : req.query.completada === 'false' ? false : undefined,
        asignadoA: req.query.asignadoA as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        sortBy: (req.query.sortBy as string) || 'fechaProgramada',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const { actividades, total, page, limit, totalPages } = await actividadesService.obtenerTodas(
        empresaId,
        req.empresaDbConfig,
        filtros
      );

      res.json({
        success: true,
        data: actividades,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener actividades:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las actividades',
      });
    }
  }

  // ============================================
  // OBTENER PENDIENTES
  // ============================================

  async obtenerPendientes(req: Request, res: Response) {
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
      const usuarioId = req.query.soloMias === 'true' ? req.userId : undefined;

      const actividades = await actividadesService.obtenerPendientes(
        empresaId,
        req.empresaDbConfig,
        usuarioId
      );

      res.json({
        success: true,
        data: actividades,
      });
    } catch (error: any) {
      console.error('Error al obtener actividades pendientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las actividades',
      });
    }
  }

  // ============================================
  // OBTENER PRÓXIMAS
  // ============================================

  async obtenerProximas(req: Request, res: Response) {
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
      const usuarioId = req.query.soloMias === 'true' ? req.userId : undefined;
      const dias = req.query.dias ? parseInt(req.query.dias as string) : 2;

      const actividades = await actividadesService.obtenerProximas(
        empresaId,
        req.empresaDbConfig,
        usuarioId,
        dias
      );

      res.json({
        success: true,
        data: actividades,
      });
    } catch (error: any) {
      console.error('Error al obtener actividades próximas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las actividades',
      });
    }
  }

  // ============================================
  // OBTENER VENCIDAS
  // ============================================

  async obtenerVencidas(req: Request, res: Response) {
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
      const usuarioId = req.query.soloMias === 'true' ? req.userId : undefined;

      const actividades = await actividadesService.obtenerVencidas(
        empresaId,
        req.empresaDbConfig,
        usuarioId
      );

      res.json({
        success: true,
        data: actividades,
      });
    } catch (error: any) {
      console.error('Error al obtener actividades vencidas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las actividades',
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
      const actividad = await actividadesService.obtenerPorId(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!actividad) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
      }

      res.json({
        success: true,
        data: actividad,
      });
    } catch (error: any) {
      console.error('Error al obtener actividad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener la actividad',
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

      const validatedData = UpdateActividadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      const actividad = await actividadesService.actualizar(
        req.params.id,
        validatedData,
        empresaId,
        req.empresaDbConfig
      );

      if (!actividad) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
      }

      res.json({
        success: true,
        data: actividad,
        message: 'Actividad actualizada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar actividad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar la actividad',
      });
    }
  }

  // ============================================
  // COMPLETAR
  // ============================================

  async completar(req: Request, res: Response) {
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

      const validatedData = CompletarActividadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      const actividad = await actividadesService.completar(
        req.params.id,
        validatedData,
        empresaId,
        req.empresaDbConfig
      );

      if (!actividad) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
      }

      res.json({
        success: true,
        data: actividad,
        message: 'Actividad completada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al completar actividad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al completar la actividad',
      });
    }
  }

  // ============================================
  // DESCOMPLETAR
  // ============================================

  async descompletar(req: Request, res: Response) {
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

      const actividad = await actividadesService.descompletar(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!actividad) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
      }

      res.json({
        success: true,
        data: actividad,
        message: 'Actividad reabierta exitosamente',
      });
    } catch (error: any) {
      console.error('Error al descompletar actividad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al reabrir la actividad',
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
      const resultado = await actividadesService.eliminar(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Actividad no encontrada',
        });
      }

      res.json({
        success: true,
        message: 'Actividad eliminada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar actividad:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar la actividad',
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
      const usuarioId = req.query.soloMias === 'true' ? req.userId : undefined;

      const estadisticas = await actividadesService.obtenerEstadisticas(
        empresaId,
        req.empresaDbConfig,
        usuarioId
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

export const actividadesController = new ActividadesController();
