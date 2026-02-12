import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoReserva {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  EN_CURSO = 'en_curso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  NO_SHOW = 'no_show',
}

export enum OrigenReserva {
  TELEFONO = 'telefono',
  WEB = 'web',
  APP = 'app',
  PRESENCIAL = 'presencial',
  THEFORK = 'thefork',
  GOOGLE = 'google',
  RESTOO = 'restoo',
}

// ============================================
// INTERFACES
// ============================================

export interface IReserva extends Document {
  _id: mongoose.Types.ObjectId;

  // Cliente
  clienteId?: mongoose.Types.ObjectId;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;

  // Reserva
  fecha: Date;
  horaInicio: string; // HH:mm
  horaFin?: string;
  duracionMinutos: number;
  comensales: number;

  // Asignación
  salonId?: mongoose.Types.ObjectId;
  mesasIds: mongoose.Types.ObjectId[];
  camareroId?: mongoose.Types.ObjectId;

  // Estado
  estado: EstadoReserva;
  origen: OrigenReserva;

  // Notas
  notas?: string;
  notasInternas?: string;
  ocasionEspecial?: string; // cumpleaños, aniversario, etc.
  peticionesEspeciales?: string;

  // Historial
  confirmadaEn?: Date;
  canceladaEn?: Date;
  motivoCancelacion?: string;
  llegadaReal?: Date;

  // Integración Restoo
  restooReservaId?: string;

  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const ReservaSchema = new Schema<IReserva>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    // Cliente
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
      index: true,
    },
    clienteNombre: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
    },
    clienteTelefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      trim: true,
    },
    clienteEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Reserva
    fecha: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
      index: true,
    },
    horaInicio: {
      type: String,
      required: [true, 'La hora de inicio es obligatoria'],
    },
    horaFin: String,
    duracionMinutos: {
      type: Number,
      default: 90,
      min: 30,
    },
    comensales: {
      type: Number,
      required: [true, 'El número de comensales es obligatorio'],
      min: 1,
    },

    // Asignación
    salonId: {
      type: Schema.Types.ObjectId,
      ref: 'Salon',
      index: true,
    },
    mesasIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Mesa',
    }],
    camareroId: {
      type: Schema.Types.ObjectId,
      ref: 'Camarero',
    },

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoReserva),
      default: EstadoReserva.PENDIENTE,
      index: true,
    },
    origen: {
      type: String,
      enum: Object.values(OrigenReserva),
      default: OrigenReserva.TELEFONO,
    },

    // Notas
    notas: String,
    notasInternas: String,
    ocasionEspecial: String,
    peticionesEspeciales: String,

    // Historial
    confirmadaEn: Date,
    canceladaEn: Date,
    motivoCancelacion: String,
    llegadaReal: Date,

    // Integración Restoo
    restooReservaId: {
      type: String,
      index: true,
      sparse: true,
    },

    // Auditoría
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// ÍNDICES
// ============================================

ReservaSchema.index({ fecha: 1, horaInicio: 1 });
ReservaSchema.index({ fecha: 1, estado: 1 });
ReservaSchema.index({ clienteTelefono: 1 });
ReservaSchema.index({ salonId: 1, fecha: 1 });
ReservaSchema.index({ mesasIds: 1, fecha: 1 });

// ============================================
// MÉTODOS Y VIRTUALS
// ============================================

ReservaSchema.virtual('horaFinCalculada').get(function() {
  if (this.horaFin) return this.horaFin;

  const [horas, minutos] = this.horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + this.duracionMinutos;
  const horasFin = Math.floor(totalMinutos / 60) % 24;
  const minutosFin = totalMinutos % 60;

  return `${horasFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
});

// ============================================
// CONFIGURACIÓN JSON
// ============================================

ReservaSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

// ============================================
// EXPORTAR
// ============================================

export const Reserva = mongoose.model<IReserva>('Reserva', ReservaSchema);
export default Reserva;
