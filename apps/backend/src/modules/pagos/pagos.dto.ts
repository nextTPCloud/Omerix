import { z } from 'zod';

// ============================================
// SCHEMAS GENERALES
// ============================================

export const PagoBaseSchema = z.object({
  concepto: z.enum(['suscripcion', 'upgrade', 'addon', 'factura', 'otro']),
  descripcion: z.string(),
  cantidad: z.number().min(0),
  moneda: z.string().default('EUR'),
  pasarela: z.enum(['stripe', 'paypal', 'redsys', 'transferencia', 'efectivo']),
  metadata: z.record(z.any()).optional(),
});

export const MetodoPagoBaseSchema = z.object({
  tipo: z.enum(['tarjeta', 'paypal']),
  predeterminado: z.boolean().default(false),
});

// ============================================
// TYPES
// ============================================

export type PagoBaseDTO = z.infer<typeof PagoBaseSchema>;
export type MetodoPagoBaseDTO = z.infer<typeof MetodoPagoBaseSchema>;