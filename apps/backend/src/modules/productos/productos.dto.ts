import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN
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

const VarianteSchema = z.object({
  nombre: z.string().min(1, 'Nombre de variante requerido'),
  valor: z.string().min(1, 'Valor de variante requerido'),
  sku: z.string().optional(),
  codigoBarras: z.string().optional(),
  stock: StockSchema.optional(),
  precio: z.number().min(0).optional(),
  activo: z.boolean().default(true),
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
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  marca: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
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
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  marca: z.string().optional(),
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
});

// ============================================
// TYPES
// ============================================

export type CreateProductoDTO = z.infer<typeof CreateProductoSchema>;
export type UpdateProductoDTO = z.infer<typeof UpdateProductoSchema>;
export type SearchProductosDTO = z.infer<typeof SearchProductosSchema>;
export type UpdateStockDTO = z.infer<typeof UpdateStockSchema>;