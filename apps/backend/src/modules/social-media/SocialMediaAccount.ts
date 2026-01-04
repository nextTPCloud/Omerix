// apps/backend/src/modules/social-media/SocialMediaAccount.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// Tipos de plataformas soportadas
export type PlataformaSocial = 'facebook' | 'instagram';

// Estado de la cuenta
export type EstadoCuenta = 'conectada' | 'desconectada' | 'token_expirado' | 'error';

// Tipos de contenido
export type TipoContenido = 'imagen' | 'video' | 'carrusel' | 'reel' | 'story' | 'texto';

// Estado de publicación
export type EstadoPublicacion = 'borrador' | 'programada' | 'publicando' | 'publicada' | 'error' | 'eliminada';

// ============================================
// INTERFACE: CUENTA DE RED SOCIAL
// ============================================

export interface ISocialMediaAccount extends Document {
  _id: mongoose.Types.ObjectId;

  // Información de la cuenta
  plataforma: PlataformaSocial;
  nombre: string;
  username: string;
  avatarUrl?: string;

  // Meta API tokens
  accessToken: string;
  accessTokenExpiry: Date;
  refreshToken?: string;
  pageId?: string; // ID de página de Facebook
  instagramBusinessAccountId?: string; // ID de cuenta de Instagram Business

  // Permisos
  permisos: string[];

  // Estado
  estado: EstadoCuenta;
  ultimaVerificacion?: Date;
  errorMensaje?: string;

  // Estadísticas de la cuenta
  estadisticas: {
    seguidores: number;
    siguiendo: number;
    publicaciones: number;
    ultimaActualizacion: Date;
  };

  // Configuración
  activa: boolean;
  autoPublicar: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INTERFACE: PUBLICACIÓN
// ============================================

export interface IPublicacion extends Document {
  _id: mongoose.Types.ObjectId;

  // Cuenta asociada
  cuentaId: mongoose.Types.ObjectId;
  plataforma: PlataformaSocial;

  // Contenido
  tipo: TipoContenido;
  texto: string;
  hashtags: string[];
  ubicacion?: string;

  // Media
  media: {
    tipo: 'imagen' | 'video';
    url: string;
    thumbnailUrl?: string;
    duracion?: number; // Para videos, en segundos
    altText?: string;
  }[];

  // Programación
  programadaPara?: Date;
  publicadaEn?: Date;

  // Estado
  estado: EstadoPublicacion;
  errorMensaje?: string;
  intentos: number;

  // IDs externos
  externalId?: string; // ID de la publicación en la plataforma
  permalink?: string; // URL de la publicación

  // Estadísticas
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

  // Metadatos
  creadoPor: mongoose.Types.ObjectId;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INTERFACE: COMENTARIO
// ============================================

export interface IComentarioSocial extends Document {
  _id: mongoose.Types.ObjectId;

  publicacionId: mongoose.Types.ObjectId;
  cuentaId: mongoose.Types.ObjectId;

  // Datos del comentario
  externalId: string;
  texto: string;
  autorNombre: string;
  autorId: string;
  autorAvatar?: string;

  // Jerarquía
  esRespuesta: boolean;
  comentarioPadreId?: mongoose.Types.ObjectId;

  // Estado
  leido: boolean;
  respondido: boolean;
  oculto: boolean;

  // Respuesta
  respuestaTexto?: string;
  respuestaEn?: Date;
  respondidoPor?: mongoose.Types.ObjectId;

  // Timestamps
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// INTERFACE: MENSAJE DIRECTO
// ============================================

export interface IMensajeDirecto extends Document {
  _id: mongoose.Types.ObjectId;

  cuentaId: mongoose.Types.ObjectId;
  plataforma: PlataformaSocial;

  // Conversación
  conversacionId: string;

  // Participante
  participanteId: string;
  participanteNombre: string;
  participanteAvatar?: string;

  // Mensaje
  esEntrante: boolean;
  texto: string;
  mediaUrl?: string;

  // Estado
  leido: boolean;
  respondido: boolean;

  // Respuesta
  respuestaTexto?: string;
  respuestaEn?: Date;
  respondidoPor?: mongoose.Types.ObjectId;

  // Timestamps
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const SocialMediaAccountSchema = new Schema<ISocialMediaAccount>({
  plataforma: {
    type: String,
    enum: ['facebook', 'instagram'],
    required: true
  },
  nombre: { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl: String,

  accessToken: { type: String, required: true },
  accessTokenExpiry: { type: Date, required: true },
  refreshToken: String,
  pageId: String,
  instagramBusinessAccountId: String,

  permisos: [String],

  estado: {
    type: String,
    enum: ['conectada', 'desconectada', 'token_expirado', 'error'],
    default: 'conectada'
  },
  ultimaVerificacion: Date,
  errorMensaje: String,

  estadisticas: {
    seguidores: { type: Number, default: 0 },
    siguiendo: { type: Number, default: 0 },
    publicaciones: { type: Number, default: 0 },
    ultimaActualizacion: Date,
  },

  activa: { type: Boolean, default: true },
  autoPublicar: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const PublicacionSchema = new Schema<IPublicacion>({
  cuentaId: { type: Schema.Types.ObjectId, ref: 'SocialMediaAccount', required: true },
  plataforma: { type: String, enum: ['facebook', 'instagram'], required: true },

  tipo: {
    type: String,
    enum: ['imagen', 'video', 'carrusel', 'reel', 'story', 'texto'],
    required: true
  },
  texto: { type: String, default: '' },
  hashtags: [String],
  ubicacion: String,

  media: [{
    tipo: { type: String, enum: ['imagen', 'video'] },
    url: { type: String, required: true },
    thumbnailUrl: String,
    duracion: Number,
    altText: String,
  }],

  programadaPara: Date,
  publicadaEn: Date,

  estado: {
    type: String,
    enum: ['borrador', 'programada', 'publicando', 'publicada', 'error', 'eliminada'],
    default: 'borrador'
  },
  errorMensaje: String,
  intentos: { type: Number, default: 0 },

  externalId: String,
  permalink: String,

  estadisticas: {
    likes: { type: Number, default: 0 },
    comentarios: { type: Number, default: 0 },
    compartidos: { type: Number, default: 0 },
    alcance: { type: Number, default: 0 },
    impresiones: { type: Number, default: 0 },
    clics: { type: Number, default: 0 },
    guardados: { type: Number, default: 0 },
    ultimaActualizacion: Date,
  },

  creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, {
  timestamps: true,
});

const ComentarioSocialSchema = new Schema<IComentarioSocial>({
  publicacionId: { type: Schema.Types.ObjectId, ref: 'Publicacion', required: true },
  cuentaId: { type: Schema.Types.ObjectId, ref: 'SocialMediaAccount', required: true },

  externalId: { type: String, required: true },
  texto: { type: String, required: true },
  autorNombre: { type: String, required: true },
  autorId: { type: String, required: true },
  autorAvatar: String,

  esRespuesta: { type: Boolean, default: false },
  comentarioPadreId: { type: Schema.Types.ObjectId, ref: 'ComentarioSocial' },

  leido: { type: Boolean, default: false },
  respondido: { type: Boolean, default: false },
  oculto: { type: Boolean, default: false },

  respuestaTexto: String,
  respuestaEn: Date,
  respondidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },

  fecha: { type: Date, required: true },
}, {
  timestamps: true,
});

const MensajeDirectoSchema = new Schema<IMensajeDirecto>({
  cuentaId: { type: Schema.Types.ObjectId, ref: 'SocialMediaAccount', required: true },
  plataforma: { type: String, enum: ['facebook', 'instagram'], required: true },

  conversacionId: { type: String, required: true },

  participanteId: { type: String, required: true },
  participanteNombre: { type: String, required: true },
  participanteAvatar: String,

  esEntrante: { type: Boolean, required: true },
  texto: { type: String, required: true },
  mediaUrl: String,

  leido: { type: Boolean, default: false },
  respondido: { type: Boolean, default: false },

  respuestaTexto: String,
  respuestaEn: Date,
  respondidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },

  fecha: { type: Date, required: true },
}, {
  timestamps: true,
});

// Índices
SocialMediaAccountSchema.index({ plataforma: 1 });
SocialMediaAccountSchema.index({ estado: 1 });
PublicacionSchema.index({ cuentaId: 1 });
PublicacionSchema.index({ estado: 1 });
PublicacionSchema.index({ programadaPara: 1 });
ComentarioSocialSchema.index({ publicacionId: 1 });
ComentarioSocialSchema.index({ leido: 1 });
MensajeDirectoSchema.index({ cuentaId: 1 });
MensajeDirectoSchema.index({ conversacionId: 1 });
MensajeDirectoSchema.index({ leido: 1 });

// ============================================
// MODELOS
// ============================================

export const SocialMediaAccount: Model<ISocialMediaAccount> =
  mongoose.models.SocialMediaAccount ||
  mongoose.model<ISocialMediaAccount>('SocialMediaAccount', SocialMediaAccountSchema);

export const Publicacion: Model<IPublicacion> =
  mongoose.models.Publicacion ||
  mongoose.model<IPublicacion>('Publicacion', PublicacionSchema);

export const ComentarioSocial: Model<IComentarioSocial> =
  mongoose.models.ComentarioSocial ||
  mongoose.model<IComentarioSocial>('ComentarioSocial', ComentarioSocialSchema);

export const MensajeDirecto: Model<IMensajeDirecto> =
  mongoose.models.MensajeDirecto ||
  mongoose.model<IMensajeDirecto>('MensajeDirecto', MensajeDirectoSchema);
