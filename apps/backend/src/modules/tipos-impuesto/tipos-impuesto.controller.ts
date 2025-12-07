import { Request, Response, NextFunction } from 'express';
import { tiposImpuestoService } from './tipos-impuesto.service';
import {
  CreateTipoImpuestoSchema,
  UpdateTipoImpuestoSchema,
  SearchTiposImpuestoSchema,
} from './tipos-impuesto.dto';
import { AuthorizationHelper } from '../../utils/authorization.helper';

export class TiposImpuestoController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const filters = SearchTiposImpuestoSchema.parse(req.query);

      // Validación adicional contra inyección
      const validation = AuthorizationHelper.validateInput(filters);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const { data, total, page, limit, totalPages } = await tiposImpuestoService.findAll(empresaId, filters, req.empresaDbConfig);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page,
          limit,
          pages: totalPages,
        },
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

      // Si requireOwnership está activo, req.resource ya contiene el recurso
      const data = req.resource || (await tiposImpuestoService.findOne(req.params.id, empresaId, req.empresaDbConfig));

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
      const userId = req.userId!;

      const data = CreateTipoImpuestoSchema.parse(req.body);

      // Validación adicional contra inyección
      const validation = AuthorizationHelper.validateInput(data);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const result = await tiposImpuestoService.create(empresaId, data, req.empresaDbConfig);

      // Log de auditoría
      AuthorizationHelper.logSecurityEvent(userId, 'CREATE', 'tipos-impuesto', {
        id: result._id,
        codigo: result.codigo,
      });

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
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }
      const userId = req.userId!;
      const tipoImpuestoId = req.params.id;

      const data = UpdateTipoImpuestoSchema.parse(req.body);

      // Validación adicional
      const validation = AuthorizationHelper.validateInput(data);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }

      const result = await tiposImpuestoService.update(tipoImpuestoId, empresaId, data, req.empresaDbConfig);

      // Log de auditoría
      AuthorizationHelper.logSecurityEvent(userId, 'UPDATE', 'tipos-impuesto', {
        id: tipoImpuestoId,
        changes: Object.keys(data),
      });

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
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }
      const userId = req.userId!;
      const tipoImpuestoId = req.params.id;

      const result = await tiposImpuestoService.delete(tipoImpuestoId, empresaId, req.empresaDbConfig);

      // Log de auditoría (operación crítica)
      AuthorizationHelper.logSecurityEvent(userId, 'DELETE', 'tipos-impuesto', {
        id: tipoImpuestoId,
      });

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
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }
      const userId = req.userId!;
      const tipoImpuestoId = req.params.id;

      const result = await tiposImpuestoService.setPredeterminado(tipoImpuestoId, empresaId, req.empresaDbConfig);

      // Log de auditoría
      AuthorizationHelper.logSecurityEvent(userId, 'UPDATE', 'tipos-impuesto', {
        id: tipoImpuestoId,
        action: 'setPredeterminado',
      });

      res.json({
        success: true,
        data: result,
        message: 'Tipo de impuesto establecido como predeterminado',
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
      const codigos = await tiposImpuestoService.searchCodigos(empresaId, prefix, req.empresaDbConfig);

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

      const result = await tiposImpuestoService.duplicar(req.params.id, empresaId, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Tipo de impuesto duplicado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const tiposImpuestoController = new TiposImpuestoController();
