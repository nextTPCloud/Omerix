import { z } from 'zod';

// ============================================
// ENUMS Y CONSTANTES
// ============================================

export const MarcaTerminalEnum = z.enum(['ZKTeco', 'ANVIZ', 'Hikvision', 'otro']);
export const EstadoTerminalEnum = z.enum(['activo', 'inactivo', 'error']);

// Puertos por defecto según marca
export const PUERTOS_DEFAULT: Record<string, number> = {
  ZKTeco: 4370,
  ANVIZ: 5010,
  Hikvision: 8000,
  otro: 4370,
};

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const ConfiguracionSchema = z.object({
  frecuenciaMinutos: z.number().int().min(1).max(1440).optional().default(15),
  sincronizarAsistencia: z.boolean().optional().default(true),
  sincronizarEmpleados: z.boolean().optional().default(true),
  timezone: z.string().optional().default('Europe/Madrid'),
  eliminarRegistrosSincronizados: z.boolean().optional().default(false),
});

const IPRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

export const CreateTerminalSchema = z.object({
  codigo: z.string().min(1).max(20).optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  descripcion: z.string().max(500).optional(),

  // Conexión
  ip: z.string()
    .min(1, 'La IP es obligatoria')
    .regex(IPRegex, 'IP inválida'),
  puerto: z.number().int().min(1).max(65535).optional(),
  mac: z.string().max(20).optional(),

  // Dispositivo
  marca: MarcaTerminalEnum.default('ZKTeco'),
  modelo: z.string().max(50).optional(),
  numeroSerie: z.string().max(50).optional(),

  // Configuración
  configuracion: ConfiguracionSchema.optional(),

  // Estado
  estado: EstadoTerminalEnum.optional().default('activo'),
  activo: z.boolean().optional().default(true),
  orden: z.number().int().min(0).optional().default(0),
});

export const UpdateTerminalSchema = CreateTerminalSchema.partial();

export const TerminalQuerySchema = z.object({
  search: z.string().optional(),
  marca: MarcaTerminalEnum.optional(),
  estado: EstadoTerminalEnum.optional(),
  activo: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
  sortBy: z.string().optional().default('nombre'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ============================================
// SCHEMAS PARA SINCRONIZACIÓN
// ============================================

export const SincronizarEmpleadosSchema = z.object({
  personalIds: z.array(z.string()).optional(), // Si vacío, sincroniza todos los activos
  soloConFoto: z.boolean().optional().default(false),
  eliminarNoIncluidos: z.boolean().optional().default(false),
});

export const SincronizarAsistenciaSchema = z.object({
  desde: z.string().optional(), // ISO date
  hasta: z.string().optional(),
  limpiarDespues: z.boolean().optional().default(false),
});

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type CreateTerminalDto = z.infer<typeof CreateTerminalSchema>;
export type UpdateTerminalDto = z.infer<typeof UpdateTerminalSchema>;
export type TerminalQueryDto = z.infer<typeof TerminalQuerySchema>;
export type SincronizarEmpleadosDto = z.infer<typeof SincronizarEmpleadosSchema>;
export type SincronizarAsistenciaDto = z.infer<typeof SincronizarAsistenciaSchema>;
