import mongoose, { Schema, Document } from 'mongoose';

export interface ITPVActivationToken extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;

  // Token
  token: string;               // 8 caracteres alfanumericos (facil de escribir)
  tokenHash: string;           // Hash para validacion

  // Estado
  usado: boolean;
  tpvId?: mongoose.Types.ObjectId; // Se llena cuando se usa

  // Expiracion
  expiraEn: Date;              // 24h desde creacion

  // Auditoria
  creadoPor: mongoose.Types.ObjectId; // userId del admin
  usadoEn?: Date;
  usadoDesdeIP?: string;

  createdAt: Date;
}

const TPVActivationTokenSchema = new Schema<ITPVActivationToken>(
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
    tpvId: {
      type: Schema.Types.ObjectId,
      ref: 'TPVRegistrado',
    },
    expiraEn: {
      type: Date,
      required: true,
      // index se define abajo como TTL index
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
TPVActivationTokenSchema.index({ token: 1, usado: 1 });

// TTL: eliminar tokens expirados despues de 7 dias
TPVActivationTokenSchema.index(
  { expiraEn: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

export default mongoose.model<ITPVActivationToken>('TPVActivationToken', TPVActivationTokenSchema);
