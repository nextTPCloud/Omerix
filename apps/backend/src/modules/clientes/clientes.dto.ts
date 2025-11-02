import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

/**
 * Schema para dirección
 */
export const DireccionSchema = z.object({
  calle: z.string().min(1, 'La calle es obligatoria'),
  numero: z.string().optional(),
  piso: z.string().optional(),
  codigoPostal: z.string().min(4, 'Código postal inválido').max(10),
  ciudad: z.string().min(1, 'La ciudad es obligatoria'),
  provincia: z.string().min(1, 'La provincia es obligatoria'),
  pais: z.string().default('España'),
});

/**
 * Schema para persona de contacto
 */
export const PersonaContactoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
});

/**
 * Schema para crear cliente
 */
export const CreateClienteSchema = z.object({
  // Tipo de cliente
  tipoCliente: z.enum(['empresa', 'particular']).default('particular'),
  
  // Datos básicos
  codigo: z.string().optional(), // Se genera automáticamente si no se proporciona
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  nombreComercial: z.string().optional(),
  
  // Datos fiscales
  nif: z.string()
    .min(8, 'NIF/CIF inválido')
    .max(12, 'NIF/CIF inválido')
    .transform(val => val.toUpperCase()),
  
  // Contacto
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  movil: z.string().optional(),
  web: z.string().url('URL inválida').optional().or(z.literal('')),
  
  // Dirección principal (obligatoria)
  direccion: DireccionSchema,
  
  // Dirección de envío (opcional)
  direccionEnvio: DireccionSchema.optional(),
  
  // Datos comerciales
  formaPago: z.enum(['contado', 'transferencia', 'domiciliacion', 'confirming', 'pagare'])
    .default('transferencia'),
  diasPago: z.number().min(0).default(30),
  descuentoGeneral: z.number().min(0).max(100).optional(),
  tarifaId: z.string().optional(),
  
  // Datos bancarios
  iban: z.string()
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, 'IBAN inválido')
    .optional()
    .or(z.literal('')),
  swift: z.string().optional(),
  
  // Persona de contacto
  personaContacto: PersonaContactoSchema.optional(),
  
  // Clasificación
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
  vendedorId: z.string().optional(),
  
  // Límites
  limiteCredito: z.number().min(0).optional(),
  
  // Estado
  activo: z.boolean().default(true),
  observaciones: z.string().max(1000).optional(),
  
  // Tags
  tags: z.array(z.string()).optional(),
});

/**
 * Schema para actualizar cliente
 */
export const UpdateClienteSchema = CreateClienteSchema.partial();

/**
 * Schema para búsqueda/filtros
 */
export const ClienteQuerySchema = z.object({
  // Búsqueda general
  search: z.string().optional(),
  
  // Filtros
  tipoCliente: z.enum(['empresa', 'particular']).optional(),
  activo: z.string().transform(val => val === 'true').optional(),
  formaPago: z.enum(['contado', 'transferencia', 'domiciliacion', 'confirming', 'pagare']).optional(),
  categoriaId: z.string().optional(),
  vendedorId: z.string().optional(),
  zona: z.string().optional(),
  
  // Paginación
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  
  // Ordenamiento
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Schema para importar clientes
 */
export const ImportClienteSchema = z.array(
  z.object({
    nombre: z.string(),
    nif: z.string(),
    email: z.string().email().optional(),
    telefono: z.string().optional(),
    direccion: z.string(),
    ciudad: z.string(),
    codigoPostal: z.string(),
    provincia: z.string(),
  })
);

// ============================================
// TYPES (inferidos de los schemas)
// ============================================

export type CreateClienteDTO = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteDTO = z.infer<typeof UpdateClienteSchema>;
export type ClienteQueryDTO = z.infer<typeof ClienteQuerySchema>;
export type ImportClienteDTO = z.infer<typeof ImportClienteSchema>;

// ============================================
// RESPUESTAS
// ============================================

export interface ClienteResponse {
  _id: string;
  empresaId: string;
  tipoCliente: 'empresa' | 'particular';
  codigo: string;
  nombre: string;
  nombreComercial?: string;
  nif: string;
  email?: string;
  telefono?: string;
  movil?: string;
  web?: string;
  direccion: {
    calle: string;
    numero?: string;
    piso?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
  };
  direccionEnvio?: {
    calle: string;
    numero?: string;
    piso?: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
  };
  formaPago: string;
  diasPago: number;
  descuentoGeneral?: number;
  limiteCredito?: number;
  riesgoActual?: number;
  activo: boolean;
  observaciones?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientesListResponse {
  success: boolean;
  data: ClienteResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ClienteDetailResponse {
  success: boolean;
  data: ClienteResponse;
}