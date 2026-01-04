// apps/web/src/services/social-media.service.ts

import { api } from './api';

// ============================================
// TIPOS
// ============================================

export type PlataformaSocial = 'facebook' | 'instagram';
export type EstadoCuenta = 'conectada' | 'desconectada' | 'token_expirado' | 'error';
export type TipoContenido = 'imagen' | 'video' | 'carrusel' | 'reel' | 'story' | 'texto';
export type EstadoPublicacion = 'borrador' | 'programada' | 'publicando' | 'publicada' | 'error' | 'eliminada';

export interface SocialMediaAccount {
  _id: string;
  plataforma: PlataformaSocial;
  nombre: string;
  username: string;
  avatarUrl?: string;
  estado: EstadoCuenta;
  estadisticas: {
    seguidores: number;
    siguiendo: number;
    publicaciones: number;
    ultimaActualizacion: Date;
  };
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  tipo: 'imagen' | 'video';
  url: string;
  thumbnailUrl?: string;
  duracion?: number;
  altText?: string;
}

export interface Publicacion {
  _id: string;
  cuentaId: string | SocialMediaAccount;
  plataforma: PlataformaSocial;
  tipo: TipoContenido;
  texto: string;
  hashtags: string[];
  ubicacion?: string;
  media: MediaItem[];
  programadaPara?: string;
  publicadaEn?: string;
  estado: EstadoPublicacion;
  errorMensaje?: string;
  externalId?: string;
  permalink?: string;
  estadisticas?: {
    likes: number;
    comentarios: number;
    compartidos: number;
    alcance: number;
    impresiones: number;
    clics: number;
    guardados: number;
    ultimaActualizacion: Date;
  };
  creadoPor: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comentario {
  _id: string;
  publicacionId: string;
  texto: string;
  autorNombre: string;
  autorAvatar?: string;
  esRespuesta: boolean;
  leido: boolean;
  respondido: boolean;
  respuestaTexto?: string;
  fecha: string;
}

export interface MensajeDirecto {
  _id: string;
  conversacionId: string;
  participanteNombre: string;
  participanteAvatar?: string;
  esEntrante: boolean;
  texto: string;
  leido: boolean;
  fecha: string;
}

export interface ResumenSocialMedia {
  cuentas: number;
  publicacionesProgramadas: number;
  publicacionesHoy: number;
  comentariosSinLeer: number;
  mensajesSinLeer: number;
  alcanceTotal: number;
  interaccionesTotal: number;
}

// ============================================
// SERVICIO
// ============================================

export const socialMediaService = {
  // ============================================
  // AUTENTICACIÓN
  // ============================================

  /**
   * Obtiene URL de autenticación con Meta
   */
  getMetaAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response = await api.get('/social-media/auth/meta');
    return response.data.data;
  },

  // ============================================
  // CUENTAS
  // ============================================

  /**
   * Lista cuentas conectadas
   */
  getCuentas: async (): Promise<SocialMediaAccount[]> => {
    const response = await api.get('/social-media/cuentas');
    return response.data.data;
  },

  /**
   * Obtiene una cuenta por ID
   */
  getCuenta: async (id: string): Promise<SocialMediaAccount> => {
    const response = await api.get(`/social-media/cuentas/${id}`);
    return response.data.data;
  },

  /**
   * Desconecta una cuenta
   */
  desconectarCuenta: async (id: string): Promise<SocialMediaAccount> => {
    const response = await api.delete(`/social-media/cuentas/${id}`);
    return response.data.data;
  },

  /**
   * Sincroniza estadísticas de una cuenta
   */
  sincronizarCuenta: async (id: string): Promise<SocialMediaAccount> => {
    const response = await api.post(`/social-media/cuentas/${id}/sync`);
    return response.data.data;
  },

  // ============================================
  // PUBLICACIONES
  // ============================================

  /**
   * Lista publicaciones
   */
  getPublicaciones: async (filtros?: {
    cuentaId?: string;
    estado?: EstadoPublicacion;
    desde?: string;
    hasta?: string;
    pagina?: number;
    limite?: number;
  }): Promise<{ publicaciones: Publicacion[]; total: number }> => {
    const params = new URLSearchParams();
    if (filtros?.cuentaId) params.append('cuentaId', filtros.cuentaId);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.desde) params.append('desde', filtros.desde);
    if (filtros?.hasta) params.append('hasta', filtros.hasta);
    if (filtros?.pagina) params.append('pagina', String(filtros.pagina));
    if (filtros?.limite) params.append('limite', String(filtros.limite));

    const response = await api.get(`/social-media/publicaciones?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Crea una publicación
   */
  crearPublicacion: async (data: {
    cuentaId: string;
    tipo: TipoContenido;
    texto: string;
    hashtags?: string[];
    ubicacion?: string;
    media?: MediaItem[];
    programadaPara?: string;
  }): Promise<Publicacion> => {
    const response = await api.post('/social-media/publicaciones', data);
    return response.data.data;
  },

  /**
   * Publica una publicación
   */
  publicar: async (id: string): Promise<Publicacion> => {
    const response = await api.post(`/social-media/publicaciones/${id}/publicar`);
    return response.data.data;
  },

  /**
   * Programa una publicación
   */
  programar: async (id: string, fechaProgramada: string): Promise<Publicacion> => {
    const response = await api.post(`/social-media/publicaciones/${id}/programar`, {
      fechaProgramada,
    });
    return response.data.data;
  },

  /**
   * Sincroniza estadísticas de una publicación
   */
  sincronizarEstadisticas: async (id: string): Promise<Publicacion> => {
    const response = await api.post(`/social-media/publicaciones/${id}/sync`);
    return response.data.data;
  },

  // ============================================
  // COMENTARIOS
  // ============================================

  /**
   * Sincroniza comentarios de una publicación
   */
  sincronizarComentarios: async (publicacionId: string): Promise<{ nuevos: number }> => {
    const response = await api.post(`/social-media/publicaciones/${publicacionId}/comentarios/sync`);
    return response.data.data;
  },

  /**
   * Responde a un comentario
   */
  responderComentario: async (comentarioId: string, respuesta: string): Promise<any> => {
    const response = await api.post(`/social-media/comentarios/${comentarioId}/responder`, {
      respuesta,
    });
    return response.data.data;
  },

  // ============================================
  // MENSAJES
  // ============================================

  /**
   * Sincroniza mensajes de una cuenta
   */
  sincronizarMensajes: async (cuentaId: string): Promise<{ nuevos: number }> => {
    const response = await api.post(`/social-media/cuentas/${cuentaId}/mensajes/sync`);
    return response.data.data;
  },

  /**
   * Envía un mensaje
   */
  enviarMensaje: async (
    cuentaId: string,
    destinatarioId: string,
    mensaje: string
  ): Promise<any> => {
    const response = await api.post(`/social-media/cuentas/${cuentaId}/mensajes/enviar`, {
      destinatarioId,
      mensaje,
    });
    return response.data.data;
  },

  // ============================================
  // DASHBOARD
  // ============================================

  /**
   * Obtiene resumen para dashboard
   */
  getResumen: async (): Promise<ResumenSocialMedia> => {
    const response = await api.get('/social-media/resumen');
    return response.data.data;
  },
};

export default socialMediaService;
