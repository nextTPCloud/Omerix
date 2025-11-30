import { FormaPagoEnum, TipoCliente, TipoDireccion, TipoMandatoSEPA } from '@/modules/clientes/Cliente';
import { z } from 'zod';

// ============================================
// SUB-SCHEMAS - BÁSICOS
// ============================================

// Dirección base (para compatibilidad legacy)
export const DireccionSchema = z.object({
  calle: z.string().min(1, 'La calle es requerida'),
  numero: z.string().optional(),
  piso: z.string().optional(),
  codigoPostal: z.string().min(1, 'El código postal es requerido'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  provincia: z.string().min(1, 'La provincia es requerida'),
  pais: z.string().default('España'),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
});

// Dirección extendida con tipo (NUEVO)
export const DireccionExtendidaSchema = z.object({
  _id: z.string().optional(),
  tipo: z.nativeEnum(TipoDireccion),
  nombre: z.string().optional(),
  calle: z.string().min(1, 'La calle es requerida'),
  numero: z.string().optional(),
  piso: z.string().optional(),
  codigoPostal: z.string().min(1, 'El código postal es requerido'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  provincia: z.string().min(1, 'La provincia es requerida'),
  pais: z.string().default('España'),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  personaContacto: z.string().optional(),
  telefonoContacto: z.string().optional(),
  horario: z.string().optional(),
  notas: z.string().optional(),
  predeterminada: z.boolean().default(false),
  activa: z.boolean().default(true),
});

// Mandato SEPA (NUEVO)
export const MandatoSEPASchema = z.object({
  referencia: z.string().min(1, 'La referencia del mandato es requerida'),
  fechaFirma: z.string().or(z.date()),
  tipoMandato: z.nativeEnum(TipoMandatoSEPA).default(TipoMandatoSEPA.RECURRENTE),
  firmado: z.boolean().default(false),
  fechaRevocacion: z.string().or(z.date()).optional(),
  acreedor: z.object({
    identificador: z.string().optional(),
    nombre: z.string().optional(),
  }).optional(),
});

// Cuenta bancaria con datos SEPA (NUEVO)
export const CuentaBancariaSchema = z.object({
  _id: z.string().optional(),
  alias: z.string().optional(),
  titular: z.string().min(1, 'El titular es requerido'),
  iban: z.string().min(1, 'El IBAN es requerido'),
  swift: z.string().optional(),
  banco: z.string().optional(),
  sucursal: z.string().optional(),
  mandatoSEPA: MandatoSEPASchema.optional(),
  predeterminada: z.boolean().default(false),
  usarParaCobros: z.boolean().default(true),
  usarParaPagos: z.boolean().default(false),
  activa: z.boolean().default(true),
  notas: z.string().optional(),
});

export const PersonaContactoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateClienteSchema = z.object({
  tipoCliente: z.nativeEnum(TipoCliente),
  codigo: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  nombreComercial: z.string().optional(),
  nif: z.string().min(1, 'El NIF es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  movil: z.string().optional(),
  web: z.string().url('URL inválida').optional().or(z.literal('')),

  // ============================================
  // DIRECCIONES MÚLTIPLES (NUEVO)
  // ============================================
  direcciones: z.array(DireccionExtendidaSchema).optional().default([]),

  // Direcciones legacy (para compatibilidad) - DEPRECATED
  direccion: DireccionSchema.optional(),
  direccionEnvio: DireccionSchema.optional(),

  // ============================================
  // CONDICIONES COMERCIALES (MEJORADO)
  // ============================================
  formaPagoId: z.string().optional(),       // Ref a FormaPago
  terminoPagoId: z.string().optional(),     // Ref a TerminoPago

  // Legacy - mantener para compatibilidad
  formaPago: z.nativeEnum(FormaPagoEnum).optional(),
  diasPago: z.number().min(0, 'Los días de pago no pueden ser negativos').default(0),
  descuentoGeneral: z.number().min(0).max(100).optional(),
  tarifaId: z.string().optional(),

  // ============================================
  // CUENTAS BANCARIAS MÚLTIPLES (NUEVO)
  // ============================================
  cuentasBancarias: z.array(CuentaBancariaSchema).optional().default([]),

  // Campos legacy (para compatibilidad) - DEPRECATED
  iban: z.string().optional(),
  swift: z.string().optional(),

  // ============================================
  // CONTACTOS
  // ============================================
  personaContacto: PersonaContactoSchema.optional(),
  personasContacto: z.array(PersonaContactoSchema).optional().default([]),

  // Clasificación
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
  vendedorId: z.string().optional(),

  // Agentes comerciales (puede tener varios)
  agentesComerciales: z.array(z.string()).optional().default([]),

  limiteCredito: z.number().min(0).optional(),
  activo: z.boolean().default(true),
  usarEnTPV: z.boolean().default(false),
  observaciones: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateClienteSchema = z.object({
  tipoCliente: z.nativeEnum(TipoCliente).optional(),
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  nombreComercial: z.string().optional(),
  nif: z.string().min(1, 'El NIF es requerido').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  movil: z.string().optional(),
  web: z.string().url('URL inválida').optional().or(z.literal('')),

  // Direcciones múltiples (NUEVO)
  direcciones: z.array(DireccionExtendidaSchema).optional(),

  // Direcciones legacy (para compatibilidad)
  direccion: DireccionSchema.optional(),
  direccionEnvio: DireccionSchema.optional(),

  // Condiciones comerciales (mejorado)
  formaPagoId: z.string().optional(),
  terminoPagoId: z.string().optional(),

  // Legacy
  formaPago: z.nativeEnum(FormaPagoEnum).optional(),
  diasPago: z.number().min(0, 'Los días de pago no pueden ser negativos').optional(),
  descuentoGeneral: z.number().min(0).max(100).optional(),
  tarifaId: z.string().optional(),

  // Cuentas bancarias múltiples (NUEVO)
  cuentasBancarias: z.array(CuentaBancariaSchema).optional(),

  // Campos legacy (para compatibilidad)
  iban: z.string().optional(),
  swift: z.string().optional(),

  // Contactos
  personaContacto: PersonaContactoSchema.optional(),
  personasContacto: z.array(PersonaContactoSchema).optional(),

  // Clasificación y otros
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
  vendedorId: z.string().optional(),

  // Agentes comerciales (puede tener varios)
  agentesComerciales: z.array(z.string()).optional(),

  limiteCredito: z.number().min(0).optional(),
  activo: z.boolean().optional(),
  usarEnTPV: z.boolean().optional(),
  observaciones: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================
// QUERY SCHEMA - CORREGIDO CON tipoCliente y formaPago
// ============================================

export const GetClientesQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  activo: z.coerce.boolean().optional(),
  tipoCliente: z.enum(['empresa', 'particular']).optional(),
  // Legacy filter
  formaPago: z.enum(['contado', 'transferencia', 'domiciliacion', 'confirming', 'pagare']).optional(),
  // New filters
  formaPagoId: z.string().optional(),
  terminoPagoId: z.string().optional(),
  vendedorId: z.string().optional(),
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
  agenteComercialId: z.string().optional(), // Filtrar por agente comercial
  tags: z.array(z.string()).optional(),
});

// ============================================
// BULK DELETE SCHEMA
// ============================================

export const BulkDeleteClientesSchema = z.object({
  ids: z.array(z.string()).min(1, 'Debe proporcionar al menos un ID'),
});

// ============================================
// CHANGE STATUS SCHEMA
// ============================================

export const ChangeStatusSchema = z.object({
  activo: z.boolean(),
});

// ============================================
// UPLOAD FILE SCHEMA
// ============================================

export const UploadArchivoSchema = z.object({
  nombre: z.string(),
  tipo: z.string(),
  tamaño: z.number(),
});

// ============================================
// EXPORT SCHEMA (Para exportaciones con límites más altos)
// ============================================

export const ExportClientesQuerySchema = z.object({
  search: z.string().optional(),
  tipoCliente: z.nativeEnum(TipoCliente).optional(),
  formaPago: z.nativeEnum(FormaPagoEnum).optional(),
  formaPagoId: z.string().optional(),
  terminoPagoId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  activo: z.coerce.boolean().optional(),
  vendedorId: z.string().optional(),
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // Sin límite de página para exportación
  limit: z.coerce.number().min(1).max(50000).default(50000),
});

// ============================================
// TIPOS (para TypeScript)
// ============================================

export type CreateClienteDto = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteDto = z.infer<typeof UpdateClienteSchema>;
export type GetClientesQueryDto = z.infer<typeof GetClientesQuerySchema>;
export type ExportClientesQueryDto = z.infer<typeof ExportClientesQuerySchema>;
export type BulkDeleteClientesDto = z.infer<typeof BulkDeleteClientesSchema>;
export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;
export type UploadArchivoDto = z.infer<typeof UploadArchivoSchema>;
export type DireccionExtendidaDto = z.infer<typeof DireccionExtendidaSchema>;
export type CuentaBancariaDto = z.infer<typeof CuentaBancariaSchema>;
export type MandatoSEPADto = z.infer<typeof MandatoSEPASchema>;