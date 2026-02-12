import { z } from 'zod';
import { TipoOferta } from './Oferta';

// ============================================
// SUB-SCHEMAS
// ============================================

export const EscalaDescuentoSchema = z.object({
  cantidadDesde: z.number().min(1),
  cantidadHasta: z.number().min(1).optional(),
  descuento: z.number().min(0).max(100),
});

export const ConfiguracionOfertaSchema = z.object({
  // NxM
  cantidadLleva: z.number().min(1).optional(),
  cantidadCompra: z.number().min(1).optional(),

  // Segunda unidad
  descuentoSegundaUnidad: z.number().min(0).max(100).optional(),
  descuentoTerceraUnidad: z.number().min(0).max(100).optional(),

  // Unidad gratis
  cantidadParaGratis: z.number().min(1).optional(),
  unidadesGratis: z.number().min(1).optional(),
  productoGratisId: z.string().optional(),

  // Descuentos
  descuento: z.number().optional(),
  precioEspecial: z.number().min(0).optional(),

  // Escalado
  escalas: z.array(EscalaDescuentoSchema).optional(),

  // Condiciones
  cantidadMinima: z.number().min(1).optional(),
  importeMinimo: z.number().min(0).optional(),
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateOfertaSchema = z.object({
  codigo: z.string().max(20).optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  descripcion: z.string().max(500).optional(),

  tipo: z.nativeEnum(TipoOferta),
  configuracion: ConfiguracionOfertaSchema,

  aplicaATodos: z.boolean().default(false),
  productosIncluidos: z.array(z.string()).optional(),
  productosExcluidos: z.array(z.string()).optional(),
  familiasIncluidas: z.array(z.string()).optional(),
  familiasExcluidas: z.array(z.string()).optional(),

  fechaDesde: z.string().transform(val => new Date(val)),
  fechaHasta: z.string().optional().transform(val => val ? new Date(val) : undefined),

  // Restricción horaria (Happy Hours)
  horaDesde: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  horaHasta: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  diasSemana: z.array(z.number().min(0).max(6)).optional(),
  esHappyHour: z.boolean().optional().default(false),

  aplicaATodosClientes: z.boolean().default(true),
  clientesIncluidos: z.array(z.string()).optional(),
  clientesExcluidos: z.array(z.string()).optional(),
  tarifasIncluidas: z.array(z.string()).optional(),

  usosMaximos: z.number().min(1).optional(),
  usosPorCliente: z.number().min(1).optional(),

  acumulable: z.boolean().default(false),
  prioridad: z.number().min(1).max(100).optional().default(10),
  activo: z.boolean().optional().default(true),

  etiqueta: z.string().max(20).optional(),
  color: z.string().max(7).optional(),
  imagen: z.string().optional(),
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateOfertaSchema = CreateOfertaSchema.partial().extend({
  tipo: z.nativeEnum(TipoOferta).optional(),
  configuracion: ConfiguracionOfertaSchema.optional(),
  fechaDesde: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

// ============================================
// QUERY SCHEMA
// ============================================

export const GetOfertasQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional().default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
  activo: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  tipo: z.nativeEnum(TipoOferta).optional(),
  vigente: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
});

// ============================================
// BULK DELETE SCHEMA
// ============================================

export const BulkDeleteOfertasSchema = z.object({
  ids: z.array(z.string()).min(1, 'Debe proporcionar al menos un ID'),
});

// ============================================
// EXPORT TYPES
// ============================================

export type CreateOfertaDto = z.infer<typeof CreateOfertaSchema>;
export type UpdateOfertaDto = z.infer<typeof UpdateOfertaSchema>;
export type GetOfertasQueryDto = z.infer<typeof GetOfertasQuerySchema>;
export type BulkDeleteOfertasDto = z.infer<typeof BulkDeleteOfertasSchema>;
