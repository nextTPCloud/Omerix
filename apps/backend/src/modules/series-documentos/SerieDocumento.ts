import mongoose, { Schema, Document, Types } from 'mongoose';

// Tipos de documento que pueden tener series
export type TipoDocumentoSerie =
  | 'presupuesto'
  | 'pedido'
  | 'albaran'
  | 'factura'
  | 'factura_rectificativa'
  | 'pedido_proveedor'
  | 'albaran_proveedor'
  | 'factura_proveedor';

export interface ISerieDocumento extends Document {
  _id: Types.ObjectId;

  // Identificación
  codigo: string; // Código de la serie (ej: A, B, FC, ALB)
  nombre: string; // Nombre descriptivo
  descripcion?: string;

  // Configuración
  tipoDocumento: TipoDocumentoSerie;
  prefijo?: string; // Prefijo del número (ej: PRES-, PED-, ALB-)
  sufijo?: string; // Sufijo opcional
  longitudNumero: number; // Longitud del número (relleno con ceros)
  siguienteNumero: number; // Siguiente número a usar

  // Opciones de formato
  incluirAnio: boolean; // Incluir año en el código (ej: 2024/0001)
  separadorAnio: string; // Separador del año (/, -, etc)
  reiniciarAnualmente: boolean; // Reiniciar numeración cada año
  ultimoAnioReinicio?: number; // Último año en que se reinició

  // Estado
  activo: boolean;
  predeterminada: boolean; // Serie por defecto para este tipo de documento

  // Auditoría
  creadoPor?: Types.ObjectId;
  actualizadoPor?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const SerieDocumentoSchema = new Schema<ISerieDocumento>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true,
    },

    codigo: {
      type: String,
      required: [true, 'El código es obligatorio'],
      trim: true,
      uppercase: true,
      maxlength: [10, 'El código no puede superar 10 caracteres'],
    },

    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede superar 100 caracteres'],
    },

    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede superar 500 caracteres'],
    },

    tipoDocumento: {
      type: String,
      required: [true, 'El tipo de documento es obligatorio'],
      enum: {
        values: [
          'presupuesto',
          'pedido',
          'albaran',
          'factura',
          'factura_rectificativa',
          'pedido_proveedor',
          'albaran_proveedor',
          'factura_proveedor',
        ],
        message: 'Tipo de documento no válido',
      },
    },

    prefijo: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'El prefijo no puede superar 20 caracteres'],
    },

    sufijo: {
      type: String,
      trim: true,
      maxlength: [20, 'El sufijo no puede superar 20 caracteres'],
    },

    longitudNumero: {
      type: Number,
      default: 5,
      min: [1, 'La longitud mínima es 1'],
      max: [10, 'La longitud máxima es 10'],
    },

    siguienteNumero: {
      type: Number,
      default: 1,
      min: [1, 'El número mínimo es 1'],
    },

    incluirAnio: {
      type: Boolean,
      default: true,
    },

    separadorAnio: {
      type: String,
      default: '/',
      maxlength: [5, 'El separador no puede superar 5 caracteres'],
    },

    reiniciarAnualmente: {
      type: Boolean,
      default: true,
    },

    ultimoAnioReinicio: {
      type: Number,
    },

    activo: {
      type: Boolean,
      default: true,
    },

    predeterminada: {
      type: Boolean,
      default: false,
    },

    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },

    actualizadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
  },
  {
    timestamps: true,
  }
);

// Índices
SerieDocumentoSchema.index({ codigo: 1, tipoDocumento: 1 }, { unique: true });
SerieDocumentoSchema.index({ tipoDocumento: 1, activo: 1 });
SerieDocumentoSchema.index({ predeterminada: 1, tipoDocumento: 1 });

// Middleware: Solo una serie puede ser predeterminada por tipo de documento
SerieDocumentoSchema.pre('save', async function (next) {
  if (this.predeterminada && this.isModified('predeterminada')) {
    await mongoose.model('SerieDocumento').updateMany(
      {
        _id: { $ne: this._id },
        tipoDocumento: this.tipoDocumento,
        predeterminada: true,
      },
      {
        predeterminada: false,
      }
    );
  }
  next();
});

// Método para generar el siguiente código de documento
SerieDocumentoSchema.methods.generarCodigo = function (): string {
  const anioActual = new Date().getFullYear();

  // Reiniciar si es necesario
  if (this.reiniciarAnualmente && this.ultimoAnioReinicio !== anioActual) {
    this.siguienteNumero = 1;
    this.ultimoAnioReinicio = anioActual;
  }

  let codigo = '';

  // Prefijo
  if (this.prefijo) {
    codigo += this.prefijo;
  }

  // Año
  if (this.incluirAnio) {
    codigo += anioActual.toString() + this.separadorAnio;
  }

  // Número con padding
  codigo += this.siguienteNumero.toString().padStart(this.longitudNumero, '0');

  // Sufijo
  if (this.sufijo) {
    codigo += this.sufijo;
  }

  return codigo;
};

// Método para incrementar el número
SerieDocumentoSchema.methods.incrementarNumero = async function (): Promise<string> {
  const codigo = this.generarCodigo();
  this.siguienteNumero += 1;
  await this.save();
  return codigo;
};

export const SerieDocumento = mongoose.model<ISerieDocumento>('SerieDocumento', SerieDocumentoSchema);
