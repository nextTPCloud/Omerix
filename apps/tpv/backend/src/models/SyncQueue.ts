// ===========================================
// MODELO COLA DE SINCRONIZACIÓN TPV
// ===========================================

import mongoose, { Schema, Document } from 'mongoose';

// Tipos
export type TipoEntidadSync = 'venta' | 'caja' | 'movimiento' | 'verifactu';
export type OperacionSync = 'crear' | 'actualizar' | 'eliminar';
export type EstadoItemSync = 'pendiente' | 'procesando' | 'completado' | 'error';

export interface ISyncQueue extends Document {
  entidad: TipoEntidadSync;
  entidadId: mongoose.Types.ObjectId;
  operacion: OperacionSync;
  datos: any;
  estado: EstadoItemSync;
  intentos: number;
  maxIntentos: number;
  ultimoIntento?: Date;
  proximoIntento?: Date;
  error?: string;
  respuestaServidor?: any;
  createdAt: Date;
  updatedAt: Date;
}

const SyncQueueSchema = new Schema<ISyncQueue>(
  {
    entidad: {
      type: String,
      enum: ['venta', 'caja', 'movimiento', 'verifactu'],
      required: true,
    },
    entidadId: { type: Schema.Types.ObjectId, required: true },
    operacion: {
      type: String,
      enum: ['crear', 'actualizar', 'eliminar'],
      required: true,
    },
    datos: { type: Schema.Types.Mixed, required: true },
    estado: {
      type: String,
      enum: ['pendiente', 'procesando', 'completado', 'error'],
      default: 'pendiente',
    },
    intentos: { type: Number, default: 0 },
    maxIntentos: { type: Number, default: 5 },
    ultimoIntento: { type: Date },
    proximoIntento: { type: Date },
    error: { type: String },
    respuestaServidor: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Índices para procesar la cola eficientemente
SyncQueueSchema.index({ estado: 1, proximoIntento: 1 });
SyncQueueSchema.index({ entidad: 1, entidadId: 1 });

// Método para calcular próximo intento con backoff exponencial
SyncQueueSchema.methods.calcularProximoIntento = function (): Date {
  const baseDelay = 30000; // 30 segundos
  const delay = baseDelay * Math.pow(2, this.intentos);
  const maxDelay = 3600000; // 1 hora máximo
  return new Date(Date.now() + Math.min(delay, maxDelay));
};

export const SyncQueue = mongoose.model<ISyncQueue>('SyncQueue', SyncQueueSchema);
