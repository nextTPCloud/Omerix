import { z } from 'zod';

// ============================================
// CREAR TAREA
// ============================================

export const CreateTareaSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio').max(200),
  descripcion: z.string().max(2000).optional(),
  tipo: z.enum([
    'general', 'recordatorio', 'seguimiento_cliente', 'seguimiento_proveedor',
    'cobro', 'pago', 'llamada', 'reunion', 'visita', 'revision',
    'mantenimiento', 'inventario', 'entrega', 'otro'
  ]).default('general'),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).default('normal'),

  fechaVencimiento: z.string().optional(),
  fechaRecordatorio: z.string().optional(),
  fechaInicio: z.string().optional(),

  recurrencia: z.enum(['ninguna', 'diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'anual']).default('ninguna'),

  asignadoAId: z.string().optional(),
  departamentoId: z.string().optional(),

  clienteId: z.string().optional(),
  proveedorId: z.string().optional(),
  proyectoId: z.string().optional(),
  documentoTipo: z.string().optional(),
  documentoId: z.string().optional(),
  documentoCodigo: z.string().optional(),

  horasEstimadas: z.number().min(0).optional(),

  enviarRecordatorio: z.boolean().default(true),
  notificarAlCompletar: z.boolean().default(false),

  etiquetas: z.array(z.string()).optional(),
  color: z.string().optional(),
});

export type CreateTareaDTO = z.infer<typeof CreateTareaSchema>;

// ============================================
// ACTUALIZAR TAREA
// ============================================

export const UpdateTareaSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(2000).optional(),
  tipo: z.enum([
    'general', 'recordatorio', 'seguimiento_cliente', 'seguimiento_proveedor',
    'cobro', 'pago', 'llamada', 'reunion', 'visita', 'revision',
    'mantenimiento', 'inventario', 'entrega', 'otro'
  ]).optional(),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),

  fechaVencimiento: z.string().nullable().optional(),
  fechaRecordatorio: z.string().nullable().optional(),
  fechaInicio: z.string().nullable().optional(),

  recurrencia: z.enum(['ninguna', 'diaria', 'semanal', 'quincenal', 'mensual', 'trimestral', 'anual']).optional(),

  asignadoAId: z.string().nullable().optional(),
  departamentoId: z.string().nullable().optional(),

  clienteId: z.string().nullable().optional(),
  proveedorId: z.string().nullable().optional(),
  proyectoId: z.string().nullable().optional(),

  horasEstimadas: z.number().min(0).nullable().optional(),
  horasReales: z.number().min(0).nullable().optional(),
  porcentajeCompletado: z.number().min(0).max(100).optional(),

  enviarRecordatorio: z.boolean().optional(),
  notificarAlCompletar: z.boolean().optional(),

  etiquetas: z.array(z.string()).optional(),
  color: z.string().nullable().optional(),
});

export type UpdateTareaDTO = z.infer<typeof UpdateTareaSchema>;

// ============================================
// CAMBIAR ESTADO
// ============================================

export const CambiarEstadoTareaSchema = z.object({
  estado: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']),
  comentario: z.string().optional(),
});

export type CambiarEstadoTareaDTO = z.infer<typeof CambiarEstadoTareaSchema>;

// ============================================
// AGREGAR COMENTARIO
// ============================================

export const AgregarComentarioSchema = z.object({
  texto: z.string().min(1, 'El comentario no puede estar vacío').max(1000),
});

export type AgregarComentarioDTO = z.infer<typeof AgregarComentarioSchema>;

// ============================================
// BUSCAR TAREAS
// ============================================

export const SearchTareasSchema = z.object({
  q: z.string().optional(),
  estado: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada', 'vencida']).optional(),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),
  tipo: z.string().optional(),
  asignadoAId: z.string().optional(),
  creadoPorId: z.string().optional(),
  clienteId: z.string().optional(),
  proyectoId: z.string().optional(),
  departamentoId: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  vencidas: z.coerce.boolean().optional(),
  hoy: z.coerce.boolean().optional(),
  semana: z.coerce.boolean().optional(),
  misTareas: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().default('fechaVencimiento'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SearchTareasDTO = z.infer<typeof SearchTareasSchema>;
