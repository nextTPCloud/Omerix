// apps/backend/src/modules/google-oauth/GoogleOAuthToken.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// Scopes disponibles de Google
export type GoogleScope = 'calendar' | 'gmail' | 'gmail_send' | 'gmail_readonly' | 'drive' | 'contacts';

// ============================================
// INTERFACE: TOKEN DE GOOGLE OAUTH POR USUARIO
// ============================================

export interface IGoogleOAuthToken extends Document {
  _id: mongoose.Types.ObjectId;

  // Referencias
  usuarioId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;

  // Tokens
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;

  // Información de la cuenta Google
  googleEmail: string;
  googleNombre?: string;
  googleAvatar?: string;

  // Scopes autorizados
  scopes: GoogleScope[];

  // Estado
  activo: boolean;
  ultimoUso?: Date;
  errorMensaje?: string;
  intentosFallidos: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const GoogleOAuthTokenSchema = new Schema<IGoogleOAuthToken>({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  empresaId: {
    type: Schema.Types.ObjectId,
    required: true,
  },

  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiry: { type: Date, required: true },

  googleEmail: { type: String, required: true },
  googleNombre: String,
  googleAvatar: String,

  scopes: [{
    type: String,
    enum: ['calendar', 'gmail', 'gmail_send', 'gmail_readonly', 'drive', 'contacts'],
  }],

  activo: { type: Boolean, default: true },
  ultimoUso: Date,
  errorMensaje: String,
  intentosFallidos: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Índices
GoogleOAuthTokenSchema.index({ usuarioId: 1, empresaId: 1 }, { unique: true });
GoogleOAuthTokenSchema.index({ googleEmail: 1 });
GoogleOAuthTokenSchema.index({ activo: 1 });

// ============================================
// MODELO
// ============================================

export const GoogleOAuthToken: Model<IGoogleOAuthToken> =
  mongoose.models.GoogleOAuthToken ||
  mongoose.model<IGoogleOAuthToken>('GoogleOAuthToken', GoogleOAuthTokenSchema);

export default GoogleOAuthToken;
