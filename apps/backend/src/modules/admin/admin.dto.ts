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