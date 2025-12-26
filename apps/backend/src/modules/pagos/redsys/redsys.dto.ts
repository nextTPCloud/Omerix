import { z } from 'zod';

// ============================================
// CREAR PAGO
// ============================================

export const CreateRedsysPaymentSchema = z.object({
  cantidad: z.number().min(0.01, 'Cantidad mínima: 0.01 EUR'),
  concepto: z.enum(['suscripcion', 'upgrade', 'addon', 'factura', 'otro']),
  descripcion: z.string(),
  planId: z.string().optional(),
  licenciaId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// CONFIRMAR PAGO (desde notificación)
// ============================================

export const ConfirmRedsysPaymentSchema = z.object({
  Ds_SignatureVersion: z.string(),
  Ds_MerchantParameters: z.string(),
  Ds_Signature: z.string(),
});

// ============================================
// CREAR SUSCRIPCIÓN (tokenización)
// ============================================

export const CreateRedsysSubscriptionSchema = z.object({
  planId: z.string().optional(),
  planSlug: z.string().optional(),
  tipoSuscripcion: z.enum(['mensual', 'anual']).optional(),
}).refine(data => data.planId || data.planSlug, {
  message: 'Se requiere planId o planSlug',
});

// ============================================
// CANCELAR SUSCRIPCIÓN
// ============================================

export const CancelRedsysSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  motivo: z.string().optional(),
});

// ============================================
// CREAR REEMBOLSO
// ============================================

export const CreateRedsysRefundSchema = z.object({
  transaccionId: z.string(),
  cantidad: z.number().min(0).optional(), // Si no se especifica, reembolso total
  motivo: z.string().optional(),
});

// ============================================
// TYPES
// ============================================

export type CreateRedsysPaymentDTO = z.infer<typeof CreateRedsysPaymentSchema>;
export type ConfirmRedsysPaymentDTO = z.infer<typeof ConfirmRedsysPaymentSchema>;
export type CreateRedsysSubscriptionDTO = z.infer<typeof CreateRedsysSubscriptionSchema>;
export type CancelRedsysSubscriptionDTO = z.infer<typeof CancelRedsysSubscriptionSchema>;
export type CreateRedsysRefundDTO = z.infer<typeof CreateRedsysRefundSchema>;