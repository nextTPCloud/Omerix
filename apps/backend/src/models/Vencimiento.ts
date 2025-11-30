import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoVencimiento {
  COBRO = 'cobro',
  PAGO = 'pago',
}

export enum EstadoVencimiento {
  PENDIENTE = 'pendiente',
  PARCIAL = 'parcial',
  COBRADO = 'cobrado',        // Para cobros
  PAGADO = 'pagado',          // Para pagos
  IMPAGADO = 'impagado',
  ANULADO = 'anulado',
}

export enum TipoDocumentoOrigen {
  FACTURA_VENTA = 'factura_venta',
  FACTURA_COMPRA = 'factura_compra',
  MANUAL = 'manual',
}

// ============================================
// INTERFACES
// ============================================

export interface ICobroParcial {
  fecha: Date;
  importe: number;
  formaPagoId?: Types.ObjectId;
  referencia?: string;          // Referencia del cobro/pago
  observaciones?: string;
}

export interface IVencimiento extends Document {
  _id: Types.ObjectId;
  tipo: TipoVencimiento;
  numero: string;               // Número secuencial: VEN-C-0001 o VEN-P-0001

  // Documento origen
  documentoOrigen: TipoDocumentoOrigen;
  documentoId?: Types.ObjectId; // ID de la factura
  documentoNumero?: string;     // Número de la factura

  // Tercero (cliente o proveedor)
  clienteId?: Types.ObjectId;
  proveedorId?: Types.ObjectId;
  terceroNombre: string;        // Nombre del cliente/proveedor (denormalizado)
  terceroNif?: string;

  // Importes
  importe: number;              // Importe del vencimiento
  importeCobrado: number;       // Importe ya cobrado/pagado
  importePendiente: number;     // Calculado: importe - importeCobrado

  // Fechas
  fechaEmision: Date;           // Fecha de la factura
  fechaVencimiento: Date;       // Fecha en que vence
  fechaCobro?: Date;            // Fecha de cobro/pago completo

  // Forma de pago
  formaPagoId?: Types.ObjectId;
  formaPagoNombre?: string;     // Denormalizado

  // Cuenta bancaria
  cuentaBancariaId?: Types.ObjectId;
  iban?: string;                // Denormalizado

  // Remesa/Cartera
  remesaId?: Types.ObjectId;    // Para agrupar en remesas bancarias
  remesaNumero?: string;
  fechaRemesa?: Date;

  // Estado y gestión
  estado: EstadoVencimiento;
  diasVencido: number;          // Virtual: días desde vencimiento

  // Cobros parciales
  cobrosParciales: ICobroParcial[];

  // Metadata
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const CobroParcialSchema = new Schema<ICobroParcial>({
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
  },
  importe: {
    type: Number,
    required: true,
    min: 0.01,
  },
  formaPagoId: {
    type: Schema.Types.ObjectId,
    ref: 'FormaPago',
  },
  referencia: {
    type: String,
    trim: true,
  },
  observaciones: {
    type: String,
    trim: true,
  },
}, { _id: true });

const VencimientoSchema = new Schema<IVencimiento>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },
    tipo: {
      type: String,
      enum: Object.values(TipoVencimiento),
      required: [true, 'El tipo es obligatorio'],
    },
    numero: {
      type: String,
      required: [true, 'El número es obligatorio'],
      trim: true,
      uppercase: true,
    },

    // Documento origen
    documentoOrigen: {
      type: String,
      enum: Object.values(TipoDocumentoOrigen),
      required: true,
      default: TipoDocumentoOrigen.MANUAL,
    },
    documentoId: {
      type: Schema.Types.ObjectId,
      refPath: 'documentoOrigen',
    },
    documentoNumero: {
      type: String,
      trim: true,
    },

    // Tercero
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
    },
    proveedorId: {
      type: Schema.Types.ObjectId,
      ref: 'Proveedor',
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

    // Importes
    importe: {
      type: Number,
      required: [true, 'El importe es obligatorio'],
      min: [0.01, 'El importe debe ser mayor que 0'],
    },
    importeCobrado: {
      type: Number,
      default: 0,
      min: 0,
    },
    importePendiente: {
      type: Number,
      default: function(this: IVencimiento) {
        return this.importe - (this.importeCobrado || 0);
      },
    },

    // Fechas
    fechaEmision: {
      type: Date,
      required: [true, 'La fecha de emisión es obligatoria'],
    },
    fechaVencimiento: {
      type: Date,
      required: [true, 'La fecha de vencimiento es obligatoria'],
    },
    fechaCobro: {
      type: Date,
    },

    // Forma de pago
    formaPagoId: {
      type: Schema.Types.ObjectId,
      ref: 'FormaPago',
    },
    formaPagoNombre: {
      type: String,
      trim: true,
    },

    // Cuenta bancaria
    cuentaBancariaId: {
      type: Schema.Types.ObjectId,
    },
    iban: {
      type: String,
      trim: true,
    },

    // Remesa
    remesaId: {
      type: Schema.Types.ObjectId,
      ref: 'Remesa',
    },
    remesaNumero: {
      type: String,
      trim: true,
    },
    fechaRemesa: {
      type: Date,
    },

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoVencimiento),
      default: EstadoVencimiento.PENDIENTE,
    },

    // Cobros parciales
    cobrosParciales: {
      type: [CobroParcialSchema],
      default: [],
    },

    // Metadata
    observaciones: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// ÍNDICES
// ============================================

// Número único
VencimientoSchema.index({ numero: 1 }, { unique: true });

// Búsquedas más comunes
VencimientoSchema.index({ tipo: 1, estado: 1 });
VencimientoSchema.index({ fechaVencimiento: 1 });
VencimientoSchema.index({ clienteId: 1, tipo: 1 });
VencimientoSchema.index({ proveedorId: 1, tipo: 1 });
VencimientoSchema.index({ documentoId: 1 });
VencimientoSchema.index({ remesaId: 1 });

// Índice compuesto para vencimientos pendientes
VencimientoSchema.index({ tipo: 1, estado: 1, fechaVencimiento: 1 });

// Índice de texto para búsqueda
VencimientoSchema.index({
  numero: 'text',
  terceroNombre: 'text',
  documentoNumero: 'text',
});

// ============================================
// VIRTUALS
// ============================================

// Días vencido (negativo si aún no vence)
VencimientoSchema.virtual('diasVencido').get(function() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(this.fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const diff = hoy.getTime() - vencimiento.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Está vencido
VencimientoSchema.virtual('estaVencido').get(function() {
  if (this.estado === EstadoVencimiento.COBRADO ||
      this.estado === EstadoVencimiento.PAGADO ||
      this.estado === EstadoVencimiento.ANULADO) {
    return false;
  }
  return new Date() > new Date(this.fechaVencimiento);
});

// Porcentaje cobrado
VencimientoSchema.virtual('porcentajeCobrado').get(function() {
  if (this.importe === 0) return 0;
  return Math.round((this.importeCobrado / this.importe) * 100);
});

// Label del estado
VencimientoSchema.virtual('estadoLabel').get(function() {
  const labels: Record<string, string> = {
    [EstadoVencimiento.PENDIENTE]: 'Pendiente',
    [EstadoVencimiento.PARCIAL]: 'Cobro parcial',
    [EstadoVencimiento.COBRADO]: 'Cobrado',
    [EstadoVencimiento.PAGADO]: 'Pagado',
    [EstadoVencimiento.IMPAGADO]: 'Impagado',
    [EstadoVencimiento.ANULADO]: 'Anulado',
  };
  return labels[this.estado] || this.estado;
});

// Label del tipo
VencimientoSchema.virtual('tipoLabel').get(function() {
  return this.tipo === TipoVencimiento.COBRO ? 'Cobro' : 'Pago';
});

VencimientoSchema.set('toJSON', { virtuals: true });
VencimientoSchema.set('toObject', { virtuals: true });

// ============================================
// MIDDLEWARE
// ============================================

// Recalcular importe pendiente antes de guardar
VencimientoSchema.pre('save', function(next) {
  this.importePendiente = this.importe - this.importeCobrado;

  // Actualizar estado según importes
  if (this.importeCobrado >= this.importe) {
    this.estado = this.tipo === TipoVencimiento.COBRO
      ? EstadoVencimiento.COBRADO
      : EstadoVencimiento.PAGADO;
    if (!this.fechaCobro) {
      this.fechaCobro = new Date();
    }
  } else if (this.importeCobrado > 0) {
    this.estado = EstadoVencimiento.PARCIAL;
  }

  next();
});

// ============================================
// EXPORT
// ============================================

export const Vencimiento = mongoose.model<IVencimiento>('Vencimiento', VencimientoSchema);
