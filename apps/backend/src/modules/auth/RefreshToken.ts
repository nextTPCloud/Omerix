import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string; // Hash del token (por seguridad)
  deviceInfo?: string; // User-Agent del navegador/dispositivo
  ipAddress?: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceInfo: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // Para poder limpiar tokens expirados
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
      enum: [
        'user_logout',
        'password_change',
        'admin_revoke',
        'security_breach',
        'expired',
        'token_rotation',
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas eficientes
RefreshTokenSchema.index({ userId: 1, isRevoked: 1, expiresAt: 1 });

// Método estático para limpiar tokens expirados (se puede ejecutar como cron job)
RefreshTokenSchema.statics.cleanupExpiredTokens = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });

  console.log(`🧹 Limpieza de tokens: ${result.deletedCount} tokens expirados eliminados`);
  return result.deletedCount;
};

// Método estático para revocar todos los tokens de un usuario
RefreshTokenSchema.statics.revokeAllUserTokens = async function (
  userId: mongoose.Types.ObjectId,
  reason: string
) {
  const result = await this.updateMany(
    { userId, isRevoked: false },
    {
      $set: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );

  console.log(`🔒 Revocados ${result.modifiedCount} tokens del usuario ${userId}`);
  return result.modifiedCount;
};

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);