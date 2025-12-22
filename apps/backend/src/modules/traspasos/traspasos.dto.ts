import { z } from 'zod';
import { EstadoTraspaso } from './Traspaso';

/**
 * Esquema para línea de traspaso
 */
const LineaTraspasoSchema = z.object({
  productoId: z.string().min(1, 'El producto es obligatorio'),
  productoCodigo: z.string().optional(),
  productoNombre: z.string().optional(),
  productoSku: z.string().optional(),
  varianteId: z.string().optional(),
  varianteNombre: z.string().optional(),
  cantidadSolicitada: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  cantidadEnviada: z.number().min(0).optional(),
  cantidadRecibida: z.number().min(0).optional(),
  ubicacionOrigen: z.string().optional(),
  ubicacionDestino: z.string().optional(),
  lote: z.string().optional(),
  numeroSerie: z.string().optional(),
  fechaCaducidad: z.string().optional(),
  costeUnitario: z.number().min(0).optional(),
  observaciones: z.string().optional(),
});

/**
 * Crear traspaso
 */
export const CreateTraspasoSchema = z.object({
  almacenOrigenId: z.string().min(1, 'El almacén de origen es obligatorio'),
  almacenDestinoId: z.string().min(1, 'El almacén de destino es obligatorio'),
  lineas: z.array(LineaTraspasoSchema).min(1, 'Debe incluir al menos una línea'),
  motivoTraspaso: z.string().optional(),
  observaciones: z.string().optional(),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),
}).refine(data => data.almacenOrigenId !== data.almacenDestinoId, {
  message: 'El almacén de origen y destino deben ser diferentes',
  path: ['almacenDestinoId'],
});

export type CreateTraspasoDTO = z.infer<typeof CreateTraspasoSchema>;

/**
 * Actualizar traspaso (solo en borrador)
 */
export const UpdateTraspasoSchema = z.object({
  almacenOrigenId: z.string().optional(),
  almacenDestinoId: z.string().optional(),
  lineas: z.array(LineaTraspasoSchema).optional(),
  motivoTraspaso: z.string().optional(),
  observaciones: z.string().optional(),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),
});

export type UpdateTraspasoDTO = z.infer<typeof UpdateTraspasoSchema>;

/**
 * Confirmar salida
 */
export const ConfirmarSalidaSchema = z.object({
  lineas: z.array(z.object({
    lineaId: z.string(),
    cantidadEnviada: z.number().min(0),
  })).optional(),
  observacionesSalida: z.string().optional(),
});

export type ConfirmarSalidaDTO = z.infer<typeof ConfirmarSalidaSchema>;

/**
 * Confirmar recepción
 */
export const ConfirmarRecepcionSchema = z.object({
  lineas: z.array(z.object({
    lineaId: z.string(),
    cantidadRecibida: z.number().min(0),
    ubicacionDestino: z.string().optional(),
    observaciones: z.string().optional(),
  })).optional(),
  observacionesRecepcion: z.string().optional(),
});

export type ConfirmarRecepcionDTO = z.infer<typeof ConfirmarRecepcionSchema>;

/**
 * Anular traspaso
 */
export const AnularTraspasoSchema = z.object({
  motivoAnulacion: z.string().min(3, 'El motivo de anulación es obligatorio'),
});

export type AnularTraspasoDTO = z.infer<typeof AnularTraspasoSchema>;

/**
 * Búsqueda de traspasos
 */
export const SearchTraspasosSchema = z.object({
  q: z.string().optional(),
  almacenOrigenId: z.string().optional(),
  almacenDestinoId: z.string().optional(),
  estado: z.nativeEnum(EstadoTraspaso).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.string().default('fechaCreacion'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchTraspasosDTO = z.infer<typeof SearchTraspasosSchema>;
