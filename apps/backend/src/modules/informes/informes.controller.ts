import { Request, Response } from 'express';
import { informesService } from './informes.service';
import { aiReportsService } from '../../services/ai/ai-reports.service';
import {
  CreateInformeSchema,
  UpdateInformeSchema,
  SearchInformesSchema,
  EjecutarInformeSchema,
  ExportarInformeSchema,
  GenerarInformeIASchema,
} from './informes.dto';
import { ModuloInforme } from './Informe';

class InformesController {
  /**
   * GET /api/informes
   * Listar informes
   */
  async listar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId!;
      const params = SearchInformesSchema.parse(req.query);

      const result = await informesService.listar(empresaId, dbConfig, params, usuarioId);

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
   * GET /api/informes/catalogo
   * Obtener catálogo de colecciones y campos
   */
  async obtenerCatalogo(req: Request, res: Response) {
    try {
      const modulo = req.query.modulo as ModuloInforme | undefined;
      const catalogo = informesService.obtenerCatalogo(modulo);

      res.json({
        success: true,
        data: catalogo,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/informes/plantillas
   * Obtener plantillas predefinidas
   */
  async obtenerPlantillas(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const modulo = req.query.modulo as ModuloInforme | undefined;

      const plantillas = await informesService.obtenerPlantillas(empresaId, dbConfig, modulo);

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
   * GET /api/informes/nuevo
   * Obtener datos iniciales para crear un nuevo informe
   */
  async datosNuevoInforme(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const modulo = req.query.modulo as ModuloInforme | undefined;

      // Obtener catálogo y plantillas para el formulario
      const catalogo = informesService.obtenerCatalogo(modulo);
      const plantillas = await informesService.obtenerPlantillas(empresaId, dbConfig, modulo);

      res.json({
        success: true,
        data: {
          catalogo,
          plantillas,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/informes/:id
   * Obtener informe por ID
   */
  async obtenerPorId(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { id } = req.params;

      const informe = await informesService.obtenerPorId(empresaId, dbConfig, id);

      res.json({
        success: true,
        data: informe,
      });
    } catch (error: any) {
      res.status(error.message === 'Informe no encontrado' ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/informes
   * Crear informe
   */
  async crear(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId!;
      const data = CreateInformeSchema.parse(req.body);

      const informe = await informesService.crear(empresaId, dbConfig, data, usuarioId);

      res.status(201).json({
        success: true,
        data: informe,
        message: 'Informe creado correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/informes/:id
   * Actualizar informe
   */
  async actualizar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId!;
      const { id } = req.params;
      const data = UpdateInformeSchema.parse(req.body);

      const informe = await informesService.actualizar(empresaId, dbConfig, id, data, usuarioId);

      res.json({
        success: true,
        data: informe,
        message: 'Informe actualizado correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrado') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/informes/:id
   * Eliminar informe
   */
  async eliminar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { id } = req.params;

      await informesService.eliminar(empresaId, dbConfig, id);

      res.json({
        success: true,
        message: 'Informe eliminado correctamente',
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrado') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/informes/:id/duplicar
   * Duplicar informe
   */
  async duplicar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId!;
      const { id } = req.params;

      const informe = await informesService.duplicar(empresaId, dbConfig, id, usuarioId);

      res.status(201).json({
        success: true,
        data: informe,
        message: 'Informe duplicado correctamente',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/informes/:id/favorito
   * Toggle favorito
   */
  async toggleFavorito(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { id } = req.params;

      const informe = await informesService.toggleFavorito(empresaId, dbConfig, id);

      res.json({
        success: true,
        data: informe,
        message: informe.favorito ? 'Añadido a favoritos' : 'Eliminado de favoritos',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/informes/:id/ejecutar
   * Ejecutar informe y obtener datos
   */
  async ejecutar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { id } = req.params;
      const params = EjecutarInformeSchema.parse(req.body);

      const resultado = await informesService.ejecutar(empresaId, dbConfig, id, params);

      res.json({
        success: true,
        data: resultado.datos,
        totales: resultado.totales,
        pagination: resultado.pagination,
      });
    } catch (error: any) {
      res.status(error.message.includes('no encontrado') ? 404 : 400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/informes/:id/exportar
   * Exportar informe
   */
  async exportar(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const { id } = req.params;
      const params = ExportarInformeSchema.parse(req.body);

      const resultado = await informesService.exportar(empresaId, dbConfig, id, params);

      res.setHeader('Content-Type', resultado.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
      res.send(resultado.buffer);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/informes/debug
   * Debug: ver informes directamente sin filtros (TEMPORAL)
   */
  async debug(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;

      const resultado = await informesService.debug(empresaId, dbConfig);

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/informes/inicializar-plantillas
   * Inicializar plantillas predefinidas (admin)
   */
  async inicializarPlantillas(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId!;
      const forzar = req.body?.forzar === true || req.query?.forzar === 'true';

      const resultado = await informesService.inicializarPlantillas(empresaId, dbConfig, usuarioId, forzar);

      let message = '';
      if (resultado.eliminados && resultado.eliminados > 0) {
        message = `${resultado.eliminados} plantillas eliminadas. ${resultado.insertados} nuevas plantillas creadas.`;
      } else if (resultado.insertados > 0) {
        message = `${resultado.insertados} plantillas inicializadas correctamente`;
      } else {
        message = `Ya existen ${resultado.existentes} plantillas. Use forzar=true para reinicializar.`;
      }

      res.json({
        success: true,
        message,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error inicializando plantillas de informes:', error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/informes/ai/generar
   * Generar informe desde comando de voz/texto
   */
  async generarConIA(req: Request, res: Response) {
    try {
      const empresaId = req.empresaId!;
      const dbConfig = req.empresaDbConfig!;
      const usuarioId = req.usuarioId!;
      const { comando, ejecutar } = GenerarInformeIASchema.parse(req.body);

      // Generar definición con IA
      const resultado = await aiReportsService.generarDefinicionInforme(comando);

      if (!resultado.exito || !resultado.definicion) {
        return res.status(400).json({
          success: false,
          error: resultado.mensaje,
          sugerencias: resultado.sugerencias,
        });
      }

      // Si solo queremos la definición, devolverla
      if (!ejecutar) {
        return res.json({
          success: true,
          data: {
            definicion: resultado.definicion,
            mensaje: resultado.mensaje,
          },
        });
      }

      // Ejecutar el informe directamente
      const datosInforme = await informesService.ejecutarDefinicion(
        empresaId,
        dbConfig,
        resultado.definicion,
        { parametros: {} }
      );

      res.json({
        success: true,
        data: {
          definicion: resultado.definicion,
          datos: datosInforme.datos,
          totales: datosInforme.totales,
          pagination: datosInforme.pagination,
          mensaje: resultado.mensaje,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/informes/ai/sugerencias
   * Obtener sugerencias de comandos
   */
  async obtenerSugerenciasIA(req: Request, res: Response) {
    try {
      const modulo = req.query.modulo as ModuloInforme | undefined;
      const sugerencias = aiReportsService.getSugerenciasComandos(modulo);

      res.json({
        success: true,
        data: sugerencias,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const informesController = new InformesController();
export default informesController;
