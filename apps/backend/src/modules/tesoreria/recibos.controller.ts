import { Request, Response, NextFunction } from 'express';
import { recibosService } from './recibos.service';
import { EstadoRecibo } from './Recibo';

export class RecibosController {
  /**
   * Obtener todos los recibos
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const filters = {
        q: req.query.q as string,
        estado: req.query.estado as EstadoRecibo,
        clienteId: req.query.clienteId as string,
        fechaDesde: req.query.fechaDesde as string,
        fechaHasta: req.query.fechaHasta as string,
        vencidos: req.query.vencidos as string,
        remesaId: req.query.remesaId as string,
        sinRemesa: req.query.sinRemesa as string,
        puedeEnviarABanco: req.query.puedeEnviarABanco as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
        sortBy: (req.query.sortBy as string) || 'fechaVencimiento',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = await recibosService.findAll(empresaId!, filters, dbConfig!);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener un recibo por ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { id } = req.params;

      const recibo = await recibosService.findOne(id, empresaId!, dbConfig!);
      res.json({ success: true, data: recibo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear un nuevo recibo
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const data = req.body;

      const recibo = await recibosService.create(
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.status(201).json({ success: true, data: recibo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generar recibos desde factura
   */
  async generarDesdeFactura(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const data = req.body;

      const recibos = await recibosService.generarDesdeFactura(
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.status(201).json({ success: true, data: recibos });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generar recibos desde vencimientos
   */
  async generarDesdeVencimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const data = req.body;

      const recibos = await recibosService.generarDesdeVencimientos(
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.status(201).json({ success: true, data: recibos });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar un recibo
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const data = req.body;

      const recibo = await recibosService.update(
        id,
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.json({ success: true, data: recibo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar recibo como enviado
   */
  async marcarEnviado(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const data = req.body;

      const recibo = await recibosService.marcarEnviado(
        id,
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.json({ success: true, data: recibo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar recibo como cobrado
   */
  async marcarCobrado(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const data = req.body;

      const recibo = await recibosService.marcarCobrado(
        id,
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.json({ success: true, data: recibo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marcar recibo como devuelto
   */
  async marcarDevuelto(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const data = req.body;

      const recibo = await recibosService.marcarDevuelto(
        id,
        empresaId!,
        usuario!._id.toString(),
        data,
        dbConfig!
      );

      res.json({ success: true, data: recibo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Anular un recibo
   */
  async anular(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const { id } = req.params;
      const { motivo } = req.body;

      const recibo = await recibosService.anular(
        id,
        empresaId!,
        usuario!._id.toString(),
        motivo,
        dbConfig!
      );

      res.json({ success: true, data: recibo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener recibos pendientes de envío a banco
   */
  async getPendientesEnvio(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;

      const recibos = await recibosService.getPendientesEnvio(empresaId!, dbConfig!);
      res.json({ success: true, data: recibos });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear remesa de recibos
   */
  async crearRemesa(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig, usuario } = req;
      const data = req.body;

      const remesa = await recibosService.crearRemesa(
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
   * Eliminar un recibo
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { empresaId, dbConfig } = req;
      const { id } = req.params;

      const result = await recibosService.delete(id, empresaId!, dbConfig!);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export const recibosController = new RecibosController();
