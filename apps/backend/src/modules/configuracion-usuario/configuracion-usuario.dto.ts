import { z } from 'zod';

/**
 * ============================================
 * SCHEMAS DE VALIDACIÓN BASE
 * ============================================
 */

export const ColumnaConfigSchema = z.object({
  key: z.string().min(1),
  visible: z.boolean(),
  orden: z.number(),
  ancho: z.number().min(50).max(500).optional(),
});

export type ColumnaConfig = z.infer<typeof ColumnaConfigSchema>;

export const SortConfigSchema = z.object({
  key: z.string().min(1),
  direction: z.enum(['asc', 'desc']),
});

export type SortConfig = z.infer<typeof SortConfigSchema>;

export const ColumnFiltersSchema = z.record(
  z.union([z.string(), z.boolean(), z.number()])
);

export type ColumnFilters = z.infer<typeof ColumnFiltersSchema>;

// Schema para filtros avanzados guardados
export const SavedAdvancedFilterSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  valueTo: z.union([z.string(), z.number()]).optional(),
});

// 🔧 CORREGIDO: Usar z.union con z.literal para números
export const ModuleConfigSchema = z.object({
  columnas: z.array(ColumnaConfigSchema),
  sortConfig: SortConfigSchema.optional(),
  columnFilters: ColumnFiltersSchema.optional(),
  advancedFilters: z.array(SavedAdvancedFilterSchema).optional(),
  paginacion: z
    .object({
      limit: z.union([
        z.literal(10),
        z.literal(25),
        z.literal(50),
        z.literal(100),
      ]),
    })
    .optional(),
  filtrosAdicionales: z.any().optional(),
  densidad: z.enum(['compact', 'normal', 'comfortable']).optional(),
});

export type ModuleConfig = z.infer<typeof ModuleConfigSchema>;

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
 * DTO: ACTUALIZAR DENSIDAD
 * ============================================
 */
export const UpdateDensidadBodySchema = z.object({
  modulo: z.string().min(1, 'El módulo es obligatorio'),
  densidad: z.enum(['compact', 'normal', 'comfortable']),
});

export type UpdateDensidadBodyDto = z.infer<typeof UpdateDensidadBodySchema>;

/**
 * ============================================
 * DTO: FAVORITOS
 * ============================================
 */

// Schema para un favorito
export const FavoritoSchema = z.object({
  href: z.string().min(1, 'La ruta es obligatoria'),
  title: z.string().min(1, 'El título es obligatorio'),
  icon: z.string().optional(),
  orden: z.number().default(0),
});

export type FavoritoDto = z.infer<typeof FavoritoSchema>;

// DTO: Agregar favorito
export const AddFavoritoBodySchema = z.object({
  href: z.string().min(1, 'La ruta es obligatoria'),
  title: z.string().min(1, 'El título es obligatorio'),
  icon: z.string().optional(),
});

export type AddFavoritoBodyDto = z.infer<typeof AddFavoritoBodySchema>;

// DTO: Eliminar favorito
export const RemoveFavoritoBodySchema = z.object({
  href: z.string().min(1, 'La ruta es obligatoria'),
});

export type RemoveFavoritoBodyDto = z.infer<typeof RemoveFavoritoBodySchema>;

// DTO: Reordenar favoritos
export const ReorderFavoritosBodySchema = z.object({
  favoritos: z.array(z.object({
    href: z.string().min(1),
    orden: z.number(),
  })).min(1, 'Debe haber al menos un favorito'),
});

export type ReorderFavoritosBodyDto = z.infer<typeof ReorderFavoritosBodySchema>;