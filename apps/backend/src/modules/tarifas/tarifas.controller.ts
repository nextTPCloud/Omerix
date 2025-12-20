import { Request, Response } from 'express';
import { tarifasService } from './tarifas.service';
import {
  CreateTarifaSchema,
  UpdateTarifaSchema,
  GetTarifasQuerySchema,
  AddPrecioTarifaSchema,
  BulkDeleteTarifasSchema,
} from './tarifas.dto';
import { z } from 'zod';

class TarifasController {
  /**
   * Obtener todas las tarifas
   */
  async getAll(req: Request, res: Response) {
    try {
      const query = GetTarifasQuerySchema.parse(req.query);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const result = await tarifasService.getAll(query, empresaId, dbConfig);

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
        error: error.message || 'Error al obtener tarifas',
      });
    }
  }

  /**
   * Obtener tarifa por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const tarifa = await tarifasService.getById(id, empresaId, dbConfig);

      if (!tarifa) {
        return res.status(404).json({
          success: false,
          error: 'Tarifa no encontrada',
        });
      }

      res.json({
        success: true,
        data: tarifa,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener tarifa',
      });
    }
  }

  /**
   * Obtener tarifas activas (para selectores)
   */
  async getActivas(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const tarifas = await tarifasService.getActivas(empresaId, dbConfig);

      res.json({
        success: true,
        data: tarifas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener tarifas activas',
      });
    }
  }

  /**
   * Crear tarifa
   */
  async create(req: Request, res: Response) {
    try {
      const createDto = CreateTarifaSchema.parse(req.body);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      const tarifa = await tarifasService.create(
        createDto,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.status(201).json({
        success: true,
        data: tarifa,
        message: 'Tarifa creada correctamente',
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
        error: error.message || 'Error al crear tarifa',
      });
    }
  }

  /**
   * Actualizar tarifa
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateDto = UpdateTarifaSchema.parse(req.body);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      const tarifa = await tarifasService.update(
        id,
        updateDto,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.json({
        success: true,
        data: tarifa,
        message: 'Tarifa actualizada correctamente',
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
        error: error.message || 'Error al actualizar tarifa',
      });
    }
  }

  /**
   * Eliminar tarifa
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      await tarifasService.delete(id, empresaId, dbConfig);

      res.json({
        success: true,
        message: 'Tarifa eliminada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al eliminar tarifa',
      });
    }
  }

  /**
   * Eliminar multiples tarifas
   */
  async bulkDelete(req: Request, res: Response) {
    try {
      const { ids } = BulkDeleteTarifasSchema.parse(req.body);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;

      const result = await tarifasService.bulkDelete(ids, empresaId, dbConfig);

      res.json({
        success: true,
        message: `${result.deletedCount} tarifas eliminadas`,
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
        error: error.message || 'Error al eliminar tarifas',
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

      const tarifa = await tarifasService.changeStatus(
        id,
        activo,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.json({
        success: true,
        data: tarifa,
        message: `Tarifa ${activo ? 'activada' : 'desactivada'} correctamente`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al cambiar estado',
      });
    }
  }

  /**
   * Agregar o actualizar precio de producto
   */
  async addOrUpdatePrecio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const precioDto = AddPrecioTarifaSchema.parse(req.body);
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      const tarifa = await tarifasService.addOrUpdatePrecio(
        id,
        precioDto,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.json({
        success: true,
        data: tarifa,
        message: 'Precio actualizado correctamente',
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
        error: error.message || 'Error al actualizar precio',
      });
    }
  }

  /**
   * Eliminar precio de producto
   */
  async deletePrecio(req: Request, res: Response) {
    try {
      const { id, productoId } = req.params;
      const { varianteId } = req.query;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      const tarifa = await tarifasService.deletePrecio(
        id,
        productoId,
        empresaId,
        usuarioId,
        dbConfig,
        varianteId as string | undefined
      );

      res.json({
        success: true,
        data: tarifa,
        message: 'Precio eliminado correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al eliminar precio',
      });
    }
  }

  /**
   * Duplicar tarifa
   */
  async duplicar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const empresaId = req.empresaId!;
      const dbConfig = req.dbConfig!;
      const usuarioId = req.userId!;

      const tarifa = await tarifasService.duplicar(
        id,
        nombre,
        empresaId,
        usuarioId,
        dbConfig
      );

      res.status(201).json({
        success: true,
        data: tarifa,
        message: 'Tarifa duplicada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Error al duplicar tarifa',
      });
    }
  }
}

export const tarifasController = new TarifasController();
export default tarifasController;
