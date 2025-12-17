import { EstadoAlbaranCompra, TipoLineaCompra, ILineaAlbaranCompra } from './AlbaranCompra';

// ============================================
// DTOs DE LÍNEAS
// ============================================

export interface LineaAlbaranCompraDTO {
  orden?: number;
  tipo?: TipoLineaCompra;
  productoId?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  sku?: string;
  codigoProveedor?: string;
  variante?: {
    varianteId?: string;
    sku?: string;
    valores?: Record<string, string>;
  };
  cantidadPedida?: number;
  cantidadRecibida?: number;
  unidad?: string;
  precioUnitario: number;
  descuento?: number;
  iva?: number;
  almacenDestinoId?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: Date;
  ubicacion?: string;
  esEditable?: boolean;
  incluidoEnTotal?: boolean;
  notasInternas?: string;
  lineaPedidoCompraId?: string;
}

// ============================================
// DTOs PRINCIPALES
// ============================================

export interface CreateAlbaranCompraDTO {
  serie?: string;
  estado?: EstadoAlbaranCompra;
  fecha?: Date;
  fechaRecepcion?: Date;
  fechaPrevistaRecepcion?: Date;

  proveedorId: string;
  proveedorNombre?: string;
  proveedorNif?: string;
  proveedorEmail?: string;
  proveedorTelefono?: string;

  pedidoCompraId?: string;

  datosTransporte?: {
    transportista?: string;
    matricula?: string;
    conductor?: string;
    numeroBultos?: number;
    pesoTotal?: number;
    numeroSeguimiento?: string;
  };

  almacenId: string;

  referenciaProveedor?: string;
  numeroAlbaranProveedor?: string;

  titulo?: string;
  descripcion?: string;

  lineas?: LineaAlbaranCompraDTO[];

  descuentoGlobalPorcentaje?: number;

  observaciones?: string;
  observacionesInternas?: string;

  tags?: string[];
}

export interface UpdateAlbaranCompraDTO extends Partial<CreateAlbaranCompraDTO> {}

// ============================================
// DTOs DE BÚSQUEDA
// ============================================

export interface SearchAlbaranesCompraDTO {
  search?: string;
  proveedorId?: string;
  almacenId?: string;
  estado?: EstadoAlbaranCompra;
  estados?: string; // Múltiples estados separados por coma
  serie?: string;
  activo?: string;
  facturado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  fechaRecepcionDesde?: string;
  fechaRecepcionHasta?: string;
  importeMin?: number;
  importeMax?: number;
  pedidoCompraId?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Campos para filtros avanzados
  [key: string]: any;
}

// ============================================
// DTOs DE RECEPCIÓN
// ============================================

export interface RegistrarRecepcionDTO {
  fechaRecepcion?: Date;
  lineasRecibidas: Array<{
    lineaId: string;
    cantidadRecibida: number;
    lote?: string;
    numeroSerie?: string;
    fechaCaducidad?: Date;
    ubicacion?: string;
    observaciones?: string;
  }>;
  datosTransporte?: {
    transportista?: string;
    matricula?: string;
    conductor?: string;
    numeroBultos?: number;
    pesoTotal?: number;
    numeroSeguimiento?: string;
  };
  observaciones?: string;
  incidencias?: string;
}

// ============================================
// DTOs DESDE PEDIDO DE COMPRA
// ============================================

export interface CrearDesdePedidoCompraDTO {
  pedidoCompraId: string;
  lineasIds?: string[]; // Si no se especifica, incluir todas las líneas pendientes
  recibirTodo?: boolean; // Si es true, recibir todas las cantidades pendientes
  almacenId?: string; // Almacén de recepción, si es diferente al del pedido
  numeroAlbaranProveedor?: string; // Número del albarán del proveedor
  observaciones?: string;
  fechaPrevistaRecepcion?: Date;
  datosTransporte?: {
    transportista?: string;
    matricula?: string;
    conductor?: string;
    numeroBultos?: number;
    pesoTotal?: number;
    numeroSeguimiento?: string;
  };
  // Líneas específicas con cantidades a recibir
  lineas?: Array<{
    lineaId: string;
    cantidadRecibida: number;
    varianteId?: string; // ID de la variante si el producto tiene variantes
    lote?: string;
    ubicacion?: string;
  }>;
}
