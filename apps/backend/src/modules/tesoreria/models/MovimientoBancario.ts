import mongoose, { Schema, Document, Types } from 'mongoose';

// Tipos de movimiento
export enum TipoMovimiento {
  ENTRADA = 'entrada',  // Cobros, ingresos
  SALIDA = 'salida',    // Pagos, gastos
}

// Origen del movimiento
export enum OrigenMovimiento {
  TPV = 'tpv',                    // Cobro desde TPV
  TPV_CAJA = 'tpv_caja',          // Movimiento manual de caja TPV (entrada/salida efectivo)
  FACTURA_VENTA = 'factura_venta', // Cobro de factura
  FACTURA_COMPRA = 'factura_compra', // Pago de factura
  VENCIMIENTO = 'vencimiento',    // Cobro/pago de vencimiento
  PAGARE = 'pagare',              // Cobro/pago de pagaré
  RECIBO = 'recibo',              // Cobro de recibo bancario
  TRANSFERENCIA = 'transferencia', // Transferencia entre cuentas
  MANUAL = 'manual',              // Entrada manual
  APERTURA_CAJA = 'apertura_caja', // Apertura de caja TPV
  CIERRE_CAJA = 'cierre_caja',    // Cierre de caja TPV
  DEVOLUCION = 'devolucion',      // Devolución
}

// Método de pago/cobro
export enum MetodoMovimiento {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  BIZUM = 'bizum',
  DOMICILIACION = 'domiciliacion',
  CHEQUE = 'cheque',
  PAGARE = 'pagare',
  OTRO = 'otro',
}

// Estado del movimiento
export enum EstadoMovimiento {
  PENDIENTE = 'pendiente',       // Registrado pero no confirmado
  CONFIRMADO = 'confirmado',     // Confirmado/realizado
  CONCILIADO = 'conciliado',     // Conciliado con extracto bancario
  ANULADO = 'anulado',           // Anulado
}

// Interface del documento
export interface IMovimientoBancario extends Document {
  _id: Types.ObjectId;

  // Identificación
  numero: string;              // MOV-YYYY-NNNNN

  // Tipo y origen
  tipo: TipoMovimiento;
  origen: OrigenMovimiento;
  metodo: MetodoMovimiento;
  estado: EstadoMovimiento;

  // Importe
  importe: number;

  // Fechas
  fecha: Date;                 // Fecha del movimiento
  fechaValor?: Date;           // Fecha valor bancario
  fechaConciliacion?: Date;    // Fecha de conciliación

  // Cuenta bancaria (opcional hasta que exista el módulo)
  cuentaBancariaId?: Types.ObjectId;
  cuentaBancariaNombre?: string;

  // Tercero (cliente/proveedor)
  terceroTipo?: 'cliente' | 'proveedor';
  terceroId?: Types.ObjectId;
  terceroNombre?: string;
  terceroNif?: string;

  // Documento origen
  documentoOrigenTipo?: string;  // 'Factura', 'Vencimiento', 'Pagare', 'Recibo', 'Ticket'
  documentoOrigenId?: Types.ObjectId;
  documentoOrigenNumero?: string;

  // TPV (si viene de TPV)
  tpvId?: Types.ObjectId;
  tpvNombre?: string;
  ticketId?: Types.ObjectId;
  ticketNumero?: string;

  // Detalles
  concepto: string;
  observaciones?: string;
  referenciaBancaria?: string;  // Referencia del banco en extracto

  // Conciliación
  conciliado: boolean;
  movimientoExtractoId?: Types.ObjectId; // Referencia al movimiento del extracto

  // Auditoría
  creadoPor: Types.ObjectId;
  fechaCreacion: Date;
  modificadoPor?: Types.ObjectId;
  fechaModificacion?: Date;
  anuladoPor?: Types.ObjectId;
  fechaAnulacion?: Date;
  motivoAnulacion?: string;

  // Control
  activo: boolean;
}

const MovimientoBancarioSchema = new Schema<IMovimientoBancario>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    numero: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    tipo: {
      type: String,
      enum: Object.values(TipoMovimiento),
      required: true,
      index: true,
    },

    origen: {
      type: String,
      enum: Object.values(OrigenMovimiento),
      required: true,
      index: true,
    },

    metodo: {
      type: String,
      enum: Object.values(MetodoMovimiento),
      required: true,
    },

    estado: {
      type: String,
      enum: Object.values(EstadoMovimiento),
      default: EstadoMovimiento.CONFIRMADO,
      index: true,
    },

    importe: {
      type: Number,
      required: true,
    },

    fecha: {
      type: Date,
      required: true,
      index: true,
    },

    fechaValor: Date,
    fechaConciliacion: Date,

    // Cuenta bancaria
    cuentaBancariaId: {
      type: Schema.Types.ObjectId,
      ref: 'CuentaBancaria',
    },
    cuentaBancariaNombre: String,

    // Tercero
    terceroTipo: {
      type: String,
      enum: ['cliente', 'proveedor'],
    },
    terceroId: {
      type: Schema.Types.ObjectId,
    },
    terceroNombre: {
      type: String,
      trim: true,
    },
    terceroNif: {
      type: String,
      trim: true,
    },

    // Documento origen
    documentoOrigenTipo: String,
    documentoOrigenId: Schema.Types.ObjectId,
    documentoOrigenNumero: String,

    // TPV
    tpvId: {
      type: Schema.Types.ObjectId,
      ref: 'TPVRegistrado',
    },
    tpvNombre: String,
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Factura',
    },
    ticketNumero: String,

    // Detalles
    concepto: {
      type: String,
      required: true,
      trim: true,
    },
    observaciones: String,
    referenciaBancaria: String,

    // Conciliación
    conciliado: {
      type: Boolean,
      default: false,
      index: true,
    },
    movimientoExtractoId: Schema.Types.ObjectId,

    // Auditoría
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaModificacion: Date,
    anuladoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaAnulacion: Date,
    motivoAnulacion: String,

    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'movimientos_bancarios',
  }
);

// Índices compuestos
MovimientoBancarioSchema.index({ fecha: -1, tipo: 1 });
MovimientoBancarioSchema.index({ origen: 1, documentoOrigenId: 1 });
MovimientoBancarioSchema.index({ tpvId: 1, fecha: -1 });
MovimientoBancarioSchema.index({ terceroId: 1, tipo: 1 });
MovimientoBancarioSchema.index({ cuentaBancariaId: 1, fecha: -1 });
MovimientoBancarioSchema.index({ conciliado: 1, estado: 1 });

// Virtuals
MovimientoBancarioSchema.virtual('importeFormateado').get(function() {
  const signo = this.tipo === TipoMovimiento.ENTRADA ? '+' : '-';
  return `${signo}${this.importe.toFixed(2)} €`;
});

export default mongoose.model<IMovimientoBancario>('MovimientoBancario', MovimientoBancarioSchema);
