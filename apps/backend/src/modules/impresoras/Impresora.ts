import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Impresora
 * Gestiona las impresoras de tickets, cocina, etiquetas, etc.
 */

export interface IImpresora extends Document {
  nombre: string;                   // Ej: "Impresora Cocina", "Ticket Principal"
  codigo?: string;                  // Código único
  tipo: 'ticket' | 'cocina' | 'etiquetas' | 'factura' | 'comanda';

  // Configuración de conexión
  conexion: {
    tipo: 'usb' | 'red' | 'bluetooth' | 'serial';
    ip?: string;
    puerto?: number;
    mac?: string;                   // Para bluetooth
    puertoSerial?: string;          // COM1, /dev/ttyUSB0
    nombreWindows?: string;         // Nombre en Windows
    nombreCups?: string;            // Nombre en CUPS (Linux/Mac)
  };

  // Configuración de impresión
  configuracion: {
    anchoCaracteres: number;        // 32, 40, 48...
    cortarPapel: boolean;
    abrirCajon: boolean;
    imprimirLogo: boolean;
    logoUrl?: string;
    tamanoFuente: 'pequeno' | 'normal' | 'grande';
    copias: number;
    margenSuperior: number;
    margenInferior: number;
  };

  // Asignación
  almacenId?: mongoose.Types.ObjectId;          // Almacén/Tienda asignada
  zonasPreparacionIds?: mongoose.Types.ObjectId[]; // Zonas que imprime
  puntoVentaIds?: mongoose.Types.ObjectId[];    // TPVs que usan esta impresora

  // Estado
  predeterminada: boolean;          // Si es la impresora por defecto del tipo
  activo: boolean;
  ultimaConexion?: Date;
  estadoConexion: 'online' | 'offline' | 'error' | 'desconocido';

  createdAt: Date;
  updatedAt: Date;
}

const ImpresoraSchema = new Schema<IImpresora>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    codigo: {
      type: String,
      trim: true,
      uppercase: true,
    },
    tipo: {
      type: String,
      enum: ['ticket', 'cocina', 'etiquetas', 'factura', 'comanda'],
      required: true,
    },
    conexion: {
      tipo: {
        type: String,
        enum: ['usb', 'red', 'bluetooth', 'serial'],
        required: true,
      },
      ip: String,
      puerto: { type: Number, default: 9100 },
      mac: String,
      puertoSerial: String,
      nombreWindows: String,
      nombreCups: String,
    },
    configuracion: {
      anchoCaracteres: { type: Number, default: 48 },
      cortarPapel: { type: Boolean, default: true },
      abrirCajon: { type: Boolean, default: false },
      imprimirLogo: { type: Boolean, default: true },
      logoUrl: String,
      tamanoFuente: {
        type: String,
        enum: ['pequeno', 'normal', 'grande'],
        default: 'normal',
      },
      copias: { type: Number, default: 1 },
      margenSuperior: { type: Number, default: 0 },
      margenInferior: { type: Number, default: 3 },
    },
    almacenId: {
      type: Schema.Types.ObjectId,
      ref: 'Almacen',
    },
    zonasPreparacionIds: [{
      type: Schema.Types.ObjectId,
      ref: 'ZonaPreparacion',
    }],
    puntoVentaIds: [{
      type: Schema.Types.ObjectId,
      ref: 'PuntoVenta',
    }],
    predeterminada: {
      type: Boolean,
      default: false,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    ultimaConexion: Date,
    estadoConexion: {
      type: String,
      enum: ['online', 'offline', 'error', 'desconocido'],
      default: 'desconocido',
    },
  },
  {
    timestamps: true,
  }
);

// Índices (sin empresaId porque cada empresa tiene su propia BD)
ImpresoraSchema.index({ nombre: 1 }, { unique: true });
ImpresoraSchema.index({ tipo: 1 });
ImpresoraSchema.index({ activo: 1 });
ImpresoraSchema.index({ almacenId: 1 });

export const Impresora = mongoose.model<IImpresora>('Impresora', ImpresoraSchema);
