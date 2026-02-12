// apps/backend/src/modules/plantillas-documento/PlantillaDocumento.ts
// Plantillas de diseño para documentos (facturas, presupuestos, albaranes, pedidos)

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum TipoDocumentoPlantilla {
  FACTURA = 'factura',
  PRESUPUESTO = 'presupuesto',
  ALBARAN = 'albaran',
  PEDIDO = 'pedido',
  FACTURA_COMPRA = 'factura_compra',
  PEDIDO_COMPRA = 'pedido_compra',
  PARTE_TRABAJO = 'parte_trabajo',
}

export enum EstiloPlantilla {
  MODERNO = 'moderno',
  CLASICO = 'clasico',
  MINIMALISTA = 'minimalista',
  CORPORATIVO = 'corporativo',
  COLORIDO = 'colorido',
}

// ============================================
// INTERFACES
// ============================================

export interface IConfiguracionColores {
  primario: string;        // Color principal (cabecera, acentos)
  secundario: string;      // Color secundario
  texto: string;           // Color del texto principal
  textoClaro: string;      // Color del texto secundario
  fondo: string;           // Color de fondo
  fondoAlterno: string;    // Color de fondo alterno (filas zebra)
  borde: string;           // Color de bordes
  exito: string;           // Verde para pagado/completado
  alerta: string;          // Amarillo para pendiente
  error: string;           // Rojo para vencido/error
}

export interface IConfiguracionFuentes {
  familia: string;         // Familia de fuentes (Arial, Helvetica, Times, etc.)
  tamañoTitulo: number;    // Tamaño del título (px)
  tamañoSubtitulo: number; // Tamaño del subtítulo (px)
  tamañoTexto: number;     // Tamaño del texto normal (px)
  tamañoPie: number;       // Tamaño del texto del pie (px)
}

export interface IConfiguracionCabecera {
  mostrarLogo: boolean;
  posicionLogo: 'izquierda' | 'centro' | 'derecha';
  anchoLogo: number;       // Ancho máximo del logo (px)
  mostrarDatosEmpresa: boolean;
  mostrarNIF: boolean;
  mostrarDireccion: boolean;
  mostrarContacto: boolean;
  mostrarWeb: boolean;
  colorFondo?: string;     // Override del color de fondo
}

export interface IConfiguracionCliente {
  posicion: 'izquierda' | 'derecha';
  mostrarTitulo: boolean;  // "DATOS DEL CLIENTE"
  mostrarCodigo: boolean;
  mostrarNIF: boolean;
  mostrarDireccion: boolean;
  mostrarContacto: boolean;
}

export interface IConfiguracionLineas {
  mostrarNumeroLinea: boolean;
  mostrarReferencia: boolean;
  mostrarDescripcion: boolean;
  mostrarCantidad: boolean;
  mostrarUnidad: boolean;
  mostrarPrecioUnitario: boolean;
  mostrarDescuento: boolean;
  mostrarIVA: boolean;
  mostrarSubtotal: boolean;
  // Configuración de columnas
  anchoReferencia?: number;
  anchoDescripcion?: number;
  anchoCantidad?: number;
  // Filas zebra (colores alternos)
  filasZebra: boolean;
}

export interface IConfiguracionTotales {
  posicion: 'derecha' | 'izquierda' | 'centrado';
  mostrarSubtotal: boolean;
  mostrarDescuentoGlobal: boolean;
  mostrarBaseImponible: boolean;
  mostrarDetalleIVA: boolean;  // Desglose por tipo de IVA
  mostrarRecargoEquivalencia: boolean;
  mostrarRetencion: boolean;
  mostrarTotal: boolean;
  resaltarTotal: boolean;
}

export interface IConfiguracionPie {
  mostrarCondiciones: boolean;
  mostrarFormaPago: boolean;
  mostrarVencimientos: boolean;
  mostrarDatosBancarios: boolean;
  mostrarFirma: boolean;
  mostrarPagina: boolean;    // Página X de Y
  textoLegal?: string;       // Texto legal adicional
}

export interface IPlantillaDocumento extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: string;

  // Identificación
  nombre: string;
  descripcion?: string;
  codigo: string;            // Código único de plantilla
  tipoDocumento: TipoDocumentoPlantilla;
  estilo: EstiloPlantilla;

  // Configuración visual
  colores: IConfiguracionColores;
  fuentes: IConfiguracionFuentes;

  // Secciones
  cabecera: IConfiguracionCabecera;
  cliente: IConfiguracionCliente;
  lineas: IConfiguracionLineas;
  totales: IConfiguracionTotales;
  pie: IConfiguracionPie;

  // Textos personalizados
  textos: {
    tituloDocumento?: string;     // "FACTURA", "PRESUPUESTO", etc.
    subtituloDocumento?: string;  // Subtítulo opcional
    encabezadoLineas?: string;    // Texto antes de las líneas
    piePagina?: string;           // Texto fijo en el pie
    condicionesPago?: string;     // Condiciones de pago por defecto
    textosLegales?: string;       // Textos legales adicionales
  };

  // Márgenes (mm)
  margenes: {
    superior: number;
    inferior: number;
    izquierdo: number;
    derecho: number;
  };

  // Configuración de papel
  papel: {
    formato: 'A4' | 'Letter' | 'A5';
    orientacion: 'vertical' | 'horizontal';
  };

  // Estado
  activa: boolean;
  esPredeterminada: boolean;
  esPlantillaSistema: boolean;  // No se puede eliminar

  // Metadatos
  preview?: string;            // URL de imagen de preview

  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ESQUEMA
// ============================================

const ConfiguracionColoresSchema = new Schema<IConfiguracionColores>({
  primario: { type: String, default: '#3b82f6' },
  secundario: { type: String, default: '#64748b' },
  texto: { type: String, default: '#1e293b' },
  textoClaro: { type: String, default: '#64748b' },
  fondo: { type: String, default: '#ffffff' },
  fondoAlterno: { type: String, default: '#f8fafc' },
  borde: { type: String, default: '#e2e8f0' },
  exito: { type: String, default: '#22c55e' },
  alerta: { type: String, default: '#f59e0b' },
  error: { type: String, default: '#ef4444' },
}, { _id: false });

const ConfiguracionFuentesSchema = new Schema<IConfiguracionFuentes>({
  familia: { type: String, default: 'Helvetica, Arial, sans-serif' },
  tamañoTitulo: { type: Number, default: 24 },
  tamañoSubtitulo: { type: Number, default: 14 },
  tamañoTexto: { type: Number, default: 10 },
  tamañoPie: { type: Number, default: 8 },
}, { _id: false });

const ConfiguracionCabeceraSchema = new Schema<IConfiguracionCabecera>({
  mostrarLogo: { type: Boolean, default: true },
  posicionLogo: { type: String, enum: ['izquierda', 'centro', 'derecha'], default: 'izquierda' },
  anchoLogo: { type: Number, default: 150 },
  mostrarDatosEmpresa: { type: Boolean, default: true },
  mostrarNIF: { type: Boolean, default: true },
  mostrarDireccion: { type: Boolean, default: true },
  mostrarContacto: { type: Boolean, default: true },
  mostrarWeb: { type: Boolean, default: false },
  colorFondo: { type: String },
}, { _id: false });

const ConfiguracionClienteSchema = new Schema<IConfiguracionCliente>({
  posicion: { type: String, enum: ['izquierda', 'derecha'], default: 'derecha' },
  mostrarTitulo: { type: Boolean, default: true },
  mostrarCodigo: { type: Boolean, default: false },
  mostrarNIF: { type: Boolean, default: true },
  mostrarDireccion: { type: Boolean, default: true },
  mostrarContacto: { type: Boolean, default: true },
}, { _id: false });

const ConfiguracionLineasSchema = new Schema<IConfiguracionLineas>({
  mostrarNumeroLinea: { type: Boolean, default: false },
  mostrarReferencia: { type: Boolean, default: true },
  mostrarDescripcion: { type: Boolean, default: true },
  mostrarCantidad: { type: Boolean, default: true },
  mostrarUnidad: { type: Boolean, default: true },
  mostrarPrecioUnitario: { type: Boolean, default: true },
  mostrarDescuento: { type: Boolean, default: true },
  mostrarIVA: { type: Boolean, default: true },
  mostrarSubtotal: { type: Boolean, default: true },
  anchoReferencia: { type: Number },
  anchoDescripcion: { type: Number },
  anchoCantidad: { type: Number },
  filasZebra: { type: Boolean, default: true },
}, { _id: false });

const ConfiguracionTotalesSchema = new Schema<IConfiguracionTotales>({
  posicion: { type: String, enum: ['derecha', 'izquierda', 'centrado'], default: 'derecha' },
  mostrarSubtotal: { type: Boolean, default: true },
  mostrarDescuentoGlobal: { type: Boolean, default: true },
  mostrarBaseImponible: { type: Boolean, default: true },
  mostrarDetalleIVA: { type: Boolean, default: true },
  mostrarRecargoEquivalencia: { type: Boolean, default: false },
  mostrarRetencion: { type: Boolean, default: false },
  mostrarTotal: { type: Boolean, default: true },
  resaltarTotal: { type: Boolean, default: true },
}, { _id: false });

const ConfiguracionPieSchema = new Schema<IConfiguracionPie>({
  mostrarCondiciones: { type: Boolean, default: true },
  mostrarFormaPago: { type: Boolean, default: true },
  mostrarVencimientos: { type: Boolean, default: true },
  mostrarDatosBancarios: { type: Boolean, default: true },
  mostrarFirma: { type: Boolean, default: false },
  mostrarPagina: { type: Boolean, default: true },
  textoLegal: { type: String },
}, { _id: false });

const PlantillaDocumentoSchema = new Schema<IPlantillaDocumento>({
  empresaId: { type: String, required: true, index: true },

  nombre: { type: String, required: true },
  descripcion: { type: String },
  codigo: { type: String, required: true },
  tipoDocumento: {
    type: String,
    enum: Object.values(TipoDocumentoPlantilla),
    required: true,
    index: true,
  },
  estilo: {
    type: String,
    enum: Object.values(EstiloPlantilla),
    default: EstiloPlantilla.MODERNO,
  },

  colores: { type: ConfiguracionColoresSchema, default: () => ({}) },
  fuentes: { type: ConfiguracionFuentesSchema, default: () => ({}) },

  cabecera: { type: ConfiguracionCabeceraSchema, default: () => ({}) },
  cliente: { type: ConfiguracionClienteSchema, default: () => ({}) },
  lineas: { type: ConfiguracionLineasSchema, default: () => ({}) },
  totales: { type: ConfiguracionTotalesSchema, default: () => ({}) },
  pie: { type: ConfiguracionPieSchema, default: () => ({}) },

  textos: {
    tituloDocumento: { type: String },
    subtituloDocumento: { type: String },
    encabezadoLineas: { type: String },
    piePagina: { type: String },
    condicionesPago: { type: String },
    textosLegales: { type: String },
  },

  margenes: {
    superior: { type: Number, default: 20 },
    inferior: { type: Number, default: 20 },
    izquierdo: { type: Number, default: 15 },
    derecho: { type: Number, default: 15 },
  },

  papel: {
    formato: { type: String, enum: ['A4', 'Letter', 'A5'], default: 'A4' },
    orientacion: { type: String, enum: ['vertical', 'horizontal'], default: 'vertical' },
  },

  activa: { type: Boolean, default: true },
  esPredeterminada: { type: Boolean, default: false },
  esPlantillaSistema: { type: Boolean, default: false },

  preview: { type: String },

  creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  modificadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
}, {
  timestamps: true,
  collection: 'plantillas_documento',
});

// Índices
PlantillaDocumentoSchema.index({ empresaId: 1, tipoDocumento: 1 });
PlantillaDocumentoSchema.index({ empresaId: 1, codigo: 1 }, { unique: true });
PlantillaDocumentoSchema.index({ empresaId: 1, esPredeterminada: 1, tipoDocumento: 1 });

// Middleware para asegurar solo una plantilla predeterminada por tipo
PlantillaDocumentoSchema.pre('save', async function(next) {
  if (this.esPredeterminada && this.isModified('esPredeterminada')) {
    // Quitar predeterminada de otras plantillas del mismo tipo
    await mongoose.model<IPlantillaDocumento>('PlantillaDocumento').updateMany(
      {
        empresaId: this.empresaId,
        tipoDocumento: this.tipoDocumento,
        _id: { $ne: this._id },
      },
      { esPredeterminada: false }
    );
  }
  next();
});

const PlantillaDocumentoModel: Model<IPlantillaDocumento> = mongoose.model<IPlantillaDocumento>(
  'PlantillaDocumento',
  PlantillaDocumentoSchema
);

export default PlantillaDocumentoModel;
