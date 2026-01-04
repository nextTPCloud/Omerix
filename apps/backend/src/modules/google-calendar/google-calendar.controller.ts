// apps/backend/src/modules/google-calendar/google-calendar.controller.ts

import { Request, Response, NextFunction } from 'express';
import { GoogleCalendarService } from './google-calendar.service';
import { googleCalendarApiService } from './google-calendar-api.service';
import { googleOAuthService } from '../google-oauth';

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
   * NOTA: Redirige al nuevo sistema unificado de OAuth
   */
  async getAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      // Redirigir al nuevo sistema unificado de Google OAuth
      res.json({
        success: true,
        data: {
          message: 'Usar el nuevo endpoint /api/google/oauth/auth con scopes: ["calendar"]',
          newEndpoint: '/api/google/oauth/auth',
          body: {
            scopes: ['calendar'],
            returnUrl: '/integraciones/google-calendar'
          }
        }
      });
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
   * Verifica tanto CalendarConfig como GoogleOAuthToken (nuevo sistema)
   */
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new GoogleCalendarService(req.empresaId!);
      let config = await service.getConfig();

      // Si no hay config, verificar si hay tokens del nuevo sistema OAuth
      if (!config) {
        const usuarioId = req.userId?.toString();
        const empresaId = req.empresaId?.toString();

        if (usuarioId && empresaId) {
          const oauthStatus = await googleOAuthService.isUserConnected(usuarioId, empresaId);

          // Si tiene Google conectado con scope calendar, crear CalendarConfig
          if (oauthStatus.connected && oauthStatus.scopes?.includes('calendar')) {
            try {
              // Obtener token válido
              const tokenData = await googleOAuthService.getValidAccessToken(usuarioId, empresaId, 'calendar');

              // Configurar API
              googleCalendarApiService.setCredentials(tokenData.accessToken);

              // Obtener calendarios
              const calendarios = await googleCalendarApiService.listCalendars();
              const calPrincipal = calendarios.find(c => c.primary);

              // Crear configuración de Calendar usando los tokens del OAuth unificado
              config = await service.createConfigFromOAuth({
                email: tokenData.googleEmail,
                calendarios: calendarios.map(c => ({
                  id: c.id,
                  nombre: c.summary,
                  color: c.backgroundColor || '#4285F4',
                  principal: c.primary || false,
                  activo: true,
                })),
                calendarioPrincipal: calPrincipal?.id,
              });
            } catch (oauthError) {
              console.error('Error al crear config desde OAuth:', oauthError);
            }
          }
        }
      }

      if (!config) {
        // Verificar si hay OAuth conectado para mostrar mensaje apropiado
        const usuarioId = req.userId?.toString();
        const empresaId = req.empresaId?.toString();
        let oauthConnected = false;

        if (usuarioId && empresaId) {
          const status = await googleOAuthService.isUserConnected(usuarioId, empresaId);
          oauthConnected = status.connected || false;
        }

        return res.json({
          success: true,
          data: null,
          message: oauthConnected ? 'OAuth conectado pero calendar no configurado' : 'No configurado',
        });
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
