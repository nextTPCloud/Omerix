// backend/src/modules/logs/dto/create-audit-log.dto.ts

import { z } from 'zod';
import { LogAction, LogModule, LogResult } from '../interfaces/log.interface';

// ============================================
// DTO PARA CREAR AUDIT LOG
// ============================================

export const CreateAuditLogSchema = z.object({
  empresaId: z.string().min(1, 'La empresa es obligatoria'),
  usuarioId: z.string().min(1, 'El usuario es obligatorio'),
  
  accion: z.nativeEnum(LogAction, {
    errorMap: () => ({ message: 'Acción inválida' }),
  }),
  
  modulo: z.nativeEnum(LogModule, {
    errorMap: () => ({ message: 'Módulo inválido' }),
  }),
  
  descripcion: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  
  entidadTipo: z.string().optional(),
  entidadId: z.string().optional(),
  
  datosAnteriores: z.any().optional(),
  datosNuevos: z.any().optional(),
  
  ip: z.string().min(1, 'La IP es obligatoria'),
  userAgent: z.string().optional(),
  
  resultado: z.nativeEnum(LogResult, {
    errorMap: () => ({ message: 'Resultado inválido' }),
  }).default(LogResult.SUCCESS),
  
  mensajeError: z.string().optional(),
  
  metadata: z.any().optional(),
});

export type CreateAuditLogDTO = z.infer<typeof CreateAuditLogSchema>;

// ============================================
// DTO SIMPLIFICADO (para uso interno)
// ============================================

export const CreateAuditLogSimpleSchema = z.object({
  empresaId: z.string(),
  usuarioId: z.string(),
  accion: z.nativeEnum(LogAction),
  modulo: z.nativeEnum(LogModule),
  descripcion: z.string(),
  ip: z.string(),
  resultado: z.nativeEnum(LogResult).default(LogResult.SUCCESS),
});

export type CreateAuditLogSimpleDTO = z.infer<typeof CreateAuditLogSimpleSchema>;

// ============================================
// DTO PARA CREAR SYSTEM LOG
// ============================================

export const CreateSystemLogSchema = z.object({
  nivel: z.enum(['info', 'warn', 'error', 'fatal', 'debug'], {
    errorMap: () => ({ message: 'Nivel inválido' }),
  }),
  
  mensaje: z
    .string()
    .min(1, 'El mensaje es obligatorio')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
  
  modulo: z.nativeEnum(LogModule, {
    errorMap: () => ({ message: 'Módulo inválido' }),
  }),
  
  accion: z.string().optional(),
  
  stack: z.string().optional(),
  errorCode: z.string().optional(),
  
  empresaId: z.string().optional(),
  usuarioId: z.string().optional(),
  
  contexto: z.any().optional(),
  
  ip: z.string().optional(),
  url: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']).optional(),
});

export type CreateSystemLogDTO = z.infer<typeof CreateSystemLogSchema>;

// ============================================
// DTO PARA CREAR FISCAL LOG
// ============================================

export const CreateFiscalLogSchema = z.object({
  empresaId: z.string().min(1, 'La empresa es obligatoria'),
  usuarioId: z.string().optional(),
  
  documentoTipo: z.enum(['factura', 'ticket', 'rectificativa', 'abono'], {
    errorMap: () => ({ message: 'Tipo de documento inválido' }),
  }),
  
  documentoId: z.string().min(1, 'El ID del documento es obligatorio'),
  
  numeroDocumento: z
    .string()
    .min(1, 'El número de documento es obligatorio')
    .max(50, 'El número de documento no puede exceder 50 caracteres'),
  
  serie: z.string().max(10).optional(),
  
  importe: z
    .number()
    .min(0, 'El importe no puede ser negativo')
    .finite('El importe debe ser un número válido'),
  
  iva: z
    .number()
    .min(0, 'El IVA no puede ser negativo')
    .finite('El IVA debe ser un número válido'),
  
  total: z
    .number()
    .min(0, 'El total no puede ser negativo')
    .finite('El total debe ser un número válido'),
  
  hashAnterior: z.string().optional(),
  
  ticketBAI: z.object({
    tbaiId: z.string(),
    qr: z.string(),
    firma: z.string(),
  }).optional(),
  
  verifactu: z.object({
    idFactura: z.string(),
    hash: z.string(),
    fechaExpedicion: z.date(),
  }).optional(),
  
  metadata: z.any().optional(),
}).refine(
  (data) => {
    // Validar que importe + iva = total (con margen de error de 0.01 por redondeos)
    const calculatedTotal = data.importe + data.iva;
    return Math.abs(calculatedTotal - data.total) < 0.01;
  },
  {
    message: 'El total debe ser igual a importe + IVA',
    path: ['total'],
  }
);

export type CreateFiscalLogDTO = z.infer<typeof CreateFiscalLogSchema>;


// ============================================
// DTO PARA QUERY/FILTROS DE AUDIT LOGS
// ============================================

// Schema base (sin transform)
const QueryAuditLogBaseSchema = z.object({
  empresaId: z.string().optional(),
  usuarioId: z.string().optional(),
  accion: z.nativeEnum(LogAction).optional(),
  modulo: z.nativeEnum(LogModule).optional(),
  entidadTipo: z.string().optional(),
  entidadId: z.string().optional(),
  resultado: z.nativeEnum(LogResult).optional(),
  
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  sortBy: z.enum(['timestamp', 'accion', 'resultado']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schema con transform (para uso normal)
export const QueryAuditLogSchema = QueryAuditLogBaseSchema.transform((data) => ({
  ...data,
  page: data.page ?? 1,
  limit: data.limit ?? 20,
  sortBy: data.sortBy ?? 'timestamp' as const,
  sortOrder: data.sortOrder ?? 'desc' as const,
}));

export type QueryAuditLogDTO = z.output<typeof QueryAuditLogSchema>;

// ============================================
// DTO PARA EXPORTACIÓN DE AUDIT LOGS
// ============================================

export const ExportAuditLogSchema = QueryAuditLogBaseSchema
  .omit({ page: true, limit: true })
  .extend({
    limit: z.coerce.number().int().min(1).max(50000).default(10000),
    format: z.enum(['json', 'csv']).default('json'),
  })
  .transform((data) => ({
    ...data,
    limit: data.limit ?? 10000,
    format: data.format ?? 'json' as const,
    sortBy: data.sortBy ?? 'timestamp' as const,
    sortOrder: data.sortOrder ?? 'desc' as const,
  }));

export type ExportAuditLogDTO = z.output<typeof ExportAuditLogSchema>;

// ============================================
// DTO PARA QUERY/FILTROS DE SYSTEM LOGS
// ============================================

export const QuerySystemLogSchema = z.object({
  nivel: z.enum(['info', 'warn', 'error', 'fatal', 'debug']).optional(),
  modulo: z.nativeEnum(LogModule).optional(),
  empresaId: z.string().optional(),
  errorCode: z.string().optional(),
  
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  sortBy: z.enum(['timestamp', 'nivel']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QuerySystemLogDTO = z.infer<typeof QuerySystemLogSchema>;

// ============================================
// DTO PARA EXPORTACIÓN DE SYSTEM LOGS
// ============================================

export const ExportSystemLogSchema = z.object({
  nivel: z.enum(['info', 'warn', 'error', 'fatal', 'debug']).optional(),
  modulo: z.nativeEnum(LogModule).optional(),
  empresaId: z.string().optional(),
  errorCode: z.string().optional(),
  
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  
  limit: z.coerce.number().int().min(1).max(50000).default(10000),
  
  sortBy: z.enum(['timestamp', 'nivel']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ExportSystemLogDTO = z.infer<typeof ExportSystemLogSchema>;

// ============================================
// DTO PARA QUERY/FILTROS DE FISCAL LOGS
// ============================================

export const QueryFiscalLogSchema = z.object({
  empresaId: z.string().optional(),
  documentoTipo: z.enum(['factura', 'ticket', 'rectificativa', 'abono']).optional(),
  numeroDocumento: z.string().optional(),
  serie: z.string().optional(),
  
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  sortBy: z.enum(['timestamp', 'numeroDocumento', 'total']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryFiscalLogDTO = z.infer<typeof QueryFiscalLogSchema>;

// ============================================
// DTO PARA EXPORTACIÓN DE FISCAL LOGS
// ============================================

export const ExportFiscalLogSchema = z.object({
  empresaId: z.string().optional(),
  documentoTipo: z.enum(['factura', 'ticket', 'rectificativa', 'abono']).optional(),
  numeroDocumento: z.string().optional(),
  serie: z.string().optional(),
  
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  
  limit: z.coerce.number().int().min(1).max(50000).default(10000),
  
  sortBy: z.enum(['timestamp', 'numeroDocumento', 'total']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ExportFiscalLogDTO = z.infer<typeof ExportFiscalLogSchema>;

// ============================================
// DTO PARA RESPUESTAS DE API
// ============================================

export const LogResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any(),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }).optional(),
});

export type LogResponseDTO = z.infer<typeof LogResponseSchema>;

// ============================================
// DTO PARA VERIFICACIÓN DE CADENA BLOCKCHAIN
// ============================================

export const VerifyChainSchema = z.object({
  empresaId: z.string().min(1, 'La empresa es obligatoria'),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

export type VerifyChainDTO = z.infer<typeof VerifyChainSchema>;

// ============================================
// DTO PARA ESTADÍSTICAS
// ============================================

export const GetStatsSchema = z.object({
  empresaId: z.string().min(1, 'La empresa es obligatoria'),
  fechaDesde: z.coerce.date(),
  fechaHasta: z.coerce.date(),
  tipo: z.enum(['audit', 'system', 'fiscal']).optional(),
});

export type GetStatsDTO = z.infer<typeof GetStatsSchema>;

// ============================================
// HELPER: Validar DTO
// ============================================

export const validateDTO = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
  errors?: never;
} | {
  success: false;
  data?: never;
  errors: z.ZodError;
} => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// ============================================
// HELPER: Formatear errores de Zod
// ============================================

export const formatZodErrors = (errors: z.ZodError): string[] => {
  return errors.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
};