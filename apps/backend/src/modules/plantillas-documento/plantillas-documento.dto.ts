// apps/backend/src/modules/plantillas-documento/plantillas-documento.dto.ts
// DTOs y esquemas de validación para plantillas de documentos

import { z } from 'zod';
import { TipoDocumentoPlantilla, EstiloPlantilla } from './PlantillaDocumento';

// ============================================
// SCHEMAS DE CONFIGURACIÓN
// ============================================

export const ConfiguracionColoresSchema = z.object({
  primario: z.string().optional(),
  secundario: z.string().optional(),
  texto: z.string().optional(),
  textoClaro: z.string().optional(),
  fondo: z.string().optional(),
  fondoAlterno: z.string().optional(),
  borde: z.string().optional(),
  exito: z.string().optional(),
  alerta: z.string().optional(),
  error: z.string().optional(),
});

export const ConfiguracionFuentesSchema = z.object({
  familia: z.string().optional(),
  tamañoTitulo: z.number().optional(),
  tamañoSubtitulo: z.number().optional(),
  tamañoTexto: z.number().optional(),
  tamañoPie: z.number().optional(),
});

export const ConfiguracionCabeceraSchema = z.object({
  mostrarLogo: z.boolean().optional(),
  posicionLogo: z.enum(['izquierda', 'centro', 'derecha']).optional(),
  anchoLogo: z.number().optional(),
  mostrarDatosEmpresa: z.boolean().optional(),
  mostrarNIF: z.boolean().optional(),
  mostrarDireccion: z.boolean().optional(),
  mostrarContacto: z.boolean().optional(),
  mostrarWeb: z.boolean().optional(),
  colorFondo: z.string().optional(),
});

export const ConfiguracionClienteSchema = z.object({
  posicion: z.enum(['izquierda', 'derecha']).optional(),
  mostrarTitulo: z.boolean().optional(),
  mostrarCodigo: z.boolean().optional(),
  mostrarNIF: z.boolean().optional(),
  mostrarDireccion: z.boolean().optional(),
  mostrarContacto: z.boolean().optional(),
});

export const ConfiguracionLineasSchema = z.object({
  mostrarNumeroLinea: z.boolean().optional(),
  mostrarReferencia: z.boolean().optional(),
  mostrarDescripcion: z.boolean().optional(),
  mostrarCantidad: z.boolean().optional(),
  mostrarUnidad: z.boolean().optional(),
  mostrarPrecioUnitario: z.boolean().optional(),
  mostrarDescuento: z.boolean().optional(),
  mostrarIVA: z.boolean().optional(),
  mostrarSubtotal: z.boolean().optional(),
  anchoReferencia: z.number().optional(),
  anchoDescripcion: z.number().optional(),
  anchoCantidad: z.number().optional(),
  filasZebra: z.boolean().optional(),
});

export const ConfiguracionTotalesSchema = z.object({
  posicion: z.enum(['derecha', 'izquierda', 'centrado']).optional(),
  mostrarSubtotal: z.boolean().optional(),
  mostrarDescuentoGlobal: z.boolean().optional(),
  mostrarBaseImponible: z.boolean().optional(),
  mostrarDetalleIVA: z.boolean().optional(),
  mostrarRecargoEquivalencia: z.boolean().optional(),
  mostrarRetencion: z.boolean().optional(),
  mostrarTotal: z.boolean().optional(),
  resaltarTotal: z.boolean().optional(),
});

export const ConfiguracionPieSchema = z.object({
  mostrarCondiciones: z.boolean().optional(),
  mostrarFormaPago: z.boolean().optional(),
  mostrarVencimientos: z.boolean().optional(),
  mostrarDatosBancarios: z.boolean().optional(),
  mostrarFirma: z.boolean().optional(),
  mostrarPagina: z.boolean().optional(),
  textoLegal: z.string().optional(),
});

export const TextosSchema = z.object({
  tituloDocumento: z.string().optional(),
  subtituloDocumento: z.string().optional(),
  encabezadoLineas: z.string().optional(),
  piePagina: z.string().optional(),
  condicionesPago: z.string().optional(),
  textosLegales: z.string().optional(),
});

export const MargenesSchema = z.object({
  superior: z.number().optional(),
  inferior: z.number().optional(),
  izquierdo: z.number().optional(),
  derecho: z.number().optional(),
});

export const PapelSchema = z.object({
  formato: z.enum(['A4', 'Letter', 'A5']).optional(),
  orientacion: z.enum(['vertical', 'horizontal']).optional(),
});

// ============================================
// CREATE SCHEMA
// ============================================

export const CreatePlantillaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  codigo: z.string().min(1, 'El código es obligatorio'),
  tipoDocumento: z.nativeEnum(TipoDocumentoPlantilla),
  estilo: z.nativeEnum(EstiloPlantilla).optional(),
  colores: ConfiguracionColoresSchema.optional(),
  fuentes: ConfiguracionFuentesSchema.optional(),
  cabecera: ConfiguracionCabeceraSchema.optional(),
  cliente: ConfiguracionClienteSchema.optional(),
  lineas: ConfiguracionLineasSchema.optional(),
  totales: ConfiguracionTotalesSchema.optional(),
  pie: ConfiguracionPieSchema.optional(),
  textos: TextosSchema.optional(),
  margenes: MargenesSchema.optional(),
  papel: PapelSchema.optional(),
  esPredeterminada: z.boolean().optional(),
});

export type CreatePlantillaDTO = z.infer<typeof CreatePlantillaSchema>;

// ============================================
// UPDATE SCHEMA
// ============================================

export const UpdatePlantillaSchema = CreatePlantillaSchema.partial();

export type UpdatePlantillaDTO = z.infer<typeof UpdatePlantillaSchema>;

// ============================================
// SEARCH SCHEMA
// ============================================

export const SearchPlantillasSchema = z.object({
  tipoDocumento: z.nativeEnum(TipoDocumentoPlantilla).optional(),
  estilo: z.nativeEnum(EstiloPlantilla).optional(),
  activa: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
  busqueda: z.string().optional(),
  page: z.string().optional().transform(v => v ? parseInt(v) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v) : 50),
});

export type SearchPlantillasDTO = z.infer<typeof SearchPlantillasSchema>;
