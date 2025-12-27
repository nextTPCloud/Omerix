// ===========================================
// SERVICIO API TPV
// ===========================================

const BACKEND_LOCAL_URL = 'http://localhost:3011';
const CLOUD_API_URL = process.env.NEXT_PUBLIC_CLOUD_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  useLocal?: boolean;
}

class TPVApi {
  private localUrl: string;
  private cloudUrl: string;

  constructor() {
    this.localUrl = BACKEND_LOCAL_URL;
    this.cloudUrl = CLOUD_API_URL;
  }

  private getBaseUrl(useLocal: boolean): string {
    return useLocal ? this.localUrl : this.cloudUrl;
  }

  async get<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const url = `${this.getBaseUrl(options.useLocal ?? true)}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any, options: ApiOptions = {}): Promise<T> {
    const url = `${this.getBaseUrl(options.useLocal ?? true)}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // ===========================================
  // VENTAS
  // ===========================================

  async crearVenta(venta: any): Promise<any> {
    return this.post('/ventas', venta);
  }

  async listarVentas(params?: { fecha?: string; page?: number }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.fecha) query.append('fecha', params.fecha);
    if (params?.page) query.append('page', String(params.page));
    return this.get(`/ventas?${query.toString()}`);
  }

  async obtenerVenta(id: string): Promise<any> {
    return this.get(`/ventas/${id}`);
  }

  async anularVenta(id: string, motivo: string): Promise<any> {
    return this.post(`/ventas/${id}/anular`, { motivo });
  }

  // ===========================================
  // CAJA
  // ===========================================

  async abrirCaja(data: { importeInicial: number }): Promise<any> {
    return this.post('/caja/abrir', data);
  }

  async cerrarCaja(data: { arqueoReal: any; observaciones?: string }): Promise<any> {
    return this.post('/caja/cerrar', data);
  }

  async obtenerEstadoCaja(): Promise<any> {
    return this.get('/caja');
  }

  async registrarMovimientoCaja(data: {
    tipo: 'entrada' | 'salida';
    importe: number;
    descripcion: string;
  }): Promise<any> {
    return this.post('/caja/movimiento', data);
  }

  // ===========================================
  // PRODUCTOS
  // ===========================================

  async buscarProductos(busqueda: string): Promise<any> {
    return this.get(`/productos?busqueda=${encodeURIComponent(busqueda)}`);
  }

  async buscarPorCodigo(codigo: string): Promise<any> {
    return this.get(`/productos/codigo/${encodeURIComponent(codigo)}`);
  }

  async obtenerStock(almacenId: string): Promise<any> {
    return this.get(`/productos/stock/${almacenId}`);
  }

  // ===========================================
  // PERIFÉRICOS
  // ===========================================

  async obtenerEstadoPerifericos(): Promise<any> {
    return this.get('/perifericos/status');
  }

  async imprimirTicket(ventaId: string): Promise<any> {
    return this.post('/perifericos/impresora/ticket', { ventaId });
  }

  async abrirCajon(): Promise<any> {
    return this.post('/perifericos/cajon/abrir', {});
  }

  async mostrarEnVisor(linea1: string, linea2: string): Promise<any> {
    return this.post('/perifericos/visor/mensaje', { linea1, linea2 });
  }

  async obtenerPesoBascula(): Promise<{ peso: number }> {
    return this.get('/perifericos/bascula/peso');
  }

  // ===========================================
  // SYNC
  // ===========================================

  async obtenerEstadoSync(): Promise<any> {
    return this.get('/sync/status');
  }

  async sincronizar(datos: any): Promise<any> {
    return this.post('/sync', datos, { useLocal: false });
  }

  // ===========================================
  // HEALTH
  // ===========================================

  async health(): Promise<{ status: string; mongodb: boolean; cloud: boolean }> {
    return this.get('/health');
  }
}

export const tpvApi = new TPVApi();
