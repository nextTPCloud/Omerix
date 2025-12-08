import { Request, Response } from 'express';
import { portalClienteService } from './portal-cliente.service';

// ============================================
// CONTROLLER PORTAL CLIENTE (ACCESO PÚBLICO)
// ============================================

export class PortalClienteController {
  /**
   * Obtener presupuesto por token (público)
   * GET /api/portal/presupuesto/:token
   */
  async obtenerPresupuesto(req: Request, res: Response) {
    try {
      const { token } = req.params;

      if (!token || token.length < 32) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido',
        });
      }

      const resultado = await portalClienteService.obtenerPorToken(token);

      if (!resultado) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado o enlace expirado',
        });
      }

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al obtener presupuesto por token:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el presupuesto',
      });
    }
  }

  /**
   * Registrar respuesta del cliente (público)
   * POST /api/portal/presupuesto/:token/responder
   */
  async registrarRespuesta(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { aceptado, comentarios, nombreFirmante } = req.body;

      if (!token || token.length < 32) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido',
        });
      }

      if (typeof aceptado !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Debe indicar si acepta o rechaza el presupuesto',
        });
      }

      // Obtener info del cliente
      const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'desconocido';
      const userAgent = req.headers['user-agent'] || 'desconocido';

      const resultado = await portalClienteService.registrarRespuesta(
        token,
        { aceptado, comentarios, nombreFirmante },
        { ip: String(ip), userAgent }
      );

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      res.json(resultado);
    } catch (error: any) {
      console.error('Error al registrar respuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar la respuesta',
      });
    }
  }
}

export const portalClienteController = new PortalClienteController();
