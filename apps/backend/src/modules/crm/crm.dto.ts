import { z } from 'zod';
import { OrigenLead, EstadoLead, InteresLead } from './Lead';
import { EstadoOportunidad } from './Oportunidad';
import { TipoActividad, ResultadoActividad } from './Actividad';

// ============================================
// SUB-SCHEMAS
// ============================================

export const DireccionLeadSchema = z.object({
  calle: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().optional(),
  codigoPostal: z.string().optional(),
  pais: z.string().default('España'),
});

export const LineaOportunidadSchema = z.object({
  _id: z.string().optional(),
  productoId: z.string().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  cantidad: z.number().min(0).default(1),
  precioUnitario: z.number().min(0).default(0),
  descuento: z.number().min(0).max(100).default(0),
});

// ============================================
// LEAD DTOs
// ============================================

export const CreateLeadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidos: z.string().optional(),
  empresa: z.string().optional(),
  cargo: z.string().optional(),

  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  movil: z.string().optional(),
  web: z.string().url('URL inválida').optional().or(z.literal('')),

  direccion: DireccionLeadSchema.optional(),

  origen: z.nativeEnum(OrigenLead).default(OrigenLead.OTRO),
  estado: z.nativeEnum(EstadoLead).default(EstadoLead.NUEVO),
  puntuacion: z.number().min(0).max(100).default(0),
  interes: z.nativeEnum(InteresLead).default(InteresLead.FRIO),

  asignadoA: z.string().optional(),
  proximoContacto: z.string().or(z.date()).optional(),
  notas: z.string().optional(),
  etiquetas: z.array(z.string()).optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export const ConvertirLeadSchema = z.object({
  crearCliente: z.boolean().default(true),
  crearOportunidad: z.boolean().default(true),
  datosCliente: z.object({
    nombre: z.string().optional(),
    nif: z.string().optional(),
    tipoCliente: z.enum(['empresa', 'particular']).default('empresa'),
  }).optional(),
  datosOportunidad: z.object({
    nombre: z.string().optional(),
    valorEstimado: z.number().min(0).optional(),
    etapaId: z.string().optional(),
  }).optional(),
});

export const FiltroLeadsSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.nativeEnum(EstadoLead).optional(),
  origen: z.nativeEnum(OrigenLead).optional(),
  interes: z.nativeEnum(InteresLead).optional(),
  asignadoA: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// ETAPA PIPELINE DTOs
// ============================================

export const CreateEtapaPipelineSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  color: z.string().default('#3B82F6'),
  orden: z.number().default(0),
  probabilidadDefecto: z.number().min(0).max(100).default(0),
  esInicial: z.boolean().default(false),
  esFinal: z.boolean().default(false),
  esCierrePositivo: z.boolean().default(false),
  activo: z.boolean().default(true),
});

export const UpdateEtapaPipelineSchema = CreateEtapaPipelineSchema.partial();

export const ReordenarEtapasSchema = z.object({
  etapas: z.array(z.object({
    id: z.string(),
    orden: z.number(),
  })),
});

// ============================================
// OPORTUNIDAD DTOs
// ============================================

export const CreateOportunidadSchema = z.object({
  clienteId: z.string().optional(),
  leadId: z.string().optional(),
  contactoId: z.string().optional(),

  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),

  etapaId: z.string().min(1, 'La etapa es requerida'),
  probabilidad: z.number().min(0).max(100).default(0),

  valorEstimado: z.number().min(0).default(0),
  moneda: z.string().default('EUR'),

  fechaCierreEstimada: z.string().or(z.date()).optional(),

  estado: z.nativeEnum(EstadoOportunidad).default(EstadoOportunidad.ABIERTA),

  lineas: z.array(LineaOportunidadSchema).optional(),

  asignadoA: z.string().optional(),
  etiquetas: z.array(z.string()).optional(),
});

export const UpdateOportunidadSchema = CreateOportunidadSchema.partial();

export const CambiarEtapaOportunidadSchema = z.object({
  etapaId: z.string().min(1, 'La etapa es requerida'),
  probabilidad: z.number().min(0).max(100).optional(),
});

export const CerrarOportunidadSchema = z.object({
  estado: z.enum(['ganada', 'perdida']),
  fechaCierreReal: z.string().or(z.date()).optional(),
  motivoPerdida: z.string().optional(),
  competidor: z.string().optional(),
});

export const FiltroOportunidadesSchema = z.object({
  busqueda: z.string().optional(),
  estado: z.nativeEnum(EstadoOportunidad).optional(),
  etapaId: z.string().optional(),
  clienteId: z.string().optional(),
  asignadoA: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  valorMinimo: z.number().optional(),
  valorMaximo: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// ACTIVIDAD DTOs
// ============================================

export const CreateActividadSchema = z.object({
  leadId: z.string().optional(),
  oportunidadId: z.string().optional(),
  clienteId: z.string().optional(),

  tipo: z.nativeEnum(TipoActividad),
  asunto: z.string().min(1, 'El asunto es requerido'),
  descripcion: z.string().optional(),

  fechaProgramada: z.string().or(z.date()).optional(),
  duracionMinutos: z.number().min(0).optional(),

  asignadoA: z.string().optional(),
  recordatorio: z.string().or(z.date()).optional(),
});

export const UpdateActividadSchema = CreateActividadSchema.partial();

export const CompletarActividadSchema = z.object({
  fechaRealizacion: z.string().or(z.date()).optional(),
  resultado: z.nativeEnum(ResultadoActividad).default(ResultadoActividad.COMPLETADA),
  notasResultado: z.string().optional(),
});

export const FiltroActividadesSchema = z.object({
  leadId: z.string().optional(),
  oportunidadId: z.string().optional(),
  clienteId: z.string().optional(),
  tipo: z.nativeEnum(TipoActividad).optional(),
  completada: z.boolean().optional(),
  asignadoA: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  sortBy: z.string().default('fechaProgramada'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type CreateLeadDTO = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadDTO = z.infer<typeof UpdateLeadSchema>;
export type ConvertirLeadDTO = z.infer<typeof ConvertirLeadSchema>;
export type FiltroLeadsDTO = z.infer<typeof FiltroLeadsSchema>;

export type CreateEtapaPipelineDTO = z.infer<typeof CreateEtapaPipelineSchema>;
export type UpdateEtapaPipelineDTO = z.infer<typeof UpdateEtapaPipelineSchema>;
export type ReordenarEtapasDTO = z.infer<typeof ReordenarEtapasSchema>;

export type CreateOportunidadDTO = z.infer<typeof CreateOportunidadSchema>;
export type UpdateOportunidadDTO = z.infer<typeof UpdateOportunidadSchema>;
export type CambiarEtapaOportunidadDTO = z.infer<typeof CambiarEtapaOportunidadSchema>;
export type CerrarOportunidadDTO = z.infer<typeof CerrarOportunidadSchema>;
export type FiltroOportunidadesDTO = z.infer<typeof FiltroOportunidadesSchema>;

export type CreateActividadDTO = z.infer<typeof CreateActividadSchema>;
export type UpdateActividadDTO = z.infer<typeof UpdateActividadSchema>;
export type CompletarActividadDTO = z.infer<typeof CompletarActividadSchema>;
export type FiltroActividadesDTO = z.infer<typeof FiltroActividadesSchema>;
