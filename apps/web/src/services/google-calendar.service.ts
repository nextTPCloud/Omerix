// apps/web/src/services/google-calendar.service.ts

import { api } from './api';

// ============================================
// TIPOS
// ============================================

export type TipoEntidadCalendario =
  | 'parte_trabajo'
  | 'tarea'
  | 'actividad_crm'
  | 'recordatorio'
  | 'evento'
  | 'cita';

export type EstadoSincronizacion = 'pendiente' | 'sincronizado' | 'error' | 'conflicto';
export type DireccionSync = 'bidireccional' | 'solo_google' | 'solo_local';

export interface CalendarioInfo {
  id: string;
  nombre: string;
  color: string;
  principal: boolean;
  activo: boolean;
}

export interface CalendarConfig {
  _id: string;
  email: string;
  nombre?: string;
  calendarios: CalendarioInfo[];
  calendarioPartes?: string;
  calendarioTareas?: string;
  calendarioActividadesCRM?: string;
  calendarioRecordatorios?: string;
  calendarioEventos?: string;
  sincronizacion: {
    direccion: DireccionSync;
    sincPartesActivos: boolean;
    sincTareasPendientes: boolean;
    sincActividadesCRM: boolean;
    sincRecordatorios: boolean;
    sincEventos: boolean;
    frecuenciaMinutos: number;
    ultimaSincronizacion?: string;
  };
  activo: boolean;
  errorMensaje?: string;
}

export interface CalendarEvent {
  _id: string;
  tipoEntidad: TipoEntidadCalendario;
  entidadId: string;
  entidadInfo?: {
    titulo?: string;
    descripcion?: string;
    clienteNombre?: string;
    proyectoNombre?: string;
  };
  googleEventId?: string;
  googleCalendarId?: string;
  titulo: string;
  descripcion?: string;
  ubicacion?: string;
  fechaInicio: string;
  fechaFin: string;
  todoElDia: boolean;
  participantes: {
    email: string;
    nombre?: string;
    estado?: string;
  }[];
  estadoSync: EstadoSincronizacion;
  ultimaSync?: string;
  errorSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStats {
  totalEventos: number;
  sincronizados: number;
  pendientes: number;
  errores: number;
  ultimaSincronizacion?: string;
}

export interface SyncResult {
  creados: number;
  actualizados: number;
  eliminados: number;
  errores: number;
}

// ============================================
// SERVICIO
// ============================================

export const googleCalendarService = {
  // ============================================
  // AUTENTICACIÓN (usa el nuevo sistema unificado)
  // ============================================

  /**
   * Obtiene URL de autenticación con Google
   * Usa el nuevo endpoint unificado /api/google/oauth/auth
   */
  getAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await api.post('/google/oauth/auth', {
      scopes: ['calendar'],
      returnUrl: `${window.location.origin}/integraciones/google-calendar`,
    });
    return response.data.data;
  },

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Obtiene configuración actual
   */
  getConfig: async (): Promise<CalendarConfig | null> => {
    const response = await api.get('/google-calendar/config');
    return response.data.data;
  },

  /**
   * Actualiza configuración
   */
  updateConfig: async (data: Partial<CalendarConfig>): Promise<CalendarConfig> => {
    const response = await api.put('/google-calendar/config', data);
    return response.data.data;
  },

  /**
   * Desconecta Google Calendar
   */
  disconnect: async (): Promise<void> => {
    await api.delete('/google-calendar/disconnect');
  },

  // ============================================
  // SINCRONIZACIÓN
  // ============================================

  /**
   * Ejecuta sincronización completa
   */
  sync: async (): Promise<SyncResult> => {
    const response = await api.post('/google-calendar/sync');
    return response.data.data;
  },

  /**
   * Sincroniza un evento individual
   */
  syncEvento: async (eventoId: string): Promise<CalendarEvent> => {
    const response = await api.post(`/google-calendar/eventos/${eventoId}/sync`);
    return response.data.data;
  },

  // ============================================
  // EVENTOS
  // ============================================

  /**
   * Lista próximos eventos
   */
  getEventos: async (limite?: number): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams();
    if (limite) params.append('limite', String(limite));

    const response = await api.get(`/google-calendar/eventos?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Registra un evento para sincronización
   */
  registrarEvento: async (data: {
    tipoEntidad: TipoEntidadCalendario;
    entidadId: string;
    titulo: string;
    descripcion?: string;
    ubicacion?: string;
    fechaInicio: string;
    fechaFin: string;
    todoElDia?: boolean;
    participantes?: { email: string; nombre?: string }[];
    clienteNombre?: string;
    proyectoNombre?: string;
  }): Promise<CalendarEvent> => {
    const response = await api.post('/google-calendar/eventos', data);
    return response.data.data;
  },

  /**
   * Elimina un evento
   */
  eliminarEvento: async (tipo: TipoEntidadCalendario, entidadId: string): Promise<void> => {
    await api.delete(`/google-calendar/eventos/${tipo}/${entidadId}`);
  },

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtiene estadísticas de sincronización
   */
  getStats: async (): Promise<SyncStats> => {
    const response = await api.get('/google-calendar/stats');
    return response.data.data;
  },
};

export default googleCalendarService;
