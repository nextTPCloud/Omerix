import { Request, Response } from 'express';
import { variantesService } from './variantes.service';
import { SearchVariantesDTO } from './variantes.dto';

export class VariantesController {
  async findAll(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters: SearchVariantesDTO = {
        q: req.query.q as string,
        activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
        tipoVisualizacion: req.query.tipoVisualizacion as string,
        aplicaA: req.query.aplicaA as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        sortBy: (req.query.sortBy as string) || 'orden',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = await variantesService.findAll(empresaId, filters, req.empresaDbConfig);
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

      const variante = await variantesService.findOne(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, data: variante });
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

      const variante = await variantesService.create(empresaId, req.body, req.empresaDbConfig);
      res.status(201).json({ success: true, data: variante, message: 'Variante creada correctamente' });
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

      const variante = await variantesService.update(req.params.id, empresaId, req.body, req.empresaDbConfig);
      res.json({ success: true, data: variante, message: 'Variante actualizada correctamente' });
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

      const result = await variantesService.delete(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async addValor(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const variante = await variantesService.addValor(req.params.id, empresaId, req.body, req.empresaDbConfig);
      res.json({ success: true, data: variante });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeValor(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const variante = await variantesService.removeValor(req.params.id, empresaId, req.params.valorId, req.empresaDbConfig);
      res.json({ success: true, data: variante });
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
      const codigos = await variantesService.searchCodigos(empresaId, prefix, req.empresaDbConfig);
      res.json({ success: true, data: codigos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const variantesController = new VariantesController();
