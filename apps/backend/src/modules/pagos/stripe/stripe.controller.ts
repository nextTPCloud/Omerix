import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import {
  CreatePaymentIntentSchema,
  ConfirmPaymentSchema,
  CreateSubscriptionSchema,
  UpdateSubscriptionSchema,
  CancelSubscriptionSchema,
  AddPaymentMethodSchema,
  CreateRefundSchema,
  CreatePaymentIntentDTO,
  ConfirmPaymentDTO,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  CancelSubscriptionDTO,
  AddPaymentMethodDTO,
  CreateRefundDTO,
} from './stripe.dto';

const stripeService = new StripeService();

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
// CREAR INTENCIÓN DE PAGO
// ============================================

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<CreatePaymentIntentDTO>(
      CreatePaymentIntentSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await stripeService.createPaymentIntent(empresaId, validation.data);

    res.status(201).json({
      success: true,
      message: 'Payment Intent creado exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creando Payment Intent:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error creando Payment Intent',
    });
  }
};

// ============================================
// CONFIRMAR PAGO
// ============================================

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<ConfirmPaymentDTO>(
      ConfirmPaymentSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const pago = await stripeService.confirmPayment(
      empresaId,
      validation.data.paymentIntentId
    );

    res.json({
      success: true,
      message: 'Pago confirmado',
      data: pago,
    });
  } catch (error: any) {
    console.error('Error confirmando pago:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error confirmando pago',
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
    const validation = validateRequest<CreateSubscriptionDTO>(
      CreateSubscriptionSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const result = await stripeService.createSubscription(empresaId, validation.data);

    res.status(201).json({
      success: true,
      message: 'Suscripción creada exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creando suscripción:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error creando suscripción',
    });
  }
};

// ============================================
// ACTUALIZAR SUSCRIPCIÓN
// ============================================

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<UpdateSubscriptionDTO>(
      UpdateSubscriptionSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const subscription = await stripeService.updateSubscription(
      empresaId,
      validation.data
    );

    res.json({
      success: true,
      message: 'Suscripción actualizada exitosamente',
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error actualizando suscripción:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error actualizando suscripción',
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
    const validation = validateRequest<CancelSubscriptionDTO>(
      CancelSubscriptionSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const subscription = await stripeService.cancelSubscription(
      empresaId,
      validation.data
    );

    res.json({
      success: true,
      message: 'Suscripción cancelada exitosamente',
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error cancelando suscripción:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelando suscripción',
    });
  }
};

// ============================================
// AÑADIR MÉTODO DE PAGO
// ============================================

export const addPaymentMethod = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<AddPaymentMethodDTO>(
      AddPaymentMethodSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const metodoPago = await stripeService.addPaymentMethod(
      empresaId,
      validation.data
    );

    res.status(201).json({
      success: true,
      message: 'Método de pago añadido exitosamente',
      data: metodoPago,
    });
  } catch (error: any) {
    console.error('Error añadiendo método de pago:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error añadiendo método de pago',
    });
  }
};

// ============================================
// ELIMINAR MÉTODO DE PAGO
// ============================================

export const removePaymentMethod = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;
    const { id } = req.params;

    const result = await stripeService.removePaymentMethod(empresaId, id);

    res.json(result);
  } catch (error: any) {
    console.error('Error eliminando método de pago:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error eliminando método de pago',
    });
  }
};

// ============================================
// OBTENER MÉTODOS DE PAGO
// ============================================

export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    const metodos = await stripeService.getPaymentMethods(empresaId);

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
// CREAR REEMBOLSO
// ============================================

export const createRefund = async (req: Request, res: Response) => {
  try {
    const empresaId = req.empresaId!;

    // Validar
    const validation = validateRequest<CreateRefundDTO>(
      CreateRefundSchema,
      req.body
    );

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const refund = await stripeService.createRefund(empresaId, validation.data);

    res.status(201).json({
      success: true,
      message: 'Reembolso creado exitosamente',
      data: refund,
    });
  } catch (error: any) {
    console.error('Error creando reembolso:', error);

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

    const pagos = await stripeService.getPaymentHistory(empresaId, limit);

    res.json({
      success: true,
      data: pagos,
    });
  } catch (error: any) {
    console.error('Error obteniendo historial de pagos:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo historial de pagos',
    });
  }
};

// ============================================
// OBTENER CLAVE PÚBLICA DE STRIPE
// ============================================

export const getPublishableKey = async (req: Request, res: Response) => {
  try {
    const config = await import('../../../config/env');

    res.json({
      success: true,
      data: {
        publishableKey: config.default.stripe.publishableKey,
      },
    });
  } catch (error: any) {
    console.error('Error obteniendo clave pública:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error obteniendo clave pública',
    });
  }
};