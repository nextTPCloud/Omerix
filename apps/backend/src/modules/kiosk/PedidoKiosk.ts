import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo para Pedidos realizados desde Kiosko
 * Almacena los pedidos con su estado y flujo hacia TPV o KDS
 */

// Linea de pedido con modificadores
export interface ILineaPedidoKiosk {
  productoId: mongoose.Types.ObjectId;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  modificadores: Array<{
    modificadorId: mongoose.Types.ObjectId;
    nombre: string;
    precioExtra: number;
    cantidad: number;
  }>;
  comentario?: string;
}

export interface IPedidoKiosk extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificacion
  numeroPedido: string;          // "K-0001" (formato configurable)
  codigoRecogida?: string;       // Codigo corto para pantalla de recogida "A23"

  // Origen
  kioskId: mongoose.Types.ObjectId;
  salonId?: mongoose.Types.ObjectId;
  mesaId?: mongoose.Types.ObjectId;
  sesionId?: mongoose.Types.ObjectId;  // Referencia a SesionKiosk si es QR

  // Estado del pedido
  estado:
    | 'pendiente_pago'           // Creado, esperando pago
    | 'pendiente_validacion'     // Enviado a TPV, esperando validacion
    | 'confirmado'               // Confirmado/pagado, listo para preparar
    | 'en_preparacion'           // Enviado a cocina
    | 'listo'                    // Preparado, listo para recoger/servir
    | 'entregado'                // Entregado al cliente
    | 'cancelado';               // Cancelado

  // Tipo de servicio
  tipoServicio: 'en_local' | 'para_llevar';

  // Datos del cliente (opcional)
  cliente?: {
    nombre?: string;
    telefono?: string;
    email?: string;
  };

  // Lineas del pedido
  lineas: ILineaPedidoKiosk[];

  // Totales
  subtotal: number;
  impuestos: number;
  total: number;

  // Pago
  pagado: boolean;
  metodoPago?: 'tarjeta' | 'bizum' | 'efectivo' | 'pendiente_tpv';
  fechaPago?: Date;
  referenciaPago?: string;       // Referencia de pasarela de pago

  // Destino
  tpvDestinoId?: mongoose.Types.ObjectId;  // TPV que debe procesar si no pagado
  comandasIds?: mongoose.Types.ObjectId[]; // Comandas generadas en KDS
  facturaId?: mongoose.Types.ObjectId;     // Factura si se genera

  // Notas
  notas?: string;

  // Timestamps de estados
  fechaCreacion: Date;
  fechaConfirmacion?: Date;
  fechaPreparacion?: Date;
  fechaListo?: Date;
  fechaEntrega?: Date;
  fechaCancelacion?: Date;
  motivoCancelacion?: string;

  createdAt: Date;
  updatedAt: Date;
}

const LineaPedidoKioskSchema = new Schema<ILineaPedidoKiosk>(
  {
    productoId: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },
    precioUnitario: {
      type: Number,
      required: true,
    },
    precioTotal: {
      type: Number,
      required: true,
    },
    modificadores: [{
      modificadorId: {
        type: Schema.Types.ObjectId,
        ref: 'ModificadorProducto',
      },
      nombre: String,
      precioExtra: Number,
      cantidad: { type: Number, default: 1 },
    }],
    comentario: String,
  },
  { _id: false }
);

const PedidoKioskSchema = new Schema<IPedidoKiosk>(
  {
    numeroPedido: {
      type: String,
      required: true,
      unique: true,
    },
    codigoRecogida: String,
    kioskId: {
      type: Schema.Types.ObjectId,
      ref: 'KioskRegistrado',
      required: true,
    },
    salonId: {
      type: Schema.Types.ObjectId,
      ref: 'Salon',
    },
    mesaId: {
      type: Schema.Types.ObjectId,
      ref: 'Mesa',
    },
    sesionId: {
      type: Schema.Types.ObjectId,
      ref: 'SesionKiosk',
    },
    estado: {
      type: String,
      enum: [
        'pendiente_pago',
        'pendiente_validacion',
        'confirmado',
        'en_preparacion',
        'listo',
        'entregado',
        'cancelado',
      ],
      default: 'pendiente_pago',
      required: true,
    },
    tipoServicio: {
      type: String,
      enum: ['en_local', 'para_llevar'],
      default: 'en_local',
    },
    cliente: {
      nombre: String,
      telefono: String,
      email: String,
    },
    lineas: [LineaPedidoKioskSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    impuestos: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    pagado: {
      type: Boolean,
      default: false,
    },
    metodoPago: {
      type: String,
      enum: ['tarjeta', 'bizum', 'efectivo', 'pendiente_tpv'],
    },
    fechaPago: Date,
    referenciaPago: String,
    tpvDestinoId: {
      type: Schema.Types.ObjectId,
      ref: 'TPVRegistrado',
    },
    comandasIds: [{
      type: Schema.Types.ObjectId,
      ref: 'ComandaCocina',
    }],
    facturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Factura',
    },
    notas: String,
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaConfirmacion: Date,
    fechaPreparacion: Date,
    fechaListo: Date,
    fechaEntrega: Date,
    fechaCancelacion: Date,
    motivoCancelacion: String,
  },
  {
    timestamps: true,
  }
);

// Indices
PedidoKioskSchema.index({ kioskId: 1, estado: 1 });
PedidoKioskSchema.index({ estado: 1, fechaCreacion: -1 });
PedidoKioskSchema.index({ tpvDestinoId: 1, estado: 1 });
PedidoKioskSchema.index({ mesaId: 1, estado: 1 });
PedidoKioskSchema.index({ codigoRecogida: 1 });

// Exportar el schema para modelos dinamicos
export { PedidoKioskSchema };
