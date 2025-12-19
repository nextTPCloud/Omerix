import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACION - TIPOS DE GASTO
// ============================================

// Schema base
const TipoGastoBaseSchema = z.object({
  codigo: z.string().min(1, 'Codigo requerido').toUpperCase(),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  categoria: z.enum(['material', 'transporte', 'dietas', 'alojamiento', 'herramientas', 'subcontratacion', 'otros']).default('otros'),
  cuenta: z.string().optional(),
  ivaPorDefecto: z.number().min(0).max(100).default(21),
  facturable: z.boolean().default(true),
  margenPorDefecto: z.number().min(0).max(1000).default(0),
  orden: z.number().min(0).default(0),
  activo: z.boolean().default(true),
});

// Crear tipo de gasto
export const CreateTipoGastoSchema = TipoGastoBaseSchema;

// Actualizar tipo de gasto
export const UpdateTipoGastoSchema = TipoGastoBaseSchema.partial();

// Busqueda y filtros
export const SearchTiposGastoSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  activo: z.string().optional(),
  categoria: z.string().optional(),
  facturable: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 50).default('50'),
  sortBy: z.string().default('orden'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// TYPES
// ============================================

export type CreateTipoGastoDTO = z.infer<typeof CreateTipoGastoSchema>;
export type UpdateTipoGastoDTO = z.infer<typeof UpdateTipoGastoSchema>;
export type SearchTiposGastoDTO = z.infer<typeof SearchTiposGastoSchema>;
