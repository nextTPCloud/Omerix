import { Request, Response, NextFunction } from 'express';
import { tesoreriaDashboardService } from './tesoreria-dashboard.service';

class TesoreriaController {
  /**
   * GET /tesoreria/estadisticas
   * Obtener estadísticas generales de tesorería
   */
  async getEstadisticas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const dbConfig = (req as any).dbConfig;

      const estadisticas = await tesoreriaDashboardService.getEstadisticas(empresaId, dbConfig);

      res.json({ success: true, data: estadisticas });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tesoreria/prevision-caja
   * Obtener previsión de caja
   */
  async getPrevisionCaja(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const dbConfig = (req as any).dbConfig;
      const dias = parseInt(req.query.dias as string) || 30;
      const saldoInicial = parseFloat(req.query.saldoInicial as string) || 0;

      const prevision = await tesoreriaDashboardService.getPrevisionCaja(
        empresaId,
        dias,
        saldoInicial,
        dbConfig
      );

      res.json({ success: true, data: prevision });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tesoreria/cliente/:clienteId/resumen
   * Obtener resumen de tesorería de un cliente
   */
  async getResumenCliente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const dbConfig = (req as any).dbConfig;
      const { clienteId } = req.params;

      const resumen = await tesoreriaDashboardService.getResumenPorCliente(
        empresaId,
        clienteId,
        dbConfig
      );

      res.json({ success: true, data: resumen });
    } catch (error) {
      next(error);
    }
  }
}

export const tesoreriaController = new TesoreriaController();
