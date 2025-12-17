/**
 * DTOs para Presupuestos de Compra
 */

import { EstadoPresupuestoCompra, Prioridad } from './PresupuestoCompra';

// ============================================
// DTO PARA CREAR
// ============================================

export interface CreatePresupuestoCompraDTO {
  proveedorId: string;
  proveedorNombre?: string;
  proveedorNif?: string;
  proveedorEmail?: string;
  proveedorTelefono?: string;
  contactoProveedor?: string;

  serie?: string;
  estado?: EstadoPresupuestoCompra;
  prioridad?: Prioridad;

  fecha?: Date;
  fechaSolicitud?: Date;
  fechaValidez?: Date;

  titulo?: string;
  descripcion?: string;

  referenciaProveedor?: string;
  numeroPresupuestoProveedor?: string;

  lineas?: CreateLineaPresupuestoCompraDTO[];

  condiciones?: {
    formaPagoId?: string;
    terminoPagoId?: string;
    diasPago?: number;
    portesPagados?: boolean;
    portesImporte?: number;
    plazoEntrega?: string;
    garantia?: string;
    observaciones?: string;
  };

  direccionEntrega?: {
    tipo?: 'empresa' | 'almacen' | 'personalizada';
    almacenId?: string;
    nombre?: string;
    calle?: string;
    numero?: string;
    piso?: string;
    codigoPostal?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    personaContacto?: string;
    telefonoContacto?: string;
  };

  descuentoGlobalPorcentaje?: number;

  observaciones?: string;
  observacionesInternas?: string;

  tags?: string[];
}

export interface CreateLineaPresupuestoCompraDTO {
  tipo?: 'producto' | 'servicio' | 'texto' | 'subtotal' | 'descuento';
  productoId?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  sku?: string;
  codigoProveedor?: string;
  cantidad: number;
  unidad?: string;
  precioUnitario: number;
  descuento?: number;
  iva?: number;
  precioAlternativo?: number;
  notasPrecio?: string;
  fechaEntregaEstimada?: Date;
  almacenDestinoId?: string;
  notasInternas?: string;
}

// ============================================
// DTO PARA ACTUALIZAR
// ============================================

export interface UpdatePresupuestoCompraDTO extends Partial<CreatePresupuestoCompraDTO> {
  estado?: EstadoPresupuestoCompra;
  fechaRecepcion?: Date;
  fechaDecision?: Date;
  motivoRechazo?: string;
  activo?: boolean;
  bloqueado?: boolean;
}

// ============================================
// DTO PARA QUERY
// ============================================

export interface GetPresupuestosCompraQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  estado?: EstadoPresupuestoCompra;
  estados?: string; // Separados por coma
  prioridad?: Prioridad;
  proveedorId?: string;
  activo?: boolean | string;
  fechaDesde?: string;
  fechaHasta?: string;
  fechaValidezDesde?: string;
  fechaValidezHasta?: string;
  importeMinimo?: number;
  importeMaximo?: number;
  tags?: string;
  [key: string]: any; // Para filtros avanzados
}

// ============================================
// DTO PARA CONVERTIR A PEDIDO
// ============================================

export interface ConvertirAPedidoDTO {
  presupuestoCompraId: string;
  lineasIds?: string[]; // Si no se especifica, todas las lineas
  fechaEntregaPrevista?: Date;
  observaciones?: string;
}
