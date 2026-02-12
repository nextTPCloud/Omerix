import { Response } from 'express';
import crypto from 'crypto';

/**
 * Interfaz para representar una conexión SSE activa
 */
interface SSEConnection {
  id: string;
  channel: string;
  res: Response;
}

/**
 * Servicio singleton para gestionar conexiones SSE (Server-Sent Events).
 * Permite enviar eventos en tiempo real a clientes conectados, organizados por canales.
 */
class SSEManagerService {
  // Mapa de canal -> conjunto de conexiones
  private channels: Map<string, Map<string, SSEConnection>> = new Map();

  // Intervalo de heartbeat para mantener conexiones vivas
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Registra una nueva conexión SSE en un canal.
   * Configura las cabeceras SSE y envía un keepalive inicial.
   * @param channel - Canal al que se suscribe la conexión
   * @param res - Objeto Response de Express
   * @returns ID único de la conexión
   */
  addConnection(channel: string, res: Response): string {
    const id = crypto.randomUUID();

    // Configurar cabeceras SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Enviar keepalive inicial
    res.write(':keepalive\n\n');

    const connection: SSEConnection = { id, channel, res };

    // Agregar al canal correspondiente
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Map());
    }
    this.channels.get(channel)!.set(id, connection);

    // Limpiar conexión cuando el cliente se desconecte
    res.on('close', () => {
      this.removeConnection(id);
    });

    return id;
  }

  /**
   * Elimina una conexión por su ID de todos los canales.
   * @param id - ID de la conexión a eliminar
   */
  removeConnection(id: string): void {
    for (const [channel, connections] of this.channels.entries()) {
      if (connections.has(id)) {
        connections.delete(id);
        // Limpiar canal vacío
        if (connections.size === 0) {
          this.channels.delete(channel);
        }
        break;
      }
    }
  }

  /**
   * Envía un evento a todas las conexiones de un canal.
   * @param channel - Canal destino
   * @param event - Nombre del evento
   * @param data - Datos a enviar (se serializa a JSON)
   */
  broadcast(channel: string, event: string, data: any): void {
    const connections = this.channels.get(channel);
    if (!connections) return;

    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const [id, connection] of connections.entries()) {
      try {
        connection.res.write(message);
      } catch {
        // Si falla el envío, eliminar la conexión rota
        this.removeConnection(id);
      }
    }
  }

  /**
   * Envía un evento a todas las conexiones TPV de una empresa.
   * Canal: tpv:{empresaId}
   * @param empresaId - ID de la empresa
   * @param event - Nombre del evento
   * @param data - Datos a enviar
   */
  broadcastToEmpresa(empresaId: string, event: string, data: any): void {
    this.broadcast(`tpv:${empresaId}`, event, data);
  }

  /**
   * Envía un evento a todas las conexiones KDS de una zona de preparación.
   * Canal: kds:{empresaId}:{zonaPreparacionId}
   * @param empresaId - ID de la empresa
   * @param zonaPreparacionId - ID de la zona de preparación
   * @param event - Nombre del evento
   * @param data - Datos a enviar
   */
  broadcastToKDS(empresaId: string, zonaPreparacionId: string, event: string, data: any): void {
    this.broadcast(`kds:${empresaId}:${zonaPreparacionId}`, event, data);
  }

  /**
   * Inicia el intervalo de heartbeat que envía keepalive cada 30 segundos
   * a todas las conexiones activas para evitar timeouts.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [, connections] of this.channels.entries()) {
        for (const [id, connection] of connections.entries()) {
          try {
            connection.res.write(':keepalive\n\n');
          } catch {
            // Conexión rota, eliminar
            this.removeConnection(id);
          }
        }
      }
    }, 30_000);

    // No bloquear el cierre del proceso
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  /**
   * Detiene el heartbeat y cierra todas las conexiones.
   * Útil para limpieza en tests o shutdown.
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.channels.clear();
  }
}

/** Instancia singleton del servicio SSE */
export const sseManager = new SSEManagerService();
