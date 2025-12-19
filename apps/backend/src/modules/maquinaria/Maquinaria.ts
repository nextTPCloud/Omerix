import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoMaquinaria {
  VEHICULO = 'vehiculo',
  MAQUINARIA = 'maquinaria',
  HERRAMIENTA = 'herramienta',
  EQUIPO = 'equipo',
}

export enum EstadoMaquinaria {
  DISPONIBLE = 'disponible',
  EN_USO = 'en_uso',
  MANTENIMIENTO = 'mantenimiento',
  BAJA = 'baja',
}

// ============================================
// INTERFACES
// ============================================

export interface IMantenimiento {
  _id?: Types.ObjectId;
  fecha: Date;
  tipo: 'preventivo' | 'correctivo' | 'revision';
  descripcion: string;
  coste?: number;
  kmEnMantenimiento?: number;
  horasEnMantenimiento?: number;
  proximoMantenimientoKm?: number;
  proximoMantenimientoHoras?: number;
  proximoMantenimientoFecha?: Date;
  realizadoPor?: string;
  observaciones?: string;
}

export interface IMaquinaria extends Document {
  _id: Types.ObjectId;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoMaquinaria;

  // Datos especificos de vehiculo
  matricula?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  numeroSerie?: string;

  // Estado
  estado: EstadoMaquinaria;
  ubicacionActual?: string;

  // Tarifas
  tarifaHoraCoste: number;
  tarifaHoraVenta: number;
  tarifaDiaCoste?: number;
  tarifaDiaVenta?: number;
  tarifaKmCoste?: number;
  tarifaKmVenta?: number;

  // Contadores
  kmActuales?: number;
  horasUso?: number;

  // Mantenimiento
  proximoMantenimientoFecha?: Date;
  proximoMantenimientoKm?: number;
  proximoMantenimientoHoras?: number;
  historialMantenimientos?: IMantenimiento[];

  // Documentacion
  fechaITV?: Date;
  fechaSeguro?: Date;
  polizaSeguro?: string;

  // Imagen
  imagen?: string;

  // Metadatos
  orden: number;
  activo: boolean;
  observaciones?: string;

  // Auditoria
  creadoPor?: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const MantenimientoSchema = new Schema<IMantenimiento>(
  {
    fecha: {
      type: Date,
      required: true,
    },
    tipo: {
      type: String,
      enum: ['preventivo', 'correctivo', 'revision'],
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    coste: Number,
    kmEnMantenimiento: Number,
    horasEnMantenimiento: Number,
    proximoMantenimientoKm: Number,
    proximoMantenimientoHoras: Number,
    proximoMantenimientoFecha: Date,
    realizadoPor: String,
    observaciones: String,
  },
  { _id: true }
);

const MaquinariaSchema = new Schema<IMaquinaria>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    codigo: {
      type: String,
      required: [true, 'El codigo es obligatorio'],
      trim: true,
      uppercase: true,
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
      enum: Object.values(TipoMaquinaria),
      required: [true, 'El tipo es obligatorio'],
      default: TipoMaquinaria.MAQUINARIA,
    },

    // Datos vehiculo
    matricula: {
      type: String,
      trim: true,
      uppercase: true,
    },
    marca: {
      type: String,
      trim: true,
    },
    modelo: {
      type: String,
      trim: true,
    },
    anio: {
      type: Number,
      min: 1900,
      max: 2100,
    },
    numeroSerie: {
      type: String,
      trim: true,
    },

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoMaquinaria),
      default: EstadoMaquinaria.DISPONIBLE,
    },
    ubicacionActual: {
      type: String,
      trim: true,
    },

    // Tarifas
    tarifaHoraCoste: {
      type: Number,
      default: 0,
      min: 0,
    },
    tarifaHoraVenta: {
      type: Number,
      default: 0,
      min: 0,
    },
    tarifaDiaCoste: {
      type: Number,
      min: 0,
    },
    tarifaDiaVenta: {
      type: Number,
      min: 0,
    },
    tarifaKmCoste: {
      type: Number,
      min: 0,
    },
    tarifaKmVenta: {
      type: Number,
      min: 0,
    },

    // Contadores
    kmActuales: {
      type: Number,
      min: 0,
    },
    horasUso: {
      type: Number,
      min: 0,
    },

    // Mantenimiento
    proximoMantenimientoFecha: Date,
    proximoMantenimientoKm: Number,
    proximoMantenimientoHoras: Number,
    historialMantenimientos: [MantenimientoSchema],

    // Documentacion
    fechaITV: Date,
    fechaSeguro: Date,
    polizaSeguro: String,

    // Imagen
    imagen: String,

    // Metadatos
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    observaciones: {
      type: String,
      trim: true,
    },

    // Auditoria
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDICES
// ============================================

// Codigo unico
MaquinariaSchema.index({ codigo: 1 }, { unique: true });

// Busquedas comunes
MaquinariaSchema.index({ activo: 1 });
MaquinariaSchema.index({ tipo: 1 });
MaquinariaSchema.index({ estado: 1 });
MaquinariaSchema.index({ matricula: 1 });
MaquinariaSchema.index({ orden: 1 });

// Indice de texto para busqueda
MaquinariaSchema.index({
  nombre: 'text',
  descripcion: 'text',
  codigo: 'text',
  matricula: 'text',
  marca: 'text',
  modelo: 'text',
});

// ============================================
// VIRTUALS
// ============================================

// Virtual para obtener etiqueta del tipo
MaquinariaSchema.virtual('tipoLabel').get(function() {
  const labels: Record<string, string> = {
    vehiculo: 'Vehiculo',
    maquinaria: 'Maquinaria',
    herramienta: 'Herramienta',
    equipo: 'Equipo',
  };
  return labels[this.tipo] || this.tipo;
});

// Virtual para obtener etiqueta del estado
MaquinariaSchema.virtual('estadoLabel').get(function() {
  const labels: Record<string, string> = {
    disponible: 'Disponible',
    en_uso: 'En uso',
    mantenimiento: 'En mantenimiento',
    baja: 'Baja',
  };
  return labels[this.estado] || this.estado;
});

// Virtual para verificar si necesita mantenimiento
MaquinariaSchema.virtual('necesitaMantenimiento').get(function() {
  const ahora = new Date();

  if (this.proximoMantenimientoFecha && this.proximoMantenimientoFecha <= ahora) {
    return true;
  }

  if (this.proximoMantenimientoKm && this.kmActuales && this.kmActuales >= this.proximoMantenimientoKm) {
    return true;
  }

  if (this.proximoMantenimientoHoras && this.horasUso && this.horasUso >= this.proximoMantenimientoHoras) {
    return true;
  }

  return false;
});

// Virtual para verificar si documentacion esta vencida
MaquinariaSchema.virtual('documentacionVencida').get(function() {
  const ahora = new Date();
  return (this.fechaITV && this.fechaITV < ahora) || (this.fechaSeguro && this.fechaSeguro < ahora);
});

MaquinariaSchema.set('toJSON', { virtuals: true });
MaquinariaSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT
// ============================================

export const Maquinaria = mongoose.model<IMaquinaria>('Maquinaria', MaquinariaSchema);
