import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN - FAMILIAS
// ============================================

// Schema base para crear familia
const FamiliaBaseSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio').toUpperCase(),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),

  // Jerarquía
  familiaPadreId: z.string().optional(),

  // Configuración
  imagenUrl: z.string().url().optional().or(z.literal('')),
  color: z.string().optional(),
  icono: z.string().optional(),

  // Orden
  orden: z.number().default(0),

  // TPV
  usarEnTPV: z.boolean().default(false),
  posicionTPV: z.number().min(0).optional(),
  descripcionAbreviada: z.string().optional(),

  // Módulos específicos
  obligatorio: z.boolean().default(false),
  renting: z.boolean().default(false),

  // Estado
  activo: z.boolean().default(true),

  // Configuración de precios
  aplicarMargenAutomatico: z.boolean().default(false),
  margenPorDefecto: z.number().min(0).max(1000).optional(),
});

// Crear familia
export const CreateFamiliaSchema = FamiliaBaseSchema;

// Actualizar familia
export const UpdateFamiliaSchema = FamiliaBaseSchema.partial();

// Búsqueda y filtros
export const SearchFamiliasSchema = z.object({
  q: z.string().optional(), // Búsqueda de texto general
  codigo: z.string().optional(), // Filtro por código
  nombre: z.string().optional(), // Filtro por nombre
  descripcion: z.string().optional(), // Filtro por descripción
  familiaPadre: z.string().optional(), // Filtro por nombre de familia padre
  familiaPadreId: z.string().optional(), // Filtro por ID de familia padre
  nivel: z.string().transform(val => parseInt(val) || undefined).optional(),
  activo: z.string().transform(val => val === 'true').optional(),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 50).default('50'),
  sortBy: z.string().default('orden'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// TYPES
// ============================================

export type CreateFamiliaDTO = z.infer<typeof CreateFamiliaSchema>;
export type UpdateFamiliaDTO = z.infer<typeof UpdateFamiliaSchema>;
export type SearchFamiliasDTO = z.infer<typeof SearchFamiliasSchema>;