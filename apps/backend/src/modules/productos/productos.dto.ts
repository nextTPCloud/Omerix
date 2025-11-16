import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN - PRODUCTOS
// ============================================

const PrecioSchema = z.object({
  compra: z.number().min(0).default(0),
  venta: z.number().min(0, 'Precio de venta requerido'),
  pvp: z.number().min(0).default(0),
  margen: z.number().default(0),
});

const StockSchema = z.object({
  cantidad: z.number().default(0),
  minimo: z.number().min(0).default(0),
  maximo: z.number().min(0).default(0),
  ubicacion: z.string().optional(),
});

// Nuevo sistema de variantes
const ValorAtributoSchema = z.object({
  valor: z.string().min(1, 'Valor requerido'),
  hexColor: z.string().optional(), // Para colores
  codigoProveedor: z.string().optional(),
  activo: z.boolean().default(true),
});

const AtributoSchema = z.object({
  nombre: z.string().min(1, 'Nombre del atributo requerido'),
  valores: z.array(ValorAtributoSchema).min(1, 'Debe haber al menos un valor'),
  tipoVisualizacion: z.enum(['botones', 'dropdown', 'colores']).default('botones'),
  obligatorio: z.boolean().default(true),
});

const VarianteSchema = z.object({
  sku: z.string().min(1, 'SKU de variante requerido'),
  codigoBarras: z.string().optional(),
  combinacion: z.record(z.string(), z.string()), // { talla: "M", color: "Rojo" }
  stock: StockSchema.optional(),
  precioExtra: z.number().default(0),
  imagenes: z.array(z.string()).optional(),
  activo: z.boolean().default(true),
  peso: z.number().min(0).optional(),
});

const DimensionesSchema = z.object({
  largo: z.number().min(0),
  ancho: z.number().min(0),
  alto: z.number().min(0),
});

// Schema base
const ProductoBaseSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  sku: z.string().min(1, 'SKU requerido'),
  codigoBarras: z.string().optional(),
  referencia: z.string().optional(),

  // Categorización
  familiaId: z.string().optional(),
  marca: z.string().optional(),
  tags: z.array(z.string()).default([]),

  // Tipo de producto
  tipo: z.enum(['simple', 'variantes', 'compuesto', 'servicio', 'materia_prima']).default('simple'),

  // Precios
  precios: PrecioSchema,

  // Stock
  stock: StockSchema.default({
    cantidad: 0,
    minimo: 0,
    maximo: 0,
  }),
  gestionaStock: z.boolean().default(true),

  // Variantes
  tieneVariantes: z.boolean().default(false),
  atributos: z.array(AtributoSchema).default([]),
  variantes: z.array(VarianteSchema).default([]),

  // Impuestos
  iva: z.number().min(0).max(100).default(21),
  tipoImpuesto: z.enum(['iva', 'igic', 'exento']).default('iva'),

  // Proveedor
  proveedorId: z.string().optional(),

  // Características físicas
  peso: z.number().min(0).optional(),
  dimensiones: DimensionesSchema.optional(),

  // Imágenes
  imagenes: z.array(z.string()).default([]),
  imagenPrincipal: z.string().optional(),

  // Estado
  activo: z.boolean().default(true),
  disponible: z.boolean().default(true),
  destacado: z.boolean().default(false),

  // Notas
  notas: z.string().optional(),
});

// Crear producto
export const CreateProductoSchema = ProductoBaseSchema;

// Actualizar producto
export const UpdateProductoSchema = ProductoBaseSchema.partial();

// Búsqueda y filtros
export const SearchProductosSchema = z.object({
  q: z.string().optional(), // Búsqueda de texto
  familiaId: z.string().optional(),
  marca: z.string().optional(),
  tipo: z.string().optional(),
  tags: z.string().optional(), // Separado por comas
  activo: z.string().transform(val => val === 'true').optional(),
  disponible: z.string().transform(val => val === 'true').optional(),
  destacado: z.string().transform(val => val === 'true').optional(),
  sinStock: z.string().transform(val => val === 'true').optional(),
  stockBajo: z.string().transform(val => val === 'true').optional(),
  precioMin: z.string().transform(val => parseFloat(val) || undefined).optional(),
  precioMax: z.string().transform(val => parseFloat(val) || undefined).optional(),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 20).default('20'),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Actualizar stock
export const UpdateStockSchema = z.object({
  cantidad: z.number(),
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  motivo: z.string().optional(),
  varianteId: z.string().optional(), // Para actualizar stock de variante específica
});

// Generar variantes automáticamente
export const GenerarVariantesSchema = z.object({
  productoId: z.string().min(1, 'ID del producto requerido'),
  atributos: z.array(AtributoSchema).min(1, 'Debe haber al menos un atributo'),
  skuBase: z.string().min(1, 'SKU base requerido'),
  precioBase: z.number().min(0, 'Precio base requerido'),
});

// ============================================
// TYPES
// ============================================

export type CreateProductoDTO = z.infer<typeof CreateProductoSchema>;
export type UpdateProductoDTO = z.infer<typeof UpdateProductoSchema>;
export type SearchProductosDTO = z.infer<typeof SearchProductosSchema>;
export type UpdateStockDTO = z.infer<typeof UpdateStockSchema>;
export type GenerarVariantesDTO = z.infer<typeof GenerarVariantesSchema>;
export type AtributoDTO = z.infer<typeof AtributoSchema>;
export type VarianteDTO = z.infer<typeof VarianteSchema>;
export type ValorAtributoDTO = z.infer<typeof ValorAtributoSchema>;