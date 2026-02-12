import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoCamarero {
  ACTIVO = 'activo',
  EN_DESCANSO = 'en_descanso',
  FUERA_TURNO = 'fuera_turno',
  INACTIVO = 'inactivo',
}

// ============================================
// INTERFACES
// ============================================

export interface ITurno {
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaInicio: string; // HH:mm
  horaFin: string;
  activo: boolean;
}

export interface IEstadisticasCamarero {
  ventasHoy: number;
  propinasHoy: number;
  mesasAtendidas: number;
  tiempoMedioServicio: number; // en minutos
}

export interface ICamarero extends Document {
  _id: mongoose.Types.ObjectId;
  usuarioId: mongoose.Types.ObjectId;
  personalId?: mongoose.Types.ObjectId; // Vinculación con Personal RRHH
  nombre: string;
  apellidos?: string;
  alias?: string; // Nombre corto para mostrar en comandas
  codigo: string; // Código único del camarero
  pin?: string; // PIN para comanderos
  color?: string; // Color para identificación visual
  foto?: string;

  // Asignaciones
  salonesAsignados: mongoose.Types.ObjectId[];
  mesasAsignadas?: mongoose.Types.ObjectId[];
  zonasPreparacion?: mongoose.Types.ObjectId[]; // Para KDS

  // Estado y turnos
  estado: EstadoCamarero;
  turnos: ITurno[];
  turnosRRHHIds?: mongoose.Types.ObjectId[]; // Turnos de RRHH vinculados

  // Comisiones
  comisionPorcentaje?: number; // Comisión sobre ventas
  propinasAcumuladas: number;

  // Permisos específicos
  permisos: {
    puedeAnularLineas: boolean;
    puedeAplicarDescuentos: boolean;
    puedeCobrar: boolean;
    puedeReimprimir: boolean;
    puedeTraspasar: boolean; // Traspasar mesas a otro camarero
    limiteDescuento?: number; // Porcentaje máximo de descuento
  };

  // Configuración de dispositivo
  dispositivoAsignado?: string; // ID del comandero/tablet asignado

  // Estadísticas (calculadas)
  estadisticas?: IEstadisticasCamarero;

  // Auditoría
  activo: boolean;
  fechaAlta: Date;
  fechaBaja?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const TurnoSchema = new Schema<ITurno>({
  dia: {
    type: String,
    enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
    required: true,
  },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  activo: { type: Boolean, default: true },
}, { _id: false });

const PermisosSchema = new Schema({
  puedeAnularLineas: { type: Boolean, default: false },
  puedeAplicarDescuentos: { type: Boolean, default: true },
  puedeCobrar: { type: Boolean, default: true },
  puedeReimprimir: { type: Boolean, default: true },
  puedeTraspasar: { type: Boolean, default: true },
  limiteDescuento: { type: Number, min: 0, max: 100 },
}, { _id: false });

const CamareroSchema = new Schema<ICamarero>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      index: true,
    },
    personalId: {
      type: Schema.Types.ObjectId,
      ref: 'Personal',
      sparse: true,
      index: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    apellidos: {
      type: String,
      trim: true,
    },
    alias: {
      type: String,
      trim: true,
      maxlength: 10,
    },
    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      uppercase: true,
      trim: true,
    },
    pin: {
      type: String,
      select: false,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    foto: String,

    // Asignaciones
    salonesAsignados: [{
      type: Schema.Types.ObjectId,
      ref: 'Salon',
    }],
    mesasAsignadas: [{
      type: Schema.Types.ObjectId,
      ref: 'Mesa',
    }],
    zonasPreparacion: [{
      type: Schema.Types.ObjectId,
      ref: 'ZonaPreparacion',
    }],

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoCamarero),
      default: EstadoCamarero.FUERA_TURNO,
    },
    turnos: {
      type: [TurnoSchema],
      default: [],
    },
    turnosRRHHIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Turno',
    }],

    // Comisiones
    comisionPorcentaje: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    propinasAcumuladas: {
      type: Number,
      default: 0,
    },

    // Permisos
    permisos: {
      type: PermisosSchema,
      default: () => ({
        puedeAnularLineas: false,
        puedeAplicarDescuentos: true,
        puedeCobrar: true,
        puedeReimprimir: true,
        puedeTraspasar: true,
      }),
    },

    // Dispositivo
    dispositivoAsignado: String,

    // Estado
    activo: {
      type: Boolean,
      default: true,
    },
    fechaAlta: {
      type: Date,
      default: Date.now,
    },
    fechaBaja: Date,
  },
  {
    timestamps: true,
  }
);

// ============================================
// ÍNDICES
// ============================================

CamareroSchema.index({ usuarioId: 1 }, { unique: true, sparse: true });
CamareroSchema.index({ codigo: 1 });
CamareroSchema.index({ estado: 1 });
CamareroSchema.index({ activo: 1 });
CamareroSchema.index({ salonesAsignados: 1 });

// ============================================
// VIRTUALS
// ============================================

CamareroSchema.virtual('nombreCompleto').get(function() {
  return this.apellidos ? `${this.nombre} ${this.apellidos}` : this.nombre;
});

CamareroSchema.virtual('nombreCorto').get(function() {
  return this.alias || this.nombre.split(' ')[0];
});

// ============================================
// CONFIGURACIÓN JSON
// ============================================

CamareroSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.pin;
    return ret;
  },
});

CamareroSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR
// ============================================

export const Camarero = mongoose.model<ICamarero>('Camarero', CamareroSchema);
export default Camarero;
