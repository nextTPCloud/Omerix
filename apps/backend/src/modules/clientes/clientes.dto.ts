import { FormaPago, TipoCliente } from '@/models/Cliente';
import { z } from 'zod';

// ============================================
// SUB-SCHEMAS
// ============================================

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
  direccion: DireccionSchema,
  direccionEnvio: DireccionSchema.optional(),
  formaPago: z.nativeEnum(FormaPago),
  diasPago: z.number().min(0, 'Los días de pago no pueden ser negativos').default(0),
  descuentoGeneral: z.number().min(0).max(100).optional(),
  tarifaId: z.string().optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  personaContacto: PersonaContactoSchema.optional(),
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
  vendedorId: z.string().optional(),
  limiteCredito: z.number().min(0).optional(),
  activo: z.boolean().default(true),
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
  direccion: DireccionSchema.optional(),
  direccionEnvio: DireccionSchema.optional(),
  formaPago: z.nativeEnum(FormaPago).optional(),
  diasPago: z.number().min(0, 'Los días de pago no pueden ser negativos').optional(),
  descuentoGeneral: z.number().min(0).max(100).optional(),
  tarifaId: z.string().optional(),
  iban: z.string().optional(),
  swift: z.string().optional(),
  personaContacto: PersonaContactoSchema.optional(),
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
  vendedorId: z.string().optional(),
  limiteCredito: z.number().min(0).optional(),
  activo: z.boolean().optional(),
  observaciones: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================
// QUERY SCHEMA - CORREGIDO CON tipoCliente y formaPago
// ============================================

export const GetClientesQuerySchema = z.object({
  search: z.string().optional(),
  // ✅ AÑADIR ESTOS CAMPOS QUE FALTABAN
  tipoCliente: z.nativeEnum(TipoCliente).optional(),
  formaPago: z.nativeEnum(FormaPago).optional(),
  // Campos existentes
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  activo: z.coerce.boolean().optional(),
  vendedorId: z.string().optional(),
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
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
  formaPago: z.nativeEnum(FormaPago).optional(),
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