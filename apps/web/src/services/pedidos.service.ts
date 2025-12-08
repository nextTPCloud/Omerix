import { api } from './api';
import {
  IPedido,
  CreatePedidoDTO,
  UpdatePedidoDTO,
  SearchPedidosParams,
  PedidoEstadisticas,
  AplicarMargenParams,
  ImportarLineasParams,
  CambiarEstadoPedidoParams,
  CrearDesdePresupuestoParams,
  EstadoPedido,
} from '@/types/pedido.types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const pedidosService = {
  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(params?: SearchPedidosParams): Promise<ApiResponse<IPedido[]>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await api.get<ApiResponse<IPedido[]>>(`/pedidos?${queryParams.toString()}`);
    return response.data;
  },

  async getById(id: string, ocultarCostes?: boolean): Promise<ApiResponse<IPedido>> {
    const params = ocultarCostes ? '?ocultarCostes=true' : '';
    const response = await api.get<ApiResponse<IPedido>>(`/pedidos/${id}${params}`);
    return response.data;
  },

  async create(data: CreatePedidoDTO): Promise<ApiResponse<IPedido>> {
    const response = await api.post<ApiResponse<IPedido>>('/pedidos', data);
    return response.data;
  },

  async update(id: string, data: UpdatePedidoDTO): Promise<ApiResponse<IPedido>> {
    const response = await api.put<ApiResponse<IPedido>>(`/pedidos/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/pedidos/${id}`);
    return response.data;
  },

  async deleteMany(ids: string[]): Promise<ApiResponse<{ eliminados: number }>> {
    const response = await api.post<ApiResponse<{ eliminados: number }>>('/pedidos/bulk-delete', { ids });
    return response.data;
  },

  // ============================================
  // CREAR DESDE PRESUPUESTO
  // ============================================

  async crearDesdePresupuesto(
    presupuestoId: string,
    opciones?: CrearDesdePresupuestoParams
  ): Promise<ApiResponse<IPedido>> {
    const response = await api.post<ApiResponse<IPedido>>(
      `/pedidos/desde-presupuesto/${presupuestoId}`,
      opciones || {}
    );
    return response.data;
  },

  // ============================================
  // ACCIONES DE ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    estado: EstadoPedido,
    observaciones?: string
  ): Promise<ApiResponse<IPedido>> {
    const response = await api.patch<ApiResponse<IPedido>>(`/pedidos/${id}/estado`, {
      estado,
      observaciones,
    });
    return response.data;
  },

  async confirmar(id: string, observaciones?: string): Promise<ApiResponse<IPedido>> {
    return this.cambiarEstado(id, EstadoPedido.CONFIRMADO, observaciones);
  },

  async ponerEnProceso(id: string, observaciones?: string): Promise<ApiResponse<IPedido>> {
    return this.cambiarEstado(id, EstadoPedido.EN_PROCESO, observaciones);
  },

  async marcarServido(id: string, observaciones?: string): Promise<ApiResponse<IPedido>> {
    return this.cambiarEstado(id, EstadoPedido.SERVIDO, observaciones);
  },

  async facturar(id: string, observaciones?: string): Promise<ApiResponse<IPedido>> {
    return this.cambiarEstado(id, EstadoPedido.FACTURADO, observaciones);
  },

  async cancelar(id: string, observaciones?: string): Promise<ApiResponse<IPedido>> {
    return this.cambiarEstado(id, EstadoPedido.CANCELADO, observaciones);
  },

  // ============================================
  // DUPLICAR
  // ============================================

  async duplicar(
    id: string,
    opciones?: {
      nuevoCliente?: string;
      mantenerPrecios?: boolean;
      mantenerCostes?: boolean;
      nuevaFecha?: string;
    }
  ): Promise<ApiResponse<IPedido>> {
    const response = await api.post<ApiResponse<IPedido>>(`/pedidos/${id}/duplicar`, opciones || {});
    return response.data;
  },

  // ============================================
  // OPERACIONES CON LÍNEAS
  // ============================================

  async aplicarMargen(id: string, params: AplicarMargenParams): Promise<ApiResponse<IPedido>> {
    const response = await api.post<ApiResponse<IPedido>>(`/pedidos/${id}/aplicar-margen`, params);
    return response.data;
  },

  async importarLineas(id: string, params: ImportarLineasParams): Promise<ApiResponse<IPedido>> {
    const response = await api.post<ApiResponse<IPedido>>(`/pedidos/${id}/importar-lineas`, params);
    return response.data;
  },

  // ============================================
  // TOGGLE COSTES
  // ============================================

  async toggleMostrarCostes(id: string, mostrarCostes: boolean): Promise<ApiResponse<{ mostrarCostes: boolean }>> {
    const response = await api.patch<ApiResponse<{ mostrarCostes: boolean }>>(`/pedidos/${id}/toggle-costes`, {
      mostrarCostes,
    });
    return response.data;
  },

  // ============================================
  // UTILIDADES
  // ============================================

  async sugerirCodigo(serie?: string): Promise<ApiResponse<{ codigo: string; serie: string; numero: number }>> {
    const params = serie ? `?serie=${serie}` : '';
    const response = await api.get<ApiResponse<{ codigo: string; serie: string; numero: number }>>(
      `/pedidos/sugerir-codigo${params}`
    );
    return response.data;
  },

  async getEstadisticas(): Promise<ApiResponse<PedidoEstadisticas>> {
    const response = await api.get<ApiResponse<PedidoEstadisticas>>('/pedidos/estadisticas');
    return response.data;
  },

  // ============================================
  // CONSULTAS POR RELACIÓN
  // ============================================

  async getByClienteId(clienteId: string): Promise<ApiResponse<IPedido[]>> {
    const response = await api.get<ApiResponse<IPedido[]>>(`/pedidos/cliente/${clienteId}`);
    return response.data;
  },

  async getByProyectoId(proyectoId: string): Promise<ApiResponse<IPedido[]>> {
    const response = await api.get<ApiResponse<IPedido[]>>(`/pedidos/proyecto/${proyectoId}`);
    return response.data;
  },

  // ============================================
  // ENVÍO POR EMAIL
  // ============================================

  async enviarPorEmail(
    id: string,
    opciones?: {
      asunto?: string;
      mensaje?: string;
      cc?: string[];
      bcc?: string[];
    }
  ): Promise<ApiResponse<{ messageId?: string }>> {
    const response = await api.post<ApiResponse<{ messageId?: string }>>(
      `/pedidos/${id}/enviar-email`,
      opciones || {}
    );
    return response.data;
  },

  // ============================================
  // WHATSAPP
  // ============================================

  async getWhatsAppURL(id: string): Promise<ApiResponse<{ url: string }>> {
    const response = await api.get<ApiResponse<{ url: string }>>(`/pedidos/${id}/whatsapp`);
    return response.data;
  },

  // ============================================
  // ACCIONES MASIVAS EMAIL/WHATSAPP
  // ============================================

  /**
   * Enviar varios pedidos por email
   */
  async enviarVariosPorEmail(
    ids: string[],
    opciones?: { asunto?: string; mensaje?: string }
  ): Promise<ApiResponse<{
    enviados: number;
    resultados: { id: string; codigo: string; success: boolean; error?: string }[];
  }>> {
    // Enviar cada pedido individualmente y recopilar resultados
    const resultados: { id: string; codigo: string; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        const pedido = await this.getById(id);
        const result = await this.enviarPorEmail(id, opciones);
        resultados.push({
          id,
          codigo: pedido.data?.codigo || '-',
          success: result.success,
          error: result.message
        });
      } catch (error: any) {
        resultados.push({
          id,
          codigo: '-',
          success: false,
          error: error.response?.data?.message || error.message
        });
      }
    }

    return {
      success: true,
      data: {
        enviados: resultados.filter(r => r.success).length,
        resultados
      }
    };
  },

  /**
   * Generar URLs de WhatsApp para varios pedidos
   */
  async generarURLsWhatsApp(ids: string[]): Promise<ApiResponse<{
    generados: number;
    resultados: { id: string; codigo: string; url?: string; success: boolean; error?: string }[];
  }>> {
    const resultados: { id: string; codigo: string; url?: string; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        const pedido = await this.getById(id);
        const result = await this.getWhatsAppURL(id);
        resultados.push({
          id,
          codigo: pedido.data?.codigo || '-',
          url: result.data?.url,
          success: result.success && !!result.data?.url,
          error: result.message
        });
      } catch (error: any) {
        resultados.push({
          id,
          codigo: '-',
          success: false,
          error: error.response?.data?.message || error.message
        });
      }
    }

    return {
      success: true,
      data: {
        generados: resultados.filter(r => r.success).length,
        resultados
      }
    };
  },

  // ============================================
  // NOTAS DE SEGUIMIENTO
  // ============================================

  async addNotaSeguimiento(
    id: string,
    nota: {
      tipo: 'llamada' | 'email' | 'reunion' | 'nota' | 'recordatorio';
      contenido: string;
      resultado?: string;
      proximaAccion?: string;
      fechaProximaAccion?: string;
    }
  ): Promise<ApiResponse<IPedido>> {
    const response = await api.post<ApiResponse<IPedido>>(
      `/pedidos/${id}/notas`,
      nota
    );
    return response.data;
  },

  async deleteNotaSeguimiento(id: string, notaId: string): Promise<ApiResponse<IPedido>> {
    const response = await api.delete<ApiResponse<IPedido>>(
      `/pedidos/${id}/notas/${notaId}`
    );
    return response.data;
  },

  // ============================================
  // ALERTAS
  // ============================================

  async getAlertas(diasAlerta?: number): Promise<ApiResponse<{
    pendientesConfirmar: Array<{
      _id: string;
      codigo: string;
      clienteNombre: string;
      fecha: string;
      prioridad: string;
      totales: { totalPedido: number };
    }>;
    entregasRetrasadas: Array<{
      _id: string;
      codigo: string;
      clienteNombre: string;
      fecha: string;
      fechaEntregaComprometida: string;
      estado: string;
      prioridad: string;
      totales: { totalPedido: number };
    }>;
    enProcesoLargoTiempo: Array<{
      _id: string;
      codigo: string;
      clienteNombre: string;
      fecha: string;
      fechaConfirmacion: string;
      prioridad: string;
      totales: { totalPedido: number };
    }>;
    pendientesFacturar: Array<{
      _id: string;
      codigo: string;
      clienteNombre: string;
      fecha: string;
      fechaEntregaReal: string;
      totales: { totalPedido: number };
    }>;
  }>> {
    const params = diasAlerta ? `?dias=${diasAlerta}` : '';
    const response = await api.get<ApiResponse<any>>(`/pedidos/alertas${params}`);
    return response.data;
  },

  async getResumenAlertas(diasAlerta?: number): Promise<ApiResponse<{
    pendientesConfirmar: number;
    entregasRetrasadas: number;
    enProcesoLargoTiempo: number;
    pendientesFacturar: number;
    total: number;
  }>> {
    const params = diasAlerta ? `?dias=${diasAlerta}` : '';
    const response = await api.get<ApiResponse<any>>(`/pedidos/alertas/resumen${params}`);
    return response.data;
  },

  // ============================================
  // KPIs DASHBOARD
  // ============================================

  async getKPIs(periodo?: { desde?: string; hasta?: string }): Promise<ApiResponse<{
    resumen: {
      total: number;
      confirmados: number;
      enProceso: number;
      servidos: number;
      facturados: number;
      cancelados: number;
      valorTotal: number;
      valorServidos: number;
      tasaCompletado: number;
      tiempoMedioEntrega: number;
    };
    porEstado: Array<{ estado: string; cantidad: number; valor: number }>;
    porPrioridad: Array<{ prioridad: string; cantidad: number; valor: number }>;
    evolucionMensual: Array<{
      mes: string;
      confirmados: number;
      servidos: number;
      facturados: number;
      valorConfirmados: number;
      valorServidos: number;
    }>;
    topClientes: Array<{
      clienteId: string;
      clienteNombre: string;
      cantidad: number;
      valorTotal: number;
      servidos: number;
    }>;
    topAgentes: Array<{
      agenteId: string;
      agenteNombre: string;
      cantidad: number;
      valorTotal: number;
      tasaCompletado: number;
    }>;
  }>> {
    const queryParams = new URLSearchParams();
    if (periodo?.desde) queryParams.append('desde', periodo.desde);
    if (periodo?.hasta) queryParams.append('hasta', periodo.hasta);
    const params = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get<ApiResponse<any>>(`/pedidos/kpis${params}`);
    return response.data;
  },
};

export default pedidosService;
