// apps/backend/src/modules/plantillas-documento/plantillas-documento.controller.ts
// Controlador para gestión de plantillas de diseño de documentos

import { Request, Response } from 'express';
import { plantillasDocumentoService } from './plantillas-documento.service';
import {
  CreatePlantillaSchema,
  UpdatePlantillaSchema,
  SearchPlantillasSchema,
} from './plantillas-documento.dto';
import { TipoDocumentoPlantilla } from './PlantillaDocumento';

class PlantillasDocumentoController {
  /**
   * GET /api/plantillas-documento
   * Listar plantillas con filtros
   */
  async listar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const params = SearchPlantillasSchema.parse(req.query);

      const result = await plantillasDocumentoService.listar(empresaId, dbConfig, params);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/plantillas-documento/estilos
   * Obtener estilos disponibles
   */
  async obtenerEstilos(req: Request, res: Response) {
    try {
      const estilos = plantillasDocumentoService.obtenerEstilosDisponibles();

      res.json({
        success: true,
        data: estilos,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/plantillas-documento/tipos-documento
   * Obtener tipos de documento disponibles
   */
  async obtenerTiposDocumento(req: Request, res: Response) {
    try {
      const tipos = plantillasDocumentoService.obtenerTiposDocumento();

      res.json({
        success: true,
        data: tipos,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/plantillas-documento/tipo/:tipoDocumento
   * Obtener plantillas por tipo de documento
   */
  async obtenerPorTipo(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { tipoDocumento } = req.params;

      if (!Object.values(TipoDocumentoPlantilla).includes(tipoDocumento as TipoDocumentoPlantilla)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de documento no válido',
        });
      }

      const plantillas = await plantillasDocumentoService.obtenerPorTipo(
        empresaId,
        dbConfig,
        tipoDocumento as TipoDocumentoPlantilla
      );

      res.json({
        success: true,
        data: plantillas,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/plantillas-documento/predeterminada/:tipoDocumento
   * Obtener plantilla predeterminada por tipo de documento
   */
  async obtenerPredeterminada(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { tipoDocumento } = req.params;

      if (!Object.values(TipoDocumentoPlantilla).includes(tipoDocumento as TipoDocumentoPlantilla)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de documento no válido',
        });
      }

      const plantilla = await plantillasDocumentoService.obtenerPredeterminada(
        empresaId,
        dbConfig,
        tipoDocumento as TipoDocumentoPlantilla
      );

      if (!plantilla) {
        return res.status(404).json({
          success: false,
          error: 'No hay plantilla predeterminada para este tipo de documento',
        });
      }

      res.json({
        success: true,
        data: plantilla,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/plantillas-documento/:id
   * Obtener plantilla por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { id } = req.params;

      const plantilla = await plantillasDocumentoService.obtenerPorId(empresaId, dbConfig, id);

      res.json({
        success: true,
        data: plantilla,
      });
    } catch (error: any) {
      res.status(error.message === 'Plantilla no encontrada' ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/plantillas-documento
   * Crear nueva plantilla
   */
  async crear(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId;
      const data = CreatePlantillaSchema.parse(req.body);

      const plantilla = await plantillasDocumentoService.crear(empresaId, dbConfig, data, usuarioId);

      res.status(201).json({
        success: true,
        data: plantilla,
        message: 'Plantilla creada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/plantillas-documento/:id
   * Actualizar plantilla
   */
  async actualizar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId;
      const { id } = req.params;
      const data = UpdatePlantillaSchema.parse(req.body);

      const plantilla = await plantillasDocumentoService.actualizar(
        empresaId,
        dbConfig,
        id,
        data,
        usuarioId
      );

      res.json({
        success: true,
        data: plantilla,
        message: 'Plantilla actualizada correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/plantillas-documento/:id
   * Eliminar plantilla
   */
  async eliminar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { id } = req.params;

      await plantillasDocumentoService.eliminar(empresaId, dbConfig, id);

      res.json({
        success: true,
        message: 'Plantilla eliminada correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/plantillas-documento/:id/duplicar
   * Duplicar plantilla
   */
  async duplicar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId;
      const { id } = req.params;

      const plantilla = await plantillasDocumentoService.duplicar(empresaId, dbConfig, id, usuarioId);

      res.status(201).json({
        success: true,
        data: plantilla,
        message: 'Plantilla duplicada correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/plantillas-documento/:id/predeterminada
   * Establecer plantilla como predeterminada
   */
  async establecerPredeterminada(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { id } = req.params;

      const plantilla = await plantillasDocumentoService.establecerPredeterminada(
        empresaId,
        dbConfig,
        id
      );

      res.json({
        success: true,
        data: plantilla,
        message: 'Plantilla establecida como predeterminada',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrada') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/plantillas-documento/inicializar
   * Inicializar plantillas predefinidas (admin)
   */
  async inicializar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId;

      const resultado = await plantillasDocumentoService.inicializarPlantillas(
        empresaId,
        dbConfig,
        usuarioId
      );

      res.json({
        success: true,
        data: resultado,
        message: resultado.insertadas > 0
          ? `${resultado.insertadas} plantillas inicializadas correctamente`
          : 'Las plantillas ya estaban inicializadas',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const plantillasDocumentoController = new PlantillasDocumentoController();
export default plantillasDocumentoController;
