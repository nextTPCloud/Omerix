import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACION - MAQUINARIA
// ============================================

// Schema para mantenimiento
const MantenimientoSchema = z.object({
  fecha: z.string().or(z.date()),
  tipo: z.enum(['preventivo', 'correctivo', 'revision']),
  descripcion: z.string().min(1, 'Descripcion requerida'),
  coste: z.number().min(0).optional(),
  kmEnMantenimiento: z.number().min(0).optional(),
  horasEnMantenimiento: z.number().min(0).optional(),
  proximoMantenimientoKm: z.number().min(0).optional(),
  proximoMantenimientoHoras: z.number().min(0).optional(),
  proximoMantenimientoFecha: z.string().or(z.date()).optional(),
  realizadoPor: z.string().optional(),
  observaciones: z.string().optional(),
});

// Schema base
const MaquinariaBaseSchema = z.object({
  codigo: z.string().min(1, 'Codigo requerido').toUpperCase(),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['vehiculo', 'maquinaria', 'herramienta', 'equipo']).default('maquinaria'),

  // Datos vehiculo
  matricula: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  anio: z.number().min(1900).max(2100).optional(),
  numeroSerie: z.string().optional(),

  // Estado
  estado: z.enum(['disponible', 'en_uso', 'mantenimiento', 'baja']).default('disponible'),
  ubicacionActual: z.string().optional(),

  // Tarifas
  tarifaHoraCoste: z.number().min(0).default(0),
  tarifaHoraVenta: z.number().min(0).default(0),
  tarifaDiaCoste: z.number().min(0).optional(),
  tarifaDiaVenta: z.number().min(0).optional(),
  tarifaKmCoste: z.number().min(0).optional(),
  tarifaKmVenta: z.number().min(0).optional(),

  // Contadores
  kmActuales: z.number().min(0).optional(),
  horasUso: z.number().min(0).optional(),

  // Mantenimiento
  proximoMantenimientoFecha: z.string().or(z.date()).optional(),
  proximoMantenimientoKm: z.number().min(0).optional(),
  proximoMantenimientoHoras: z.number().min(0).optional(),

  // Documentacion
  fechaITV: z.string().or(z.date()).optional(),
  fechaSeguro: z.string().or(z.date()).optional(),
  polizaSeguro: z.string().optional(),

  // Imagen
  imagen: z.string().optional(),

  // Metadatos
  orden: z.number().min(0).default(0),
  activo: z.boolean().default(true),
  observaciones: z.string().optional(),
});

// Crear maquinaria
export const CreateMaquinariaSchema = MaquinariaBaseSchema;

// Actualizar maquinaria
export const UpdateMaquinariaSchema = MaquinariaBaseSchema.partial();

// Registrar mantenimiento
export const RegistrarMantenimientoSchema = MantenimientoSchema;

// Busqueda y filtros
export const SearchMaquinariaSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  activo: z.string().optional(),
  tipo: z.string().optional(),
  estado: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 50).default('50'),
  sortBy: z.string().default('orden'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// TYPES
// ============================================

export type MantenimientoDTO = z.infer<typeof MantenimientoSchema>;
export type CreateMaquinariaDTO = z.infer<typeof CreateMaquinariaSchema>;
export type UpdateMaquinariaDTO = z.infer<typeof UpdateMaquinariaSchema>;
export type RegistrarMantenimientoDTO = z.infer<typeof RegistrarMantenimientoSchema>;
export type SearchMaquinariaDTO = z.infer<typeof SearchMaquinariaSchema>;
