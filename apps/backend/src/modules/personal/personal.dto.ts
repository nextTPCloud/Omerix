import { z } from 'zod';

// ============================================
// ENUMS SCHEMAS
// ============================================

export const TipoContratoEnum = z.enum([
  'indefinido',
  'temporal',
  'practicas',
  'formacion',
  'obra_servicio',
  'interinidad',
  'autonomo'
]);

export const EstadoEmpleadoEnum = z.enum([
  'activo',
  'baja_temporal',
  'baja_definitiva',
  'vacaciones',
  'excedencia',
  'prejubilacion'
]);

export const TipoJornadaEnum = z.enum([
  'completa',
  'parcial',
  'intensiva',
  'turnos',
  'flexible'
]);

export const GeneroEnum = z.enum([
  'masculino',
  'femenino',
  'no_binario',
  'no_especificado'
]);

// ============================================
// SUB-SCHEMAS
// ============================================

export const DatosPersonalesSchema = z.object({
  fechaNacimiento: z.string().optional(),
  genero: GeneroEnum.optional(),
  nacionalidad: z.string().max(100).optional(),
  lugarNacimiento: z.string().max(200).optional(),
  estadoCivil: z.string().max(50).optional(),
  numHijos: z.number().int().min(0).optional()
}).optional();

export const DatosContactoPersonalSchema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  emailCorporativo: z.string().email('Email corporativo inválido').optional().or(z.literal('')),
  telefono: z.string().max(20).optional(),
  telefonoMovil: z.string().max(20).optional(),
  telefonoEmergencia: z.string().max(20).optional(),
  contactoEmergencia: z.string().max(200).optional()
}).optional();

export const DireccionPersonalSchema = z.object({
  direccion: z.string().max(200).optional(),
  codigoPostal: z.string().max(10).optional(),
  ciudad: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  pais: z.string().max(100).optional()
}).optional();

export const DocumentacionSchema = z.object({
  nif: z.string().max(20).optional(),
  nss: z.string().max(20).optional(),
  numAfiliacion: z.string().max(20).optional(),
  permisoTrabajo: z.string().max(50).optional(),
  fechaCaducidadPermiso: z.string().optional(),
  carnetConducir: z.string().max(20).optional(),
  tipoCarnet: z.array(z.string().max(10)).optional()
}).optional();

export const DatosLaboralesSchema = z.object({
  puesto: z.string().min(1, 'El puesto es obligatorio').max(100),
  departamentoId: z.string().optional(),
  categoriaLaboral: z.string().max(100).optional(),
  nivelProfesional: z.string().max(50).optional(),
  tipoContrato: TipoContratoEnum.default('indefinido'),
  tipoJornada: TipoJornadaEnum.default('completa'),
  horasSemanales: z.number().min(0).max(60).optional(),
  fechaInicioContrato: z.string(),
  fechaFinContrato: z.string().optional(),
  periodoPrueba: z.boolean().optional(),
  fechaFinPrueba: z.string().optional()
});

export const DatosEconomicosSchema = z.object({
  salarioBrutoAnual: z.number().min(0).optional(),
  salarioBrutoMensual: z.number().min(0).optional(),
  numPagas: z.number().int().min(12).max(16).optional(),
  irpf: z.number().min(0).max(50).optional(),
  horasExtra: z.number().min(0).optional(),
  plusTransporte: z.number().min(0).optional(),
  plusComida: z.number().min(0).optional(),
  otrosPluses: z.number().min(0).optional()
}).optional();

export const CuentaBancariaPersonalSchema = z.object({
  iban: z.string().min(1, 'El IBAN es obligatorio').max(34),
  swift: z.string().max(11).optional(),
  banco: z.string().max(100).optional(),
  titular: z.string().max(200).optional(),
  principal: z.boolean().default(false)
});

export const FormacionAcademicaSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio').max(200),
  institucion: z.string().max(200).optional(),
  fechaObtencion: z.string().optional(),
  especialidad: z.string().max(200).optional(),
  observaciones: z.string().max(500).optional()
});

export const ExperienciaLaboralSchema = z.object({
  empresa: z.string().min(1, 'La empresa es obligatoria').max(200),
  puesto: z.string().min(1, 'El puesto es obligatorio').max(100),
  fechaInicio: z.string(),
  fechaFin: z.string().optional(),
  descripcion: z.string().max(1000).optional(),
  motivoSalida: z.string().max(200).optional()
});

export const VacacionesSchema = z.object({
  anio: z.number().int().min(2000).max(2100),
  diasTotales: z.number().int().min(0).max(365),
  diasDisfrutados: z.number().int().min(0).max(365).default(0)
});

export const AusenciaSchema = z.object({
  tipo: z.string().min(1, 'El tipo es obligatorio').max(50),
  fechaInicio: z.string(),
  fechaFin: z.string().optional(),
  motivo: z.string().max(500).optional(),
  documentacion: z.string().max(500).optional(),
  aprobada: z.boolean().default(false)
});

export const EvaluacionSchema = z.object({
  fecha: z.string(),
  evaluadorId: z.string(),
  puntuacion: z.number().min(0).max(10).optional(),
  comentarios: z.string().max(2000).optional(),
  objetivosCumplidos: z.boolean().optional()
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreatePersonalSchema = z.object({
  codigo: z.string().max(20).optional(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios').max(150),
  foto: z.string().url().optional().or(z.literal('')),

  estado: EstadoEmpleadoEnum.default('activo'),
  activo: z.boolean().default(true),

  datosPersonales: DatosPersonalesSchema,
  contacto: DatosContactoPersonalSchema,
  direccion: DireccionPersonalSchema,
  documentacion: DocumentacionSchema,

  datosLaborales: DatosLaboralesSchema,
  datosEconomicos: DatosEconomicosSchema,

  responsableId: z.string().optional(),

  cuentasBancarias: z.array(CuentaBancariaPersonalSchema).optional(),
  formacionAcademica: z.array(FormacionAcademicaSchema).optional(),
  experienciaLaboral: z.array(ExperienciaLaboralSchema).optional(),
  vacaciones: z.array(VacacionesSchema).optional(),

  usuarioId: z.string().optional(),

  observaciones: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).optional()
});

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdatePersonalSchema = CreatePersonalSchema.partial().extend({
  datosLaborales: DatosLaboralesSchema.partial().optional()
});

// ============================================
// QUERY SCHEMA
// ============================================

export const GetPersonalQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional().default('apellidos'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(25),
  activo: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  estado: EstadoEmpleadoEnum.optional(),
  tipoContrato: TipoContratoEnum.optional(),
  departamentoId: z.string().optional(),
  responsableId: z.string().optional(),
  puesto: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional().transform(val =>
    typeof val === 'string' ? val.split(',').map(t => t.trim()) : val
  )
});

// ============================================
// BULK DELETE SCHEMA
// ============================================

export const BulkDeletePersonalSchema = z.object({
  ids: z.array(z.string()).min(1, 'Debe proporcionar al menos un ID')
});

// ============================================
// CHANGE STATUS SCHEMA
// ============================================

export const ChangeStatusPersonalSchema = z.object({
  activo: z.boolean()
});

// ============================================
// REGISTRAR AUSENCIA SCHEMA
// ============================================

export const RegistrarAusenciaSchema = AusenciaSchema;

// ============================================
// REGISTRAR VACACIONES SCHEMA
// ============================================

export const RegistrarVacacionesSchema = z.object({
  anio: z.number().int().min(2000).max(2100),
  diasTotales: z.number().int().min(0).max(365),
  diasDisfrutados: z.number().int().min(0).max(365).optional()
});

// ============================================
// REGISTRAR EVALUACION SCHEMA
// ============================================

export const RegistrarEvaluacionSchema = EvaluacionSchema;

// ============================================
// EXPORT TYPES
// ============================================

export type CreatePersonalDto = z.infer<typeof CreatePersonalSchema>;
export type UpdatePersonalDto = z.infer<typeof UpdatePersonalSchema>;
export type GetPersonalQueryDto = z.infer<typeof GetPersonalQuerySchema>;
export type BulkDeletePersonalDto = z.infer<typeof BulkDeletePersonalSchema>;
export type ChangeStatusPersonalDto = z.infer<typeof ChangeStatusPersonalSchema>;
export type RegistrarAusenciaDto = z.infer<typeof RegistrarAusenciaSchema>;
export type RegistrarVacacionesDto = z.infer<typeof RegistrarVacacionesSchema>;
export type RegistrarEvaluacionDto = z.infer<typeof RegistrarEvaluacionSchema>;
