import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoTraspaso {
  BORRADOR = 'borrador',
  PENDIENTE_SALIDA = 'pendiente_salida',
  EN_TRANSITO = 'en_transito',
  RECIBIDO_PARCIAL = 'recibido_parcial',
  RECIBIDO = 'recibido',
  ANULADO = 'anulado',
}

// ============================================
// INTERFACES
// ============================================

export interface ILineaTraspaso {
  productoId: mongoose.Types.ObjectId;
  productoCodigo: string;
  productoNombre: string;
  productoSku?: string;
  varianteId?: string;
  varianteNombre?: string;
  cantidadSolicitada: number;
  cantidadEnviada: number;
  cantidadRecibida: number;
  ubicacionOrigen?: string;
  ubicacionDestino?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: Date;
  costeUnitario: number;
  observaciones?: string;
}

export interface ITraspaso extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificación
  codigo: string;

  // Almacenes
  almacenOrigenId: mongoose.Types.ObjectId;
  almacenOrigenNombre: string;
  almacenDestinoId: mongoose.Types.ObjectId;
  almacenDestinoNombre: string;

  // Estado
  estado: EstadoTraspaso;

  // Fechas del flujo
  fechaCreacion: Date;
  fechaSalida?: Date;
  fechaRecepcion?: Date;
  fechaAnulacion?: Date;

  // Usuarios del flujo
  usuarioCreadorId: mongoose.Types.ObjectId;
  usuarioCreadorNombre: string;
  usuarioSalidaId?: mongoose.Types.ObjectId;
  usuarioSalidaNombre?: string;
  usuarioRecepcionId?: mongoose.Types.ObjectId;
  usuarioRecepcionNombre?: string;
  usuarioAnulacionId?: mongoose.Types.ObjectId;

  // Líneas
  lineas: ILineaTraspaso[];

  // Totales
  totalProductos: number;
  totalUnidades: number;
  valorTotal: number;

  // Observaciones
  motivoTraspaso?: string;
  observaciones?: string;
  observacionesSalida?: string;
  observacionesRecepcion?: string;
  motivoAnulacion?: string;

  // Referencias a movimientos de stock
  movimientosSalidaIds?: mongoose.Types.ObjectId[];
  movimientosEntradaIds?: mongoose.Types.ObjectId[];

  // Control
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ITraspasoModel extends Model<ITraspaso> {
  generarCodigo(empresaId: string): Promise<string>;
}

// ============================================
// SCHEMA LINEA TRASPASO
// ============================================

const LineaTraspasoSchema = new Schema<ILineaTraspaso>({
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: true,
  },
  productoCodigo: {
    type: String,
    required: true,
    trim: true,
  },
  productoNombre: {
    type: String,
    required: true,
    trim: true,
  },
  productoSku: {
    type: String,
    trim: true,
  },
  varianteId: {
    type: String,
  },
  varianteNombre: {
    type: String,
    trim: true,
  },
  cantidadSolicitada: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  cantidadEnviada: {
    type: Number,
    min: 0,
    default: 0,
  },
  cantidadRecibida: {
    type: Number,
    min: 0,
    default: 0,
  },
  ubicacionOrigen: {
    type: String,
    trim: true,
  },
  ubicacionDestino: {
    type: String,
    trim: true,
  },
  lote: {
    type: String,
    trim: true,
  },
  numeroSerie: {
    type: String,
    trim: true,
  },
  fechaCaducidad: {
    type: Date,
  },
  costeUnitario: {
    type: Number,
    min: 0,
    default: 0,
  },
  observaciones: {
    type: String,
  },
}, { _id: true });

// ============================================
// SCHEMA TRASPASO
// ============================================

const TraspasoSchema = new Schema<ITraspaso, ITraspasoModel>({
  codigo: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  // Almacenes
  almacenOrigenId: {
    type: Schema.Types.ObjectId,
    ref: 'Almacen',
    required: true,
    index: true,
  },
  almacenOrigenNombre: {
    type: String,
    required: true,
    trim: true,
  },
  almacenDestinoId: {
    type: Schema.Types.ObjectId,
    ref: 'Almacen',
    required: true,
    index: true,
  },
  almacenDestinoNombre: {
    type: String,
    required: true,
    trim: true,
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoTraspaso),
    default: EstadoTraspaso.BORRADOR,
    index: true,
  },

  // Fechas
  fechaCreacion: {
    type: Date,
    default: Date.now,
    index: true,
  },
  fechaSalida: {
    type: Date,
  },
  fechaRecepcion: {
    type: Date,
  },
  fechaAnulacion: {
    type: Date,
  },

  // Usuarios
  usuarioCreadorId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  usuarioCreadorNombre: {
    type: String,
    required: true,
    trim: true,
  },
  usuarioSalidaId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  usuarioSalidaNombre: {
    type: String,
    trim: true,
  },
  usuarioRecepcionId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  usuarioRecepcionNombre: {
    type: String,
    trim: true,
  },
  usuarioAnulacionId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },

  // Líneas
  lineas: {
    type: [LineaTraspasoSchema],
    default: [],
  },

  // Totales
  totalProductos: {
    type: Number,
    default: 0,
  },
  totalUnidades: {
    type: Number,
    default: 0,
  },
  valorTotal: {
    type: Number,
    default: 0,
  },

  // Observaciones
  motivoTraspaso: {
    type: String,
  },
  observaciones: {
    type: String,
  },
  observacionesSalida: {
    type: String,
  },
  observacionesRecepcion: {
    type: String,
  },
  motivoAnulacion: {
    type: String,
  },

  // Movimientos de stock
  movimientosSalidaIds: [{
    type: Schema.Types.ObjectId,
    ref: 'MovimientoStock',
  }],
  movimientosEntradaIds: [{
    type: Schema.Types.ObjectId,
    ref: 'MovimientoStock',
  }],

  // Control
  prioridad: {
    type: String,
    enum: ['baja', 'normal', 'alta', 'urgente'],
    default: 'normal',
  },
}, {
  timestamps: true,
  collection: 'traspasos',
});

// ============================================
// ÍNDICES
// ============================================

TraspasoSchema.index({ almacenOrigenId: 1, estado: 1 });
TraspasoSchema.index({ almacenDestinoId: 1, estado: 1 });
TraspasoSchema.index({ fechaCreacion: -1 });
TraspasoSchema.index({ estado: 1, prioridad: 1 });

// ============================================
// MIDDLEWARE
// ============================================

TraspasoSchema.pre('save', function(next) {
  // Calcular totales
  this.totalProductos = this.lineas.length;
  this.totalUnidades = this.lineas.reduce((sum, l) => sum + l.cantidadSolicitada, 0);
  this.valorTotal = this.lineas.reduce((sum, l) => sum + (l.cantidadSolicitada * l.costeUnitario), 0);
  next();
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

TraspasoSchema.statics.generarCodigo = async function(empresaId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TR${year}-`;

  // Buscar el último código del año
  const ultimo = await this.findOne({
    codigo: { $regex: `^${prefix}` },
  })
    .sort({ codigo: -1 })
    .select('codigo')
    .lean();

  let numero = 1;
  if (ultimo?.codigo) {
    const match = ultimo.codigo.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) {
      numero = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${numero.toString().padStart(5, '0')}`;
};

// ============================================
// CONFIG JSON
// ============================================

TraspasoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});

// ============================================
// EXPORTAR
// ============================================

export const Traspaso = mongoose.model<ITraspaso, ITraspasoModel>('Traspaso', TraspasoSchema);
export default Traspaso;
