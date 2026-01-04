import mongoose, { Schema, Document } from 'mongoose';

export interface ITPVRegistrado extends Document {
  _id: mongoose.Types.ObjectId;
  // empresaId ya no es necesario - cada empresa tiene su propia BD

  // Identificacion
  codigo: string;              // "TPV-001" (auto-generado)
  nombre: string;              // "Caja Principal"
  deviceId: string;            // UUID unico generado en activacion

  // Autenticacion
  secretHash: string;          // Hash del tpvSecret
  tokenVersion: number;        // Para invalidar tokens (se incrementa al revocar)

  // Configuracion asignada (opcional - se puede configurar despues)
  almacenId?: mongoose.Types.ObjectId;
  serieFactura: string;        // Serie para facturas simplificadas

  config: {
    // Opciones de venta
    permitirDescuentos: boolean;
    descuentoMaximo: number;
    permitirPrecioManual: boolean;
    modoOfflinePermitido: boolean;
    diasCacheProductos: number;

    // Impresora de tickets
    impresoraTicket?: {
      activa: boolean;
      tipo: 'usb' | 'red' | 'bluetooth' | 'serial';
      conexion: string;
      anchoTicket: 58 | 80;
    };

    // Impresora de cocina
    impresoraCocina?: {
      activa: boolean;
      tipo: 'usb' | 'red' | 'bluetooth' | 'serial';
      conexion: string;
      anchoTicket: 58 | 80;
    };

    // Visor de cliente
    visorCliente?: {
      activo: boolean;
      tipo: 'serial' | 'usb' | 'red';
      conexion: string;
      lineas: number; // 2 o 4 lineas
    };

    // Cajon portamonedas
    cajonPortamonedas?: {
      activo: boolean;
      tipo: 'impresora' | 'serial' | 'usb'; // impresora = se abre via impresora
      conexion?: string; // solo si no es via impresora
      abrirAlCobrar: boolean;
      abrirAlAbrirCaja: boolean;
    };

    // Lector de codigo de barras
    lectorCodigoBarras?: {
      activo: boolean;
      tipo: 'usb' | 'serial' | 'bluetooth';
      prefijo?: string;
      sufijo?: string;
    };

    // Bascula
    bascula?: {
      activa: boolean;
      tipo: 'serial' | 'usb';
      conexion: string;
      protocolo: 'epelsa' | 'dibal' | 'marques' | 'generico';
    };
  };

  // Estado y monitoreo
  estado: 'activo' | 'suspendido' | 'desactivado';
  ultimoAcceso?: Date;
  ultimaIP?: string;
  ultimaSync?: Date;
  versionApp?: string;

  // Desactivacion
  desactivadoPor?: mongoose.Types.ObjectId;
  motivoDesactivacion?: string;
  fechaDesactivacion?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const TPVRegistradoSchema = new Schema<ITPVRegistrado>(
  {
    // empresaId ya no es necesario - cada empresa tiene su propia BD
    codigo: {
      type: String,
      required: true,
      unique: true, // Unico dentro de la BD de empresa
    },
    nombre: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    secretHash: {
      type: String,
      required: true,
    },
    tokenVersion: {
      type: Number,
      default: 1,
    },
    almacenId: {
      type: Schema.Types.ObjectId,
      ref: 'Almacen',
      required: false, // Opcional - se puede configurar despues de la activacion
    },
    serieFactura: {
      type: String,
      default: 'FS', // Factura Simplificada
    },
    config: {
      // Opciones de venta
      permitirDescuentos: { type: Boolean, default: true },
      descuentoMaximo: { type: Number, default: 100 },
      permitirPrecioManual: { type: Boolean, default: false },
      modoOfflinePermitido: { type: Boolean, default: true },
      diasCacheProductos: { type: Number, default: 7 },

      // Impresora de tickets
      impresoraTicket: {
        activa: { type: Boolean, default: false },
        tipo: { type: String, enum: ['usb', 'red', 'bluetooth', 'serial'] },
        conexion: String,
        anchoTicket: { type: Number, enum: [58, 80], default: 80 },
      },

      // Impresora de cocina
      impresoraCocina: {
        activa: { type: Boolean, default: false },
        tipo: { type: String, enum: ['usb', 'red', 'bluetooth', 'serial'] },
        conexion: String,
        anchoTicket: { type: Number, enum: [58, 80], default: 80 },
      },

      // Visor de cliente
      visorCliente: {
        activo: { type: Boolean, default: false },
        tipo: { type: String, enum: ['serial', 'usb', 'red'] },
        conexion: String,
        lineas: { type: Number, default: 2 },
      },

      // Cajon portamonedas
      cajonPortamonedas: {
        activo: { type: Boolean, default: false },
        tipo: { type: String, enum: ['impresora', 'serial', 'usb'], default: 'impresora' },
        conexion: String,
        abrirAlCobrar: { type: Boolean, default: true },
        abrirAlAbrirCaja: { type: Boolean, default: true },
      },

      // Lector de codigo de barras
      lectorCodigoBarras: {
        activo: { type: Boolean, default: true },
        tipo: { type: String, enum: ['usb', 'serial', 'bluetooth'], default: 'usb' },
        prefijo: String,
        sufijo: String,
      },

      // Bascula
      bascula: {
        activa: { type: Boolean, default: false },
        tipo: { type: String, enum: ['serial', 'usb'] },
        conexion: String,
        protocolo: { type: String, enum: ['epelsa', 'dibal', 'marques', 'generico'] },
      },
    },
    estado: {
      type: String,
      enum: ['activo', 'suspendido', 'desactivado'],
      default: 'activo',
    },
    ultimoAcceso: Date,
    ultimaIP: String,
    ultimaSync: Date,
    versionApp: String,
    desactivadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    motivoDesactivacion: String,
    fechaDesactivacion: Date,
  },
  {
    timestamps: true,
  }
);

// Indices - Ya no necesitan empresaId porque cada empresa tiene su propia BD
TPVRegistradoSchema.index({ estado: 1 });
// deviceId ya tiene unique: true en la definición del campo

// Exportar el schema para modelos dinamicos (NO exportar modelo para evitar colecciones en BD principal)
export { TPVRegistradoSchema };

// NO exportar modelo por defecto - solo se usa via dynamic-models.helper.ts
// Si se necesita compatibilidad temporal, usar el helper getTPVRegistradoModel
