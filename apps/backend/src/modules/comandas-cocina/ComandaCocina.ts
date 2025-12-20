import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Comanda de Cocina
 * Representa las líneas de pedido enviadas a cocina/preparación
 * Se usa para el sistema KDS (Kitchen Display System)
 */

export interface ILineaComanda {
  _id?: string;
  productoId: mongoose.Types.ObjectId;
  nombreProducto: string;                       // Copia del nombre para historial
  cantidad: number;
  modificadores?: {
    modificadorId: mongoose.Types.ObjectId;
    nombre: string;
    precioExtra: number;
  }[];
  comentario?: string;                          // Comentario libre del cliente
  estado: 'pendiente' | 'en_preparacion' | 'listo' | 'servido' | 'cancelado';
  tiempoEstimado?: number;                      // Minutos estimados
  prioridad: 'normal' | 'urgente' | 'baja';
  preparadoPor?: mongoose.Types.ObjectId;       // Usuario que lo preparó
  inicioPreparacion?: Date;
  finPreparacion?: Date;
}

export interface IComandaCocina extends Document {
  empresaId: mongoose.Types.ObjectId;
  pedidoId?: mongoose.Types.ObjectId;           // Referencia al pedido/ticket
  mesaId?: mongoose.Types.ObjectId;             // Mesa (si aplica)
  numeroComanda: number;                        // Número secuencial del día

  // Zona de preparación
  zonaPreparacionId: mongoose.Types.ObjectId;

  // Información del pedido
  numeroMesa?: string;
  numeroPedido?: string;
  cliente?: string;
  tipoServicio: 'mesa' | 'barra' | 'llevar' | 'delivery' | 'recoger';

  // Líneas de la comanda
  lineas: ILineaComanda[];

  // Estado general
  estado: 'pendiente' | 'en_preparacion' | 'parcial' | 'listo' | 'servido' | 'cancelado';
  prioridad: 'normal' | 'urgente' | 'baja';

  // Tiempos
  horaRecepcion: Date;
  horaInicio?: Date;                            // Cuando empezó preparación
  horaFin?: Date;                               // Cuando terminó todo
  horaServido?: Date;
  tiempoObjetivo?: number;                      // Minutos objetivo

  // Impresión
  impreso: boolean;
  vecesPimpreso: number;
  impresoraId?: mongoose.Types.ObjectId;

  // Notas
  notas?: string;
  notasInternas?: string;

  // Usuario
  creadoPor: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const LineaComandaSchema = new Schema<ILineaComanda>({
  productoId: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: true,
  },
  nombreProducto: {
    type: String,
    required: true,
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1,
  },
  modificadores: [{
    modificadorId: {
      type: Schema.Types.ObjectId,
      ref: 'ModificadorProducto',
    },
    nombre: String,
    precioExtra: { type: Number, default: 0 },
  }],
  comentario: String,
  estado: {
    type: String,
    enum: ['pendiente', 'en_preparacion', 'listo', 'servido', 'cancelado'],
    default: 'pendiente',
  },
  tiempoEstimado: Number,
  prioridad: {
    type: String,
    enum: ['normal', 'urgente', 'baja'],
    default: 'normal',
  },
  preparadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  inicioPreparacion: Date,
  finPreparacion: Date,
});

const ComandaCocinaSchema = new Schema<IComandaCocina>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    pedidoId: {
      type: Schema.Types.ObjectId,
      ref: 'Pedido',
    },
    mesaId: {
      type: Schema.Types.ObjectId,
      ref: 'Mesa',
    },
    numeroComanda: {
      type: Number,
      required: true,
    },
    zonaPreparacionId: {
      type: Schema.Types.ObjectId,
      ref: 'ZonaPreparacion',
      required: true,
      index: true,
    },
    numeroMesa: String,
    numeroPedido: String,
    cliente: String,
    tipoServicio: {
      type: String,
      enum: ['mesa', 'barra', 'llevar', 'delivery', 'recoger'],
      default: 'mesa',
    },
    lineas: [LineaComandaSchema],
    estado: {
      type: String,
      enum: ['pendiente', 'en_preparacion', 'parcial', 'listo', 'servido', 'cancelado'],
      default: 'pendiente',
      index: true,
    },
    prioridad: {
      type: String,
      enum: ['normal', 'urgente', 'baja'],
      default: 'normal',
    },
    horaRecepcion: {
      type: Date,
      default: Date.now,
    },
    horaInicio: Date,
    horaFin: Date,
    horaServido: Date,
    tiempoObjetivo: {
      type: Number,
      default: 15,
    },
    impreso: {
      type: Boolean,
      default: false,
    },
    vecesPimpreso: {
      type: Number,
      default: 0,
    },
    impresoraId: {
      type: Schema.Types.ObjectId,
      ref: 'Impresora',
    },
    notas: String,
    notasInternas: String,
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
ComandaCocinaSchema.index({ empresaId: 1, zonaPreparacionId: 1, estado: 1 });
ComandaCocinaSchema.index({ empresaId: 1, horaRecepcion: -1 });
ComandaCocinaSchema.index({ empresaId: 1, numeroComanda: 1, createdAt: -1 });
ComandaCocinaSchema.index({ empresaId: 1, pedidoId: 1 });

export const ComandaCocina = mongoose.model<IComandaCocina>('ComandaCocina', ComandaCocinaSchema);
