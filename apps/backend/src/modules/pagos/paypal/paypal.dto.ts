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
  addOns: z.array(z.string()).optional(), // Slugs de los add-ons a contratar
  addOnsConCantidad: z.array(z.object({
    slug: z.string(),
    cantidad: z.number().min(1).max(100),
  })).optional(), // Add-ons con cantidad
  onlyAddOns: z.boolean().optional(), // Si true, solo cobrar add-ons (no cambiar plan)
}).refine(data => data.planId || data.planSlug || (data.onlyAddOns && data.addOns && data.addOns.length > 0), {
  message: 'Se requiere planId, planSlug, o add-ons con onlyAddOns=true',
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