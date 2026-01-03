import { Request, Response } from 'express';
import { leadsService } from './leads.service';
import mongoose from 'mongoose';
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  ConvertirLeadSchema,
  FiltroLeadsSchema,
} from './crm.dto';
import { EstadoLead } from './Lead';

export class LeadsController {

  // ============================================
  // CREAR LEAD
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

      const validatedData = CreateLeadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const lead = await leadsService.crear(
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: lead,
        message: 'Lead creado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al crear lead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear el lead',
      });
    }
  }

  // ============================================
  // OBTENER TODOS
  // ============================================

  async obtenerTodos(req: Request, res: Response) {
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

      // Parsear query params
      const filtros = {
        busqueda: req.query.busqueda as string,
        estado: req.query.estado as EstadoLead,
        origen: req.query.origen as any,
        interes: req.query.interes as any,
        asignadoA: req.query.asignadoA as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const { leads, total, page, limit, totalPages } = await leadsService.obtenerTodos(
        empresaId,
        req.empresaDbConfig,
        filtros
      );

      res.json({
        success: true,
        data: leads,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener leads:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los leads',
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
      const lead = await leadsService.obtenerPorId(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead no encontrado',
        });
      }

      res.json({
        success: true,
        data: lead,
      });
    } catch (error: any) {
      console.error('Error al obtener lead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener el lead',
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

      const validatedData = UpdateLeadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const lead = await leadsService.actualizar(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead no encontrado',
        });
      }

      res.json({
        success: true,
        data: lead,
        message: 'Lead actualizado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar lead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al actualizar el lead',
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
      const resultado = await leadsService.eliminar(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Lead no encontrado',
        });
      }

      res.json({
        success: true,
        message: 'Lead eliminado exitosamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar lead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el lead',
      });
    }
  }

  // ============================================
  // ELIMINACIÓN MÚLTIPLE
  // ============================================

  async eliminarMultiples(req: Request, res: Response) {
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

      const count = await leadsService.eliminarMultiples(
        ids,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: `${count} lead(s) eliminado(s) exitosamente`,
        count,
      });
    } catch (error: any) {
      console.error('Error al eliminar leads:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar los leads',
      });
    }
  }

  // ============================================
  // CAMBIAR ESTADO
  // ============================================

  async cambiarEstado(req: Request, res: Response) {
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
      const { estado } = req.body;

      if (!estado || !Object.values(EstadoLead).includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido',
        });
      }

      const lead = await leadsService.cambiarEstado(
        req.params.id,
        estado,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead no encontrado',
        });
      }

      res.json({
        success: true,
        data: lead,
        message: 'Estado del lead actualizado',
      });
    } catch (error: any) {
      console.error('Error al cambiar estado del lead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cambiar el estado',
      });
    }
  }

  // ============================================
  // ASIGNAR
  // ============================================

  async asignar(req: Request, res: Response) {
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
      const { usuarioAsignadoId } = req.body;

      const lead = await leadsService.asignar(
        req.params.id,
        usuarioAsignadoId || null,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead no encontrado',
        });
      }

      res.json({
        success: true,
        data: lead,
        message: usuarioAsignadoId ? 'Lead asignado' : 'Asignación removida',
      });
    } catch (error: any) {
      console.error('Error al asignar lead:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al asignar el lead',
      });
    }
  }

  // ============================================
  // CONVERTIR
  // ============================================

  async convertir(req: Request, res: Response) {
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

      const validatedData = ConvertirLeadSchema.parse(req.body);

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      const resultado = await leadsService.convertir(
        req.params.id,
        validatedData,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: resultado,
        message: 'Lead convertido exitosamente',
      });
    } catch (error: any) {
      console.error('Error al convertir lead:', error);
      const status = error.message.includes('no encontrado') ? 404 :
                     error.message.includes('ya ha sido') ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Error al convertir el lead',
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
      const estadisticas = await leadsService.obtenerEstadisticas(
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
  // OBTENER PENDIENTES DE CONTACTO
  // ============================================

  async obtenerPendientesContacto(req: Request, res: Response) {
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
      const usuarioId = req.query.soloMios === 'true' ? req.userId : undefined;

      const leads = await leadsService.obtenerPendientesContacto(
        empresaId,
        req.empresaDbConfig,
        usuarioId
      );

      res.json({
        success: true,
        data: leads,
      });
    } catch (error: any) {
      console.error('Error al obtener leads pendientes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener los leads pendientes',
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

      const lead = await leadsService.duplicar(
        req.params.id,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: lead,
        message: 'Lead duplicado correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar lead:', error);
      res.status(error.message === 'Lead no encontrado' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al duplicar el lead',
      });
    }
  }
}

export const leadsController = new LeadsController();
