import { z } from 'zod';
import {
  ModuloInforme,
  TipoInforme,
  TipoCampo,
  TipoAgregacion,
  OperadorFiltro,
  TipoGraficoInforme,
} from './Informe';

// ============================================
// SCHEMA CAMPO
// ============================================

export const CampoInformeSchema = z.object({
  campo: z.string().min(1),
  etiqueta: z.string().min(1),
  tipo: z.nativeEnum(TipoCampo).default(TipoCampo.TEXTO),
  visible: z.boolean().default(true),
  ancho: z.number().optional(),
  formato: z.string().optional(),
  agregacion: z.nativeEnum(TipoAgregacion).default(TipoAgregacion.NINGUNA),
  orden: z.number().optional(),
});

// ============================================
// SCHEMA FILTRO
// ============================================

export const FiltroInformeSchema = z.object({
  campo: z.string().min(1),
  operador: z.nativeEnum(OperadorFiltro),
  valor: z.any().optional(),
  valor2: z.any().optional(),
  parametro: z.string().optional(),
  etiqueta: z.string().optional(),
});

// ============================================
// SCHEMA AGRUPACION
// ============================================

export const AgrupacionInformeSchema = z.object({
  campo: z.string().min(1),
  etiqueta: z.string().optional(),
  orden: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// SCHEMA ORDENAMIENTO
// ============================================

export const OrdenamientoInformeSchema = z.object({
  campo: z.string().min(1),
  direccion: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// SCHEMA JOIN
// ============================================

export const JoinInformeSchema = z.object({
  coleccion: z.string().min(1),
  campoLocal: z.string().min(1),
  campoForaneo: z.string().min(1),
  alias: z.string().min(1),
});

// ============================================
// SCHEMA FUENTE
// ============================================

export const FuenteInformeSchema = z.object({
  coleccion: z.string().min(1),
  joins: z.array(JoinInformeSchema).optional(),
});

// ============================================
// SCHEMA GRAFICO
// ============================================

export const GraficoConfigInformeSchema = z.object({
  tipo: z.nativeEnum(TipoGraficoInforme),
  ejeX: z.string().min(1),
  ejeY: z.array(z.string()),
  colores: z.array(z.string()).optional(),
  mostrarLeyenda: z.boolean().default(true),
  mostrarEtiquetas: z.boolean().default(false),
});

// ============================================
// SCHEMA PARAMETRO
// ============================================

export const ParametroInformeSchema = z.object({
  nombre: z.string().min(1),
  etiqueta: z.string().min(1),
  tipo: z.enum(['texto', 'numero', 'fecha', 'select', 'multiselect']),
  valorDefecto: z.any().optional(),
  opciones: z.array(z.object({
    valor: z.any(),
    etiqueta: z.string(),
  })).optional(),
  requerido: z.boolean().default(false),
});

// ============================================
// SCHEMA CONFIG
// ============================================

export const ConfigInformeSchema = z.object({
  limite: z.number().optional(),
  paginacion: z.boolean().default(true),
  mostrarTotales: z.boolean().default(true),
  exportable: z.boolean().default(true),
  formatos: z.array(z.enum(['pdf', 'excel', 'csv'])).default(['pdf', 'excel', 'csv']),
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreateInformeSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  modulo: z.nativeEnum(ModuloInforme),
  tipo: z.nativeEnum(TipoInforme).default(TipoInforme.TABLA),
  icono: z.string().optional(),
  fuente: FuenteInformeSchema,
  campos: z.array(CampoInformeSchema).min(1, 'Debe seleccionar al menos un campo'),
  filtros: z.array(FiltroInformeSchema).default([]),
  parametros: z.array(ParametroInformeSchema).default([]),
  agrupaciones: z.array(AgrupacionInformeSchema).default([]),
  ordenamiento: z.array(OrdenamientoInformeSchema).default([]),
  grafico: GraficoConfigInformeSchema.optional(),
  config: ConfigInformeSchema.default({}),
  esPlantilla: z.boolean().default(false),
  compartido: z.boolean().default(false),
  favorito: z.boolean().default(false),
  orden: z.number().optional(),
  permisosRequeridos: z.array(z.string()).optional(),
});

export type CreateInformeDTO = z.infer<typeof CreateInformeSchema>;

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdateInformeSchema = CreateInformeSchema.partial();

export type UpdateInformeDTO = z.infer<typeof UpdateInformeSchema>;

// ============================================
// SEARCH SCHEMA
// ============================================

export const SearchInformesSchema = z.object({
  modulo: z.nativeEnum(ModuloInforme).optional(),
  tipo: z.nativeEnum(TipoInforme).optional(),
  // Mantener undefined si no se proporciona, solo convertir si tiene valor
  esPlantilla: z.string().optional().transform(v => v !== undefined ? v === 'true' : undefined),
  compartido: z.string().optional().transform(v => v !== undefined ? v === 'true' : undefined),
  favorito: z.string().optional().transform(v => v !== undefined ? v === 'true' : undefined),
  busqueda: z.string().optional(),
  page: z.string().optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v) : 20),
  orderBy: z.string().optional().default('nombre'),
  orderDir: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type SearchInformesDTO = z.infer<typeof SearchInformesSchema>;

// ============================================
// EJECUTAR INFORME SCHEMA
// ============================================

export const EjecutarInformeSchema = z.object({
  parametros: z.record(z.any()).optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(100),
});

export type EjecutarInformeDTO = z.infer<typeof EjecutarInformeSchema>;

// ============================================
// EXPORTAR INFORME SCHEMA
// ============================================

export const ExportarInformeSchema = z.object({
  formato: z.enum(['pdf', 'excel', 'csv']),
  parametros: z.record(z.any()).optional(),
});

export type ExportarInformeDTO = z.infer<typeof ExportarInformeSchema>;

// ============================================
// GENERAR CON IA SCHEMA
// ============================================

export const GenerarInformeIASchema = z.object({
  comando: z.string().min(5, 'El comando debe tener al menos 5 caracteres'),
  ejecutar: z.boolean().default(true), // Si true, ejecuta y devuelve datos; si false, solo devuelve definición
});

export type GenerarInformeIADTO = z.infer<typeof GenerarInformeIASchema>;
