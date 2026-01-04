// apps/backend/src/modules/google-calendar/google-calendar-api.service.ts

/**
 * Servicio de integración con Google Calendar API
 *
 * Implementa:
 * - OAuth 2.0 para autenticación
 * - CRUD de eventos
 * - Sincronización incremental
 * - Gestión de calendarios
 */

import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// ============================================
// TIPOS
// ============================================

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole: string;
}

export interface GoogleEventData {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  recurrence?: string[];
  colorId?: string;
  extendedProperties?: {
    private?: { [key: string]: string };
    shared?: { [key: string]: string };
  };
}

// ============================================
// SERVICIO GOOGLE CALENDAR API
// ============================================

export class GoogleCalendarApiService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.API_URL}/google-calendar/auth/callback`
    );
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // ============================================
  // AUTENTICACIÓN
  // ============================================

  /**
   * Genera URL de autorización OAuth
   */
  getAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
      prompt: 'consent',
    });
  }

  /**
   * Intercambia código por tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: Date;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: new Date(tokens.expiry_date!),
    };
  }

  /**
   * Refresca token de acceso
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: Date;
  }> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      expiryDate: new Date(credentials.expiry_date!),
    };
  }

  /**
   * Configura credenciales para llamadas API
   */
  setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Obtiene información del usuario
   */
  async getUserInfo(): Promise<{ email: string; name?: string }> {
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return { email: data.email!, name: data.name };
  }

  // ============================================
  // CALENDARIOS
  // ============================================

  /**
   * Lista calendarios del usuario
   */
  async listCalendars(): Promise<GoogleCalendarInfo[]> {
    const response = await this.calendar.calendarList.list();
    const items = response.data.items || [];

    return items.map(cal => ({
      id: cal.id!,
      summary: cal.summary!,
      description: cal.description,
      backgroundColor: cal.backgroundColor,
      primary: cal.primary,
      accessRole: cal.accessRole!,
    }));
  }

  /**
   * Crea un calendario
   */
  async createCalendar(name: string, description?: string): Promise<string> {
    const response = await this.calendar.calendars.insert({
      requestBody: {
        summary: name,
        description,
        timeZone: 'Europe/Madrid',
      },
    });
    return response.data.id!;
  }

  // ============================================
  // EVENTOS
  // ============================================

  /**
   * Lista eventos de un calendario
   */
  async listEvents(
    calendarId: string,
    options?: {
      timeMin?: Date;
      timeMax?: Date;
      maxResults?: number;
      syncToken?: string;
      pageToken?: string;
    }
  ): Promise<{
    events: calendar_v3.Schema$Event[];
    nextPageToken?: string;
    nextSyncToken?: string;
  }> {
    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: options?.maxResults || 250,
    };

    if (options?.syncToken) {
      params.syncToken = options.syncToken;
    } else {
      if (options?.timeMin) params.timeMin = options.timeMin.toISOString();
      if (options?.timeMax) params.timeMax = options.timeMax.toISOString();
    }

    if (options?.pageToken) {
      params.pageToken = options.pageToken;
    }

    const response = await this.calendar.events.list(params);

    return {
      events: response.data.items || [],
      nextPageToken: response.data.nextPageToken,
      nextSyncToken: response.data.nextSyncToken,
    };
  }

  /**
   * Obtiene un evento
   */
  async getEvent(calendarId: string, eventId: string): Promise<calendar_v3.Schema$Event | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  /**
   * Crea un evento
   */
  async createEvent(
    calendarId: string,
    eventData: GoogleEventData
  ): Promise<{ id: string; etag: string; htmlLink: string }> {
    const response = await this.calendar.events.insert({
      calendarId,
      requestBody: eventData as calendar_v3.Schema$Event,
      sendUpdates: 'all',
    });

    return {
      id: response.data.id!,
      etag: response.data.etag!,
      htmlLink: response.data.htmlLink!,
    };
  }

  /**
   * Actualiza un evento
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    eventData: Partial<GoogleEventData>
  ): Promise<{ etag: string }> {
    const response = await this.calendar.events.patch({
      calendarId,
      eventId,
      requestBody: eventData as calendar_v3.Schema$Event,
      sendUpdates: 'all',
    });

    return { etag: response.data.etag! };
  }

  /**
   * Elimina un evento
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all',
    });
  }

  /**
   * Mueve un evento a otro calendario
   */
  async moveEvent(
    calendarId: string,
    eventId: string,
    destinationCalendarId: string
  ): Promise<void> {
    await this.calendar.events.move({
      calendarId,
      eventId,
      destination: destinationCalendarId,
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Convierte fecha local a formato Google
   */
  formatDateTime(date: Date, allDay: boolean = false): { dateTime?: string; date?: string } {
    if (allDay) {
      return { date: date.toISOString().split('T')[0] };
    }
    return { dateTime: date.toISOString() };
  }

  /**
   * Parsea fecha de Google a Date
   */
  parseDateTime(googleDate: { dateTime?: string | null; date?: string | null }): Date {
    if (googleDate.dateTime) {
      return new Date(googleDate.dateTime);
    }
    return new Date(googleDate.date!);
  }

  /**
   * Genera hash de evento para detectar cambios
   */
  generateEventHash(event: GoogleEventData): string {
    const crypto = require('crypto');
    const data = JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      attendees: event.attendees?.map(a => a.email).sort(),
    });
    return crypto.createHash('md5').update(data).digest('hex');
  }
}

export const googleCalendarApiService = new GoogleCalendarApiService();
