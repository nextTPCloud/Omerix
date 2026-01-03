// apps/backend/src/modules/dashboard/Dashboard.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// TIPOS DE WIDGETS DISPONIBLES
// ============================================

export enum TipoWidget {
  // Estadísticas generales
  RESUMEN_VENTAS = 'resumen_ventas',
  RESUMEN_COMPRAS = 'resumen_compras',
  RESUMEN_TESORERIA = 'resumen_tesoreria',
  RESUMEN_FACTURACION = 'resumen_facturacion',

  // Gráficas
  GRAFICA_VENTAS_PERIODO = 'grafica_ventas_periodo',
  GRAFICA_VENTAS_FAMILIA = 'grafica_ventas_familia',
  GRAFICA_VENTAS_CLIENTE = 'grafica_ventas_cliente',
  GRAFICA_COMPRAS_PERIODO = 'grafica_compras_periodo',
  GRAFICA_TESORERIA_FLUJO = 'grafica_tesoreria_flujo',
  GRAFICA_COMPARATIVA_ANUAL = 'grafica_comparativa_anual',
  GRAFICA_CIRCULAR = 'grafica_circular',

  // Listas y tablas
  ULTIMOS_DOCUMENTOS = 'ultimos_documentos',
  DOCUMENTOS_PENDIENTES = 'documentos_pendientes',
  CLIENTES_MOROSOS = 'clientes_morosos',
  PRODUCTOS_MAS_VENDIDOS = 'productos_mas_vendidos',
  ACCESOS_RAPIDOS = 'accesos_rapidos',
  ALERTAS = 'alertas',

  // RRHH
  PARTES_TRABAJO_HOY = 'partes_trabajo_hoy',
  FICHAJES_HOY = 'fichajes_hoy',
  RESUMEN_PERSONAL = 'resumen_personal',

  // TPV
  RESUMEN_TPV = 'resumen_tpv',
  VENTAS_TPV_HOY = 'ventas_tpv_hoy',

  // Calendario y tareas
  CALENDARIO = 'calendario',
  TAREAS_PENDIENTES = 'tareas_pendientes',
  RECORDATORIOS = 'recordatorios',

  // KPIs personalizados
  KPI_SIMPLE = 'kpi_simple',
  KPI_COMPARATIVO = 'kpi_comparativo',
  CONTADOR = 'contador',

  // CRM
  RESUMEN_CRM = 'resumen_crm',
  LEADS_RECIENTES = 'leads_recientes',
  OPORTUNIDADES_PIPELINE = 'oportunidades_pipeline',
  ACTIVIDADES_CRM_PENDIENTES = 'actividades_crm_pendientes',
  GRAFICA_PIPELINE_CRM = 'grafica_pipeline_crm',
  FORECAST_CRM = 'forecast_crm',

  // Contabilidad
  RESUMEN_CONTABILIDAD = 'resumen_contabilidad',
  BALANCE_RAPIDO = 'balance_rapido',
  ULTIMOS_ASIENTOS = 'ultimos_asientos',
  GRAFICA_INGRESOS_GASTOS = 'grafica_ingresos_gastos',
}

export enum TamanoWidget {
  PEQUENO = 'small',      // 1x1
  MEDIANO = 'medium',     // 2x1
  GRANDE = 'large',       // 2x2
  ANCHO = 'wide',         // 4x1
  ALTO = 'tall',          // 1x2
  COMPLETO = 'full',      // 4x2
}

export enum TipoGrafica {
  LINEA = 'line',
  BARRA = 'bar',
  AREA = 'area',
  CIRCULAR = 'pie',
  DONA = 'doughnut',
  BARRAS_HORIZONTALES = 'horizontal_bar',
  COMBINADO = 'composed',
}

// ============================================
// INTERFACES
// ============================================

export interface IWidgetConfig {
  // Configuración de datos
  periodo?: 'hoy' | 'semana' | 'mes' | 'trimestre' | 'anio' | 'custom';
  fechaDesde?: Date;
  fechaHasta?: Date;
  limite?: number;
  filtros?: Record<string, any>;

  // Configuración de gráfica
  tipoGrafica?: TipoGrafica;
  mostrarLeyenda?: boolean;
  mostrarEjes?: boolean;
  colores?: string[];

  // Configuración de visualización
  titulo?: string;
  subtitulo?: string;
  mostrarTotal?: boolean;
  mostrarPorcentaje?: boolean;
  formato?: 'moneda' | 'numero' | 'porcentaje';
  decimales?: number;

  // Configuración de actualización
  autoRefresh?: boolean;
  intervaloRefresh?: number; // en segundos

  // Datos estáticos (para accesos rápidos, etc)
  enlaces?: { titulo: string; url: string; icono?: string }[];
  items?: any[];
}

export interface IWidget {
  id: string;
  tipo: TipoWidget;
  tamano: TamanoWidget;
  posicion: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: IWidgetConfig;
  visible: boolean;
}

export interface IDashboard extends Document {
  _id: mongoose.Types.ObjectId;

  // Identificación
  nombre: string;
  descripcion?: string;

  // Propietario (puede ser usuario o rol)
  usuarioId?: mongoose.Types.ObjectId;
  rolId?: mongoose.Types.ObjectId;
  esPlantilla: boolean;
  esPorDefecto: boolean;

  // Widgets
  widgets: IWidget[];

  // Configuración general
  config: {
    columnas: number;
    espaciado: number;
    intervalorRefreshGlobal?: number; // en segundos
    tema?: 'light' | 'dark' | 'system';
  };

  // Permisos requeridos para ver el dashboard
  permisosRequeridos?: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMA
// ============================================

const WidgetConfigSchema = new Schema<IWidgetConfig>({
  periodo: { type: String, enum: ['hoy', 'semana', 'mes', 'trimestre', 'anio', 'custom'] },
  fechaDesde: Date,
  fechaHasta: Date,
  limite: Number,
  filtros: Schema.Types.Mixed,
  tipoGrafica: { type: String, enum: Object.values(TipoGrafica) },
  mostrarLeyenda: Boolean,
  mostrarEjes: Boolean,
  colores: [String],
  titulo: String,
  subtitulo: String,
  mostrarTotal: Boolean,
  mostrarPorcentaje: Boolean,
  formato: { type: String, enum: ['moneda', 'numero', 'porcentaje'] },
  decimales: Number,
  autoRefresh: Boolean,
  intervaloRefresh: Number,
  enlaces: [{
    titulo: String,
    url: String,
    icono: String,
  }],
  items: [Schema.Types.Mixed],
}, { _id: false });

const WidgetSchema = new Schema<IWidget>({
  id: { type: String, required: true },
  tipo: { type: String, enum: Object.values(TipoWidget), required: true },
  tamano: { type: String, enum: Object.values(TamanoWidget), default: TamanoWidget.MEDIANO },
  posicion: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    w: { type: Number, default: 2 },
    h: { type: Number, default: 1 },
  },
  config: { type: WidgetConfigSchema, default: {} },
  visible: { type: Boolean, default: true },
}, { _id: false });

const DashboardSchema = new Schema<IDashboard>({
  nombre: { type: String, required: true },
  descripcion: String,

  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  rolId: { type: Schema.Types.ObjectId, ref: 'Rol' },
  esPlantilla: { type: Boolean, default: false },
  esPorDefecto: { type: Boolean, default: false },

  widgets: [WidgetSchema],

  config: {
    columnas: { type: Number, default: 12 },
    espaciado: { type: Number, default: 16 },
    intervalorRefreshGlobal: { type: Number, default: 60 },
    tema: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  },

  permisosRequeridos: [String],
}, {
  timestamps: true,
});

// Índices
DashboardSchema.index({ usuarioId: 1 });
DashboardSchema.index({ rolId: 1 });
DashboardSchema.index({ esPlantilla: 1 });
DashboardSchema.index({ esPorDefecto: 1 });

// ============================================
// CATÁLOGO DE WIDGETS
// ============================================

export const CATALOGO_WIDGETS: Record<TipoWidget, {
  nombre: string;
  descripcion: string;
  categoria: string;
  tamanosPermitidos: TamanoWidget[];
  permisosRequeridos?: string[];
  configDefault: Partial<IWidgetConfig>;
}> = {
  // Estadísticas generales
  [TipoWidget.RESUMEN_VENTAS]: {
    nombre: 'Resumen de Ventas',
    descripcion: 'Muestra el total de ventas del período seleccionado',
    categoria: 'Ventas',
    tamanosPermitidos: [TamanoWidget.PEQUENO, TamanoWidget.MEDIANO],
    permisosRequeridos: ['facturas.read'],
    configDefault: { periodo: 'mes', formato: 'moneda', mostrarPorcentaje: true },
  },
  [TipoWidget.RESUMEN_COMPRAS]: {
    nombre: 'Resumen de Compras',
    descripcion: 'Muestra el total de compras del período seleccionado',
    categoria: 'Compras',
    tamanosPermitidos: [TamanoWidget.PEQUENO, TamanoWidget.MEDIANO],
    permisosRequeridos: ['facturas-compra.read'],
    configDefault: { periodo: 'mes', formato: 'moneda', mostrarPorcentaje: true },
  },
  [TipoWidget.RESUMEN_TESORERIA]: {
    nombre: 'Resumen de Tesorería',
    descripcion: 'Muestra el saldo de tesorería (cobros vs pagos)',
    categoria: 'Tesorería',
    tamanosPermitidos: [TamanoWidget.PEQUENO, TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['tesoreria.read'],
    configDefault: { periodo: 'mes', formato: 'moneda' },
  },
  [TipoWidget.RESUMEN_FACTURACION]: {
    nombre: 'Facturación del Mes',
    descripcion: 'Resumen de facturación mensual',
    categoria: 'Ventas',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['facturas.read'],
    configDefault: { periodo: 'mes', formato: 'moneda' },
  },

  // Gráficas
  [TipoWidget.GRAFICA_VENTAS_PERIODO]: {
    nombre: 'Gráfica de Ventas',
    descripcion: 'Evolución de ventas en el período',
    categoria: 'Ventas',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ANCHO],
    permisosRequeridos: ['facturas.read'],
    configDefault: { periodo: 'mes', tipoGrafica: TipoGrafica.LINEA, mostrarLeyenda: true },
  },
  [TipoWidget.GRAFICA_VENTAS_FAMILIA]: {
    nombre: 'Ventas por Familia',
    descripcion: 'Distribución de ventas por familia de productos',
    categoria: 'Ventas',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['facturas.read', 'familias.read'],
    configDefault: { periodo: 'mes', tipoGrafica: TipoGrafica.CIRCULAR, mostrarLeyenda: true, limite: 10 },
  },
  [TipoWidget.GRAFICA_VENTAS_CLIENTE]: {
    nombre: 'Top Clientes',
    descripcion: 'Clientes con mayor volumen de ventas',
    categoria: 'Ventas',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['facturas.read', 'clientes.read'],
    configDefault: { periodo: 'mes', tipoGrafica: TipoGrafica.BARRAS_HORIZONTALES, limite: 10 },
  },
  [TipoWidget.GRAFICA_COMPRAS_PERIODO]: {
    nombre: 'Gráfica de Compras',
    descripcion: 'Evolución de compras en el período',
    categoria: 'Compras',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ANCHO],
    permisosRequeridos: ['facturas-compra.read'],
    configDefault: { periodo: 'mes', tipoGrafica: TipoGrafica.AREA, mostrarLeyenda: true },
  },
  [TipoWidget.GRAFICA_TESORERIA_FLUJO]: {
    nombre: 'Flujo de Caja',
    descripcion: 'Evolución del flujo de caja (cobros vs pagos)',
    categoria: 'Tesorería',
    tamanosPermitidos: [TamanoWidget.GRANDE, TamanoWidget.ANCHO, TamanoWidget.COMPLETO],
    permisosRequeridos: ['tesoreria.read'],
    configDefault: { periodo: 'mes', tipoGrafica: TipoGrafica.COMBINADO, mostrarLeyenda: true },
  },
  [TipoWidget.GRAFICA_COMPARATIVA_ANUAL]: {
    nombre: 'Comparativa Anual',
    descripcion: 'Comparación con el año anterior',
    categoria: 'Ventas',
    tamanosPermitidos: [TamanoWidget.GRANDE, TamanoWidget.ANCHO],
    permisosRequeridos: ['facturas.read'],
    configDefault: { tipoGrafica: TipoGrafica.BARRA, mostrarLeyenda: true },
  },
  [TipoWidget.GRAFICA_CIRCULAR]: {
    nombre: 'Gráfica Circular',
    descripcion: 'Gráfica circular personalizable',
    categoria: 'General',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    configDefault: { tipoGrafica: TipoGrafica.CIRCULAR, mostrarLeyenda: true },
  },

  // Listas
  [TipoWidget.ULTIMOS_DOCUMENTOS]: {
    nombre: 'Últimos Documentos',
    descripcion: 'Documentos creados recientemente',
    categoria: 'General',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ALTO],
    configDefault: { limite: 10 },
  },
  [TipoWidget.DOCUMENTOS_PENDIENTES]: {
    nombre: 'Documentos Pendientes',
    descripcion: 'Presupuestos y pedidos pendientes',
    categoria: 'General',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    configDefault: { limite: 10 },
  },
  [TipoWidget.CLIENTES_MOROSOS]: {
    nombre: 'Clientes Morosos',
    descripcion: 'Clientes con pagos vencidos',
    categoria: 'Tesorería',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ALTO],
    permisosRequeridos: ['tesoreria.read', 'clientes.read'],
    configDefault: { limite: 10 },
  },
  [TipoWidget.PRODUCTOS_MAS_VENDIDOS]: {
    nombre: 'Productos más Vendidos',
    descripcion: 'Ranking de productos más vendidos',
    categoria: 'Ventas',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ALTO],
    permisosRequeridos: ['productos.read', 'facturas.read'],
    configDefault: { limite: 10, periodo: 'mes' },
  },
  [TipoWidget.ACCESOS_RAPIDOS]: {
    nombre: 'Accesos Rápidos',
    descripcion: 'Enlaces rápidos personalizables',
    categoria: 'General',
    tamanosPermitidos: [TamanoWidget.PEQUENO, TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    configDefault: { enlaces: [] },
  },
  [TipoWidget.ALERTAS]: {
    nombre: 'Alertas',
    descripcion: 'Alertas y notificaciones importantes',
    categoria: 'General',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ALTO],
    configDefault: {},
  },

  // RRHH
  [TipoWidget.PARTES_TRABAJO_HOY]: {
    nombre: 'Partes de Trabajo Hoy',
    descripcion: 'Partes de trabajo del día',
    categoria: 'RRHH',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['partes-trabajo.read'],
    configDefault: {},
  },
  [TipoWidget.FICHAJES_HOY]: {
    nombre: 'Fichajes Hoy',
    descripcion: 'Fichajes del personal de hoy',
    categoria: 'RRHH',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['fichajes.read'],
    configDefault: {},
  },
  [TipoWidget.RESUMEN_PERSONAL]: {
    nombre: 'Resumen Personal',
    descripcion: 'Estado del personal (presentes, ausentes)',
    categoria: 'RRHH',
    tamanosPermitidos: [TamanoWidget.PEQUENO, TamanoWidget.MEDIANO],
    permisosRequeridos: ['personal.read'],
    configDefault: {},
  },

  // TPV
  [TipoWidget.RESUMEN_TPV]: {
    nombre: 'Resumen TPV',
    descripcion: 'Resumen de ventas del TPV',
    categoria: 'TPV',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['terminales.read'],
    configDefault: { periodo: 'hoy' },
  },
  [TipoWidget.VENTAS_TPV_HOY]: {
    nombre: 'Ventas TPV Hoy',
    descripcion: 'Detalle de ventas del TPV de hoy',
    categoria: 'TPV',
    tamanosPermitidos: [TamanoWidget.GRANDE, TamanoWidget.COMPLETO],
    permisosRequeridos: ['terminales.read'],
    configDefault: {},
  },

  // Calendario
  [TipoWidget.CALENDARIO]: {
    nombre: 'Calendario',
    descripcion: 'Calendario con eventos',
    categoria: 'General',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.COMPLETO],
    configDefault: {},
  },
  [TipoWidget.TAREAS_PENDIENTES]: {
    nombre: 'Tareas Pendientes',
    descripcion: 'Lista de tareas pendientes',
    categoria: 'General',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ALTO],
    configDefault: { limite: 10 },
  },
  [TipoWidget.RECORDATORIOS]: {
    nombre: 'Recordatorios',
    descripcion: 'Recordatorios próximos',
    categoria: 'General',
    tamanosPermitidos: [TamanoWidget.PEQUENO, TamanoWidget.MEDIANO],
    configDefault: { limite: 5 },
  },

  // KPIs
  [TipoWidget.KPI_SIMPLE]: {
    nombre: 'KPI Simple',
    descripcion: 'Indicador de rendimiento simple',
    categoria: 'KPIs',
    tamanosPermitidos: [TamanoWidget.PEQUENO, TamanoWidget.MEDIANO],
    configDefault: { formato: 'numero' },
  },
  [TipoWidget.KPI_COMPARATIVO]: {
    nombre: 'KPI Comparativo',
    descripcion: 'KPI con comparación período anterior',
    categoria: 'KPIs',
    tamanosPermitidos: [TamanoWidget.PEQUENO, TamanoWidget.MEDIANO],
    configDefault: { formato: 'numero', mostrarPorcentaje: true },
  },
  [TipoWidget.CONTADOR]: {
    nombre: 'Contador',
    descripcion: 'Contador numérico simple',
    categoria: 'KPIs',
    tamanosPermitidos: [TamanoWidget.PEQUENO],
    configDefault: { formato: 'numero' },
  },

  // CRM Widgets
  [TipoWidget.RESUMEN_CRM]: {
    nombre: 'Resumen CRM',
    descripcion: 'Resumen de leads, oportunidades y actividades',
    categoria: 'CRM',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['leads.read', 'oportunidades.read'],
    configDefault: { periodo: 'mes' },
  },
  [TipoWidget.LEADS_RECIENTES]: {
    nombre: 'Leads Recientes',
    descripcion: 'Últimos leads registrados',
    categoria: 'CRM',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ALTO],
    permisosRequeridos: ['leads.read'],
    configDefault: { limite: 10 },
  },
  [TipoWidget.OPORTUNIDADES_PIPELINE]: {
    nombre: 'Pipeline de Oportunidades',
    descripcion: 'Oportunidades por etapa del pipeline',
    categoria: 'CRM',
    tamanosPermitidos: [TamanoWidget.GRANDE, TamanoWidget.ANCHO, TamanoWidget.COMPLETO],
    permisosRequeridos: ['oportunidades.read'],
    configDefault: {},
  },
  [TipoWidget.ACTIVIDADES_CRM_PENDIENTES]: {
    nombre: 'Actividades CRM Pendientes',
    descripcion: 'Actividades programadas pendientes',
    categoria: 'CRM',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['actividades-crm.read'],
    configDefault: { limite: 10 },
  },
  [TipoWidget.GRAFICA_PIPELINE_CRM]: {
    nombre: 'Gráfica Pipeline CRM',
    descripcion: 'Distribución de oportunidades por etapa',
    categoria: 'CRM',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['oportunidades.read'],
    configDefault: { tipoGrafica: TipoGrafica.CIRCULAR, mostrarLeyenda: true },
  },
  [TipoWidget.FORECAST_CRM]: {
    nombre: 'Forecast de Ventas',
    descripcion: 'Previsión de ventas basada en oportunidades',
    categoria: 'CRM',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['oportunidades.read'],
    configDefault: { periodo: 'trimestre', formato: 'moneda' },
  },

  // Contabilidad Widgets
  [TipoWidget.RESUMEN_CONTABILIDAD]: {
    nombre: 'Resumen Contable',
    descripcion: 'Resumen del estado contable',
    categoria: 'Contabilidad',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE],
    permisosRequeridos: ['informes-contables.read'],
    configDefault: { periodo: 'mes' },
  },
  [TipoWidget.BALANCE_RAPIDO]: {
    nombre: 'Balance Rápido',
    descripcion: 'Balance de sumas y saldos resumido',
    categoria: 'Contabilidad',
    tamanosPermitidos: [TamanoWidget.GRANDE, TamanoWidget.COMPLETO],
    permisosRequeridos: ['informes-contables.read'],
    configDefault: {},
  },
  [TipoWidget.ULTIMOS_ASIENTOS]: {
    nombre: 'Últimos Asientos',
    descripcion: 'Últimos asientos contables registrados',
    categoria: 'Contabilidad',
    tamanosPermitidos: [TamanoWidget.MEDIANO, TamanoWidget.GRANDE, TamanoWidget.ALTO],
    permisosRequeridos: ['asientos.read'],
    configDefault: { limite: 10 },
  },
  [TipoWidget.GRAFICA_INGRESOS_GASTOS]: {
    nombre: 'Ingresos vs Gastos',
    descripcion: 'Comparativa de ingresos y gastos',
    categoria: 'Contabilidad',
    tamanosPermitidos: [TamanoWidget.GRANDE, TamanoWidget.ANCHO],
    permisosRequeridos: ['informes-contables.read'],
    configDefault: { periodo: 'mes', tipoGrafica: TipoGrafica.BARRA, mostrarLeyenda: true },
  },
};

// ============================================
// PLANTILLAS PREDEFINIDAS POR ROL
// ============================================

// Plantillas con rowHeight=80 (cada unidad = 80px + 12px margin)
// KPI widgets: h=2 (160px), Gráficas: h=4 (320px), Listas: h=4-5
export const PLANTILLAS_DASHBOARD: Record<string, { widgets: Partial<IWidget>[] }> = {
  gerente: {
    widgets: [
      { tipo: TipoWidget.RESUMEN_VENTAS, tamano: TamanoWidget.MEDIANO, posicion: { x: 0, y: 0, w: 3, h: 2 } },
      { tipo: TipoWidget.RESUMEN_COMPRAS, tamano: TamanoWidget.MEDIANO, posicion: { x: 3, y: 0, w: 3, h: 2 } },
      { tipo: TipoWidget.RESUMEN_TESORERIA, tamano: TamanoWidget.MEDIANO, posicion: { x: 6, y: 0, w: 3, h: 2 } },
      { tipo: TipoWidget.ACCESOS_RAPIDOS, tamano: TamanoWidget.PEQUENO, posicion: { x: 9, y: 0, w: 3, h: 2 } },
      { tipo: TipoWidget.GRAFICA_VENTAS_PERIODO, tamano: TamanoWidget.GRANDE, posicion: { x: 0, y: 2, w: 6, h: 4 } },
      { tipo: TipoWidget.GRAFICA_VENTAS_CLIENTE, tamano: TamanoWidget.GRANDE, posicion: { x: 6, y: 2, w: 6, h: 4 } },
      { tipo: TipoWidget.CLIENTES_MOROSOS, tamano: TamanoWidget.MEDIANO, posicion: { x: 0, y: 6, w: 4, h: 4 } },
      { tipo: TipoWidget.PRODUCTOS_MAS_VENDIDOS, tamano: TamanoWidget.MEDIANO, posicion: { x: 4, y: 6, w: 4, h: 4 } },
      { tipo: TipoWidget.ALERTAS, tamano: TamanoWidget.MEDIANO, posicion: { x: 8, y: 6, w: 4, h: 4 } },
    ],
  },
  vendedor: {
    widgets: [
      { tipo: TipoWidget.RESUMEN_VENTAS, tamano: TamanoWidget.MEDIANO, posicion: { x: 0, y: 0, w: 4, h: 2 } },
      { tipo: TipoWidget.DOCUMENTOS_PENDIENTES, tamano: TamanoWidget.MEDIANO, posicion: { x: 4, y: 0, w: 4, h: 2 } },
      { tipo: TipoWidget.ACCESOS_RAPIDOS, tamano: TamanoWidget.PEQUENO, posicion: { x: 8, y: 0, w: 4, h: 2 } },
      { tipo: TipoWidget.ULTIMOS_DOCUMENTOS, tamano: TamanoWidget.GRANDE, posicion: { x: 0, y: 2, w: 6, h: 4 } },
      { tipo: TipoWidget.PRODUCTOS_MAS_VENDIDOS, tamano: TamanoWidget.GRANDE, posicion: { x: 6, y: 2, w: 6, h: 4 } },
    ],
  },
  tecnico: {
    widgets: [
      { tipo: TipoWidget.PARTES_TRABAJO_HOY, tamano: TamanoWidget.GRANDE, posicion: { x: 0, y: 0, w: 6, h: 4 } },
      { tipo: TipoWidget.FICHAJES_HOY, tamano: TamanoWidget.MEDIANO, posicion: { x: 6, y: 0, w: 6, h: 2 } },
      { tipo: TipoWidget.ACCESOS_RAPIDOS, tamano: TamanoWidget.PEQUENO, posicion: { x: 6, y: 2, w: 6, h: 2 } },
      { tipo: TipoWidget.TAREAS_PENDIENTES, tamano: TamanoWidget.GRANDE, posicion: { x: 0, y: 4, w: 6, h: 4 } },
      { tipo: TipoWidget.CALENDARIO, tamano: TamanoWidget.GRANDE, posicion: { x: 6, y: 4, w: 6, h: 4 } },
    ],
  },
  almacenero: {
    widgets: [
      { tipo: TipoWidget.ALERTAS, tamano: TamanoWidget.MEDIANO, posicion: { x: 0, y: 0, w: 6, h: 2 } },
      { tipo: TipoWidget.ACCESOS_RAPIDOS, tamano: TamanoWidget.PEQUENO, posicion: { x: 6, y: 0, w: 6, h: 2 } },
      { tipo: TipoWidget.ULTIMOS_DOCUMENTOS, tamano: TamanoWidget.GRANDE, posicion: { x: 0, y: 2, w: 6, h: 4 } },
      { tipo: TipoWidget.DOCUMENTOS_PENDIENTES, tamano: TamanoWidget.GRANDE, posicion: { x: 6, y: 2, w: 6, h: 4 } },
    ],
  },
  admin: {
    widgets: [
      // Fila 1: KPIs (altura 2)
      { tipo: TipoWidget.RESUMEN_VENTAS, tamano: TamanoWidget.MEDIANO, posicion: { x: 0, y: 0, w: 3, h: 2 } },
      { tipo: TipoWidget.RESUMEN_COMPRAS, tamano: TamanoWidget.MEDIANO, posicion: { x: 3, y: 0, w: 3, h: 2 } },
      { tipo: TipoWidget.RESUMEN_TESORERIA, tamano: TamanoWidget.MEDIANO, posicion: { x: 6, y: 0, w: 3, h: 2 } },
      { tipo: TipoWidget.RESUMEN_PERSONAL, tamano: TamanoWidget.PEQUENO, posicion: { x: 9, y: 0, w: 3, h: 2 } },
      // Fila 2: Gráfica principal (altura 4)
      { tipo: TipoWidget.GRAFICA_VENTAS_PERIODO, tamano: TamanoWidget.ANCHO, posicion: { x: 0, y: 2, w: 12, h: 4 } },
      // Fila 3: Gráficas secundarias (altura 4)
      { tipo: TipoWidget.GRAFICA_COMPARATIVA_ANUAL, tamano: TamanoWidget.GRANDE, posicion: { x: 0, y: 6, w: 6, h: 4 } },
      { tipo: TipoWidget.GRAFICA_TESORERIA_FLUJO, tamano: TamanoWidget.GRANDE, posicion: { x: 6, y: 6, w: 6, h: 4 } },
      // Fila 4: Listas y accesos (altura 4)
      { tipo: TipoWidget.CLIENTES_MOROSOS, tamano: TamanoWidget.MEDIANO, posicion: { x: 0, y: 10, w: 4, h: 4 } },
      { tipo: TipoWidget.ALERTAS, tamano: TamanoWidget.MEDIANO, posicion: { x: 4, y: 10, w: 4, h: 4 } },
      { tipo: TipoWidget.ACCESOS_RAPIDOS, tamano: TamanoWidget.MEDIANO, posicion: { x: 8, y: 10, w: 4, h: 4 } },
    ],
  },
};

// ============================================
// MODELO
// ============================================

export const Dashboard: Model<IDashboard> = mongoose.models.Dashboard ||
  mongoose.model<IDashboard>('Dashboard', DashboardSchema);
