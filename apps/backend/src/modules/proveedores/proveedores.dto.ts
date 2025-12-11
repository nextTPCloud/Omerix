import { TipoProveedor, TipoDireccion } from '@/modules/proveedores/Proveedor';
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

// Dirección extendida con tipo
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

// Cuenta bancaria
export const CuentaBancariaSchema = z.object({
  _id: z.string().optional(),
  alias: z.string().optional(),
  titular: z.string().min(1, 'El titular es requerido'),
  iban: z.string().min(1, 'El IBAN es requerido'),
  swift: z.string().optional(),
  banco: z.string().optional(),
  sucursal: z.string().optional(),
  predeterminada: z.boolean().default(false),
  activa: z.boolean().default(true),
  notas: z.string().optional(),
});

export const PersonaContactoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  departamento: z.string().optional(),
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateProveedorSchema = z.object({
  tipoProveedor: z.nativeEnum(TipoProveedor).default(TipoProveedor.EMPRESA),
  codigo: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  nombreComercial: z.string().optional(),
  nif: z.string().min(1, 'El NIF es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  movil: z.string().optional(),
  fax: z.string().optional(),
  web: z.string().url('URL inválida').optional().or(z.literal('')),

  // Direcciones múltiples
  direcciones: z.array(DireccionExtendidaSchema).optional().default([]),

  // Dirección legacy (para compatibilidad)
  direccion: DireccionSchema.optional(),

  // Condiciones comerciales
  formaPagoId: z.string().optional(),
  terminoPagoId: z.string().optional(),
  diasPago: z.number().min(0, 'Los días de pago no pueden ser negativos').default(30),
  descuentoGeneral: z.number().min(0).max(100).optional(),
  portesMinimosPedido: z.number().min(0).optional(),
  portesImporte: z.number().min(0).optional(),

  // Cuentas bancarias múltiples
  cuentasBancarias: z.array(CuentaBancariaSchema).optional().default([]),

  // Campos legacy (para compatibilidad)
  iban: z.string().optional(),
  swift: z.string().optional(),

  // Contactos
  personaContacto: PersonaContactoSchema.optional(),
  personasContacto: z.array(PersonaContactoSchema).optional().default([]),

  // Clasificación
  categoriaId: z.string().optional(),
  zona: z.string().optional(),

  // Evaluación del proveedor
  calificacion: z.number().min(1).max(5).optional(),
  tiempoEntregaPromedio: z.number().min(0).optional(),
  fiabilidad: z.number().min(0).max(100).optional(),

  // Estado
  activo: z.boolean().default(true),
  observaciones: z.string().optional(),

  // Certificaciones
  certificaciones: z.array(z.string()).optional(),

  // Tags
  tags: z.array(z.string()).optional(),
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateProveedorSchema = z.object({
  tipoProveedor: z.nativeEnum(TipoProveedor).optional(),
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  nombreComercial: z.string().optional(),
  nif: z.string().min(1, 'El NIF es requerido').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  movil: z.string().optional(),
  fax: z.string().optional(),
  web: z.string().url('URL inválida').optional().or(z.literal('')),

  // Direcciones múltiples
  direcciones: z.array(DireccionExtendidaSchema).optional(),

  // Dirección legacy
  direccion: DireccionSchema.optional(),

  // Condiciones comerciales
  formaPagoId: z.string().optional(),
  terminoPagoId: z.string().optional(),
  diasPago: z.number().min(0, 'Los días de pago no pueden ser negativos').optional(),
  descuentoGeneral: z.number().min(0).max(100).optional(),
  portesMinimosPedido: z.number().min(0).optional(),
  portesImporte: z.number().min(0).optional(),

  // Cuentas bancarias múltiples
  cuentasBancarias: z.array(CuentaBancariaSchema).optional(),

  // Campos legacy
  iban: z.string().optional(),
  swift: z.string().optional(),

  // Contactos
  personaContacto: PersonaContactoSchema.optional(),
  personasContacto: z.array(PersonaContactoSchema).optional(),

  // Clasificación
  categoriaId: z.string().optional(),
  zona: z.string().optional(),

  // Evaluación del proveedor
  calificacion: z.number().min(1).max(5).optional(),
  tiempoEntregaPromedio: z.number().min(0).optional(),
  fiabilidad: z.number().min(0).max(100).optional(),

  // Estado
  activo: z.boolean().optional(),
  observaciones: z.string().optional(),

  // Certificaciones
  certificaciones: z.array(z.string()).optional(),

  // Tags
  tags: z.array(z.string()).optional(),
});

// ============================================
// QUERY SCHEMA
// ============================================

export const GetProveedoresQuerySchema = z.object({
  // Paginación
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 25),

  // Ordenación
  sortBy: z.string().optional().default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),

  // Búsqueda
  search: z.string().optional(),

  // Filtros básicos
  activo: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  tipoProveedor: z.nativeEnum(TipoProveedor).optional(),
  categoriaId: z.string().optional(),
  zona: z.string().optional(),

  // Filtros de condiciones comerciales
  formaPagoId: z.string().optional(),
  terminoPagoId: z.string().optional(),

  // Filtros de evaluación
  calificacionMinima: z.string().optional().transform(val => val ? parseFloat(val) : undefined),

  // Filtros avanzados (operadores)
  // Estos son procesados por parseAdvancedFilters en el servicio
});

// ============================================
// TYPES
// ============================================

export type CreateProveedorDTO = z.infer<typeof CreateProveedorSchema>;
export type UpdateProveedorDTO = z.infer<typeof UpdateProveedorSchema>;
export type GetProveedoresQuery = z.infer<typeof GetProveedoresQuerySchema>;
