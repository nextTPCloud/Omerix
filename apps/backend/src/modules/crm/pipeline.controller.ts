import { Request, Response } from 'express';
import { pipelineService } from './pipeline.service';
import mongoose from 'mongoose';
import {
  CreateEtapaPipelineSchema,
  UpdateEtapaPipelineSchema,
  ReordenarEtapasSchema,
} from './crm.dto';

export class PipelineController {

  // ============================================
  // CREAR ETAPA
  // ============================================

  async crearEtapa(req: Request, res: Response) {
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

      const validatedData = CreateEtapaPipelineSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      const etapa = await pipelineService.crearEtapa(
        validatedData,
        empresaId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: etapa,
        message: 'Etapa creada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear etapa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear la etapa',
      });
    }
  }

  // ============================================
  // OBTENER ETAPAS
  // ============================================

  async obtenerEtapas(req: Request, res: Response) {
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
      const soloActivas = req.query.activas !== 'false';

      const etapas = await pipelineService.obtenerEtapas(
        empresaId,
        req.empresaDbConfig,
        soloActivas
      );

      res.json({
        success: true,
        data: etapas,
      });
    } catch (error: any) {
      console.error('Error al obtener etapas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las etapas',
      });
    }
  }

  // ============================================
  // OBTENER ETAPAS CON ESTADÍSTICAS
  // ============================================

  async obtenerEtapasConEstadisticas(req: Request, res: Response) {
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

      const etapas = await pipelineService.obtenerEtapasConEstadisticas(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: etapas,
      });
    } catch (error: any) {
      console.error('Error al obtener etapas con estadísticas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener las etapas',
      });
    }
  }

  // ============================================
  // OBTENER ETAPA POR ID
  // ============================================

  async obtenerEtapaPorId(req: Request, res: Response) {
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
      const etapa = await pipelineService.obtenerEtapaPorId(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!etapa) {
        return res.status(404).json({
          success: false,
          message: 'Etapa no encontrada',
        });
      }

      res.json({
        success: true,
        data: etapa,
      });
    } catch (error: any) {
      console.error('Error al obtener etapa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener la etapa',
      });
    }
  }

  // ============================================
  // ACTUALIZAR ETAPA
  // ============================================

  async actualizarEtapa(req: Request, res: Response) {
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

      const validatedData = UpdateEtapaPipelineSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      const etapa = await pipelineService.actualizarEtapa(
        req.params.id,
        validatedData,
        empresaId,
        req.empresaDbConfig
      );

      if (!etapa) {
        return res.status(404).json({
          success: false,
          message: 'Etapa no encontrada',
        });
      }

      res.json({
        success: true,
        data: etapa,
        message: 'Etapa actualizada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar etapa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar la etapa',
      });
    }
  }

  // ============================================
  // ELIMINAR ETAPA
  // ============================================

  async eliminarEtapa(req: Request, res: Response) {
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
      const resultado = await pipelineService.eliminarEtapa(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!resultado.eliminada) {
        return res.status(400).json({
          success: false,
          message: resultado.error || 'No se pudo eliminar la etapa',
        });
      }

      res.json({
        success: true,
        message: 'Etapa eliminada exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar etapa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar la etapa',
      });
    }
  }

  // ============================================
  // REORDENAR ETAPAS
  // ============================================

  async reordenarEtapas(req: Request, res: Response) {
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

      const validatedData = ReordenarEtapasSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      await pipelineService.reordenarEtapas(
        validatedData,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: 'Etapas reordenadas exitosamente',
      });
    } catch (error: any) {
      console.error('Error al reordenar etapas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al reordenar las etapas',
      });
    }
  }

  // ============================================
  // INICIALIZAR PIPELINE POR DEFECTO
  // ============================================

  async inicializarPipelineDefault(req: Request, res: Response) {
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

      const etapas = await pipelineService.inicializarPipelineDefault(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: etapas,
        message: 'Pipeline inicializado correctamente',
      });
    } catch (error: any) {
      console.error('Error al inicializar pipeline:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al inicializar el pipeline',
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
  // ============================================

  async cambiarEstadoEtapa(req: Request, res: Response) {
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
      const { activo } = req.body;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo "activo" debe ser un booleano',
        });
      }

      const etapa = await pipelineService.cambiarEstadoEtapa(
        req.params.id,
        activo,
        empresaId,
        req.empresaDbConfig
      );

      if (!etapa) {
        return res.status(404).json({
          success: false,
          message: 'Etapa no encontrada',
        });
      }

      res.json({
        success: true,
        data: etapa,
        message: `Etapa ${activo ? 'activada' : 'desactivada'} exitosamente`,
      });
    } catch (error: any) {
      console.error('Error al cambiar estado de etapa:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar el estado de la etapa',
      });
    }
  }
}

export const pipelineController = new PipelineController();
