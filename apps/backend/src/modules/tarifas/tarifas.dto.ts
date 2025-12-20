import { z } from 'zod';

// ============================================
// SUB-SCHEMAS
// ============================================

export const PrecioTarifaSchema = z.object({
  productoId: z.string().min(1, 'El producto es obligatorio'),
  varianteId: z.string().optional(),
  precio: z.number().min(0).optional(),
  descuentoPorcentaje: z.number().min(0).max(100).optional(),
  activo: z.boolean().default(true),
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateTarifaSchema = z.object({
  codigo: z.string().max(20).optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  descripcion: z.string().max(500).optional(),

  tipo: z.enum(['fija', 'porcentaje']).default('fija'),
  basePrecio: z.enum(['venta', 'pvp']).default('venta'),
  porcentajeGeneral: z.number().min(-100).max(100).optional(),

  precios: z.array(PrecioTarifaSchema).optional().default([]),

  fechaDesde: z.string().optional().transform(val => val ? new Date(val) : undefined),
  fechaHasta: z.string().optional().transform(val => val ? new Date(val) : undefined),

  familiasIncluidas: z.array(z.string()).optional(),
  familiasExcluidas: z.array(z.string()).optional(),

  prioridad: z.number().min(1).max(100).optional().default(10),
  activo: z.boolean().optional().default(true),
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateTarifaSchema = CreateTarifaSchema.partial();

// ============================================
// QUERY SCHEMA
// ============================================

export const GetTarifasQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional().default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
  activo: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  tipo: z.enum(['fija', 'porcentaje']).optional(),
  vigente: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
});

// ============================================
// ADD/UPDATE PRECIO SCHEMA
// ============================================

export const AddPrecioTarifaSchema = z.object({
  productoId: z.string().min(1, 'El producto es obligatorio'),
  varianteId: z.string().optional(),
  precio: z.number().min(0).optional(),
  descuentoPorcentaje: z.number().min(0).max(100).optional(),
  activo: z.boolean().optional().default(true),
});

// ============================================
// BULK DELETE SCHEMA
// ============================================

export const BulkDeleteTarifasSchema = z.object({
  ids: z.array(z.string()).min(1, 'Debe proporcionar al menos un ID'),
});

// ============================================
// EXPORT TYPES
// ============================================

export type CreateTarifaDto = z.infer<typeof CreateTarifaSchema>;
export type UpdateTarifaDto = z.infer<typeof UpdateTarifaSchema>;
export type GetTarifasQueryDto = z.infer<typeof GetTarifasQuerySchema>;
export type AddPrecioTarifaDto = z.infer<typeof AddPrecioTarifaSchema>;
export type BulkDeleteTarifasDto = z.infer<typeof BulkDeleteTarifasSchema>;
