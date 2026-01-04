// apps/web/src/services/recordatorios.service.ts

import { api } from './api';

// ============================================
// TIPOS
// ============================================

export enum TipoRecordatorio {
  ACTIVIDAD_CRM = 'actividad_crm',
  SEGUIMIENTO_LEAD = 'seguimiento_lead',
  OPORTUNIDAD_CIERRE = 'oportunidad_cierre',
  PRESUPUESTO_EXPIRACION = 'presupuesto_expiracion',
  PRESUPUESTO_SEGUIMIENTO = 'presupuesto_seguimiento',
  FACTURA_VENCIMIENTO = 'factura_vencimiento',
  COBRO_PENDIENTE = 'cobro_pendiente',
  PARTE_TRABAJO = 'parte_trabajo',
  TAREA_PROYECTO = 'tarea_proyecto',
  CITA = 'cita',
  REUNION = 'reunion',
  LLAMADA = 'llamada',
  PERSONALIZADO = 'personalizado',
}

export enum PrioridadRecordatorio {
  BAJA = 'baja',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum EstadoRecordatorio {
  PENDIENTE = 'pendiente',
  ENVIADO = 'enviado',
  LEIDO = 'leido',
  COMPLETADO = 'completado',
  DESCARTADO = 'descartado',
  POSPUESTO = 'pospuesto',
}

export enum CanalNotificacion {
  APP = 'app',
  EMAIL = 'email',
  PUSH = 'push',
}

export interface IRecordatorio {
  _id: string;
  empresaId: string;
  tipo: TipoRecordatorio;
  prioridad: PrioridadRecordatorio;
  titulo: string;
  mensaje: string;
  icono?: string;
  color?: string;
  entidadTipo?: string;
  entidadId?: string;
  entidadNombre?: string;
  fechaProgramada: string;
  fechaEnvio?: string;
  estado: EstadoRecordatorio;
  fechaLeido?: string;
  fechaCompletado?: string;
  repetir: boolean;
  frecuenciaRepeticion?: 'diario' | 'semanal' | 'mensual' | 'anual';
  finRepeticion?: string;
  canales: CanalNotificacion[];
  usuarioId: string;
  creadoPor: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAlertaConfig {
  _id: string;
  alertasActivas: {
    tipo: TipoRecordatorio;
    activo: boolean;
    canales: CanalNotificacion[];
    diasAnticipacion?: number;
    horaEnvio?: string;
  }[];
  noMolestar: {
    activo: boolean;
    horaInicio?: string;
    horaFin?: string;
    diasSemana?: number[];
  };
  emailDigest: {
    activo: boolean;
    frecuencia: 'diario' | 'semanal';
    hora?: string;
  };
}

export interface CrearRecordatorioDTO {
  tipo: TipoRecordatorio;
  prioridad?: PrioridadRecordatorio;
  titulo: string;
  mensaje: string;
  icono?: string;
  color?: string;
  entidadTipo?: string;
  entidadId?: string;
  entidadNombre?: string;
  fechaProgramada: string;
  repetir?: boolean;
  frecuenciaRepeticion?: 'diario' | 'semanal' | 'mensual' | 'anual';
  finRepeticion?: string;
  canales?: CanalNotificacion[];
  usuarioId?: string;
}

export interface FiltrosRecordatorios {
  tipo?: TipoRecordatorio;
  estado?: EstadoRecordatorio;
  prioridad?: PrioridadRecordatorio;
  fechaDesde?: string;
  fechaHasta?: string;
  entidadTipo?: string;
  entidadId?: string;
  soloNoLeidos?: boolean;
  pagina?: number;
  limite?: number;
}

export interface Contadores {
  total: number;
  sinLeer: number;
  urgentes: number;
}

export interface Estadisticas {
  pendientes: number;
  completadosHoy: number;
  completadosSemana: number;
  porTipo: { tipo: string; count: number }[];
  porPrioridad: { prioridad: string; count: number }[];
}

// ============================================
// SERVICIO
// ============================================

export const recordatoriosService = {
  // ============================================
  // CRUD
  // ============================================

  /**
   * Crear un recordatorio
   */
  crear: async (data: CrearRecordatorioDTO): Promise<IRecordatorio> => {
    const response = await api.post('/recordatorios', data);
    return response.data.data;
  },

  /**
   * Listar recordatorios
   */
  listar: async (
    filtros: FiltrosRecordatorios = {}
  ): Promise<{ recordatorios: IRecordatorio[]; total: number; totalPaginas: number }> => {
    const params = new URLSearchParams();

    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.prioridad) params.append('prioridad', filtros.prioridad);
    if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
    if (filtros.entidadTipo) params.append('entidadTipo', filtros.entidadTipo);
    if (filtros.entidadId) params.append('entidadId', filtros.entidadId);
    if (filtros.soloNoLeidos) params.append('soloNoLeidos', 'true');
    if (filtros.pagina) params.append('pagina', String(filtros.pagina));
    if (filtros.limite) params.append('limite', String(filtros.limite));

    const response = await api.get(`/recordatorios?${params.toString()}`);
    return {
      recordatorios: response.data.data,
      total: response.data.pagination.total,
      totalPaginas: response.data.pagination.totalPaginas,
    };
  },

  /**
   * Obtener recordatorios pendientes próximos
   */
  getPendientes: async (diasProximos: number = 7): Promise<IRecordatorio[]> => {
    const response = await api.get(`/recordatorios/pendientes?dias=${diasProximos}`);
    return response.data.data;
  },

  /**
   * Obtener contadores para el navbar
   */
  getContadores: async (): Promise<Contadores> => {
    const response = await api.get('/recordatorios/contadores');
    return response.data.data;
  },

  // ============================================
  // ACCIONES
  // ============================================

  /**
   * Marcar como leído
   */
  marcarLeido: async (id: string): Promise<IRecordatorio> => {
    const response = await api.put(`/recordatorios/${id}/leido`);
    return response.data.data;
  },

  /**
   * Marcar como completado
   */
  completar: async (id: string): Promise<IRecordatorio> => {
    const response = await api.put(`/recordatorios/${id}/completar`);
    return response.data.data;
  },

  /**
   * Posponer recordatorio
   */
  posponer: async (id: string, nuevaFecha: string): Promise<IRecordatorio> => {
    const response = await api.put(`/recordatorios/${id}/posponer`, { nuevaFecha });
    return response.data.data;
  },

  /**
   * Descartar recordatorio
   */
  descartar: async (id: string): Promise<IRecordatorio> => {
    const response = await api.put(`/recordatorios/${id}/descartar`);
    return response.data.data;
  },

  /**
   * Eliminar recordatorio
   */
  eliminar: async (id: string): Promise<void> => {
    await api.delete(`/recordatorios/${id}`);
  },

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Obtener configuración de alertas
   */
  getConfiguracion: async (): Promise<IAlertaConfig | null> => {
    const response = await api.get('/recordatorios/configuracion');
    return response.data.data;
  },

  /**
   * Actualizar configuración de alertas
   */
  actualizarConfiguracion: async (config: Partial<IAlertaConfig>): Promise<IAlertaConfig> => {
    const response = await api.put('/recordatorios/configuracion', config);
    return response.data.data;
  },

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtener estadísticas
   */
  getEstadisticas: async (): Promise<Estadisticas> => {
    const response = await api.get('/recordatorios/estadisticas');
    return response.data.data;
  },

  // ============================================
  // TIPOS
  // ============================================

  /**
   * Obtener tipos, prioridades, estados y canales
   */
  getTipos: async (): Promise<{
    tipos: { key: string; value: string; label: string }[];
    prioridades: { key: string; value: string; label: string }[];
    estados: { key: string; value: string; label: string }[];
    canales: { key: string; value: string; label: string }[];
  }> => {
    const response = await api.get('/recordatorios/tipos');
    return response.data.data;
  },
};

export default recordatoriosService;
