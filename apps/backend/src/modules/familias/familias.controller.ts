import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { familiasService } from './familias.service';
import {
  CreateFamiliaSchema,
  UpdateFamiliaSchema,
  SearchFamiliasSchema,
} from './familias.dto';

export class FamiliasController {
  // Crear familia
  async crear(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const usuarioId = new mongoose.Types.ObjectId(req.userId);

      // Limpiar familiaPadreId si viene vacío
      if (req.body.familiaPadreId === '' || req.body.familiaPadreId === null) {
        delete req.body.familiaPadreId;
      }

      // Validar datos
      const validacion = CreateFamiliaSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const familia = await familiasService.crear(
        validacion.data,
        empresaId,
        usuarioId,
        req.empresaDbConfig
      );

      res.status(201).json({
        success: true,
        data: familia,
        message: 'Familia creada correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear familia:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear familia',
      });
    }
  }

  // Obtener todas las familias
  async obtenerTodas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      // Validar filtros
      const validacion = SearchFamiliasSchema.safeParse(req.query);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Filtros inválidos',
          errors: validacion.error.errors,
        });
      }

      const resultado = await familiasService.obtenerTodas(
        empresaId,
        validacion.data,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: resultado.familias,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Error al obtener familias:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener familias',
      });
    }
  }

  // Obtener árbol de familias
  async obtenerArbol(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);

      const arbol = await familiasService.obtenerArbol(
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: arbol,
      });
    } catch (error: any) {
      console.error('Error al obtener árbol de familias:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener árbol de familias',
      });
    }
  }

  // Obtener familia por ID
  async obtenerPorId(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      const familia = await familiasService.obtenerPorId(
        id,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: familia,
      });
    } catch (error: any) {
      console.error('Error al obtener familia:', error);
      res.status(error.message === 'Familia no encontrada' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al obtener familia',
      });
    }
  }

  // Actualizar familia
  async actualizar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      // Limpiar familiaPadreId si viene vacío
      if (req.body.familiaPadreId === '' || req.body.familiaPadreId === null) {
        delete req.body.familiaPadreId;
      }

      // Validar datos
      const validacion = UpdateFamiliaSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: validacion.error.errors,
        });
      }

      const familia = await familiasService.actualizar(
        id,
        validacion.data,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: familia,
        message: 'Familia actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar familia:', error);
      res.status(error.message === 'Familia no encontrada' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al actualizar familia',
      });
    }
  }

  // Eliminar familia
  async eliminar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      const resultado = await familiasService.eliminar(
        id,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      console.error('Error al eliminar familia:', error);
      res.status(error.message === 'Familia no encontrada' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al eliminar familia',
      });
    }
  }

  // Reordenar familias
  async reordenar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { items } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Se esperaba un array de items',
        });
      }

      const resultado = await familiasService.reordenar(
        items,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        message: resultado.message,
      });
    } catch (error: any) {
      console.error('Error al reordenar familias:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al reordenar familias',
      });
    }
  }

  // Obtener estadísticas
  async obtenerEstadisticas(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const { id } = req.params;

      const estadisticas = await familiasService.obtenerEstadisticas(
        id,
        empresaId,
        req.empresaDbConfig
      );

      res.json({
        success: true,
        data: estadisticas,
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(error.message === 'Familia no encontrada' ? 404 : 500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas',
      });
    }
  }

  // Sugerir siguiente código
  async sugerirSiguienteCodigo(req: Request, res: Response) {
    try {
      if (!req.empresaId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado',
        });
      }

      if (!req.empresaDbConfig) {
        return res.status(500).json({
          success: false,
          message: 'Configuración de base de datos no disponible',
        });
      }

      const empresaId = new mongoose.Types.ObjectId(req.empresaId);
      const prefijo = req.query.prefijo as string | undefined;

      const codigoSugerido = await familiasService.sugerirSiguienteCodigo(
        empresaId,
        req.empresaDbConfig,
        prefijo
      );

      res.json({
        success: true,
        data: { codigo: codigoSugerido },
      });
    } catch (error: any) {
      console.error('Error al sugerir código:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al sugerir el código',
      });
    }
  }
}

export const familiasController = new FamiliasController();