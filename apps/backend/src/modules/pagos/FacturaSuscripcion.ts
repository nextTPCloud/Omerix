import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Factura de Suscripción
 *
 * Facturas emitidas por Tralok SL a las empresas clientes
 * por sus suscripciones al servicio SaaS.
 *
 * Estas facturas se almacenan en la base de datos principal,
 * no en las bases de datos de cada empresa.
 */

export enum EstadoFacturaSuscripcion {
  BORRADOR = 'borrador',
  EMITIDA = 'emitida',
  PAGADA = 'pagada',
  VENCIDA = 'vencida',
  ANULADA = 'anulada',
}

export enum ConceptoFacturaSuscripcion {
  SUSCRIPCION_MENSUAL = 'suscripcion_mensual',
  SUSCRIPCION_ANUAL = 'suscripcion_anual',
  UPGRADE = 'upgrade',
  ADDON = 'addon',
  USUARIOS_EXTRA = 'usuarios_extra',
  ALMACENAMIENTO_EXTRA = 'almacenamiento_extra',
  OTRO = 'otro',
}

export interface ILineaFacturaSuscripcion {
  concepto: ConceptoFacturaSuscripcion;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number; // Porcentaje
  iva: number; // Porcentaje (21%, 10%, etc.)
  subtotal: number; // Sin IVA
  total: number; // Con IVA
}

export interface IFacturaSuscripcion extends Document {
  _id: Types.ObjectId;

  // Numeración
  serie: string;
  numero: number;
  numeroFactura: string; // Serie + Numero formateado

  // Emisor (Tralok SL)
  emisor: {
    empresaId: Types.ObjectId;
    nombre: string;
    nif: string;
    direccion: string;
    ciudad: string;
    codigoPostal: string;
    pais: string;
    email: string;
    telefono?: string;
  };

  // Cliente (empresa suscriptora)
  cliente: {
    empresaId: Types.ObjectId;
    nombre: string;
    nif: string;
    direccion?: string;
    ciudad?: string;
    codigoPostal?: string;
    pais?: string;
    email: string;
  };

  // Fechas
  fechaEmision: Date;
  fechaVencimiento: Date;
  fechaPago?: Date;

  // Período de facturación
  periodoInicio: Date;
  periodoFin: Date;

  // Plan y licencia
  planId: Types.ObjectId;
  planNombre: string;
  licenciaId: Types.ObjectId;
  tipoSuscripcion: 'mensual' | 'anual';

  // Líneas de factura
  lineas: ILineaFacturaSuscripcion[];

  // Totales
  subtotal: number; // Base imponible total
  totalDescuentos: number;
  totalIVA: number;
  total: number;
  moneda: string;

  // Estado
  estado: EstadoFacturaSuscripcion;

  // Pago
  pagoId?: Types.ObjectId;
  metodoPago?: string;
  transaccionExternaId?: string;

  // PDF generado
  pdfUrl?: string;
  pdfGeneradoEn?: Date;

  // Notas
  notas?: string;
  notasInternas?: string;

  // Rectificación
  esRectificativa: boolean;
  facturaOriginalId?: Types.ObjectId;
  motivoRectificacion?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LineaFacturaSuscripcionSchema = new Schema<ILineaFacturaSuscripcion>({
  concepto: {
    type: String,
    enum: Object.values(ConceptoFacturaSuscripcion),
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  cantidad: {
    type: Number,
    required: true,
    default: 1,
  },
  precioUnitario: {
    type: Number,
    required: true,
  },
  descuento: {
    type: Number,
    default: 0,
  },
  iva: {
    type: Number,
    required: true,
    default: 21,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
}, { _id: false });

const FacturaSuscripcionSchema = new Schema<IFacturaSuscripcion>(
  {
    // Numeración
    serie: {
      type: String,
      required: true,
      default: 'FS',
      uppercase: true,
    },
    numero: {
      type: Number,
      required: true,
    },
    numeroFactura: {
      type: String,
      required: true,
      unique: true,
    },

    // Emisor (Tralok SL)
    emisor: {
      empresaId: {
        type: Schema.Types.ObjectId,
        ref: 'Empresa',
        required: true,
      },
      nombre: { type: String, required: true },
      nif: { type: String, required: true },
      direccion: { type: String, required: true },
      ciudad: { type: String, required: true },
      codigoPostal: { type: String, required: true },
      pais: { type: String, required: true, default: 'España' },
      email: { type: String, required: true },
      telefono: String,
    },

    // Cliente
    cliente: {
      empresaId: {
        type: Schema.Types.ObjectId,
        ref: 'Empresa',
        required: true,
        index: true,
      },
      nombre: { type: String, required: true },
      nif: { type: String, required: true },
      direccion: String,
      ciudad: String,
      codigoPostal: String,
      pais: { type: String, default: 'España' },
      email: { type: String, required: true },
    },

    // Fechas
    fechaEmision: {
      type: Date,
      required: true,
      default: Date.now,
    },
    fechaVencimiento: {
      type: Date,
      required: true,
    },
    fechaPago: Date,

    // Período
    periodoInicio: {
      type: Date,
      required: true,
    },
    periodoFin: {
      type: Date,
      required: true,
    },

    // Plan y licencia
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    planNombre: {
      type: String,
      required: true,
    },
    licenciaId: {
      type: Schema.Types.ObjectId,
      ref: 'Licencia',
      required: true,
      index: true,
    },
    tipoSuscripcion: {
      type: String,
      enum: ['mensual', 'anual'],
      required: true,
    },

    // Líneas
    lineas: {
      type: [LineaFacturaSuscripcionSchema],
      required: true,
      validate: [(v: any[]) => v.length > 0, 'Debe tener al menos una línea'],
    },

    // Totales
    subtotal: {
      type: Number,
      required: true,
    },
    totalDescuentos: {
      type: Number,
      default: 0,
    },
    totalIVA: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    moneda: {
      type: String,
      default: 'EUR',
      uppercase: true,
    },

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoFacturaSuscripcion),
      default: EstadoFacturaSuscripcion.BORRADOR,
      index: true,
    },

    // Pago
    pagoId: {
      type: Schema.Types.ObjectId,
      ref: 'Pago',
    },
    metodoPago: String,
    transaccionExternaId: String,

    // PDF
    pdfUrl: String,
    pdfGeneradoEn: Date,

    // Notas
    notas: String,
    notasInternas: String,

    // Rectificación
    esRectificativa: {
      type: Boolean,
      default: false,
    },
    facturaOriginalId: {
      type: Schema.Types.ObjectId,
      ref: 'FacturaSuscripcion',
    },
    motivoRectificacion: String,
  },
  {
    timestamps: true,
  }
);

// Índices
FacturaSuscripcionSchema.index({ 'cliente.empresaId': 1, fechaEmision: -1 });
FacturaSuscripcionSchema.index({ estado: 1, fechaVencimiento: 1 });
FacturaSuscripcionSchema.index({ fechaEmision: -1 });
FacturaSuscripcionSchema.index({ serie: 1, numero: -1 });

// Virtual para obtener si está vencida
FacturaSuscripcionSchema.virtual('estaVencida').get(function() {
  if (this.estado === EstadoFacturaSuscripcion.PAGADA) return false;
  return new Date() > this.fechaVencimiento;
});

// Pre-save: generar número de factura si no existe
FacturaSuscripcionSchema.pre('save', async function(next) {
  if (!this.numeroFactura) {
    this.numeroFactura = `${this.serie}-${String(this.numero).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model<IFacturaSuscripcion>('FacturaSuscripcion', FacturaSuscripcionSchema);
