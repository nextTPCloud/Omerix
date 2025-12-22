import { Request, Response, NextFunction } from 'express';
import { tareasService } from './tareas.service';
import {
  CreateTareaSchema,
  UpdateTareaSchema,
  CambiarEstadoTareaSchema,
  AgregarComentarioSchema,
  SearchTareasSchema,
} from './tareas.dto';

export class TareasController {
  /**
   * Listar tareas
   */
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters = SearchTareasSchema.parse(req.query);
      const result = await tareasService.listar(filters, usuarioId, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener tarea por ID
   */
  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const tarea = await tareasService.obtenerPorId(req.params.id, empresaId, req.empresaDbConfig);
      if (!tarea) {
        return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
      }

      res.json({ success: true, data: tarea });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear tarea
   */
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = CreateTareaSchema.parse(req.body);
      const tarea = await tareasService.crear(
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: tarea,
        message: 'Tarea creada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar tarea
   */
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = UpdateTareaSchema.parse(req.body);
      const tarea = await tareasService.actualizar(req.params.id, data, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data: tarea,
        message: 'Tarea actualizada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cambiar estado
   */
  async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = CambiarEstadoTareaSchema.parse(req.body);
      const tarea = await tareasService.cambiarEstado(
        req.params.id,
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: tarea,
        message: 'Estado actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Agregar comentario
   */
  async agregarComentario(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = AgregarComentarioSchema.parse(req.body);
      const tarea = await tareasService.agregarComentario(
        req.params.id,
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: tarea,
        message: 'Comentario agregado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar tarea
   */
  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      await tareasService.eliminar(req.params.id, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        message: 'Tarea eliminada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas
   */
  async estadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const stats = await tareasService.obtenerEstadisticas(usuarioId, empresaId, req.empresaDbConfig);

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener tareas para widget
   */
  async widget(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const tareas = await tareasService.obtenerParaWidget(usuarioId, empresaId, req.empresaDbConfig);

      res.json({ success: true, data: tareas });
    } catch (error) {
      next(error);
    }
  }
}

export const tareasController = new TareasController();
