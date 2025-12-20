import { Request, Response, NextFunction } from 'express';
import { pagaresService } from './pagares.service';
import { TipoPagare } from './Pagare';

export class PagaresController {
  /**
   * Obtener todos los pagarés
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const filters = {
        q: req.query.q as string,
        tipo: req.query.tipo as TipoPagare,
        estado: req.query.estado as string,
        terceroId: req.query.terceroId as string,
        terceroTipo: req.query.terceroTipo as 'cliente' | 'proveedor',
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        vencidos: req.query.vencidos as string,
        remesaId: req.query.remesaId as string,
        sinRemesa: req.query.sinRemesa as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
        sortBy: (req.query.sortBy as string) || 'fechaVencimiento',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = await pagaresService.findAll(empresaId!, filters, dbConfig!);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un pagaré por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { id } = req.params;

      const pagare = await pagaresService.findOne(id, empresaId!, dbConfig!);
      res.json({ success: true, data: pagare });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear un nuevo pagaré
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const data = req.body;

      const pagare = await pagaresService.create(
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.status(201).json({ success: true, data: pagare });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear pagaré desde vencimiento
   */
  async crearDesdeVencimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const data = req.body;

      const pagare = await pagaresService.crearDesdeVencimiento(
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.status(201).json({ success: true, data: pagare });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar un pagaré
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const data = req.body;

      const pagare = await pagaresService.update(
        id,
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.json({ success: true, data: pagare });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar pagaré como cobrado/pagado
   */
  async marcarCobrado(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const data = req.body;

      const pagare = await pagaresService.marcarCobrado(
        id,
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.json({ success: true, data: pagare });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar pagaré como devuelto
   */
  async marcarDevuelto(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const data = req.body;

      const pagare = await pagaresService.marcarDevuelto(
        id,
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.json({ success: true, data: pagare });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Anular un pagaré
   */
  async anular(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const { motivo } = req.body;

      const pagare = await pagaresService.anular(
        id,
        empresaId!,
        usuario!._id.toString(),
        motivo,
        dbConfig!
      );

      res.json({ success: true, data: pagare });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener próximos vencimientos
   */
  async getProximosVencimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const dias = parseInt(req.query.dias as string) || 7;
      const tipo = req.query.tipo as TipoPagare | undefined;

      const pagares = await pagaresService.getProximosVencimientos(
        empresaId!,
        dias,
        tipo,
        dbConfig!
      );

      res.json({ success: true, data: pagares });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener pagarés devueltos
   */
  async getDevueltos(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;

      const pagares = await pagaresService.getDevueltos(empresaId!, dbConfig!);
      res.json({ success: true, data: pagares });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear remesa de pagarés
   */
  async crearRemesa(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const data = req.body;

      const remesa = await pagaresService.crearRemesa(
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.status(201).json({ success: true, data: remesa });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar un pagaré
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { id } = req.params;

      const result = await pagaresService.delete(id, empresaId!, dbConfig!);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export const pagaresController = new PagaresController();
