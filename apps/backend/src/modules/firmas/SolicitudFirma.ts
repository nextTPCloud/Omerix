import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IFirmante {
  nombre: string;
  email?: string;
  telefono?: string;
  token: string;
  tokenExpira: Date;
  estado: 'pendiente' | 'firmado' | 'rechazado' | 'expirado';
  tipoFirmaPermitido: ('manuscrita' | 'certificado_digital')[];
  firmadoEn?: Date;
}

export interface INotificacion {
  tipo: 'email' | 'sms' | 'whatsapp';
  destinatario: string;
  fechaEnvio: Date;
  estado: 'enviado' | 'error' | 'pendiente';
}

export interface ISolicitudFirma extends Document {
  _id: mongoose.Types.ObjectId;
  documentoId: mongoose.Types.ObjectId;
  tipoDocumento: 'albaran' | 'factura' | 'pedido' | 'parteTrabajo' | 'presupuesto';
  codigoDocumento: string;

  firmantes: IFirmante[];

  estado: 'pendiente' | 'parcial' | 'completa' | 'expirada' | 'cancelada';

  notificaciones: INotificacion[];

  fechaExpiracion: Date;
  mensajePersonalizado?: string;
  solicitadoPor: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const SolicitudFirmaSchema = new Schema<ISolicitudFirma>(
  {
    documentoId: { type: Schema.Types.ObjectId, required: true, index: true },
    tipoDocumento: {
      type: String,
      enum: ['albaran', 'factura', 'pedido', 'parteTrabajo', 'presupuesto'],
      required: true,
    },
    codigoDocumento: { type: String, required: true },
    firmantes: [{
      nombre: { type: String, required: true },
      email: String,
      telefono: String,
      token: { type: String, required: true, unique: true },
      tokenExpira: { type: Date, required: true },
      estado: { type: String, enum: ['pendiente', 'firmado', 'rechazado', 'expirado'], default: 'pendiente' },
      tipoFirmaPermitido: [{ type: String, enum: ['manuscrita', 'certificado_digital'] }],
      firmadoEn: Date,
    }],
    estado: {
      type: String,
      enum: ['pendiente', 'parcial', 'completa', 'expirada', 'cancelada'],
      default: 'pendiente',
    },
    notificaciones: [{
      tipo: { type: String, enum: ['email', 'sms', 'whatsapp'] },
      destinatario: String,
      fechaEnvio: Date,
      estado: { type: String, enum: ['enviado', 'error', 'pendiente'], default: 'pendiente' },
    }],
    fechaExpiracion: { type: Date, required: true },
    mensajePersonalizado: String,
    solicitadoPor: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

SolicitudFirmaSchema.index({ 'firmantes.token': 1 });
SolicitudFirmaSchema.index({ estado: 1 });

// Metodo estático para generar token de firma
SolicitudFirmaSchema.statics.generarToken = function(): string {
  return crypto.randomBytes(32).toString('hex');
};

export { SolicitudFirmaSchema };
