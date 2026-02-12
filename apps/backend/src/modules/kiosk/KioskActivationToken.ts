import mongoose, { Schema, Document } from 'mongoose';

export interface IKioskActivationToken extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  kioskId: mongoose.Types.ObjectId; // Kiosk al que pertenece el token

  // Token
  token: string;               // 8 caracteres alfanumericos (facil de escribir)
  tokenHash: string;           // Hash para validacion

  // Estado
  usado: boolean;

  // Expiracion
  expiraEn: Date;              // 24h desde creacion

  // Auditoria
  creadoPor: mongoose.Types.ObjectId; // userId del admin
  usadoEn?: Date;
  usadoDesdeIP?: string;

  createdAt: Date;
}

const KioskActivationTokenSchema = new Schema<IKioskActivationToken>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    usado: {
      type: Boolean,
      default: false,
    },
    kioskId: {
      type: Schema.Types.ObjectId,
      ref: 'KioskRegistrado',
      required: true,
      index: true,
    },
    expiraEn: {
      type: Date,
      required: true,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    usadoEn: Date,
    usadoDesdeIP: String,
  },
  {
    timestamps: true,
  }
);

// Indice para busqueda rapida
KioskActivationTokenSchema.index({ token: 1, usado: 1 });

// TTL: eliminar tokens expirados despues de 7 dias
KioskActivationTokenSchema.index(
  { expiraEn: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

export default mongoose.model<IKioskActivationToken>('KioskActivationToken', KioskActivationTokenSchema);
