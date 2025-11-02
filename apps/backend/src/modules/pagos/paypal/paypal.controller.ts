import { Request, Response } from 'express';
import { PayPalService } from './paypal.service';
import {
  CreateOrderSchema,
  CaptureOrderSchema,
  CreatePayPalSubscriptionSchema,
  CancelPayPalSubscriptionSchema,
  CreatePayPalRefundSchema,
  CreateOrderDTO,
  CaptureOrderDTO,
  CreatePayPalSubscriptionDTO,
  CancelPayPalSubscriptionDTO,
  CreatePayPalRefundDTO,
} from './paypal.dto';

const paypalService = new PayPalService();

// ============================================
// HELPER DE VALIDACIÓN
// ============================================

interface ValidationSuccess<T> {
  success: true;
  data: T;
}

interface ValidationError {
  success: false;
  errors: Array<{ field: string; message: string }>;
}

type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

const validateRequest = <T>(schema: any, data: any): ValidationResult<T> => {
  try {
    const validatedData = schema.parse(data) as T;
    return { success: true, data: validatedData };
  } catch (error: any) {
    return {
      success: false,
      errors: error.errors?.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      })) || [{ field: 'unknown', message: error.message }],
    };
  }
};

// ============================================
// CREAR ORDEN (PAGO ÚNICO)
// ============================================

export const createOrder = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<CreateOrderDTO>(
      CreateOrderSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await paypalService.createOrder(empresaId, validation.data);

    res.status(201).json({
      success: true,
      message: 'Orden de PayPal creada exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creando orden de PayPal:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error creando orden de PayPal',
    });
  }
};

// ============================================
// CAPTURAR ORDEN (COMPLETAR PAGO)
// ============================================

export const captureOrder = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<CaptureOrderDTO>(
      CaptureOrderSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await paypalService.captureOrder(
      empresaId,
      validation.data.orderId
    );

    res.json({
      success: true,
      message: 'Orden capturada exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error capturando orden de PayPal:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error capturando orden',
    });
  }
};

// ============================================
// OBTENER DETALLES DE ORDEN
// ============================================

export const getOrder = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const { orderId } = req.params;

    const order = await paypalService.getOrder(empresaId, orderId);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Error obteniendo orden de PayPal:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo orden',
    });
  }
};

// ============================================
// CREAR SUSCRIPCIÓN
// ============================================

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<CreatePayPalSubscriptionDTO>(
      CreatePayPalSubscriptionSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await paypalService.createSubscription(
      empresaId,
      validation.data
    );

    res.status(201).json({
      success: true,
      message: 'Suscripción de PayPal creada exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creando suscripción de PayPal:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error creando suscripción',
    });
  }
};

// ============================================
// CANCELAR SUSCRIPCIÓN
// ============================================

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<CancelPayPalSubscriptionDTO>(
      CancelPayPalSubscriptionSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await paypalService.cancelSubscription(
      empresaId,
      validation.data
    );

    res.json({
      success: true,
      message: 'Suscripción cancelada exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error cancelando suscripción de PayPal:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelando suscripción',
    });
  }
};

// ============================================
// CREAR REEMBOLSO
// ============================================

export const createRefund = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<CreatePayPalRefundDTO>(
      CreatePayPalRefundSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const refund = await paypalService.createRefund(empresaId, validation.data);

    res.status(201).json({
      success: true,
      message: 'Reembolso creado exitosamente',
      data: refund,
    });
  } catch (error: any) {
    console.error('Error creando reembolso de PayPal:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error creando reembolso',
    });
  }
};

// ============================================
// OBTENER HISTORIAL DE PAGOS
// ============================================

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const limit = parseInt(req.query.limit as string) || 20;

    const pagos = await paypalService.getPaymentHistory(empresaId, limit);

    res.json({
      success: true,
      data: pagos,
    });
  } catch (error: any) {
    console.error('Error obteniendo historial de pagos de PayPal:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo historial de pagos',
    });
  }
};

// ============================================
// OBTENER CONFIGURACIÓN (CLIENT ID)
// ============================================

export const getConfig = async (req: Request, res: Response) => {
  try {
    const config = await import('../../../config/env');

    res.json({
      success: true,
      data: {
        clientId: config.default.paypal.clientId,
        mode: config.default.paypal.mode,
      },
    });
  } catch (error: any) {
    console.error('Error obteniendo configuración de PayPal:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo configuración',
    });
  }
};