import {
  IEcommerceConnector,
  EcommerceProduct,
  EcommerceCategory,
  EcommerceOrder,
  SyncResult,
} from './base.connector';

/**
 * Conector para la API REST de PrestaShop
 * Utiliza autenticacion Basic con la API Key como usuario
 */
export class PrestashopConnector implements IEcommerceConnector {
  private baseUrl: string;
  private apiKey: string;

  constructor(url: string, apiKey: string) {
    this.baseUrl = url.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, method = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}/api/${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': 'Basic ' + Buffer.from(`${this.apiKey}:`).toString('base64'),
      'Output-Format': 'JSON',
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PrestaShop API error ${response.status}: ${text.substring(0, 200)}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
    try {
      const data = await this.request('');
      return {
        success: true,
        message: 'Conexion exitosa con PrestaShop',
        version: data?.api?.version || 'desconocida',
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
      const offset = (page - 1) * limit;
      const data = await this.request(
        `products?display=[id,reference,name,description_short,price,active,quantity]&limit=${offset},${limit}`
      );

      const products = data?.products || [];
      return products.map((p: any) => ({
        id: p.id,
        sku: p.reference || '',
        nombre: typeof p.name === 'object' ? p.name[1]?.value || p.name[0]?.value || '' : p.name || '',
        descripcion: typeof p.description_short === 'object' ? p.description_short[1]?.value || '' : p.description_short || '',
        precio: parseFloat(p.price) || 0,
        stock: parseInt(p.quantity) || 0,
        activo: p.active === '1',
      }));
    } catch (error: any) {
      console.error('Error obteniendo productos de PrestaShop:', error.message);
      return [];
    }
  }

  async pushProducts(products: EcommerceProduct[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, exitosos: 0, fallidos: 0, omitidos: 0, detalles: [] };

    for (const product of products) {
      try {
        if (product.id) {
          // Actualizar existente
          await this.request(`products/${product.id}`, 'PUT', {
            product: {
              price: String(product.precio),
              active: product.activo ? '1' : '0',
              name: [{ id: '1', value: product.nombre }],
            },
          });
          result.exitosos++;
          result.detalles.push({ sku: product.sku, accion: 'actualizar', resultado: 'exito' });
        } else {
          // Crear nuevo
          await this.request('products', 'POST', {
            product: {
              reference: product.sku,
              price: String(product.precio),
              active: product.activo ? '1' : '0',
              name: [{ id: '1', value: product.nombre }],
            },
          });
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
      const data = await this.request('categories?display=[id,name,id_parent]');
      const categories = data?.categories || [];
      return categories.map((c: any) => ({
        id: c.id,
        nombre: typeof c.name === 'object' ? c.name[1]?.value || c.name[0]?.value || '' : c.name || '',
        parentId: c.id_parent !== '0' ? c.id_parent : undefined,
      }));
    } catch {
      return [];
    }
  }

  async pushCategories(categories: EcommerceCategory[]): Promise<SyncResult> {
    const result: SyncResult = { total: categories.length, exitosos: 0, fallidos: 0, omitidos: 0, detalles: [] };
    // Implementacion simplificada - pendiente de completar
    result.omitidos = categories.length;
    return result;
  }

  async getStock(): Promise<Array<{ sku: string; stock: number }>> {
    try {
      const data = await this.request('stock_availables?display=[id_product,quantity]&filter[id_product_attribute]=[0]');
      const stocks = data?.stock_availables || [];
      return stocks.map((s: any) => ({
        sku: String(s.id_product),
        stock: parseInt(s.quantity) || 0,
      }));
    } catch {
      return [];
    }
  }

  async pushStock(stockData: Array<{ sku: string; stock: number }>): Promise<SyncResult> {
    const result: SyncResult = { total: stockData.length, exitosos: 0, fallidos: 0, omitidos: 0, detalles: [] };

    for (const item of stockData) {
      try {
        await this.request(`stock_availables/${item.sku}`, 'PUT', {
          stock_available: { quantity: item.stock },
        });
        result.exitosos++;
        result.detalles.push({ sku: item.sku, accion: 'stock', resultado: 'exito' });
      } catch (error: any) {
        result.fallidos++;
        result.detalles.push({ sku: item.sku, accion: 'stock', resultado: 'error', mensaje: error.message });
      }
    }

    return result;
  }

  async getOrders(since?: Date): Promise<EcommerceOrder[]> {
    try {
      let endpoint = 'orders?display=[id,reference,date_add,current_state,total_paid,associations]';
      if (since) {
        endpoint += `&filter[date_add]=[${since.toISOString().split('T')[0]},9999-12-31]`;
      }
      const data = await this.request(endpoint);
      return (data?.orders || []).map((o: any) => ({
        id: o.id,
        numero: o.reference,
        fecha: new Date(o.date_add),
        estado: o.current_state,
        total: parseFloat(o.total_paid) || 0,
        cliente: { nombre: '', email: '' },
        lineas: [],
      }));
    } catch {
      return [];
    }
  }
}
