import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// INTERFACES
// ============================================

export interface IEtapaPipeline extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId?: mongoose.Types.ObjectId;

  nombre: string;
  descripcion?: string;
  color: string;
  orden: number;
  probabilidadDefecto: number;

  esInicial: boolean;
  esFinal: boolean;
  esCierrePositivo: boolean;

  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const EtapaPipelineSchema = new Schema<IEtapaPipeline>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa' },

    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    color: { type: String, default: '#3B82F6' },
    orden: { type: Number, default: 0 },
    probabilidadDefecto: { type: Number, default: 0, min: 0, max: 100 },

    esInicial: { type: Boolean, default: false },
    esFinal: { type: Boolean, default: false },
    esCierrePositivo: { type: Boolean, default: false },

    activo: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'etapas_pipeline',
  }
);

// ============================================
// ÍNDICES
// ============================================

EtapaPipelineSchema.index({ empresaId: 1, orden: 1 });
EtapaPipelineSchema.index({ empresaId: 1, activo: 1 });

// ============================================
// MODELO
// ============================================

export const EtapaPipeline: Model<IEtapaPipeline> =
  mongoose.models.EtapaPipeline || mongoose.model<IEtapaPipeline>('EtapaPipeline', EtapaPipelineSchema);

export default EtapaPipeline;
