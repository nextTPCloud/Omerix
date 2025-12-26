import { z } from 'zod';

// ============================================
// CREAR ORDEN (PAGO ÚNICO)
// ============================================

export const CreateOrderSchema = z.object({
  cantidad: z.number().min(0.01, 'Cantidad mínima: 0.01 EUR'),
  moneda: z.string().default('EUR'),
  concepto: z.enum(['suscripcion', 'upgrade', 'addon', 'factura', 'otro']),
  descripcion: z.string(),
  planId: z.string().optional(),
  licenciaId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================
// CAPTURAR ORDEN
// ============================================

export const CaptureOrderSchema = z.object({
  orderId: z.string(),
});

// ============================================
// CREAR SUSCRIPCIÓN
// ============================================

export const CreatePayPalSubscriptionSchema = z.object({
  planId: z.string().optional(),
  planSlug: z.string().optional(),
  tipoSuscripcion: z.enum(['mensual', 'anual']).optional(),
}).refine(data => data.planId || data.planSlug, {
  message: 'Se requiere planId o planSlug',
});

// ============================================
// CANCELAR SUSCRIPCIÓN
// ============================================

export const CancelPayPalSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  motivo: z.string().optional(),
});

// ============================================
// CREAR REEMBOLSO
// ============================================

export const CreatePayPalRefundSchema = z.object({
  captureId: z.string(),
  cantidad: z.number().min(0).optional(), // Si no se especifica, reembolso total
  motivo: z.string().optional(),
});

// ============================================
// TYPES
// ============================================

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;
export type CaptureOrderDTO = z.infer<typeof CaptureOrderSchema>;
export type CreatePayPalSubscriptionDTO = z.infer<typeof CreatePayPalSubscriptionSchema>;
export type CancelPayPalSubscriptionDTO = z.infer<typeof CancelPayPalSubscriptionSchema>;
export type CreatePayPalRefundDTO = z.infer<typeof CreatePayPalRefundSchema>;