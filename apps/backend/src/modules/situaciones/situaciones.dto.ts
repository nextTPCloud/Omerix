import { z } from 'zod';

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateSituacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').trim(),
  activo: z.boolean().default(true),
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateSituacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').trim().optional(),
  activo: z.boolean().optional(),
});

// ============================================
// QUERY SCHEMA
// ============================================

export const GetSituacionesQuerySchema = z.object({
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

export const BulkDeleteSituacionesSchema = z.object({
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

export type CreateSituacionDto = z.infer<typeof CreateSituacionSchema>;
export type UpdateSituacionDto = z.infer<typeof UpdateSituacionSchema>;
export type GetSituacionesQueryDto = z.infer<typeof GetSituacionesQuerySchema>;
export type BulkDeleteSituacionesDto = z.infer<typeof BulkDeleteSituacionesSchema>;
export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;
