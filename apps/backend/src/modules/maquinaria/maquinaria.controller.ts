import { Request, Response, NextFunction } from 'express';
import { maquinariaService } from './maquinaria.service';
import {
  CreateMaquinariaSchema,
  UpdateMaquinariaSchema,
  SearchMaquinariaSchema,
  RegistrarMantenimientoSchema,
} from './maquinaria.dto';

export class MaquinariaController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const filters = SearchMaquinariaSchema.parse(req.query);
      const result = await maquinariaService.findAll(empresaId, filters, req.empresaDbConfig);

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

      const data = await maquinariaService.findOne(req.params.id, empresaId, req.empresaDbConfig);

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

      const data = CreateMaquinariaSchema.parse(req.body);
      const result = await maquinariaService.create(empresaId, data, usuarioId, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Maquinaria creada correctamente',
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

      const data = UpdateMaquinariaSchema.parse(req.body);
      const result = await maquinariaService.update(req.params.id, empresaId, data, usuarioId, req.empresaDbConfig);

      res.json({
        success: true,
        data: result,
        message: 'Maquinaria actualizada correctamente',
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

      const result = await maquinariaService.delete(req.params.id, empresaId, req.empresaDbConfig);

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

      const result = await maquinariaService.deleteMany(ids, empresaId, req.empresaDbConfig);

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

      const data = await maquinariaService.getActivas(empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getDisponibles(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = await maquinariaService.getDisponibles(empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async registrarMantenimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.userId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = RegistrarMantenimientoSchema.parse(req.body);
      const result = await maquinariaService.registrarMantenimiento(
        req.params.id,
        empresaId,
        data,
        usuarioId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: result,
        message: 'Mantenimiento registrado correctamente',
      });
    } catch (error: any) {
      next(error);
    }
  }

  async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      const usuarioId = req.userId;
      if (!empresaId || !req.empresaDbConfig || !usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const { estado } = req.body;
      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El estado es requerido',
        });
      }

      const result = await maquinariaService.cambiarEstado(
        req.params.id,
        empresaId,
        estado,
        usuarioId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: result,
        message: 'Estado actualizado correctamente',
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

      const result = await maquinariaService.duplicar(req.params.id, empresaId, usuarioId, req.empresaDbConfig);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Maquinaria duplicada correctamente',
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
      const codigos = await maquinariaService.searchCodigos(empresaId, prefix, req.empresaDbConfig);

      res.json({
        success: true,
        data: codigos,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = await maquinariaService.getEstadisticas(empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAlertas(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const data = await maquinariaService.getAlertas(empresaId, req.empresaDbConfig);

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const maquinariaController = new MaquinariaController();
