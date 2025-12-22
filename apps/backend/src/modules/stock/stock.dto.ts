import { z } from 'zod';
import { TipoMovimiento, OrigenMovimiento } from '@/models/MovimientoStock';

/**
 * Esquema para búsqueda de movimientos
 */
export const SearchMovimientosSchema = z.object({
  productoId: z.string().optional(),
  almacenId: z.string().optional(),
  tipo: z.nativeEnum(TipoMovimiento).optional(),
  origen: z.nativeEnum(OrigenMovimiento).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  terceroId: z.string().optional(),
  terceroTipo: z.enum(['cliente', 'proveedor']).optional(),
  documentoOrigenId: z.string().optional(),
  lote: z.string().optional(),
  numeroSerie: z.string().optional(),
  incluirAnulados: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.string().default('fecha'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchMovimientosDTO = z.infer<typeof SearchMovimientosSchema>;

/**
 * Esquema para crear ajuste de stock
 */
export const CreateAjusteSchema = z.object({
  productoId: z.string().min(1, 'El producto es obligatorio'),
  almacenId: z.string().min(1, 'El almacén es obligatorio'),
  varianteId: z.string().optional(),
  tipo: z.enum(['entrada', 'salida', 'merma']),
  cantidad: z.number().positive('La cantidad debe ser positiva'),
  motivo: z.string().min(3, 'El motivo es obligatorio (mínimo 3 caracteres)'),
  observaciones: z.string().optional(),
  lote: z.string().optional(),
  numeroSerie: z.string().optional(),
  fechaCaducidad: z.string().optional(),
  ubicacion: z.string().optional(),
  costeUnitario: z.number().min(0).optional(),
});

export type CreateAjusteDTO = z.infer<typeof CreateAjusteSchema>;

/**
 * Esquema para vista de stock
 */
export const SearchStockSchema = z.object({
  almacenId: z.string().optional(),
  familiaId: z.string().optional(),
  q: z.string().optional(),
  stockBajo: z.string().optional(),
  sinStock: z.string().optional(),
  conStock: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.string().default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SearchStockDTO = z.infer<typeof SearchStockSchema>;

/**
 * Esquema para valoración de inventario
 */
export const ValoracionInventarioSchema = z.object({
  almacenId: z.string().optional(),
  familiaId: z.string().optional(),
});

export type ValoracionInventarioDTO = z.infer<typeof ValoracionInventarioSchema>;
