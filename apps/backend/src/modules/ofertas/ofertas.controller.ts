import { Request, Response } from 'express';
import { ofertasService } from './ofertas.service';
import {
  CreateOfertaSchema,
  UpdateOfertaSchema,
  GetOfertasQuerySchema,
  BulkDeleteOfertasSchema,
} from './ofertas.dto';
import { z } from 'zod';

class OfertasController {
  /**
   * Obtener todas las ofertas
   */
  async getAll(req: Request, res: Response) {
    try {
      const query = GetOfertasQuerySchema.parse(req.query);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const result = await ofertasService.getAll(query, empresaId, dbConfig);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos de consulta invalidos',
          details: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener ofertas',
      });
    }
  }

  /**
   * Obtener oferta por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const oferta = await ofertasService.getById(id, empresaId, dbConfig);

      if (!oferta) {
        return res.status(404).json({
          success: false,
          error: 'Oferta no encontrada',
        });
      }

      res.json({
        success: true,
        data: oferta,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener oferta',
      });
    }
  }

  /**
   * Obtener ofertas vigentes
   */
  async getVigentes(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const ofertas = await ofertasService.getVigentes(empresaId, dbConfig);

      res.json({
        success: true,
        data: ofertas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener ofertas vigentes',
      });
    }
  }

  /**
   * Obtener happy hours activas ahora
   */
  async getHappyHours(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const ofertas = await ofertasService.getHappyHoursActivas(empresaId, dbConfig);

      res.json({
        success: true,
        data: ofertas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener happy hours',
      });
    }
  }

  /**
   * Crear oferta
   */
  async create(req: Request, res: Response) {
    try {
      const createDto = CreateOfertaSchema.parse(req.body);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      const oferta = await ofertasService.create(
        createDto,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.status(201).json({
        success: true,
        data: oferta,
        message: 'Oferta creada correctamente',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos invalidos',
          details: error.errors,
        });
      }
      res.status(400).json({
        success: false,
        error: error.message || 'Error al crear oferta',
      });
    }
  }

  /**
   * Actualizar oferta
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateDto = UpdateOfertaSchema.parse(req.body);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      const oferta = await ofertasService.update(
        id,
        updateDto,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.json({
        success: true,
        data: oferta,
        message: 'Oferta actualizada correctamente',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos invalidos',
          details: error.errors,
        });
      }
      res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar oferta',
      });
    }
  }

  /**
   * Eliminar oferta
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      await ofertasService.delete(id, empresaId, dbConfig);

      res.json({
        success: true,
        message: 'Oferta eliminada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al eliminar oferta',
      });
    }
  }

  /**
   * Eliminar multiples ofertas
   */
  async bulkDelete(req: Request, res: Response) {
    try {
      const { ids } = BulkDeleteOfertasSchema.parse(req.body);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const result = await ofertasService.bulkDelete(ids, empresaId, dbConfig);

      res.json({
        success: true,
        message: `${result.deletedCount} ofertas eliminadas`,
        deletedCount: result.deletedCount,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos invalidos',
          details: error.errors,
        });
      }
      res.status(400).json({
        success: false,
        error: error.message || 'Error al eliminar ofertas',
      });
    }
  }

  /**
   * Cambiar estado activo
   */
  async changeStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'El campo activo debe ser un booleano',
        });
      }

      const oferta = await ofertasService.changeStatus(
        id,
        activo,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.json({
        success: true,
        data: oferta,
        message: `Oferta ${activo ? 'activada' : 'desactivada'} correctamente`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al cambiar estado',
      });
    }
  }

  /**
   * Duplicar oferta
   */
  async duplicar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      const oferta = await ofertasService.duplicar(
        id,
        nombre,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.status(201).json({
        success: true,
        data: oferta,
        message: 'Oferta duplicada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al duplicar oferta',
      });
    }
  }
}

export const ofertasController = new OfertasController();
export default ofertasController;
