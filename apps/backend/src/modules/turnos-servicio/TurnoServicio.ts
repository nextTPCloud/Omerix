import mongoose, { Schema, Document } from 'mongoose';

export interface ITurnoServicio extends Document {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  codigo: string;
  horaInicio: string; // HH:mm
  horaFin: string;
  diasSemana: ('lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo')[];
  salonesIds: mongoose.Types.ObjectId[];
  maxCamareros?: number;
  activo: boolean;
  color?: string;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TurnoServicioSchema = new Schema<ITurnoServicio>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    codigo: {
      type: String,
      required: [true, 'El codigo es obligatorio'],
      uppercase: true,
      trim: true,
    },
    horaInicio: {
      type: String,
      required: [true, 'La hora de inicio es obligatoria'],
    },
    horaFin: {
      type: String,
      required: [true, 'La hora de fin es obligatoria'],
    },
    diasSemana: [{
      type: String,
      enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    }],
    salonesIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Salon',
    }],
    maxCamareros: {
      type: Number,
      min: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    descripcion: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

TurnoServicioSchema.index({ codigo: 1 });
TurnoServicioSchema.index({ activo: 1 });

TurnoServicioSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const TurnoServicio = mongoose.model<ITurnoServicio>('TurnoServicio', TurnoServicioSchema);
export default TurnoServicio;
