import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Zona de Preparación
 * Representa áreas de cocina/preparación (Cocina, Barra, Postres, etc.)
 * Se usa para el sistema KDS (Kitchen Display System)
 */

export interface IZonaPreparacion extends Document {
  nombre: string;                   // Ej: "Cocina Principal", "Barra", "Postres"
  codigo?: string;
  descripcion?: string;
  color?: string;                   // Color para identificar en UI

  // Configuración de impresión
  impresoraId?: mongoose.Types.ObjectId;        // Impresora asignada
  imprimirComanda: boolean;                     // Si imprime comandas
  copias: number;                               // Número de copias

  // Configuración de monitor/KDS
  tieneMonitor: boolean;                        // Si tiene pantalla KDS
  configuracionMonitor?: {
    sonidoNuevaComanda: boolean;
    sonidoUrgente: boolean;
    tiempoAlertaMinutos: number;                // Alerta si supera este tiempo
    mostrarTiempoPreparacion: boolean;
    ordenVisualizacion: 'fifo' | 'prioridad' | 'mesa';
    columnas: number;                           // Columnas en pantalla
  };

  // Asignación
  almacenId?: mongoose.Types.ObjectId;          // Almacén/Local
  familiasIds?: mongoose.Types.ObjectId[];      // Familias que prepara esta zona

  // Horarios (opcional)
  horarios?: {
    lunes?: { desde: string; hasta: string };
    martes?: { desde: string; hasta: string };
    miercoles?: { desde: string; hasta: string };
    jueves?: { desde: string; hasta: string };
    viernes?: { desde: string; hasta: string };
    sabado?: { desde: string; hasta: string };
    domingo?: { desde: string; hasta: string };
  };

  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ZonaPreparacionSchema = new Schema<IZonaPreparacion>(
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
    descripcion: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    impresoraId: {
      type: Schema.Types.ObjectId,
      ref: 'Impresora',
    },
    imprimirComanda: {
      type: Boolean,
      default: true,
    },
    copias: {
      type: Number,
      default: 1,
    },
    tieneMonitor: {
      type: Boolean,
      default: false,
    },
    configuracionMonitor: {
      sonidoNuevaComanda: { type: Boolean, default: true },
      sonidoUrgente: { type: Boolean, default: true },
      tiempoAlertaMinutos: { type: Number, default: 15 },
      mostrarTiempoPreparacion: { type: Boolean, default: true },
      ordenVisualizacion: {
        type: String,
        enum: ['fifo', 'prioridad', 'mesa'],
        default: 'fifo',
      },
      columnas: { type: Number, default: 4 },
    },
    almacenId: {
      type: Schema.Types.ObjectId,
      ref: 'Almacen',
    },
    familiasIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    }],
    horarios: {
      lunes: { desde: String, hasta: String },
      martes: { desde: String, hasta: String },
      miercoles: { desde: String, hasta: String },
      jueves: { desde: String, hasta: String },
      viernes: { desde: String, hasta: String },
      sabado: { desde: String, hasta: String },
      domingo: { desde: String, hasta: String },
    },
    orden: {
      type: Number,
      default: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices (sin empresaId porque cada empresa tiene su propia BD)
ZonaPreparacionSchema.index({ nombre: 1 }, { unique: true });
ZonaPreparacionSchema.index({ activo: 1 });
ZonaPreparacionSchema.index({ almacenId: 1 });

export const ZonaPreparacion = mongoose.model<IZonaPreparacion>('ZonaPreparacion', ZonaPreparacionSchema);
