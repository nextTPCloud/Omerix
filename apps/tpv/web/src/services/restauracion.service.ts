// ===========================================
// SERVICIO DE RESTAURACIÓN TPV
// ===========================================

import { tpvApi, getCloudApiUrl } from './api';

// Tipos
export interface Salon {
  _id: string;
  nombre: string;
  color?: string;
  capacidadTotal: number;
  activo: boolean;
  plano?: SalonPlano;
}

export interface Mesa {
  _id: string;
  numero: string;
  salonId: string;
  salonNombre?: string;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'reservada' | 'bloqueada' | 'cuenta_pedida' | 'por_limpiar';
  posicion?: { x: number; y: number };
  forma?: 'cuadrada' | 'redonda' | 'rectangular';
  rotacion?: number;
  tamano?: { ancho: number; alto: number };
  activa: boolean;
  ventaActualId?: string;
  camareroId?: string;
  reservaId?: string;
  // Info de estado extendida
  estadoInfo?: {
    horaOcupacion?: Date | string;
    numComensales?: number;
    clienteNombre?: string;
    importePendiente?: number;
    notasServicio?: string;
  };
  // Agrupación de mesas
  grupo?: {
    grupoId?: string;
    mesasPrincipales?: string[];
    esPrincipal?: boolean;
  };
}

export interface SalonPlano {
  ancho: number;
  alto: number;
  escala: number;
  imagenFondo?: string;
}

export interface Camarero {
  _id: string;
  nombre: string;
  alias?: string;
  color?: string;
  estado: 'activo' | 'en_descanso' | 'fuera_turno' | 'inactivo';
  salonesAsignados: string[];
}

export interface Sugerencia {
  _id: string;
  productoOrigenId: string;
  productoSugeridoId: string;
  productoSugeridoNombre: string;
  productoSugeridoPrecio: number;
  tipo: 'complementario' | 'upgrade' | 'alternativa' | 'acompanamiento' | 'postre' | 'bebida';
  mensaje?: string;
  prioridad: number;
}

export interface ComandaCocina {
  lineas: {
    productoId: string;
    nombre: string;
    cantidad: number;
    notas?: string;
    modificadores?: string[];
    alergenosNombres?: string[];
  }[];
  mesaId?: string;
  mesaNumero?: string;
  salonNombre?: string;
  camareroNombre?: string;
  camareroId?: string;
  notas?: string;
  urgente?: boolean;
}

class RestauracionService {
  // ===========================================
  // SALONES Y MESAS
  // ===========================================

  /**
   * Obtiene todos los salones activos
   */
  async getSalones(): Promise<{ ok: boolean; data: Salon[] }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/salones`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo salones:', error);
      return { ok: false, data: [] };
    }
  }

  /**
   * Obtiene las mesas de un salón o todas las mesas
   */
  async getMesas(salonId?: string): Promise<{ ok: boolean; data: Mesa[] }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/mesas`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
            salonId,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo mesas:', error);
      return { ok: false, data: [] };
    }
  }

  /**
   * Actualiza el estado de una mesa
   */
  async actualizarEstadoMesa(
    mesaId: string,
    estado: Mesa['estado'],
    datos?: { ventaActualId?: string; camareroId?: string }
  ): Promise<{ ok: boolean; data?: Mesa }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/mesas/${mesaId}/estado`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
            estado,
            ...datos,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error actualizando mesa:', error);
      return { ok: false };
    }
  }

  /**
   * Libera una mesa (al finalizar venta)
   */
  async liberarMesa(mesaId: string): Promise<{ ok: boolean }> {
    return this.actualizarEstadoMesa(mesaId, 'libre', {
      ventaActualId: undefined,
      camareroId: undefined,
    });
  }

  // ===========================================
  // CAMAREROS
  // ===========================================

  /**
   * Obtiene los camareros activos
   */
  async getCamareros(): Promise<{ ok: boolean; data: Camarero[] }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/camareros`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo camareros:', error);
      return { ok: false, data: [] };
    }
  }

  /**
   * Registra propina para un camarero
   */
  async registrarPropina(
    camareroId: string,
    importe: number,
    ventaId: string
  ): Promise<{ ok: boolean }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/camareros/${camareroId}/propina`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
            importe,
            ventaId,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error registrando propina:', error);
      return { ok: false };
    }
  }

  // ===========================================
  // SUGERENCIAS
  // ===========================================

  /**
   * Obtiene sugerencias para un producto
   */
  async getSugerenciasProducto(productoId: string): Promise<{ ok: boolean; data: Sugerencia[] }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/sugerencias/${productoId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      return { ok: false, data: [] };
    }
  }

  /**
   * Registra que una sugerencia fue aceptada
   */
  async aceptarSugerencia(sugerenciaId: string): Promise<{ ok: boolean }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/sugerencias/${sugerenciaId}/aceptar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error registrando aceptación:', error);
      return { ok: false };
    }
  }

  // ===========================================
  // COMANDAS DE COCINA
  // ===========================================

  /**
   * Envía una comanda a cocina
   */
  async enviarComandaCocina(comanda: ComandaCocina): Promise<{ ok: boolean; comandaId?: string; pdfBase64?: string }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/comandas`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
            comanda,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error enviando comanda:', error);
      return { ok: false };
    }
  }

  // ===========================================
  // COMANDAS POR MESA
  // ===========================================

  /**
   * Obtiene las comandas activas de una mesa
   */
  async getComandasMesa(mesaId: string): Promise<{ ok: boolean; data: any[] }> {
    const credentials = tpvApi.getCredentials();
    if (!credentials) throw new Error('TPV no activado');

    try {
      const response = await fetch(
        `${getCloudApiUrl()}/tpv/restauracion/mesas/${mesaId}/comandas`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresaId: credentials.empresaId,
            tpvId: credentials.tpvId,
            tpvSecret: credentials.tpvSecret,
          }),
        }
      );

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo comandas de mesa:', error);
      return { ok: false, data: [] };
    }
  }

  // ===========================================
  // HELPERS
  // ===========================================

  /**
   * Obtiene el color según el estado de la mesa
   */
  getEstadoMesaColor(estado: Mesa['estado']): string {
    const colores: Record<Mesa['estado'], string> = {
      libre: '#22c55e',
      ocupada: '#ef4444',
      reservada: '#f59e0b',
      bloqueada: '#6b7280',
    };
    return colores[estado] || '#6b7280';
  }

  /**
   * Obtiene el label del estado de la mesa
   */
  getEstadoMesaLabel(estado: Mesa['estado']): string {
    const labels: Record<Mesa['estado'], string> = {
      libre: 'Libre',
      ocupada: 'Ocupada',
      reservada: 'Reservada',
      bloqueada: 'Bloqueada',
    };
    return labels[estado] || estado;
  }
}

export const restauracionService = new RestauracionService();
