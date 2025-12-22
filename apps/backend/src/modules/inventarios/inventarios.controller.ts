import { Request, Response, NextFunction } from 'express';
import { inventariosService } from './inventarios.service';
import {
  CreateInventarioSchema,
  IniciarInventarioSchema,
  ActualizarConteoSchema,
  ConteoLineaSchema,
  RevisarDiferenciasSchema,
  RegularizarInventarioSchema,
  AnularInventarioSchema,
  SearchInventariosSchema,
} from './inventarios.dto';

export class InventariosController {
  /**
   * Listar inventarios
   */
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters = SearchInventariosSchema.parse(req.query);
      const result = await inventariosService.listar(filters, empresaId, req.empresaDbConfig);

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
   * Obtener inventario por ID
   */
  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const inventario = await inventariosService.obtenerPorId(req.params.id, empresaId, req.empresaDbConfig);
      if (!inventario) {
        return res.status(404).json({ success: false, message: 'Inventario no encontrado' });
      }

      res.json({ success: true, data: inventario });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear inventario
   */
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = CreateInventarioSchema.parse(req.body);
      const inventario = await inventariosService.crear(
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: inventario,
        message: 'Inventario creado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Iniciar inventario
   */
  async iniciar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = IniciarInventarioSchema.parse(req.body);
      const inventario = await inventariosService.iniciar(
        req.params.id,
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: inventario,
        message: 'Inventario iniciado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar conteos
   */
  async actualizarConteos(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = ActualizarConteoSchema.parse(req.body);
      const inventario = await inventariosService.actualizarConteos(
        req.params.id,
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: inventario,
        message: 'Conteos actualizados correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar conteo de una línea
   */
  async actualizarConteoLinea(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = ConteoLineaSchema.parse(req.body);
      const inventario = await inventariosService.actualizarConteoLinea(
        req.params.id,
        req.params.lineaId,
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: inventario,
        message: 'Conteo actualizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Finalizar conteo
   */
  async finalizarConteo(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const inventario = await inventariosService.finalizarConteo(
        req.params.id,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: inventario,
        message: 'Conteo finalizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revisar diferencias
   */
  async revisarDiferencias(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = RevisarDiferenciasSchema.parse(req.body);
      const inventario = await inventariosService.revisarDiferencias(
        req.params.id,
        data,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: inventario,
        message: 'Diferencias revisadas correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regularizar inventario
   */
  async regularizar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = RegularizarInventarioSchema.parse(req.body);
      const inventario = await inventariosService.regularizar(
        req.params.id,
        data,
        usuarioId,
        req.usuario?.nombre || 'Sistema',
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: inventario,
        message: 'Inventario regularizado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Anular inventario
   */
  async anular(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.usuarioId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const data = AnularInventarioSchema.parse(req.body);
      const inventario = await inventariosService.anular(
        req.params.id,
        data,
        usuarioId,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: inventario,
        message: 'Inventario anulado correctamente',
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

      const stats = await inventariosService.obtenerEstadisticas(empresaId, req.empresaDbConfig);

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const inventariosController = new InventariosController();
