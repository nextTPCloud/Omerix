import { Request, Response } from 'express';
import { modificadoresService } from './modificadores.service';
import { SearchModificadoresDTO } from './modificadores.dto';

export class ModificadoresController {
  async findAll(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const filters: SearchModificadoresDTO = {
        q: req.query.q as string,
        grupoId: req.query.grupoId as string,
        tipo: req.query.tipo as string,
        activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
        aplicaA: req.query.aplicaA as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 100,
        sortBy: (req.query.sortBy as string) || 'orden',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const result = await modificadoresService.findAll(empresaId, filters, req.empresaDbConfig);
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

      const modificador = await modificadoresService.findOne(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, data: modificador });
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

      const modificador = await modificadoresService.create(empresaId, req.body, req.empresaDbConfig);
      res.status(201).json({ success: true, data: modificador, message: 'Modificador creado correctamente' });
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

      const modificador = await modificadoresService.update(req.params.id, empresaId, req.body, req.empresaDbConfig);
      res.json({ success: true, data: modificador, message: 'Modificador actualizado correctamente' });
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

      const result = await modificadoresService.delete(req.params.id, empresaId, req.empresaDbConfig);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.message.includes('no encontrad') ? 404 : 500).json({ success: false, message: error.message });
    }
  }

  async findByProducto(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId;
      if (!empresaId || !req.empresaDbConfig) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const modificadores = await modificadoresService.findByProducto(req.params.productoId, empresaId, req.empresaDbConfig);
      res.json({ success: true, data: modificadores });
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
      const codigos = await modificadoresService.searchCodigos(empresaId, prefix, req.empresaDbConfig);
      res.json({ success: true, data: codigos });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const modificadoresController = new ModificadoresController();
