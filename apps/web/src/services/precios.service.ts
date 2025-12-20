import {api} from './api';

// ============================================
// INTERFACES
// ============================================

export interface IPrecioCalculado {
  precioBase: number;
  precioFinal: number;
  descuentoAplicado: number;
  origen: 'producto' | 'tarifa' | 'oferta' | 'precio_cantidad' | 'manual';
  detalleOrigen?: {
    tarifaId?: string;
    tarifaNombre?: string;
    ofertaId?: string;
    ofertaNombre?: string;
    ofertaTipo?: string;
  };
  unidadesGratis?: number;
  etiquetaOferta?: string;
}

export interface CalcularPrecioParams {
  productoId: string;
  varianteId?: string;
  clienteId?: string;
  cantidad?: number;
}

export interface CalcularPreciosMultiplesParams {
  productos: Array<{
    productoId: string;
    varianteId?: string;
    cantidad?: number;
  }>;
  clienteId?: string;
}

export interface PrecioCalculadoResponse {
  success: boolean;
  data: IPrecioCalculado;
}

export interface PreciosMultiplesResponse {
  success: boolean;
  data: Record<string, IPrecioCalculado>;
}

// ============================================
// SERVICIO DE PRECIOS
// ============================================

export const preciosService = {
  /**
   * Calcula el precio de un producto considerando tarifas, ofertas, etc.
   */
  calcularPrecio: async (params: CalcularPrecioParams): Promise<PrecioCalculadoResponse> => {
    const response = await api.post<PrecioCalculadoResponse>('/precios/calcular', {
      productoId: params.productoId,
      varianteId: params.varianteId,
      clienteId: params.clienteId,
      cantidad: params.cantidad || 1,
    });
    return response.data;
  },

  /**
   * Calcula precios de multiples productos en batch
   */
  calcularPreciosMultiples: async (params: CalcularPreciosMultiplesParams): Promise<PreciosMultiplesResponse> => {
    const response = await api.post<PreciosMultiplesResponse>('/precios/calcular-multiples', {
      productos: params.productos.map(p => ({
        productoId: p.productoId,
        varianteId: p.varianteId,
        cantidad: p.cantidad || 1,
      })),
      clienteId: params.clienteId,
    });
    return response.data;
  },
};

export default preciosService;
