// apps/backend/src/modules/social-media/social-media.service.ts

import mongoose from 'mongoose';
import {
  SocialMediaAccount,
  Publicacion,
  ComentarioSocial,
  MensajeDirecto,
  ISocialMediaAccount,
  IPublicacion,
  PlataformaSocial,
} from './SocialMediaAccount';
import { metaApiService } from './meta-api.service';
import { getDynamicModel } from '../../utils/dynamic-models.helper';

// ============================================
// SERVICIO DE REDES SOCIALES
// ============================================

export class SocialMediaService {
  private empresaId: mongoose.Types.ObjectId;

  constructor(empresaId: string | mongoose.Types.ObjectId) {
    this.empresaId = typeof empresaId === 'string'
      ? new mongoose.Types.ObjectId(empresaId)
      : empresaId;
  }

  private get SocialMediaAccountModel() {
    return getDynamicModel('SocialMediaAccount', SocialMediaAccount.schema, this.empresaId.toString());
  }

  private get PublicacionModel() {
    return getDynamicModel('Publicacion', Publicacion.schema, this.empresaId.toString());
  }

  private get ComentarioModel() {
    return getDynamicModel('ComentarioSocial', ComentarioSocial.schema, this.empresaId.toString());
  }

  private get MensajeModel() {
    return getDynamicModel('MensajeDirecto', MensajeDirecto.schema, this.empresaId.toString());
  }

  // ============================================
  // CUENTAS
  // ============================================

  /**
   * Inicia proceso de conexión con Meta (Facebook/Instagram)
   */
  getMetaAuthUrl(redirectUri: string, state: string): string {
    return metaApiService.getAuthUrl(redirectUri, state);
  }

  /**
   * Completa conexión OAuth con Meta
   */
  async connectMetaAccount(code: string, redirectUri: string): Promise<ISocialMediaAccount[]> {
    // Intercambiar código por token
    const tokenResponse = await metaApiService.exchangeCodeForToken(code, redirectUri);

    // Obtener token de larga duración
    const longLivedToken = await metaApiService.getLongLivedToken(tokenResponse.access_token);

    // Obtener páginas del usuario
    const pages = await metaApiService.getUserPages(longLivedToken.access_token);

    const cuentasCreadas: ISocialMediaAccount[] = [];

    for (const page of pages) {
      // Crear cuenta de Facebook
      const fbAccount = await this.SocialMediaAccountModel.create({
        plataforma: 'facebook',
        nombre: page.name,
        username: page.name,
        avatarUrl: page.picture?.data?.url,
        accessToken: page.access_token,
        accessTokenExpiry: new Date(Date.now() + longLivedToken.expires_in * 1000),
        pageId: page.id,
        permisos: ['pages_manage_posts', 'pages_read_engagement'],
        estado: 'conectada',
        ultimaVerificacion: new Date(),
        activa: true,
      });
      cuentasCreadas.push(fbAccount);

      // Si tiene Instagram Business conectado
      if (page.instagram_business_account) {
        const igInfo = await metaApiService.getInstagramAccount(
          page.access_token,
          page.instagram_business_account.id
        );

        const igAccount = await this.SocialMediaAccountModel.create({
          plataforma: 'instagram',
          nombre: igInfo.name || igInfo.username,
          username: igInfo.username,
          avatarUrl: igInfo.profile_picture_url,
          accessToken: page.access_token,
          accessTokenExpiry: new Date(Date.now() + longLivedToken.expires_in * 1000),
          pageId: page.id,
          instagramBusinessAccountId: page.instagram_business_account.id,
          permisos: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments'],
          estado: 'conectada',
          ultimaVerificacion: new Date(),
          estadisticas: {
            seguidores: igInfo.followers_count || 0,
            siguiendo: igInfo.follows_count || 0,
            publicaciones: igInfo.media_count || 0,
            ultimaActualizacion: new Date(),
          },
          activa: true,
        });
        cuentasCreadas.push(igAccount);
      }
    }

    return cuentasCreadas;
  }

  /**
   * Lista todas las cuentas conectadas
   */
  async getCuentas(): Promise<ISocialMediaAccount[]> {
    return this.SocialMediaAccountModel.find({ activa: true }).sort({ plataforma: 1, nombre: 1 });
  }

  /**
   * Obtiene una cuenta por ID
   */
  async getCuentaById(id: string): Promise<ISocialMediaAccount | null> {
    return this.SocialMediaAccountModel.findById(id);
  }

  /**
   * Desconecta una cuenta
   */
  async desconectarCuenta(id: string): Promise<ISocialMediaAccount | null> {
    return this.SocialMediaAccountModel.findByIdAndUpdate(
      id,
      { estado: 'desconectada', activa: false },
      { new: true }
    );
  }

  /**
   * Actualiza estadísticas de una cuenta
   */
  async actualizarEstadisticasCuenta(id: string): Promise<ISocialMediaAccount | null> {
    const cuenta = await this.SocialMediaAccountModel.findById(id);
    if (!cuenta) return null;

    try {
      if (cuenta.plataforma === 'instagram' && cuenta.instagramBusinessAccountId) {
        const igInfo = await metaApiService.getInstagramAccount(
          cuenta.accessToken,
          cuenta.instagramBusinessAccountId
        );

        cuenta.estadisticas = {
          seguidores: igInfo.followers_count || 0,
          siguiendo: igInfo.follows_count || 0,
          publicaciones: igInfo.media_count || 0,
          ultimaActualizacion: new Date(),
        };
      }

      cuenta.ultimaVerificacion = new Date();
      cuenta.estado = 'conectada';
      await cuenta.save();
    } catch (error) {
      cuenta.estado = 'error';
      cuenta.errorMensaje = (error as Error).message;
      await cuenta.save();
    }

    return cuenta;
  }

  // ============================================
  // PUBLICACIONES
  // ============================================

  /**
   * Crea una nueva publicación (borrador)
   */
  async crearPublicacion(
    cuentaId: string,
    data: Partial<IPublicacion>,
    usuarioId: string
  ): Promise<IPublicacion> {
    const cuenta = await this.SocialMediaAccountModel.findById(cuentaId);
    if (!cuenta) throw new Error('Cuenta no encontrada');

    return this.PublicacionModel.create({
      ...data,
      cuentaId: new mongoose.Types.ObjectId(cuentaId),
      plataforma: cuenta.plataforma,
      creadoPor: new mongoose.Types.ObjectId(usuarioId),
      estado: data.programadaPara ? 'programada' : 'borrador',
    });
  }

  /**
   * Lista publicaciones
   */
  async getPublicaciones(filtros: {
    cuentaId?: string;
    estado?: string;
    desde?: Date;
    hasta?: Date;
    pagina?: number;
    limite?: number;
  }): Promise<{ publicaciones: IPublicacion[]; total: number }> {
    const query: any = {};

    if (filtros.cuentaId) query.cuentaId = new mongoose.Types.ObjectId(filtros.cuentaId);
    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.desde || filtros.hasta) {
      query.createdAt = {};
      if (filtros.desde) query.createdAt.$gte = filtros.desde;
      if (filtros.hasta) query.createdAt.$lte = filtros.hasta;
    }

    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 20;
    const skip = (pagina - 1) * limite;

    const [publicaciones, total] = await Promise.all([
      this.PublicacionModel.find(query)
        .populate('cuentaId', 'nombre plataforma avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite),
      this.PublicacionModel.countDocuments(query),
    ]);

    return { publicaciones, total };
  }

  /**
   * Publica una publicación inmediatamente
   */
  async publicar(publicacionId: string): Promise<IPublicacion> {
    const publicacion = await this.PublicacionModel.findById(publicacionId);
    if (!publicacion) throw new Error('Publicación no encontrada');

    const cuenta = await this.SocialMediaAccountModel.findById(publicacion.cuentaId);
    if (!cuenta) throw new Error('Cuenta no encontrada');

    publicacion.estado = 'publicando';
    publicacion.intentos += 1;
    await publicacion.save();

    try {
      let result: { id: string; permalink?: string };

      if (cuenta.plataforma === 'facebook') {
        result = await metaApiService.publishToFacebook(
          cuenta.pageId!,
          cuenta.accessToken,
          {
            message: publicacion.texto,
            photoUrl: publicacion.media[0]?.tipo === 'imagen' ? publicacion.media[0].url : undefined,
            videoUrl: publicacion.media[0]?.tipo === 'video' ? publicacion.media[0].url : undefined,
          }
        );
      } else {
        // Instagram
        result = await metaApiService.publishToInstagram(
          cuenta.instagramBusinessAccountId!,
          cuenta.accessToken,
          {
            caption: publicacion.texto + '\n\n' + publicacion.hashtags.map(h => `#${h}`).join(' '),
            imageUrl: publicacion.media[0]?.tipo === 'imagen' ? publicacion.media[0].url : undefined,
            videoUrl: publicacion.media[0]?.tipo === 'video' ? publicacion.media[0].url : undefined,
            mediaType: publicacion.media.length > 1 ? 'CAROUSEL_ALBUM' :
              publicacion.tipo === 'reel' ? 'REELS' :
                publicacion.media[0]?.tipo === 'video' ? 'VIDEO' : 'IMAGE',
            carouselItems: publicacion.media.length > 1 ? publicacion.media.map(m => ({
              imageUrl: m.tipo === 'imagen' ? m.url : undefined,
              videoUrl: m.tipo === 'video' ? m.url : undefined,
            })) : undefined,
          }
        );
      }

      publicacion.externalId = result.id;
      publicacion.permalink = result.permalink;
      publicacion.estado = 'publicada';
      publicacion.publicadaEn = new Date();
      publicacion.errorMensaje = undefined;
    } catch (error) {
      publicacion.estado = 'error';
      publicacion.errorMensaje = (error as Error).message;
    }

    await publicacion.save();
    return publicacion;
  }

  /**
   * Programa una publicación
   */
  async programarPublicacion(
    publicacionId: string,
    fechaProgramada: Date
  ): Promise<IPublicacion | null> {
    return this.PublicacionModel.findByIdAndUpdate(
      publicacionId,
      { programadaPara: fechaProgramada, estado: 'programada' },
      { new: true }
    );
  }

  /**
   * Ejecuta publicaciones programadas
   */
  async ejecutarPublicacionesProgramadas(): Promise<number> {
    const ahora = new Date();
    const publicacionesPendientes = await this.PublicacionModel.find({
      estado: 'programada',
      programadaPara: { $lte: ahora },
    });

    let publicadas = 0;
    for (const pub of publicacionesPendientes) {
      try {
        await this.publicar(pub._id.toString());
        publicadas++;
      } catch (error) {
        console.error(`Error publicando ${pub._id}:`, error);
      }
    }

    return publicadas;
  }

  /**
   * Actualiza estadísticas de una publicación
   */
  async actualizarEstadisticasPublicacion(publicacionId: string): Promise<IPublicacion | null> {
    const publicacion = await this.PublicacionModel.findById(publicacionId);
    if (!publicacion || !publicacion.externalId) return null;

    const cuenta = await this.SocialMediaAccountModel.findById(publicacion.cuentaId);
    if (!cuenta) return null;

    try {
      if (cuenta.plataforma === 'instagram') {
        const insights = await metaApiService.getInstagramMediaInsights(
          publicacion.externalId,
          cuenta.accessToken
        );

        publicacion.estadisticas = {
          likes: insights.likes || 0,
          comentarios: insights.comments || 0,
          compartidos: insights.shares || 0,
          alcance: insights.reach || 0,
          impresiones: insights.impressions || 0,
          clics: 0,
          guardados: insights.saved || 0,
          ultimaActualizacion: new Date(),
        };

        await publicacion.save();
      }
    } catch (error) {
      console.error(`Error actualizando estadísticas de ${publicacionId}:`, error);
    }

    return publicacion;
  }

  // ============================================
  // COMENTARIOS
  // ============================================

  /**
   * Sincroniza comentarios de una publicación
   */
  async sincronizarComentarios(publicacionId: string): Promise<number> {
    const publicacion = await this.PublicacionModel.findById(publicacionId);
    if (!publicacion || !publicacion.externalId) return 0;

    const cuenta = await this.SocialMediaAccountModel.findById(publicacion.cuentaId);
    if (!cuenta) return 0;

    let comentarios: any[];

    if (cuenta.plataforma === 'facebook') {
      comentarios = await metaApiService.getFacebookComments(
        publicacion.externalId,
        cuenta.accessToken
      );
    } else {
      comentarios = await metaApiService.getInstagramComments(
        publicacion.externalId,
        cuenta.accessToken
      );
    }

    let nuevos = 0;
    for (const comentario of comentarios) {
      const existe = await this.ComentarioModel.findOne({ externalId: comentario.id });
      if (!existe) {
        await this.ComentarioModel.create({
          publicacionId: publicacion._id,
          cuentaId: cuenta._id,
          externalId: comentario.id,
          texto: comentario.text || comentario.message,
          autorNombre: comentario.from?.name || 'Usuario',
          autorId: comentario.from?.id || '',
          esRespuesta: false,
          fecha: new Date(comentario.created_time || comentario.timestamp),
        });
        nuevos++;
      }
    }

    return nuevos;
  }

  /**
   * Responde a un comentario
   */
  async responderComentario(
    comentarioId: string,
    respuesta: string,
    usuarioId: string
  ): Promise<any> {
    const comentario = await this.ComentarioModel.findById(comentarioId)
      .populate('cuentaId');

    if (!comentario) throw new Error('Comentario no encontrado');

    const cuenta = comentario.cuentaId as unknown as ISocialMediaAccount;

    let result;
    if (cuenta.plataforma === 'facebook') {
      result = await metaApiService.replyToFacebookComment(
        comentario.externalId,
        respuesta,
        cuenta.accessToken
      );
    } else {
      result = await metaApiService.replyToInstagramComment(
        comentario.externalId,
        respuesta,
        cuenta.accessToken
      );
    }

    comentario.respondido = true;
    comentario.respuestaTexto = respuesta;
    comentario.respuestaEn = new Date();
    comentario.respondidoPor = new mongoose.Types.ObjectId(usuarioId);
    await comentario.save();

    return result;
  }

  // ============================================
  // MENSAJES DIRECTOS
  // ============================================

  /**
   * Sincroniza mensajes de una cuenta
   */
  async sincronizarMensajes(cuentaId: string): Promise<number> {
    const cuenta = await this.SocialMediaAccountModel.findById(cuentaId);
    if (!cuenta) return 0;

    let conversaciones: any[];

    if (cuenta.plataforma === 'facebook') {
      conversaciones = await metaApiService.getFacebookConversations(
        cuenta.pageId!,
        cuenta.accessToken
      );
    } else {
      conversaciones = await metaApiService.getInstagramConversations(
        cuenta.instagramBusinessAccountId!,
        cuenta.accessToken
      );
    }

    let nuevos = 0;
    for (const conv of conversaciones) {
      const participante = conv.participants?.data?.[0];

      for (const msg of conv.messages?.data || []) {
        const existe = await this.MensajeModel.findOne({
          cuentaId: cuenta._id,
          conversacionId: conv.id,
          fecha: new Date(msg.created_time),
        });

        if (!existe) {
          const esEntrante = msg.from?.id !== cuenta.pageId &&
            msg.from?.id !== cuenta.instagramBusinessAccountId;

          await this.MensajeModel.create({
            cuentaId: cuenta._id,
            plataforma: cuenta.plataforma,
            conversacionId: conv.id,
            participanteId: participante?.id || msg.from?.id,
            participanteNombre: participante?.name || msg.from?.name || 'Usuario',
            esEntrante,
            texto: msg.message,
            fecha: new Date(msg.created_time),
          });
          nuevos++;
        }
      }
    }

    return nuevos;
  }

  /**
   * Envía un mensaje directo
   */
  async enviarMensaje(
    cuentaId: string,
    destinatarioId: string,
    mensaje: string,
    usuarioId: string
  ): Promise<any> {
    const cuenta = await this.SocialMediaAccountModel.findById(cuentaId);
    if (!cuenta) throw new Error('Cuenta no encontrada');

    let result;
    if (cuenta.plataforma === 'facebook') {
      result = await metaApiService.sendFacebookMessage(
        cuenta.pageId!,
        destinatarioId,
        mensaje,
        cuenta.accessToken
      );
    } else {
      result = await metaApiService.sendInstagramMessage(
        cuenta.instagramBusinessAccountId!,
        destinatarioId,
        mensaje,
        cuenta.accessToken
      );
    }

    // Guardar mensaje enviado
    await this.MensajeModel.create({
      cuentaId: cuenta._id,
      plataforma: cuenta.plataforma,
      conversacionId: destinatarioId,
      participanteId: destinatarioId,
      participanteNombre: 'Destinatario',
      esEntrante: false,
      texto: mensaje,
      fecha: new Date(),
    });

    return result;
  }

  // ============================================
  // DASHBOARD
  // ============================================

  /**
   * Obtiene resumen para dashboard
   */
  async getResumen(): Promise<{
    cuentas: number;
    publicacionesProgramadas: number;
    publicacionesHoy: number;
    comentariosSinLeer: number;
    mensajesSinLeer: number;
    alcanceTotal: number;
    interaccionesTotal: number;
  }> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [
      cuentas,
      publicacionesProgramadas,
      publicacionesHoy,
      comentariosSinLeer,
      mensajesSinLeer,
      estadisticasPublicaciones,
    ] = await Promise.all([
      this.SocialMediaAccountModel.countDocuments({ activa: true }),
      this.PublicacionModel.countDocuments({ estado: 'programada' }),
      this.PublicacionModel.countDocuments({
        estado: 'publicada',
        publicadaEn: { $gte: hoy },
      }),
      this.ComentarioModel.countDocuments({ leido: false }),
      this.MensajeModel.countDocuments({ leido: false, esEntrante: true }),
      this.PublicacionModel.aggregate([
        { $match: { estado: 'publicada' } },
        {
          $group: {
            _id: null,
            alcanceTotal: { $sum: '$estadisticas.alcance' },
            interaccionesTotal: {
              $sum: {
                $add: [
                  '$estadisticas.likes',
                  '$estadisticas.comentarios',
                  '$estadisticas.compartidos',
                ],
              },
            },
          },
        },
      ]),
    ]);

    const stats = estadisticasPublicaciones[0] || { alcanceTotal: 0, interaccionesTotal: 0 };

    return {
      cuentas,
      publicacionesProgramadas,
      publicacionesHoy,
      comentariosSinLeer,
      mensajesSinLeer,
      alcanceTotal: stats.alcanceTotal,
      interaccionesTotal: stats.interaccionesTotal,
    };
  }
}

export default SocialMediaService;
