import { EstadoFacturaCompra, TipoLineaFacturaCompra } from './FacturaCompra';

// ============================================
// DTOs DE LÍNEAS
// ============================================

export interface LineaFacturaCompraDTO {
  orden?: number;
  tipo?: TipoLineaFacturaCompra;
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
  cantidad?: number;
  unidad?: string;
  precioUnitario: number;
  descuento?: number;
  iva?: number;
  esEditable?: boolean;
  incluidoEnTotal?: boolean;
  notasInternas?: string;
  lineaAlbaranCompraId?: string;
}

// ============================================
// DTOs DE VENCIMIENTOS
// ============================================

export interface VencimientoFacturaCompraDTO {
  numero?: number;
  fechaVencimiento: Date;
  importe: number;
  formaPagoId?: string;
}

// ============================================
// DTOs PRINCIPALES
// ============================================

export interface CreateFacturaCompraDTO {
  serie?: string;
  estado?: EstadoFacturaCompra;
  fecha?: Date;
  fechaVencimiento?: Date;
  fechaContabilizacion?: Date;

  numeroFacturaProveedor: string;
  fechaFacturaProveedor: Date;

  proveedorId: string;
  proveedorNombre?: string;
  proveedorNif?: string;
  proveedorEmail?: string;
  proveedorTelefono?: string;
  proveedorDireccion?: string;

  albaranesCompraIds?: string[];
  pedidosCompraIds?: string[];

  titulo?: string;
  descripcion?: string;

  lineas?: LineaFacturaCompraDTO[];

  descuentoGlobalPorcentaje?: number;

  vencimientos?: VencimientoFacturaCompraDTO[];

  formaPagoId?: string;
  terminoPagoId?: string;
  cuentaBancariaId?: string;

  observaciones?: string;
  observacionesInternas?: string;

  tags?: string[];
}

export interface UpdateFacturaCompraDTO extends Partial<CreateFacturaCompraDTO> {}

// ============================================
// DTOs DE BÚSQUEDA
// ============================================

export interface SearchFacturasCompraDTO {
  search?: string;
  proveedorId?: string;
  estado?: EstadoFacturaCompra;
  estados?: string;
  serie?: string;
  activo?: string;
  contabilizada?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  fechaVencimientoDesde?: string;
  fechaVencimientoHasta?: string;
  importeMin?: number;
  importeMax?: number;
  numeroFacturaProveedor?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

// ============================================
// DTOs DE PAGO
// ============================================

export interface RegistrarPagoDTO {
  vencimientoId?: string; // Si no se especifica, aplicar al más antiguo
  importe: number;
  fechaPago?: Date;
  formaPagoId?: string;
  referenciaPago?: string;
  observaciones?: string;
}

// ============================================
// DTOs DESDE ALBARANES
// ============================================

export interface CrearDesdeAlbaranesDTO {
  albaranesCompraIds: string[];
  numeroFacturaProveedor: string;
  fechaFacturaProveedor: Date;
  agruparPorProveedor?: boolean;
  formaPagoId?: string;
  terminoPagoId?: string;
}
