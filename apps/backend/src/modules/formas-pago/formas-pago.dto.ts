import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN - FORMAS DE PAGO
// ============================================

// Schema para configuración de pasarela
const ConfiguracionPasarelaSchema = z.object({
  tipo: z.enum(['stripe', 'redsys', 'paypal', 'transferencia', 'efectivo', 'otro']),
  // Stripe
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  // Redsys
  redsysMerchantCode: z.string().optional(),
  redsysTerminal: z.string().optional(),
  redsysSecretKey: z.string().optional(),
  redsysEnvironment: z.enum(['test', 'production']).default('test'),
  // PayPal
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
  paypalEnvironment: z.enum(['sandbox', 'production']).default('sandbox'),
  // Genérico
  webhookUrl: z.string().url().optional().or(z.literal('')),
  habilitado: z.boolean().default(false),
}).optional();

// Schema base
const FormaPagoBaseSchema = z.object({
  codigo: z.string().min(1, 'Código requerido').toUpperCase(),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['efectivo', 'tarjeta', 'transferencia', 'domiciliacion', 'cheque', 'pagare', 'otro']),
  icono: z.string().default('credit-card'),
  color: z.string().default('#3B82F6'),
  requiereDatosBancarios: z.boolean().default(false),
  configuracionPasarela: ConfiguracionPasarelaSchema,
  comision: z.number().min(0).max(100).default(0),
  orden: z.number().min(0).default(0),
  activo: z.boolean().default(true),
});

// Crear forma de pago
export const CreateFormaPagoSchema = FormaPagoBaseSchema;

// Actualizar forma de pago
export const UpdateFormaPagoSchema = FormaPagoBaseSchema.partial();

// Búsqueda y filtros
export const SearchFormasPagoSchema = z.object({
  q: z.string().optional(),
  activo: z.string().optional(),
  tipo: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 50).default('50'),
  sortBy: z.string().default('orden'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// TYPES
// ============================================

export type ConfiguracionPasarelaDTO = z.infer<typeof ConfiguracionPasarelaSchema>;
export type CreateFormaPagoDTO = z.infer<typeof CreateFormaPagoSchema>;
export type UpdateFormaPagoDTO = z.infer<typeof UpdateFormaPagoSchema>;
export type SearchFormasPagoDTO = z.infer<typeof SearchFormasPagoSchema>;
