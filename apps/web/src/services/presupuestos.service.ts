import { api } from './api';
import {
  IPresupuesto,
  CreatePresupuestoDTO,
  UpdatePresupuestoDTO,
  SearchPresupuestosParams,
  PresupuestoEstadisticas,
  AplicarMargenParams,
  ImportarLineasParams,
} from '@/types/presupuesto.types';

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

export const presupuestosService = {
  // ============================================
  // CRUD BÁSICO
  // ============================================

  async getAll(params?: SearchPresupuestosParams): Promise<ApiResponse<IPresupuesto[]>> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await api.get<ApiResponse<IPresupuesto[]>>(`/presupuestos?${queryParams.toString()}`);
    return response.data;
  },

  async getById(id: string, ocultarCostes?: boolean): Promise<ApiResponse<IPresupuesto>> {
    const params = ocultarCostes ? '?ocultarCostes=true' : '';
    const response = await api.get<ApiResponse<IPresupuesto>>(`/presupuestos/${id}${params}`);
    return response.data;
  },

  async create(data: CreatePresupuestoDTO): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>('/presupuestos', data);
    return response.data;
  },

  async update(id: string, data: UpdatePresupuestoDTO): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.put<ApiResponse<IPresupuesto>>(`/presupuestos/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/presupuestos/${id}`);
    return response.data;
  },

  async deleteMany(ids: string[]): Promise<ApiResponse<{ eliminados: number }>> {
    const response = await api.post<ApiResponse<{ eliminados: number }>>('/presupuestos/bulk-delete', { ids });
    return response.data;
  },

  // ============================================
  // ACCIONES DE ESTADO
  // ============================================

  async cambiarEstado(
    id: string,
    estado: string,
    observaciones?: string,
    fechaRespuesta?: string
  ): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.patch<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/estado`, {
      estado,
      observaciones,
      fechaRespuesta,
    });
    return response.data;
  },

  async enviar(id: string): Promise<ApiResponse<IPresupuesto>> {
    return this.cambiarEstado(id, 'enviado');
  },

  async aceptar(id: string, observaciones?: string): Promise<ApiResponse<IPresupuesto>> {
    return this.cambiarEstado(id, 'aceptado', observaciones);
  },

  async rechazar(id: string, observaciones?: string): Promise<ApiResponse<IPresupuesto>> {
    return this.cambiarEstado(id, 'rechazado', observaciones);
  },

  // ============================================
  // DUPLICAR Y REVISIONES
  // ============================================

  async duplicar(
    id: string,
    opciones?: {
      nuevoCliente?: string;
      mantenerPrecios?: boolean;
      mantenerCostes?: boolean;
      nuevaFecha?: string;
    }
  ): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/duplicar`, opciones || {});
    return response.data;
  },

  async crearRevision(id: string): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/revision`);
    return response.data;
  },

  // ============================================
  // OPERACIONES CON LÍNEAS
  // ============================================

  async aplicarMargen(id: string, params: AplicarMargenParams): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/aplicar-margen`, params);
    return response.data;
  },

  async importarLineas(id: string, params: ImportarLineasParams): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(`/presupuestos/${id}/importar-lineas`, params);
    return response.data;
  },

  // ============================================
  // TOGGLE COSTES
  // ============================================

  async toggleMostrarCostes(id: string, mostrarCostes: boolean): Promise<ApiResponse<{ mostrarCostes: boolean }>> {
    const response = await api.patch<ApiResponse<{ mostrarCostes: boolean }>>(`/presupuestos/${id}/toggle-costes`, {
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
      `/presupuestos/sugerir-codigo${params}`
    );
    return response.data;
  },

  async getEstadisticas(): Promise<ApiResponse<PresupuestoEstadisticas>> {
    const response = await api.get<ApiResponse<PresupuestoEstadisticas>>('/presupuestos/estadisticas');
    return response.data;
  },

  // ============================================
  // CONSULTAS POR RELACIÓN
  // ============================================

  async getByClienteId(clienteId: string): Promise<ApiResponse<IPresupuesto[]>> {
    const response = await api.get<ApiResponse<IPresupuesto[]>>(`/presupuestos/cliente/${clienteId}`);
    return response.data;
  },

  async getByProyectoId(proyectoId: string): Promise<ApiResponse<IPresupuesto[]>> {
    const response = await api.get<ApiResponse<IPresupuesto[]>>(`/presupuestos/proyecto/${proyectoId}`);
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
      pdfOptions?: {
        mostrarDescripcion?: 'ninguna' | 'corta' | 'larga';
        mostrarReferencias?: boolean;
        mostrarCondiciones?: boolean;
        mostrarFirmas?: boolean;
        mostrarCuentaBancaria?: boolean;
        mostrarLOPD?: boolean;
        mostrarRegistroMercantil?: boolean;
      };
    }
  ): Promise<ApiResponse<{ messageId?: string }>> {
    const response = await api.post<ApiResponse<{ messageId?: string }>>(
      `/presupuestos/${id}/enviar-email`,
      opciones || {}
    );
    return response.data;
  },

  async enviarMasivoPorEmail(
    ids: string[],
    opciones?: {
      asunto?: string;
      mensaje?: string;
      pdfOptions?: {
        mostrarDescripcion?: 'ninguna' | 'corta' | 'larga';
        mostrarReferencias?: boolean;
        mostrarCondiciones?: boolean;
        mostrarFirmas?: boolean;
        mostrarCuentaBancaria?: boolean;
        mostrarLOPD?: boolean;
        mostrarRegistroMercantil?: boolean;
      };
    }
  ): Promise<ApiResponse<{
    total: number;
    enviados: number;
    fallidos: number;
    resultados: Array<{ id: string; codigo: string; success: boolean; message: string }>;
  }>> {
    const response = await api.post<ApiResponse<{
      total: number;
      enviados: number;
      fallidos: number;
      resultados: Array<{ id: string; codigo: string; success: boolean; message: string }>;
    }>>('/presupuestos/enviar-masivo', { ids, ...opciones });
    return response.data;
  },

  // ============================================
  // WHATSAPP
  // ============================================

  async getWhatsAppURL(id: string): Promise<ApiResponse<{ url: string }>> {
    const response = await api.get<ApiResponse<{ url: string }>>(`/presupuestos/${id}/whatsapp`);
    return response.data;
  },

  async getWhatsAppURLsMasivo(ids: string[]): Promise<ApiResponse<
    Array<{ id: string; codigo: string; url?: string; telefono?: string; clienteNombre?: string; error?: string }>
  >> {
    const response = await api.post<ApiResponse<
      Array<{ id: string; codigo: string; url?: string; telefono?: string; clienteNombre?: string; error?: string }>
    >>('/presupuestos/whatsapp-masivo', { ids });
    return response.data;
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
  ): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.post<ApiResponse<IPresupuesto>>(
      `/presupuestos/${id}/notas`,
      nota
    );
    return response.data;
  },

  async deleteNotaSeguimiento(id: string, notaId: string): Promise<ApiResponse<IPresupuesto>> {
    const response = await api.delete<ApiResponse<IPresupuesto>>(
      `/presupuestos/${id}/notas/${notaId}`
    );
    return response.data;
  },

  // ============================================
  // ALERTAS DE VALIDEZ
  // ============================================

  async getAlertasValidez(diasAlerta?: number): Promise<ApiResponse<{
    proximosAExpirar: Array<{
      _id: string;
      codigo: string;
      clienteNombre: string;
      fechaValidez: string;
      estado: string;
      totales: { totalPresupuesto: number };
      fechaEnvio?: string;
    }>;
    expirados: Array<{
      _id: string;
      codigo: string;
      clienteNombre: string;
      fechaValidez: string;
      estado: string;
      totales: { totalPresupuesto: number };
      fechaEnvio?: string;
    }>;
    sinRespuesta: Array<{
      _id: string;
      codigo: string;
      clienteNombre: string;
      fechaValidez: string;
      estado: string;
      totales: { totalPresupuesto: number };
      fechaEnvio?: string;
      contadorEnvios?: number;
    }>;
  }>> {
    const params = diasAlerta ? `?dias=${diasAlerta}` : '';
    const response = await api.get<ApiResponse<any>>(`/presupuestos/alertas${params}`);
    return response.data;
  },

  async getResumenAlertas(diasAlerta?: number): Promise<ApiResponse<{
    proximosAExpirar: number;
    expirados: number;
    sinRespuesta: number;
    total: number;
  }>> {
    const params = diasAlerta ? `?dias=${diasAlerta}` : '';
    const response = await api.get<ApiResponse<any>>(`/presupuestos/alertas/resumen${params}`);
    return response.data;
  },

  // ============================================
  // KPIs DASHBOARD
  // ============================================

  async getKPIs(periodo?: { desde?: string; hasta?: string }): Promise<ApiResponse<{
    resumen: {
      total: number;
      aceptados: number;
      rechazados: number;
      pendientes: number;
      borradores: number;
      enviados: number;
      valorTotal: number;
      valorAceptados: number;
      tasaConversion: number;
      tiempoMedioRespuesta: number;
    };
    porEstado: Array<{ estado: string; cantidad: number; valor: number }>;
    evolucionMensual: Array<{
      mes: string;
      creados: number;
      aceptados: number;
      rechazados: number;
      valorCreados: number;
      valorAceptados: number;
    }>;
    topClientes: Array<{
      clienteId: string;
      clienteNombre: string;
      cantidad: number;
      valorTotal: number;
      aceptados: number;
    }>;
    topAgentes: Array<{
      agenteId: string;
      agenteNombre: string;
      cantidad: number;
      valorTotal: number;
      tasaConversion: number;
    }>;
  }>> {
    const queryParams = new URLSearchParams();
    if (periodo?.desde) queryParams.append('desde', periodo.desde);
    if (periodo?.hasta) queryParams.append('hasta', periodo.hasta);
    const params = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get<ApiResponse<any>>(`/presupuestos/kpis${params}`);
    return response.data;
  },

  // ============================================
  // RECORDATORIOS AUTOMÁTICOS
  // ============================================

  async getRecordatoriosPendientes(): Promise<ApiResponse<{
    proximosExpirar: number;
    sinRespuesta: number;
    totalPendientes: number;
  }>> {
    const response = await api.get<ApiResponse<any>>('/presupuestos/recordatorios/pendientes');
    return response.data;
  },

  async ejecutarRecordatorios(opciones?: {
    enviarExpiracion?: boolean;
    enviarSeguimiento?: boolean;
    notificarAgentes?: boolean;
  }): Promise<ApiResponse<{
    expiracion: Array<{ presupuestoId: string; codigo: string; success: boolean; message: string }>;
    seguimiento: Array<{ presupuestoId: string; codigo: string; success: boolean; message: string }>;
    agentes: Array<{ presupuestoId: string; codigo: string; success: boolean; message: string }>;
    resumen: {
      total: number;
      enviados: number;
      fallidos: number;
    };
  }>> {
    const response = await api.post<ApiResponse<any>>('/presupuestos/recordatorios/ejecutar', opciones || {});
    return response.data;
  },

  async getHistorialRecordatorios(id: string): Promise<ApiResponse<Array<{
    _id: string;
    fecha: string;
    tipo: 'expiracion' | 'seguimiento' | 'sin_respuesta';
    destinatario: string;
    enviado: boolean;
    error?: string;
    messageId?: string;
  }>>> {
    const response = await api.get<ApiResponse<any>>(`/presupuestos/${id}/recordatorios`);
    return response.data;
  },

  async enviarRecordatorioManual(
    id: string,
    tipo: 'expiracion' | 'seguimiento'
  ): Promise<ApiResponse<{
    presupuestoId: string;
    codigo: string;
    tipo: string;
    destinatario: string;
    success: boolean;
    message: string;
  }>> {
    const response = await api.post<ApiResponse<any>>(`/presupuestos/${id}/recordatorios/enviar`, { tipo });
    return response.data;
  },

  async actualizarConfigRecordatorios(
    id: string,
    config: {
      activo?: boolean;
      diasAntesExpiracion?: number;
      enviarAlCliente?: boolean;
      enviarAlAgente?: boolean;
      maxRecordatorios?: number;
    }
  ): Promise<ApiResponse<{
    activo: boolean;
    diasAntesExpiracion: number;
    enviarAlCliente: boolean;
    enviarAlAgente: boolean;
    maxRecordatorios: number;
  }>> {
    const response = await api.patch<ApiResponse<any>>(`/presupuestos/${id}/recordatorios/config`, config);
    return response.data;
  },

  // ============================================
  // PORTAL DE CLIENTE
  // ============================================

  async generarEnlacePortal(id: string): Promise<ApiResponse<{ token: string; url: string }>> {
    const response = await api.post<ApiResponse<{ token: string; url: string }>>(`/presupuestos/${id}/portal/generar`);
    return response.data;
  },

  async regenerarTokenPortal(id: string): Promise<ApiResponse<{ token: string; url: string }>> {
    const response = await api.post<ApiResponse<{ token: string; url: string }>>(`/presupuestos/${id}/portal/regenerar`);
    return response.data;
  },

  async invalidarTokenPortal(id: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(`/presupuestos/${id}/portal/invalidar`);
    return response.data;
  },
};

export default presupuestosService;
