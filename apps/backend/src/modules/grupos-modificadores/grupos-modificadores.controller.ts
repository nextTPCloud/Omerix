import { Request, Response } from 'express';
import { gruposModificadoresService } from './grupos-modificadores.service';
import { SearchGruposModificadoresDTO } from './grupos-modificadores.dto';

export class GruposModificadoresController {
  async findAll(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters: SearchGruposModificadoresDTO = {
        q: req.query.q as string,
        activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
        aplicaA: req.query.aplicaA as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        sortBy: (req.query.sortBy as string) || 'orden',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = await gruposModificadoresService.findAll(empresaId, filters, req.empresaDbConfig);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const grupo = await gruposModificadoresService.findOne(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, data: grupo });
    } catch (error: any) {
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async findOneWithModificadores(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const grupo = await gruposModificadoresService.findOneWithModificadores(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, data: grupo });
    } catch (error: any) {
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const grupo = await gruposModificadoresService.create(empresaId, req.body, req.empresaDbConfig);
      res.status(201).json({ success: true, data: grupo, message: 'Grupo de modificadores creado correctamente' });
    } catch (error: any) {
      res.status(error.message.includes('Ya existe') ? 400 : 500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const grupo = await gruposModificadoresService.update(req.params.id, empresaId, req.body, req.empresaDbConfig);
      res.json({ success: true, data: grupo, message: 'Grupo de modificadores actualizado correctamente' });
    } catch (error: any) {
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const result = await gruposModificadoresService.delete(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, ...result });
    } catch (error: any) {
      const status = error.message.includes('no encontrad') ? 404 :
                     error.message.includes('No se puede eliminar') ? 400 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async searchCodigos(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const prefix = req.query.prefix as string || '';
      const codigos = await gruposModificadoresService.searchCodigos(empresaId, prefix, req.empresaDbConfig);
      res.json({ success: true, data: codigos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const gruposModificadoresController = new GruposModificadoresController();
