import { Request, Response, NextFunction } from 'express';
import { tiposGastoService } from './tipos-gasto.service';
import {
  CreateTipoGastoSchema,
  UpdateTipoGastoSchema,
  SearchTiposGastoSchema,
} from './tipos-gasto.dto';

export class TiposGastoController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const filters = SearchTiposGastoSchema.parse(req.query);
      const result = await tiposGastoService.findAll(empresaId, filters, req.empresaDbConfig);

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

      const data = await tiposGastoService.findOne(req.params.id, empresaId, req.empresaDbConfig);

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
      const usuarioId = req.userId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = CreateTipoGastoSchema.parse(req.body);
      const result = await tiposGastoService.create(empresaId, data, usuarioId, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Tipo de gasto creado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.userId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = UpdateTipoGastoSchema.parse(req.body);
      const result = await tiposGastoService.update(req.params.id, empresaId, data, usuarioId, req.empresaDbConfig);

      res.json({
        success: true,
        data: result,
        message: 'Tipo de gasto actualizado correctamente',
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

      const result = await tiposGastoService.delete(req.params.id, empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteMany(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes proporcionar una lista de IDs a eliminar',
        });
      }

      const result = await tiposGastoService.deleteMany(ids, empresaId, req.empresaDbConfig);

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

      const data = await tiposGastoService.getActivos(empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async duplicar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.userId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const result = await tiposGastoService.duplicar(req.params.id, empresaId, usuarioId, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Tipo de gasto duplicado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const tiposGastoController = new TiposGastoController();
