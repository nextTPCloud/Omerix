// ===========================================
// SERVICIO API TPV
// ===========================================

const BACKEND_LOCAL_URL = 'http://localhost:3011';
const CLOUD_API_URL = process.env.NEXT_PUBLIC_CLOUD_API_URL || 'http://localhost:3001/api';

// Credenciales del TPV (se guardan tras activacion)
let tpvCredentials: { tpvId: string; tpvSecret: string; empresaId: string } | null = null;

interface ApiOptions {
  useLocal?: boolean;
}

class TPVApi {
  private localUrl: string;
  private cloudUrl: string;

  constructor() {
    this.localUrl = BACKEND_LOCAL_URL;
    this.cloudUrl = CLOUD_API_URL;
    // Cargar credenciales guardadas
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tpv_credentials');
      if (saved) {
        tpvCredentials = JSON.parse(saved);
      }
    }
  }

  // Guardar credenciales del TPV
  setCredentials(tpvId: string, tpvSecret: string, empresaId: string) {
    tpvCredentials = { tpvId, tpvSecret, empresaId };
    if (typeof window !== 'undefined') {
      localStorage.setItem('tpv_credentials', JSON.stringify(tpvCredentials));
    }
  }

  // Obtener credenciales
  getCredentials() {
    return tpvCredentials;
  }

  // Limpiar credenciales
  clearCredentials() {
    tpvCredentials = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tpv_credentials');
    }
  }

  // Verificar si el TPV esta activado
  isActivated(): boolean {
    return tpvCredentials !== null;
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

  // ===========================================
  // AUTENTICACION TPV (Cloud API)
  // ===========================================

  /**
   * Activa el TPV usando un token de activacion
   * almacenId es opcional - se puede configurar despues
   */
  async activarTPV(data: {
    token: string;
    nombre: string;
    almacenId?: string;
  }): Promise<{
    ok: boolean;
    tpvId: string;
    tpvSecret: string;
    empresaId: string;
    empresaNombre: string;
    serverUrl: string;
    config: any;
  }> {
    const response = await this.post<any>('/tpv/activar', data, { useLocal: false });

    if (response.ok) {
      // Guardar credenciales incluyendo empresaId
      this.setCredentials(response.tpvId, response.tpvSecret, response.empresaId);
    }

    return response;
  }

  /**
   * Login de usuario en TPV con PIN
   */
  async loginUsuario(pin: string): Promise<{
    ok: boolean;
    usuario: { id: string; nombre: string; permisos: any };
    sesionId: string;
  }> {
    if (!tpvCredentials) {
      throw new Error('TPV no activado');
    }

    return this.post('/tpv/login', {
      empresaId: tpvCredentials.empresaId,
      tpvId: tpvCredentials.tpvId,
      tpvSecret: tpvCredentials.tpvSecret,
      pin,
    }, { useLocal: false });
  }

  /**
   * Logout de usuario
   */
  async logoutUsuario(sesionId: string): Promise<{ ok: boolean }> {
    if (!tpvCredentials) {
      throw new Error('TPV no activado');
    }

    return this.post('/tpv/logout', {
      empresaId: tpvCredentials.empresaId,
      sesionId,
    }, { useLocal: false });
  }

  /**
   * Heartbeat para mantener sesion activa
   */
  async heartbeat(sesionId: string, cajaId?: string): Promise<{ ok: boolean }> {
    if (!tpvCredentials) {
      throw new Error('TPV no activado');
    }

    return this.post('/tpv/heartbeat', {
      empresaId: tpvCredentials.empresaId,
      tpvId: tpvCredentials.tpvId,
      sesionId,
      cajaId,
    }, { useLocal: false });
  }

  // ===========================================
  // SINCRONIZACION CON CLOUD
  // ===========================================

  /**
   * Descarga todos los datos necesarios del servidor
   */
  async descargarDatos(ultimaSync?: Date): Promise<{
    ok: boolean;
    datos: {
      productos: any[];
      familias: any[];
      clientes: any[];
      tiposImpuesto: any[];
      formasPago: any[];
      almacenes: any[];
      tarifas: any[];
      ofertas: any[];
      usuarios: any[];
      config: any;
      ultimaActualizacion: Date;
    };
  }> {
    if (!tpvCredentials) {
      throw new Error('TPV no activado');
    }

    return this.post('/tpv/sync/descargar', {
      empresaId: tpvCredentials.empresaId,
      tpvId: tpvCredentials.tpvId,
      tpvSecret: tpvCredentials.tpvSecret,
      ultimaSync: ultimaSync?.toISOString(),
    }, { useLocal: false });
  }

  /**
   * Sube ventas realizadas en modo offline
   */
  async subirVentasOffline(ventas: any[]): Promise<{
    ok: boolean;
    procesadas: number;
    errores: Array<{ idLocal: string; error: string }>;
    tickets: Array<{ idLocal: string; ticketId: string; numero: string }>;
  }> {
    if (!tpvCredentials) {
      throw new Error('TPV no activado');
    }

    return this.post('/tpv/sync/subir', {
      empresaId: tpvCredentials.empresaId,
      tpvId: tpvCredentials.tpvId,
      tpvSecret: tpvCredentials.tpvSecret,
      ventas,
    }, { useLocal: false });
  }

  /**
   * Obtiene stock actualizado del servidor
   */
  async obtenerStockCloud(productosIds?: string[]): Promise<{
    ok: boolean;
    stock: Array<{ productoId: string; stock: number }>;
  }> {
    if (!tpvCredentials) {
      throw new Error('TPV no activado');
    }

    return this.post('/tpv/sync/stock', {
      empresaId: tpvCredentials.empresaId,
      tpvId: tpvCredentials.tpvId,
      tpvSecret: tpvCredentials.tpvSecret,
      productosIds,
    }, { useLocal: false });
  }

  /**
   * Verifica conexion con el servidor cloud
   * El endpoint de health está en la raíz: /health
   */
  async verificarConexionCloud(): Promise<boolean> {
    try {
      // Extraer la URL base (sin /api) para el health check
      const baseUrl = this.cloudUrl.replace(/\/api\/?$/, '');
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const tpvApi = new TPVApi();
