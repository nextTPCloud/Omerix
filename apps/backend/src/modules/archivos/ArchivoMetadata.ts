import mongoose, { Schema, Document } from 'mongoose';

export interface IArchivoMetadata extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  modulo: string;
  entidadId: mongoose.Types.ObjectId;
  categoria?: string;
  nombre: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnails?: Map<string, { key: string; url: string }>;
  isPublic: boolean;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

const ArchivoMetadataSchema = new Schema<IArchivoMetadata>({
  _id: { type: Schema.Types.ObjectId, required: true, auto: true },
  empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  modulo: { type: String, required: true, index: true },
  entidadId: { type: Schema.Types.ObjectId, required: true, index: true },
  categoria: { type: String },
  nombre: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  thumbnails: { type: Map, of: { key: String, url: String } },
  isPublic: { type: Boolean, default: false },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  uploadedAt: { type: Date, default: Date.now },
}, {
  timestamps: false,
  collection: 'archivos_metadata',
});

// Indices compuestos para busquedas frecuentes
ArchivoMetadataSchema.index({ empresaId: 1, modulo: 1, entidadId: 1 });

export default mongoose.model<IArchivoMetadata>('ArchivoMetadata', ArchivoMetadataSchema);
