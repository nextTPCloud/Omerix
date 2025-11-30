import { Request, Response, NextFunction } from 'express';
import { formasPagoService } from './formas-pago.service';
import {
  CreateFormaPagoSchema,
  UpdateFormaPagoSchema,
  SearchFormasPagoSchema,
} from './formas-pago.dto';

export class FormasPagoController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const filters = SearchFormasPagoSchema.parse(req.query);
      const result = await formasPagoService.findAll(empresaId, filters, req.empresaDbConfig);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = await formasPagoService.findOne(req.params.id, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = CreateFormaPagoSchema.parse(req.body);
      const result = await formasPagoService.create(empresaId, data, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Forma de pago creada correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = UpdateFormaPagoSchema.parse(req.body);
      const result = await formasPagoService.update(req.params.id, empresaId, data, req.empresaDbConfig);

      res.json({
        success: true,
        data: result,
        message: 'Forma de pago actualizada correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const result = await formasPagoService.delete(req.params.id, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getActivas(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = await formasPagoService.getActivas(empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async searchCodigos(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const prefix = (req.query.prefix as string) || '';
      const codigos = await formasPagoService.searchCodigos(empresaId, prefix, req.empresaDbConfig);

      res.json({
        success: true,
        data: codigos,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const formasPagoController = new FormasPagoController();
