import { z } from 'zod';

// ============================================
// ENUMS (para validación)
// ============================================

export const EstadoProyectoEnum = z.enum([
  'borrador',
  'planificacion',
  'en_curso',
  'pausado',
  'completado',
  'cancelado',
  'cerrado',
]);

export const PrioridadProyectoEnum = z.enum([
  'baja',
  'media',
  'alta',
  'urgente',
]);

export const TipoProyectoEnum = z.enum([
  'interno',
  'cliente',
  'mantenimiento',
  'desarrollo',
  'consultoria',
  'instalacion',
  'otro',
]);

// ============================================
// SCHEMAS AUXILIARES
// ============================================

const HitoSchema = z.object({
  _id: z.string().optional(),
  nombre: z.string().min(1, 'Nombre del hito requerido'),
  descripcion: z.string().optional(),
  fechaPrevista: z.string().or(z.date()),
  fechaReal: z.string().or(z.date()).optional(),
  completado: z.boolean().default(false),
  orden: z.number().default(0),
});

const ParticipanteSchema = z.object({
  _id: z.string().optional(),
  usuarioId: z.string().optional(),
  personalId: z.string().optional(),
  rol: z.string().min(1, 'Rol requerido'),
  horasAsignadas: z.number().min(0).optional(),
  horasTrabajadas: z.number().min(0).default(0),
  activo: z.boolean().default(true),
});

const DireccionProyectoSchema = z.object({
  nombre: z.string().optional(),
  calle: z.string().min(1, 'Calle requerida'),
  numero: z.string().optional(),
  piso: z.string().optional(),
  codigoPostal: z.string().min(1, 'Código postal requerido'),
  ciudad: z.string().min(1, 'Ciudad requerida'),
  provincia: z.string().min(1, 'Provincia requerida'),
  pais: z.string().default('España'),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  notas: z.string().optional(),
});

// ============================================
// SCHEMAS DE RECURRENCIA
// ============================================

export const FrecuenciaRecurrenciaEnum = z.enum([
  'semanal',
  'quincenal',
  'mensual',
  'bimestral',
  'trimestral',
  'semestral',
  'anual',
]);

export const EstadoGeneracionEnum = z.enum([
  'pendiente',
  'albaran_generado',
  'facturado',
  'cancelado',
]);

const LineaPlantillaSchema = z.object({
  _id: z.string().optional(),
  tipo: z.enum(['mano_obra', 'material', 'gasto', 'maquinaria', 'transporte']),
  descripcion: z.string().min(1, 'Descripción requerida'),
  cantidad: z.number().min(0),
  unidad: z.string().default('ud'),
  precioUnitario: z.number().min(0),
  productoId: z.string().optional(),
  personalId: z.string().optional(),
  incluirEnAlbaran: z.boolean().default(true),
});

const InstanciaGeneradaSchema = z.object({
  _id: z.string().optional(),
  fechaGeneracion: z.string().or(z.date()),
  periodoInicio: z.string().or(z.date()),
  periodoFin: z.string().or(z.date()),
  estado: EstadoGeneracionEnum.default('pendiente'),
  parteTrabajoId: z.string().optional(),
  albaranId: z.string().optional(),
  facturaId: z.string().optional(),
  observaciones: z.string().optional(),
});

const ConfiguracionRecurrenciaSchema = z.object({
  activo: z.boolean().default(true),
  frecuencia: FrecuenciaRecurrenciaEnum,
  diaGeneracion: z.number().min(1).max(31).default(1),
  fechaInicio: z.string().or(z.date()),
  fechaFin: z.string().or(z.date()).optional(),
  proximaGeneracion: z.string().or(z.date()).optional(),

  // Acciones automáticas
  generarParteTrabajo: z.boolean().default(true),
  generarAlbaran: z.boolean().default(false),
  generarFactura: z.boolean().default(false),

  // Plantilla e historial
  lineasPlantilla: z.array(LineaPlantillaSchema).default([]),
  instanciasGeneradas: z.array(InstanciaGeneradaSchema).default([]),
});

// ============================================
// SCHEMAS PRINCIPALES
// ============================================

export const CreateProyectoSchema = z.object({
  // Identificación
  codigo: z.string().optional(), // Se genera automáticamente si no se proporciona
  nombre: z.string().min(1, 'Nombre del proyecto requerido').max(200),
  descripcion: z.string().optional(),

  // Cliente (obligatorio)
  clienteId: z.string().min(1, 'Cliente requerido'),

  // Agente comercial
  agenteComercialId: z.string().optional(),

  // Clasificación
  tipo: TipoProyectoEnum.default('cliente'),
  estado: EstadoProyectoEnum.default('borrador'),
  prioridad: PrioridadProyectoEnum.default('media'),

  // Fechas
  fechaInicio: z.string().or(z.date()).optional(),
  fechaFinPrevista: z.string().or(z.date()).optional(),
  fechaFinReal: z.string().or(z.date()).optional(),

  // Ubicación
  direccion: DireccionProyectoSchema.optional(),

  // Presupuesto y costes
  presupuestoEstimado: z.number().min(0).optional(),
  presupuestoAprobado: z.number().min(0).optional(),
  costeReal: z.number().min(0).default(0),
  margenPrevisto: z.number().optional(),

  // Horas
  horasEstimadas: z.number().min(0).optional(),
  horasReales: z.number().min(0).default(0),

  // Hitos
  hitos: z.array(HitoSchema).default([]),

  // Equipo
  responsableId: z.string().optional(),
  participantes: z.array(ParticipanteSchema).default([]),

  // Relaciones
  presupuestosIds: z.array(z.string()).default([]),
  pedidosIds: z.array(z.string()).default([]),
  facturasIds: z.array(z.string()).default([]),
  partesTrabajoIds: z.array(z.string()).default([]),

  // Tags
  tags: z.array(z.string()).default([]),

  // Observaciones
  observaciones: z.string().optional(),

  // Recurrencia/Periodicidad
  esRecurrente: z.boolean().default(false),
  recurrencia: ConfiguracionRecurrenciaSchema.optional(),

  // Control
  activo: z.boolean().default(true),
});

export const UpdateProyectoSchema = CreateProyectoSchema.partial();

export const SearchProyectosSchema = z.object({
  // Búsqueda general
  search: z.string().optional(),

  // Filtros específicos
  clienteId: z.string().optional(),
  agenteComercialId: z.string().optional(),
  tipo: TipoProyectoEnum.optional(),
  estado: EstadoProyectoEnum.optional(),
  estados: z.string().optional(), // Lista separada por comas
  prioridad: PrioridadProyectoEnum.optional(),
  responsableId: z.string().optional(),
  activo: z.enum(['true', 'false', 'all']).optional(),

  // Filtros de fecha
  fechaInicioDesde: z.string().optional(),
  fechaInicioHasta: z.string().optional(),
  fechaFinDesde: z.string().optional(),
  fechaFinHasta: z.string().optional(),

  // Filtros de presupuesto
  presupuestoMin: z.string().optional(),
  presupuestoMax: z.string().optional(),

  // Filtro de retraso
  retrasados: z.enum(['true', 'false']).optional(),

  // Filtro de recurrencia
  esRecurrente: z.enum(['true', 'false']).optional(),
  pendienteGeneracion: z.enum(['true', 'false']).optional(), // Proyectos con próxima generación pendiente

  // Tags
  tags: z.string().optional(), // Lista separada por comas

  // Paginación
  page: z.string().default('1'),
  limit: z.string().default('25'),
  sortBy: z.string().default('fechaCreacion'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const CambiarEstadoProyectoSchema = z.object({
  estado: EstadoProyectoEnum,
  observaciones: z.string().optional(),
});

export const AgregarHitoSchema = z.object({
  nombre: z.string().min(1, 'Nombre del hito requerido'),
  descripcion: z.string().optional(),
  fechaPrevista: z.string().or(z.date()),
  orden: z.number().default(0),
});

export const ActualizarHitoSchema = z.object({
  hitoId: z.string().min(1, 'ID del hito requerido'),
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  fechaPrevista: z.string().or(z.date()).optional(),
  fechaReal: z.string().or(z.date()).optional(),
  completado: z.boolean().optional(),
  orden: z.number().optional(),
});

export const AgregarParticipanteSchema = z.object({
  usuarioId: z.string().optional(),
  personalId: z.string().optional(),
  rol: z.string().min(1, 'Rol requerido'),
  horasAsignadas: z.number().min(0).optional(),
});

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type CreateProyectoDTO = z.infer<typeof CreateProyectoSchema>;
export type UpdateProyectoDTO = z.infer<typeof UpdateProyectoSchema>;
export type SearchProyectosDTO = z.infer<typeof SearchProyectosSchema>;
export type CambiarEstadoProyectoDTO = z.infer<typeof CambiarEstadoProyectoSchema>;
export type AgregarHitoDTO = z.infer<typeof AgregarHitoSchema>;
export type ActualizarHitoDTO = z.infer<typeof ActualizarHitoSchema>;
export type AgregarParticipanteDTO = z.infer<typeof AgregarParticipanteSchema>;
export type HitoDTO = z.infer<typeof HitoSchema>;
export type ParticipanteDTO = z.infer<typeof ParticipanteSchema>;
export type DireccionProyectoDTO = z.infer<typeof DireccionProyectoSchema>;
export type LineaPlantillaDTO = z.infer<typeof LineaPlantillaSchema>;
export type InstanciaGeneradaDTO = z.infer<typeof InstanciaGeneradaSchema>;
export type ConfiguracionRecurrenciaDTO = z.infer<typeof ConfiguracionRecurrenciaSchema>;
export type FrecuenciaRecurrencia = z.infer<typeof FrecuenciaRecurrenciaEnum>;
export type EstadoGeneracion = z.infer<typeof EstadoGeneracionEnum>;
