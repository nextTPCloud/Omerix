import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoOferta {
  NXM = 'nxm',                                 // 3x2, 2x1 (lleva N, paga M)
  SEGUNDA_UNIDAD = 'segunda_unidad',           // 2a unidad al X%
  UNIDAD_GRATIS = 'unidad_gratis',             // Compra X lleva Y gratis
  DESCUENTO_PORCENTAJE = 'descuento_porcentaje', // X% de descuento
  DESCUENTO_IMPORTE = 'descuento_importe',     // X euros de descuento
  PRECIO_ESPECIAL = 'precio_especial',         // Precio fijo especial
  ESCALADO = 'escalado',                       // Descuento progresivo por cantidad
}

export const TIPOS_OFERTA = [
  { value: TipoOferta.NXM, label: 'NxM (3x2, 2x1...)', descripcion: 'Lleva N unidades, paga M' },
  { value: TipoOferta.SEGUNDA_UNIDAD, label: '2a Unidad', descripcion: 'Segunda unidad con descuento' },
  { value: TipoOferta.UNIDAD_GRATIS, label: 'Unidad Gratis', descripcion: 'Compra X lleva Y gratis' },
  { value: TipoOferta.DESCUENTO_PORCENTAJE, label: 'Descuento %', descripcion: 'Porcentaje de descuento' },
  { value: TipoOferta.DESCUENTO_IMPORTE, label: 'Descuento Importe', descripcion: 'Euros de descuento' },
  { value: TipoOferta.PRECIO_ESPECIAL, label: 'Precio Especial', descripcion: 'Precio fijo promocional' },
  { value: TipoOferta.ESCALADO, label: 'Escalado', descripcion: 'Descuento progresivo por cantidad' },
];

// ============================================
// INTERFACES
// ============================================

/**
 * Escala de descuento para ofertas tipo ESCALADO
 */
export interface IEscalaDescuento {
  cantidadDesde: number;
  cantidadHasta?: number;
  descuento: number; // Porcentaje
}

/**
 * Configuracion especifica segun tipo de oferta
 */
export interface IConfiguracionOferta {
  // Para NXM: Lleva cantidadLleva, paga cantidadCompra
  cantidadLleva?: number;     // Ej: 3 (en 3x2)
  cantidadCompra?: number;    // Ej: 2 (en 3x2)

  // Para SEGUNDA_UNIDAD
  descuentoSegundaUnidad?: number;  // % descuento 2a unidad
  descuentoTerceraUnidad?: number;  // % descuento 3a unidad (opcional)

  // Para UNIDAD_GRATIS
  cantidadParaGratis?: number;      // Cada X unidades...
  unidadesGratis?: number;          // ...Y gratis
  productoGratisId?: Types.ObjectId; // Producto diferente gratis (opcional)

  // Para DESCUENTO_PORCENTAJE y DESCUENTO_IMPORTE
  descuento?: number;

  // Para PRECIO_ESPECIAL
  precioEspecial?: number;

  // Para ESCALADO
  escalas?: IEscalaDescuento[];

  // Cantidad minima para aplicar la oferta
  cantidadMinima?: number;

  // Importe minimo para aplicar la oferta
  importeMinimo?: number;
}

/**
 * Oferta / Promocion
 */
export interface IOferta extends Document {
  _id: Types.ObjectId;
  empresaId: Types.ObjectId;

  // Identificacion
  codigo: string;
  nombre: string;
  descripcion?: string;

  // Tipo y configuracion
  tipo: TipoOferta;
  configuracion: IConfiguracionOferta;

  // Productos afectados
  aplicaATodos: boolean;
  productosIncluidos?: Types.ObjectId[];
  productosExcluidos?: Types.ObjectId[];
  familiasIncluidas?: Types.ObjectId[];
  familiasExcluidas?: Types.ObjectId[];

  // Vigencia
  fechaDesde: Date;
  fechaHasta?: Date;

  // Restricción horaria (Happy Hours)
  horaDesde?: string;        // "17:00" formato HH:mm
  horaHasta?: string;        // "19:00" formato HH:mm
  diasSemana?: number[];     // [1,2,3,4,5] = lun-vie (0=dom, 6=sáb)
  esHappyHour: boolean;

  // Restricciones por cliente
  aplicaATodosClientes: boolean;
  clientesIncluidos?: Types.ObjectId[];
  clientesExcluidos?: Types.ObjectId[];
  tarifasIncluidas?: Types.ObjectId[];    // Solo clientes con estas tarifas

  // Limites de uso
  usosMaximos?: number;
  usosPorCliente?: number;
  usosActuales: number;

  // Acumulabilidad
  acumulable: boolean;
  prioridad: number;

  // Estado
  activo: boolean;

  // Visual (para mostrar en documentos/TPV)
  etiqueta?: string;    // Ej: "3x2", "-20%"
  color?: string;       // Color hex
  imagen?: string;      // URL de imagen promocional

  // Auditoria
  creadoPor?: Types.ObjectId;
  modificadoPor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMAS
// ============================================

const EscalaDescuentoSchema = new Schema<IEscalaDescuento>(
  {
    cantidadDesde: {
      type: Number,
      required: true,
      min: 1,
    },
    cantidadHasta: {
      type: Number,
      min: 1,
    },
    descuento: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const ConfiguracionOfertaSchema = new Schema<IConfiguracionOferta>(
  {
    // NxM
    cantidadLleva: { type: Number, min: 1 },
    cantidadCompra: { type: Number, min: 1 },

    // Segunda unidad
    descuentoSegundaUnidad: { type: Number, min: 0, max: 100 },
    descuentoTerceraUnidad: { type: Number, min: 0, max: 100 },

    // Unidad gratis
    cantidadParaGratis: { type: Number, min: 1 },
    unidadesGratis: { type: Number, min: 1 },
    productoGratisId: { type: Schema.Types.ObjectId, ref: 'Producto' },

    // Descuentos
    descuento: { type: Number },
    precioEspecial: { type: Number, min: 0 },

    // Escalado
    escalas: [EscalaDescuentoSchema],

    // Condiciones
    cantidadMinima: { type: Number, min: 1 },
    importeMinimo: { type: Number, min: 0 },
  },
  { _id: false }
);

const OfertaSchema = new Schema<IOferta>(
  {
    empresaId: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    codigo: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    tipo: {
      type: String,
      enum: Object.values(TipoOferta),
      required: true,
    },
    configuracion: {
      type: ConfiguracionOfertaSchema,
      required: true,
    },
    aplicaATodos: {
      type: Boolean,
      default: false,
    },
    productosIncluidos: [{
      type: Schema.Types.ObjectId,
      ref: 'Producto',
    }],
    productosExcluidos: [{
      type: Schema.Types.ObjectId,
      ref: 'Producto',
    }],
    familiasIncluidas: [{
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    }],
    familiasExcluidas: [{
      type: Schema.Types.ObjectId,
      ref: 'Familia',
    }],
    fechaDesde: {
      type: Date,
      required: true,
    },
    fechaHasta: {
      type: Date,
    },
    horaDesde: {
      type: String,
      trim: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    horaHasta: {
      type: String,
      trim: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    diasSemana: [{
      type: Number,
      min: 0,
      max: 6,
    }],
    esHappyHour: {
      type: Boolean,
      default: false,
    },
    aplicaATodosClientes: {
      type: Boolean,
      default: true,
    },
    clientesIncluidos: [{
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
    }],
    clientesExcluidos: [{
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
    }],
    tarifasIncluidas: [{
      type: Schema.Types.ObjectId,
      ref: 'Tarifa',
    }],
    usosMaximos: {
      type: Number,
      min: 1,
    },
    usosPorCliente: {
      type: Number,
      min: 1,
    },
    usosActuales: {
      type: Number,
      default: 0,
      min: 0,
    },
    acumulable: {
      type: Boolean,
      default: false,
    },
    prioridad: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    etiqueta: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    color: {
      type: String,
      trim: true,
      maxlength: 7, // #RRGGBB
    },
    imagen: {
      type: String,
      trim: true,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    modificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDICES
// ============================================

// Indice unico por codigo dentro de empresa
OfertaSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });

// Indice para buscar ofertas activas vigentes
OfertaSchema.index({ empresaId: 1, activo: 1, fechaDesde: 1, fechaHasta: 1 });

// Indice para buscar por producto
OfertaSchema.index({ productosIncluidos: 1 });
OfertaSchema.index({ familiasIncluidas: 1 });

// ============================================
// HELPERS
// ============================================

/**
 * Verifica si la fecha/hora actual cumple las restricciones horarias
 */
function estaEnHorario(
  ahora: Date,
  horaDesde?: string,
  horaHasta?: string,
  diasSemana?: number[]
): boolean {
  // Verificar día de la semana
  if (diasSemana && diasSemana.length > 0) {
    const diaActual = ahora.getDay(); // 0=dom, 6=sáb
    if (!diasSemana.includes(diaActual)) return false;
  }

  // Verificar rango horario
  if (horaDesde || horaHasta) {
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    if (horaDesde) {
      const [h, m] = horaDesde.split(':').map(Number);
      const minDesde = h * 60 + m;
      if (horaActual < minDesde) return false;
    }

    if (horaHasta) {
      const [h, m] = horaHasta.split(':').map(Number);
      const minHasta = h * 60 + m;
      if (horaActual > minHasta) return false;
    }
  }

  return true;
}

// ============================================
// VIRTUALS
// ============================================

OfertaSchema.virtual('vigente').get(function () {
  if (!this.activo) return false;
  const ahora = new Date();
  if (this.fechaDesde && ahora < this.fechaDesde) return false;
  if (this.fechaHasta && ahora > this.fechaHasta) return false;
  // Verificar limite de usos
  if (this.usosMaximos && this.usosActuales >= this.usosMaximos) return false;
  // Verificar restricción horaria
  if (this.horaDesde || this.horaHasta || (this.diasSemana && this.diasSemana.length > 0)) {
    if (!estaEnHorario(ahora, this.horaDesde, this.horaHasta, this.diasSemana)) return false;
  }
  return true;
});

OfertaSchema.virtual('tipoLabel').get(function () {
  return TIPOS_OFERTA.find(t => t.value === this.tipo)?.label || this.tipo;
});

// ============================================
// METODOS
// ============================================

/**
 * Verifica si la oferta aplica a un producto
 */
OfertaSchema.methods.aplicaAProducto = function (
  productoId: string,
  familiaId?: string
): boolean {
  // Si aplica a todos y no esta excluido
  if (this.aplicaATodos) {
    if (this.productosExcluidos?.some((p: Types.ObjectId) => p.toString() === productoId)) {
      return false;
    }
    if (familiaId && this.familiasExcluidas?.some((f: Types.ObjectId) => f.toString() === familiaId)) {
      return false;
    }
    return true;
  }

  // Si esta en productos incluidos
  if (this.productosIncluidos?.some((p: Types.ObjectId) => p.toString() === productoId)) {
    return true;
  }

  // Si su familia esta incluida
  if (familiaId && this.familiasIncluidas?.some((f: Types.ObjectId) => f.toString() === familiaId)) {
    // Y no esta excluido individualmente
    if (!this.productosExcluidos?.some((p: Types.ObjectId) => p.toString() === productoId)) {
      return true;
    }
  }

  return false;
};

/**
 * Verifica si la oferta aplica a un cliente
 */
OfertaSchema.methods.aplicaACliente = function (
  clienteId?: string,
  tarifaId?: string
): boolean {
  if (!clienteId) return this.aplicaATodosClientes;

  // Si aplica a todos los clientes y no esta excluido
  if (this.aplicaATodosClientes) {
    if (this.clientesExcluidos?.some((c: Types.ObjectId) => c.toString() === clienteId)) {
      return false;
    }
    return true;
  }

  // Si esta en clientes incluidos
  if (this.clientesIncluidos?.some((c: Types.ObjectId) => c.toString() === clienteId)) {
    return true;
  }

  // Si su tarifa esta incluida
  if (tarifaId && this.tarifasIncluidas?.some((t: Types.ObjectId) => t.toString() === tarifaId)) {
    return true;
  }

  return false;
};

/**
 * Calcula el precio resultante de aplicar la oferta
 * Retorna: { precioUnitario, unidadesGratis, etiqueta }
 */
OfertaSchema.methods.calcularPrecio = function (
  cantidad: number,
  precioUnitario: number
): { precioResultante: number; unidadesGratis: number; etiqueta: string; descuento: number } {
  const config = this.configuracion;
  let precioResultante = precioUnitario;
  let unidadesGratis = 0;
  let etiqueta = this.etiqueta || '';
  let descuento = 0;

  // Verificar cantidad minima
  if (config.cantidadMinima && cantidad < config.cantidadMinima) {
    return { precioResultante, unidadesGratis, etiqueta: '', descuento: 0 };
  }

  switch (this.tipo) {
    case TipoOferta.NXM:
      // Lleva N, paga M (solo grupos completos)
      // Ej: 3x2 = lleva 3, paga 2
      if (config.cantidadLleva && config.cantidadCompra && config.cantidadLleva > config.cantidadCompra) {
        const gruposCompletos = Math.floor(cantidad / config.cantidadLleva);
        const resto = cantidad % config.cantidadLleva;
        const unidadesPagadas = gruposCompletos * config.cantidadCompra + resto;
        unidadesGratis = cantidad - unidadesPagadas;
        precioResultante = (unidadesPagadas * precioUnitario) / cantidad;
        descuento = ((precioUnitario - precioResultante) / precioUnitario) * 100;
        etiqueta = etiqueta || `${config.cantidadLleva}x${config.cantidadCompra}`;
      }
      break;

    case TipoOferta.SEGUNDA_UNIDAD:
      // 2a unidad con descuento
      if (config.descuentoSegundaUnidad && cantidad >= 2) {
        const precioSegunda = precioUnitario * (1 - config.descuentoSegundaUnidad / 100);
        const pares = Math.floor(cantidad / 2);
        const impar = cantidad % 2;
        const totalPares = pares * (precioUnitario + precioSegunda);
        const totalImpar = impar * precioUnitario;
        precioResultante = (totalPares + totalImpar) / cantidad;
        descuento = ((precioUnitario - precioResultante) / precioUnitario) * 100;
        etiqueta = etiqueta || `2a ud. -${config.descuentoSegundaUnidad}%`;
      }
      break;

    case TipoOferta.UNIDAD_GRATIS:
      // Compra X lleva Y gratis
      if (config.cantidadParaGratis && config.unidadesGratis) {
        const gruposCompletos = Math.floor(cantidad / (config.cantidadParaGratis + config.unidadesGratis));
        unidadesGratis = gruposCompletos * config.unidadesGratis;
        const unidadesPagadas = cantidad - unidadesGratis;
        precioResultante = (unidadesPagadas * precioUnitario) / cantidad;
        descuento = ((precioUnitario - precioResultante) / precioUnitario) * 100;
        etiqueta = etiqueta || `${config.cantidadParaGratis}+${config.unidadesGratis}`;
      }
      break;

    case TipoOferta.DESCUENTO_PORCENTAJE:
      if (config.descuento) {
        precioResultante = precioUnitario * (1 - config.descuento / 100);
        descuento = config.descuento;
        etiqueta = etiqueta || `-${config.descuento}%`;
      }
      break;

    case TipoOferta.DESCUENTO_IMPORTE:
      if (config.descuento) {
        precioResultante = Math.max(0, precioUnitario - config.descuento);
        descuento = ((precioUnitario - precioResultante) / precioUnitario) * 100;
        etiqueta = etiqueta || `-${config.descuento}€`;
      }
      break;

    case TipoOferta.PRECIO_ESPECIAL:
      if (config.precioEspecial !== undefined) {
        precioResultante = config.precioEspecial;
        descuento = ((precioUnitario - precioResultante) / precioUnitario) * 100;
        etiqueta = etiqueta || 'Oferta';
      }
      break;

    case TipoOferta.ESCALADO:
      if (config.escalas && config.escalas.length > 0) {
        // Buscar escala aplicable (de mayor a menor)
        const escalasOrdenadas = [...config.escalas].sort((a, b) => b.cantidadDesde - a.cantidadDesde);
        const escalaAplicable = escalasOrdenadas.find(e => cantidad >= e.cantidadDesde);
        if (escalaAplicable) {
          precioResultante = precioUnitario * (1 - escalaAplicable.descuento / 100);
          descuento = escalaAplicable.descuento;
          etiqueta = etiqueta || `-${escalaAplicable.descuento}%`;
        }
      }
      break;
  }

  return {
    precioResultante: Math.round(precioResultante * 100) / 100,
    unidadesGratis,
    etiqueta,
    descuento: Math.round(descuento * 100) / 100,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

// Generar codigo automatico si no se proporciona
OfertaSchema.pre('save', async function (next) {
  if (!this.codigo) {
    const OfertaModel = this.constructor as Model<IOferta>;
    const count = await OfertaModel.countDocuments({ empresaId: this.empresaId });
    this.codigo = `OFE-${String(count + 1).padStart(3, '0')}`;
  }

  // Generar etiqueta automatica si no tiene
  if (!this.etiqueta) {
    const config = this.configuracion;
    switch (this.tipo) {
      case TipoOferta.NXM:
        if (config.cantidadLleva && config.cantidadCompra) {
          this.etiqueta = `${config.cantidadLleva}x${config.cantidadCompra}`;
        }
        break;
      case TipoOferta.SEGUNDA_UNIDAD:
        if (config.descuentoSegundaUnidad) {
          this.etiqueta = `2a -${config.descuentoSegundaUnidad}%`;
        }
        break;
      case TipoOferta.DESCUENTO_PORCENTAJE:
        if (config.descuento) {
          this.etiqueta = `-${config.descuento}%`;
        }
        break;
    }
  }

  next();
});

// ============================================
// EXPORT
// ============================================

export const Oferta = mongoose.model<IOferta>('Oferta', OfertaSchema);

export default Oferta;
