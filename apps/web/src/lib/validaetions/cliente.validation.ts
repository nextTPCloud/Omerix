import { z } from 'zod'

// Schema de dirección
export const direccionSchema = z.object({
  calle: z.string().min(1, 'La calle es obligatoria'),
  numero: z.string().optional(),
  piso: z.string().optional(),
  codigoPostal: z.string().min(4, 'Código postal inválido').max(10),
  ciudad: z.string().min(1, 'La ciudad es obligatoria'),
  provincia: z.string().min(1, 'La provincia es obligatoria'),
  pais: z.string().default('España'),
})

// Schema de persona de contacto
export const personaContactoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
})

// Schema de cliente
export const clienteSchema = z.object({
  tipoCliente: z.enum(['empresa', 'particular']).default('particular'),
  codigo: z.string().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  nombreComercial: z.string().optional(),
  nif: z.string()
    .min(8, 'NIF/CIF inválido')
    .max(12, 'NIF/CIF inválido')
    .transform(val => val.toUpperCase()),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  movil: z.string().optional(),
  web: z.string().url('URL inválida').optional().or(z.literal('')),
  direccion: direccionSchema,
  direccionEnvio: direccionSchema.optional(),
  formaPago: z.enum(['contado', 'transferencia', 'domiciliacion', 'confirming', 'pagare'])
    .default('transferencia'),
  diasPago: z.number().min(0).default(30),
  descuentoGeneral: z.number().min(0).max(100).optional(),
  tarifaId: z.string().optional(),
  iban: z.string()
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, 'IBAN inválido')
    .optional()
    .or(z.literal('')),
  swift: z.string().optional(),
  personaContacto: personaContactoSchema.optional(),
  categoriaId: z.string().optional(),
  zona: z.string().optional(),
  vendedorId: z.string().optional(),
  limiteCredito: z.number().min(0).optional(),
  activo: z.boolean().default(true),
  observaciones: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>