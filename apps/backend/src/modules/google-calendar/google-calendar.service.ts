// apps/backend/src/modules/google-calendar/google-calendar.service.ts

import mongoose from 'mongoose';
import {
  CalendarConfig,
  CalendarEvent,
  CalendarSyncLog,
  ICalendarConfig,
  ICalendarEvent,
  TipoEntidadCalendario,
} from './GoogleCalendar';
import { googleCalendarApiService, GoogleEventData } from './google-calendar-api.service';

// ============================================
// SERVICIO DE GOOGLE CALENDAR
// ============================================

export class GoogleCalendarService {
  private empresaId: mongoose.Types.ObjectId;

  constructor(empresaId: string | mongoose.Types.ObjectId) {
    this.empresaId = typeof empresaId === 'string'
      ? new mongoose.Types.ObjectId(empresaId)
      : empresaId;
  }

  // Usamos los modelos directamente (están en BD principal, filtrados por empresaId/usuarioId)
  private get ConfigModel() {
    return CalendarConfig;
  }

  private get EventModel() {
    return CalendarEvent;
  }

  private get LogModel() {
    return CalendarSyncLog;
  }

  // ============================================
  // AUTENTICACIÓN Y CONFIGURACIÓN
  // ============================================

  /**
   * Inicia proceso de conexión con Google Calendar
   */
  getAuthUrl(state: string): string {
    return googleCalendarApiService.getAuthUrl(state);
  }

  /**
   * Completa conexión OAuth con Google
   */
  async connectGoogleCalendar(code: string): Promise<ICalendarConfig> {
    // Intercambiar código por tokens
    const tokens = await googleCalendarApiService.exchangeCodeForTokens(code);

    // Configurar credenciales
    googleCalendarApiService.setCredentials(tokens.accessToken, tokens.refreshToken);

    // Obtener info del usuario
    const userInfo = await googleCalendarApiService.getUserInfo();

    // Obtener calendarios
    const calendarios = await googleCalendarApiService.listCalendars();

    // Buscar calendario principal
    const calPrincipal = calendarios.find(c => c.primary);

    // Crear o actualizar configuración (filtrar por empresaId)
    let config = await this.ConfigModel.findOne({
      empresaId: this.empresaId,
      email: userInfo.email
    });

    if (config) {
      config.accessToken = tokens.accessToken;
      config.refreshToken = tokens.refreshToken;
      config.tokenExpiry = tokens.expiryDate;
      config.calendarios = calendarios.map(c => ({
        id: c.id,
        nombre: c.summary,
        color: c.backgroundColor || '#4285F4',
        principal: c.primary || false,
        activo: true,
      }));
      config.activo = true;
      config.errorMensaje = undefined;
      await config.save();
    } else {
      config = await this.ConfigModel.create({
        empresaId: this.empresaId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: tokens.expiryDate,
        email: userInfo.email,
        nombre: userInfo.name,
        calendarios: calendarios.map(c => ({
          id: c.id,
          nombre: c.summary,
          color: c.backgroundColor || '#4285F4',
          principal: c.primary || false,
          activo: true,
        })),
        calendarioPartes: calPrincipal?.id,
        calendarioTareas: calPrincipal?.id,
        calendarioActividadesCRM: calPrincipal?.id,
        calendarioRecordatorios: calPrincipal?.id,
        calendarioEventos: calPrincipal?.id,
        sincronizacion: {
          direccion: 'bidireccional',
          sincPartesActivos: true,
          sincTareasPendientes: true,
          sincActividadesCRM: true,
          sincRecordatorios: true,
          sincEventos: true,
          frecuenciaMinutos: 15,
        },
        activo: true,
      });
    }

    return config;
  }

  /**
   * Obtiene configuración actual
   */
  async getConfig(): Promise<ICalendarConfig | null> {
    return this.ConfigModel.findOne({ empresaId: this.empresaId, activo: true });
  }

  /**
   * Actualiza configuración
   */
  async updateConfig(updates: Partial<ICalendarConfig>): Promise<ICalendarConfig | null> {
    return this.ConfigModel.findOneAndUpdate(
      { empresaId: this.empresaId, activo: true },
      updates,
      { new: true }
    );
  }

  /**
   * Desconecta Google Calendar
   */
  async disconnect(): Promise<void> {
    await this.ConfigModel.updateMany({ empresaId: this.empresaId }, { activo: false });
  }

  /**
   * Crea configuración de Calendar desde tokens del nuevo sistema OAuth
   * Se usa cuando el usuario conectó Google via el OAuth unificado
   */
  async createConfigFromOAuth(data: {
    email: string;
    calendarios: {
      id: string;
      nombre: string;
      color: string;
      principal: boolean;
      activo: boolean;
    }[];
    calendarioPrincipal?: string;
    usuarioId?: string;
  }): Promise<ICalendarConfig> {
    // Buscar config existente por empresaId y email
    let config = await this.ConfigModel.findOne({
      empresaId: this.empresaId,
      email: data.email,
    });

    const calPrincipalId = data.calendarioPrincipal || data.calendarios.find(c => c.principal)?.id;

    if (config) {
      // Actualizar calendarios y activar
      config.calendarios = data.calendarios;
      config.activo = true;
      config.errorMensaje = undefined;
      if (data.usuarioId) {
        config.usuarioId = new mongoose.Types.ObjectId(data.usuarioId);
      }
      await config.save();
    } else {
      // Crear nueva config (sin tokens, ya que se usan del OAuth unificado)
      config = await this.ConfigModel.create({
        empresaId: this.empresaId,
        usuarioId: data.usuarioId ? new mongoose.Types.ObjectId(data.usuarioId) : undefined,
        email: data.email,
        calendarios: data.calendarios,
        calendarioPartes: calPrincipalId,
        calendarioTareas: calPrincipalId,
        calendarioActividadesCRM: calPrincipalId,
        calendarioRecordatorios: calPrincipalId,
        calendarioEventos: calPrincipalId,
        sincronizacion: {
          direccion: 'bidireccional',
          sincPartesActivos: true,
          sincTareasPendientes: true,
          sincActividadesCRM: true,
          sincRecordatorios: true,
          sincEventos: true,
          frecuenciaMinutos: 15,
        },
        activo: true,
        // No guardamos tokens aquí, se usan del GoogleOAuthToken
        usaOAuthUnificado: true,
      });
    }

    return config;
  }

  /**
   * Verifica y refresca token si es necesario
   */
  private async ensureValidToken(config: ICalendarConfig): Promise<void> {
    if (config.tokenExpiry && config.tokenExpiry.getTime() < Date.now() + 5 * 60 * 1000) {
      const newTokens = await googleCalendarApiService.refreshAccessToken(config.refreshToken);
      config.accessToken = newTokens.accessToken;
      config.tokenExpiry = newTokens.expiryDate;
      await config.save();
    }
    googleCalendarApiService.setCredentials(config.accessToken, config.refreshToken);
  }

  // ============================================
  // SINCRONIZACIÓN DE EVENTOS
  // ============================================

  /**
   * Registra un evento para sincronización
   */
  async registrarEvento(
    tipoEntidad: TipoEntidadCalendario,
    entidadId: string,
    datos: {
      titulo: string;
      descripcion?: string;
      ubicacion?: string;
      fechaInicio: Date;
      fechaFin: Date;
      todoElDia?: boolean;
      participantes?: { email: string; nombre?: string }[];
      clienteNombre?: string;
      proyectoNombre?: string;
    }
  ): Promise<ICalendarEvent> {
    const evento = await this.EventModel.findOneAndUpdate(
      { tipoEntidad, entidadId: new mongoose.Types.ObjectId(entidadId) },
      {
        tipoEntidad,
        entidadId: new mongoose.Types.ObjectId(entidadId),
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        ubicacion: datos.ubicacion,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        todoElDia: datos.todoElDia || false,
        participantes: datos.participantes?.map(p => ({
          email: p.email,
          nombre: p.nombre,
          estado: 'pendiente',
        })) || [],
        entidadInfo: {
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          clienteNombre: datos.clienteNombre,
          proyectoNombre: datos.proyectoNombre,
        },
        estadoSync: 'pendiente',
      },
      { upsert: true, new: true }
    );

    // Intentar sincronizar inmediatamente
    await this.sincronizarEventoIndividual(evento._id.toString());

    return evento;
  }

  /**
   * Elimina registro de evento
   */
  async eliminarEvento(tipoEntidad: TipoEntidadCalendario, entidadId: string): Promise<void> {
    const evento = await this.EventModel.findOne({
      tipoEntidad,
      entidadId: new mongoose.Types.ObjectId(entidadId),
    });

    if (evento && evento.googleEventId) {
      const config = await this.getConfig();
      if (config) {
        try {
          await this.ensureValidToken(config);
          const calendarId = this.getCalendarIdForType(config, tipoEntidad);
          if (calendarId) {
            await googleCalendarApiService.deleteEvent(calendarId, evento.googleEventId);
          }
        } catch (error) {
          console.error('Error eliminando evento de Google Calendar:', error);
        }
      }
    }

    await this.EventModel.deleteOne({ _id: evento?._id });
  }

  /**
   * Sincroniza un evento individual con Google Calendar
   */
  async sincronizarEventoIndividual(eventoId: string): Promise<ICalendarEvent | null> {
    const config = await this.getConfig();
    if (!config) return null;

    const evento = await this.EventModel.findById(eventoId);
    if (!evento) return null;

    try {
      await this.ensureValidToken(config);

      const calendarId = this.getCalendarIdForType(config, evento.tipoEntidad);
      if (!calendarId) {
        throw new Error('No hay calendario configurado para este tipo de evento');
      }

      const eventData = this.convertToGoogleEvent(evento);

      if (evento.googleEventId) {
        // Actualizar evento existente
        const result = await googleCalendarApiService.updateEvent(
          calendarId,
          evento.googleEventId,
          eventData
        );
        evento.googleEtag = result.etag;
      } else {
        // Crear nuevo evento
        const result = await googleCalendarApiService.createEvent(calendarId, eventData);
        evento.googleEventId = result.id;
        evento.googleCalendarId = calendarId;
        evento.googleEtag = result.etag;
      }

      evento.estadoSync = 'sincronizado';
      evento.ultimaSync = new Date();
      evento.errorSync = undefined;
      evento.hashLocal = googleCalendarApiService.generateEventHash(eventData);

    } catch (error) {
      evento.estadoSync = 'error';
      evento.errorSync = (error as Error).message;
    }

    await evento.save();
    return evento;
  }

  /**
   * Ejecuta sincronización completa bidireccional
   */
  async sincronizacionCompleta(): Promise<{
    creados: number;
    actualizados: number;
    eliminados: number;
    errores: number;
  }> {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('Google Calendar no está configurado');
    }

    const log = await this.LogModel.create({
      tipo: 'sync_completa',
      direccion: config.sincronizacion.direccion === 'bidireccional' ? 'bidireccional' : 'local_to_google',
      inicioEjecucion: new Date(),
    });

    const resultado = { creados: 0, actualizados: 0, eliminados: 0, errores: 0 };
    const erroresDetalle: string[] = [];

    try {
      await this.ensureValidToken(config);

      // 1. Sincronizar eventos locales pendientes hacia Google
      const eventosPendientes = await this.EventModel.find({
        estadoSync: { $in: ['pendiente', 'error'] },
      });

      for (const evento of eventosPendientes) {
        try {
          const calendarId = this.getCalendarIdForType(config, evento.tipoEntidad);
          if (!calendarId) continue;

          const eventData = this.convertToGoogleEvent(evento);

          if (evento.googleEventId) {
            await googleCalendarApiService.updateEvent(calendarId, evento.googleEventId, eventData);
            resultado.actualizados++;
          } else {
            const result = await googleCalendarApiService.createEvent(calendarId, eventData);
            evento.googleEventId = result.id;
            evento.googleCalendarId = calendarId;
            resultado.creados++;
          }

          evento.estadoSync = 'sincronizado';
          evento.ultimaSync = new Date();
          evento.errorSync = undefined;
          await evento.save();

        } catch (error) {
          resultado.errores++;
          erroresDetalle.push(`Evento ${evento._id}: ${(error as Error).message}`);
          evento.estadoSync = 'error';
          evento.errorSync = (error as Error).message;
          await evento.save();
        }
      }

      // 2. Si es bidireccional, obtener cambios desde Google
      if (config.sincronizacion.direccion === 'bidireccional') {
        const calendarios = config.calendarios.filter(c => c.activo);

        for (const calendario of calendarios) {
          try {
            const { events } = await googleCalendarApiService.listEvents(calendario.id, {
              timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Último mes
              timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Próximos 3 meses
            });

            for (const googleEvent of events) {
              if (!googleEvent.id || !googleEvent.summary) continue;

              // Verificar si ya tenemos este evento
              const existente = await this.EventModel.findOne({
                googleEventId: googleEvent.id,
              });

              if (!existente && googleEvent.extendedProperties?.private?.omerixId) {
                // Es un evento creado por Omerix, ya lo tenemos
                continue;
              }

              if (!existente) {
                // Crear evento local desde Google
                await this.EventModel.create({
                  tipoEntidad: 'evento',
                  entidadId: new mongoose.Types.ObjectId(),
                  googleEventId: googleEvent.id,
                  googleCalendarId: calendario.id,
                  googleEtag: googleEvent.etag,
                  titulo: googleEvent.summary,
                  descripcion: googleEvent.description,
                  ubicacion: googleEvent.location,
                  fechaInicio: googleCalendarApiService.parseDateTime(googleEvent.start!),
                  fechaFin: googleCalendarApiService.parseDateTime(googleEvent.end!),
                  todoElDia: !!googleEvent.start?.date,
                  participantes: googleEvent.attendees?.map(a => ({
                    email: a.email!,
                    nombre: a.displayName,
                    estado: a.responseStatus as any,
                  })) || [],
                  estadoSync: 'sincronizado',
                  ultimaSync: new Date(),
                });
                resultado.creados++;
              }
            }
          } catch (error) {
            erroresDetalle.push(`Calendario ${calendario.nombre}: ${(error as Error).message}`);
          }
        }
      }

      // Actualizar configuración
      config.sincronizacion.ultimaSincronizacion = new Date();
      config.errorMensaje = undefined;
      await config.save();

    } catch (error) {
      resultado.errores++;
      erroresDetalle.push(`Error general: ${(error as Error).message}`);

      config.errorMensaje = (error as Error).message;
      await config.save();
    }

    // Guardar log
    log.eventosCreados = resultado.creados;
    log.eventosActualizados = resultado.actualizados;
    log.eventosEliminados = resultado.eliminados;
    log.errores = resultado.errores;
    log.detallesErrores = erroresDetalle;
    log.finEjecucion = new Date();
    log.duracionMs = log.finEjecucion.getTime() - log.inicioEjecucion.getTime();
    await log.save();

    return resultado;
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Obtiene calendario para un tipo de entidad
   */
  private getCalendarIdForType(config: ICalendarConfig, tipo: TipoEntidadCalendario): string | null {
    switch (tipo) {
      case 'parte_trabajo':
        return config.calendarioPartes || null;
      case 'tarea':
        return config.calendarioTareas || null;
      case 'actividad_crm':
        return config.calendarioActividadesCRM || null;
      case 'recordatorio':
        return config.calendarioRecordatorios || null;
      case 'evento':
      case 'cita':
        return config.calendarioEventos || null;
      default:
        return config.calendarios.find(c => c.principal)?.id || null;
    }
  }

  /**
   * Convierte evento local a formato Google
   */
  private convertToGoogleEvent(evento: ICalendarEvent): GoogleEventData {
    const eventData: GoogleEventData = {
      summary: evento.titulo,
      description: evento.descripcion,
      location: evento.ubicacion,
      start: googleCalendarApiService.formatDateTime(evento.fechaInicio, evento.todoElDia),
      end: googleCalendarApiService.formatDateTime(evento.fechaFin, evento.todoElDia),
      attendees: evento.participantes.map(p => ({
        email: p.email,
        displayName: p.nombre,
      })),
      reminders: {
        useDefault: evento.recordatorios.length === 0,
        overrides: evento.recordatorios.map(r => ({
          method: r.metodo,
          minutes: r.minutos,
        })),
      },
      extendedProperties: {
        private: {
          omerixId: evento._id.toString(),
          omerixTipo: evento.tipoEntidad,
          omerixEntidadId: evento.entidadId.toString(),
        },
      },
    };

    // Añadir información extra en descripción
    let descripcionExtra = '';
    if (evento.entidadInfo?.clienteNombre) {
      descripcionExtra += `\n\nCliente: ${evento.entidadInfo.clienteNombre}`;
    }
    if (evento.entidadInfo?.proyectoNombre) {
      descripcionExtra += `\nProyecto: ${evento.entidadInfo.proyectoNombre}`;
    }
    if (descripcionExtra && eventData.description) {
      eventData.description += descripcionExtra;
    } else if (descripcionExtra) {
      eventData.description = descripcionExtra.trim();
    }

    return eventData;
  }

  /**
   * Obtiene próximos eventos
   */
  async getProximosEventos(limite: number = 10): Promise<ICalendarEvent[]> {
    const ahora = new Date();
    return this.EventModel.find({
      fechaInicio: { $gte: ahora },
      estadoSync: 'sincronizado',
    })
      .sort({ fechaInicio: 1 })
      .limit(limite);
  }

  /**
   * Obtiene estadísticas
   */
  async getEstadisticas(): Promise<{
    totalEventos: number;
    sincronizados: number;
    pendientes: number;
    errores: number;
    ultimaSincronizacion?: Date;
  }> {
    const config = await this.getConfig();
    const [total, sincronizados, pendientes, errores] = await Promise.all([
      this.EventModel.countDocuments(),
      this.EventModel.countDocuments({ estadoSync: 'sincronizado' }),
      this.EventModel.countDocuments({ estadoSync: 'pendiente' }),
      this.EventModel.countDocuments({ estadoSync: 'error' }),
    ]);

    return {
      totalEventos: total,
      sincronizados,
      pendientes,
      errores,
      ultimaSincronizacion: config?.sincronizacion.ultimaSincronizacion,
    };
  }
}

export default GoogleCalendarService;
