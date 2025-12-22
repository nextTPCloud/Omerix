import { api } from './api';

// Tipos de movimiento
export enum TipoMovimiento {
  ENTRADA_COMPRA = 'entrada_compra',
  SALIDA_VENTA = 'salida_venta',
  DEVOLUCION_CLIENTE = 'devolucion_cliente',
  DEVOLUCION_PROVEEDOR = 'devolucion_proveedor',
  AJUSTE_POSITIVO = 'ajuste_positivo',
  AJUSTE_NEGATIVO = 'ajuste_negativo',
  TRANSFERENCIA_ENTRADA = 'transferencia_entrada',
  TRANSFERENCIA_SALIDA = 'transferencia_salida',
  INVENTARIO_INICIAL = 'inventario_inicial',
  REGULARIZACION = 'regularizacion',
  MERMA = 'merma',
  PRODUCCION_ENTRADA = 'produccion_entrada',
  PRODUCCION_SALIDA = 'produccion_salida',
}

export enum OrigenMovimiento {
  ALBARAN_VENTA = 'albaran_venta',
  ALBARAN_COMPRA = 'albaran_compra',
  PEDIDO_VENTA = 'pedido_venta',
  PEDIDO_COMPRA = 'pedido_compra',
  FACTURA_VENTA = 'factura_venta',
  FACTURA_COMPRA = 'factura_compra',
  AJUSTE_MANUAL = 'ajuste_manual',
  TRANSFERENCIA = 'transferencia',
  INVENTARIO = 'inventario',
  DEVOLUCION = 'devolucion',
  PRODUCCION = 'produccion',
}

export interface MovimientoStock {
  _id: string;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  productoSku?: string;
  varianteId?: string;
  varianteSku?: string;
  varianteNombre?: string;
  almacenId: string;
  almacenNombre: string;
  almacenDestinoId?: string;
  almacenDestinoNombre?: string;
  tipo: TipoMovimiento;
  origen: OrigenMovimiento;
  documentoOrigenId?: string;
  documentoOrigenCodigo?: string;
  documentoOrigenTipo?: string;
  terceroId?: string;
  terceroNombre?: string;
  terceroTipo?: 'cliente' | 'proveedor';
  cantidad: number;
  stockAnterior: number;
  stockPosterior: number;
  precioUnitario: number;
  costeUnitario: number;
  valorMovimiento: number;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: string;
  ubicacion?: string;
  motivo?: string;
  observaciones?: string;
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  anulado: boolean;
  fechaAnulacion?: string;
  motivoAnulacion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchMovimientosParams {
  productoId?: string;
  almacenId?: string;
  tipo?: TipoMovimiento;
  origen?: OrigenMovimiento;
  fechaDesde?: string;
  fechaHasta?: string;
  terceroId?: string;
  terceroTipo?: 'cliente' | 'proveedor';
  documentoOrigenId?: string;
  lote?: string;
  numeroSerie?: string;
  incluirAnulados?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAjusteDTO {
  productoId: string;
  almacenId: string;
  varianteId?: string;
  tipo: 'entrada' | 'salida' | 'merma';
  cantidad: number;
  motivo: string;
  observaciones?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: string;
  ubicacion?: string;
  costeUnitario?: number;
}

export interface SearchStockParams {
  almacenId?: string;
  familiaId?: string;
  q?: string;
  stockBajo?: boolean;
  sinStock?: boolean;
  conStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockProducto {
  _id: string;
  codigo?: string;
  sku: string;
  nombre: string;
  familiaNombre?: string;
  stock: {
    cantidad: number;
    minimo: number;
    maximo?: number;
  };
  stockPorAlmacen?: {
    almacenId: string;
    almacenNombre?: string;
    cantidad: number;
    minimo: number;
    maximo?: number;
    ubicacion?: string;
  }[];
  costes?: {
    costeUltimo: number;
    costeMedio: number;
  };
  precio?: {
    base: number;
    venta: number;
  };
  stockEnAlmacen?: number;
  minimoEnAlmacen?: number;
  maximoEnAlmacen?: number;
  ubicacionEnAlmacen?: string;
}

export interface ResumenStockProducto {
  stockTotal: number;
  stockPorAlmacen: {
    almacenId: string;
    almacenNombre: string;
    cantidad: number;
    valoracion: number;
    ultimoMovimiento?: string;
  }[];
  costeUltimo: number;
  costeMedio: number;
  valoracionTotal: number;
}

export interface ValoracionInventario {
  totalProductos: number;
  valorTotal: number;
  detalle: {
    productoId: string;
    productoCodigo: string;
    productoNombre: string;
    cantidad: number;
    coste: number;
    valoracion: number;
  }[];
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class StockService {
  private readonly BASE_URL = '/stock';

  /**
   * Obtener listado de movimientos con filtros
   */
  async getMovimientos(params?: SearchMovimientosParams): Promise<PaginatedResponse<MovimientoStock>> {
    const response = await api.get<PaginatedResponse<MovimientoStock>>(
      `${this.BASE_URL}/movimientos`,
      { params: { ...params, incluirAnulados: params?.incluirAnulados ? 'true' : undefined } }
    );
    return response.data;
  }

  /**
   * Obtener detalle de un movimiento
   */
  async getMovimiento(id: string): Promise<SingleResponse<MovimientoStock>> {
    const response = await api.get<SingleResponse<MovimientoStock>>(
      `${this.BASE_URL}/movimientos/${id}`
    );
    return response.data;
  }

  /**
   * Obtener tipos de movimiento disponibles
   */
  async getTiposMovimiento(): Promise<{
    success: boolean;
    data: {
      tipos: { key: string; value: string; label: string }[];
      origenes: { key: string; value: string; label: string }[];
    };
  }> {
    const response = await api.get(`${this.BASE_URL}/movimientos/tipos`);
    return response.data;
  }

  /**
   * Crear ajuste manual de stock
   */
  async crearAjuste(data: CreateAjusteDTO): Promise<SingleResponse<MovimientoStock>> {
    const response = await api.post<SingleResponse<MovimientoStock>>(
      `${this.BASE_URL}/ajuste`,
      data
    );
    return response.data;
  }

  /**
   * Anular un movimiento
   */
  async anularMovimiento(id: string, motivo: string): Promise<SingleResponse<MovimientoStock>> {
    const response = await api.post<SingleResponse<MovimientoStock>>(
      `${this.BASE_URL}/movimientos/${id}/anular`,
      { motivo }
    );
    return response.data;
  }

  /**
   * Obtener vista de stock actual
   */
  async getStockActual(params?: SearchStockParams): Promise<PaginatedResponse<StockProducto>> {
    const response = await api.get<PaginatedResponse<StockProducto>>(
      `${this.BASE_URL}/actual`,
      {
        params: {
          ...params,
          stockBajo: params?.stockBajo ? 'true' : undefined,
          sinStock: params?.sinStock ? 'true' : undefined,
          conStock: params?.conStock ? 'true' : undefined,
        },
      }
    );
    return response.data;
  }

  /**
   * Obtener resumen de stock de un producto
   */
  async getResumenProducto(productoId: string, varianteId?: string): Promise<SingleResponse<ResumenStockProducto>> {
    const response = await api.get<SingleResponse<ResumenStockProducto>>(
      `${this.BASE_URL}/producto/${productoId}`,
      { params: { varianteId } }
    );
    return response.data;
  }

  /**
   * Obtener historial de movimientos de un producto
   */
  async getHistorialProducto(
    productoId: string,
    params?: { almacenId?: string; varianteId?: string; page?: number; limit?: number }
  ): Promise<PaginatedResponse<MovimientoStock>> {
    const response = await api.get<PaginatedResponse<MovimientoStock>>(
      `${this.BASE_URL}/producto/${productoId}/historial`,
      { params }
    );
    return response.data;
  }

  /**
   * Obtener valoración de inventario
   */
  async getValoracion(almacenId?: string): Promise<SingleResponse<ValoracionInventario>> {
    const response = await api.get<SingleResponse<ValoracionInventario>>(
      `${this.BASE_URL}/valoracion`,
      { params: { almacenId } }
    );
    return response.data;
  }

  /**
   * Helper: Obtener etiqueta para tipo de movimiento
   */
  getTipoLabel(tipo: TipoMovimiento): string {
    const labels: Record<TipoMovimiento, string> = {
      [TipoMovimiento.ENTRADA_COMPRA]: 'Entrada por compra',
      [TipoMovimiento.SALIDA_VENTA]: 'Salida por venta',
      [TipoMovimiento.DEVOLUCION_CLIENTE]: 'Devolución de cliente',
      [TipoMovimiento.DEVOLUCION_PROVEEDOR]: 'Devolución a proveedor',
      [TipoMovimiento.AJUSTE_POSITIVO]: 'Ajuste positivo',
      [TipoMovimiento.AJUSTE_NEGATIVO]: 'Ajuste negativo',
      [TipoMovimiento.TRANSFERENCIA_ENTRADA]: 'Transferencia entrada',
      [TipoMovimiento.TRANSFERENCIA_SALIDA]: 'Transferencia salida',
      [TipoMovimiento.INVENTARIO_INICIAL]: 'Inventario inicial',
      [TipoMovimiento.REGULARIZACION]: 'Regularización',
      [TipoMovimiento.MERMA]: 'Merma',
      [TipoMovimiento.PRODUCCION_ENTRADA]: 'Producción entrada',
      [TipoMovimiento.PRODUCCION_SALIDA]: 'Producción salida',
    };
    return labels[tipo] || tipo;
  }

  /**
   * Helper: Determinar si es entrada o salida
   */
  esEntrada(tipo: TipoMovimiento): boolean {
    return [
      TipoMovimiento.ENTRADA_COMPRA,
      TipoMovimiento.DEVOLUCION_CLIENTE,
      TipoMovimiento.AJUSTE_POSITIVO,
      TipoMovimiento.TRANSFERENCIA_ENTRADA,
      TipoMovimiento.INVENTARIO_INICIAL,
      TipoMovimiento.PRODUCCION_ENTRADA,
    ].includes(tipo);
  }

  /**
   * Helper: Obtener color para tipo de movimiento
   */
  getTipoColor(tipo: TipoMovimiento): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (this.esEntrada(tipo)) {
      return 'default'; // Verde/positivo
    }
    if (tipo === TipoMovimiento.MERMA) {
      return 'destructive'; // Rojo
    }
    return 'secondary'; // Gris
  }
}

export const stockService = new StockService();
