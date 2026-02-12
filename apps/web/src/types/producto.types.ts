// ============================================
// INTERFACES BÁSICAS
// ============================================

export interface Precio {
  compra: number
  venta: number
  pvp: number
  margen: number
}

export interface Stock {
  cantidad: number
  minimo: number
  maximo: number
  ubicacion?: string
  almacenId?: string
}

export interface ValorAtributo {
  valor: string
  hexColor?: string
  codigoProveedor?: string
  activo: boolean
}

export interface Atributo {
  nombre: string
  valores: ValorAtributo[]
  tipoVisualizacion: 'botones' | 'dropdown' | 'colores'
  obligatorio: boolean
}

// Precios específicos de una variante
export interface PrecioVariante {
  compra: number           // Precio de compra
  venta: number            // Precio de venta (sin IVA)
  pvp: number              // Precio venta al público
  margen?: number          // Porcentaje de margen calculado
  usarPrecioBase?: boolean // Si es true, usa los precios del producto padre
}

// Stock de variante por almacén
export interface StockVarianteAlmacen {
  almacenId: string
  almacen?: {
    _id: string
    nombre: string
    codigo: string
  }
  cantidad: number
  minimo: number
  maximo: number
  ubicacion?: string
  ultimaActualizacion?: string
}

// Dimensiones de la variante
export interface DimensionesVariante {
  largo: number  // cm
  ancho: number  // cm
  alto: number   // cm
}

export interface Variante {
  _id?: string
  sku: string
  codigoBarras?: string
  codigosBarrasAlternativos?: string[]     // Códigos de barras alternativos
  combinacion: Record<string, string>

  // Precios específicos de la variante
  precios: PrecioVariante

  // Stock multi-almacén
  stockPorAlmacen: StockVarianteAlmacen[]

  // Imágenes específicas de esta variante
  imagenes?: string[]

  // Características físicas (si difieren del producto base)
  peso?: number
  dimensiones?: DimensionesVariante

  // Estado
  activo: boolean

  // Referencia del proveedor para esta variante específica
  referenciaProveedor?: string

  // Notas internas
  notas?: string

  // Virtual calculado - stock total de todos los almacenes
  stockTotal?: number
}

export interface NumeroSerie {
  _id?: string
  numero: string
  estado: 'disponible' | 'vendido' | 'defectuoso' | 'reservado'
  almacenId?: string
  fechaEntrada: string
  fechaSalida?: string
  clienteId?: string
  notas?: string
}

export interface Lote {
  _id?: string
  numero: string
  cantidad: number
  fechaFabricacion?: string
  fechaCaducidad?: string
  almacenId?: string
  proveedorId?: string
  estado: 'activo' | 'caducado' | 'retirado'
  notas?: string
}

export interface StockAlmacen {
  almacenId: string
  almacen?: {
    _id: string
    nombre: string
    codigo: string
  }
  cantidad: number
  minimo: number
  maximo: number
  ubicacion?: string
  ultimaActualizacion: string
}

export interface ComponenteKit {
  _id?: string
  productoId: string
  producto?: {
    _id: string
    nombre: string
    sku: string
    imagenPrincipal?: string
  }
  cantidad: number
  opcional: boolean
  orden: number
}

export interface PrecioCantidad {
  cantidadMinima: number
  precio: number
  descuentoPorcentaje?: number
}

export interface ProveedorPrincipal {
  proveedorId: string
  proveedor?: {
    _id: string
    nombre: string
    razonSocial: string
  }
  referencia?: string
  precioCompra?: number
  plazoEntrega?: number
}

// ============================================
// INTERFACE PRINCIPAL - PRODUCTO
// ============================================

export interface Producto {
  _id: string
  empresaId: string

  // Identificación
  nombre: string
  descripcion?: string
  descripcionCorta?: string
  sku: string
  codigoBarras?: string
  codigosAlternativos: string[]
  referencia?: string

  // Categorización
  familiaId?: string
  familia?: {
    _id: string
    nombre: string
  }
  marca?: string
  tags: string[]

  // Estados y situaciones
  estadoId?: string
  estado?: {
    _id: string
    nombre: string
  }
  situacionId?: string
  situacion?: {
    _id: string
    nombre: string
  }
  clasificacionId?: string
  clasificacion?: {
    _id: string
    nombre: string
  }

  // Tipo de producto
  tipo: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima'

  // Kit/Partidas
  componentesKit: ComponenteKit[]

  // Precios
  precios: Precio
  preciosPorCantidad: PrecioCantidad[]

  // Stock
  stock: Stock
  gestionaStock: boolean
  permitirStockNegativo: boolean
  stockPorAlmacen: StockAlmacen[]

  // Trazabilidad
  trazabilidad: {
    tipo: 'ninguna' | 'lote' | 'numero_serie'
    lotes: Lote[]
    numerosSerie: NumeroSerie[]
  }

  // Variantes
  tieneVariantes: boolean
  atributos: Atributo[]
  variantes: Variante[]

  // Impuestos
  iva: number
  tipoImpuesto: 'iva' | 'igic' | 'exento'
  tipoImpuestoId?: string
  tipoImpuestoDetalle?: {
    _id: string
    nombre: string
    porcentaje: number
  }

  // Proveedor
  proveedorId?: string
  proveedor?: {
    _id: string
    nombre: string
    razonSocial: string
  }
  proveedorPrincipal?: ProveedorPrincipal

  // Características físicas
  peso?: number
  volumen?: number
  dimensiones?: {
    largo: number
    ancho: number
    alto: number
  }

  // Unidades
  unidadMedida?: string
  unidadesEmbalaje?: number
  pesoEmbalaje?: number

  // Imágenes
  imagenes: string[]
  imagenPrincipal?: string

  // Estado
  activo: boolean
  disponible: boolean
  destacado: boolean
  nuevo: boolean
  oferta: boolean

  // TPV
  usarEnTPV: boolean
  usarEnKiosk: boolean
  permiteDescuento: boolean
  precioModificable: boolean
  imprimirEnTicket: boolean

  // E-commerce
  publicarWeb: boolean
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]

  // Notas
  notas?: string
  notasInternas?: string
  instruccionesUso?: string

  // Garantía
  garantiaMeses?: number
  requiereInstalacion: boolean
  requiereMantenimiento: boolean

  // Estadísticas
  estadisticas: {
    vecesVendido: number
    vecesComprado: number
    ingresoTotal: number
    costoTotal: number
    ultimaVenta?: string
    ultimaCompra?: string
  }

  // Costes calculados (actualizados automáticamente por el sistema de stock)
  costes?: {
    costeUltimo: number       // Precio de la última compra
    costeMedio: number        // Coste medio ponderado
    costeEstandar?: number    // Coste estándar (fijo, definido manualmente)
    ultimaActualizacion?: string
  }

  // Virtuals
  stockTotal?: number
  stockPorVariante?: {
    varianteId: string
    sku: string
    combinacion: Record<string, string>
    stockTotal: number
    stockPorAlmacen: StockVarianteAlmacen[]
  }[]

  // Auditoría
  creadoPor?: string
  modificadoPor?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// DTOs PARA CREAR Y ACTUALIZAR
// ============================================

export interface CreateProductoDTO {
  nombre: string
  sku: string
  descripcion?: string
  descripcionCorta?: string
  familiaId?: string
  codigoBarras?: string
  codigosAlternativos?: string[]
  referencia?: string
  marca?: string
  tags?: string[]

  // Estados
  estadoId?: string
  situacionId?: string
  clasificacionId?: string

  // Tipo
  tipo?: 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima'
  componentesKit?: ComponenteKit[]

  // Precios
  precios: {
    compra: number
    venta: number
    pvp?: number
    margen?: number
  }
  preciosPorCantidad?: PrecioCantidad[]

  // Stock
  stock?: {
    cantidad?: number
    minimo?: number
    maximo?: number
    ubicacion?: string
  }
  gestionaStock?: boolean
  permitirStockNegativo?: boolean
  stockPorAlmacen?: Omit<StockAlmacen, 'ultimaActualizacion'>[]

  // Trazabilidad
  trazabilidad?: {
    tipo?: 'ninguna' | 'lote' | 'numero_serie'
    lotes?: Omit<Lote, '_id'>[]
    numerosSerie?: Omit<NumeroSerie, '_id'>[]
  }

  // Variantes
  tieneVariantes?: boolean
  atributos?: Atributo[]
  variantes?: Omit<Variante, '_id'>[]

  // Impuestos
  iva?: number
  tipoImpuesto?: 'iva' | 'igic' | 'exento'
  tipoImpuestoId?: string

  // Proveedor
  proveedorId?: string
  proveedorPrincipal?: ProveedorPrincipal

  // Características
  peso?: number
  volumen?: number
  dimensiones?: {
    largo: number
    ancho: number
    alto: number
  }
  unidadMedida?: string
  unidadesEmbalaje?: number
  pesoEmbalaje?: number

  // Imágenes
  imagenes?: string[]
  imagenPrincipal?: string

  // Estado
  activo?: boolean
  disponible?: boolean
  destacado?: boolean
  nuevo?: boolean
  oferta?: boolean

  // TPV
  usarEnTPV?: boolean
  usarEnKiosk?: boolean
  permiteDescuento?: boolean
  precioModificable?: boolean
  imprimirEnTicket?: boolean

  // E-commerce
  publicarWeb?: boolean
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]

  // Notas
  notas?: string
  notasInternas?: string
  instruccionesUso?: string

  // Garantía
  garantiaMeses?: number
  requiereInstalacion?: boolean
  requiereMantenimiento?: boolean
}

export interface UpdateProductoDTO extends Partial<CreateProductoDTO> {
  modificadoPor?: string
}

// ============================================
// DTOs ESPECÍFICOS
// ============================================

export interface UpdateStockDTO {
  almacenId?: string
  cantidad: number
  minimo?: number
  maximo?: number
  ubicacion?: string
  tipo?: 'ajuste' | 'entrada' | 'salida' | 'transferencia'
  motivo?: string
  observaciones?: string
}

export interface GenerarVariantesDTO {
  atributos: Atributo[]
  mantenerExistentes?: boolean
}

export interface AgregarLoteDTO {
  numero: string
  cantidad: number
  fechaFabricacion?: string
  fechaCaducidad?: string
  almacenId?: string
  proveedorId?: string
  notas?: string
}

export interface AgregarNumeroSerieDTO {
  numero: string
  almacenId?: string
  notas?: string
}

export interface TransferirStockDTO {
  productoId: string
  almacenOrigenId: string
  almacenDestinoId: string
  cantidad: number
  observaciones?: string
}

// ============================================
// RESPONSES
// ============================================

export interface ProductosResponse {
  success: boolean
  data: Producto[]
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
    totalPages?: number
  }
}

export interface ProductoResponse {
  success: boolean
  data: Producto
  message?: string
}

export interface ProductosStockBajoResponse {
  success: boolean
  data: Producto[]
  total: number
}

export interface EstadisticasProductosResponse {
  success: boolean
  data: {
    totalProductos: number
    productosActivos: number
    productosInactivos: number
    productosSinStock: number
    productosStockBajo: number
    valorInventario: number
    tiposMasVendidos: Array<{
      tipo: string
      cantidad: number
      porcentaje: number
    }>
    productosMasVendidos: Producto[]
  }
}
