'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
// Layout type for react-grid-layout
interface RGLLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}
import { Button } from '@/components/ui/button'
import { RefreshCw, Settings, Plus, LayoutGrid, RotateCcw, Save, Lock, Unlock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  dashboardService,
  IDashboard,
  IWidget,
  TipoWidget,
  TipoGrafica,
  TamanoWidget,
  WidgetDataResult,
} from '@/services/dashboard.service'

// Widgets
import { KPIWidget } from './widgets/KPIWidget'
import { ChartWidget } from './widgets/ChartWidget'
import { ListWidget } from './widgets/ListWidget'
import { QuickLinksWidget } from './widgets/QuickLinksWidget'
import { TareasWidget } from './widgets/TareasWidget'

// Iconos para KPIs
import {
  DollarSign,
  ShoppingBag,
  Wallet,
  FileText,
  Users,
  Package,
  AlertTriangle,
  BarChart2,
  Calendar,
  Clock,
  TrendingUp,
  PieChart,
  Receipt,
  Layers,
  ClipboardList,
  Bell,
  CalendarDays,
  CheckSquare,
  // CRM
  Target,
  Briefcase,
  Phone,
  // Contabilidad
  Calculator,
  BookOpen,
  Scale,
  Coins,
} from 'lucide-react'

// Estilos de react-grid-layout
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// Cargar react-grid-layout dinámicamente para evitar problemas con SSR
// En v2.x, WidthProvider y ResponsiveReactGridLayout están en el módulo 'legacy'
const ResponsiveGridLayout = dynamic(
  async () => {
    const { WidthProvider, ResponsiveReactGridLayout } = await import('react-grid-layout/legacy')
    return WidthProvider(ResponsiveReactGridLayout)
  },
  { ssr: false }
)

// Catálogo de widgets para el selector
const WIDGET_CATALOGO = {
  'Ventas': [
    { tipo: TipoWidget.RESUMEN_VENTAS, nombre: 'Resumen Ventas', icono: DollarSign },
    { tipo: TipoWidget.RESUMEN_FACTURACION, nombre: 'Resumen Facturación', icono: Receipt },
    { tipo: TipoWidget.GRAFICA_VENTAS_PERIODO, nombre: 'Gráfica Ventas', icono: BarChart2 },
    { tipo: TipoWidget.GRAFICA_VENTAS_FAMILIA, nombre: 'Ventas por Familia', icono: Layers },
    { tipo: TipoWidget.GRAFICA_VENTAS_CLIENTE, nombre: 'Top Clientes', icono: Users },
    { tipo: TipoWidget.PRODUCTOS_MAS_VENDIDOS, nombre: 'Top Productos', icono: Package },
    { tipo: TipoWidget.GRAFICA_COMPARATIVA_ANUAL, nombre: 'Comparativa Anual', icono: TrendingUp },
  ],
  'Compras': [
    { tipo: TipoWidget.RESUMEN_COMPRAS, nombre: 'Resumen Compras', icono: ShoppingBag },
    { tipo: TipoWidget.GRAFICA_COMPRAS_PERIODO, nombre: 'Gráfica Compras', icono: BarChart2 },
  ],
  'Tesorería': [
    { tipo: TipoWidget.RESUMEN_TESORERIA, nombre: 'Resumen Tesorería', icono: Wallet },
    { tipo: TipoWidget.GRAFICA_TESORERIA_FLUJO, nombre: 'Flujo de Caja', icono: TrendingUp },
    { tipo: TipoWidget.CLIENTES_MOROSOS, nombre: 'Clientes Morosos', icono: AlertTriangle },
  ],
  'Documentos': [
    { tipo: TipoWidget.ULTIMOS_DOCUMENTOS, nombre: 'Últimos Documentos', icono: FileText },
    { tipo: TipoWidget.DOCUMENTOS_PENDIENTES, nombre: 'Docs Pendientes', icono: ClipboardList },
    { tipo: TipoWidget.TAREAS_PENDIENTES, nombre: 'Tareas Pendientes', icono: CheckSquare },
    { tipo: TipoWidget.RECORDATORIOS, nombre: 'Recordatorios', icono: Bell },
    { tipo: TipoWidget.CALENDARIO, nombre: 'Calendario', icono: CalendarDays },
  ],
  'RRHH': [
    { tipo: TipoWidget.PARTES_TRABAJO_HOY, nombre: 'Partes de Trabajo', icono: Clock },
    { tipo: TipoWidget.FICHAJES_HOY, nombre: 'Fichajes Hoy', icono: Users },
    { tipo: TipoWidget.RESUMEN_PERSONAL, nombre: 'Resumen Personal', icono: Users },
  ],
  'CRM': [
    { tipo: TipoWidget.RESUMEN_CRM, nombre: 'Resumen CRM', icono: Target },
    { tipo: TipoWidget.LEADS_RECIENTES, nombre: 'Leads Recientes', icono: Users },
    { tipo: TipoWidget.OPORTUNIDADES_PIPELINE, nombre: 'Pipeline Oportunidades', icono: Briefcase },
    { tipo: TipoWidget.ACTIVIDADES_CRM_PENDIENTES, nombre: 'Actividades CRM', icono: Phone },
    { tipo: TipoWidget.GRAFICA_PIPELINE_CRM, nombre: 'Gráfica Pipeline', icono: PieChart },
    { tipo: TipoWidget.FORECAST_CRM, nombre: 'Forecast Ventas', icono: TrendingUp },
  ],
  'Contabilidad': [
    { tipo: TipoWidget.RESUMEN_CONTABILIDAD, nombre: 'Resumen Contable', icono: Calculator },
    { tipo: TipoWidget.BALANCE_RAPIDO, nombre: 'Balance Rápido', icono: Scale },
    { tipo: TipoWidget.ULTIMOS_ASIENTOS, nombre: 'Últimos Asientos', icono: BookOpen },
    { tipo: TipoWidget.GRAFICA_INGRESOS_GASTOS, nombre: 'Ingresos vs Gastos', icono: Coins },
  ],
  'Otros': [
    { tipo: TipoWidget.ACCESOS_RAPIDOS, nombre: 'Accesos Rápidos', icono: LayoutGrid },
    { tipo: TipoWidget.ALERTAS, nombre: 'Alertas', icono: AlertTriangle },
    { tipo: TipoWidget.GRAFICA_CIRCULAR, nombre: 'Gráfica Circular', icono: PieChart },
    { tipo: TipoWidget.KPI_SIMPLE, nombre: 'KPI Simple', icono: TrendingUp },
    { tipo: TipoWidget.CONTADOR, nombre: 'Contador', icono: BarChart2 },
  ],
}

interface DashboardGridProps {
  refreshInterval?: number
}

export function DashboardGrid({ refreshInterval = 60 }: DashboardGridProps) {
  const [dashboard, setDashboard] = useState<IDashboard | null>(null)
  const [widgetsData, setWidgetsData] = useState<Record<string, WidgetDataResult>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showCatalogo, setShowCatalogo] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Cargar dashboard
  const cargarDashboard = useCallback(async () => {
    try {
      const response = await dashboardService.getDashboard()
      if (response.success) {
        setDashboard(response.data)
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error)
      toast.error('Error al cargar el dashboard')
    }
  }, [])

  // Cargar datos de widgets
  const cargarDatosWidgets = useCallback(async (silent = false) => {
    if (!dashboard) return

    try {
      if (!silent) setIsRefreshing(true)
      const response = await dashboardService.getWidgetsData(dashboard._id)
      if (response.success) {
        setWidgetsData(response.data)
      }
    } catch (error) {
      console.error('Error cargando datos de widgets:', error)
    } finally {
      if (!silent) setIsRefreshing(false)
    }
  }, [dashboard])

  // Carga inicial
  useEffect(() => {
    const inicializar = async () => {
      setIsLoading(true)
      await cargarDashboard()
      setIsLoading(false)
    }
    inicializar()
  }, [cargarDashboard])

  // Cargar datos cuando se tiene el dashboard
  useEffect(() => {
    if (dashboard) {
      cargarDatosWidgets()
    }
  }, [dashboard, cargarDatosWidgets])

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0 || !dashboard || editMode) return

    const interval = setInterval(() => {
      cargarDatosWidgets(true)
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [refreshInterval, dashboard, cargarDatosWidgets, editMode])

  // Generar layout para react-grid-layout
  const layout = useMemo(() => {
    if (!dashboard) return []
    return dashboard.widgets
      .filter((w) => w.visible)
      .map((widget) => ({
        i: widget.id,
        x: widget.posicion.x,
        y: widget.posicion.y,
        w: widget.posicion.w,
        h: widget.posicion.h,
        minW: 2,
        minH: 2,  // Mínimo 2 unidades (160px con rowHeight=80)
        maxH: 8,  // Máximo 8 unidades (640px)
      }))
  }, [dashboard])

  // Manejar cambio de layout (drag/resize)
  const handleLayoutChange = useCallback((layout: any, layouts: any) => {
    if (!dashboard || !editMode) return

    // Use the current breakpoint layout or fallback to the provided layout
    const newLayout = layout as RGLLayout[]

    const updatedWidgets = dashboard.widgets.map((widget) => {
      const layoutItem = newLayout.find((l) => l.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          posicion: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        }
      }
      return widget
    })

    setDashboard({ ...dashboard, widgets: updatedWidgets })
    setHasChanges(true)
  }, [dashboard, editMode])

  // Guardar cambios
  const handleSave = async () => {
    if (!dashboard || !hasChanges) return

    try {
      setIsSaving(true)
      const response = await dashboardService.updateDashboard(dashboard._id, {
        widgets: dashboard.widgets,
      })
      if (response.success) {
        setDashboard(response.data)
        setHasChanges(false)
        toast.success('Dashboard guardado correctamente')
      }
    } catch (error) {
      toast.error('Error al guardar el dashboard')
    } finally {
      setIsSaving(false)
    }
  }

  // Eliminar widget
  const handleRemoveWidget = async (widgetId: string) => {
    if (!dashboard) return

    try {
      const response = await dashboardService.removeWidget(dashboard._id, widgetId)
      if (response.success) {
        setDashboard(response.data)
        toast.success('Widget eliminado')
      }
    } catch (error) {
      toast.error('Error al eliminar el widget')
    }
  }

  // Añadir widget con tamaños apropiados según el tipo
  const handleAddWidget = async (tipo: TipoWidget) => {
    if (!dashboard) return

    // Determinar tamaño por defecto según el tipo de widget
    let defaultH = 2  // KPIs pequeños
    if (tipo.includes('grafica') || tipo.includes('flujo') || tipo.includes('comparativa')) {
      defaultH = 4  // Gráficas
    } else if (tipo.includes('lista') || tipo.includes('documentos') || tipo.includes('morosos') || tipo.includes('tareas') || tipo.includes('alertas') || tipo.includes('partes') || tipo.includes('fichajes')) {
      defaultH = 4  // Listas
    }

    try {
      const response = await dashboardService.addWidget(dashboard._id, {
        tipo,
        tamano: TamanoWidget.MEDIANO,
        posicion: { x: 0, y: 0, w: 3, h: defaultH },
      })
      if (response.success) {
        setDashboard(response.data)
        await cargarDatosWidgets()
        toast.success('Widget añadido')
        setShowCatalogo(false)
      }
    } catch (error) {
      toast.error('Error al añadir widget')
    }
  }

  // Refrescar widget individual
  const handleRefreshWidget = async (widgetId: string) => {
    if (!dashboard) return

    try {
      const response = await dashboardService.getWidgetData(dashboard._id, widgetId)
      if (response.success) {
        setWidgetsData((prev) => ({
          ...prev,
          [widgetId]: response.data,
        }))
      }
    } catch (error) {
      console.error('Error refrescando widget:', error)
    }
  }

  // Restablecer dashboard
  const handleReset = async () => {
    if (!dashboard) return

    try {
      const response = await dashboardService.resetDashboard(dashboard._id)
      if (response.success) {
        setDashboard(response.data)
        setHasChanges(false)
        await cargarDatosWidgets()
        toast.success('Dashboard restablecido')
      }
    } catch (error) {
      toast.error('Error al restablecer el dashboard')
    }
  }

  // Renderizar widget según tipo
  const renderWidget = (widget: IWidget) => {
    const data = widgetsData[widget.id]
    const isWidgetLoading = !data && isRefreshing
    const error = data?.error

    const commonProps = {
      widget,
      isLoading: isWidgetLoading,
      error,
      onRefresh: () => handleRefreshWidget(widget.id),
      onRemove: editMode ? () => handleRemoveWidget(widget.id) : undefined,
    }

    switch (widget.tipo) {
      case TipoWidget.RESUMEN_VENTAS:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Ventas del Mes"
            data={data?.datos}
            icono={<DollarSign className="h-6 w-6 text-green-600" />}
            colorClase="text-green-600"
          />
        )

      case TipoWidget.RESUMEN_COMPRAS:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Compras del Mes"
            data={data?.datos}
            icono={<ShoppingBag className="h-6 w-6 text-red-600" />}
            colorClase="text-red-600"
          />
        )

      case TipoWidget.RESUMEN_TESORERIA:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Saldo Tesorería"
            data={data?.datos ? { total: data.datos.saldoNeto || 0 } : null}
            icono={<Wallet className="h-6 w-6 text-blue-600" />}
            colorClase="text-blue-600"
          />
        )

      case TipoWidget.GRAFICA_VENTAS_PERIODO:
        return (
          <ChartWidget
            {...commonProps}
            titulo="Evolución de Ventas"
            data={data?.datos}
            dataKeys={[{ key: 'total', name: 'Ventas', color: '#10b981' }]}
          />
        )

      case TipoWidget.GRAFICA_TESORERIA_FLUJO:
        return (
          <ChartWidget
            {...commonProps}
            widget={{ ...widget, config: { ...widget.config, tipoGrafica: TipoGrafica.COMBINADO, formato: 'moneda' } }}
            titulo="Flujo de Caja"
            data={data?.datos?.prevision}
            dataKeys={[
              { key: 'cobros', name: 'Cobros', color: '#10b981', type: 'bar' },
              { key: 'pagos', name: 'Pagos', color: '#ef4444', type: 'bar' },
              { key: 'saldoAcumulado', name: 'Saldo', color: '#3b82f6', type: 'line' },
            ]}
          />
        )

      case TipoWidget.GRAFICA_VENTAS_CLIENTE:
      case TipoWidget.PRODUCTOS_MAS_VENDIDOS:
        return (
          <ChartWidget
            {...commonProps}
            titulo={widget.tipo === TipoWidget.PRODUCTOS_MAS_VENDIDOS ? 'Productos más Vendidos' : 'Top Clientes'}
            data={data?.datos}
            dataKeys={[{ key: 'total', name: 'Total', color: '#3b82f6' }]}
            xAxisKey="nombre"
          />
        )

      case TipoWidget.CLIENTES_MOROSOS:
        return (
          <ListWidget
            {...commonProps}
            titulo="Clientes Morosos"
            data={data?.datos?.map((c: any) => ({
              id: c.clienteId,
              titulo: c.nombre,
              subtitulo: `${c.documentosPendientes} docs pendientes`,
              valor: c.importePendiente,
              icono: 'user' as const,
              url: `/clientes/${c.clienteId}`,
              badge: {
                texto: `${c.diasMoraProm} días`,
                variante: c.diasMoraProm > 30 ? 'destructive' as const : 'secondary' as const,
              },
            }))}
            emptyMessage="Sin clientes morosos"
          />
        )

      case TipoWidget.ULTIMOS_DOCUMENTOS:
        return (
          <ListWidget
            {...commonProps}
            titulo="Últimos Documentos"
            data={data?.datos?.map((d: any) => ({
              id: d._id,
              titulo: d.codigo,
              subtitulo: d.clienteNombre,
              valor: d.totales?.totalFactura,
              fecha: d.fecha,
              icono: 'document' as const,
              url: `/facturas/${d._id}`,
            }))}
            emptyMessage="Sin documentos recientes"
          />
        )

      case TipoWidget.ACCESOS_RAPIDOS:
        return <QuickLinksWidget {...commonProps} frecuentes={data?.datos} />

      case TipoWidget.ALERTAS:
        return (
          <ListWidget
            {...commonProps}
            titulo="Alertas"
            data={data?.datos?.map((a: any) => ({
              id: a.id,
              titulo: a.titulo,
              subtitulo: a.descripcion,
              icono: 'alert' as const,
              url: a.url,
              badge: a.prioridad ? {
                texto: a.prioridad,
                variante: a.prioridad === 'urgente' ? 'destructive' as const : 'secondary' as const
              } : undefined,
            }))}
            emptyMessage="Sin alertas pendientes"
          />
        )

      case TipoWidget.RESUMEN_FACTURACION:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Resumen Facturación"
            data={data?.datos ? {
              total: data.datos.totalFacturado || 0,
              count: data.datos.facturas || 0,
            } : null}
            icono={<Receipt className="h-6 w-6 text-purple-600" />}
            colorClase="text-purple-600"
          />
        )

      case TipoWidget.GRAFICA_VENTAS_FAMILIA:
        return (
          <ChartWidget
            {...commonProps}
            titulo="Ventas por Familia"
            data={data?.datos}
            dataKeys={[{ key: 'total', name: 'Total', color: '#8b5cf6' }]}
            xAxisKey="nombre"
          />
        )

      case TipoWidget.GRAFICA_COMPRAS_PERIODO:
        return (
          <ChartWidget
            {...commonProps}
            titulo="Compras del Período"
            data={data?.datos}
            dataKeys={[{ key: 'total', name: 'Total', color: '#ef4444' }]}
          />
        )

      case TipoWidget.GRAFICA_COMPARATIVA_ANUAL:
        const anioActual = new Date().getFullYear()
        const anioAnterior = anioActual - 1
        return (
          <ChartWidget
            {...commonProps}
            titulo="Comparativa Anual"
            data={data?.datos}
            dataKeys={[
              { key: `${anioActual}`, name: `${anioActual}`, color: '#3b82f6' },
              { key: `${anioAnterior}`, name: `${anioAnterior}`, color: '#94a3b8' },
            ]}
            xAxisKey="mes"
          />
        )

      case TipoWidget.GRAFICA_CIRCULAR:
        return (
          <ChartWidget
            {...commonProps}
            titulo="Distribución por Estado"
            data={data?.datos}
            dataKeys={[{ key: 'value', name: 'Valor', color: '#3b82f6' }]}
            xAxisKey="name"
          />
        )

      case TipoWidget.DOCUMENTOS_PENDIENTES:
        const docsPendientes = data?.datos || {}
        const allDocs = [
          ...(docsPendientes.presupuestos || []).map((d: any) => ({ ...d, tipo: 'presupuesto' })),
          ...(docsPendientes.pedidos || []).map((d: any) => ({ ...d, tipo: 'pedido' })),
          ...(docsPendientes.albaranes || []).map((d: any) => ({ ...d, tipo: 'albaran' })),
        ]
        return (
          <ListWidget
            {...commonProps}
            titulo="Documentos Pendientes"
            data={allDocs.map((d: any) => ({
              id: d._id,
              titulo: d.codigo,
              subtitulo: d.clienteNombre,
              valor: d.totales?.total,
              fecha: d.fecha,
              icono: 'document' as const,
              url: `/${d.tipo}s/${d._id}`,
              badge: { texto: d.tipo, variante: 'secondary' as const },
            }))}
            emptyMessage="Sin documentos pendientes"
          />
        )

      case TipoWidget.TAREAS_PENDIENTES:
        return (
          <TareasWidget
            widget={widget}
            onRemove={editMode ? () => handleRemoveWidget(widget.id) : undefined}
          />
        )

      case TipoWidget.RECORDATORIOS:
        return (
          <ListWidget
            {...commonProps}
            titulo="Recordatorios"
            data={data?.datos?.map((r: any) => ({
              id: r.id,
              titulo: r.titulo,
              subtitulo: r.subtitulo,
              fecha: r.fecha,
              icono: 'alert' as const,
              url: r.url,
            }))}
            emptyMessage="Sin recordatorios"
          />
        )

      case TipoWidget.CALENDARIO:
        return (
          <ListWidget
            {...commonProps}
            titulo="Próximos Eventos"
            data={data?.datos?.map((e: any) => ({
              id: e.id,
              titulo: e.titulo,
              fecha: e.fecha,
              valor: e.importe,
              icono: 'document' as const,
              badge: {
                texto: e.tipo,
                variante: e.tipo === 'vencimiento' ? 'destructive' as const : 'secondary' as const
              },
            }))}
            emptyMessage="Sin eventos próximos"
          />
        )

      case TipoWidget.PARTES_TRABAJO_HOY:
        const getTipoBadge = (tipo: string) => {
          const tipos: Record<string, string> = {
            mantenimiento: 'Mant.',
            instalacion: 'Inst.',
            reparacion: 'Rep.',
            servicio: 'Serv.',
            proyecto: 'Proy.',
            otro: 'Otro',
          }
          return tipos[tipo] || tipo
        }
        const getPrioridadVariante = (prioridad: string) => {
          if (prioridad === 'urgente' || prioridad === 'alta') return 'destructive' as const
          return 'secondary' as const
        }
        return (
          <ListWidget
            {...commonProps}
            titulo="Partes de Trabajo Hoy"
            data={data?.datos?.partes?.map((p: any) => ({
              id: p._id,
              titulo: p.titulo || p.codigo,
              subtitulo: `${p.clienteNombre}${p.proyectoNombre ? ` - ${p.proyectoNombre}` : ''}`,
              valor: p.totales?.ventaTotal || p.horasTrabajadas,
              icono: 'document' as const,
              url: `/partes-trabajo/${p._id}`,
              badge: p.tipo ? {
                texto: getTipoBadge(p.tipo),
                variante: getPrioridadVariante(p.prioridad),
              } : undefined,
            }))}
            emptyMessage="Sin partes de trabajo"
          />
        )

      case TipoWidget.FICHAJES_HOY:
        return (
          <ListWidget
            {...commonProps}
            titulo="Fichajes de Hoy"
            data={data?.datos?.fichajes?.map((f: any) => ({
              id: f._id,
              titulo: f.personalNombre,
              subtitulo: f.horaEntrada ? `Entrada: ${new Date(f.horaEntrada).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : '',
              icono: 'user' as const,
              badge: {
                texto: f.estado,
                variante: f.estado === 'abierto' ? 'default' as const : 'secondary' as const
              },
            }))}
            emptyMessage="Sin fichajes hoy"
          />
        )

      case TipoWidget.RESUMEN_PERSONAL:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Personal Activo"
            data={data?.datos ? {
              total: data.datos.personalActivo || 0,
              count: data.datos.fichajesHoy || 0,
              variacion: data.datos.porcentajeAsistencia,
              tendencia: (data.datos.porcentajeAsistencia || 0) >= 80 ? 'up' : 'down',
            } : null}
            icono={<Users className="h-6 w-6 text-indigo-600" />}
            colorClase="text-indigo-600"
          />
        )

      case TipoWidget.RESUMEN_TPV:
      case TipoWidget.VENTAS_TPV_HOY:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Ventas TPV"
            data={data?.datos ? {
              total: data.datos.total || 0,
              count: data.datos.tickets || 0,
            } : null}
            icono={<ShoppingBag className="h-6 w-6 text-orange-600" />}
            colorClase="text-orange-600"
          />
        )

      case TipoWidget.KPI_SIMPLE:
      case TipoWidget.KPI_COMPARATIVO:
        return (
          <KPIWidget
            {...commonProps}
            titulo={widget.config.titulo || 'KPI'}
            data={data?.datos ? {
              total: data.datos.total || 0,
              count: data.datos.count || 0,
            } : null}
            icono={<TrendingUp className="h-6 w-6 text-primary" />}
          />
        )

      case TipoWidget.CONTADOR:
        return (
          <KPIWidget
            {...commonProps}
            titulo={`${data?.datos?.tipoDocumento || 'Documentos'}`}
            data={data?.datos ? {
              total: data.datos.total || 0,
            } : null}
            icono={<FileText className="h-6 w-6 text-gray-600" />}
            colorClase="text-gray-600"
          />
        )

      // ============================================
      // WIDGETS CRM
      // ============================================

      case TipoWidget.RESUMEN_CRM:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Resumen CRM"
            data={data?.datos ? {
              total: data.datos.valorPipeline || 0,
              count: data.datos.oportunidades || 0,
              variacion: data.datos.leads,
              tendencia: 'up',
            } : null}
            icono={<Target className="h-6 w-6 text-purple-600" />}
            colorClase="text-purple-600"
          />
        )

      case TipoWidget.LEADS_RECIENTES:
        return (
          <ListWidget
            {...commonProps}
            titulo="Leads Recientes"
            data={data?.datos?.map((l: any) => ({
              id: l._id,
              titulo: l.nombre || l.empresa,
              subtitulo: l.email || l.telefono,
              valor: l.valorEstimado,
              icono: 'user' as const,
              url: `/crm/leads/${l._id}`,
              badge: l.etapa ? {
                texto: l.etapa,
                variante: l.estado === 'calificado' ? 'default' as const : 'secondary' as const,
              } : undefined,
            }))}
            emptyMessage="Sin leads recientes"
          />
        )

      case TipoWidget.OPORTUNIDADES_PIPELINE:
        return (
          <ChartWidget
            {...commonProps}
            widget={{ ...widget, config: { ...widget.config, tipoGrafica: TipoGrafica.BARRAS_HORIZONTALES, formato: 'moneda' } }}
            titulo="Pipeline de Oportunidades"
            data={data?.datos?.map((etapa: any) => ({
              name: etapa.nombre || 'Sin etapa',
              value: etapa.valor || 0,
              count: etapa.count || 0,
            }))}
            dataKeys={[{ key: 'value', name: 'Valor', color: '#8b5cf6' }]}
            xAxisKey="name"
          />
        )

      case TipoWidget.ACTIVIDADES_CRM_PENDIENTES:
        return (
          <ListWidget
            {...commonProps}
            titulo="Actividades CRM Pendientes"
            data={data?.datos?.map((a: any) => ({
              id: a._id,
              titulo: a.asunto,
              subtitulo: a.clienteNombre || a.oportunidadNombre,
              fecha: a.fechaProgramada,
              icono: 'document' as const,
              url: `/crm/actividades/${a._id}`,
              badge: a.tipo ? {
                texto: a.tipo,
                variante: a.prioridad === 'alta' ? 'destructive' as const : 'secondary' as const,
              } : undefined,
            }))}
            emptyMessage="Sin actividades pendientes"
          />
        )

      case TipoWidget.GRAFICA_PIPELINE_CRM:
        return (
          <ChartWidget
            {...commonProps}
            widget={{ ...widget, config: { ...widget.config, tipoGrafica: TipoGrafica.BARRAS_HORIZONTALES, formato: 'moneda' } }}
            titulo="Distribución Pipeline"
            data={data?.datos}
            dataKeys={[{ key: 'value', name: 'Valor', color: '#8b5cf6' }]}
            xAxisKey="name"
          />
        )

      case TipoWidget.FORECAST_CRM:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Forecast de Ventas"
            data={data?.datos ? {
              total: data.datos.forecastPonderado || 0,
              count: data.datos.oportunidadesAbiertas || 0,
              variacion: data.datos.ganado > 0 ? ((data.datos.forecastPonderado / data.datos.ganado) * 100) : 0,
              tendencia: 'up',
            } : null}
            icono={<TrendingUp className="h-6 w-6 text-emerald-600" />}
            colorClase="text-emerald-600"
          />
        )

      // ============================================
      // WIDGETS CONTABILIDAD
      // ============================================

      case TipoWidget.RESUMEN_CONTABILIDAD:
        return (
          <KPIWidget
            {...commonProps}
            titulo="Resumen Contable"
            data={data?.datos ? {
              total: data.datos.resultado || 0,
              count: data.datos.totalAsientos || 0,
              variacion: data.datos.ingresos > 0 ? ((data.datos.resultado / data.datos.ingresos) * 100) : 0,
              tendencia: (data.datos.resultado || 0) >= 0 ? 'up' : 'down',
            } : null}
            icono={<Calculator className="h-6 w-6 text-cyan-600" />}
            colorClase="text-cyan-600"
          />
        )

      case TipoWidget.BALANCE_RAPIDO:
        return (
          <ListWidget
            {...commonProps}
            titulo="Balance Rápido"
            data={data?.datos?.map((g: any) => ({
              id: g.grupo,
              titulo: g.nombre,
              subtitulo: `Grupo ${g.grupo}`,
              valor: g.saldoDeudor > 0 ? g.saldoDeudor : -g.saldoAcreedor,
              icono: 'document' as const,
              badge: {
                texto: g.saldoDeudor > 0 ? 'Deudor' : 'Acreedor',
                variante: g.saldoDeudor > 0 ? 'default' as const : 'secondary' as const,
              },
            }))}
            emptyMessage="Sin datos de balance"
          />
        )

      case TipoWidget.ULTIMOS_ASIENTOS:
        return (
          <ListWidget
            {...commonProps}
            titulo="Últimos Asientos"
            data={data?.datos?.map((a: any) => ({
              id: a._id,
              titulo: `Asiento ${a.numero}`,
              subtitulo: a.concepto,
              valor: a.totalDebe,
              fecha: a.fecha,
              icono: 'document' as const,
              url: `/contabilidad/asientos/${a._id}`,
              badge: a.estado ? {
                texto: a.estado,
                variante: a.estado === 'contabilizado' ? 'default' as const : 'secondary' as const,
              } : undefined,
            }))}
            emptyMessage="Sin asientos recientes"
          />
        )

      case TipoWidget.GRAFICA_INGRESOS_GASTOS:
        return (
          <ChartWidget
            {...commonProps}
            titulo="Ingresos vs Gastos"
            data={data?.datos}
            dataKeys={[
              { key: 'ingresos', name: 'Ingresos', color: '#10b981' },
              { key: 'gastos', name: 'Gastos', color: '#ef4444' },
              { key: 'resultado', name: 'Resultado', color: '#3b82f6', type: 'line' },
            ]}
            xAxisKey="mes"
          />
        )

      default:
        return (
          <div className="p-4 border rounded-lg bg-muted/50 h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Widget "{widget.tipo}" en desarrollo
            </p>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">No se pudo cargar el dashboard</p>
        <Button onClick={cargarDashboard}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.nombre}</h1>
          {dashboard.descripcion && (
            <p className="text-sm text-muted-foreground">{dashboard.descripcion}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!editMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cargarDatosWidgets()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          )}

          {editMode && hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
              Guardar
            </Button>
          )}

          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (editMode && hasChanges) {
                if (confirm('¿Descartar cambios sin guardar?')) {
                  setEditMode(false)
                  setHasChanges(false)
                  cargarDashboard()
                }
              } else {
                setEditMode(!editMode)
              }
            }}
          >
            {editMode ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Bloquear
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Editar
              </>
            )}
          </Button>

          {editMode && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowCatalogo(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Indicador de modo edición */}
      {editMode && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
          <strong>Modo edición:</strong> Arrastra los widgets para reorganizarlos. Usa las esquinas para redimensionar.
          {hasChanges && <span className="ml-2 text-orange-600 font-medium">• Hay cambios sin guardar</span>}
        </div>
      )}

      {/* Grid de widgets con drag-and-drop */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[12, 12]}
      >
        {dashboard.widgets
          .filter((w) => w.visible)
          .map((widget) => (
            <div key={widget.id} className="widget-container">
              <div className={editMode ? 'drag-handle cursor-move h-full' : 'h-full'}>
                {renderWidget(widget)}
              </div>
            </div>
          ))}
      </ResponsiveGridLayout>

      {/* Modal catálogo de widgets */}
      <Dialog open={showCatalogo} onOpenChange={setShowCatalogo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Añadir Widget</DialogTitle>
            <DialogDescription>
              Selecciona un widget para añadir a tu dashboard
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="Ventas" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1">
              {Object.keys(WIDGET_CATALOGO).map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-xs px-3 py-1.5">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(WIDGET_CATALOGO).map(([categoria, widgets]) => (
              <TabsContent key={categoria} value={categoria}>
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-2 gap-3 p-2">
                    {widgets.map((w) => {
                      const Icono = w.icono
                      return (
                        <Button
                          key={w.tipo}
                          variant="outline"
                          className="h-auto py-4 px-4 justify-start gap-3 hover:bg-primary/5"
                          onClick={() => handleAddWidget(w.tipo)}
                        >
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icono className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{w.nombre}</span>
                        </Button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Estilos adicionales */}
      <style jsx global>{`
        .react-grid-item.react-grid-placeholder {
          background: rgb(59 130 246 / 0.2);
          border: 2px dashed rgb(59 130 246);
          border-radius: 0.5rem;
        }
        .react-grid-item > .react-resizable-handle {
          background: transparent;
        }
        .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid rgba(0, 0, 0, 0.3);
          border-bottom: 2px solid rgba(0, 0, 0, 0.3);
        }
        .widget-container {
          height: 100%;
        }
        .widget-container > div {
          height: 100%;
        }
        .widget-container > div > div {
          height: 100%;
        }
      `}</style>
    </div>
  )
}
