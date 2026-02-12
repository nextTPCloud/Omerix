// ===========================================
// SERVICIO SSE PARA TPV
// Cliente de Server-Sent Events con reconexion automatica
// ===========================================

// Tipo para los callbacks de eventos
type SSECallback = (data: any) => void;

class TPVSSEService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<SSECallback>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  // Tracking de eventos registrados en el EventSource para evitar duplicados
  private registeredEvents: Set<string> = new Set();

  // URL y parametros para reconexion
  private baseUrl: string = '';
  private empresaId: string = '';
  private tpvId: string = '';

  /**
   * Conecta al servidor SSE para recibir eventos en tiempo real
   * @param baseUrl - URL base del servidor (ej: http://localhost:3001/api)
   * @param empresaId - ID de la empresa
   * @param tpvId - ID del TPV registrado
   */
  connect(baseUrl: string, empresaId: string, tpvId: string): void {
    // Guardar parametros para reconexion
    this.baseUrl = baseUrl;
    this.empresaId = empresaId;
    this.tpvId = tpvId;

    // Cerrar conexion previa si existe
    this.disconnect();

    const url = `${baseUrl}/tpv/events/${empresaId}/${tpvId}`;
    console.log('[SSE] Conectando a:', url);

    try {
      this.eventSource = new EventSource(url);
      // Limpiar tracking de eventos registrados (nuevo EventSource)
      this.registeredEvents.clear();

      // Conexion establecida: reiniciar delay de reconexion
      this.eventSource.onopen = () => {
        console.log('[SSE] Conexión establecida');
        this.reconnectDelay = 1000;
      };

      // Error de conexion: intentar reconectar con backoff exponencial
      this.eventSource.onerror = () => {
        console.warn('[SSE] Error de conexión, reconectando...');
        this.eventSource?.close();
        this.eventSource = null;
        this.registeredEvents.clear();
        this.scheduleReconnect();
      };

      // Mensaje generico (evento sin tipo especifico)
      this.eventSource.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.dispatch('message', data);
        } catch {
          // Si no es JSON valido, despachar el dato crudo
          this.dispatch('message', event.data);
        }
      };

      // Registrar listeners existentes en el nuevo EventSource
      this.reattachListeners();
    } catch {
      // Si falla la creacion del EventSource, intentar reconectar
      this.scheduleReconnect();
    }
  }

  /**
   * Desconecta del servidor SSE y limpia recursos
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.registeredEvents.clear();
  }

  /**
   * Registra un listener para un tipo de evento SSE
   * @param event - Nombre del evento (ej: 'productos-actualizados', 'config-cambio')
   * @param callback - Funcion a ejecutar cuando se reciba el evento
   * @returns Funcion para desuscribirse
   */
  on(event: string, callback: SSECallback): () => void {
    // Agregar al mapa de listeners
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Registrar addEventListener en el EventSource actual (solo si no esta registrado ya)
    if (this.eventSource && !this.registeredEvents.has(event)) {
      this.registerEventOnSource(event);
    }

    // Devolver funcion de desuscripcion
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Elimina un listener especifico para un tipo de evento
   * @param event - Nombre del evento
   * @param callback - Funcion registrada previamente
   */
  off(event: string, callback: SSECallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Verifica si la conexion SSE esta activa
   * @returns true si el EventSource esta conectado (readyState OPEN)
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // -------------------------------------------
  // Metodos privados
  // -------------------------------------------

  /**
   * Programa una reconexion con backoff exponencial
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      // Incrementar delay con backoff exponencial
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      // Intentar reconectar
      this.connect(this.baseUrl, this.empresaId, this.tpvId);
    }, this.reconnectDelay);
  }

  /**
   * Despacha datos a todos los listeners registrados para un evento
   */
  private dispatch(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SSE] Error en listener de "${event}":`, error);
        }
      });
    }
  }

  /**
   * Registra un unico addEventListener en el EventSource para un evento.
   * Usa registeredEvents para evitar duplicados.
   */
  private registerEventOnSource(event: string): void {
    if (!this.eventSource || this.registeredEvents.has(event)) return;

    this.registeredEvents.add(event);
    this.eventSource.addEventListener(event, ((e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        this.dispatch(event, data);
      } catch {
        this.dispatch(event, e.data);
      }
    }) as EventListener);
  }

  /**
   * Re-registra todos los listeners en un nuevo EventSource
   * Se usa tras una reconexion
   */
  private reattachListeners(): void {
    if (!this.eventSource) return;

    for (const event of Array.from(this.listeners.keys())) {
      this.registerEventOnSource(event);
    }
  }
}

// Singleton para uso global en la aplicacion TPV
export const tpvSSE = new TPVSSEService();
