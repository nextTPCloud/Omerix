import { z } from 'zod';

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateEstadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').trim(),
  activo: z.boolean().default(true),
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateEstadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').trim().optional(),
  activo: z.boolean().optional(),
});

// ============================================
// QUERY SCHEMA
// ============================================

export const GetEstadosQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  activo: z.coerce.boolean().optional(),
});

// ============================================
// BULK DELETE SCHEMA
// ============================================

export const BulkDeleteEstadosSchema = z.object({
  ids: z.array(z.string()).min(1, 'Debe proporcionar al menos un ID'),
});

// ============================================
// CHANGE STATUS SCHEMA
// ============================================

export const ChangeStatusSchema = z.object({
  activo: z.boolean(),
});

// ============================================
// TIPOS (para TypeScript)
// ============================================

export type CreateEstadoDto = z.infer<typeof CreateEstadoSchema>;
export type UpdateEstadoDto = z.infer<typeof UpdateEstadoSchema>;
export type GetEstadosQueryDto = z.infer<typeof GetEstadosQuerySchema>;
export type BulkDeleteEstadosDto = z.infer<typeof BulkDeleteEstadosSchema>;
export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;
