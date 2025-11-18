import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN - TIPOS DE IMPUESTO
// ============================================

// Schema base para crear tipo de impuesto
const TipoImpuestoBaseSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio').toUpperCase(),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),

  // Configuración del impuesto
  porcentaje: z.number().min(0, 'El porcentaje no puede ser negativo').max(100, 'El porcentaje no puede superar 100'),
  tipo: z.enum(['IVA', 'IGIC', 'IPSI', 'OTRO']).default('IVA'),

  // Recargo de equivalencia
  recargoEquivalencia: z.boolean().default(false),
  porcentajeRecargo: z.number().min(0).max(100).optional(),

  // Estado
  activo: z.boolean().default(true),
  predeterminado: z.boolean().default(false),
});

// Crear tipo de impuesto
export const CreateTipoImpuestoSchema = TipoImpuestoBaseSchema;

// Actualizar tipo de impuesto
export const UpdateTipoImpuestoSchema = TipoImpuestoBaseSchema.partial();

// Búsqueda y filtros
export const SearchTiposImpuestoSchema = z.object({
  q: z.string().optional(), // Búsqueda de texto
  tipo: z.enum(['IVA', 'IGIC', 'IPSI', 'OTRO']).optional(),
  activo: z.string().transform(val => val === 'true').optional(),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 50).default('50'),
  sortBy: z.string().default('codigo'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// TYPES
// ============================================

export type CreateTipoImpuestoDTO = z.infer<typeof CreateTipoImpuestoSchema>;
export type UpdateTipoImpuestoDTO = z.infer<typeof UpdateTipoImpuestoSchema>;
export type SearchTiposImpuestoDTO = z.infer<typeof SearchTiposImpuestoSchema>;
