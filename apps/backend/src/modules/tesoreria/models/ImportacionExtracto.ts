import mongoose, { Schema, Document, Types } from 'mongoose';
import { OrigenExtracto } from './MovimientoExtracto';

// Estado de la sesion de importacion
export enum EstadoImportacion {
  EN_PROCESO = 'en_proceso',     // Importacion en curso
  COMPLETADA = 'completada',     // Importacion finalizada exitosamente
  CANCELADA = 'cancelada',       // Cancelada por el usuario
  ERROR = 'error',               // Error durante la importacion
}

// Interface del documento
export interface IImportacionExtracto extends Document {
  _id: Types.ObjectId;

  // Datos del archivo
  nombreArchivo: string;
  formatoOrigen: OrigenExtracto;
  tamanoArchivo?: number;         // Tamano en bytes
  hashArchivo?: string;           // Hash MD5 para detectar duplicados

  // Cuenta bancaria asociada
  cuentaBancariaId: Types.ObjectId;
  cuentaBancariaNombre?: string;

  // Rango de fechas del extracto
  fechaInicio: Date;
  fechaFin: Date;

  // Saldos (si el formato los proporciona)
  saldoInicial?: number;
  saldoFinal?: number;

  // Contadores
  totalMovimientos: number;
  movimientosConciliados: number;
  movimientosPendientes: number;
  movimientosSugeridos: number;
  movimientosDescartados: number;

  // Estado
  estado: EstadoImportacion;
  mensajeError?: string;

  // Configuracion usada para parseo (para CSV)
  configParseo?: {
    separador?: string;
    formatoFecha?: string;
    columnaFecha?: number;
    columnaConcepto?: number;
    columnaImporte?: number;
    columnaSaldo?: number;
    tieneEncabezado?: boolean;
  };

  // Auditoria
  creadoPor: Types.ObjectId;
  fechaCreacion: Date;
  finalizadoPor?: Types.ObjectId;
  fechaFinalizacion?: Date;

  activo: boolean;
}

const ImportacionExtractoSchema = new Schema<IImportacionExtracto>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    nombreArchivo: {
      type: String,
      required: true,
      trim: true,
    },

    formatoOrigen: {
      type: String,
      enum: Object.values(OrigenExtracto),
      required: true,
    },

    tamanoArchivo: Number,

    hashArchivo: {
      type: String,
      index: true,
    },

    cuentaBancariaId: {
      type: Schema.Types.ObjectId,
      ref: 'CuentaBancaria',
      required: true,
      index: true,
    },

    cuentaBancariaNombre: String,

    fechaInicio: {
      type: Date,
      required: true,
    },

    fechaFin: {
      type: Date,
      required: true,
    },

    saldoInicial: Number,
    saldoFinal: Number,

    totalMovimientos: {
      type: Number,
      default: 0,
    },

    movimientosConciliados: {
      type: Number,
      default: 0,
    },

    movimientosPendientes: {
      type: Number,
      default: 0,
    },

    movimientosSugeridos: {
      type: Number,
      default: 0,
    },

    movimientosDescartados: {
      type: Number,
      default: 0,
    },

    estado: {
      type: String,
      enum: Object.values(EstadoImportacion),
      default: EstadoImportacion.EN_PROCESO,
      index: true,
    },

    mensajeError: String,

    configParseo: {
      separador: String,
      formatoFecha: String,
      columnaFecha: Number,
      columnaConcepto: Number,
      columnaImporte: Number,
      columnaSaldo: Number,
      tieneEncabezado: Boolean,
    },

    // Auditoria
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },

    fechaCreacion: {
      type: Date,
      default: Date.now,
    },

    finalizadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },

    fechaFinalizacion: Date,

    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'importaciones_extracto',
  }
);

// Indices compuestos
ImportacionExtractoSchema.index({ cuentaBancariaId: 1, fechaCreacion: -1 });
ImportacionExtractoSchema.index({ estado: 1, cuentaBancariaId: 1 });
ImportacionExtractoSchema.index({ fechaInicio: 1, fechaFin: 1 });

// Virtuals
ImportacionExtractoSchema.virtual('tasaConciliacion').get(function() {
  if (this.totalMovimientos === 0) return 0;
  return Math.round((this.movimientosConciliados / this.totalMovimientos) * 100);
});

ImportacionExtractoSchema.virtual('periodoFormateado').get(function() {
  const opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const inicio = this.fechaInicio?.toLocaleDateString('es-ES', opciones);
  const fin = this.fechaFin?.toLocaleDateString('es-ES', opciones);
  return `${inicio} - ${fin}`;
});

export default mongoose.model<IImportacionExtracto>('ImportacionExtracto', ImportacionExtractoSchema);
