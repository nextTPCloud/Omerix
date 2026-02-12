import mongoose, { Schema, Document } from 'mongoose';

export interface IStorageUsage extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  usedBytes: number;
  limitBytes: number;
  fileCount: number;
  breakdown: Map<string, { bytes: number; count: number }>;
  updatedAt: Date;
}

const StorageUsageSchema = new Schema<IStorageUsage>({
  _id: { type: Schema.Types.ObjectId, required: true, auto: true },
  empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, unique: true },
  usedBytes: { type: Number, default: 0 },
  limitBytes: { type: Number, default: 1 * 1024 * 1024 * 1024 }, // 1GB por defecto
  fileCount: { type: Number, default: 0 },
  breakdown: { type: Map, of: { bytes: Number, count: Number }, default: {} },
}, {
  timestamps: true,
  collection: 'storage_usage',
});

export default mongoose.model<IStorageUsage>('StorageUsage', StorageUsageSchema);
