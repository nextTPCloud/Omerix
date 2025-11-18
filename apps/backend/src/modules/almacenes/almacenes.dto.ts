import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN - ALMACENES
// ============================================

const DireccionSchema = z.object({
  calle: z.string().min(1, 'Calle requerida'),
  numero: z.string().optional(),
  codigoPostal: z.string().min(1, 'Código postal requerido'),
  ciudad: z.string().min(1, 'Ciudad requerida'),
  provincia: z.string().min(1, 'Provincia requerida'),
  pais: z.string().default('España'),
});

// Schema base
const AlmacenBaseSchema = z.object({
  codigo: z.string().min(1, 'Código requerido').toUpperCase(),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),

  // Ubicación
  direccion: DireccionSchema.optional(),

  // Configuración
  esPrincipal: z.boolean().default(false),
  activo: z.boolean().default(true),

  // Capacidad
  capacidadMaxima: z.number().min(0).optional(),
  unidadCapacidad: z.enum(['unidades', 'kg', 'm3', 'litros']).default('unidades'),

  // Contacto
  responsable: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),

  // TPV
  usarEnTPV: z.boolean().default(true),

  // Notas
  notas: z.string().optional(),
});

// Crear almacén
export const CreateAlmacenSchema = AlmacenBaseSchema;

// Actualizar almacén
export const UpdateAlmacenSchema = AlmacenBaseSchema.partial();

// Búsqueda y filtros
export const SearchAlmacenesSchema = z.object({
  q: z.string().optional(), // Búsqueda de texto
  activo: z.string().optional(),
  esPrincipal: z.string().optional(),
  usarEnTPV: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 50).default('50'),
  sortBy: z.string().default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// TYPES
// ============================================

export type CreateAlmacenDTO = z.infer<typeof CreateAlmacenSchema>;
export type UpdateAlmacenDTO = z.infer<typeof UpdateAlmacenSchema>;
export type SearchAlmacenesDTO = z.infer<typeof SearchAlmacenesSchema>;
