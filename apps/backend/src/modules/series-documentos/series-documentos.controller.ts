import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { seriesDocumentosService } from './series-documentos.service';
import {
  CreateSerieDocumentoDTO,
  UpdateSerieDocumentoDTO,
  SearchSeriesDocumentosDTO,
} from './series-documentos.dto';
import { TipoDocumentoSerie } from './SerieDocumento';

// ============================================
// CONTROLADOR DE SERIES DE DOCUMENTOS
// ============================================

export const seriesDocumentosController = {
  // ============================================
  // CRUD BÁSICO
  // ============================================

  /**
   * Crear una nueva serie de documentos
   */
  async crear(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const usuarioId = req.userId!;
      const data: CreateSerieDocumentoDTO = req.body;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      const serie = await seriesDocumentosService.crear(
        data,
        new mongoose.Types.ObjectId(usuarioId),
        dbConfig
      );

      return res.status(201).json({
        success: true,
        data: serie,
        message: 'Serie de documentos creada correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear serie:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al crear serie de documentos',
      });
    }
  },

  /**
   * Buscar series con filtros
   */
  async buscar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };
      const params: SearchSeriesDocumentosDTO = {
        q: req.query.q as string,
        tipoDocumento: req.query.tipoDocumento as TipoDocumentoSerie,
        activo: req.query.activo as string,
        predeterminada: req.query.predeterminada as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
        sortBy: (req.query.sortBy as string) || 'codigo',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      };

      const resultado = await seriesDocumentosService.buscar(
        params,
        dbConfig
      );

      return res.json({
        success: true,
        ...resultado,
      });
    } catch (error: any) {
      console.error('Error al buscar series:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al buscar series de documentos',
      });
    }
  },

  /**
   * Obtener serie por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      const serie = await seriesDocumentosService.obtenerPorId(
        id,
        dbConfig
      );

      if (!serie) {
        return res.status(404).json({
          success: false,
          error: 'Serie no encontrada',
        });
      }

      return res.json({
        success: true,
        data: serie,
      });
    } catch (error: any) {
      console.error('Error al obtener serie:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener serie de documentos',
      });
    }
  },

  /**
   * Actualizar serie
   */
  async actualizar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const usuarioId = req.userId!;
      const data: UpdateSerieDocumentoDTO = req.body;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      const serie = await seriesDocumentosService.actualizar(
        id,
        data,
        new mongoose.Types.ObjectId(usuarioId),
        dbConfig
      );

      if (!serie) {
        return res.status(404).json({
          success: false,
          error: 'Serie no encontrada',
        });
      }

      return res.json({
        success: true,
        data: serie,
        message: 'Serie actualizada correctamente',
      });
    } catch (error: any) {
      console.error('Error al actualizar serie:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al actualizar serie de documentos',
      });
    }
  },

  /**
   * Eliminar serie
   */
  async eliminar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      const eliminado = await seriesDocumentosService.eliminar(
        id,
        dbConfig
      );

      if (!eliminado) {
        return res.status(404).json({
          success: false,
          error: 'Serie no encontrada',
        });
      }

      return res.json({
        success: true,
        message: 'Serie eliminada correctamente',
      });
    } catch (error: any) {
      console.error('Error al eliminar serie:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al eliminar serie de documentos',
      });
    }
  },

  // ============================================
  // OPERACIONES ESPECIALES
  // ============================================

  /**
   * Obtener series por tipo de documento
   */
  async obtenerPorTipoDocumento(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { tipoDocumento } = req.params;
      const soloActivas = req.query.soloActivas !== 'false';
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      const series = await seriesDocumentosService.obtenerPorTipoDocumento(
        tipoDocumento as TipoDocumentoSerie,
        soloActivas,
        dbConfig
      );

      return res.json({
        success: true,
        data: series,
      });
    } catch (error: any) {
      console.error('Error al obtener series por tipo:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener series de documentos',
      });
    }
  },

  /**
   * Establecer serie como predeterminada
   */
  async establecerPredeterminada(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const usuarioId = req.userId!;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      const serie = await seriesDocumentosService.establecerPredeterminada(
        id,
        new mongoose.Types.ObjectId(usuarioId),
        dbConfig
      );

      if (!serie) {
        return res.status(404).json({
          success: false,
          error: 'Serie no encontrada',
        });
      }

      return res.json({
        success: true,
        data: serie,
        message: 'Serie establecida como predeterminada',
      });
    } catch (error: any) {
      console.error('Error al establecer predeterminada:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al establecer serie predeterminada',
      });
    }
  },

  /**
   * Sugerir próximo código (sin incrementar)
   */
  async sugerirCodigo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const tipoDocumento = req.query.tipoDocumento as TipoDocumentoSerie;
      const serieId = req.query.serieId as string || null;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      if (!tipoDocumento) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro tipoDocumento es obligatorio',
        });
      }

      const resultado = await seriesDocumentosService.sugerirCodigo(
        tipoDocumento,
        serieId,
        dbConfig
      );

      return res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al sugerir código:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al sugerir código',
      });
    }
  },

  /**
   * Generar siguiente código (incrementa el contador)
   */
  async generarCodigo(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const tipoDocumento = req.body.tipoDocumento as TipoDocumentoSerie;
      const serieId = req.body.serieId as string || null;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      if (!tipoDocumento) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro tipoDocumento es obligatorio',
        });
      }

      const resultado = await seriesDocumentosService.generarCodigoParaTipo(
        tipoDocumento,
        serieId,
        dbConfig
      );

      return res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al generar código:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al generar código',
      });
    }
  },

  /**
   * Duplicar serie
   */
  async duplicar(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const { id } = req.params;
      const usuarioId = req.userId!;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      const serie = await seriesDocumentosService.duplicar(
        id,
        new mongoose.Types.ObjectId(usuarioId),
        dbConfig
      );

      return res.status(201).json({
        success: true,
        data: serie,
        message: 'Serie duplicada correctamente',
      });
    } catch (error: any) {
      console.error('Error al duplicar serie:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al duplicar serie de documentos',
      });
    }
  },

  /**
   * Crear series por defecto
   */
  async crearSeriesPorDefecto(req: Request, res: Response) {
    try {
      if (!req.empresaDbConfig || !req.empresaId) {
        return res.status(500).json({
          success: false,
          error: 'Configuración de base de datos no disponible',
        });
      }

      const usuarioId = req.userId!;
      const dbConfig = { ...req.empresaDbConfig, empresaId: req.empresaId };

      await seriesDocumentosService.crearSeriesPorDefecto(
        new mongoose.Types.ObjectId(usuarioId),
        dbConfig
      );

      return res.json({
        success: true,
        message: 'Series por defecto creadas correctamente',
      });
    } catch (error: any) {
      console.error('Error al crear series por defecto:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al crear series por defecto',
      });
    }
  },
};

export default seriesDocumentosController;
