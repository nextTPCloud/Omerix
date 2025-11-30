import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const TipoVencimiento = z.enum(['cobro', 'pago']);
export const EstadoVencimiento = z.enum(['pendiente', 'parcial', 'cobrado', 'pagado', 'impagado', 'anulado']);
export const TipoDocumentoOrigen = z.enum(['factura_venta', 'factura_compra', 'manual']);

// ============================================
// SUB-SCHEMAS
// ============================================

export const CobroParcialSchema = z.object({
  fecha: z.string().datetime().or(z.date()),
  importe: z.number().positive('El importe debe ser positivo'),
  formaPagoId: z.string().optional(),
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
});

// ============================================
// CREATE DTO
// ============================================

export const CreateVencimientoSchema = z.object({
  tipo: TipoVencimiento,

  // Documento origen
  documentoOrigen: TipoDocumentoOrigen.default('manual'),
  documentoId: z.string().optional(),
  documentoNumero: z.string().optional(),

  // Tercero
  clienteId: z.string().optional(),
  proveedorId: z.string().optional(),
  terceroNombre: z.string().min(1, 'El nombre del tercero es obligatorio'),
  terceroNif: z.string().optional(),

  // Importes
  importe: z.number().positive('El importe debe ser positivo'),

  // Fechas
  fechaEmision: z.string().datetime().or(z.date()),
  fechaVencimiento: z.string().datetime().or(z.date()),

  // Forma de pago
  formaPagoId: z.string().optional(),
  formaPagoNombre: z.string().optional(),

  // Cuenta bancaria
  cuentaBancariaId: z.string().optional(),
  iban: z.string().optional(),

  // Metadata
  observaciones: z.string().optional(),
});

export type CreateVencimientoDTO = z.infer<typeof CreateVencimientoSchema>;

// ============================================
// UPDATE DTO
// ============================================

export const UpdateVencimientoSchema = z.object({
  // Tercero
  terceroNombre: z.string().min(1).optional(),
  terceroNif: z.string().optional(),

  // Fechas
  fechaVencimiento: z.string().datetime().or(z.date()).optional(),

  // Forma de pago
  formaPagoId: z.string().nullable().optional(),
  formaPagoNombre: z.string().optional(),

  // Cuenta bancaria
  cuentaBancariaId: z.string().nullable().optional(),
  iban: z.string().optional(),

  // Estado
  estado: EstadoVencimiento.optional(),

  // Metadata
  observaciones: z.string().optional(),
});

export type UpdateVencimientoDTO = z.infer<typeof UpdateVencimientoSchema>;

// ============================================
// COBRO/PAGO DTO
// ============================================

export const RegistrarCobroSchema = z.object({
  fecha: z.string().datetime().or(z.date()).optional(),
  importe: z.number().positive('El importe debe ser positivo'),
  formaPagoId: z.string().optional(),
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
});

export type RegistrarCobroDTO = z.infer<typeof RegistrarCobroSchema>;

// ============================================
// SEARCH DTO
// ============================================

export const SearchVencimientosSchema = z.object({
  // Búsqueda
  q: z.string().optional(),

  // Filtros
  tipo: TipoVencimiento.optional(),
  estado: EstadoVencimiento.optional(),
  clienteId: z.string().optional(),
  proveedorId: z.string().optional(),
  formaPagoId: z.string().optional(),
  remesaId: z.string().optional(),

  // Rango de fechas de vencimiento
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),

  // Filtros especiales
  vencidos: z.string().optional(), // 'true' | 'false'
  sinRemesa: z.string().optional(), // 'true' para obtener solo los que no están en remesa

  // Paginación
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),

  // Ordenamiento
  sortBy: z.string().default('fechaVencimiento'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SearchVencimientosDTO = z.infer<typeof SearchVencimientosSchema>;

// ============================================
// REMESA DTO
// ============================================

export const CrearRemesaSchema = z.object({
  vencimientoIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un vencimiento'),
  fechaRemesa: z.string().datetime().or(z.date()).optional(),
  observaciones: z.string().optional(),
});

export type CrearRemesaDTO = z.infer<typeof CrearRemesaSchema>;
