import { Request, Response, NextFunction } from 'express';
import { cuentasBancariasService } from './cuentas-bancarias.service';

class CuentasBancariasController {
  /**
   * Listar cuentas bancarias
   * GET /cuentas-bancarias
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const filtros = {
        activa: req.query.activa !== undefined ? req.query.activa === 'true' : undefined,
        usarParaCobros: req.query.usarParaCobros !== undefined ? req.query.usarParaCobros === 'true' : undefined,
        usarParaPagos: req.query.usarParaPagos !== undefined ? req.query.usarParaPagos === 'true' : undefined,
        busqueda: req.query.busqueda as string | undefined,
      };

      const cuentas = await cuentasBancariasService.listar(empresaId, filtros);

      res.json({ success: true, data: cuentas });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar para selector (solo activas, formato simplificado)
   * GET /cuentas-bancarias/selector
   */
  async listarParaSelector(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const cuentas = await cuentasBancariasService.listarParaSelector(empresaId);

      res.json({ success: true, data: cuentas });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener cuenta por ID
   * GET /cuentas-bancarias/:id
   */
  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const { id } = req.params;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const cuenta = await cuentasBancariasService.obtenerPorId(empresaId, id);

      if (!cuenta) {
        res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        return;
      }

      res.json({ success: true, data: cuenta });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crear cuenta bancaria
   * POST /cuentas-bancarias
   */
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const usuarioId = (req as any).userId;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const { iban, banco, bic, titular, alias, saldoInicial, usarParaCobros, usarParaPagos, predeterminada } = req.body;

      if (!iban || !banco || !titular) {
        res.status(400).json({ success: false, error: 'IBAN, banco y titular son obligatorios' });
        return;
      }

      const cuenta = await cuentasBancariasService.crear(empresaId, {
        iban,
        banco,
        bic,
        titular,
        alias,
        saldoInicial,
        usarParaCobros,
        usarParaPagos,
        predeterminada,
        usuarioId,
      });

      res.status(201).json({
        success: true,
        data: cuenta,
        message: 'Cuenta bancaria creada correctamente',
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ success: false, error: 'Ya existe una cuenta con ese IBAN' });
        return;
      }
      next(error);
    }
  }

  /**
   * Actualizar cuenta bancaria
   * PUT /cuentas-bancarias/:id
   */
  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const usuarioId = (req as any).userId;
      const { id } = req.params;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const cuenta = await cuentasBancariasService.actualizar(empresaId, id, {
        ...req.body,
        usuarioId,
      });

      if (!cuenta) {
        res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        return;
      }

      res.json({
        success: true,
        data: cuenta,
        message: 'Cuenta bancaria actualizada correctamente',
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(400).json({ success: false, error: 'Ya existe una cuenta con ese IBAN' });
        return;
      }
      next(error);
    }
  }

  /**
   * Establecer como predeterminada
   * POST /cuentas-bancarias/:id/predeterminada
   */
  async setPredeterminada(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const { id } = req.params;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const cuenta = await cuentasBancariasService.setPredeterminada(empresaId, id);

      if (!cuenta) {
        res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        return;
      }

      res.json({
        success: true,
        data: cuenta,
        message: 'Cuenta establecida como predeterminada',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar cuenta (desactivar)
   * DELETE /cuentas-bancarias/:id
   */
  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = (req as any).empresaId;
      const usuarioId = (req as any).userId;
      const { id } = req.params;

      if (!empresaId) {
        res.status(400).json({ success: false, error: 'Empresa no especificada' });
        return;
      }

      const resultado = await cuentasBancariasService.eliminar(empresaId, id, usuarioId);

      if (!resultado) {
        res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
        return;
      }

      res.json({
        success: true,
        message: 'Cuenta bancaria eliminada correctamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cuentasBancariasController = new CuentasBancariasController();
