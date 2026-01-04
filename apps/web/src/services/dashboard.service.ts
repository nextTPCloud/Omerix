// apps/web/src/services/dashboard.service.ts

import { api } from './api'

// ============================================
// TIPOS
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
  PEQUENO = 'small',
  MEDIANO = 'medium',
  GRANDE = 'large',
  ANCHO = 'wide',
  ALTO = 'tall',
  COMPLETO = 'full',
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

export interface IWidgetConfig {
  periodo?: 'hoy' | 'semana' | 'mes' | 'trimestre' | 'anio' | 'custom'
  fechaDesde?: string
  fechaHasta?: string
  limite?: number
  filtros?: Record<string, any>
  tipoGrafica?: TipoGrafica
  mostrarLeyenda?: boolean
  mostrarEjes?: boolean
  colores?: string[]
  titulo?: string
  subtitulo?: string
  mostrarTotal?: boolean
  mostrarPorcentaje?: boolean
  formato?: 'moneda' | 'numero' | 'porcentaje'
  decimales?: number
  autoRefresh?: boolean
  intervaloRefresh?: number
  enlaces?: { titulo: string; url: string; icono?: string }[]
  items?: any[]
}

export interface IWidget {
  id: string
  tipo: TipoWidget
  tamano: TamanoWidget
  posicion: {
    x: number
    y: number
    w: number
    h: number
  }
  config: IWidgetConfig
  visible: boolean
}

export interface IDashboard {
  _id: string
  nombre: string
  descripcion?: string
  usuarioId?: string
  rolId?: string
  esPlantilla: boolean
  esPorDefecto: boolean
  widgets: IWidget[]
  config: {
    columnas: number
    espaciado: number
    intervalorRefreshGlobal?: number
    tema?: 'light' | 'dark' | 'system'
  }
  permisosRequeridos?: string[]
  createdAt: string
  updatedAt: string
}

export interface WidgetCatalogItem {
  tipo: TipoWidget
  nombre: string
  descripcion: string
  categoria: string
  tamanosPermitidos: TamanoWidget[]
  permisosRequeridos?: string[]
  configDefault: Partial<IWidgetConfig>
}

export interface WidgetDataResult {
  tipo: TipoWidget
  datos: any
  error?: string
  ultimaActualizacion: string
}

// ============================================
// SERVICIO
// ============================================

class DashboardService {
  private baseUrl = '/dashboard'

  /**
   * Obtener dashboard del usuario actual
   */
  async getDashboard(): Promise<{ success: boolean; data: IDashboard }> {
    const response = await api.get(this.baseUrl)
    return response.data
  }

  /**
   * Actualizar dashboard
   */
  async updateDashboard(
    id: string,
    data: Partial<IDashboard>
  ): Promise<{ success: boolean; data: IDashboard }> {
    const response = await api.put(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Añadir widget al dashboard
   */
  async addWidget(
    dashboardId: string,
    widget: {
      tipo: TipoWidget
      tamano?: TamanoWidget
      posicion?: { x: number; y: number; w: number; h: number }
      config?: Partial<IWidgetConfig>
    }
  ): Promise<{ success: boolean; data: IDashboard }> {
    const response = await api.post(`${this.baseUrl}/${dashboardId}/widgets`, widget)
    return response.data
  }

  /**
   * Actualizar widget
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<IWidget>
  ): Promise<{ success: boolean; data: IDashboard }> {
    const response = await api.put(
      `${this.baseUrl}/${dashboardId}/widgets/${widgetId}`,
      updates
    )
    return response.data
  }

  /**
   * Eliminar widget
   */
  async removeWidget(
    dashboardId: string,
    widgetId: string
  ): Promise<{ success: boolean; data: IDashboard }> {
    const response = await api.delete(
      `${this.baseUrl}/${dashboardId}/widgets/${widgetId}`
    )
    return response.data
  }

  /**
   * Obtener datos de todos los widgets
   */
  async getWidgetsData(
    dashboardId: string
  ): Promise<{ success: boolean; data: Record<string, WidgetDataResult> }> {
    const response = await api.get(`${this.baseUrl}/${dashboardId}/data`)
    return response.data
  }

  /**
   * Obtener datos de un widget específico
   */
  async getWidgetData(
    dashboardId: string,
    widgetId: string
  ): Promise<{ success: boolean; data: WidgetDataResult }> {
    const response = await api.get(
      `${this.baseUrl}/${dashboardId}/widgets/${widgetId}/data`
    )
    return response.data
  }

  /**
   * Obtener catálogo de widgets disponibles
   */
  async getCatalogo(): Promise<{
    success: boolean
    data: {
      catalogo: Record<TipoWidget, WidgetCatalogItem>
      porCategoria: Record<string, WidgetCatalogItem[]>
    }
  }> {
    const response = await api.get(`${this.baseUrl}/catalogo`)
    return response.data
  }

  /**
   * Restablecer dashboard a valores por defecto
   */
  async resetDashboard(
    dashboardId: string
  ): Promise<{ success: boolean; data: IDashboard }> {
    const response = await api.post(`${this.baseUrl}/${dashboardId}/reset`)
    return response.data
  }

  /**
   * Actualizar posiciones de widgets (batch update)
   */
  async updateWidgetPositions(
    dashboardId: string,
    widgets: Array<{ id: string; posicion: { x: number; y: number; w: number; h: number } }>
  ): Promise<{ success: boolean; data: IDashboard }> {
    // Obtener dashboard actual y actualizar posiciones
    const currentDashboard = await this.getDashboard()
    const updatedWidgets = currentDashboard.data.widgets.map((w) => {
      const update = widgets.find((u) => u.id === w.id)
      return update ? { ...w, posicion: update.posicion } : w
    })

    return this.updateDashboard(dashboardId, { widgets: updatedWidgets })
  }
}

export const dashboardService = new DashboardService()
