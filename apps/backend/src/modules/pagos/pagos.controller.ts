import { Request, Response } from 'express';
import { PagosService } from './pagos.service';

const pagosService = new PagosService();

// ============================================
// OBTENER HISTORIAL DE PAGOS
// ============================================

export const getPayments = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const { pasarela, estado, concepto, limit } = req.query;

    const pagos = await pagosService.getAllPayments(empresaId, {
      pasarela: pasarela as string,
      estado: estado as string,
      concepto: concepto as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: pagos,
    });
  } catch (error: any) {
    console.error('Error obteniendo pagos:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo pagos',
    });
  }
};

// ============================================
// OBTENER MÉTODOS DE PAGO
// ============================================

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const metodos = await pagosService.getAllPaymentMethods(empresaId);

    res.json({
      success: true,
      data: metodos,
    });
  } catch (error: any) {
    console.error('Error obteniendo métodos de pago:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo métodos de pago',
    });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================

export const getPaymentStats = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const stats = await pagosService.getPaymentStats(empresaId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo estadísticas',
    });
  }
};

// ============================================
// OBTENER DETALLE DE PAGO
// ============================================

export const getPayment = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const { id } = req.params;

    const pago = await pagosService.getPaymentById(empresaId, id);

    res.json({
      success: true,
      data: pago,
    });
  } catch (error: any) {
    console.error('Error obteniendo pago:', error);

    const statusCode = error.message === 'Pago no encontrado' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error obteniendo pago',
    });
  }
};