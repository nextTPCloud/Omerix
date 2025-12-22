import { z } from 'zod';
import { TipoPlanificacion, EstadoPlanificacion, EstadoAsignacion, TipoAusencia } from './Planificacion';

// ============================================
// SCHEMA ASIGNACION
// ============================================

export const AsignacionJornadaSchema = z.object({
  fecha: z.string().or(z.date()),
  personalId: z.string(),
  personalNombre: z.string().optional(),
  turnoId: z.string().optional(),
  turnoNombre: z.string().optional(),
  horaInicio: z.string(),
  horaFin: z.string(),
  horasPlanificadas: z.number().optional(),
  horasReales: z.number().optional(),
  ubicacion: z.string().optional(),
  departamentoId: z.string().optional(),
  departamentoNombre: z.string().optional(),
  estado: z.nativeEnum(EstadoAsignacion).optional(),
  esAusencia: z.boolean().optional(),
  tipoAusencia: z.nativeEnum(TipoAusencia).optional(),
  motivoAusencia: z.string().optional(),
  notas: z.string().optional(),
  color: z.string().optional(),
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreatePlanificacionSchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  tipo: z.nativeEnum(TipoPlanificacion).optional(),
  fechaInicio: z.string().or(z.date()),
  fechaFin: z.string().or(z.date()),
  departamentoId: z.string().optional(),
  asignaciones: z.array(AsignacionJornadaSchema).optional(),
  notas: z.string().optional(),
  plantillaBase: z.string().optional(),
});

export type CreatePlanificacionDTO = z.infer<typeof CreatePlanificacionSchema>;

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdatePlanificacionSchema = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  tipo: z.nativeEnum(TipoPlanificacion).optional(),
  fechaInicio: z.string().or(z.date()).optional(),
  fechaFin: z.string().or(z.date()).optional(),
  departamentoId: z.string().optional(),
  asignaciones: z.array(AsignacionJornadaSchema).optional(),
  notas: z.string().optional(),
});

export type UpdatePlanificacionDTO = z.infer<typeof UpdatePlanificacionSchema>;

// ============================================
// AGREGAR ASIGNACION
// ============================================

export const AgregarAsignacionSchema = z.object({
  asignaciones: z.array(AsignacionJornadaSchema).min(1, 'Debe agregar al menos una asignacion'),
});

export type AgregarAsignacionDTO = z.infer<typeof AgregarAsignacionSchema>;

// ============================================
// ACTUALIZAR ASIGNACION
// ============================================

export const ActualizarAsignacionSchema = AsignacionJornadaSchema.partial();

export type ActualizarAsignacionDTO = z.infer<typeof ActualizarAsignacionSchema>;

// ============================================
// CAMBIAR ESTADO
// ============================================

export const CambiarEstadoPlanificacionSchema = z.object({
  estado: z.nativeEnum(EstadoPlanificacion),
  comentario: z.string().optional(),
});

export type CambiarEstadoPlanificacionDTO = z.infer<typeof CambiarEstadoPlanificacionSchema>;

// ============================================
// SEARCH SCHEMA
// ============================================

export const SearchPlanificacionesSchema = z.object({
  q: z.string().optional(),
  estado: z.nativeEnum(EstadoPlanificacion).optional(),
  tipo: z.nativeEnum(TipoPlanificacion).optional(),
  departamentoId: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  activo: z.boolean().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type SearchPlanificacionesParams = z.infer<typeof SearchPlanificacionesSchema>;

// ============================================
// COPIAR SEMANA
// ============================================

export const CopiarSemanaSchema = z.object({
  semanaOrigen: z.string(), // Fecha de inicio de la semana origen
  semanaDestino: z.string(), // Fecha de inicio de la semana destino
  sobreescribir: z.boolean().optional(),
});

export type CopiarSemanaDTO = z.infer<typeof CopiarSemanaSchema>;

// ============================================
// GENERAR DESDE PLANTILLA
// ============================================

export const GenerarDesdePlantillaSchema = z.object({
  plantillaId: z.string(),
  fechaInicio: z.string().or(z.date()),
  fechaFin: z.string().or(z.date()),
  nombre: z.string().optional(),
});

export type GenerarDesdePlantillaDTO = z.infer<typeof GenerarDesdePlantillaSchema>;
