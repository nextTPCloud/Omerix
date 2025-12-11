import { z } from 'zod';
import { EstadoPedidoCompra, TipoLineaCompra, Prioridad } from './PedidoCompra';

// ============================================
// SCHEMAS DE LINEA
// ============================================

const LineaPedidoCompraSchema = z.object({
  orden: z.number().min(0).optional(),
  tipo: z.nativeEnum(TipoLineaCompra).default(TipoLineaCompra.PRODUCTO),

  // Producto
  productoId: z.string().optional(),
  codigo: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  sku: z.string().optional(),
  codigoProveedor: z.string().optional(),

  // Cantidades
  cantidad: z.number().min(0).default(1),
  cantidadRecibida: z.number().min(0).optional().default(0),
  cantidadPendiente: z.number().min(0).optional().default(0),
  unidad: z.string().optional().default('ud'),

  // Precios
  precioUnitario: z.number().min(0).default(0),
  descuento: z.number().min(0).max(100).default(0),
  descuentoImporte: z.number().min(0).optional().default(0),
  subtotal: z.number().min(0).default(0),
  iva: z.number().min(0).default(21),
  ivaImporte: z.number().min(0).optional().default(0),
  total: z.number().min(0).default(0),

  // Fechas
  fechaEntregaPrevista: z.string().datetime().optional().or(z.date()).optional(),
  fechaRecepcion: z.string().datetime().optional().or(z.date()).optional(),

  // Almacen
  almacenDestinoId: z.string().optional(),

  // Flags
  esEditable: z.boolean().optional().default(true),
  incluidoEnTotal: z.boolean().optional().default(true),

  // Notas
  notasInternas: z.string().optional(),
});

// ============================================
// SCHEMAS DE DIRECCION
// ============================================

const DireccionRecepcionSchema = z.object({
  tipo: z.enum(['empresa', 'almacen', 'personalizada']).default('empresa'),
  almacenId: z.string().optional(),
  nombre: z.string().optional(),
  calle: z.string().optional(),
  numero: z.string().optional(),
  piso: z.string().optional(),
  codigoPostal: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().optional(),
  pais: z.string().optional().default('España'),
  personaContacto: z.string().optional(),
  telefonoContacto: z.string().optional(),
  horarioRecepcion: z.string().optional(),
  instrucciones: z.string().optional(),
});

// ============================================
// SCHEMAS DE CONDICIONES
// ============================================

const CondicionesCompraSchema = z.object({
  formaPagoId: z.string().optional(),
  terminoPagoId: z.string().optional(),
  diasPago: z.number().min(0).optional(),
  portesPagados: z.boolean().optional().default(false),
  portesImporte: z.number().min(0).optional(),
  observacionesEntrega: z.string().optional(),
});

// ============================================
// SCHEMAS DE TOTALES
// ============================================

const DesgloseIvaSchema = z.object({
  tipo: z.number(),
  base: z.number(),
  cuota: z.number(),
});

const TotalesPedidoCompraSchema = z.object({
  subtotalBruto: z.number().min(0).default(0),
  totalDescuentos: z.number().min(0).default(0),
  subtotalNeto: z.number().min(0).default(0),
  desgloseIva: z.array(DesgloseIvaSchema).default([]),
  totalIva: z.number().min(0).default(0),
  totalPedido: z.number().min(0).default(0),
});

// ============================================
// SCHEMA DE CREACION
// ============================================

export const CreatePedidoCompraSchema = z.object({
  // Identificacion
  serie: z.string().optional().default('PC'),

  // Estado
  estado: z.nativeEnum(EstadoPedidoCompra).optional().default(EstadoPedidoCompra.BORRADOR),

  // Prioridad
  prioridad: z.nativeEnum(Prioridad).optional().default(Prioridad.MEDIA),

  // Fechas
  fecha: z.string().datetime().optional().or(z.date()).optional(),
  fechaEnvio: z.string().datetime().optional().or(z.date()).optional(),
  fechaConfirmacion: z.string().datetime().optional().or(z.date()).optional(),
  fechaEntregaPrevista: z.string().datetime().optional().or(z.date()).optional(),
  fechaRecepcion: z.string().datetime().optional().or(z.date()).optional(),

  // Proveedor
  proveedorId: z.string().min(1, 'El proveedor es requerido'),
  proveedorNombre: z.string().optional(),
  proveedorNif: z.string().optional(),
  proveedorEmail: z.string().email().optional().or(z.literal('')),
  proveedorTelefono: z.string().optional(),

  // Recepcion
  direccionRecepcion: DireccionRecepcionSchema.optional(),

  // Referencias
  referenciaProveedor: z.string().optional(),
  numeroConfirmacion: z.string().optional(),

  // Titulo y descripcion
  titulo: z.string().optional(),
  descripcion: z.string().optional(),

  // Lineas
  lineas: z.array(LineaPedidoCompraSchema).optional().default([]),

  // Condiciones
  condiciones: CondicionesCompraSchema.optional(),

  // Totales
  totales: TotalesPedidoCompraSchema.optional(),

  // Descuento global
  descuentoGlobalPorcentaje: z.number().min(0).max(100).optional().default(0),
  descuentoGlobalImporte: z.number().min(0).optional().default(0),

  // Textos
  observaciones: z.string().optional(),
  observacionesAlmacen: z.string().optional(),

  // Tags
  tags: z.array(z.string()).optional(),

  // Control
  activo: z.boolean().optional().default(true),
});

// ============================================
// SCHEMA DE ACTUALIZACION
// ============================================

export const UpdatePedidoCompraSchema = CreatePedidoCompraSchema.partial();

// ============================================
// SCHEMA DE QUERY/FILTROS
// ============================================

export const GetPedidosCompraQuerySchema = z.object({
  // Paginacion
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 25)),

  // Ordenacion
  sortBy: z.string().optional().default('fecha'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  // Busqueda
  search: z.string().optional(),

  // Filtros basicos
  estado: z.string().optional(),
  prioridad: z.string().optional(),
  proveedorId: z.string().optional(),
  activo: z.string().optional().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),

  // Filtros de fecha
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  fechaEntregaDesde: z.string().optional(),
  fechaEntregaHasta: z.string().optional(),

  // Filtros de importes
  importeMinimo: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  importeMaximo: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
});

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type CreatePedidoCompraDTO = z.infer<typeof CreatePedidoCompraSchema>;
export type UpdatePedidoCompraDTO = z.infer<typeof UpdatePedidoCompraSchema>;
export type GetPedidosCompraQuery = z.infer<typeof GetPedidosCompraQuerySchema>;
export type LineaPedidoCompraDTO = z.infer<typeof LineaPedidoCompraSchema>;
