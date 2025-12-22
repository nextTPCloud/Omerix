import { Schema, model, Document, Model, Types } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoInventario {
  BORRADOR = 'borrador',
  EN_CONTEO = 'en_conteo',
  PENDIENTE_REVISION = 'pendiente_revision',
  REGULARIZADO = 'regularizado',
  ANULADO = 'anulado',
}

export enum TipoInventario {
  TOTAL = 'total',
  PARCIAL = 'parcial',
}

export enum EstadoLineaInventario {
  PENDIENTE = 'pendiente',
  CONTADO = 'contado',
  REVISADO = 'revisado',
  REGULARIZADO = 'regularizado',
}

// ============================================
// INTERFACES
// ============================================

export interface ILineaInventario {
  _id?: Types.ObjectId;
  productoId: Types.ObjectId;
  productoCodigo: string;
  productoNombre: string;
  productoSku?: string;
  varianteId?: Types.ObjectId;
  varianteNombre?: string;
  ubicacion?: string;
  lote?: string;
  numeroSerie?: string;
  fechaCaducidad?: Date;

  // Cantidades
  stockTeorico: number;
  stockContado: number | null;
  diferencia: number;

  // Estado
  estadoLinea: EstadoLineaInventario;

  // Valoración
  costeUnitario: number;
  valorDiferencia: number;

  // Conteo
  fechaConteo?: Date;
  usuarioConteoId?: Types.ObjectId;
  usuarioConteoNombre?: string;

  // Revisión
  aprobado: boolean | null;
  motivoAjuste?: string;
  observaciones?: string;

  // Foto de evidencia
  fotoUrl?: string;
}

export interface IInventario extends Document {
  codigo: string;
  almacenId: Types.ObjectId;
  almacenNombre: string;
  tipo: TipoInventario;
  estado: EstadoInventario;

  // Filtros para inventario parcial
  familiaIds?: Types.ObjectId[];
  ubicaciones?: string[];
  soloConStock?: boolean;

  // Fechas
  fechaCreacion: Date;
  fechaInicio?: Date;
  fechaFinConteo?: Date;
  fechaRegularizacion?: Date;
  fechaAnulacion?: Date;

  // Usuarios
  usuarioCreadorId: Types.ObjectId;
  usuarioCreadorNombre: string;
  usuarioResponsableId?: Types.ObjectId;
  usuarioResponsableNombre?: string;

  // Líneas
  lineas: ILineaInventario[];

  // Totales
  totalProductos: number;
  productosContados: number;
  productosConDiferencia: number;

  // Valoración
  valorTeorico: number;
  valorContado: number;
  valorDiferencia: number;
  valorSobrante: number;
  valorFaltante: number;

  // Opciones
  bloquearMovimientos: boolean;

  // Otros
  observaciones?: string;
  motivoAnulacion?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA DE LÍNEA
// ============================================

const LineaInventarioSchema = new Schema<ILineaInventario>({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  productoCodigo: { type: String, required: true },
  productoNombre: { type: String, required: true },
  productoSku: String,
  varianteId: { type: Schema.Types.ObjectId, ref: 'Variante' },
  varianteNombre: String,
  ubicacion: String,
  lote: String,
  numeroSerie: String,
  fechaCaducidad: Date,

  stockTeorico: { type: Number, required: true, default: 0 },
  stockContado: { type: Number, default: null },
  diferencia: { type: Number, default: 0 },

  estadoLinea: {
    type: String,
    enum: Object.values(EstadoLineaInventario),
    default: EstadoLineaInventario.PENDIENTE
  },

  costeUnitario: { type: Number, default: 0 },
  valorDiferencia: { type: Number, default: 0 },

  fechaConteo: Date,
  usuarioConteoId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  usuarioConteoNombre: String,

  aprobado: { type: Boolean, default: null },
  motivoAjuste: String,
  observaciones: String,

  fotoUrl: String,
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const InventarioSchema = new Schema<IInventario>({
  codigo: { type: String, required: true },
  almacenId: { type: Schema.Types.ObjectId, ref: 'Almacen', required: true },
  almacenNombre: { type: String, required: true },
  tipo: { type: String, enum: Object.values(TipoInventario), required: true },
  estado: {
    type: String,
    enum: Object.values(EstadoInventario),
    default: EstadoInventario.BORRADOR
  },

  familiaIds: [{ type: Schema.Types.ObjectId, ref: 'Familia' }],
  ubicaciones: [String],
  soloConStock: { type: Boolean, default: false },

  fechaCreacion: { type: Date, default: Date.now },
  fechaInicio: Date,
  fechaFinConteo: Date,
  fechaRegularizacion: Date,
  fechaAnulacion: Date,

  usuarioCreadorId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  usuarioCreadorNombre: { type: String, required: true },
  usuarioResponsableId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  usuarioResponsableNombre: String,

  lineas: [LineaInventarioSchema],

  totalProductos: { type: Number, default: 0 },
  productosContados: { type: Number, default: 0 },
  productosConDiferencia: { type: Number, default: 0 },

  valorTeorico: { type: Number, default: 0 },
  valorContado: { type: Number, default: 0 },
  valorDiferencia: { type: Number, default: 0 },
  valorSobrante: { type: Number, default: 0 },
  valorFaltante: { type: Number, default: 0 },

  bloquearMovimientos: { type: Boolean, default: false },

  observaciones: String,
  motivoAnulacion: String,
}, { timestamps: true });

// ============================================
// ÍNDICES
// ============================================

InventarioSchema.index({ codigo: 1 });
InventarioSchema.index({ almacenId: 1 });
InventarioSchema.index({ estado: 1 });
InventarioSchema.index({ fechaCreacion: -1 });
InventarioSchema.index({ 'lineas.productoId': 1 });

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

InventarioSchema.statics.generarCodigo = async function(prefijo: string = 'INV'): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  return `${prefijo}-${year}-${String(count + 1).padStart(5, '0')}`;
};

// ============================================
// PRE-SAVE HOOKS
// ============================================

InventarioSchema.pre('save', function(next) {
  // Calcular totales
  this.totalProductos = this.lineas.length;
  this.productosContados = this.lineas.filter(l => l.stockContado !== null).length;
  this.productosConDiferencia = this.lineas.filter(l => l.diferencia !== 0).length;

  // Calcular valores
  let valorTeorico = 0;
  let valorContado = 0;
  let valorSobrante = 0;
  let valorFaltante = 0;

  for (const linea of this.lineas) {
    valorTeorico += linea.stockTeorico * linea.costeUnitario;

    if (linea.stockContado !== null) {
      valorContado += linea.stockContado * linea.costeUnitario;

      if (linea.diferencia > 0) {
        valorSobrante += linea.diferencia * linea.costeUnitario;
      } else if (linea.diferencia < 0) {
        valorFaltante += Math.abs(linea.diferencia) * linea.costeUnitario;
      }
    }
  }

  this.valorTeorico = valorTeorico;
  this.valorContado = valorContado;
  this.valorDiferencia = valorContado - valorTeorico;
  this.valorSobrante = valorSobrante;
  this.valorFaltante = valorFaltante;

  next();
});

// ============================================
// EXPORT MODEL
// ============================================

interface InventarioModel extends Model<IInventario> {
  generarCodigo(prefijo?: string): Promise<string>;
}

export const Inventario = model<IInventario, InventarioModel>('Inventario', InventarioSchema);
export default Inventario;
