// apps/backend/src/modules/google-calendar/google-calendar.controller.ts

import { Request, Response, NextFunction } from 'express';
import { GoogleCalendarService } from './google-calendar.service';
import { googleCalendarApiService } from './google-calendar-api.service';

// ============================================
// CONTROLADOR DE GOOGLE CALENDAR
// ============================================

export const googleCalendarController = {
  // ============================================
  // AUTENTICACIÓN
  // ============================================

  /**
   * GET /google-calendar/auth
   * Inicia autenticación con Google
   */
  async getAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const state = Buffer.from(JSON.stringify({
        empresaId: req.empresaId,
        usuarioId: req.user?.id,
      })).toString('base64');

      const service = new GoogleCalendarService(req.empresaId!);
      const authUrl = service.getAuthUrl(state);

      res.json({ success: true, data: { authUrl } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /google-calendar/auth/callback
   * Callback de OAuth de Google
   */
  async authCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.redirect('/integraciones/google-calendar?error=auth_failed');
      }

      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const service = new GoogleCalendarService(stateData.empresaId);
      await service.connectGoogleCalendar(code as string);

      res.redirect('/integraciones/google-calendar?success=true');
    } catch (error) {
      console.error('Error en callback de Google:', error);
      res.redirect('/integraciones/google-calendar?error=connection_failed');
    }
  },

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * GET /google-calendar/config
   * Obtiene configuración actual
   */
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      const config = await service.getConfig();

      if (!config) {
        return res.json({ success: true, data: null, message: 'No configurado' });
      }

      // No exponer tokens
      const configSafe = {
        _id: config._id,
        email: config.email,
        nombre: config.nombre,
        calendarios: config.calendarios,
        calendarioPartes: config.calendarioPartes,
        calendarioTareas: config.calendarioTareas,
        calendarioActividadesCRM: config.calendarioActividadesCRM,
        calendarioRecordatorios: config.calendarioRecordatorios,
        calendarioEventos: config.calendarioEventos,
        sincronizacion: config.sincronizacion,
        activo: config.activo,
        errorMensaje: config.errorMensaje,
      };

      res.json({ success: true, data: configSafe });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /google-calendar/config
   * Actualiza configuración
   */
  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      const config = await service.updateConfig(req.body);

      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /google-calendar/disconnect
   * Desconecta Google Calendar
   */
  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      await service.disconnect();

      res.json({ success: true, message: 'Desconectado correctamente' });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // SINCRONIZACIÓN
  // ============================================

  /**
   * POST /google-calendar/sync
   * Ejecuta sincronización completa
   */
  async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      const resultado = await service.sincronizacionCompleta();

      res.json({ success: true, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /google-calendar/eventos/:id/sync
   * Sincroniza un evento individual
   */
  async syncEvento(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      const evento = await service.sincronizarEventoIndividual(req.params.id);

      res.json({ success: true, data: evento });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // EVENTOS
  // ============================================

  /**
   * GET /google-calendar/eventos
   * Lista próximos eventos
   */
  async getEventos(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      const limite = parseInt(req.query.limite as string) || 20;
      const eventos = await service.getProximosEventos(limite);

      res.json({ success: true, data: eventos });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /google-calendar/eventos
   * Registra un evento para sincronización
   */
  async registrarEvento(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      const evento = await service.registrarEvento(
        req.body.tipoEntidad,
        req.body.entidadId,
        {
          titulo: req.body.titulo,
          descripcion: req.body.descripcion,
          ubicacion: req.body.ubicacion,
          fechaInicio: new Date(req.body.fechaInicio),
          fechaFin: new Date(req.body.fechaFin),
          todoElDia: req.body.todoElDia,
          participantes: req.body.participantes,
          clienteNombre: req.body.clienteNombre,
          proyectoNombre: req.body.proyectoNombre,
        }
      );

      res.status(201).json({ success: true, data: evento });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /google-calendar/eventos/:tipo/:entidadId
   * Elimina un evento
   */
  async eliminarEvento(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      await service.eliminarEvento(req.params.tipo as any, req.params.entidadId);

      res.json({ success: true, message: 'Evento eliminado' });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * GET /google-calendar/stats
   * Obtiene estadísticas de sincronización
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      const stats = await service.getEstadisticas();

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};

export default googleCalendarController;
