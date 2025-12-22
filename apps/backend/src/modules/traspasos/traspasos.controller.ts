import { Request, Response, NextFunction } from 'express';
import { traspasosService } from './traspasos.service';
import {
  CreateTraspasoSchema,
  UpdateTraspasoSchema,
  ConfirmarSalidaSchema,
  ConfirmarRecepcionSchema,
  AnularTraspasoSchema,
  SearchTraspasosSchema,
} from './traspasos.dto';

export class TraspasosController {
  /**
   * Listar traspasos
   */
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters = SearchTraspasosSchema.parse(req.query);
      const result = await traspasosService.listar(filters, empresaId, req.empresaDbConfig);

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
   * Obtener traspaso por ID
   */
  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const traspaso = await traspasosService.obtenerPorId(req.params.id, empresaId, req.empresaDbConfig);
      if (!traspaso) {
        return res.status(404).json({ success: false, message: 'Traspaso no encontrado' });
      }

      res.json({ success: true, data: traspaso });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear traspaso
   */
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = CreateTraspasoSchema.parse(req.body);
      const traspaso = await traspasosService.crear(
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: traspaso,
        message: 'Traspaso creado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar traspaso
   */
  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = UpdateTraspasoSchema.parse(req.body);
      const traspaso = await traspasosService.actualizar(req.params.id, data, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data: traspaso,
        message: 'Traspaso actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirmar salida
   */
  async confirmarSalida(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = ConfirmarSalidaSchema.parse(req.body);
      const traspaso = await traspasosService.confirmarSalida(
        req.params.id,
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: traspaso,
        message: 'Salida confirmada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirmar recepción
   */
  async confirmarRecepcion(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = ConfirmarRecepcionSchema.parse(req.body);
      const traspaso = await traspasosService.confirmarRecepcion(
        req.params.id,
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: traspaso,
        message: 'Recepción confirmada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Anular traspaso
   */
  async anular(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = AnularTraspasoSchema.parse(req.body);
      const traspaso = await traspasosService.anular(
        req.params.id,
        data,
        usuarioId,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: traspaso,
        message: 'Traspaso anulado correctamente',
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
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const stats = await traspasosService.obtenerEstadisticas(empresaId, req.empresaDbConfig);

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const traspasosController = new TraspasosController();
