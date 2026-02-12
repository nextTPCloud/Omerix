import mongoose, { Schema, Document } from 'mongoose';
import { ILineaPedidoKiosk } from './PedidoKiosk';

/**
 * Modelo para Sesiones de Kiosko (especialmente para QR)
 * Gestiona sesiones temporales con carrito compartido
 */

// Item del carrito (similar a linea pero sin confirmar)
export interface IItemCarritoKiosk {
  id: string;                    // ID temporal para el item
  productoId: mongoose.Types.ObjectId;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  modificadores: Array<{
    modificadorId: mongoose.Types.ObjectId;
    nombre: string;
    precioExtra: number;
    cantidad: number;
  }>;
  comentario?: string;
}

export interface ISesionKiosk extends Document {
  _id: mongoose.Types.ObjectId;

  // Token de sesion (para URL QR)
  sessionToken: string;          // Token corto "ABC123" o UUID

  // Referencia al kiosk
  kioskId: mongoose.Types.ObjectId;

  // Vinculacion a mesa (para QR de mesa)
  salonId?: mongoose.Types.ObjectId;
  mesaId?: mongoose.Types.ObjectId;
  numeroMesa?: string;

  // Tipo de servicio seleccionado
  tipoServicio?: 'en_local' | 'para_llevar';

  // Carrito de compra
  carrito: {
    items: IItemCarritoKiosk[];
    subtotal: number;
    impuestos: number;
    total: number;
    ultimaModificacion: Date;
  };

  // Datos del cliente (si se solicitan)
  cliente?: {
    nombre?: string;
    telefono?: string;
    email?: string;
  };

  // Estado de la sesion
  estado: 'activa' | 'completada' | 'expirada' | 'abandonada';

  // Tiempos
  fechaCreacion: Date;
  expiracion: Date;
  ultimaActividad: Date;

  // Pedido generado (si se completo)
  pedidoId?: mongoose.Types.ObjectId;

  // Metadata
  userAgent?: string;
  ip?: string;
  idioma?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ItemCarritoKioskSchema = new Schema<IItemCarritoKiosk>(
  {
    id: {
      type: String,
      required: true,
    },
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

const SesionKioskSchema = new Schema<ISesionKiosk>(
  {
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    numeroMesa: String,
    tipoServicio: {
      type: String,
      enum: ['en_local', 'para_llevar'],
    },
    carrito: {
      items: [ItemCarritoKioskSchema],
      subtotal: { type: Number, default: 0 },
      impuestos: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      ultimaModificacion: { type: Date, default: Date.now },
    },
    cliente: {
      nombre: String,
      telefono: String,
      email: String,
    },
    estado: {
      type: String,
      enum: ['activa', 'completada', 'expirada', 'abandonada'],
      default: 'activa',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    expiracion: {
      type: Date,
      required: true,
    },
    ultimaActividad: {
      type: Date,
      default: Date.now,
    },
    pedidoId: {
      type: Schema.Types.ObjectId,
      ref: 'PedidoKiosk',
    },
    userAgent: String,
    ip: String,
    idioma: { type: String, default: 'es' },
  },
  {
    timestamps: true,
  }
);

// Indices
SesionKioskSchema.index({ kioskId: 1, estado: 1 });
SesionKioskSchema.index({ mesaId: 1, estado: 1 });
SesionKioskSchema.index({ expiracion: 1 }, { expireAfterSeconds: 0 }); // TTL index
SesionKioskSchema.index({ estado: 1, ultimaActividad: -1 });

// Exportar el schema para modelos dinamicos
export { SesionKioskSchema };
