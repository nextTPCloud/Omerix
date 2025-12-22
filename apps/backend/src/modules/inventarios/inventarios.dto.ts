import { z } from 'zod';

// ============================================
// CREAR INVENTARIO
// ============================================

export const CreateInventarioSchema = z.object({
  almacenId: z.string().min(1, 'El almacén es obligatorio'),
  tipo: z.enum(['total', 'parcial']),
  familiaIds: z.array(z.string()).optional(),
  ubicaciones: z.array(z.string()).optional(),
  soloConStock: z.boolean().optional().default(false),
  bloquearMovimientos: z.boolean().optional().default(false),
  observaciones: z.string().optional(),
});

export type CreateInventarioDTO = z.infer<typeof CreateInventarioSchema>;

// ============================================
// INICIAR INVENTARIO
// ============================================

export const IniciarInventarioSchema = z.object({
  usuarioResponsableId: z.string().optional(),
});

export type IniciarInventarioDTO = z.infer<typeof IniciarInventarioSchema>;

// ============================================
// ACTUALIZAR CONTEO DE LÍNEA
// ============================================

export const ActualizarConteoSchema = z.object({
  lineas: z.array(z.object({
    lineaId: z.string().min(1),
    stockContado: z.number().min(0),
    ubicacion: z.string().optional(),
    lote: z.string().optional(),
    numeroSerie: z.string().optional(),
    fechaCaducidad: z.string().optional(),
    observaciones: z.string().optional(),
    fotoUrl: z.string().optional(),
  })),
});

export type ActualizarConteoDTO = z.infer<typeof ActualizarConteoSchema>;

// ============================================
// CONTEO INDIVIDUAL
// ============================================

export const ConteoLineaSchema = z.object({
  stockContado: z.number().min(0),
  ubicacion: z.string().optional(),
  lote: z.string().optional(),
  numeroSerie: z.string().optional(),
  fechaCaducidad: z.string().optional(),
  observaciones: z.string().optional(),
  fotoUrl: z.string().optional(),
});

export type ConteoLineaDTO = z.infer<typeof ConteoLineaSchema>;

// ============================================
// REVISAR DIFERENCIAS
// ============================================

export const RevisarDiferenciasSchema = z.object({
  lineas: z.array(z.object({
    lineaId: z.string().min(1),
    aprobado: z.boolean(),
    motivoAjuste: z.string().optional(),
  })),
});

export type RevisarDiferenciasDTO = z.infer<typeof RevisarDiferenciasSchema>;

// ============================================
// REGULARIZAR
// ============================================

export const RegularizarInventarioSchema = z.object({
  observacionesRegularizacion: z.string().optional(),
});

export type RegularizarInventarioDTO = z.infer<typeof RegularizarInventarioSchema>;

// ============================================
// ANULAR
// ============================================

export const AnularInventarioSchema = z.object({
  motivoAnulacion: z.string().min(3, 'El motivo de anulación es obligatorio'),
});

export type AnularInventarioDTO = z.infer<typeof AnularInventarioSchema>;

// ============================================
// BUSCAR INVENTARIOS
// ============================================

export const SearchInventariosSchema = z.object({
  q: z.string().optional(),
  almacenId: z.string().optional(),
  tipo: z.enum(['total', 'parcial']).optional(),
  estado: z.enum(['borrador', 'en_conteo', 'pendiente_revision', 'regularizado', 'anulado']).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().default('fechaCreacion'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchInventariosDTO = z.infer<typeof SearchInventariosSchema>;
