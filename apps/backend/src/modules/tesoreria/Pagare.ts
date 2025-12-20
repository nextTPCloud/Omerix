import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoPagare {
  EMITIDO = 'emitido',     // Pagaré que emitimos (pago a proveedor)
  RECIBIDO = 'recibido',   // Pagaré que recibimos (cobro de cliente)
}

export enum EstadoPagare {
  PENDIENTE = 'pendiente',
  EN_CARTERA = 'en_cartera',
  COBRADO = 'cobrado',      // Para pagarés recibidos
  PAGADO = 'pagado',        // Para pagarés emitidos
  DEVUELTO = 'devuelto',
  ANULADO = 'anulado',
}

export enum TipoDocumentoOrigenPagare {
  FACTURA_VENTA = 'factura_venta',
  FACTURA_COMPRA = 'factura_compra',
  VENCIMIENTO = 'vencimiento',
  MANUAL = 'manual',
}

// ============================================
// INTERFACES
// ============================================

export interface IHistorialPagare {
  fecha: Date;
  estadoAnterior: EstadoPagare;
  estadoNuevo: EstadoPagare;
  usuarioId: Types.ObjectId;
  usuarioNombre?: string;
  observaciones?: string;
}

export interface IPagare extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;
  numero: string;                    // Número interno: PAG-E-0001 o PAG-R-0001
  tipo: TipoPagare;

  // Datos del documento origen
  documentoOrigen: {
    tipo: TipoDocumentoOrigenPagare;
    id?: Types.ObjectId;
    numero?: string;
  };

  // Vencimiento asociado (si viene de un vencimiento)
  vencimientoId?: Types.ObjectId;

  // Tercero (cliente o proveedor)
  terceroId: Types.ObjectId;
  terceroTipo: 'cliente' | 'proveedor';
  terceroNombre: string;
  terceroNif?: string;

  // Datos del pagaré
  numeroPagare?: string;             // Número impreso en el pagaré físico
  importe: number;
  fechaEmision: Date;
  fechaVencimiento: Date;

  // Datos bancarios
  bancoEmisor?: string;
  cuentaOrigen?: string;             // IBAN origen
  cuentaDestino?: string;            // IBAN destino

  // Estado y gestión
  estado: EstadoPagare;
  fechaCobro?: Date;
  fechaDevolucion?: Date;
  motivoDevolucion?: string;
  comisionDevolucion?: number;

  // Remesa asociada
  remesaId?: Types.ObjectId;
  remesaNumero?: string;

  // Historial de cambios de estado
  historial: IHistorialPagare[];

  // Metadata
  observaciones?: string;
  creadoPor: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const HistorialPagareSchema = new Schema<IHistorialPagare>({
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
  },
  estadoAnterior: {
    type: String,
    enum: Object.values(EstadoPagare),
    required: true,
  },
  estadoNuevo: {
    type: String,
    enum: Object.values(EstadoPagare),
    required: true,
  },
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  usuarioNombre: {
    type: String,
    trim: true,
  },
  observaciones: {
    type: String,
    trim: true,
  },
}, { _id: true });

const PagareSchema = new Schema<IPagare>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    empresaId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    numero: {
      type: String,
      required: [true, 'El número es obligatorio'],
      trim: true,
      uppercase: true,
    },
    tipo: {
      type: String,
      enum: Object.values(TipoPagare),
      required: [true, 'El tipo es obligatorio'],
    },

    // Documento origen
    documentoOrigen: {
      tipo: {
        type: String,
        enum: Object.values(TipoDocumentoOrigenPagare),
        required: true,
        default: TipoDocumentoOrigenPagare.MANUAL,
      },
      id: {
        type: Schema.Types.ObjectId,
      },
      numero: {
        type: String,
        trim: true,
      },
    },

    // Vencimiento asociado
    vencimientoId: {
      type: Schema.Types.ObjectId,
      ref: 'Vencimiento',
    },

    // Tercero
    terceroId: {
      type: Schema.Types.ObjectId,
      required: [true, 'El tercero es obligatorio'],
    },
    terceroTipo: {
      type: String,
      enum: ['cliente', 'proveedor'],
      required: [true, 'El tipo de tercero es obligatorio'],
    },
    terceroNombre: {
      type: String,
      required: [true, 'El nombre del tercero es obligatorio'],
      trim: true,
    },
    terceroNif: {
      type: String,
      trim: true,
    },

    // Datos del pagaré
    numeroPagare: {
      type: String,
      trim: true,
    },
    importe: {
      type: Number,
      required: [true, 'El importe es obligatorio'],
      min: [0.01, 'El importe debe ser mayor que 0'],
    },
    fechaEmision: {
      type: Date,
      required: [true, 'La fecha de emisión es obligatoria'],
    },
    fechaVencimiento: {
      type: Date,
      required: [true, 'La fecha de vencimiento es obligatoria'],
    },

    // Datos bancarios
    bancoEmisor: {
      type: String,
      trim: true,
    },
    cuentaOrigen: {
      type: String,
      trim: true,
    },
    cuentaDestino: {
      type: String,
      trim: true,
    },

    // Estado y gestión
    estado: {
      type: String,
      enum: Object.values(EstadoPagare),
      default: EstadoPagare.PENDIENTE,
    },
    fechaCobro: {
      type: Date,
    },
    fechaDevolucion: {
      type: Date,
    },
    motivoDevolucion: {
      type: String,
      trim: true,
    },
    comisionDevolucion: {
      type: Number,
      min: 0,
    },

    // Remesa
    remesaId: {
      type: Schema.Types.ObjectId,
    },
    remesaNumero: {
      type: String,
      trim: true,
    },

    // Historial
    historial: {
      type: [HistorialPagareSchema],
      default: [],
    },

    // Metadata
    observaciones: {
      type: String,
      trim: true,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
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
// ÍNDICES
// ============================================

// Número único por empresa
PagareSchema.index({ empresaId: 1, numero: 1 }, { unique: true });

// Búsquedas comunes
PagareSchema.index({ empresaId: 1, tipo: 1, estado: 1 });
PagareSchema.index({ empresaId: 1, fechaVencimiento: 1 });
PagareSchema.index({ empresaId: 1, terceroId: 1, terceroTipo: 1 });
PagareSchema.index({ vencimientoId: 1 });
PagareSchema.index({ remesaId: 1 });

// Índice de texto para búsqueda
PagareSchema.index({
  numero: 'text',
  terceroNombre: 'text',
  numeroPagare: 'text',
});

// ============================================
// VIRTUALS
// ============================================

// Días hasta vencimiento (negativo si ya venció)
PagareSchema.virtual('diasHastaVencimiento').get(function() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(this.fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const diff = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Está vencido
PagareSchema.virtual('estaVencido').get(function() {
  if (this.estado === EstadoPagare.COBRADO ||
      this.estado === EstadoPagare.PAGADO ||
      this.estado === EstadoPagare.ANULADO) {
    return false;
  }
  return new Date() > new Date(this.fechaVencimiento);
});

// Labels
PagareSchema.virtual('estadoLabel').get(function() {
  const labels: Record<string, string> = {
    [EstadoPagare.PENDIENTE]: 'Pendiente',
    [EstadoPagare.EN_CARTERA]: 'En cartera',
    [EstadoPagare.COBRADO]: 'Cobrado',
    [EstadoPagare.PAGADO]: 'Pagado',
    [EstadoPagare.DEVUELTO]: 'Devuelto',
    [EstadoPagare.ANULADO]: 'Anulado',
  };
  return labels[this.estado] || this.estado;
});

PagareSchema.virtual('tipoLabel').get(function() {
  return this.tipo === TipoPagare.EMITIDO ? 'Emitido' : 'Recibido';
});

PagareSchema.set('toJSON', { virtuals: true });
PagareSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT
// ============================================

export const Pagare = mongoose.model<IPagare>('Pagare', PagareSchema);

// Factory para modelo dinámico por empresa
export function createPagareModel(connection: mongoose.Connection): Model<IPagare> {
  return connection.model<IPagare>('Pagare', PagareSchema);
}
