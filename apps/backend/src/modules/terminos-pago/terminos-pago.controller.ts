import { Request, Response, NextFunction } from 'express';
import { terminosPagoService } from './terminos-pago.service';
import {
  CreateTerminoPagoSchema,
  UpdateTerminoPagoSchema,
  SearchTerminosPagoSchema,
} from './terminos-pago.dto';

export class TerminosPagoController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const filters = SearchTerminosPagoSchema.parse(req.query);
      const result = await terminosPagoService.findAll(empresaId, filters, req.empresaDbConfig);

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

      const data = await terminosPagoService.findOne(req.params.id, empresaId, req.empresaDbConfig);

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

      const data = CreateTerminoPagoSchema.parse(req.body);
      const result = await terminosPagoService.create(empresaId, data, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Término de pago creado correctamente',
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

      const data = UpdateTerminoPagoSchema.parse(req.body);
      const result = await terminosPagoService.update(req.params.id, empresaId, data, req.empresaDbConfig);

      res.json({
        success: true,
        data: result,
        message: 'Término de pago actualizado correctamente',
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

      const result = await terminosPagoService.delete(req.params.id, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getActivos(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = await terminosPagoService.getActivos(empresaId, req.empresaDbConfig);

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
      const codigos = await terminosPagoService.searchCodigos(empresaId, prefix, req.empresaDbConfig);

      res.json({
        success: true,
        data: codigos,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async duplicar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const result = await terminosPagoService.duplicar(req.params.id, empresaId, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Término de pago duplicado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const terminosPagoController = new TerminosPagoController();
