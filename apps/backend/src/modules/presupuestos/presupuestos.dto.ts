import { z } from 'zod';

// ============================================
// ENUMS (para validación)
// ============================================

export const EstadoPresupuestoEnum = z.enum([
  'borrador',
  'enviado',
  'pendiente',
  'aceptado',
  'rechazado',
  'caducado',
  'convertido',
]);

export const TipoLineaEnum = z.enum([
  'producto',
  'servicio',
  'kit',
  'texto',
  'subtotal',
  'descuento',
]);

// ============================================
// SCHEMAS AUXILIARES
// ============================================

const ComponenteKitSchema = z.object({
  productoId: z.string().min(1, 'ID del producto requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  sku: z.string().optional(),
  cantidad: z.number().min(0).default(1),
  precioUnitario: z.number().min(0).default(0),
  costeUnitario: z.number().min(0).default(0),
  descuento: z.number().min(0).max(100).default(0),
  iva: z.number().default(21),
  subtotal: z.number().min(0).default(0),
  opcional: z.boolean().default(false),
  seleccionado: z.boolean().default(true),
});

const VarianteSeleccionadaSchema = z.object({
  varianteId: z.string().optional(),
  sku: z.string().min(1, 'SKU requerido'),
  combinacion: z.record(z.string(), z.string()),
  precioAdicional: z.number().default(0),
  costeAdicional: z.number().default(0),
});

const LineaPresupuestoSchema = z.object({
  _id: z.string().optional(),
  orden: z.number().min(0),
  tipo: TipoLineaEnum.default('producto'),

  // Producto
  productoId: z.string().optional(),
  codigo: z.string().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  sku: z.string().optional(),

  // Variante
  variante: VarianteSeleccionadaSchema.optional(),

  // Cantidades
  cantidad: z.number().min(0).default(1),
  unidad: z.string().default('ud'),

  // Precios
  precioUnitario: z.number().min(0).default(0),
  descuento: z.number().min(0).max(100).default(0),
  descuentoImporte: z.number().min(0).default(0),
  subtotal: z.number().min(0).default(0),
  iva: z.number().default(21),
  ivaImporte: z.number().min(0).default(0),
  total: z.number().min(0).default(0),

  // Costes
  costeUnitario: z.number().min(0).default(0),
  costeTotalLinea: z.number().min(0).default(0),

  // Márgenes
  margenUnitario: z.number().default(0),
  margenPorcentaje: z.number().default(0),
  margenTotalLinea: z.number().default(0),

  // Kit
  componentesKit: z.array(ComponenteKitSchema).default([]),
  mostrarComponentes: z.boolean().default(true),

  // Flags
  esEditable: z.boolean().default(true),
  incluidoEnTotal: z.boolean().default(true),

  // Notas
  notasInternas: z.string().optional(),
});

const DireccionEntregaSchema = z.object({
  tipo: z.enum(['cliente', 'personalizada', 'recogida']).default('cliente'),
  direccionId: z.string().optional(),
  nombre: z.string().optional(),
  calle: z.string().optional(),
  numero: z.string().optional(),
  piso: z.string().optional(),
  codigoPostal: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().optional(),
  pais: z.string().default('España'),
  personaContacto: z.string().optional(),
  telefonoContacto: z.string().optional(),
  horarioEntrega: z.string().optional(),
  instrucciones: z.string().optional(),
});

const CondicionesComercialesSchema = z.object({
  formaPagoId: z.string().optional(),
  terminoPagoId: z.string().optional(),
  validezDias: z.number().min(1).default(30),
  tiempoEntrega: z.string().optional(),
  garantia: z.string().optional(),
  portesPagados: z.boolean().default(false),
  portesImporte: z.number().min(0).optional(),
  observacionesEntrega: z.string().optional(),
});

const DesgloseIvaSchema = z.object({
  tipo: z.number(),
  base: z.number(),
  cuota: z.number(),
});

const TotalesPresupuestoSchema = z.object({
  subtotalBruto: z.number().min(0).default(0),
  totalDescuentos: z.number().min(0).default(0),
  subtotalNeto: z.number().min(0).default(0),
  desgloseIva: z.array(DesgloseIvaSchema).default([]),
  totalIva: z.number().min(0).default(0),
  totalPresupuesto: z.number().min(0).default(0),
  costeTotalMateriales: z.number().min(0).default(0),
  costeTotalServicios: z.number().min(0).default(0),
  costeTotalKits: z.number().min(0).default(0),
  costeTotal: z.number().min(0).default(0),
  margenBruto: z.number().default(0),
  margenPorcentaje: z.number().default(0),
});

// ============================================
// SCHEMAS PRINCIPALES
// ============================================

export const CreatePresupuestoSchema = z.object({
  // Identificación
  codigo: z.string().optional(), // Se genera automáticamente
  serie: z.string().default('P'),

  // Estado
  estado: EstadoPresupuestoEnum.default('borrador'),

  // Fechas
  fecha: z.string().or(z.date()).optional(),
  fechaValidez: z.string().or(z.date()).optional(),

  // Cliente (obligatorio)
  clienteId: z.string().min(1, 'Cliente requerido'),
  clienteNombre: z.string().min(1, 'Nombre del cliente requerido'),
  clienteNif: z.string().min(1, 'NIF del cliente requerido'),
  clienteEmail: z.string().optional(),
  clienteTelefono: z.string().optional(),
  direccionFacturacion: DireccionEntregaSchema.optional(),

  // Entrega
  direccionEntrega: DireccionEntregaSchema.optional(),
  fechaEntregaPrevista: z.string().or(z.date()).optional(),

  // Proyecto y parte de trabajo
  proyectoId: z.string().optional(),
  parteTrabajoId: z.string().optional(),

  // Agente comercial
  agenteComercialId: z.string().optional(),

  // Referencias
  referenciaCliente: z.string().optional(),
  pedidoCliente: z.string().optional(),

  // Título y descripción
  titulo: z.string().optional(),
  descripcion: z.string().optional(),

  // Líneas
  lineas: z.array(LineaPresupuestoSchema).default([]),

  // Condiciones
  condiciones: CondicionesComercialesSchema.default({ validezDias: 30 }),

  // Totales
  totales: TotalesPresupuestoSchema.optional(),

  // Descuento global
  descuentoGlobalPorcentaje: z.number().min(0).max(100).default(0),
  descuentoGlobalImporte: z.number().min(0).default(0),

  // Textos
  introduccion: z.string().optional(),
  piePagina: z.string().optional(),
  condicionesLegales: z.string().optional(),

  // Observaciones
  observaciones: z.string().optional(),

  // Tags
  tags: z.array(z.string()).default([]),

  // Control
  activo: z.boolean().default(true),

  // Configuración de visualización
  mostrarCostes: z.boolean().default(true),
  mostrarMargenes: z.boolean().default(true),
  mostrarComponentesKit: z.boolean().default(true),
});

export const UpdatePresupuestoSchema = CreatePresupuestoSchema.partial();

export const SearchPresupuestosSchema = z.object({
  // Búsqueda general
  search: z.string().optional(),

  // Filtros específicos
  clienteId: z.string().optional(),
  proyectoId: z.string().optional(),
  agenteComercialId: z.string().optional(),
  estado: EstadoPresupuestoEnum.optional(),
  estados: z.string().optional(), // Lista separada por comas
  serie: z.string().optional(),
  activo: z.enum(['true', 'false', 'all']).optional(),

  // Filtros de fecha
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  fechaValidezDesde: z.string().optional(),
  fechaValidezHasta: z.string().optional(),

  // Filtros de importe
  importeMin: z.string().optional(),
  importeMax: z.string().optional(),

  // Filtro de vigentes
  vigentes: z.enum(['true', 'false']).optional(),
  caducados: z.enum(['true', 'false']).optional(),
  porCaducar: z.enum(['true', 'false']).optional(),

  // Tags
  tags: z.string().optional(),

  // Paginación
  page: z.string().default('1'),
  limit: z.string().default('25'),
  sortBy: z.string().default('fecha'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const CambiarEstadoPresupuestoSchema = z.object({
  estado: EstadoPresupuestoEnum,
  observaciones: z.string().optional(),
  fechaRespuesta: z.string().or(z.date()).optional(),
});

export const AplicarMargenSchema = z.object({
  tipo: z.enum(['porcentaje', 'importe']),
  valor: z.number(),
  aplicarA: z.enum(['todas', 'productos', 'servicios', 'seleccionadas']).default('todas'),
  lineasIds: z.array(z.string()).optional(), // Para 'seleccionadas'
  sobreCoste: z.boolean().default(true), // Si true, aplica margen sobre coste; si false, sobre precio actual
});

export const ImportarLineasSchema = z.object({
  origen: z.enum(['presupuesto', 'pedido', 'factura', 'productos']),
  documentoId: z.string().optional(), // ID del documento origen
  productosIds: z.array(z.string()).optional(), // IDs de productos a importar
  incluirPrecios: z.boolean().default(true),
  incluirDescuentos: z.boolean().default(true),
  incluirCostes: z.boolean().default(true),
  multiplicador: z.number().default(1), // Para ajustar cantidades
});

export const ConvertirPresupuestoSchema = z.object({
  tipo: z.enum(['pedido', 'factura', 'albaran']),
  incluirTodo: z.boolean().default(true),
  lineasIds: z.array(z.string()).optional(), // Líneas específicas si no es todo
});

export const DuplicarPresupuestoSchema = z.object({
  nuevoCliente: z.string().optional(), // Si se quiere para otro cliente
  mantenerPrecios: z.boolean().default(true),
  mantenerCostes: z.boolean().default(true),
  nuevaFecha: z.string().or(z.date()).optional(),
});

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type CreatePresupuestoDTO = z.infer<typeof CreatePresupuestoSchema>;
export type UpdatePresupuestoDTO = z.infer<typeof UpdatePresupuestoSchema>;
export type SearchPresupuestosDTO = z.infer<typeof SearchPresupuestosSchema>;
export type CambiarEstadoPresupuestoDTO = z.infer<typeof CambiarEstadoPresupuestoSchema>;
export type AplicarMargenDTO = z.infer<typeof AplicarMargenSchema>;
export type ImportarLineasDTO = z.infer<typeof ImportarLineasSchema>;
export type ConvertirPresupuestoDTO = z.infer<typeof ConvertirPresupuestoSchema>;
export type DuplicarPresupuestoDTO = z.infer<typeof DuplicarPresupuestoSchema>;
export type LineaPresupuestoDTO = z.infer<typeof LineaPresupuestoSchema>;
export type ComponenteKitDTO = z.infer<typeof ComponenteKitSchema>;
export type DireccionEntregaDTO = z.infer<typeof DireccionEntregaSchema>;
export type CondicionesComercialesDTO = z.infer<typeof CondicionesComercialesSchema>;
export type TotalesPresupuestoDTO = z.infer<typeof TotalesPresupuestoSchema>;
