// apps/backend/src/modules/informes/Informe.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export enum ModuloInforme {
  VENTAS = 'ventas',
  COMPRAS = 'compras',
  STOCK = 'stock',
  TESORERIA = 'tesoreria',
  PERSONAL = 'personal',
  CLIENTES = 'clientes',
  PROVEEDORES = 'proveedores',
  PROYECTOS = 'proyectos',
  GENERAL = 'general',
}

export enum TipoInforme {
  TABLA = 'tabla',
  GRAFICO = 'grafico',
  MIXTO = 'mixto',
}

export enum TipoCampo {
  TEXTO = 'texto',
  NUMERO = 'numero',
  MONEDA = 'moneda',
  FECHA = 'fecha',
  PORCENTAJE = 'porcentaje',
  BOOLEAN = 'boolean',
}

export enum TipoAgregacion {
  NINGUNA = 'ninguna',
  SUMA = 'suma',
  PROMEDIO = 'promedio',
  CONTEO = 'conteo',
  MIN = 'min',
  MAX = 'max',
}

export enum OperadorFiltro {
  IGUAL = 'igual',
  DIFERENTE = 'diferente',
  CONTIENE = 'contiene',
  COMIENZA = 'comienza',
  TERMINA = 'termina',
  MAYOR = 'mayor',
  MAYOR_IGUAL = 'mayor_igual',
  MENOR = 'menor',
  MENOR_IGUAL = 'menor_igual',
  ENTRE = 'entre',
  EN = 'en',
  NO_EN = 'no_en',
  EXISTE = 'existe',
  NO_EXISTE = 'no_existe',
}

export enum TipoGraficoInforme {
  LINEA = 'linea',
  BARRA = 'barra',
  BARRA_HORIZONTAL = 'barra_horizontal',
  AREA = 'area',
  CIRCULAR = 'circular',
  DONA = 'dona',
  COMBINADO = 'combinado',
}

// ============================================
// INTERFACES
// ============================================

export interface ICampoInforme {
  campo: string;
  etiqueta: string;
  tipo: TipoCampo;
  visible: boolean;
  ancho?: number;
  formato?: string;
  agregacion: TipoAgregacion;
  orden?: number;
}

export interface IFiltroInforme {
  campo: string;
  operador: OperadorFiltro;
  valor?: any;
  valor2?: any; // Para operador ENTRE
  parametro?: string; // Nombre del parámetro dinámico
  etiqueta?: string; // Etiqueta para mostrar en UI
}

export interface IAgrupacionInforme {
  campo: string;
  etiqueta?: string;
  orden: 'asc' | 'desc';
}

export interface IOrdenamientoInforme {
  campo: string;
  direccion: 'asc' | 'desc';
}

export interface IJoinInforme {
  coleccion: string;
  campoLocal: string;
  campoForaneo: string;
  alias: string;
}

export interface IFuenteInforme {
  coleccion: string;
  joins?: IJoinInforme[];
}

export interface IGraficoConfigInforme {
  tipo: TipoGraficoInforme;
  ejeX: string;
  ejeY: string[];
  colores?: string[];
  mostrarLeyenda?: boolean;
  mostrarEtiquetas?: boolean;
}

export interface IInforme extends Document {
  _id: mongoose.Types.ObjectId;
  empresaId: string;

  // Identificación
  nombre: string;
  descripcion?: string;
  modulo: ModuloInforme;
  tipo: TipoInforme;
  icono?: string;

  // Configuración de datos
  fuente: IFuenteInforme;

  // Campos a mostrar
  campos: ICampoInforme[];

  // Filtros predefinidos
  filtros: IFiltroInforme[];

  // Filtros dinámicos (parámetros que el usuario puede cambiar)
  parametros: Array<{
    nombre: string;
    etiqueta: string;
    tipo: 'texto' | 'numero' | 'fecha' | 'select' | 'multiselect';
    valorDefecto?: any;
    opciones?: Array<{ valor: any; etiqueta: string }>;
    requerido: boolean;
  }>;

  // Agrupaciones
  agrupaciones: IAgrupacionInforme[];

  // Ordenamiento
  ordenamiento: IOrdenamientoInforme[];

  // Configuración de gráfico
  grafico?: IGraficoConfigInforme;

  // Configuración adicional
  config: {
    limite?: number;
    paginacion: boolean;
    mostrarTotales: boolean;
    exportable: boolean;
    formatos: ('pdf' | 'excel' | 'csv')[];
  };

  // Metadatos
  esPlantilla: boolean;
  compartido: boolean;
  favorito: boolean;
  orden?: number;

  // Permisos
  permisosRequeridos?: string[];

  // Auditoría
  creadoPor?: mongoose.Types.ObjectId;
  modificadoPor?: mongoose.Types.ObjectId;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const CampoInformeSchema = new Schema<ICampoInforme>({
  campo: { type: String, required: true },
  etiqueta: { type: String, required: true },
  tipo: {
    type: String,
    enum: Object.values(TipoCampo),
    default: TipoCampo.TEXTO
  },
  visible: { type: Boolean, default: true },
  ancho: { type: Number },
  formato: { type: String },
  agregacion: {
    type: String,
    enum: Object.values(TipoAgregacion),
    default: TipoAgregacion.NINGUNA
  },
  orden: { type: Number },
}, { _id: false });

const FiltroInformeSchema = new Schema<IFiltroInforme>({
  campo: { type: String, required: true },
  operador: {
    type: String,
    enum: Object.values(OperadorFiltro),
    required: true
  },
  valor: { type: Schema.Types.Mixed },
  valor2: { type: Schema.Types.Mixed },
  parametro: { type: String },
  etiqueta: { type: String },
}, { _id: false });

const AgrupacionInformeSchema = new Schema<IAgrupacionInforme>({
  campo: { type: String, required: true },
  etiqueta: { type: String },
  orden: { type: String, enum: ['asc', 'desc'], default: 'asc' },
}, { _id: false });

const OrdenamientoInformeSchema = new Schema<IOrdenamientoInforme>({
  campo: { type: String, required: true },
  direccion: { type: String, enum: ['asc', 'desc'], default: 'asc' },
}, { _id: false });

const JoinInformeSchema = new Schema<IJoinInforme>({
  coleccion: { type: String, required: true },
  campoLocal: { type: String, required: true },
  campoForaneo: { type: String, required: true },
  alias: { type: String, required: true },
}, { _id: false });

const FuenteInformeSchema = new Schema<IFuenteInforme>({
  coleccion: { type: String, required: true },
  joins: [JoinInformeSchema],
}, { _id: false });

const GraficoConfigInformeSchema = new Schema<IGraficoConfigInforme>({
  tipo: {
    type: String,
    enum: Object.values(TipoGraficoInforme),
    required: true
  },
  ejeX: { type: String, required: true },
  ejeY: [{ type: String }],
  colores: [{ type: String }],
  mostrarLeyenda: { type: Boolean, default: true },
  mostrarEtiquetas: { type: Boolean, default: false },
}, { _id: false });

const ParametroSchema = new Schema({
  nombre: { type: String, required: true },
  etiqueta: { type: String, required: true },
  tipo: {
    type: String,
    enum: ['texto', 'numero', 'fecha', 'select', 'multiselect'],
    required: true
  },
  valorDefecto: { type: Schema.Types.Mixed },
  opciones: [{
    valor: { type: Schema.Types.Mixed },
    etiqueta: { type: String },
  }],
  requerido: { type: Boolean, default: false },
}, { _id: false });

const InformeSchema = new Schema<IInforme>({
  empresaId: { type: String, required: true, index: true },

  nombre: { type: String, required: true },
  descripcion: { type: String },
  modulo: {
    type: String,
    enum: Object.values(ModuloInforme),
    required: true,
    index: true,
  },
  tipo: {
    type: String,
    enum: Object.values(TipoInforme),
    default: TipoInforme.TABLA
  },
  icono: { type: String },

  fuente: { type: FuenteInformeSchema, required: true },
  campos: [CampoInformeSchema],
  filtros: [FiltroInformeSchema],
  parametros: [ParametroSchema],
  agrupaciones: [AgrupacionInformeSchema],
  ordenamiento: [OrdenamientoInformeSchema],
  grafico: GraficoConfigInformeSchema,

  config: {
    limite: { type: Number },
    paginacion: { type: Boolean, default: true },
    mostrarTotales: { type: Boolean, default: true },
    exportable: { type: Boolean, default: true },
    formatos: [{ type: String, enum: ['pdf', 'excel', 'csv'] }],
  },

  esPlantilla: { type: Boolean, default: false, index: true },
  compartido: { type: Boolean, default: false },
  favorito: { type: Boolean, default: false },
  orden: { type: Number },

  permisosRequeridos: [{ type: String }],

  creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  modificadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
}, {
  timestamps: true,
  collection: 'informes',
});

// Índices compuestos
InformeSchema.index({ empresaId: 1, modulo: 1 });
InformeSchema.index({ empresaId: 1, esPlantilla: 1 });
InformeSchema.index({ empresaId: 1, creadoPor: 1 });
InformeSchema.index({ empresaId: 1, nombre: 1 }, { unique: true });

// ============================================
// CATÁLOGO DE COLECCIONES Y CAMPOS DISPONIBLES
// ============================================

export const CATALOGO_COLECCIONES: Record<ModuloInforme, Array<{
  coleccion: string;
  etiqueta: string;
  campos: Array<{
    campo: string;
    etiqueta: string;
    tipo: TipoCampo;
    agregable?: boolean;
  }>;
}>> = {
  [ModuloInforme.VENTAS]: [
    {
      coleccion: 'facturas',
      etiqueta: 'Facturas',
      campos: [
        { campo: 'numero', etiqueta: 'Número', tipo: TipoCampo.TEXTO },
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO },
        { campo: 'baseImponible', etiqueta: 'Base Imponible', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'totalIva', etiqueta: 'IVA', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO },
        { campo: 'formaPago', etiqueta: 'Forma de Pago', tipo: TipoCampo.TEXTO },
      ],
    },
    {
      coleccion: 'pedidos',
      etiqueta: 'Pedidos',
      campos: [
        { campo: 'numero', etiqueta: 'Número', tipo: TipoCampo.TEXTO },
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO },
        { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO },
      ],
    },
    {
      coleccion: 'presupuestos',
      etiqueta: 'Presupuestos',
      campos: [
        { campo: 'numero', etiqueta: 'Número', tipo: TipoCampo.TEXTO },
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO },
        { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO },
        { campo: 'validoHasta', etiqueta: 'Válido Hasta', tipo: TipoCampo.FECHA },
      ],
    },
    {
      coleccion: 'albaranes',
      etiqueta: 'Albaranes',
      campos: [
        { campo: 'numero', etiqueta: 'Número', tipo: TipoCampo.TEXTO },
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'clienteNombre', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO },
        { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'facturado', etiqueta: 'Facturado', tipo: TipoCampo.BOOLEAN },
      ],
    },
  ],
  [ModuloInforme.COMPRAS]: [
    {
      coleccion: 'facturas_compra',
      etiqueta: 'Facturas de Compra',
      campos: [
        { campo: 'numero', etiqueta: 'Número', tipo: TipoCampo.TEXTO },
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'proveedorNombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO },
        { campo: 'baseImponible', etiqueta: 'Base Imponible', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO },
      ],
    },
    {
      coleccion: 'pedidos_compra',
      etiqueta: 'Pedidos de Compra',
      campos: [
        { campo: 'numero', etiqueta: 'Número', tipo: TipoCampo.TEXTO },
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'proveedorNombre', etiqueta: 'Proveedor', tipo: TipoCampo.TEXTO },
        { campo: 'total', etiqueta: 'Total', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO },
      ],
    },
  ],
  [ModuloInforme.STOCK]: [
    {
      coleccion: 'productos',
      etiqueta: 'Productos',
      campos: [
        { campo: 'sku', etiqueta: 'SKU', tipo: TipoCampo.TEXTO },
        { campo: 'nombre', etiqueta: 'Nombre', tipo: TipoCampo.TEXTO },
        { campo: 'familia', etiqueta: 'Familia', tipo: TipoCampo.TEXTO },
        { campo: 'stockActual', etiqueta: 'Stock Actual', tipo: TipoCampo.NUMERO, agregable: true },
        { campo: 'stockMinimo', etiqueta: 'Stock Mínimo', tipo: TipoCampo.NUMERO },
        { campo: 'precioVenta', etiqueta: 'Precio Venta', tipo: TipoCampo.MONEDA },
        { campo: 'precioCoste', etiqueta: 'Precio Coste', tipo: TipoCampo.MONEDA },
        { campo: 'valorStock', etiqueta: 'Valor Stock', tipo: TipoCampo.MONEDA, agregable: true },
      ],
    },
    {
      coleccion: 'movimientos_stock',
      etiqueta: 'Movimientos de Stock',
      campos: [
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'productoNombre', etiqueta: 'Producto', tipo: TipoCampo.TEXTO },
        { campo: 'tipo', etiqueta: 'Tipo', tipo: TipoCampo.TEXTO },
        { campo: 'cantidad', etiqueta: 'Cantidad', tipo: TipoCampo.NUMERO, agregable: true },
        { campo: 'almacen', etiqueta: 'Almacén', tipo: TipoCampo.TEXTO },
      ],
    },
  ],
  [ModuloInforme.TESORERIA]: [
    {
      coleccion: 'movimientos_tesoreria',
      etiqueta: 'Movimientos',
      campos: [
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'concepto', etiqueta: 'Concepto', tipo: TipoCampo.TEXTO },
        { campo: 'tipo', etiqueta: 'Tipo', tipo: TipoCampo.TEXTO },
        { campo: 'importe', etiqueta: 'Importe', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'saldo', etiqueta: 'Saldo', tipo: TipoCampo.MONEDA },
      ],
    },
    {
      coleccion: 'vencimientos',
      etiqueta: 'Vencimientos',
      campos: [
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'tipo', etiqueta: 'Tipo', tipo: TipoCampo.TEXTO },
        { campo: 'tercero', etiqueta: 'Tercero', tipo: TipoCampo.TEXTO },
        { campo: 'importe', etiqueta: 'Importe', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO },
      ],
    },
  ],
  [ModuloInforme.PERSONAL]: [
    {
      coleccion: 'personal',
      etiqueta: 'Personal',
      campos: [
        { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO },
        { campo: 'nombre', etiqueta: 'Nombre', tipo: TipoCampo.TEXTO },
        { campo: 'departamento', etiqueta: 'Departamento', tipo: TipoCampo.TEXTO },
        { campo: 'puesto', etiqueta: 'Puesto', tipo: TipoCampo.TEXTO },
        { campo: 'fechaAlta', etiqueta: 'Fecha Alta', tipo: TipoCampo.FECHA },
        { campo: 'activo', etiqueta: 'Activo', tipo: TipoCampo.BOOLEAN },
      ],
    },
    {
      coleccion: 'fichajes',
      etiqueta: 'Fichajes',
      campos: [
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'empleadoNombre', etiqueta: 'Empleado', tipo: TipoCampo.TEXTO },
        { campo: 'horaEntrada', etiqueta: 'Entrada', tipo: TipoCampo.TEXTO },
        { campo: 'horaSalida', etiqueta: 'Salida', tipo: TipoCampo.TEXTO },
        { campo: 'horasTrabajadas', etiqueta: 'Horas', tipo: TipoCampo.NUMERO, agregable: true },
      ],
    },
    {
      coleccion: 'partes_trabajo',
      etiqueta: 'Partes de Trabajo',
      campos: [
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'empleadoNombre', etiqueta: 'Empleado', tipo: TipoCampo.TEXTO },
        { campo: 'proyecto', etiqueta: 'Proyecto', tipo: TipoCampo.TEXTO },
        { campo: 'descripcion', etiqueta: 'Descripción', tipo: TipoCampo.TEXTO },
        { campo: 'horas', etiqueta: 'Horas', tipo: TipoCampo.NUMERO, agregable: true },
        { campo: 'coste', etiqueta: 'Coste', tipo: TipoCampo.MONEDA, agregable: true },
      ],
    },
  ],
  [ModuloInforme.CLIENTES]: [
    {
      coleccion: 'clientes',
      etiqueta: 'Clientes',
      campos: [
        { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO },
        { campo: 'nombre', etiqueta: 'Nombre', tipo: TipoCampo.TEXTO },
        { campo: 'nif', etiqueta: 'NIF', tipo: TipoCampo.TEXTO },
        { campo: 'email', etiqueta: 'Email', tipo: TipoCampo.TEXTO },
        { campo: 'telefono', etiqueta: 'Teléfono', tipo: TipoCampo.TEXTO },
        { campo: 'ciudad', etiqueta: 'Ciudad', tipo: TipoCampo.TEXTO },
        { campo: 'totalFacturado', etiqueta: 'Total Facturado', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'saldoPendiente', etiqueta: 'Saldo Pendiente', tipo: TipoCampo.MONEDA, agregable: true },
      ],
    },
  ],
  [ModuloInforme.PROVEEDORES]: [
    {
      coleccion: 'proveedores',
      etiqueta: 'Proveedores',
      campos: [
        { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO },
        { campo: 'nombre', etiqueta: 'Nombre', tipo: TipoCampo.TEXTO },
        { campo: 'nif', etiqueta: 'NIF', tipo: TipoCampo.TEXTO },
        { campo: 'email', etiqueta: 'Email', tipo: TipoCampo.TEXTO },
        { campo: 'telefono', etiqueta: 'Teléfono', tipo: TipoCampo.TEXTO },
        { campo: 'totalComprado', etiqueta: 'Total Comprado', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'saldoPendiente', etiqueta: 'Saldo Pendiente', tipo: TipoCampo.MONEDA, agregable: true },
      ],
    },
  ],
  [ModuloInforme.PROYECTOS]: [
    {
      coleccion: 'proyectos',
      etiqueta: 'Proyectos',
      campos: [
        { campo: 'codigo', etiqueta: 'Código', tipo: TipoCampo.TEXTO },
        { campo: 'nombre', etiqueta: 'Nombre', tipo: TipoCampo.TEXTO },
        { campo: 'cliente', etiqueta: 'Cliente', tipo: TipoCampo.TEXTO },
        { campo: 'fechaInicio', etiqueta: 'Fecha Inicio', tipo: TipoCampo.FECHA },
        { campo: 'fechaFin', etiqueta: 'Fecha Fin', tipo: TipoCampo.FECHA },
        { campo: 'estado', etiqueta: 'Estado', tipo: TipoCampo.TEXTO },
        { campo: 'presupuesto', etiqueta: 'Presupuesto', tipo: TipoCampo.MONEDA, agregable: true },
        { campo: 'horasEstimadas', etiqueta: 'Horas Estimadas', tipo: TipoCampo.NUMERO, agregable: true },
        { campo: 'horasReales', etiqueta: 'Horas Reales', tipo: TipoCampo.NUMERO, agregable: true },
      ],
    },
  ],
  [ModuloInforme.GENERAL]: [
    {
      coleccion: 'logs',
      etiqueta: 'Logs del Sistema',
      campos: [
        { campo: 'fecha', etiqueta: 'Fecha', tipo: TipoCampo.FECHA },
        { campo: 'usuario', etiqueta: 'Usuario', tipo: TipoCampo.TEXTO },
        { campo: 'accion', etiqueta: 'Acción', tipo: TipoCampo.TEXTO },
        { campo: 'modulo', etiqueta: 'Módulo', tipo: TipoCampo.TEXTO },
        { campo: 'detalles', etiqueta: 'Detalles', tipo: TipoCampo.TEXTO },
      ],
    },
  ],
};

// ============================================
// MODEL
// ============================================

const InformeModel: Model<IInforme> = mongoose.model<IInforme>('Informe', InformeSchema);

export default InformeModel;
