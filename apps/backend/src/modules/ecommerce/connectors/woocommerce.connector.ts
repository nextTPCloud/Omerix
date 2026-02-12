import {
  IEcommerceConnector,
  EcommerceProduct,
  EcommerceCategory,
  EcommerceOrder,
  SyncResult,
} from './base.connector';

/**
 * Conector para la API REST de WooCommerce (v3)
 * Utiliza consumer key y consumer secret para autenticacion
 */
export class WooCommerceConnector implements IEcommerceConnector {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(url: string, consumerKey: string, consumerSecret: string) {
    this.baseUrl = url.replace(/\/$/, '');
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  private async request(endpoint: string, method = 'GET', body?: any): Promise<any> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.baseUrl}/wp-json/wc/v3/${endpoint}${separator}consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;

    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`WooCommerce API error ${response.status}: ${text.substring(0, 200)}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
    try {
      const data = await this.request('system_status');
      return {
        success: true,
        message: 'Conexion exitosa con WooCommerce',
        version: data?.environment?.version || 'desconocida',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexion: ${error.message}`,
      };
    }
  }

  async getProducts(page = 1, limit = 50): Promise<EcommerceProduct[]> {
    try {
      const data = await this.request(`products?page=${page}&per_page=${limit}`);
      return (data || []).map((p: any) => ({
        id: p.id,
        sku: p.sku || '',
        nombre: p.name || '',
        descripcion: p.short_description || '',
        precio: parseFloat(p.regular_price) || 0,
        precioOferta: p.sale_price ? parseFloat(p.sale_price) : undefined,
        stock: p.stock_quantity || 0,
        categorias: (p.categories || []).map((c: any) => String(c.id)),
        imagenes: (p.images || []).map((i: any) => i.src),
        activo: p.status === 'publish',
        peso: p.weight ? parseFloat(p.weight) : undefined,
      }));
    } catch (error: any) {
      console.error('Error obteniendo productos de WooCommerce:', error.message);
      return [];
    }
  }

  async pushProducts(products: EcommerceProduct[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, exitosos: 0, fallidos: 0, omitidos: 0, detalles: [] };

    for (const product of products) {
      try {
        const wcProduct: any = {
          name: product.nombre,
          sku: product.sku,
          regular_price: String(product.precio),
          description: product.descripcion || '',
          status: product.activo ? 'publish' : 'draft',
          manage_stock: true,
          stock_quantity: product.stock,
        };

        if (product.precioOferta) {
          wcProduct.sale_price = String(product.precioOferta);
        }

        if (product.id) {
          await this.request(`products/${product.id}`, 'PUT', wcProduct);
          result.exitosos++;
          result.detalles.push({ sku: product.sku, accion: 'actualizar', resultado: 'exito' });
        } else {
          await this.request('products', 'POST', wcProduct);
          result.exitosos++;
          result.detalles.push({ sku: product.sku, accion: 'crear', resultado: 'exito' });
        }
      } catch (error: any) {
        result.fallidos++;
        result.detalles.push({ sku: product.sku, accion: 'sync', resultado: 'error', mensaje: error.message });
      }
    }

    return result;
  }

  async getCategories(): Promise<EcommerceCategory[]> {
    try {
      const data = await this.request('products/categories?per_page=100');
      return (data || []).map((c: any) => ({
        id: c.id,
        nombre: c.name,
        parentId: c.parent !== 0 ? c.parent : undefined,
        descripcion: c.description,
      }));
    } catch {
      return [];
    }
  }

  async pushCategories(categories: EcommerceCategory[]): Promise<SyncResult> {
    const result: SyncResult = { total: categories.length, exitosos: 0, fallidos: 0, omitidos: 0, detalles: [] };

    for (const cat of categories) {
      try {
        if (cat.id) {
          await this.request(`products/categories/${cat.id}`, 'PUT', { name: cat.nombre, description: cat.descripcion });
        } else {
          await this.request('products/categories', 'POST', { name: cat.nombre, description: cat.descripcion });
        }
        result.exitosos++;
      } catch {
        result.fallidos++;
      }
    }

    return result;
  }

  async getStock(): Promise<Array<{ sku: string; stock: number }>> {
    try {
      const products = await this.getProducts(1, 100);
      return products.map(p => ({ sku: p.sku, stock: p.stock }));
    } catch {
      return [];
    }
  }

  async pushStock(stockData: Array<{ sku: string; stock: number }>): Promise<SyncResult> {
    const result: SyncResult = { total: stockData.length, exitosos: 0, fallidos: 0, omitidos: 0, detalles: [] };

    // WooCommerce: usar batch update para eficiencia
    try {
      const batchData = {
        update: stockData.map(item => ({
          sku: item.sku,
          stock_quantity: item.stock,
          manage_stock: true,
        })),
      };
      await this.request('products/batch', 'POST', batchData);
      result.exitosos = stockData.length;
    } catch (error: any) {
      result.fallidos = stockData.length;
      result.detalles.push({ accion: 'batch-stock', resultado: 'error', mensaje: error.message });
    }

    return result;
  }

  async getOrders(since?: Date): Promise<EcommerceOrder[]> {
    try {
      let endpoint = 'orders?per_page=50&orderby=date&order=desc';
      if (since) {
        endpoint += `&after=${since.toISOString()}`;
      }
      const data = await this.request(endpoint);
      return (data || []).map((o: any) => ({
        id: o.id,
        numero: String(o.number),
        fecha: new Date(o.date_created),
        estado: o.status,
        total: parseFloat(o.total) || 0,
        cliente: {
          nombre: `${o.billing?.first_name || ''} ${o.billing?.last_name || ''}`.trim(),
          email: o.billing?.email || '',
        },
        lineas: (o.line_items || []).map((l: any) => ({
          sku: l.sku || '',
          nombre: l.name,
          cantidad: l.quantity,
          precio: parseFloat(l.price) || 0,
        })),
      }));
    } catch {
      return [];
    }
  }
}
