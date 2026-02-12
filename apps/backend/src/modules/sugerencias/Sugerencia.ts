import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoSugerencia {
  COMPLEMENTARIO = 'complementario',     // Sugerir con otro producto
  UPGRADE = 'upgrade',                   // Mejora de producto
  ALTERNATIVA = 'alternativa',           // Alternativa similar
  ACOMPANAMIENTO = 'acompanamiento',     // Acompañamiento
  POSTRE = 'postre',                     // Sugerir postre
  BEBIDA = 'bebida',                     // Sugerir bebida
}

export enum MomentoSugerencia {
  AL_AGREGAR = 'al_agregar',             // Al agregar el producto base
  AL_FINALIZAR = 'al_finalizar',         // Al finalizar el pedido
  AUTOMATICO = 'automatico',             // Según hora del día
}

// ============================================
// INTERFACES
// ============================================

export interface ICondicionHoraria {
  horaInicio: string;  // HH:mm
  horaFin: string;
  diasSemana: number[]; // 0-6 (domingo-sábado)
  activo: boolean;
}

export interface ISugerencia extends Document {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  descripcion?: string;
  tipo: TipoSugerencia;
  momento: MomentoSugerencia;

  // Producto base que activa la sugerencia
  productoBaseId?: mongoose.Types.ObjectId;
  familiaBaseId?: mongoose.Types.ObjectId;  // O toda una familia

  // Producto(s) a sugerir
  productosSugeridos: {
    productoId: mongoose.Types.ObjectId;
    orden: number;
    descuento?: number;           // Descuento si se acepta
    textoPersonalizado?: string;  // Texto de la sugerencia
  }[];

  // Condiciones
  condicionHoraria?: ICondicionHoraria;
  activo: boolean;
  prioridad: number;              // Mayor número = más prioritario

  // Estadísticas
  vecesVista: number;
  vecesAceptada: number;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const CondicionHorariaSchema = new Schema<ICondicionHoraria>({
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  diasSemana: [{ type: Number, min: 0, max: 6 }],
  activo: { type: Boolean, default: true },
}, { _id: false });

const ProductoSugeridoSchema = new Schema({
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: true,
  },
  orden: { type: Number, default: 0 },
  descuento: { type: Number, min: 0, max: 100 },
  textoPersonalizado: String,
}, { _id: false });

const SugerenciaSchema = new Schema<ISugerencia>(
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
    descripcion: {
      type: String,
      trim: true,
    },
    tipo: {
      type: String,
      enum: Object.values(TipoSugerencia),
      required: true,
    },
    momento: {
      type: String,
      enum: Object.values(MomentoSugerencia),
      default: MomentoSugerencia.AL_AGREGAR,
    },
    productoBaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      index: true,
    },
    familiaBaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Familia',
      index: true,
    },
    productosSugeridos: {
      type: [ProductoSugeridoSchema],
      default: [],
      validate: {
        validator: function(v: any[]) {
          return v.length > 0;
        },
        message: 'Debe haber al menos un producto sugerido',
      },
    },
    condicionHoraria: CondicionHorariaSchema,
    activo: {
      type: Boolean,
      default: true,
    },
    prioridad: {
      type: Number,
      default: 0,
    },
    vecesVista: {
      type: Number,
      default: 0,
    },
    vecesAceptada: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// ÍNDICES
// ============================================

SugerenciaSchema.index({ activo: 1, prioridad: -1 });
SugerenciaSchema.index({ productoBaseId: 1, activo: 1 });
SugerenciaSchema.index({ familiaBaseId: 1, activo: 1 });
SugerenciaSchema.index({ tipo: 1, activo: 1 });

// ============================================
// VIRTUALS
// ============================================

SugerenciaSchema.virtual('tasaAceptacion').get(function() {
  if (this.vecesVista === 0) return 0;
  return Math.round((this.vecesAceptada / this.vecesVista) * 100);
});

// ============================================
// CONFIGURACIÓN JSON
// ============================================

SugerenciaSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

// ============================================
// EXPORTAR
// ============================================

export const Sugerencia = mongoose.model<ISugerencia>('Sugerencia', SugerenciaSchema);
export default Sugerencia;
