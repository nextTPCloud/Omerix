import { z } from 'zod';

/**
 * ============================================
 * VALIDATION SCHEMAS (ZOD)
 * ============================================
 */

// Schema para una columna
export const ColumnaConfigSchema = z.object({
  key: z.string().min(1, 'La key de la columna es obligatoria'),
  visible: z.boolean().default(true),
  orden: z.number().int().min(0, 'El orden debe ser mayor o igual a 0'),
  ancho: z.number().int().min(50).max(500).optional(),
});

// Schema para configuración de ordenamiento
export const SortConfigSchema = z.object({
  key: z.string().min(1, 'La key del sort es obligatoria'),
  direction: z.enum(['asc', 'desc']),
});

// Schema para filtros de columna (flexible)
export const ColumnFiltersSchema = z.record(z.union([z.string(), z.boolean(), z.number()]));

// Schema para configuración de un módulo
export const ModuleConfigSchema = z.object({
  columnas: z.array(ColumnaConfigSchema).default([]),
  sortConfig: SortConfigSchema.optional(),
  columnFilters: ColumnFiltersSchema.optional(),
  paginacion: z.object({
    limit: z.union([
      z.literal(10),
      z.literal(25),
      z.literal(50),
      z.literal(100),
    ]).default(25),
  }).optional(),
  filtrosAdicionales: z.record(z.any()).optional(),
});

// Schema completo de configuraciones
export const ConfiguracionesSchema = z.record(ModuleConfigSchema);

/**
 * ============================================
 * DTO: OBTENER CONFIGURACIÓN DE UN MÓDULO
 * ============================================
 */
export const GetModuleConfigQuerySchema = z.object({
  modulo: z.string().min(1, 'El nombre del módulo es obligatorio'),
});

export type GetModuleConfigQueryDto = z.infer<typeof GetModuleConfigQuerySchema>;

/**
 * ============================================
 * DTO: ACTUALIZAR CONFIGURACIÓN DE UN MÓDULO
 * ============================================
 */
export const UpdateModuleConfigBodySchema = z.object({
  modulo: z.string().min(1, 'El nombre del módulo es obligatorio'),
  configuracion: ModuleConfigSchema,
});

export type UpdateModuleConfigBodyDto = z.infer<typeof UpdateModuleConfigBodySchema>;

/**
 * ============================================
 * DTO: RESTABLECER CONFIGURACIÓN DE UN MÓDULO
 * ============================================
 */
export const ResetModuleConfigBodySchema = z.object({
  modulo: z.string().min(1, 'El nombre del módulo es obligatorio'),
});

export type ResetModuleConfigBodyDto = z.infer<typeof ResetModuleConfigBodySchema>;

/**
 * ============================================
 * DTO: ACTUALIZAR COLUMNAS VISIBLES
 * ============================================
 */
export const UpdateColumnasBodySchema = z.object({
  modulo: z.string().min(1, 'El nombre del módulo es obligatorio'),
  columnas: z.array(ColumnaConfigSchema).min(1, 'Debe haber al menos una columna'),
});

export type UpdateColumnasBodyDto = z.infer<typeof UpdateColumnasBodySchema>;

/**
 * ============================================
 * DTO: ACTUALIZAR ORDENAMIENTO
 * ============================================
 */
export const UpdateSortConfigBodySchema = z.object({
  modulo: z.string().min(1, 'El nombre del módulo es obligatorio'),
  sortConfig: SortConfigSchema,
});

export type UpdateSortConfigBodyDto = z.infer<typeof UpdateSortConfigBodySchema>;

/**
 * ============================================
 * DTO: ACTUALIZAR FILTROS DE COLUMNA
 * ============================================
 */
export const UpdateColumnFiltersBodySchema = z.object({
  modulo: z.string().min(1, 'El nombre del módulo es obligatorio'),
  columnFilters: ColumnFiltersSchema,
});

export type UpdateColumnFiltersBodyDto = z.infer<typeof UpdateColumnFiltersBodySchema>;

/**
 * ============================================
 * DTO: ACTUALIZAR LÍMITE DE PAGINACIÓN
 * ============================================
 */
export const UpdatePaginationLimitBodySchema = z.object({
  modulo: z.string().min(1, 'El nombre del módulo es obligatorio'),
  limit: z.union([
    z.literal(10),
    z.literal(25),
    z.literal(50),
    z.literal(100),
  ]),
});

export type UpdatePaginationLimitBodyDto = z.infer<typeof UpdatePaginationLimitBodySchema>;

/**
 * ============================================
 * EXPORT ALL
 * ============================================
 */
export default {
  GetModuleConfigQuerySchema,
  UpdateModuleConfigBodySchema,
  ResetModuleConfigBodySchema,
  UpdateColumnasBodySchema,
  UpdateSortConfigBodySchema,
  UpdateColumnFiltersBodySchema,
  UpdatePaginationLimitBodySchema,
  ColumnaConfigSchema,
  SortConfigSchema,
  ColumnFiltersSchema,
  ModuleConfigSchema,
  ConfiguracionesSchema,
};