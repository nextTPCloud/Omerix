import mongoose, { Schema, Document } from 'mongoose';

export interface IFirma extends Document {
  _id: mongoose.Types.ObjectId;
  documentoId: mongoose.Types.ObjectId;
  tipoDocumento: 'albaran' | 'factura' | 'pedido' | 'parteTrabajo' | 'presupuesto';

  // Tipo de firma
  tipo: 'manuscrita' | 'remota_manuscrita' | 'certificado_digital';

  // Datos de la firma
  imagenFirma?: string; // Base64 PNG
  certificadoInfo?: {
    titular: string;
    nif: string;
    emisor: string;
    serial: string;
    validoDesde: Date;
    validoHasta: Date;
  };

  // Hashes de verificacion
  hashDocumento: string; // SHA-256 del documento en el momento de firmar
  hashFirma: string; // SHA-256 de la firma

  // Metadata
  timestamp: Date;
  ip: string;
  userAgent: string;

  // Firmante
  firmante: {
    nombre: string;
    email?: string;
    nif?: string;
    tipo: 'interno' | 'cliente' | 'proveedor';
  };

  solicitudFirmaId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const FirmaSchema = new Schema<IFirma>(
  {
    documentoId: { type: Schema.Types.ObjectId, required: true, index: true },
    tipoDocumento: {
      type: String,
      enum: ['albaran', 'factura', 'pedido', 'parteTrabajo', 'presupuesto'],
      required: true,
    },
    tipo: {
      type: String,
      enum: ['manuscrita', 'remota_manuscrita', 'certificado_digital'],
      required: true,
    },
    imagenFirma: String,
    certificadoInfo: {
      titular: String,
      nif: String,
      emisor: String,
      serial: String,
      validoDesde: Date,
      validoHasta: Date,
    },
    hashDocumento: { type: String, required: true },
    hashFirma: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    firmante: {
      nombre: { type: String, required: true },
      email: String,
      nif: String,
      tipo: { type: String, enum: ['interno', 'cliente', 'proveedor'], default: 'cliente' },
    },
    solicitudFirmaId: { type: Schema.Types.ObjectId, ref: 'SolicitudFirma' },
  },
  { timestamps: true }
);

FirmaSchema.index({ documentoId: 1, tipoDocumento: 1 });

export { FirmaSchema };
