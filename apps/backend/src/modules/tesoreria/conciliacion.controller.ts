import { Request, Response, NextFunction } from 'express';
import { conciliacionService, CSVConfig } from './conciliacion.service';
import { EstadoExtracto } from './models/MovimientoExtracto';

class ConciliacionController {
  /**
   * Importar extracto bancario
   * POST /conciliacion/importar
   */
  async importar(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      const usuarioId = req.user?.id;

      if (!empresaId || !usuarioId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado',
        });
      }

      const { cuentaBancariaId, nombreArchivo, contenido, configCSV } = req.body;

      if (!cuentaBancariaId || !nombreArchivo || !contenido) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos: cuentaBancariaId, nombreArchivo, contenido',
        });
      }

      const importacion = await conciliacionService.importarExtracto(
        empresaId,
        cuentaBancariaId,
        nombreArchivo,
        contenido,
        usuarioId,
        configCSV as CSVConfig | undefined
      );

      return res.status(201).json({
        success: true,
        data: importacion,
        message: `Importación creada con ${importacion.totalMovimientos} movimientos`,
      });
    } catch (error: any) {
      console.error('Error importando extracto:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al importar extracto',
      });
    }
  }

  /**
   * Listar importaciones
   * GET /conciliacion/importaciones
   */
  async listarImportaciones(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { cuentaBancariaId } = req.query;

      const importaciones = await conciliacionService.getImportaciones(
        empresaId,
        cuentaBancariaId as string | undefined
      );

      return res.json({
        success: true,
        data: importaciones,
      });
    } catch (error: any) {
      console.error('Error listando importaciones:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al listar importaciones',
      });
    }
  }

  /**
   * Obtener una importación por ID
   * GET /conciliacion/importaciones/:id
   */
  async obtenerImportacion(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { id } = req.params;

      const importacion = await conciliacionService.getImportacion(empresaId, id);

      if (!importacion) {
        return res.status(404).json({
          success: false,
          message: 'Importación no encontrada',
        });
      }

      return res.json({
        success: true,
        data: importacion,
      });
    } catch (error: any) {
      console.error('Error obteniendo importación:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener importación',
      });
    }
  }

  /**
   * Listar movimientos de extracto de una importación
   * GET /conciliacion/importaciones/:id/movimientos
   */
  async listarMovimientosExtracto(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { id } = req.params;
      const { estado, pagina, limite } = req.query;

      const resultado = await conciliacionService.getMovimientosExtracto(empresaId, id, {
        estado: estado as EstadoExtracto | undefined,
        pagina: pagina ? parseInt(pagina as string) : undefined,
        limite: limite ? parseInt(limite as string) : undefined,
      });

      return res.json({
        success: true,
        data: resultado.movimientos,
        pagination: {
          total: resultado.total,
          page: resultado.pagina,
          pages: resultado.totalPaginas,
        },
      });
    } catch (error: any) {
      console.error('Error listando movimientos de extracto:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al listar movimientos',
      });
    }
  }

  /**
   * Ejecutar matching automático
   * POST /conciliacion/importaciones/:id/matching
   */
  async ejecutarMatching(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { id } = req.params;

      const resultados = await conciliacionService.ejecutarMatchingAutomatico(empresaId, id);

      return res.json({
        success: true,
        data: resultados,
        message: `Se encontraron ${resultados.length} matches posibles`,
      });
    } catch (error: any) {
      console.error('Error ejecutando matching:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al ejecutar matching',
      });
    }
  }

  /**
   * Aprobar match sugerido
   * POST /conciliacion/movimientos/:id/aprobar
   */
  async aprobarMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      const usuarioId = req.user?.id;
      if (!empresaId || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { id } = req.params;

      await conciliacionService.aprobarMatch(empresaId, id, usuarioId);

      return res.json({
        success: true,
        message: 'Match aprobado correctamente',
      });
    } catch (error: any) {
      console.error('Error aprobando match:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al aprobar match',
      });
    }
  }

  /**
   * Rechazar match sugerido
   * POST /conciliacion/movimientos/:id/rechazar
   */
  async rechazarMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { id } = req.params;

      await conciliacionService.rechazarMatch(empresaId, id);

      return res.json({
        success: true,
        message: 'Match rechazado correctamente',
      });
    } catch (error: any) {
      console.error('Error rechazando match:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al rechazar match',
      });
    }
  }

  /**
   * Conciliar manualmente
   * POST /conciliacion/movimientos/:id/conciliar
   */
  async conciliarManual(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      const usuarioId = req.user?.id;
      if (!empresaId || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { id } = req.params;
      const { movimientoBancarioId } = req.body;

      if (!movimientoBancarioId) {
        return res.status(400).json({
          success: false,
          message: 'Falta movimientoBancarioId',
        });
      }

      await conciliacionService.conciliarManual(empresaId, id, movimientoBancarioId, usuarioId);

      return res.json({
        success: true,
        message: 'Conciliación manual realizada correctamente',
      });
    } catch (error: any) {
      console.error('Error en conciliación manual:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Error en conciliación manual',
      });
    }
  }

  /**
   * Descartar movimiento de extracto
   * POST /conciliacion/movimientos/:id/descartar
   */
  async descartarMovimiento(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      const usuarioId = req.user?.id;
      if (!empresaId || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({
          success: false,
          message: 'Debe indicar el motivo del descarte',
        });
      }

      await conciliacionService.descartarMovimiento(empresaId, id, motivo, usuarioId);

      return res.json({
        success: true,
        message: 'Movimiento descartado correctamente',
      });
    } catch (error: any) {
      console.error('Error descartando movimiento:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al descartar movimiento',
      });
    }
  }

  /**
   * Buscar movimientos bancarios para conciliación manual
   * GET /conciliacion/buscar-movimientos
   */
  async buscarMovimientos(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { cuentaBancariaId, tipo, importe, fecha, margenDias } = req.query;

      if (!cuentaBancariaId || !tipo || !importe || !fecha) {
        return res.status(400).json({
          success: false,
          message: 'Faltan parámetros: cuentaBancariaId, tipo, importe, fecha',
        });
      }

      const movimientos = await conciliacionService.buscarMovimientosBancarios(
        empresaId,
        cuentaBancariaId as string,
        tipo as any,
        parseFloat(importe as string),
        new Date(fecha as string),
        margenDias ? parseInt(margenDias as string) : 10
      );

      return res.json({
        success: true,
        data: movimientos,
      });
    } catch (error: any) {
      console.error('Error buscando movimientos:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al buscar movimientos',
      });
    }
  }

  /**
   * Finalizar importación
   * POST /conciliacion/importaciones/:id/finalizar
   */
  async finalizarImportacion(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.user?.empresaId;
      const usuarioId = req.user?.id;
      if (!empresaId || !usuarioId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const { id } = req.params;

      await conciliacionService.finalizarImportacion(empresaId, id, usuarioId);

      return res.json({
        success: true,
        message: 'Importación finalizada correctamente',
      });
    } catch (error: any) {
      console.error('Error finalizando importación:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al finalizar importación',
      });
    }
  }
}

export const conciliacionController = new ConciliacionController();
