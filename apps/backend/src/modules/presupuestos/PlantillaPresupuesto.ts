import mongoose, { Schema, Document, Model } from 'mongoose';
import { TipoLinea, ILineaPresupuesto, ICondicionesComerciales } from './Presupuesto';

// ============================================
// INTERFACES
// ============================================

export interface ILineaPlantilla {
  orden: number;
  tipo: TipoLinea;
  productoId?: mongoose.Types.ObjectId;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  descripcionLarga?: string;
  sku?: string;
  cantidad: number;
  unidad?: string;
  precioUnitario: number;
  costeUnitario: number;
  descuento: number;
  iva: number;
  esEditable: boolean;
  incluidoEnTotal: boolean;
  notasInternas?: string;
}

export interface IPlantillaPresupuesto extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificación
  nombre: string;
  codigo?: string;
  descripcion?: string;
  categoria?: string;

  // Contenido de la plantilla
  lineas: ILineaPlantilla[];

  // Textos predefinidos
  introduccion?: string;
  piePagina?: string;
  condicionesLegales?: string;

  // Condiciones por defecto
  condiciones?: Partial<ICondicionesComerciales>;

  // Descuento global por defecto
  descuentoGlobalPorcentaje?: number;

  // Configuración
  activo: boolean;
  esPublica: boolean; // Si otros usuarios pueden usarla
  tags?: string[];

  // Estadísticas de uso
  vecesUsada: number;
  ultimoUso?: Date;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;
}

// ============================================
// SCHEMA
// ============================================

const LineaPlantillaSchema = new Schema<ILineaPlantilla>({
  orden: { type: Number, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoLinea),
    default: TipoLinea.PRODUCTO,
  },
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  codigo: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  descripcionLarga: { type: String, trim: true },
  sku: { type: String, trim: true },
  cantidad: { type: Number, required: true, min: 0, default: 1 },
  unidad: { type: String, trim: true, default: 'ud' },
  precioUnitario: { type: Number, required: true, min: 0, default: 0 },
  costeUnitario: { type: Number, default: 0, min: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  iva: { type: Number, required: true, default: 21 },
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },
  notasInternas: { type: String },
}, { _id: true });

const PlantillaPresupuestoSchema = new Schema<IPlantillaPresupuesto>({
  nombre: { type: String, required: true, trim: true },
  codigo: { type: String, trim: true },
  descripcion: { type: String, trim: true },
  categoria: { type: String, trim: true },

  lineas: { type: [LineaPlantillaSchema], default: [] },

  introduccion: { type: String },
  piePagina: { type: String },
  condicionesLegales: { type: String },

  condiciones: {
    formaPagoId: { type: Schema.Types.ObjectId, ref: 'FormaPago' },
    terminoPagoId: { type: Schema.Types.ObjectId, ref: 'TerminoPago' },
    validezDias: { type: Number, default: 30 },
    tiempoEntrega: { type: String },
    garantia: { type: String },
    portesPagados: { type: Boolean, default: true },
    portesImporte: { type: Number },
    observacionesEntrega: { type: String },
  },

  descuentoGlobalPorcentaje: { type: Number, default: 0 },

  activo: { type: Boolean, default: true },
  esPublica: { type: Boolean, default: false },
  tags: [{ type: String, lowercase: true, trim: true }],

  vecesUsada: { type: Number, default: 0 },
  ultimoUso: { type: Date },

  creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  modificadoPor: { type: Schema.Types.ObjectId, ref: 'User' },
  fechaCreacion: { type: Date, default: Date.now },
  fechaModificacion: { type: Date },
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Índices
PlantillaPresupuestoSchema.index({ nombre: 1 });
PlantillaPresupuestoSchema.index({ categoria: 1 });
PlantillaPresupuestoSchema.index({ activo: 1 });
PlantillaPresupuestoSchema.index({ creadoPor: 1 });
PlantillaPresupuestoSchema.index({ tags: 1 });

export const PlantillaPresupuesto = mongoose.model<IPlantillaPresupuesto>('PlantillaPresupuesto', PlantillaPresupuestoSchema);

export default PlantillaPresupuesto;
