import { Request, Response, NextFunction } from 'express';
import { tiposImpuestoService } from './tipos-impuesto.service';
import {
  CreateTipoImpuestoSchema,
  UpdateTipoImpuestoSchema,
  SearchTiposImpuestoSchema,
} from './tipos-impuesto.dto';

export class TiposImpuestoController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const filters = SearchTiposImpuestoSchema.parse(req.query);
      const result = await tiposImpuestoService.findAll(empresaId, filters);

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
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = await tiposImpuestoService.findOne(req.params.id, empresaId);

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
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = CreateTipoImpuestoSchema.parse(req.body);
      const result = await tiposImpuestoService.create(empresaId, data);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Tipo de impuesto creado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = UpdateTipoImpuestoSchema.parse(req.body);
      const result = await tiposImpuestoService.update(req.params.id, empresaId, data);

      res.json({
        success: true,
        data: result,
        message: 'Tipo de impuesto actualizado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const result = await tiposImpuestoService.delete(req.params.id, empresaId);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async setPredeterminado(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const result = await tiposImpuestoService.setPredeterminado(req.params.id, empresaId);

      res.json({
        success: true,
        data: result,
        message: 'Tipo de impuesto establecido como predeterminado',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const tiposImpuestoController = new TiposImpuestoController();
