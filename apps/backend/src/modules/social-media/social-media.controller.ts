// apps/backend/src/modules/social-media/social-media.controller.ts

import { Request, Response, NextFunction } from 'express';
import { SocialMediaService } from './social-media.service';
import { metaApiService } from './meta-api.service';

// ============================================
// CONTROLADOR DE REDES SOCIALES
// ============================================

export const socialMediaController = {
  // ============================================
  // CUENTAS
  // ============================================

  /**
   * GET /social-media/auth/meta
   * Inicia autenticación con Meta
   */
  async getMetaAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const redirectUri = `${process.env.API_URL}/social-media/auth/meta/callback`;
      const state = Buffer.from(JSON.stringify({
        empresaId: req.empresaId,
        usuarioId: req.user?.id,
      })).toString('base64');

      const authUrl = metaApiService.getAuthUrl(redirectUri, state);

      res.json({ success: true, data: { authUrl } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /social-media/auth/meta/callback
   * Callback de OAuth de Meta
   */
  async metaAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.redirect('/redes-sociales?error=auth_failed');
      }

      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      const redirectUri = `${process.env.API_URL}/social-media/auth/meta/callback`;

      const service = new SocialMediaService(stateData.empresaId);
      const cuentas = await service.connectMetaAccount(code as string, redirectUri);

      res.redirect(`/redes-sociales?success=true&cuentas=${cuentas.length}`);
    } catch (error) {
      console.error('Error en callback de Meta:', error);
      res.redirect('/redes-sociales?error=connection_failed');
    }
  },

  /**
   * GET /social-media/cuentas
   * Lista cuentas conectadas
   */
  async getCuentas(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const cuentas = await service.getCuentas();

      res.json({ success: true, data: cuentas });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /social-media/cuentas/:id
   * Obtiene una cuenta
   */
  async getCuenta(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const cuenta = await service.getCuentaById(req.params.id);

      if (!cuenta) {
        return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
      }

      res.json({ success: true, data: cuenta });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /social-media/cuentas/:id
   * Desconecta una cuenta
   */
  async desconectarCuenta(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const cuenta = await service.desconectarCuenta(req.params.id);

      res.json({ success: true, data: cuenta });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /social-media/cuentas/:id/sync
   * Sincroniza estadísticas de una cuenta
   */
  async sincronizarCuenta(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const cuenta = await service.actualizarEstadisticasCuenta(req.params.id);

      res.json({ success: true, data: cuenta });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // PUBLICACIONES
  // ============================================

  /**
   * GET /social-media/publicaciones
   * Lista publicaciones
   */
  async getPublicaciones(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const { cuentaId, estado, desde, hasta, pagina, limite } = req.query;

      const result = await service.getPublicaciones({
        cuentaId: cuentaId as string,
        estado: estado as string,
        desde: desde ? new Date(desde as string) : undefined,
        hasta: hasta ? new Date(hasta as string) : undefined,
        pagina: pagina ? parseInt(pagina as string) : undefined,
        limite: limite ? parseInt(limite as string) : undefined,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /social-media/publicaciones
   * Crea una publicación
   */
  async crearPublicacion(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const publicacion = await service.crearPublicacion(
        req.body.cuentaId,
        req.body,
        req.user!.id
      );

      res.status(201).json({ success: true, data: publicacion });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /social-media/publicaciones/:id/publicar
   * Publica una publicación
   */
  async publicar(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const publicacion = await service.publicar(req.params.id);

      res.json({ success: true, data: publicacion });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /social-media/publicaciones/:id/programar
   * Programa una publicación
   */
  async programar(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const publicacion = await service.programarPublicacion(
        req.params.id,
        new Date(req.body.fechaProgramada)
      );

      res.json({ success: true, data: publicacion });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /social-media/publicaciones/:id/sync
   * Sincroniza estadísticas de una publicación
   */
  async sincronizarEstadisticas(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const publicacion = await service.actualizarEstadisticasPublicacion(req.params.id);

      res.json({ success: true, data: publicacion });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // COMENTARIOS
  // ============================================

  /**
   * POST /social-media/publicaciones/:id/comentarios/sync
   * Sincroniza comentarios de una publicación
   */
  async sincronizarComentarios(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const nuevos = await service.sincronizarComentarios(req.params.id);

      res.json({ success: true, data: { nuevos } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /social-media/comentarios/:id/responder
   * Responde a un comentario
   */
  async responderComentario(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const result = await service.responderComentario(
        req.params.id,
        req.body.respuesta,
        req.user!.id
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // MENSAJES
  // ============================================

  /**
   * POST /social-media/cuentas/:id/mensajes/sync
   * Sincroniza mensajes de una cuenta
   */
  async sincronizarMensajes(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const nuevos = await service.sincronizarMensajes(req.params.id);

      res.json({ success: true, data: { nuevos } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /social-media/cuentas/:id/mensajes/enviar
   * Envía un mensaje
   */
  async enviarMensaje(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const result = await service.enviarMensaje(
        req.params.id,
        req.body.destinatarioId,
        req.body.mensaje,
        req.user!.id
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // DASHBOARD
  // ============================================

  /**
   * GET /social-media/resumen
   * Obtiene resumen para dashboard
   */
  async getResumen(req: Request, res: Response, next: NextFunction) {
    try {
      const service = new SocialMediaService(req.empresaId!);
      const resumen = await service.getResumen();

      res.json({ success: true, data: resumen });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * GET /social-media/webhooks/meta
   * Verificación de webhook de Meta
   */
  async verifyMetaWebhook(req: Request, res: Response) {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    const result = metaApiService.verifyWebhookChallenge(
      mode as string,
      token as string,
      challenge as string
    );

    if (result) {
      res.send(result);
    } else {
      res.status(403).send('Verification failed');
    }
  },

  /**
   * POST /social-media/webhooks/meta
   * Recibe eventos de webhook de Meta
   */
  async handleMetaWebhook(req: Request, res: Response) {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);

    if (!metaApiService.verifyWebhookSignature(signature, payload)) {
      return res.status(403).send('Invalid signature');
    }

    // Procesar eventos de forma asíncrona
    const { object, entry } = req.body;

    // Responder inmediatamente
    res.sendStatus(200);

    // Procesar en background
    for (const e of entry || []) {
      console.log('Webhook event:', object, e);
      // TODO: Procesar eventos (nuevos comentarios, mensajes, etc.)
    }
  },
};

export default socialMediaController;
