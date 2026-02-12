import mongoose, { Schema, Document } from 'mongoose';

/**
 * Schema de Salón
 * Representa áreas físicas del establecimiento (Terraza, Interior, VIP, etc.)
 * Se usa para organizar mesas y asignar a TPVs
 */

export interface ISalon extends Document {
  nombre: string;                   // Ej: "Terraza", "Interior", "Sala VIP"
  codigo?: string;
  descripcion?: string;
  color?: string;                   // Color para identificar en UI
  icono?: string;                   // Icono lucide-react

  // Configuración visual del plano
  plano?: {
    ancho: number;                  // Ancho del plano en unidades
    alto: number;                   // Alto del plano en unidades
    imagenFondo?: string;           // URL de imagen de fondo (plano arquitectónico)
    escala: number;                 // Escala de visualización
  };

  // Capacidad
  capacidadTotal?: number;          // Capacidad máxima de personas
  capacidadMesas?: number;          // Número máximo de mesas

  // Asignación
  almacenId?: mongoose.Types.ObjectId;          // Almacén/Local al que pertenece
  tpvsIds?: mongoose.Types.ObjectId[];          // TPVs que pueden usar este salón
  zonasPreparacionIds?: mongoose.Types.ObjectId[]; // Zonas de preparación asociadas

  // Horarios de disponibilidad
  horarios?: {
    lunes?: { desde: string; hasta: string; cerrado?: boolean };
    martes?: { desde: string; hasta: string; cerrado?: boolean };
    miercoles?: { desde: string; hasta: string; cerrado?: boolean };
    jueves?: { desde: string; hasta: string; cerrado?: boolean };
    viernes?: { desde: string; hasta: string; cerrado?: boolean };
    sabado?: { desde: string; hasta: string; cerrado?: boolean };
    domingo?: { desde: string; hasta: string; cerrado?: boolean };
  };

  // Configuración de servicio
  configuracion?: {
    permiteFumar: boolean;
    tieneClimatizacion: boolean;
    esExterior: boolean;
    tieneMusica: boolean;
    tieneTV: boolean;
    accesibleMinusvalidos: boolean;
    requiereReserva: boolean;        // Solo con reserva previa
    suplemento?: number;             // Suplemento por usar este salón (%)
  };

  orden: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SalonSchema = new Schema<ISalon>(
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
    icono: {
      type: String,
      default: 'LayoutGrid',
    },
    plano: {
      ancho: { type: Number, default: 20 },
      alto: { type: Number, default: 15 },
      imagenFondo: String,
      escala: { type: Number, default: 1 },
    },
    capacidadTotal: {
      type: Number,
    },
    capacidadMesas: {
      type: Number,
    },
    almacenId: {
      type: Schema.Types.ObjectId,
      ref: 'Almacen',
    },
    tpvsIds: [{
      type: Schema.Types.ObjectId,
      ref: 'TPVRegistrado',
    }],
    zonasPreparacionIds: [{
      type: Schema.Types.ObjectId,
      ref: 'ZonaPreparacion',
    }],
    horarios: {
      lunes: { desde: String, hasta: String, cerrado: Boolean },
      martes: { desde: String, hasta: String, cerrado: Boolean },
      miercoles: { desde: String, hasta: String, cerrado: Boolean },
      jueves: { desde: String, hasta: String, cerrado: Boolean },
      viernes: { desde: String, hasta: String, cerrado: Boolean },
      sabado: { desde: String, hasta: String, cerrado: Boolean },
      domingo: { desde: String, hasta: String, cerrado: Boolean },
    },
    configuracion: {
      permiteFumar: { type: Boolean, default: false },
      tieneClimatizacion: { type: Boolean, default: false },
      esExterior: { type: Boolean, default: false },
      tieneMusica: { type: Boolean, default: false },
      tieneTV: { type: Boolean, default: false },
      accesibleMinusvalidos: { type: Boolean, default: true },
      requiereReserva: { type: Boolean, default: false },
      suplemento: { type: Number, default: 0 },
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

// Índices
SalonSchema.index({ nombre: 1 }, { unique: true });
SalonSchema.index({ activo: 1 });
SalonSchema.index({ almacenId: 1 });
SalonSchema.index({ tpvsIds: 1 });

export const Salon = mongoose.model<ISalon>('Salon', SalonSchema);
