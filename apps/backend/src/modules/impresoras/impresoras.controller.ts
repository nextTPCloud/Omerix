import { Request, Response } from 'express';
import { impresorasService } from './impresoras.service';
import { SearchImpresorasDTO } from './impresoras.dto';

export class ImpresorasController {
  async findAll(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters: SearchImpresorasDTO = {
        q: req.query.q as string,
        tipo: req.query.tipo as string,
        activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
        almacenId: req.query.almacenId as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        sortBy: (req.query.sortBy as string) || 'nombre',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = await impresorasService.findAll(empresaId, filters, req.empresaDbConfig);
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

      const impresora = await impresorasService.findOne(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, data: impresora });
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

      const impresora = await impresorasService.create(empresaId, req.body, req.empresaDbConfig);
      res.status(201).json({ success: true, data: impresora, message: 'Impresora creada correctamente' });
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

      const impresora = await impresorasService.update(req.params.id, empresaId, req.body, req.empresaDbConfig);
      res.json({ success: true, data: impresora, message: 'Impresora actualizada correctamente' });
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

      const result = await impresorasService.delete(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async testConnection(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const result = await impresorasService.testConnection(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async searchCodigos(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const prefix = req.query.prefix as string || '';
      const codigos = await impresorasService.searchCodigos(empresaId, prefix, req.empresaDbConfig);
      res.json({ success: true, data: codigos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const impresorasController = new ImpresorasController();
