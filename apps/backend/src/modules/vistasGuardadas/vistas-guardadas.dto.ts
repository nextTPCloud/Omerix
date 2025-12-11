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

export const SortConfigSchema = z.object({
  key: z.string().min(1),
  direction: z.enum(['asc', 'desc']),
});

// Schema para filtros avanzados guardados
export const SavedAdvancedFilterSchema = z.object({
  field: z.string().min(1),
  operator: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  valueTo: z.union([z.string(), z.number()]).optional(),
});

export const ModuleConfigSchema = z.object({
  columnas: z.array(ColumnaConfigSchema),
  sortConfig: SortConfigSchema.optional(),
  columnFilters: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
  advancedFilters: z.array(SavedAdvancedFilterSchema).optional(), // Filtros avanzados
  paginacion: z.object({
    limit: z.union([
      z.literal(10),
      z.literal(25),
      z.literal(50),
      z.literal(100),
    ])
  }).optional(),
  filtrosAdicionales: z.any().optional(),
  densidad: z.enum(['compact', 'normal', 'comfortable']).optional(),
});

/**
 * ============================================
 * DTO: CREAR VISTA GUARDADA
 * ============================================
 */
export const CreateVistaGuardadaSchema = z.object({
  modulo: z.string().min(1, 'El módulo es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(50, 'El nombre no puede exceder 50 caracteres'),
  descripcion: z.string().max(200, 'La descripción no puede exceder 200 caracteres').optional(),
  configuracion: ModuleConfigSchema,
  esDefault: z.boolean().optional().default(false),
  compartida: z.boolean().optional().default(false),
  icono: z.string().optional().default('Eye'),
  color: z.string().optional().default('blue'),
});

export type CreateVistaGuardadaDto = z.infer<typeof CreateVistaGuardadaSchema>;

/**
 * ============================================
 * DTO: ACTUALIZAR VISTA GUARDADA
 * ============================================
 */
export const UpdateVistaGuardadaSchema = z.object({
  nombre: z.string().min(1).max(50).optional(),
  descripcion: z.string().max(200).optional(),
  configuracion: ModuleConfigSchema.optional(),
  esDefault: z.boolean().optional(),
  compartida: z.boolean().optional(),
  icono: z.string().optional(),
  color: z.string().optional(),
});

export type UpdateVistaGuardadaDto = z.infer<typeof UpdateVistaGuardadaSchema>;

/**
 * ============================================
 * DTO: QUERY PARAMS - LISTAR VISTAS
 * ============================================
 */
export const GetVistasGuardadasQuerySchema = z.object({
  modulo: z.string().min(1, 'El módulo es obligatorio'),
  incluirCompartidas: z.string().optional().transform(val => val === 'true'),
});

export type GetVistasGuardadasQueryDto = z.infer<typeof GetVistasGuardadasQuerySchema>;

/**
 * ============================================
 * DTO: APLICAR VISTA
 * ============================================
 */
export const ApplyVistaGuardadaSchema = z.object({
  vistaId: z.string().min(1, 'El ID de la vista es obligatorio'),
});

export type ApplyVistaGuardadaDto = z.infer<typeof ApplyVistaGuardadaSchema>;

/**
 * ============================================
 * DTO: ACTUALIZAR DENSIDAD
 * ============================================
 */
export const UpdateDensidadSchema = z.object({
  modulo: z.string().min(1, 'El módulo es obligatorio'),
  densidad: z.enum(['compact', 'normal', 'comfortable']),
});

export type UpdateDensidadDto = z.infer<typeof UpdateDensidadSchema>;