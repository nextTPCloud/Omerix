import { Request, Response, NextFunction } from 'express';
import { almacenesService } from './almacenes.service';
import {
  CreateAlmacenSchema,
  UpdateAlmacenSchema,
  SearchAlmacenesSchema,
} from './almacenes.dto';

export class AlmacenesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const filters = SearchAlmacenesSchema.parse(req.query);
      const result = await almacenesService.findAll(empresaId, filters, req.empresaDbConfig);

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

      const data = await almacenesService.findOne(req.params.id, empresaId, req.empresaDbConfig);

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

      const data = CreateAlmacenSchema.parse(req.body);
      const result = await almacenesService.create(empresaId, data, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Almacén creado correctamente',
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

      const data = UpdateAlmacenSchema.parse(req.body);
      const result = await almacenesService.update(req.params.id, empresaId, data, req.empresaDbConfig);

      res.json({
        success: true,
        data: result,
        message: 'Almacén actualizado correctamente',
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

      const result = await almacenesService.delete(req.params.id, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async setPrincipal(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const result = await almacenesService.setPrincipal(req.params.id, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data: result,
        message: 'Almacén establecido como principal',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getPrincipal(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const result = await almacenesService.getPrincipal(empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data: result,
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

      const data = await almacenesService.getActivos(empresaId, req.empresaDbConfig);

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
      const codigos = await almacenesService.searchCodigos(empresaId, prefix, req.empresaDbConfig);

      res.json({
        success: true,
        data: codigos,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const almacenesController = new AlmacenesController();
