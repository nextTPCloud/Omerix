import { Request, Response } from 'express';
import { RedsysService } from './redsys.service';
import {
  CreateRedsysPaymentSchema,
  CreateRedsysSubscriptionSchema,
  CancelRedsysSubscriptionSchema,
  CreateRedsysRefundSchema,
  CreateRedsysPaymentDTO,
  CreateRedsysSubscriptionDTO,
  CancelRedsysSubscriptionDTO,
  CreateRedsysRefundDTO,
} from './redsys.dto';

const redsysService = new RedsysService();

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
// CREAR PAGO
// ============================================

export const createPayment = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<CreateRedsysPaymentDTO>(
      CreateRedsysPaymentSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await redsysService.createPayment(empresaId, validation.data);

    res.status(201).json({
      success: true,
      message: 'Pago de Redsys creado exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creando pago de Redsys:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error creando pago de Redsys',
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
    const validation = validateRequest<CreateRedsysSubscriptionDTO>(
      CreateRedsysSubscriptionSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await redsysService.createSubscription(
      empresaId,
      validation.data
    );

    res.status(201).json({
      success: true,
      message: 'Suscripción de Redsys creada exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creando suscripción de Redsys:', error);

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
    const validation = validateRequest<CancelRedsysSubscriptionDTO>(
      CancelRedsysSubscriptionSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await redsysService.cancelSubscription(
      empresaId,
      validation.data
    );

    res.json({
      success: true,
      message: 'Suscripción cancelada exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error cancelando suscripción de Redsys:', error);

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
    const validation = validateRequest<CreateRedsysRefundDTO>(
      CreateRedsysRefundSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const refund = await redsysService.createRefund(empresaId, validation.data);

    res.status(201).json({
      success: true,
      message: 'Reembolso creado exitosamente',
      data: refund,
    });
  } catch (error: any) {
    console.error('Error creando reembolso de Redsys:', error);

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

    const pagos = await redsysService.getPaymentHistory(empresaId, limit);

    res.json({
      success: true,
      data: pagos,
    });
  } catch (error: any) {
    console.error('Error obteniendo historial de pagos de Redsys:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo historial de pagos',
    });
  }
};