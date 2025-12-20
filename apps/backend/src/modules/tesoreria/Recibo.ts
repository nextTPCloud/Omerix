import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoRecibo {
  EMITIDO = 'emitido',
  ENVIADO = 'enviado',         // Enviado a banco / cliente
  COBRADO = 'cobrado',
  DEVUELTO = 'devuelto',
  ANULADO = 'anulado',
}

export enum TipoDocumentoOrigenRecibo {
  FACTURA = 'factura',
  VENCIMIENTO = 'vencimiento',
  MANUAL = 'manual',
}

export enum TipoAdeudoSEPA {
  RCUR = 'RCUR',   // Recurrente
  FRST = 'FRST',   // Primero de recurrente
  OOFF = 'OOFF',   // Único
  FNAL = 'FNAL',   // Último de recurrente
}

// ============================================
// INTERFACES
// ============================================

export interface IMandatoSEPA {
  referencia: string;           // Referencia única del mandato
  fechaFirma: Date;             // Fecha en que el cliente firmó el mandato
  tipoAdeudo: TipoAdeudoSEPA;   // Tipo de adeudo
  activo: boolean;
}

export interface IRecibo extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;
  numero: string;               // REC-YYYY-NNNNN
  serie: string;                // Serie del recibo

  // Documento origen
  documentoOrigen: {
    tipo: TipoDocumentoOrigenRecibo;
    id?: Types.ObjectId;
    numero?: string;
  };

  // Vencimiento asociado
  vencimientoId?: Types.ObjectId;

  // Cliente
  clienteId: Types.ObjectId;
  clienteNombre: string;
  clienteNIF?: string;
  clienteDireccion?: string;
  clienteLocalidad?: string;
  clienteProvincia?: string;
  clienteCodigoPostal?: string;

  // Datos del recibo
  concepto: string;
  importe: number;
  fechaEmision: Date;
  fechaVencimiento: Date;

  // Datos bancarios para domiciliación
  cuentaBancariaEmpresaId?: Types.ObjectId;
  ibanEmpresa?: string;          // IBAN de la empresa (para recibir)
  ibanCliente?: string;          // IBAN del cliente (para adeudo SEPA)
  bicCliente?: string;           // BIC del banco del cliente

  // Mandato SEPA (necesario para adeudo directo)
  mandatoSEPA?: IMandatoSEPA;

  // Estado y gestión
  estado: EstadoRecibo;
  fechaEnvio?: Date;
  fechaCobro?: Date;
  fechaDevolucion?: Date;
  motivoDevolucion?: string;
  comisionDevolucion?: number;

  // Remesa asociada
  remesaId?: Types.ObjectId;
  remesaNumero?: string;
  fechaRemesa?: Date;

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

const MandatoSEPASchema = new Schema<IMandatoSEPA>({
  referencia: {
    type: String,
    required: [true, 'La referencia del mandato es obligatoria'],
    trim: true,
    uppercase: true,
  },
  fechaFirma: {
    type: Date,
    required: [true, 'La fecha de firma es obligatoria'],
  },
  tipoAdeudo: {
    type: String,
    enum: Object.values(TipoAdeudoSEPA),
    default: TipoAdeudoSEPA.RCUR,
  },
  activo: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const ReciboSchema = new Schema<IRecibo>(
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
    serie: {
      type: String,
      default: 'REC',
      trim: true,
      uppercase: true,
    },

    // Documento origen
    documentoOrigen: {
      tipo: {
        type: String,
        enum: Object.values(TipoDocumentoOrigenRecibo),
        required: true,
        default: TipoDocumentoOrigenRecibo.MANUAL,
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

    // Cliente
    clienteId: {
      type: Schema.Types.ObjectId,
      required: [true, 'El cliente es obligatorio'],
      ref: 'Cliente',
    },
    clienteNombre: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
    },
    clienteNIF: {
      type: String,
      trim: true,
    },
    clienteDireccion: {
      type: String,
      trim: true,
    },
    clienteLocalidad: {
      type: String,
      trim: true,
    },
    clienteProvincia: {
      type: String,
      trim: true,
    },
    clienteCodigoPostal: {
      type: String,
      trim: true,
    },

    // Datos del recibo
    concepto: {
      type: String,
      required: [true, 'El concepto es obligatorio'],
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
      default: Date.now,
    },
    fechaVencimiento: {
      type: Date,
      required: [true, 'La fecha de vencimiento es obligatoria'],
    },

    // Datos bancarios
    cuentaBancariaEmpresaId: {
      type: Schema.Types.ObjectId,
    },
    ibanEmpresa: {
      type: String,
      trim: true,
      uppercase: true,
    },
    ibanCliente: {
      type: String,
      trim: true,
      uppercase: true,
    },
    bicCliente: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Mandato SEPA
    mandatoSEPA: {
      type: MandatoSEPASchema,
    },

    // Estado
    estado: {
      type: String,
      enum: Object.values(EstadoRecibo),
      default: EstadoRecibo.EMITIDO,
    },
    fechaEnvio: {
      type: Date,
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
    fechaRemesa: {
      type: Date,
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
ReciboSchema.index({ empresaId: 1, numero: 1 }, { unique: true });

// Búsquedas comunes
ReciboSchema.index({ empresaId: 1, estado: 1 });
ReciboSchema.index({ empresaId: 1, fechaVencimiento: 1 });
ReciboSchema.index({ empresaId: 1, clienteId: 1 });
ReciboSchema.index({ vencimientoId: 1 });
ReciboSchema.index({ remesaId: 1 });

// Índice de texto para búsqueda
ReciboSchema.index({
  numero: 'text',
  clienteNombre: 'text',
  concepto: 'text',
});

// ============================================
// VIRTUALS
// ============================================

// Días hasta vencimiento
ReciboSchema.virtual('diasHastaVencimiento').get(function() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(this.fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const diff = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Está vencido
ReciboSchema.virtual('estaVencido').get(function() {
  if (this.estado === EstadoRecibo.COBRADO || this.estado === EstadoRecibo.ANULADO) {
    return false;
  }
  return new Date() > new Date(this.fechaVencimiento);
});

// Puede enviarse a banco (tiene mandato SEPA activo)
ReciboSchema.virtual('puedeEnviarseABanco').get(function() {
  return this.estado === EstadoRecibo.EMITIDO &&
         this.mandatoSEPA?.activo &&
         this.ibanCliente;
});

// Labels
ReciboSchema.virtual('estadoLabel').get(function() {
  const labels: Record<string, string> = {
    [EstadoRecibo.EMITIDO]: 'Emitido',
    [EstadoRecibo.ENVIADO]: 'Enviado a banco',
    [EstadoRecibo.COBRADO]: 'Cobrado',
    [EstadoRecibo.DEVUELTO]: 'Devuelto',
    [EstadoRecibo.ANULADO]: 'Anulado',
  };
  return labels[this.estado] || this.estado;
});

ReciboSchema.set('toJSON', { virtuals: true });
ReciboSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT
// ============================================

export const Recibo = mongoose.model<IRecibo>('Recibo', ReciboSchema);

// Factory para modelo dinámico por empresa
export function createReciboModel(connection: mongoose.Connection): Model<IRecibo> {
  return connection.model<IRecibo>('Recibo', ReciboSchema);
}
