import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDatabaseConfig } from '@/models/Empresa';
import { databaseManager } from '@/services/database-manager.service';

// ============================================
// INTERFACE
// ============================================

export interface IDepartamento extends Document {
  _id: mongoose.Types.ObjectId;
  codigo: string;
  nombre: string;
  descripcion?: string;
  responsableId?: mongoose.Types.ObjectId;
  responsableNombre?: string;
  color?: string;
  orden: number;
  activo: boolean;
  // Control horario (heredable por empleados)
  turnoDefectoId?: mongoose.Types.ObjectId;
  calendarioLaboralId?: mongoose.Types.ObjectId;
  toleranciaRetrasoMinutos?: number;
  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion: Date;
}

// ============================================
// SCHEMA
// ============================================

const DepartamentoSchema = new Schema<IDepartamento>(
  {
    codigo: {
      type: String,
      required: [true, 'El código es requerido'],
      trim: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    responsableId: {
      type: Schema.Types.ObjectId,
      ref: 'Personal',
    },
    responsableNombre: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    // Control horario (heredable por empleados)
    turnoDefectoId: {
      type: Schema.Types.ObjectId,
      ref: 'Turno',
    },
    calendarioLaboralId: {
      type: Schema.Types.ObjectId,
      ref: 'CalendarioLaboral',
    },
    toleranciaRetrasoMinutos: {
      type: Number,
      min: 0,
      max: 60,
      default: 5,
    },
    // Auditoría
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaModificacion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: 'fechaCreacion',
      updatedAt: 'fechaModificacion',
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// ÍNDICES
// ============================================

DepartamentoSchema.index({ codigo: 1 }, { unique: true });
DepartamentoSchema.index({ nombre: 1 });
DepartamentoSchema.index({ activo: 1 });
DepartamentoSchema.index({ orden: 1 });

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

DepartamentoSchema.statics.generarCodigo = async function (): Promise<string> {
  const ultimo = await this.findOne({}, {}, { sort: { codigo: -1 } });
  if (!ultimo) {
    return 'DEP001';
  }

  const match = ultimo.codigo.match(/DEP(\d+)/);
  if (match) {
    const numero = parseInt(match[1]) + 1;
    return `DEP${numero.toString().padStart(3, '0')}`;
  }

  return `DEP${Date.now().toString().slice(-3)}`;
};

// ============================================
// OBTENER MODELO
// ============================================

// Cache de modelos por empresa
const modelCache: Map<string, Model<IDepartamento>> = new Map();

export async function getModeloDepartamento(
  empresaId: mongoose.Types.ObjectId,
  dbConfig: IDatabaseConfig
): Promise<Model<IDepartamento>> {
  const cacheKey = `${empresaId.toString()}_Departamento`;

  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey)!;
  }

  // Obtener la conexión real usando el databaseManager
  const connection = await databaseManager.getEmpresaConnection(
    empresaId.toString(),
    dbConfig
  );

  // Verificar si el modelo ya existe en la conexión
  if (connection.models['Departamento']) {
    const model = connection.models['Departamento'] as Model<IDepartamento>;
    modelCache.set(cacheKey, model);
    return model;
  }

  // Crear nuevo modelo
  const model = connection.model<IDepartamento>('Departamento', DepartamentoSchema);
  modelCache.set(cacheKey, model);

  return model;
}

export default DepartamentoSchema;
