import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum EstadoPresupuesto {
  BORRADOR = 'borrador',
  ENVIADO = 'enviado',
  PENDIENTE = 'pendiente',
  ACEPTADO = 'aceptado',
  RECHAZADO = 'rechazado',
  CADUCADO = 'caducado',
  CONVERTIDO = 'convertido', // Convertido a pedido/factura
}

export enum TipoLinea {
  PRODUCTO = 'producto',
  SERVICIO = 'servicio',
  KIT = 'kit',
  TEXTO = 'texto', // Línea descriptiva sin importe
  SUBTOTAL = 'subtotal',
  DESCUENTO = 'descuento',
}

// ============================================
// INTERFACES
// ============================================

// Componente de Kit dentro de una línea
export interface IComponenteKit {
  productoId: mongoose.Types.ObjectId;
  nombre: string;
  sku?: string;
  cantidad: number;
  precioUnitario: number;
  costeUnitario: number;
  descuento: number;
  iva: number;
  subtotal: number;
  opcional: boolean;
  seleccionado: boolean; // Si el cliente lo selecciona cuando es opcional
}

// Variante seleccionada
export interface IVarianteSeleccionada {
  varianteId?: string;
  sku: string;
  combinacion: Record<string, string>; // { talla: "M", color: "Rojo" }
  precioAdicional: number;
  costeAdicional: number;
}

// Línea de presupuesto con costes y márgenes
export interface ILineaPresupuesto {
  _id?: mongoose.Types.ObjectId;
  orden: number;
  tipo: TipoLinea;

  // Producto/Servicio
  productoId?: mongoose.Types.ObjectId;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  descripcionLarga?: string;
  sku?: string;

  // Variante (si aplica)
  variante?: IVarianteSeleccionada;

  // Cantidades
  cantidad: number;
  unidad?: string;

  // Peso
  peso?: number; // Peso unitario en kg
  pesoTotal?: number; // Peso total de la línea (peso * cantidad)

  // PRECIOS (lo que ve el cliente)
  precioUnitario: number;
  descuento: number; // Porcentaje
  descuentoImporte: number; // Importe calculado
  subtotal: number; // Sin IVA
  iva: number; // Porcentaje
  ivaImporte: number;
  total: number; // Con IVA

  // COSTES (internos, no visibles para cliente)
  costeUnitario: number;
  costeTotalLinea: number;

  // MÁRGENES (calculados)
  margenUnitario: number; // precioUnitario - costeUnitario
  margenPorcentaje: number; // ((precio - coste) / coste) * 100
  margenTotalLinea: number;

  // Componentes del Kit (si tipo = 'kit')
  componentesKit?: IComponenteKit[];
  mostrarComponentes: boolean; // Si se muestran desglosados en el presupuesto

  // Flags
  esEditable: boolean;
  incluidoEnTotal: boolean; // Para líneas de texto que no suman

  // Notas internas (no visibles en impresión cliente)
  notasInternas?: string;

  // Información del origen del precio (tarifas/ofertas)
  infoPrecio?: {
    origen: 'producto' | 'tarifa' | 'oferta' | 'precio_cantidad' | 'manual';
    tarifaId?: mongoose.Types.ObjectId;
    tarifaNombre?: string;
    ofertaId?: mongoose.Types.ObjectId;
    ofertaNombre?: string;
    ofertaTipo?: string;
    etiquetaOferta?: string;
    precioOriginal?: number;
    unidadesGratis?: number;
  };
}

// Dirección de entrega
export interface IDireccionEntrega {
  tipo: 'cliente' | 'personalizada' | 'recogida';
  direccionId?: mongoose.Types.ObjectId; // Si es del cliente
  nombre?: string;
  calle?: string;
  numero?: string;
  piso?: string;
  codigoPostal?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  personaContacto?: string;
  telefonoContacto?: string;
  horarioEntrega?: string;
  instrucciones?: string;
}

// Condiciones comerciales
export interface ICondicionesComerciales {
  formaPagoId?: mongoose.Types.ObjectId;
  terminoPagoId?: mongoose.Types.ObjectId;
  validezDias: number; // Días de validez del presupuesto
  tiempoEntrega?: string; // Ej: "2-3 semanas"
  garantia?: string;
  portesPagados: boolean;
  portesImporte?: number;
  observacionesEntrega?: string;
}

// Totales del presupuesto
export interface ITotalesPresupuesto {
  // Subtotales
  subtotalBruto: number; // Suma de líneas antes de descuentos
  totalDescuentos: number;
  subtotalNeto: number; // Después de descuentos, antes de IVA

  // IVA desglosado
  desgloseIva: {
    tipo: number; // 21, 10, 4, 0
    base: number;
    cuota: number;
  }[];
  totalIva: number;

  // Total final
  totalPresupuesto: number;

  // COSTES TOTALES (internos)
  costeTotalMateriales: number;
  costeTotalServicios: number;
  costeTotalKits: number;
  costeTotal: number;

  // MÁRGENES TOTALES
  margenBruto: number; // totalPresupuesto - costeTotal
  margenPorcentaje: number; // (margenBruto / costeTotal) * 100

  // PESO TOTAL
  pesoTotal?: number; // Suma de todos los pesos de las líneas
}

// Documento adjunto
export interface IDocumentoPresupuesto {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
  subidoPor: mongoose.Types.ObjectId;
  visibleCliente: boolean;
}

// Historial de cambios
export interface IHistorialPresupuesto {
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  accion: string;
  descripcion?: string;
  datosAnteriores?: any;
}

// Notas de seguimiento
export interface INotaSeguimiento {
  _id?: mongoose.Types.ObjectId;
  fecha: Date;
  usuarioId: mongoose.Types.ObjectId;
  tipo: 'llamada' | 'email' | 'reunion' | 'nota' | 'recordatorio';
  contenido: string;
  resultado?: string;
  proximaAccion?: string;
  fechaProximaAccion?: Date;
}

// Recordatorio enviado
export interface IRecordatorioEnviado {
  _id?: mongoose.Types.ObjectId;
  fecha: Date;
  tipo: 'expiracion' | 'seguimiento' | 'sin_respuesta';
  destinatario: string; // Email
  enviado: boolean;
  error?: string;
  messageId?: string;
}

// Respuesta del cliente a través del portal
export interface IRespuestaCliente {
  fecha: Date;
  aceptado: boolean;
  comentarios?: string;
  nombreFirmante?: string;
  ipCliente?: string;
  userAgent?: string;
}

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface IPresupuesto extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificación
  codigo: string;
  serie: string;
  numero: number;
  version: number; // Para revisiones del mismo presupuesto
  presupuestoOrigenId?: mongoose.Types.ObjectId; // Si es revisión de otro

  // Estado
  estado: EstadoPresupuesto;

  // Fechas
  fecha: Date;
  fechaValidez: Date;
  fechaEnvio?: Date;
  fechaRespuesta?: Date;
  contadorEnvios: number;

  // Cliente
  clienteId: mongoose.Types.ObjectId;
  clienteNombre: string; // Snapshot del nombre
  clienteNif: string; // Snapshot del NIF
  clienteEmail?: string;
  clienteTelefono?: string;
  direccionFacturacion?: IDireccionEntrega;

  // Entrega
  direccionEntrega?: IDireccionEntrega;
  fechaEntregaPrevista?: Date;

  // Proyecto y parte de trabajo asociados
  proyectoId?: mongoose.Types.ObjectId;
  parteTrabajoId?: mongoose.Types.ObjectId;

  // Agente comercial
  agenteComercialId?: mongoose.Types.ObjectId;

  // Referencia del cliente
  referenciaCliente?: string;
  pedidoCliente?: string;

  // Título y descripción
  titulo?: string;
  descripcion?: string;

  // Líneas del presupuesto
  lineas: ILineaPresupuesto[];

  // Condiciones
  condiciones: ICondicionesComerciales;

  // Totales
  totales: ITotalesPresupuesto;

  // Descuento global (adicional al de líneas)
  descuentoGlobalPorcentaje: number;
  descuentoGlobalImporte: number;

  // Textos
  introduccion?: string; // Texto antes de las líneas
  piePagina?: string; // Texto después de las líneas
  condicionesLegales?: string;

  // Documentos adjuntos
  documentos: IDocumentoPresupuesto[];

  // Historial
  historial: IHistorialPresupuesto[];

  // Notas de seguimiento
  notasSeguimiento: INotaSeguimiento[];

  // Recordatorios enviados
  recordatoriosEnviados: IRecordatorioEnviado[];

  // Configuración de recordatorios
  recordatoriosConfig?: {
    activo: boolean;
    diasAntesExpiracion: number; // Días antes de expirar para enviar recordatorio
    enviarAlCliente: boolean;
    enviarAlAgente: boolean;
    maxRecordatorios: number; // Máximo de recordatorios a enviar
  };

  // Portal de cliente (acceso público)
  tokenAccesoPortal?: string; // Token único para acceso sin login
  tokenExpirado?: boolean;
  urlPortal?: string; // URL completa generada
  respuestaCliente?: IRespuestaCliente;

  // Documentos generados (puede generar pedido, albarán y/o factura)
  documentosGenerados: {
    tipo: 'pedido' | 'factura' | 'albaran';
    documentoId: mongoose.Types.ObjectId;
    codigo: string;
    fecha: Date;
  }[];

  // Mantener compatibilidad con campo anterior (deprecated)
  convertidoA?: {
    tipo: 'pedido' | 'factura' | 'albaran';
    documentoId: mongoose.Types.ObjectId;
    fecha: Date;
  };

  // Observaciones (internas)
  observaciones?: string;

  // Tags
  tags?: string[];

  // Control
  activo: boolean;
  bloqueado: boolean; // No permitir ediciones

  // Configuración de visualización
  mostrarCostes: boolean; // Toggle para ocultar costes al mostrar al cliente
  mostrarMargenes: boolean;
  mostrarComponentesKit: boolean;

  // Auditoría
  creadoPor: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;
  fechaCreacion: Date;
  fechaModificacion?: Date;

  // Virtuals
  diasParaCaducar: number | null;
  estaVigente: boolean;
  puedeConvertirse: boolean;
  tienePedido: boolean;
  tieneAlbaran: boolean;
  tieneFactura: boolean;
}

export interface IPresupuestoModel extends Model<IPresupuesto> {
  generarCodigo(serie?: string): Promise<{ codigo: string; serie: string; numero: number }>;
  obtenerEstadisticas(): Promise<{
    total: number;
    porEstado: Record<string, number>;
    totalImporte: number;
    totalAceptados: number;
    tasaConversion: number;
    margenPromedio: number;
  }>;
}

// ============================================
// SCHEMAS
// ============================================

const ComponenteKitSchema = new Schema<IComponenteKit>({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  nombre: { type: String, required: true, trim: true },
  sku: { type: String, trim: true },
  cantidad: { type: Number, required: true, min: 0 },
  precioUnitario: { type: Number, required: true, min: 0 },
  costeUnitario: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  iva: { type: Number, required: true, default: 21 },
  subtotal: { type: Number, required: true, min: 0 },
  opcional: { type: Boolean, default: false },
  seleccionado: { type: Boolean, default: true },
}, { _id: false });

const VarianteSeleccionadaSchema = new Schema<IVarianteSeleccionada>({
  varianteId: { type: String },
  sku: { type: String, required: true },
  combinacion: { type: Map, of: String, required: true },
  precioAdicional: { type: Number, default: 0 },
  costeAdicional: { type: Number, default: 0 },
}, { _id: false });

const LineaPresupuestoSchema = new Schema<ILineaPresupuesto>({
  orden: { type: Number, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoLinea),
    default: TipoLinea.PRODUCTO,
  },

  // Producto
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto' },
  codigo: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  descripcionLarga: { type: String, trim: true },
  sku: { type: String, trim: true },

  // Variante
  variante: { type: VarianteSeleccionadaSchema },

  // Cantidades
  cantidad: { type: Number, required: true, min: 0, default: 1 },
  unidad: { type: String, trim: true, default: 'ud' },

  // Peso
  peso: { type: Number, min: 0, default: 0 }, // Peso unitario en kg
  pesoTotal: { type: Number, min: 0, default: 0 }, // Peso total de la línea (peso * cantidad)

  // Precios
  precioUnitario: { type: Number, required: true, min: 0, default: 0 },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
  descuentoImporte: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0, default: 0 },
  iva: { type: Number, required: true, default: 21 },
  ivaImporte: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0, default: 0 },

  // Costes
  costeUnitario: { type: Number, default: 0, min: 0 },
  costeTotalLinea: { type: Number, default: 0, min: 0 },

  // Márgenes
  margenUnitario: { type: Number, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
  margenTotalLinea: { type: Number, default: 0 },

  // Kit
  componentesKit: { type: [ComponenteKitSchema], default: [] },
  mostrarComponentes: { type: Boolean, default: true },

  // Flags
  esEditable: { type: Boolean, default: true },
  incluidoEnTotal: { type: Boolean, default: true },

  // Notas
  notasInternas: { type: String },

  // Información del origen del precio (tarifas/ofertas)
  infoPrecio: {
    origen: { type: String, enum: ['producto', 'tarifa', 'oferta', 'precio_cantidad', 'manual'] },
    tarifaId: { type: Schema.Types.ObjectId, ref: 'Tarifa' },
    tarifaNombre: { type: String },
    ofertaId: { type: Schema.Types.ObjectId, ref: 'Oferta' },
    ofertaNombre: { type: String },
    ofertaTipo: { type: String },
    etiquetaOferta: { type: String },
    precioOriginal: { type: Number },
    unidadesGratis: { type: Number },
  },
}, { _id: true });

const DireccionEntregaSchema = new Schema<IDireccionEntrega>({
  tipo: {
    type: String,
    enum: ['cliente', 'personalizada', 'recogida'],
    default: 'cliente',
  },
  direccionId: { type: Schema.Types.ObjectId },
  nombre: { type: String, trim: true },
  calle: { type: String, trim: true },
  numero: { type: String, trim: true },
  piso: { type: String, trim: true },
  codigoPostal: { type: String, trim: true },
  ciudad: { type: String, trim: true },
  provincia: { type: String, trim: true },
  pais: { type: String, trim: true, default: 'España' },
  personaContacto: { type: String, trim: true },
  telefonoContacto: { type: String, trim: true },
  horarioEntrega: { type: String, trim: true },
  instrucciones: { type: String },
}, { _id: false });

const CondicionesComercialesSchema = new Schema<ICondicionesComerciales>({
  formaPagoId: { type: Schema.Types.ObjectId, ref: 'FormaPago' },
  terminoPagoId: { type: Schema.Types.ObjectId, ref: 'TerminoPago' },
  validezDias: { type: Number, default: 30, min: 1 },
  tiempoEntrega: { type: String, trim: true },
  garantia: { type: String, trim: true },
  portesPagados: { type: Boolean, default: false },
  portesImporte: { type: Number, min: 0 },
  observacionesEntrega: { type: String },
}, { _id: false });

const DesgloseIvaSchema = new Schema({
  tipo: { type: Number, required: true },
  base: { type: Number, required: true },
  cuota: { type: Number, required: true },
}, { _id: false });

const TotalesPresupuestoSchema = new Schema<ITotalesPresupuesto>({
  subtotalBruto: { type: Number, default: 0, min: 0 },
  totalDescuentos: { type: Number, default: 0, min: 0 },
  subtotalNeto: { type: Number, default: 0, min: 0 },
  desgloseIva: { type: [DesgloseIvaSchema], default: [] },
  totalIva: { type: Number, default: 0, min: 0 },
  totalPresupuesto: { type: Number, default: 0, min: 0 },
  costeTotalMateriales: { type: Number, default: 0, min: 0 },
  costeTotalServicios: { type: Number, default: 0, min: 0 },
  costeTotalKits: { type: Number, default: 0, min: 0 },
  costeTotal: { type: Number, default: 0, min: 0 },
  margenBruto: { type: Number, default: 0 },
  margenPorcentaje: { type: Number, default: 0 },
  pesoTotal: { type: Number, default: 0, min: 0 }, // Suma de todos los pesos de las líneas
}, { _id: false });

const DocumentoPresupuestoSchema = new Schema<IDocumentoPresupuesto>({
  nombre: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  tipo: { type: String, required: true },
  tamaño: { type: Number, required: true },
  fechaSubida: { type: Date, default: Date.now },
  subidoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  visibleCliente: { type: Boolean, default: true },
}, { _id: true });

const HistorialPresupuestoSchema = new Schema<IHistorialPresupuesto>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  accion: { type: String, required: true },
  descripcion: { type: String },
  datosAnteriores: { type: Schema.Types.Mixed },
}, { _id: true });

const NotaSeguimientoSchema = new Schema<INotaSeguimiento>({
  fecha: { type: Date, default: Date.now },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: {
    type: String,
    enum: ['llamada', 'email', 'reunion', 'nota', 'recordatorio'],
    default: 'nota',
  },
  contenido: { type: String, required: true },
  resultado: { type: String },
  proximaAccion: { type: String },
  fechaProximaAccion: { type: Date },
}, { _id: true });

const RecordatorioEnviadoSchema = new Schema<IRecordatorioEnviado>({
  fecha: { type: Date, default: Date.now },
  tipo: {
    type: String,
    enum: ['expiracion', 'seguimiento', 'sin_respuesta'],
    required: true,
  },
  destinatario: { type: String, required: true },
  enviado: { type: Boolean, default: false },
  error: { type: String },
  messageId: { type: String },
}, { _id: true });

// ============================================
// SCHEMA PRINCIPAL
// ============================================

const PresupuestoSchema = new Schema<IPresupuesto, IPresupuestoModel>({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true,
  },

  // Identificación
  codigo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  serie: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    default: 'P',
  },
  numero: {
    type: Number,
    required: true,
  },
  version: {
    type: Number,
    default: 1,
    min: 1,
  },
  presupuestoOrigenId: {
    type: Schema.Types.ObjectId,
    ref: 'Presupuesto',
  },

  // Estado
  estado: {
    type: String,
    enum: Object.values(EstadoPresupuesto),
    default: EstadoPresupuesto.BORRADOR,
  },

  // Fechas
  fecha: {
    type: Date,
    required: true,
    default: Date.now,
  },
  fechaValidez: {
    type: Date,
    required: true,
  },
  fechaEnvio: { type: Date },
  fechaRespuesta: { type: Date },
  contadorEnvios: { type: Number, default: 0 },

  // Cliente
  clienteId: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El cliente es obligatorio'],
  },
  clienteNombre: {
    type: String,
    required: true,
    trim: true,
  },
  clienteNif: {
    type: String,
    required: true,
    trim: true,
  },
  clienteEmail: { type: String, trim: true },
  clienteTelefono: { type: String, trim: true },
  direccionFacturacion: { type: DireccionEntregaSchema },

  // Entrega
  direccionEntrega: { type: DireccionEntregaSchema },
  fechaEntregaPrevista: { type: Date },

  // Proyecto y parte de trabajo
  proyectoId: {
    type: Schema.Types.ObjectId,
    ref: 'Proyecto',
  },
  parteTrabajoId: {
    type: Schema.Types.ObjectId,
    ref: 'ParteTrabajo',
  },

  // Agente comercial
  agenteComercialId: {
    type: Schema.Types.ObjectId,
    ref: 'AgenteComercial',
  },

  // Referencias
  referenciaCliente: { type: String, trim: true },
  pedidoCliente: { type: String, trim: true },

  // Título y descripción
  titulo: { type: String, trim: true },
  descripcion: { type: String },

  // Líneas
  lineas: {
    type: [LineaPresupuestoSchema],
    default: [],
  },

  // Condiciones
  condiciones: {
    type: CondicionesComercialesSchema,
    default: () => ({ validezDias: 30 }),
  },

  // Totales
  totales: {
    type: TotalesPresupuestoSchema,
    default: () => ({}),
  },

  // Descuento global
  descuentoGlobalPorcentaje: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  descuentoGlobalImporte: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Textos
  introduccion: { type: String },
  piePagina: { type: String },
  condicionesLegales: { type: String },

  // Documentos
  documentos: {
    type: [DocumentoPresupuestoSchema],
    default: [],
  },

  // Historial
  historial: {
    type: [HistorialPresupuestoSchema],
    default: [],
  },

  // Notas de seguimiento
  notasSeguimiento: {
    type: [NotaSeguimientoSchema],
    default: [],
  },

  // Recordatorios enviados
  recordatoriosEnviados: {
    type: [RecordatorioEnviadoSchema],
    default: [],
  },

  // Configuración de recordatorios
  recordatoriosConfig: {
    activo: { type: Boolean, default: true },
    diasAntesExpiracion: { type: Number, default: 7 },
    enviarAlCliente: { type: Boolean, default: true },
    enviarAlAgente: { type: Boolean, default: true },
    maxRecordatorios: { type: Number, default: 3 },
  },

  // Portal de cliente
  tokenAccesoPortal: {
    type: String,
    unique: true,
    sparse: true, // Permite múltiples nulls
  },
  tokenExpirado: {
    type: Boolean,
    default: false,
  },
  urlPortal: { type: String },
  respuestaCliente: {
    fecha: { type: Date },
    aceptado: { type: Boolean },
    comentarios: { type: String },
    nombreFirmante: { type: String },
    ipCliente: { type: String },
    userAgent: { type: String },
  },

  // Documentos generados (múltiples: pedido, albarán, factura)
  documentosGenerados: [{
    tipo: { type: String, enum: ['pedido', 'factura', 'albaran'], required: true },
    documentoId: { type: Schema.Types.ObjectId, required: true },
    codigo: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
  }],

  // Conversión (deprecated - mantener por compatibilidad)
  convertidoA: {
    tipo: { type: String, enum: ['pedido', 'factura', 'albaran'] },
    documentoId: { type: Schema.Types.ObjectId },
    fecha: { type: Date },
  },

  // Observaciones
  observaciones: { type: String },

  // Tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // Control
  activo: {
    type: Boolean,
    default: true,
  },
  bloqueado: {
    type: Boolean,
    default: false,
  },

  // Configuración de visualización
  mostrarCostes: {
    type: Boolean,
    default: true, // Por defecto muestra costes (modo interno)
  },
  mostrarMargenes: {
    type: Boolean,
    default: true,
  },
  mostrarComponentesKit: {
    type: Boolean,
    default: true,
  },

  // Auditoría
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  modificadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  fechaModificacion: {
    type: Date,
  },
}, {
  timestamps: false,
  collection: 'presupuestos',
});

// ============================================
// ÍNDICES
// ============================================
// Nota: codigo ya tiene unique:true en la definición del campo, no duplicar aquí

PresupuestoSchema.index({ serie: 1, numero: 1 });
PresupuestoSchema.index({ clienteId: 1 });
PresupuestoSchema.index({ proyectoId: 1 });
PresupuestoSchema.index({ agenteComercialId: 1 });
PresupuestoSchema.index({ estado: 1 });
PresupuestoSchema.index({ fecha: -1 });
PresupuestoSchema.index({ fechaValidez: 1 });
PresupuestoSchema.index({ activo: 1 });
PresupuestoSchema.index({ tags: 1 });
PresupuestoSchema.index({ 'totales.totalPresupuesto': 1 });
PresupuestoSchema.index({ tokenAccesoPortal: 1 });

// ============================================
// VIRTUALS
// ============================================

PresupuestoSchema.virtual('diasParaCaducar').get(function(this: IPresupuesto) {
  if (!this.fechaValidez) return null;
  if (this.estado === EstadoPresupuesto.ACEPTADO || this.estado === EstadoPresupuesto.CONVERTIDO) return null;
  const hoy = new Date();
  const diffTime = this.fechaValidez.getTime() - hoy.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

PresupuestoSchema.virtual('estaVigente').get(function(this: IPresupuesto) {
  if (this.estado === EstadoPresupuesto.CADUCADO || this.estado === EstadoPresupuesto.RECHAZADO) return false;
  if (this.estado === EstadoPresupuesto.ACEPTADO || this.estado === EstadoPresupuesto.CONVERTIDO) return true;
  if (!this.fechaValidez) return true;
  return new Date() <= this.fechaValidez;
});

PresupuestoSchema.virtual('puedeConvertirse').get(function(this: IPresupuesto) {
  // Puede convertirse si está aceptado (permite múltiples conversiones: pedido, albarán, factura)
  return this.estado === EstadoPresupuesto.ACEPTADO || this.estado === EstadoPresupuesto.CONVERTIDO;
});

// Virtuals para verificar qué documentos ya se han generado
PresupuestoSchema.virtual('tienePedido').get(function(this: IPresupuesto) {
  return this.documentosGenerados?.some(d => d.tipo === 'pedido') || this.convertidoA?.tipo === 'pedido';
});

PresupuestoSchema.virtual('tieneAlbaran').get(function(this: IPresupuesto) {
  return this.documentosGenerados?.some(d => d.tipo === 'albaran') || this.convertidoA?.tipo === 'albaran';
});

PresupuestoSchema.virtual('tieneFactura').get(function(this: IPresupuesto) {
  return this.documentosGenerados?.some(d => d.tipo === 'factura') || this.convertidoA?.tipo === 'factura';
});

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

PresupuestoSchema.statics.generarCodigo = async function(serie: string = 'P'): Promise<{ codigo: string; serie: string; numero: number }> {
  const año = new Date().getFullYear();

  const ultimoPresupuesto = await this.findOne({
    serie,
    codigo: new RegExp(`^${serie}${año}-\\d+$`),
  }).sort({ numero: -1 }).lean();

  let numero = 1;
  if (ultimoPresupuesto && ultimoPresupuesto.numero) {
    numero = ultimoPresupuesto.numero + 1;
  }

  const codigo = `${serie}${año}-${numero.toString().padStart(5, '0')}`;

  return { codigo, serie, numero };
};

PresupuestoSchema.statics.obtenerEstadisticas = async function() {
  const [
    total,
    porEstado,
    totales,
    aceptados,
  ] = await Promise.all([
    this.countDocuments(),
    this.aggregate([
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]),
    this.aggregate([
      { $match: { activo: true } },
      {
        $group: {
          _id: null,
          totalImporte: { $sum: '$totales.totalPresupuesto' },
          margenTotal: { $sum: '$totales.margenBruto' },
          costeTotal: { $sum: '$totales.costeTotal' },
        },
      },
    ]),
    this.countDocuments({ estado: { $in: [EstadoPresupuesto.ACEPTADO, EstadoPresupuesto.CONVERTIDO] } }),
  ]);

  const estadisticasPorEstado: Record<string, number> = {};
  porEstado.forEach((item: any) => {
    estadisticasPorEstado[item._id] = item.count;
  });

  const totalEnviados = (estadisticasPorEstado[EstadoPresupuesto.ENVIADO] || 0) +
    (estadisticasPorEstado[EstadoPresupuesto.PENDIENTE] || 0) +
    (estadisticasPorEstado[EstadoPresupuesto.ACEPTADO] || 0) +
    (estadisticasPorEstado[EstadoPresupuesto.RECHAZADO] || 0) +
    (estadisticasPorEstado[EstadoPresupuesto.CONVERTIDO] || 0);

  const margenPromedio = totales[0]?.costeTotal > 0
    ? Math.round((totales[0].margenTotal / totales[0].costeTotal) * 100)
    : 0;

  return {
    total,
    porEstado: estadisticasPorEstado,
    totalImporte: totales[0]?.totalImporte || 0,
    totalAceptados: aceptados,
    tasaConversion: totalEnviados > 0 ? Math.round((aceptados / totalEnviados) * 100) : 0,
    margenPromedio,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

PresupuestoSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    if (!this.codigo) {
      const PresupuestoModel = this.constructor as IPresupuestoModel;
      const { codigo, serie, numero } = await PresupuestoModel.generarCodigo(this.serie);
      this.codigo = codigo;
      this.serie = serie;
      this.numero = numero;
    }

    // Establecer fecha de validez si no existe
    if (!this.fechaValidez && this.condiciones?.validezDias) {
      const fechaValidez = new Date(this.fecha);
      fechaValidez.setDate(fechaValidez.getDate() + this.condiciones.validezDias);
      this.fechaValidez = fechaValidez;
    }
  }

  if (this.isModified() && !this.isNew) {
    this.fechaModificacion = new Date();
  }

  // Verificar si ha caducado
  if (this.fechaValidez && new Date() > this.fechaValidez) {
    if (this.estado === EstadoPresupuesto.ENVIADO || this.estado === EstadoPresupuesto.PENDIENTE) {
      this.estado = EstadoPresupuesto.CADUCADO;
    }
  }

  next();
});

// ============================================
// CONFIGURACIÓN DE JSON
// ============================================

PresupuestoSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret, options) => {
    delete (ret as any).__v;

    // Si se solicita ocultar costes, eliminarlos del JSON
    if (options.hideCosts || !ret.mostrarCostes) {
      // Ocultar costes de líneas
      if (ret.lineas) {
        ret.lineas = ret.lineas.map((linea: any) => {
          const { costeUnitario, costeTotalLinea, margenUnitario, margenPorcentaje, margenTotalLinea, notasInternas, ...lineaSinCostes } = linea;
          if (lineaSinCostes.componentesKit) {
            lineaSinCostes.componentesKit = lineaSinCostes.componentesKit.map((comp: any) => {
              const { costeUnitario: cc, ...compSinCoste } = comp;
              return compSinCoste;
            });
          }
          return lineaSinCostes;
        });
      }

      // Ocultar costes de totales
      if (ret.totales) {
        const { costeTotalMateriales, costeTotalServicios, costeTotalKits, costeTotal, margenBruto, margenPorcentaje, ...totalesSinCostes } = ret.totales;
        ret.totales = totalesSinCostes;
      }
    }

    return ret;
  },
});

PresupuestoSchema.set('toObject', {
  virtuals: true,
});

// ============================================
// EXPORTAR MODELO
// ============================================

export const Presupuesto = mongoose.model<IPresupuesto, IPresupuestoModel>('Presupuesto', PresupuestoSchema);

export default Presupuesto;
