import { z } from 'zod';

// ============================================
// CREAR INTENCIÓN DE PAGO
// ============================================

export const CreatePaymentIntentSchema = z.object({
  cantidad: z.number().min(0.5, 'Cantidad mínima: 0.50 EUR'),
  moneda: z.string().default('eur'),
  concepto: z.enum(['suscripcion', 'upgrade', 'addon', 'factura', 'otro']),
  descripcion: z.string(),
  planId: z.string().optional(),
  licenciaId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// CONFIRMAR PAGO
// ============================================

export const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
});

// ============================================
// CREAR SUSCRIPCIÓN
// ============================================

export const CreateSubscriptionSchema = z.object({
  planId: z.string(),
  tipoSuscripcion: z.enum(['mensual', 'anual']).default('mensual'),
  paymentMethodId: z.string().optional(),
  trialDays: z.number().min(0).optional(),
});

// ============================================
// ACTUALIZAR SUSCRIPCIÓN
// ============================================

export const UpdateSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  nuevoPlanId: z.string(),
  prorrateo: z.boolean().default(true),
});

// ============================================
// CANCELAR SUSCRIPCIÓN
// ============================================

export const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  inmediato: z.boolean().default(false),
  motivo: z.string().optional(),
});

// ============================================
// AÑADIR MÉTODO DE PAGO
// ============================================

export const AddPaymentMethodSchema = z.object({
  paymentMethodId: z.string(),
  setPredeterminado: z.boolean().default(false),
});

// ============================================
// CREAR REEMBOLSO
// ============================================

export const CreateRefundSchema = z.object({
  paymentIntentId: z.string(),
  cantidad: z.number().min(0).optional(), // Si no se especifica, reembolso total
  motivo: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
  descripcion: z.string().optional(),
});

// ============================================
// CREAR CHECKOUT SESSION
// ============================================

export const CreateCheckoutSessionSchema = z.object({
  planSlug: z.string(),
  tipoSuscripcion: z.enum(['mensual', 'anual']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// ============================================
// TYPES
// ============================================

export type CreatePaymentIntentDTO = z.infer<typeof CreatePaymentIntentSchema>;
export type ConfirmPaymentDTO = z.infer<typeof ConfirmPaymentSchema>;
export type CreateSubscriptionDTO = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscriptionDTO = z.infer<typeof UpdateSubscriptionSchema>;
export type CancelSubscriptionDTO = z.infer<typeof CancelSubscriptionSchema>;
export type AddPaymentMethodDTO = z.infer<typeof AddPaymentMethodSchema>;
export type CreateRefundDTO = z.infer<typeof CreateRefundSchema>;
export type CreateCheckoutSessionDTO = z.infer<typeof CreateCheckoutSessionSchema>;