import { z } from 'zod';

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateClasificacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').trim(),
  activo: z.boolean().default(true),
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateClasificacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').trim().optional(),
  activo: z.boolean().optional(),
});

// ============================================
// QUERY SCHEMA
// ============================================

export const GetClasificacionesQuerySchema = z.object({
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

export const BulkDeleteClasificacionesSchema = z.object({
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

export type CreateClasificacionDto = z.infer<typeof CreateClasificacionSchema>;
export type UpdateClasificacionDto = z.infer<typeof UpdateClasificacionSchema>;
export type GetClasificacionesQueryDto = z.infer<typeof GetClasificacionesQuerySchema>;
export type BulkDeleteClasificacionesDto = z.infer<typeof BulkDeleteClasificacionesSchema>;
export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;
