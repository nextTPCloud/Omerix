// Interfaces base para conectores de plataformas e-commerce

export interface EcommerceProduct {
  id?: string | number;
  sku: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precioOferta?: number;
  stock: number;
  categorias?: string[];
  imagenes?: string[];
  activo: boolean;
  peso?: number;
  atributos?: Record<string, string>;
}

export interface EcommerceCategory {
  id?: string | number;
  nombre: string;
  parentId?: string | number;
  descripcion?: string;
}

export interface EcommerceOrder {
  id: string | number;
  numero: string;
  fecha: Date;
  estado: string;
  total: number;
  cliente: {
    nombre: string;
    email: string;
  };
  lineas: Array<{
    sku: string;
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
}

export interface SyncResult {
  total: number;
  exitosos: number;
  fallidos: number;
  omitidos: number;
  detalles: Array<{
    productoId?: string;
    sku?: string;
    accion: string;
    resultado: 'exito' | 'error' | 'omitido';
    mensaje?: string;
  }>;
}

export interface IEcommerceConnector {
  testConnection(): Promise<{ success: boolean; message: string; version?: string }>;
  getProducts(page?: number, limit?: number): Promise<EcommerceProduct[]>;
  pushProducts(products: EcommerceProduct[]): Promise<SyncResult>;
  getCategories(): Promise<EcommerceCategory[]>;
  pushCategories(categories: EcommerceCategory[]): Promise<SyncResult>;
  getStock(): Promise<Array<{ sku: string; stock: number }>>;
  pushStock(stockData: Array<{ sku: string; stock: number }>): Promise<SyncResult>;
  getOrders(since?: Date): Promise<EcommerceOrder[]>;
}

/**
 * Factory para obtener el conector adecuado segun la plataforma
 */
export function getConnector(
  plataforma: string,
  url: string,
  apiKey: string,
  apiSecret?: string
): IEcommerceConnector {
  switch (plataforma) {
    case 'prestashop': {
      // Importacion dinamica para evitar cargar connectors innecesarios
      const { PrestashopConnector } = require('./prestashop.connector');
      return new PrestashopConnector(url, apiKey);
    }
    case 'woocommerce': {
      const { WooCommerceConnector } = require('./woocommerce.connector');
      return new WooCommerceConnector(url, apiKey, apiSecret || '');
    }
    default:
      throw new Error(`Plataforma no soportada: ${plataforma}`);
  }
}
