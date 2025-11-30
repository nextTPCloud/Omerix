import { z } from 'zod';

// ============================================
// ENUMS SCHEMAS
// ============================================

export const TipoAgenteComercialEnum = z.enum([
  'vendedor',
  'representante',
  'comercial',
  'delegado',
  'agente_externo'
]);

export const EstadoAgenteComercialEnum = z.enum([
  'activo',
  'inactivo',
  'baja',
  'vacaciones'
]);

export const TipoComisionEnum = z.enum([
  'porcentaje',
  'fijo',
  'mixto'
]);

// ============================================
// SUB-SCHEMAS
// ============================================

export const DatosContactoSchema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  emailSecundario: z.string().email('Email secundario inválido').optional().or(z.literal('')),
  telefono: z.string().max(20).optional(),
  telefonoMovil: z.string().max(20).optional(),
  fax: z.string().max(20).optional()
}).optional();

export const DireccionAgenteSchema = z.object({
  direccion: z.string().max(200).optional(),
  codigoPostal: z.string().max(10).optional(),
  ciudad: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  pais: z.string().max(100).optional()
}).optional();

export const ComisionSchema = z.object({
  tipo: TipoComisionEnum.default('porcentaje'),
  porcentaje: z.number().min(0).max(100).optional(),
  importeFijo: z.number().min(0).optional(),
  porcentajeMinimo: z.number().min(0).max(100).optional(),
  porcentajeMaximo: z.number().min(0).max(100).optional()
}).optional();

export const ZonaAsignadaSchema = z.object({
  zona: z.string().min(1, 'La zona es obligatoria').max(100),
  descripcion: z.string().max(500).optional(),
  activa: z.boolean().default(true),
  fechaAsignacion: z.string().optional()
});

export const ObjetivoVentasSchema = z.object({
  periodo: z.string().min(1, 'El periodo es obligatorio'),
  objetivo: z.number().min(0, 'El objetivo debe ser positivo'),
  conseguido: z.number().min(0).default(0)
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateAgenteComercialSchema = z.object({
  codigo: z.string().max(20).optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellidos: z.string().max(150).optional(),
  nif: z.string().max(20).optional(),

  tipo: TipoAgenteComercialEnum.default('comercial'),
  estado: EstadoAgenteComercialEnum.default('activo'),
  activo: z.boolean().default(true),

  contacto: DatosContactoSchema,
  direccion: DireccionAgenteSchema,
  comision: ComisionSchema,

  zonasAsignadas: z.array(ZonaAsignadaSchema).optional(),
  clientesAsignados: z.array(z.string()).optional(),
  familiasAsignadas: z.array(z.string()).optional(),

  iban: z.string().max(34).optional(),
  swift: z.string().max(11).optional(),
  banco: z.string().max(100).optional(),

  objetivosVentas: z.array(ObjetivoVentasSchema).optional(),
  ventasTotales: z.number().min(0).optional(),
  comisionesAcumuladas: z.number().min(0).optional(),

  supervisorId: z.string().optional(),

  fechaAlta: z.string().optional(),
  fechaBaja: z.string().optional(),

  observaciones: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).optional()
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateAgenteComercialSchema = CreateAgenteComercialSchema.partial();

// ============================================
// QUERY SCHEMA
// ============================================

export const GetAgentesQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional().default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
  activo: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  tipo: TipoAgenteComercialEnum.optional(),
  estado: EstadoAgenteComercialEnum.optional(),
  zona: z.string().optional(),
  supervisorId: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional().transform(val =>
    typeof val === 'string' ? val.split(',').map(t => t.trim()) : val
  )
});

// ============================================
// BULK DELETE SCHEMA
// ============================================

export const BulkDeleteAgentesSchema = z.object({
  ids: z.array(z.string()).min(1, 'Debe proporcionar al menos un ID')
});

// ============================================
// CHANGE STATUS SCHEMA
// ============================================

export const ChangeStatusSchema = z.object({
  activo: z.boolean()
});

// ============================================
// ASIGNAR CLIENTES SCHEMA
// ============================================

export const AsignarClientesSchema = z.object({
  clienteIds: z.array(z.string()).min(1, 'Debe proporcionar al menos un cliente')
});

// ============================================
// ASIGNAR ZONAS SCHEMA
// ============================================

export const AsignarZonasSchema = z.object({
  zonas: z.array(ZonaAsignadaSchema).min(1, 'Debe proporcionar al menos una zona')
});

// ============================================
// REGISTRAR VENTA SCHEMA
// ============================================

export const RegistrarVentaSchema = z.object({
  importe: z.number().min(0, 'El importe debe ser positivo'),
  comision: z.number().min(0).optional(),
  periodo: z.string().optional()
});

// ============================================
// EXPORT TYPES
// ============================================

export type CreateAgenteComercialDto = z.infer<typeof CreateAgenteComercialSchema>;
export type UpdateAgenteComercialDto = z.infer<typeof UpdateAgenteComercialSchema>;
export type GetAgentesQueryDto = z.infer<typeof GetAgentesQuerySchema>;
export type BulkDeleteAgentesDto = z.infer<typeof BulkDeleteAgentesSchema>;
export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;
export type AsignarClientesDto = z.infer<typeof AsignarClientesSchema>;
export type AsignarZonasDto = z.infer<typeof AsignarZonasSchema>;
export type RegistrarVentaDto = z.infer<typeof RegistrarVentaSchema>;
