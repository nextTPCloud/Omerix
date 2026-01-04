// apps/backend/src/modules/recordatorios/recordatorios.controller.ts

import { Request, Response, NextFunction } from 'express';
import { recordatoriosUnificadosService } from './recordatorios.service';
import { TipoRecordatorio, PrioridadRecordatorio, EstadoRecordatorio, CanalNotificacion } from './Recordatorio';

// ============================================
// CONTROLADOR DE RECORDATORIOS
// ============================================

export const recordatoriosController = {
  // ============================================
  // CRUD
  // ============================================

  /**
   * POST /recordatorios
   * Crear un recordatorio
   */
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const recordatorio = await recordatoriosUnificadosService.crear(
        req.empresaId!,
        req.user!.id,
        {
          tipo: req.body.tipo,
          prioridad: req.body.prioridad,
          titulo: req.body.titulo,
          mensaje: req.body.mensaje,
          icono: req.body.icono,
          color: req.body.color,
          entidadTipo: req.body.entidadTipo,
          entidadId: req.body.entidadId,
          entidadNombre: req.body.entidadNombre,
          fechaProgramada: new Date(req.body.fechaProgramada),
          repetir: req.body.repetir,
          frecuenciaRepeticion: req.body.frecuenciaRepeticion,
          finRepeticion: req.body.finRepeticion ? new Date(req.body.finRepeticion) : undefined,
          canales: req.body.canales,
          usuarioId: req.body.usuarioId,
          metadata: req.body.metadata,
        }
      );

      res.status(201).json({ success: true, data: recordatorio });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /recordatorios
   * Listar recordatorios
   */
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const filtros = {
        tipo: req.query.tipo as TipoRecordatorio | undefined,
        estado: req.query.estado as EstadoRecordatorio | undefined,
        prioridad: req.query.prioridad as PrioridadRecordatorio | undefined,
        fechaDesde: req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined,
        fechaHasta: req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined,
        entidadTipo: req.query.entidadTipo as string | undefined,
        entidadId: req.query.entidadId as string | undefined,
        soloNoLeidos: req.query.soloNoLeidos === 'true',
      };

      const paginacion = {
        pagina: parseInt(req.query.pagina as string) || 1,
        limite: parseInt(req.query.limite as string) || 20,
      };

      const resultado = await recordatoriosUnificadosService.listar(
        req.empresaId!,
        req.user!.id,
        filtros,
        paginacion
      );

      res.json({
        success: true,
        data: resultado.recordatorios,
        pagination: {
          total: resultado.total,
          pagina: paginacion.pagina,
          limite: paginacion.limite,
          totalPaginas: Math.ceil(resultado.total / paginacion.limite),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /recordatorios/pendientes
   * Obtener recordatorios pendientes próximos
   */
  async getPendientes(req: Request, res: Response, next: NextFunction) {
    try {
      const diasProximos = parseInt(req.query.dias as string) || 7;

      const recordatorios = await recordatoriosUnificadosService.getPendientes(
        req.empresaId!,
        req.user!.id,
        diasProximos
      );

      res.json({ success: true, data: recordatorios });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /recordatorios/contadores
   * Obtener contadores para el navbar
   */
  async getContadores(req: Request, res: Response, next: NextFunction) {
    try {
      const contadores = await recordatoriosUnificadosService.getContadores(
        req.empresaId!,
        req.user!.id
      );

      res.json({ success: true, data: contadores });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /recordatorios/:id/leido
   * Marcar como leído
   */
  async marcarLeido(req: Request, res: Response, next: NextFunction) {
    try {
      const recordatorio = await recordatoriosUnificadosService.marcarLeido(
        req.empresaId!,
        req.user!.id,
        req.params.id
      );

      if (!recordatorio) {
        return res.status(404).json({ success: false, message: 'Recordatorio no encontrado' });
      }

      res.json({ success: true, data: recordatorio });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /recordatorios/:id/completar
   * Marcar como completado
   */
  async completar(req: Request, res: Response, next: NextFunction) {
    try {
      const recordatorio = await recordatoriosUnificadosService.completar(
        req.empresaId!,
        req.user!.id,
        req.params.id
      );

      if (!recordatorio) {
        return res.status(404).json({ success: false, message: 'Recordatorio no encontrado' });
      }

      res.json({ success: true, data: recordatorio });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /recordatorios/:id/posponer
   * Posponer recordatorio
   */
  async posponer(req: Request, res: Response, next: NextFunction) {
    try {
      const { nuevaFecha } = req.body;

      if (!nuevaFecha) {
        return res.status(400).json({ success: false, message: 'nuevaFecha es requerida' });
      }

      const recordatorio = await recordatoriosUnificadosService.posponer(
        req.empresaId!,
        req.user!.id,
        req.params.id,
        new Date(nuevaFecha)
      );

      if (!recordatorio) {
        return res.status(404).json({ success: false, message: 'Recordatorio no encontrado' });
      }

      res.json({ success: true, data: recordatorio });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /recordatorios/:id/descartar
   * Descartar recordatorio
   */
  async descartar(req: Request, res: Response, next: NextFunction) {
    try {
      const recordatorio = await recordatoriosUnificadosService.descartar(
        req.empresaId!,
        req.user!.id,
        req.params.id
      );

      if (!recordatorio) {
        return res.status(404).json({ success: false, message: 'Recordatorio no encontrado' });
      }

      res.json({ success: true, data: recordatorio });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /recordatorios/:id
   * Eliminar recordatorio
   */
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const eliminado = await recordatoriosUnificadosService.eliminar(
        req.empresaId!,
        req.user!.id,
        req.params.id
      );

      if (!eliminado) {
        return res.status(404).json({ success: false, message: 'Recordatorio no encontrado' });
      }

      res.json({ success: true, message: 'Recordatorio eliminado' });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * GET /recordatorios/configuracion
   * Obtener configuración de alertas
   */
  async getConfiguracion(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await recordatoriosUnificadosService.getConfiguracion(
        req.empresaId!,
        req.user!.id
      );

      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /recordatorios/configuracion
   * Actualizar configuración de alertas
   */
  async actualizarConfiguracion(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await recordatoriosUnificadosService.actualizarConfiguracion(
        req.empresaId!,
        req.user!.id,
        req.body
      );

      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * GET /recordatorios/estadisticas
   * Obtener estadísticas
   */
  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await recordatoriosUnificadosService.getEstadisticas(
        req.empresaId!,
        req.user!.id
      );

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // ENUMS (para el frontend)
  // ============================================

  /**
   * GET /recordatorios/tipos
   * Obtener tipos de recordatorios disponibles
   */
  async getTipos(req: Request, res: Response, next: NextFunction) {
    try {
      const tipos = Object.entries(TipoRecordatorio).map(([key, value]) => ({
        key,
        value,
        label: key.replace(/_/g, ' ').toLowerCase(),
      }));

      const prioridades = Object.entries(PrioridadRecordatorio).map(([key, value]) => ({
        key,
        value,
        label: value,
      }));

      const estados = Object.entries(EstadoRecordatorio).map(([key, value]) => ({
        key,
        value,
        label: value,
      }));

      const canales = Object.entries(CanalNotificacion).map(([key, value]) => ({
        key,
        value,
        label: value,
      }));

      res.json({
        success: true,
        data: {
          tipos,
          prioridades,
          estados,
          canales,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default recordatoriosController;
