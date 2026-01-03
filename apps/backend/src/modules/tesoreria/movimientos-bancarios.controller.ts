import { Request, Response, NextFunction } from 'express';
import { movimientosBancariosService, IFiltrosMovimientos } from './movimientos-bancarios.service';
import {
  TipoMovimiento,
  OrigenMovimiento,
  MetodoMovimiento,
} from './models/MovimientoBancario';

class MovimientosBancariosController {
  /**
   * Listar movimientos con filtros y paginación
   * GET /movimientos-bancarios
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      // Parsear filtros
      const filtros: IFiltrosMovimientos = {};

      if (req.query.tipo) filtros.tipo = req.query.tipo as TipoMovimiento;
      if (req.query.origen) {
        const origen = req.query.origen as string;
        filtros.origen = origen.includes(',')
          ? origen.split(',') as OrigenMovimiento[]
          : origen as OrigenMovimiento;
      }
      if (req.query.metodo) filtros.metodo = req.query.metodo as MetodoMovimiento;
      if (req.query.cuentaBancariaId) filtros.cuentaBancariaId = req.query.cuentaBancariaId as string;
      if (req.query.terceroId) filtros.terceroId = req.query.terceroId as string;
      if (req.query.tpvId) filtros.tpvId = req.query.tpvId as string;
      if (req.query.fechaDesde) filtros.fechaDesde = new Date(req.query.fechaDesde as string);
      if (req.query.fechaHasta) filtros.fechaHasta = new Date(req.query.fechaHasta as string);
      if (req.query.importeMin) filtros.importeMin = parseFloat(req.query.importeMin as string);
      if (req.query.importeMax) filtros.importeMax = parseFloat(req.query.importeMax as string);
      if (req.query.conciliado !== undefined) filtros.conciliado = req.query.conciliado === 'true';
      if (req.query.busqueda) filtros.busqueda = req.query.busqueda as string;

      // Parsear paginación
      const paginacion = {
        pagina: req.query.pagina ? parseInt(req.query.pagina as string, 10) : 1,
        limite: req.query.limite ? parseInt(req.query.limite as string, 10) : 50,
        ordenarPor: req.query.ordenarPor as string || 'fecha',
        orden: (req.query.orden as 'asc' | 'desc') || 'desc',
      };

      const resultado = await movimientosBancariosService.listar(empresaId, filtros, paginacion);

      res.json({
        success: true,
        data: resultado.movimientos,
        pagination: {
          total: resultado.total,
          page: resultado.pagina,
          limit: paginacion.limite,
          pages: resultado.totalPaginas,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un movimiento por ID
   * GET /movimientos-bancarios/:id
   */
  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const { id } = req.params;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const movimiento = await movimientosBancariosService.obtenerPorId(empresaId, id);

      if (!movimiento) {
        res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
        return;
      }

      res.json({ success: true, data: movimiento });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear un nuevo movimiento
   * POST /movimientos-bancarios
   */
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const usuarioId = (req as any).userId;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const datos = {
        ...req.body,
        usuarioId,
        fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
      };

      const movimiento = await movimientosBancariosService.crear(empresaId, datos);

      res.status(201).json({
        success: true,
        data: movimiento,
        message: 'Movimiento creado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Anular un movimiento
   * POST /movimientos-bancarios/:id/anular
   */
  async anular(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const usuarioId = (req as any).userId;
      const { id } = req.params;
      const { motivo } = req.body;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      if (!motivo) {
        res.status(400).json({ success: false, error: 'Debe indicar el motivo de anulación' });
        return;
      }

      const movimiento = await movimientosBancariosService.anular(empresaId, id, usuarioId, motivo);

      if (!movimiento) {
        res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
        return;
      }

      res.json({
        success: true,
        data: movimiento,
        message: 'Movimiento anulado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar como conciliado
   * POST /movimientos-bancarios/:id/conciliar
   */
  async conciliar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const { id } = req.params;
      const { movimientoExtractoId } = req.body;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const movimiento = await movimientosBancariosService.marcarConciliado(
        empresaId,
        id,
        movimientoExtractoId
      );

      if (!movimiento) {
        res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
        return;
      }

      res.json({
        success: true,
        data: movimiento,
        message: 'Movimiento conciliado correctamente',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas
   * GET /movimientos-bancarios/estadisticas
   */
  async estadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const fechaDesde = req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined;
      const fechaHasta = req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined;

      const estadisticas = await movimientosBancariosService.obtenerEstadisticas(
        empresaId,
        fechaDesde,
        fechaHasta
      );

      res.json({ success: true, data: estadisticas });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar movimientos de un TPV
   * GET /movimientos-bancarios/tpv/:tpvId
   */
  async listarPorTPV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const { tpvId } = req.params;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const fechaDesde = req.query.fechaDesde ? new Date(req.query.fechaDesde as string) : undefined;
      const fechaHasta = req.query.fechaHasta ? new Date(req.query.fechaHasta as string) : undefined;

      const movimientos = await movimientosBancariosService.listarPorTPV(
        empresaId,
        tpvId,
        fechaDesde,
        fechaHasta
      );

      res.json({ success: true, data: movimientos });
    } catch (error) {
      next(error);
    }
  }
}

export const movimientosBancariosController = new MovimientosBancariosController();
