import { z } from 'zod';

/**
 * ============================================
 * ADMIN DTOs
 * ============================================
 */

// Schema para listar empresas (query params)
export const GetEmpresasQuerySchema = z.object({
  page: z.string().optional().transform((val) => parseInt(val || '1')),
  limit: z.string().optional().transform((val) => parseInt(val || '10')),
  search: z.string().optional(),
  estado: z.enum(['activa', 'suspendida', 'cancelada']).optional(),
  tipoNegocio: z.enum(['retail', 'restauracion', 'taller', 'informatica', 'servicios', 'otro']).optional(),
});

export type GetEmpresasQueryDto = z.infer<typeof GetEmpresasQuerySchema>;

// Schema para actualizar estado de empresa
export const UpdateEmpresaEstadoSchema = z.object({
  estado: z.enum(['activa', 'suspendida', 'cancelada']),
  razon: z.string().optional(),
});

export type UpdateEmpresaEstadoDto = z.infer<typeof UpdateEmpresaEstadoSchema>;

// Schema para actualizar empresa (admin)
export const AdminUpdateEmpresaSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  direccion: z.object({
    calle: z.string().optional(),
    ciudad: z.string().optional(),
    provincia: z.string().optional(),
    codigoPostal: z.string().optional(),
    pais: z.string().optional(),
  }).optional(),
  tipoNegocio: z.enum(['retail', 'restauracion', 'taller', 'informatica', 'servicios', 'otro']).optional(),
  estado: z.enum(['activa', 'suspendida', 'cancelada']).optional(),
});

export type AdminUpdateEmpresaDto = z.infer<typeof AdminUpdateEmpresaSchema>;

// Schema para crear empresa (superadmin)
export const CreateEmpresaSchema = z.object({
  // Datos básicos de la empresa
  nombre: z.string().min(2, 'Nombre de empresa requerido'),
  nif: z.string().min(9, 'NIF inválido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(9, 'Teléfono requerido'),
  tipoNegocio: z.enum(['retail', 'restauracion', 'taller', 'informatica', 'servicios', 'otro']).default('servicios'),
  // Dirección fiscal
  direccion: z.object({
    calle: z.string().min(5, 'Dirección requerida'),
    numero: z.string().optional(),
    codigoPostal: z.string().min(4, 'Código postal requerido'),
    ciudad: z.string().min(2, 'Ciudad requerida'),
    provincia: z.string().min(2, 'Provincia requerida'),
    pais: z.string().min(2, 'País requerido').default('España'),
  }),
  // Plan seleccionado
  plan: z.string().optional(),
});

export type CreateEmpresaDto = z.infer<typeof CreateEmpresaSchema>;