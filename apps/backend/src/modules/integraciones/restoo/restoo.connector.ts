/**
 * Conector para la API REST de Restoo.me
 * Gestiona comunicación con la plataforma de reservas
 */

// Estructura de reserva en Restoo
export interface RestooReservation {
  id: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm
  guests: number;
  duration?: number;   // minutos
  status: string;      // confirmed, cancelled, no_show, completed, pending
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  notes?: string;
  specialRequests?: string;
  tableId?: string;
  zoneId?: string;
  source?: string;     // web, app, google, etc.
  createdAt?: string;
  updatedAt?: string;
}

// Zona/sala en Restoo
export interface RestooZone {
  id: string;
  name: string;
  capacity?: number;
  tables?: Array<{
    id: string;
    name: string;
    seats: number;
  }>;
}

// Resultado de test de conexión
export interface RestooTestResult {
  success: boolean;
  message: string;
  restaurantName?: string;
}

export class RestooConnector {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret?: string;
  private restaurantId: string;

  constructor(apiUrl: string, apiKey: string, restaurantId: string, apiSecret?: string) {
    this.baseUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.restaurantId = restaurantId;
  }

  /**
   * Realizar petición HTTP a la API de Restoo con reintentos en 429/5xx
   */
  private async request(endpoint: string, method = 'GET', body?: any, retries = 2): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
      'X-Restaurant-Id': this.restaurantId,
    };

    if (this.apiSecret) {
      headers['X-Api-Secret'] = this.apiSecret;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Reintentar en 429 (rate limit) o 5xx (error servidor)
      if ((response.status === 429 || response.status >= 500) && retries > 0) {
        const delay = response.status === 429 ? 2000 : 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(endpoint, method, body, retries - 1);
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Restoo API error ${response.status}: ${text.substring(0, 200)}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.message?.includes('Restoo API error')) throw error;
      throw new Error(`Error de conexion con Restoo: ${error.message}`);
    }
  }

  /**
   * Probar conexión con Restoo - GET /restaurant/info
   */
  async testConnection(): Promise<RestooTestResult> {
    try {
      const data = await this.request('restaurant/info');
      return {
        success: true,
        message: 'Conexion exitosa con Restoo.me',
        restaurantName: data?.name || data?.restaurantName || 'Conectado',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error de conexion: ${error.message}`,
      };
    }
  }

  /**
   * Obtener reservas desde Restoo - GET /reservations
   */
  async getReservations(since?: Date): Promise<RestooReservation[]> {
    try {
      let endpoint = 'reservations';
      if (since) {
        endpoint += `?since=${since.toISOString()}`;
      }
      const data = await this.request(endpoint);
      return data?.reservations || data?.data || [];
    } catch (error: any) {
      console.error('Error obteniendo reservas de Restoo:', error.message);
      return [];
    }
  }

  /**
   * Obtener una reserva por ID - GET /reservations/:id
   */
  async getReservationById(id: string): Promise<RestooReservation | null> {
    try {
      const data = await this.request(`reservations/${id}`);
      return data?.reservation || data || null;
    } catch {
      return null;
    }
  }

  /**
   * Actualizar estado de reserva - PATCH /reservations/:id
   */
  async updateReservationStatus(id: string, status: string): Promise<boolean> {
    try {
      await this.request(`reservations/${id}`, 'PATCH', { status });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Enviar disponibilidad de mesas - POST /availability
   */
  async pushTableAvailability(data: any): Promise<boolean> {
    try {
      await this.request('availability', 'POST', data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtener zonas/salones del restaurante en Restoo - GET /zones
   */
  async getZones(): Promise<RestooZone[]> {
    try {
      const data = await this.request('zones');
      return data?.zones || data?.data || [];
    } catch (error: any) {
      console.error('Error obteniendo zonas de Restoo:', error.message);
      return [];
    }
  }
}
