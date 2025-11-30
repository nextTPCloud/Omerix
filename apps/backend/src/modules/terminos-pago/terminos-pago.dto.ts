import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN - TÉRMINOS DE PAGO
// ============================================

// Schema para vencimiento individual
const VencimientoSchema = z.object({
  dias: z.number().min(0, 'Los días no pueden ser negativos'),
  porcentaje: z.number()
    .min(0, 'El porcentaje no puede ser negativo')
    .max(100, 'El porcentaje no puede ser mayor a 100'),
});

// Schema base
const TerminoPagoBaseSchema = z.object({
  codigo: z.string().min(1, 'Código requerido').toUpperCase(),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  vencimientos: z.array(VencimientoSchema)
    .min(1, 'Debe tener al menos un vencimiento')
    .refine(
      (vencimientos) => {
        const total = vencimientos.reduce((sum, v) => sum + v.porcentaje, 0);
        return Math.abs(total - 100) < 0.01;
      },
      { message: 'La suma de los porcentajes debe ser 100%' }
    ),
  activo: z.boolean().default(true),
});

// Crear término de pago
export const CreateTerminoPagoSchema = TerminoPagoBaseSchema;

// Actualizar término de pago
export const UpdateTerminoPagoSchema = TerminoPagoBaseSchema.partial();

// Búsqueda y filtros
export const SearchTerminosPagoSchema = z.object({
  q: z.string().optional(),
  activo: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 50).default('50'),
  sortBy: z.string().default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// TYPES
// ============================================

export type VencimientoDTO = z.infer<typeof VencimientoSchema>;
export type CreateTerminoPagoDTO = z.infer<typeof CreateTerminoPagoSchema>;
export type UpdateTerminoPagoDTO = z.infer<typeof UpdateTerminoPagoSchema>;
export type SearchTerminosPagoDTO = z.infer<typeof SearchTerminosPagoSchema>;
