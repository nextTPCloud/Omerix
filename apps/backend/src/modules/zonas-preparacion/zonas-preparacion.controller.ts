import { Request, Response } from 'express';
import { zonasPreparacionService } from './zonas-preparacion.service';
import { SearchZonasPreparacionDTO } from './zonas-preparacion.dto';

export class ZonasPreparacionController {
  async findAll(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters: SearchZonasPreparacionDTO = {
        q: req.query.q as string,
        activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
        almacenId: req.query.almacenId as string,
        tieneMonitor: req.query.tieneMonitor !== undefined ? req.query.tieneMonitor === 'true' : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        sortBy: (req.query.sortBy as string) || 'orden',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = await zonasPreparacionService.findAll(empresaId, filters, req.empresaDbConfig);
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

      const zona = await zonasPreparacionService.findOne(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, data: zona });
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

      const zona = await zonasPreparacionService.create(empresaId, req.body, req.empresaDbConfig);
      res.status(201).json({ success: true, data: zona, message: 'Zona de preparación creada correctamente' });
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

      const zona = await zonasPreparacionService.update(req.params.id, empresaId, req.body, req.empresaDbConfig);
      res.json({ success: true, data: zona, message: 'Zona de preparación actualizada correctamente' });
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

      const result = await zonasPreparacionService.delete(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async searchCodigos(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const prefix = req.query.prefix as string || '';
      const codigos = await zonasPreparacionService.searchCodigos(empresaId, prefix, req.empresaDbConfig);
      res.json({ success: true, data: codigos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const zonasPreparacionController = new ZonasPreparacionController();
