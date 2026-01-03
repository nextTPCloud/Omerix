/**
 * DTOs de Contabilidad con validación Zod
 */

import { z } from 'zod';
import { TipoCuenta, NaturalezaCuenta, TipoTercero } from './models/PlanCuentas';
import { OrigenAsiento, EstadoAsiento } from './models/AsientoContable';

// ============================================
// CUENTAS CONTABLES
// ============================================

export const CrearCuentaSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(12, 'El código no puede tener más de 12 caracteres')
    .regex(/^\d+$/, 'El código debe contener solo números'),
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede tener más de 200 caracteres'),
  descripcion: z.string().max(500).optional(),
  terceroId: z.string().optional(),
  terceroTipo: z.enum([TipoTercero.CLIENTE, TipoTercero.PROVEEDOR]).optional(),
});

export const ActualizarCuentaSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(500).optional(),
});

export const FiltrosCuentasSchema = z.object({
  nivel: z.coerce.number().min(1).max(10).optional(),
  tipo: z.enum([
    TipoCuenta.ACTIVO,
    TipoCuenta.PASIVO,
    TipoCuenta.PATRIMONIO,
    TipoCuenta.INGRESO,
    TipoCuenta.GASTO,
  ]).optional(),
  esMovimiento: z.coerce.boolean().optional(),
  activa: z.coerce.boolean().optional(),
  busqueda: z.string().optional(),
  codigoPadre: z.string().optional(),
});

// ============================================
// ASIENTOS CONTABLES
// ============================================

export const LineaAsientoSchema = z.object({
  cuentaCodigo: z.string().min(1, 'El código de cuenta es requerido'),
  debe: z.number().min(0).default(0),
  haber: z.number().min(0).default(0),
  concepto: z.string().max(500).optional(),
  terceroId: z.string().optional(),
  documentoRef: z.string().optional(),
});

export const CrearAsientoSchema = z.object({
  fecha: z.coerce.date(),
  concepto: z
    .string()
    .min(1, 'El concepto es requerido')
    .max(500, 'El concepto no puede tener más de 500 caracteres'),
  lineas: z
    .array(LineaAsientoSchema)
    .min(2, 'Un asiento debe tener al menos 2 líneas'),
  origenTipo: z.enum([
    OrigenAsiento.FACTURA_VENTA,
    OrigenAsiento.FACTURA_COMPRA,
    OrigenAsiento.COBRO,
    OrigenAsiento.PAGO,
    OrigenAsiento.MANUAL,
    OrigenAsiento.APERTURA,
    OrigenAsiento.CIERRE,
    OrigenAsiento.REGULARIZACION,
    OrigenAsiento.AJUSTE,
  ]).optional(),
  origenId: z.string().optional(),
  origenNumero: z.string().optional(),
});

export const FiltrosAsientosSchema = z.object({
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  ejercicio: z.coerce.number().optional(),
  periodo: z.coerce.number().min(1).max(12).optional(),
  cuentaCodigo: z.string().optional(),
  origenTipo: z.enum([
    OrigenAsiento.FACTURA_VENTA,
    OrigenAsiento.FACTURA_COMPRA,
    OrigenAsiento.COBRO,
    OrigenAsiento.PAGO,
    OrigenAsiento.MANUAL,
    OrigenAsiento.APERTURA,
    OrigenAsiento.CIERRE,
    OrigenAsiento.REGULARIZACION,
    OrigenAsiento.AJUSTE,
  ]).optional(),
  estado: z.enum([
    EstadoAsiento.BORRADOR,
    EstadoAsiento.CONTABILIZADO,
    EstadoAsiento.ANULADO,
  ]).optional(),
  concepto: z.string().optional(),
  pagina: z.coerce.number().min(1).default(1),
  limite: z.coerce.number().min(1).max(100).default(50),
});

export const AnularAsientoSchema = z.object({
  motivo: z
    .string()
    .min(1, 'El motivo de anulación es requerido')
    .max(500, 'El motivo no puede tener más de 500 caracteres'),
});

// ============================================
// CONFIGURACIÓN
// ============================================

export const ActualizarConfigSchema = z.object({
  ejercicioActivo: z.number().optional(),
  generarAsientosAutomaticos: z.boolean().optional(),
  permitirAsientosDescuadrados: z.boolean().optional(),
  bloquearPeriodosCerrados: z.boolean().optional(),
  requerirConceptoEnLineas: z.boolean().optional(),
  permitirModificarContabilizados: z.boolean().optional(),
  longitudSubcuentaCliente: z.number().min(4).max(10).optional(),
  longitudSubcuentaProveedor: z.number().min(4).max(10).optional(),
  prefijoCuentaCliente: z.string().optional(),
  prefijoCuentaProveedor: z.string().optional(),
  formatoExportacion: z.enum(['a3', 'sage', 'csv', 'contasol']).optional(),
  cuentasDefecto: z.object({
    clientes: z.string().optional(),
    proveedores: z.string().optional(),
    ventasMercaderias: z.string().optional(),
    comprasMercaderias: z.string().optional(),
    ivaRepercutido21: z.string().optional(),
    ivaRepercutido10: z.string().optional(),
    ivaRepercutido4: z.string().optional(),
    ivaSoportado21: z.string().optional(),
    ivaSoportado10: z.string().optional(),
    ivaSoportado4: z.string().optional(),
    caja: z.string().optional(),
    bancos: z.string().optional(),
  }).optional(),
});

// ============================================
// INFORMES
// ============================================

export const FiltrosInformesSchema = z.object({
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  ejercicio: z.coerce.number().optional(),
  cuentaDesde: z.string().optional(),
  cuentaHasta: z.string().optional(),
  nivel: z.coerce.number().min(1).max(10).optional(),
  incluirCuentasSinMovimiento: z.coerce.boolean().default(false),
}).transform((data) => {
  // Si no hay fechas pero hay ejercicio, calcularlas automáticamente
  const ejercicio = data.ejercicio || new Date().getFullYear();
  return {
    ...data,
    ejercicio,
    fechaDesde: data.fechaDesde || new Date(ejercicio, 0, 1), // 1 de enero
    fechaHasta: data.fechaHasta || new Date(ejercicio, 11, 31), // 31 de diciembre
  };
});

export const ExportarSchema = z.object({
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  formato: z.enum(['a3', 'sage', 'csv']),
  ejercicio: z.coerce.number().optional(),
  incluirCabecera: z.boolean().default(true),
}).transform((data) => {
  const ejercicio = data.ejercicio || new Date().getFullYear();
  return {
    ...data,
    ejercicio,
    fechaDesde: data.fechaDesde || new Date(ejercicio, 0, 1),
    fechaHasta: data.fechaHasta || new Date(ejercicio, 11, 31),
  };
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type CrearCuentaDTO = z.infer<typeof CrearCuentaSchema>;
export type ActualizarCuentaDTO = z.infer<typeof ActualizarCuentaSchema>;
export type FiltrosCuentasDTO = z.infer<typeof FiltrosCuentasSchema>;
export type CrearAsientoDTO = z.infer<typeof CrearAsientoSchema>;
export type FiltrosAsientosDTO = z.infer<typeof FiltrosAsientosSchema>;
export type AnularAsientoDTO = z.infer<typeof AnularAsientoSchema>;
export type ActualizarConfigDTO = z.infer<typeof ActualizarConfigSchema>;
export type FiltrosInformesDTO = z.infer<typeof FiltrosInformesSchema>;
export type ExportarDTO = z.infer<typeof ExportarSchema>;
