// apps/backend/src/modules/social-media/meta-api.service.ts

/**
 * Servicio de integración con Meta API (Facebook + Instagram)
 *
 * Implementa:
 * - OAuth 2.0 para autenticación
 * - Publicación de contenido (posts, stories, reels)
 * - Lectura de métricas y estadísticas
 * - Gestión de comentarios y mensajes
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// TIPOS
// ============================================

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MetaPageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: { data: { url: string } };
  instagram_business_account?: { id: string };
}

interface MetaMediaContainer {
  id: string;
}

interface MetaPublishResponse {
  id: string;
  post_id?: string;
  permalink?: string;
}

interface MetaInsights {
  data: {
    name: string;
    period: string;
    values: { value: number }[];
  }[];
}

interface MetaComment {
  id: string;
  text: string;
  from: {
    id: string;
    name: string;
  };
  created_time: string;
  like_count?: number;
  replies?: { data: MetaComment[] };
}

interface MetaConversation {
  id: string;
  participants: {
    data: { id: string; name: string }[];
  };
  messages: {
    data: {
      id: string;
      message: string;
      from: { id: string; name: string };
      created_time: string;
    }[];
  };
}

// ============================================
// SERVICIO META API
// ============================================

export class MetaApiService {
  private client: AxiosInstance;
  private readonly apiVersion = 'v18.0';
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
  }

  // ============================================
  // AUTENTICACIÓN
  // ============================================

  /**
   * Genera URL de autorización OAuth
   */
  getAuthUrl(redirectUri: string, state: string): string {
    const appId = process.env.META_APP_ID;
    const scopes = [
      // Facebook
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'pages_manage_metadata',
      'pages_messaging',
      // Instagram
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_comments',
      'instagram_manage_insights',
      'instagram_manage_messages',
    ].join(',');

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scopes}&` +
      `state=${state}&` +
      `response_type=code`;
  }

  /**
   * Intercambia código por access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<MetaTokenResponse> {
    const response = await this.client.get('/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });
    return response.data;
  }

  /**
   * Extiende token de corta duración a larga duración
   */
  async getLongLivedToken(shortLivedToken: string): Promise<MetaTokenResponse> {
    const response = await this.client.get('/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      },
    });
    return response.data;
  }

  /**
   * Obtiene las páginas administradas por el usuario
   */
  async getUserPages(accessToken: string): Promise<MetaPageInfo[]> {
    const response = await this.client.get('/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token,category,picture,instagram_business_account',
      },
    });
    return response.data.data;
  }

  /**
   * Obtiene información de cuenta de Instagram Business
   */
  async getInstagramAccount(pageAccessToken: string, igAccountId: string): Promise<any> {
    const response = await this.client.get(`/${igAccountId}`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count',
      },
    });
    return response.data;
  }

  // ============================================
  // PUBLICACIÓN DE CONTENIDO
  // ============================================

  /**
   * Publica en página de Facebook
   */
  async publishToFacebook(
    pageId: string,
    pageAccessToken: string,
    content: {
      message?: string;
      link?: string;
      photoUrl?: string;
      videoUrl?: string;
    }
  ): Promise<MetaPublishResponse> {
    // Publicación con foto
    if (content.photoUrl) {
      const response = await this.client.post(`/${pageId}/photos`, null, {
        params: {
          access_token: pageAccessToken,
          url: content.photoUrl,
          message: content.message,
        },
      });
      return { id: response.data.id, post_id: response.data.post_id };
    }

    // Publicación con video
    if (content.videoUrl) {
      const response = await this.client.post(`/${pageId}/videos`, null, {
        params: {
          access_token: pageAccessToken,
          file_url: content.videoUrl,
          description: content.message,
        },
      });
      return { id: response.data.id };
    }

    // Publicación de texto/link
    const response = await this.client.post(`/${pageId}/feed`, null, {
      params: {
        access_token: pageAccessToken,
        message: content.message,
        link: content.link,
      },
    });
    return { id: response.data.id };
  }

  /**
   * Publica en Instagram (requiere 2 pasos: crear container + publicar)
   */
  async publishToInstagram(
    igAccountId: string,
    accessToken: string,
    content: {
      imageUrl?: string;
      videoUrl?: string;
      caption: string;
      mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
      carouselItems?: { imageUrl?: string; videoUrl?: string }[];
    }
  ): Promise<MetaPublishResponse> {
    // Paso 1: Crear container de media
    let containerId: string;

    if (content.mediaType === 'CAROUSEL_ALBUM' && content.carouselItems) {
      // Crear containers para cada item del carrusel
      const childrenIds = await Promise.all(
        content.carouselItems.map(async (item) => {
          const resp = await this.client.post(`/${igAccountId}/media`, null, {
            params: {
              access_token: accessToken,
              image_url: item.imageUrl,
              video_url: item.videoUrl,
              is_carousel_item: true,
            },
          });
          return resp.data.id;
        })
      );

      // Crear container padre del carrusel
      const carouselResp = await this.client.post(`/${igAccountId}/media`, null, {
        params: {
          access_token: accessToken,
          media_type: 'CAROUSEL',
          caption: content.caption,
          children: childrenIds.join(','),
        },
      });
      containerId = carouselResp.data.id;
    } else if (content.mediaType === 'REELS') {
      const resp = await this.client.post(`/${igAccountId}/media`, null, {
        params: {
          access_token: accessToken,
          media_type: 'REELS',
          video_url: content.videoUrl,
          caption: content.caption,
        },
      });
      containerId = resp.data.id;
    } else {
      const resp = await this.client.post(`/${igAccountId}/media`, null, {
        params: {
          access_token: accessToken,
          image_url: content.imageUrl,
          video_url: content.videoUrl,
          caption: content.caption,
          media_type: content.videoUrl ? 'VIDEO' : 'IMAGE',
        },
      });
      containerId = resp.data.id;
    }

    // Esperar a que el container esté listo (para videos)
    if (content.videoUrl || content.mediaType === 'REELS') {
      await this.waitForContainerReady(igAccountId, containerId, accessToken);
    }

    // Paso 2: Publicar el container
    const publishResp = await this.client.post(`/${igAccountId}/media_publish`, null, {
      params: {
        access_token: accessToken,
        creation_id: containerId,
      },
    });

    // Obtener permalink
    const mediaInfo = await this.client.get(`/${publishResp.data.id}`, {
      params: {
        access_token: accessToken,
        fields: 'permalink',
      },
    });

    return {
      id: publishResp.data.id,
      permalink: mediaInfo.data.permalink,
    };
  }

  /**
   * Espera a que un container de video esté listo
   */
  private async waitForContainerReady(
    igAccountId: string,
    containerId: string,
    accessToken: string,
    maxAttempts = 30
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const resp = await this.client.get(`/${containerId}`, {
        params: {
          access_token: accessToken,
          fields: 'status_code',
        },
      });

      if (resp.data.status_code === 'FINISHED') {
        return;
      }

      if (resp.data.status_code === 'ERROR') {
        throw new Error('Error procesando video en Instagram');
      }

      // Esperar 5 segundos antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Timeout esperando procesamiento de video');
  }

  // ============================================
  // ESTADÍSTICAS E INSIGHTS
  // ============================================

  /**
   * Obtiene insights de una publicación de Instagram
   */
  async getInstagramMediaInsights(
    mediaId: string,
    accessToken: string
  ): Promise<{ [key: string]: number }> {
    const response = await this.client.get(`/${mediaId}/insights`, {
      params: {
        access_token: accessToken,
        metric: 'engagement,impressions,reach,saved,likes,comments,shares',
      },
    });

    const insights: { [key: string]: number } = {};
    response.data.data.forEach((item: any) => {
      insights[item.name] = item.values[0].value;
    });

    return insights;
  }

  /**
   * Obtiene insights de página de Facebook
   */
  async getFacebookPageInsights(
    pageId: string,
    accessToken: string,
    period: 'day' | 'week' | 'days_28' = 'day'
  ): Promise<MetaInsights> {
    const response = await this.client.get(`/${pageId}/insights`, {
      params: {
        access_token: accessToken,
        metric: 'page_views_total,page_engaged_users,page_post_engagements,page_fans',
        period,
      },
    });
    return response.data;
  }

  /**
   * Obtiene estadísticas de cuenta de Instagram
   */
  async getInstagramAccountInsights(
    igAccountId: string,
    accessToken: string,
    period: 'day' | 'week' | 'days_28' = 'day'
  ): Promise<MetaInsights> {
    const response = await this.client.get(`/${igAccountId}/insights`, {
      params: {
        access_token: accessToken,
        metric: 'impressions,reach,follower_count,profile_views',
        period,
      },
    });
    return response.data;
  }

  // ============================================
  // COMENTARIOS
  // ============================================

  /**
   * Obtiene comentarios de una publicación de Facebook
   */
  async getFacebookComments(
    postId: string,
    accessToken: string
  ): Promise<MetaComment[]> {
    const response = await this.client.get(`/${postId}/comments`, {
      params: {
        access_token: accessToken,
        fields: 'id,message,from,created_time,like_count,comment_count,parent',
      },
    });
    return response.data.data;
  }

  /**
   * Obtiene comentarios de una publicación de Instagram
   */
  async getInstagramComments(
    mediaId: string,
    accessToken: string
  ): Promise<MetaComment[]> {
    const response = await this.client.get(`/${mediaId}/comments`, {
      params: {
        access_token: accessToken,
        fields: 'id,text,from,timestamp,like_count,replies{id,text,from,timestamp}',
      },
    });
    return response.data.data;
  }

  /**
   * Responde a un comentario de Facebook
   */
  async replyToFacebookComment(
    commentId: string,
    message: string,
    accessToken: string
  ): Promise<{ id: string }> {
    const response = await this.client.post(`/${commentId}/comments`, null, {
      params: {
        access_token: accessToken,
        message,
      },
    });
    return response.data;
  }

  /**
   * Responde a un comentario de Instagram
   */
  async replyToInstagramComment(
    commentId: string,
    message: string,
    accessToken: string
  ): Promise<{ id: string }> {
    const response = await this.client.post(`/${commentId}/replies`, null, {
      params: {
        access_token: accessToken,
        message,
      },
    });
    return response.data;
  }

  /**
   * Oculta/muestra un comentario
   */
  async hideComment(
    commentId: string,
    hide: boolean,
    accessToken: string
  ): Promise<boolean> {
    const response = await this.client.post(`/${commentId}`, null, {
      params: {
        access_token: accessToken,
        is_hidden: hide,
      },
    });
    return response.data.success;
  }

  // ============================================
  // MENSAJES DIRECTOS (Messenger/Instagram DM)
  // ============================================

  /**
   * Obtiene conversaciones de Messenger
   */
  async getFacebookConversations(
    pageId: string,
    accessToken: string
  ): Promise<MetaConversation[]> {
    const response = await this.client.get(`/${pageId}/conversations`, {
      params: {
        access_token: accessToken,
        fields: 'participants,messages{id,message,from,created_time}',
      },
    });
    return response.data.data;
  }

  /**
   * Obtiene conversaciones de Instagram
   */
  async getInstagramConversations(
    igAccountId: string,
    accessToken: string
  ): Promise<any[]> {
    const response = await this.client.get(`/${igAccountId}/conversations`, {
      params: {
        access_token: accessToken,
        platform: 'instagram',
        fields: 'participants,messages{id,message,from,created_time}',
      },
    });
    return response.data.data;
  }

  /**
   * Envía mensaje por Messenger
   */
  async sendFacebookMessage(
    pageId: string,
    recipientId: string,
    message: string,
    accessToken: string
  ): Promise<{ message_id: string }> {
    const response = await this.client.post(`/${pageId}/messages`, {
      recipient: { id: recipientId },
      message: { text: message },
    }, {
      params: { access_token: accessToken },
    });
    return response.data;
  }

  /**
   * Envía mensaje por Instagram DM
   */
  async sendInstagramMessage(
    igAccountId: string,
    recipientId: string,
    message: string,
    accessToken: string
  ): Promise<{ message_id: string }> {
    const response = await this.client.post(`/${igAccountId}/messages`, {
      recipient: { id: recipientId },
      message: { text: message },
    }, {
      params: { access_token: accessToken },
    });
    return response.data;
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Verifica firma de webhook de Meta
   */
  verifyWebhookSignature(
    signature: string,
    payload: string
  ): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.META_APP_SECRET)
      .update(payload)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Verifica desafío de webhook
   */
  verifyWebhookChallenge(
    mode: string,
    token: string,
    challenge: string
  ): string | null {
    if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  }
}

export const metaApiService = new MetaApiService();
