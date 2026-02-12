import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum PlataformaEcommerce {
  PRESTASHOP = 'prestashop',
  WOOCOMMERCE = 'woocommerce',
}

export enum TipoSync {
  PRODUCTOS = 'productos',
  CATEGORIAS = 'categorias',
  STOCK = 'stock',
  PEDIDOS = 'pedidos',
  PRECIOS = 'precios',
}

export enum DireccionSync {
  SUBIR = 'subir',        // local -> ecommerce
  DESCARGAR = 'descargar', // ecommerce -> local
  BIDIRECCIONAL = 'bidireccional',
}

export enum EstadoSync {
  EXITO = 'exito',
  ERROR = 'error',
  PARCIAL = 'parcial',
}

// ============================================
// INTERFACES
// ============================================

export interface IConexionEcommerce extends Document {
  nombre: string;
  plataforma: PlataformaEcommerce;
  url: string;
  apiKey: string;
  apiSecret?: string;
  activa: boolean;
  ultimaSync?: Date;
  configuracion: {
    syncAutomatico: boolean;
    intervaloMinutos: number;
    almacenId?: string;
    tarifaId?: string;
    sincronizarStock: boolean;
    sincronizarPrecios: boolean;
    sincronizarImagenes: boolean;
    sincronizarDescripciones: boolean;
    mapeoCategoriasAuto: boolean;
    crearProductosNuevos: boolean;
    actualizarExistentes: boolean;
  };
  estadisticas: {
    productosSync: number;
    categoriasSync: number;
    ultimoError?: string;
    ultimoErrorFecha?: Date;
  };
  empresaId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISyncLog extends Document {
  conexionId: mongoose.Types.ObjectId;
  tipo: TipoSync;
  direccion: DireccionSync;
  estado: EstadoSync;
  fechaInicio: Date;
  fechaFin?: Date;
  resultados: {
    total: number;
    exitosos: number;
    fallidos: number;
    omitidos: number;
  };
  detalles: Array<{
    productoId?: string;
    sku?: string;
    accion: string;
    resultado: 'exito' | 'error' | 'omitido';
    mensaje?: string;
  }>;
  empresaId: string;
}

// ============================================
// SCHEMAS
// ============================================

export const ConexionEcommerceSchema = new Schema<IConexionEcommerce>(
  {
    nombre: { type: String, required: true },
    plataforma: {
      type: String,
      enum: Object.values(PlataformaEcommerce),
      required: true,
    },
    url: { type: String, required: true },
    apiKey: { type: String, required: true },
    apiSecret: { type: String },
    activa: { type: Boolean, default: true },
    ultimaSync: { type: Date },
    configuracion: {
      syncAutomatico: { type: Boolean, default: false },
      intervaloMinutos: { type: Number, default: 60 },
      almacenId: { type: String },
      tarifaId: { type: String },
      sincronizarStock: { type: Boolean, default: true },
      sincronizarPrecios: { type: Boolean, default: true },
      sincronizarImagenes: { type: Boolean, default: false },
      sincronizarDescripciones: { type: Boolean, default: true },
      mapeoCategoriasAuto: { type: Boolean, default: true },
      crearProductosNuevos: { type: Boolean, default: false },
      actualizarExistentes: { type: Boolean, default: true },
    },
    estadisticas: {
      productosSync: { type: Number, default: 0 },
      categoriasSync: { type: Number, default: 0 },
      ultimoError: { type: String },
      ultimoErrorFecha: { type: Date },
    },
    empresaId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const SyncLogSchema = new Schema<ISyncLog>(
  {
    conexionId: { type: Schema.Types.ObjectId, ref: 'ConexionEcommerce', required: true },
    tipo: { type: String, enum: Object.values(TipoSync), required: true },
    direccion: { type: String, enum: Object.values(DireccionSync), required: true },
    estado: { type: String, enum: Object.values(EstadoSync), required: true },
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date },
    resultados: {
      total: { type: Number, default: 0 },
      exitosos: { type: Number, default: 0 },
      fallidos: { type: Number, default: 0 },
      omitidos: { type: Number, default: 0 },
    },
    detalles: [
      {
        productoId: String,
        sku: String,
        accion: String,
        resultado: { type: String, enum: ['exito', 'error', 'omitido'] },
        mensaje: String,
      },
    ],
    empresaId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Indices
ConexionEcommerceSchema.index({ empresaId: 1 });
SyncLogSchema.index({ conexionId: 1, fechaInicio: -1 });
SyncLogSchema.index({ empresaId: 1, fechaInicio: -1 });

// Modelos por defecto (para uso fuera de multi-tenant)
export const ConexionEcommerce = mongoose.model<IConexionEcommerce>('ConexionEcommerce', ConexionEcommerceSchema);
export const SyncLog = mongoose.model<ISyncLog>('SyncLog', SyncLogSchema);
