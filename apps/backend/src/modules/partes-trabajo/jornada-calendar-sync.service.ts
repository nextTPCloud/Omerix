// apps/backend/src/modules/partes-trabajo/jornada-calendar-sync.service.ts

/**
 * Servicio de sincronización de Jornadas de Partes de Trabajo con Google Calendar
 *
 * Funcionalidad:
 * - Crea eventos en el calendario de Google de cada personal asignado a una jornada
 * - Actualiza eventos cuando cambia la jornada
 * - Elimina eventos cuando se cancela/elimina una jornada
 */

import mongoose from 'mongoose';
import { googleOAuthService } from '../google-oauth';
import { googleCalendarApiService, GoogleEventData } from '../google-calendar/google-calendar-api.service';
import Personal from '../personal/Personal';
import ParteTrabajo, { IParteTrabajo, IJornadaTrabajo, IPersonalJornada } from './ParteTrabajo';

// ============================================
// TIPOS
// ============================================

export interface SyncResult {
  personalId: string;
  personalNombre: string;
  success: boolean;
  googleEventId?: string;
  error?: string;
}

export interface JornadaSyncResult {
  jornadaId: string;
  fecha: Date;
  resultados: SyncResult[];
  sincronizadoCalendar: boolean;
}

// ============================================
// SERVICIO DE SINCRONIZACIÓN
// ============================================

export class JornadaCalendarSyncService {
  private empresaId: mongoose.Types.ObjectId;

  constructor(empresaId: string | mongoose.Types.ObjectId) {
    this.empresaId = typeof empresaId === 'string'
      ? new mongoose.Types.ObjectId(empresaId)
      : empresaId;
  }

  /**
   * Sincroniza una jornada específica con los calendarios del personal asignado
   */
  async sincronizarJornada(
    parte: IParteTrabajo,
    jornadaIndex: number
  ): Promise<JornadaSyncResult> {
    const jornada = parte.jornadas[jornadaIndex];
    if (!jornada) {
      throw new Error(`Jornada no encontrada en índice ${jornadaIndex}`);
    }

    const resultados: SyncResult[] = [];
    let todosExitosos = true;

    // Sincronizar para cada personal de la jornada
    for (let i = 0; i < jornada.personal.length; i++) {
      const personalJornada = jornada.personal[i];
      const resultado = await this.sincronizarParaPersonal(parte, jornada, personalJornada);
      resultados.push(resultado);

      if (resultado.success && resultado.googleEventId) {
        // Actualizar googleEventId en la jornada
        jornada.personal[i].googleEventId = resultado.googleEventId;
      } else if (!resultado.success) {
        todosExitosos = false;
      }
    }

    // Actualizar estado de sincronización
    jornada.sincronizadoCalendar = todosExitosos && resultados.length > 0;
    jornada.ultimaSyncCalendar = new Date();

    // Guardar cambios en el parte
    await ParteTrabajo.updateOne(
      { _id: parte._id },
      {
        $set: {
          [`jornadas.${jornadaIndex}`]: jornada
        }
      }
    );

    return {
      jornadaId: jornada._id?.toString() || '',
      fecha: jornada.fecha,
      resultados,
      sincronizadoCalendar: jornada.sincronizadoCalendar,
    };
  }

  /**
   * Sincroniza todas las jornadas de un parte
   */
  async sincronizarTodasLasJornadas(parteId: string): Promise<JornadaSyncResult[]> {
    const parte = await ParteTrabajo.findById(parteId);
    if (!parte) {
      throw new Error('Parte de trabajo no encontrado');
    }

    const resultados: JornadaSyncResult[] = [];

    for (let i = 0; i < parte.jornadas.length; i++) {
      const resultado = await this.sincronizarJornada(parte, i);
      resultados.push(resultado);
    }

    return resultados;
  }

  /**
   * Sincroniza el evento para un personal específico
   */
  private async sincronizarParaPersonal(
    parte: IParteTrabajo,
    jornada: IJornadaTrabajo,
    personalJornada: IPersonalJornada
  ): Promise<SyncResult> {
    try {
      // Obtener el personal para ver si tiene usuarioId
      const personal = await Personal.findById(personalJornada.personalId);

      if (!personal) {
        return {
          personalId: personalJornada.personalId.toString(),
          personalNombre: personalJornada.nombre,
          success: false,
          error: 'Personal no encontrado',
        };
      }

      if (!personal.usuarioId) {
        return {
          personalId: personalJornada.personalId.toString(),
          personalNombre: personalJornada.nombre,
          success: false,
          error: 'Personal no tiene usuario del sistema vinculado',
        };
      }

      // Verificar si el usuario tiene Google Calendar conectado
      const tokenStatus = await googleOAuthService.isUserConnected(
        personal.usuarioId.toString(),
        this.empresaId.toString()
      );

      if (!tokenStatus.connected || !tokenStatus.scopes?.includes('calendar')) {
        return {
          personalId: personalJornada.personalId.toString(),
          personalNombre: personalJornada.nombre,
          success: false,
          error: 'Usuario no tiene Google Calendar conectado',
        };
      }

      // Obtener token válido
      const tokenData = await googleOAuthService.getValidAccessToken(
        personal.usuarioId.toString(),
        this.empresaId.toString(),
        'calendar'
      );

      // Configurar credenciales
      googleCalendarApiService.setCredentials(tokenData.accessToken);

      // Construir datos del evento
      const eventData = this.buildEventData(parte, jornada, personalJornada);

      // Crear o actualizar evento
      let googleEventId = personalJornada.googleEventId;

      if (googleEventId) {
        // Actualizar evento existente
        try {
          await googleCalendarApiService.updateEvent('primary', googleEventId, eventData);
        } catch (error: any) {
          // Si el evento no existe, crearlo
          if (error.code === 404) {
            const result = await googleCalendarApiService.createEvent('primary', eventData);
            googleEventId = result.id;
          } else {
            throw error;
          }
        }
      } else {
        // Crear nuevo evento
        const result = await googleCalendarApiService.createEvent('primary', eventData);
        googleEventId = result.id;
      }

      return {
        personalId: personalJornada.personalId.toString(),
        personalNombre: personalJornada.nombre,
        success: true,
        googleEventId,
      };

    } catch (error) {
      return {
        personalId: personalJornada.personalId.toString(),
        personalNombre: personalJornada.nombre,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Construye los datos del evento de Google Calendar
   */
  private buildEventData(
    parte: IParteTrabajo,
    jornada: IJornadaTrabajo,
    personalJornada: IPersonalJornada
  ): GoogleEventData {
    // Construir título
    const tipoLabel = {
      mantenimiento: 'Mantenimiento',
      instalacion: 'Instalación',
      reparacion: 'Reparación',
      servicio: 'Servicio',
      proyecto: 'Proyecto',
      otro: 'Trabajo',
    }[parte.tipo] || 'Trabajo';

    const titulo = `${tipoLabel}: ${parte.titulo || parte.clienteNombre}`;

    // Construir descripción
    let descripcion = `**Parte de Trabajo:** ${parte.codigo}\n`;
    descripcion += `**Cliente:** ${parte.clienteNombre}\n`;
    if (parte.proyectoNombre) {
      descripcion += `**Proyecto:** ${parte.proyectoNombre}\n`;
    }
    if (parte.descripcion) {
      descripcion += `\n${parte.descripcion}\n`;
    }
    if (personalJornada.notas) {
      descripcion += `\n**Notas para ti:** ${personalJornada.notas}`;
    }

    // Construir ubicación
    let ubicacion = '';
    if (parte.direccionTrabajo) {
      const dir = parte.direccionTrabajo;
      const partes = [dir.calle, dir.numero, dir.codigoPostal, dir.ciudad, dir.provincia].filter(Boolean);
      ubicacion = partes.join(', ');
    }

    // Calcular fechas
    const fecha = new Date(jornada.fecha);
    let startDateTime: Date;
    let endDateTime: Date;

    if (jornada.horaInicio) {
      const [horas, minutos] = jornada.horaInicio.split(':').map(Number);
      startDateTime = new Date(fecha);
      startDateTime.setHours(horas, minutos, 0, 0);
    } else {
      startDateTime = new Date(fecha);
      startDateTime.setHours(8, 0, 0, 0); // Por defecto 8:00
    }

    if (jornada.horaFin) {
      const [horas, minutos] = jornada.horaFin.split(':').map(Number);
      endDateTime = new Date(fecha);
      endDateTime.setHours(horas, minutos, 0, 0);
    } else if (jornada.duracionEstimada) {
      // Parsear duración (formato: "2h", "1h 30m", etc.)
      const match = jornada.duracionEstimada.match(/(\d+)h?\s*(\d*)m?/);
      if (match) {
        const horas = parseInt(match[1]) || 0;
        const minutos = parseInt(match[2]) || 0;
        endDateTime = new Date(startDateTime.getTime() + (horas * 60 + minutos) * 60 * 1000);
      } else {
        endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 horas por defecto
      }
    } else {
      endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 horas por defecto
    }

    // Ajustar si hora fin es antes que hora inicio (cruzó medianoche)
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    // Color según prioridad
    const colorId = {
      baja: '9',     // Azul
      media: '5',    // Amarillo
      alta: '6',     // Naranja
      urgente: '11', // Rojo
    }[parte.prioridad] || '9';

    return {
      summary: titulo,
      description: descripcion,
      location: ubicacion,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      colorId,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },   // 1 hora antes
          { method: 'popup', minutes: 15 },   // 15 min antes
        ],
      },
      extendedProperties: {
        private: {
          omerixParteId: parte._id.toString(),
          omerixJornadaId: jornada._id?.toString() || '',
          omerixTipo: 'jornada_parte',
        },
      },
    };
  }

  /**
   * Elimina el evento de una jornada del calendario del personal
   */
  async eliminarEventoJornada(
    parte: IParteTrabajo,
    jornadaIndex: number,
    personalIndex: number
  ): Promise<boolean> {
    const jornada = parte.jornadas[jornadaIndex];
    if (!jornada) return false;

    const personalJornada = jornada.personal[personalIndex];
    if (!personalJornada || !personalJornada.googleEventId) return false;

    try {
      const personal = await Personal.findById(personalJornada.personalId);
      if (!personal?.usuarioId) return false;

      const tokenData = await googleOAuthService.getValidAccessToken(
        personal.usuarioId.toString(),
        this.empresaId.toString(),
        'calendar'
      );

      googleCalendarApiService.setCredentials(tokenData.accessToken);
      await googleCalendarApiService.deleteEvent('primary', personalJornada.googleEventId);

      // Limpiar googleEventId
      await ParteTrabajo.updateOne(
        { _id: parte._id },
        {
          $unset: {
            [`jornadas.${jornadaIndex}.personal.${personalIndex}.googleEventId`]: 1
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error eliminando evento de Google Calendar:', error);
      return false;
    }
  }

  /**
   * Elimina todos los eventos de una jornada
   */
  async eliminarTodosLosEventos(parte: IParteTrabajo, jornadaIndex: number): Promise<void> {
    const jornada = parte.jornadas[jornadaIndex];
    if (!jornada) return;

    for (let i = 0; i < jornada.personal.length; i++) {
      await this.eliminarEventoJornada(parte, jornadaIndex, i);
    }
  }

  /**
   * Sincroniza jornadas que tienen pendiente sincronizar
   */
  async sincronizarPendientes(): Promise<{
    partesProcessados: number;
    jornadasSincronizadas: number;
    errores: number;
  }> {
    let partesProcessados = 0;
    let jornadasSincronizadas = 0;
    let errores = 0;

    // Buscar partes con jornadas sin sincronizar
    const partes = await ParteTrabajo.find({
      activo: true,
      esMultiDia: true,
      'jornadas.sincronizadoCalendar': false,
      'jornadas.estado': { $in: ['planificada', 'confirmada'] },
    });

    for (const parte of partes) {
      partesProcessados++;
      for (let i = 0; i < parte.jornadas.length; i++) {
        const jornada = parte.jornadas[i];
        if (!jornada.sincronizadoCalendar && ['planificada', 'confirmada'].includes(jornada.estado)) {
          try {
            await this.sincronizarJornada(parte, i);
            jornadasSincronizadas++;
          } catch (error) {
            errores++;
            console.error(`Error sincronizando jornada ${jornada._id}:`, error);
          }
        }
      }
    }

    return { partesProcessados, jornadasSincronizadas, errores };
  }
}

// Factory function para crear el servicio
export function createJornadaCalendarSyncService(empresaId: string | mongoose.Types.ObjectId) {
  return new JornadaCalendarSyncService(empresaId);
}

export default JornadaCalendarSyncService;
