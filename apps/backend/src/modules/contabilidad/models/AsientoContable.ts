/**
 * Modelo de Asiento Contable
 * Registro de movimientos en el libro diario
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// Tipo de origen del asiento
export enum OrigenAsiento {
  FACTURA_VENTA = 'factura_venta',
  FACTURA_COMPRA = 'factura_compra',
  COBRO = 'cobro',
  PAGO = 'pago',
  MANUAL = 'manual',
  APERTURA = 'apertura',
  CIERRE = 'cierre',
  REGULARIZACION = 'regularizacion',
  AJUSTE = 'ajuste',
}

// Estado del asiento
export enum EstadoAsiento {
  BORRADOR = 'borrador',
  CONTABILIZADO = 'contabilizado',
  ANULADO = 'anulado',
}

// Interface de línea de asiento (apunte contable)
export interface ILineaAsiento {
  orden: number;
  cuentaId: mongoose.Types.ObjectId;
  cuentaCodigo: string;
  cuentaNombre: string;
  debe: number;
  haber: number;
  concepto?: string;
  // Tercero relacionado
  terceroId?: mongoose.Types.ObjectId;
  terceroNombre?: string;
  terceroNif?: string;
  // Referencias
  documentoRef?: string;      // Número de factura, etc.
  fechaVencimiento?: Date;    // Para seguimiento de vencimientos
}

// Interface de asiento contable
export interface IAsientoContable extends Document {
  // Identificación
  numero: number;              // Secuencial por ejercicio
  fecha: Date;
  periodo: number;             // Mes (1-12)
  ejercicio: number;           // Año fiscal

  // Contenido
  concepto: string;            // Descripción general del asiento
  lineas: ILineaAsiento[];

  // Totales (calculados)
  totalDebe: number;
  totalHaber: number;
  cuadrado: boolean;           // true si debe === haber
  diferencia: number;          // totalDebe - totalHaber

  // Origen del asiento
  origenTipo: OrigenAsiento;
  origenId?: mongoose.Types.ObjectId;
  origenNumero?: string;       // Número del documento origen

  // Estado
  estado: EstadoAsiento;
  bloqueado: boolean;          // No se puede modificar

  // Para asientos de anulación
  asientoAnuladoId?: mongoose.Types.ObjectId;
  asientoAnulacionId?: mongoose.Types.ObjectId;
  motivoAnulacion?: string;

  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaModificacion?: Date;
  contabilizadoPor?: mongoose.Types.ObjectId;
  fechaContabilizacion?: Date;
  anuladoPor?: mongoose.Types.ObjectId;
  fechaAnulacion?: Date;
}

// Schema de línea de asiento
const LineaAsientoSchema = new Schema<ILineaAsiento>(
  {
    orden: {
      type: Number,
      required: true,
    },
    cuentaId: {
      type: Schema.Types.ObjectId,
      ref: 'CuentaContable',
      required: true,
    },
    cuentaCodigo: {
      type: String,
      required: true,
      trim: true,
    },
    cuentaNombre: {
      type: String,
      required: true,
      trim: true,
    },
    debe: {
      type: Number,
      default: 0,
      min: 0,
    },
    haber: {
      type: Number,
      default: 0,
      min: 0,
    },
    concepto: {
      type: String,
      trim: true,
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
    documentoRef: {
      type: String,
      trim: true,
    },
    fechaVencimiento: {
      type: Date,
    },
  },
  { _id: false }
);

// Schema de asiento contable
const AsientoContableSchema = new Schema<IAsientoContable>(
  {
    numero: {
      type: Number,
      required: true,
    },
    fecha: {
      type: Date,
      required: true,
      index: true,
    },
    periodo: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    ejercicio: {
      type: Number,
      required: true,
      index: true,
    },

    // Contenido
    concepto: {
      type: String,
      required: true,
      trim: true,
    },
    lineas: {
      type: [LineaAsientoSchema],
      required: true,
      validate: {
        validator: function (lineas: ILineaAsiento[]) {
          return lineas && lineas.length >= 2;
        },
        message: 'Un asiento debe tener al menos 2 líneas',
      },
    },

    // Totales
    totalDebe: {
      type: Number,
      default: 0,
    },
    totalHaber: {
      type: Number,
      default: 0,
    },
    cuadrado: {
      type: Boolean,
      default: false,
    },
    diferencia: {
      type: Number,
      default: 0,
    },

    // Origen
    origenTipo: {
      type: String,
      enum: Object.values(OrigenAsiento),
      required: true,
      index: true,
    },
    origenId: {
      type: Schema.Types.ObjectId,
    },
    origenNumero: {
      type: String,
      trim: true,
    },

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoAsiento),
      default: EstadoAsiento.BORRADOR,
      index: true,
    },
    bloqueado: {
      type: Boolean,
      default: false,
    },

    // Anulación
    asientoAnuladoId: {
      type: Schema.Types.ObjectId,
      ref: 'AsientoContable',
    },
    asientoAnulacionId: {
      type: Schema.Types.ObjectId,
      ref: 'AsientoContable',
    },
    motivoAnulacion: {
      type: String,
      trim: true,
    },

    // Auditoría
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaModificacion: {
      type: Date,
    },
    contabilizadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaContabilizacion: {
      type: Date,
    },
    anuladoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    fechaAnulacion: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'asientos_contables',
  }
);

// Índices para rendimiento
AsientoContableSchema.index({ ejercicio: 1, numero: 1 }, { unique: true });
AsientoContableSchema.index({ fecha: -1, numero: -1 });
AsientoContableSchema.index({ origenTipo: 1, origenId: 1 });
AsientoContableSchema.index({ estado: 1, ejercicio: 1 });
AsientoContableSchema.index({ 'lineas.cuentaCodigo': 1, fecha: -1 });
AsientoContableSchema.index({ 'lineas.terceroId': 1 });
AsientoContableSchema.index({ concepto: 'text' });

// Virtual para código completo
AsientoContableSchema.virtual('codigoCompleto').get(function () {
  return `${this.ejercicio}/${this.numero.toString().padStart(6, '0')}`;
});

// Pre-save: calcular totales y validar cuadre
AsientoContableSchema.pre('save', function (next) {
  // Calcular periodo desde fecha
  if (this.fecha && !this.periodo) {
    this.periodo = this.fecha.getMonth() + 1;
  }

  // Calcular ejercicio desde fecha
  if (this.fecha && !this.ejercicio) {
    this.ejercicio = this.fecha.getFullYear();
  }

  // Ordenar líneas
  if (this.lineas) {
    this.lineas.forEach((linea, index) => {
      linea.orden = index + 1;
    });
  }

  // Calcular totales
  this.totalDebe = this.lineas.reduce((sum, linea) => sum + (linea.debe || 0), 0);
  this.totalHaber = this.lineas.reduce((sum, linea) => sum + (linea.haber || 0), 0);

  // Redondear a 2 decimales
  this.totalDebe = Math.round(this.totalDebe * 100) / 100;
  this.totalHaber = Math.round(this.totalHaber * 100) / 100;

  // Calcular diferencia y cuadre
  this.diferencia = Math.round((this.totalDebe - this.totalHaber) * 100) / 100;
  this.cuadrado = Math.abs(this.diferencia) < 0.01;

  // Fecha de modificación
  this.fechaModificacion = new Date();

  next();
});

// Método para verificar si el asiento puede modificarse
AsientoContableSchema.methods.puedeModificarse = function (): boolean {
  return !this.bloqueado && this.estado === EstadoAsiento.BORRADOR;
};

// Método para verificar si el asiento puede anularse
AsientoContableSchema.methods.puedeAnularse = function (): boolean {
  return this.estado === EstadoAsiento.CONTABILIZADO && !this.asientoAnulacionId;
};

// Método para obtener resumen del asiento
AsientoContableSchema.methods.getResumen = function (): string {
  const cuentas = this.lineas.map((l: ILineaAsiento) => l.cuentaCodigo).join(', ');
  return `Asiento ${this.numero} (${this.fecha.toLocaleDateString('es-ES')}): ${cuentas}`;
};

// Crear modelo
const AsientoContable = mongoose.model<IAsientoContable>('AsientoContable', AsientoContableSchema);

export default AsientoContable;
export { AsientoContableSchema, LineaAsientoSchema };
