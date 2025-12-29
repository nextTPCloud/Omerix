import mongoose, { Schema, Document } from 'mongoose';

export interface ISesionTPV extends Document {
  _id: mongoose.Types.ObjectId;
  // empresaId ya no es necesario - cada empresa tiene su propia BD
  usuarioId: mongoose.Types.ObjectId;
  tpvId: mongoose.Types.ObjectId;

  // Sesion
  inicioSesion: Date;
  ultimaActividad: Date;
  activa: boolean;

  // Para detectar sesiones zombies
  heartbeatUltimo: Date;       // Ping cada 30 segundos

  // Caja asociada (si hay una abierta)
  cajaId?: mongoose.Types.ObjectId;

  // Metadata
  ip: string;
  tpvNombre: string;
  usuarioNombre: string;

  // Fin de sesion
  finSesion?: Date;
  motivoFin?: 'logout' | 'timeout' | 'forzado' | 'error';

  createdAt: Date;
  updatedAt: Date;
}

const SesionTPVSchema = new Schema<ISesionTPV>(
  {
    // empresaId ya no es necesario - cada empresa tiene su propia BD
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    tpvId: {
      type: Schema.Types.ObjectId,
      ref: 'TPVRegistrado',
      required: true,
    },
    inicioSesion: {
      type: Date,
      default: Date.now,
    },
    ultimaActividad: {
      type: Date,
      default: Date.now,
    },
    activa: {
      type: Boolean,
      default: true,
      index: true,
    },
    heartbeatUltimo: {
      type: Date,
      default: Date.now,
      index: true,
    },
    cajaId: {
      type: Schema.Types.ObjectId,
      ref: 'Caja',
    },
    ip: {
      type: String,
      required: true,
    },
    tpvNombre: {
      type: String,
      required: true,
    },
    usuarioNombre: {
      type: String,
      required: true,
    },
    finSesion: Date,
    motivoFin: {
      type: String,
      enum: ['logout', 'timeout', 'forzado', 'error'],
    },
  },
  {
    timestamps: true,
  }
);

// Indices para consultas frecuentes - Ya no necesitan empresaId
SesionTPVSchema.index({ activa: 1, heartbeatUltimo: 1 });
SesionTPVSchema.index({ tpvId: 1, activa: 1 });
SesionTPVSchema.index({ usuarioId: 1, activa: 1 });

// Metodo para verificar si la sesion esta activa (heartbeat reciente)
SesionTPVSchema.methods.isReallyActive = function (): boolean {
  if (!this.activa) return false;

  const ahora = new Date();
  const diff = ahora.getTime() - this.heartbeatUltimo.getTime();
  const TIMEOUT_MS = 60000; // 60 segundos

  return diff < TIMEOUT_MS;
};

// Exportar el schema para modelos dinamicos (NO exportar modelo para evitar colecciones en BD principal)
export { SesionTPVSchema };

// NO exportar modelo por defecto - solo se usa via dynamic-models.helper.ts
// Si se necesita compatibilidad temporal, usar el helper getSesionTPVModel
