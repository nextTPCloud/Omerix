'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { proyectosService } from '@/services/proyectos.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FolderKanban,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  BarChart3,
  Kanban,
  GanttChart,
  GripVertical,
  Calendar,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ESTADOS_PROYECTO,
  getEstadoConfig,
  EstadoProyecto,
} from '@/types/proyecto.types'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ============================================
// COLORES POR ESTADO
// ============================================

const ESTADO_COLORES: Record<string, string> = {
  borrador: '#9ca3af',
  planificacion: '#3b82f6',
  en_curso: '#22c55e',
  pausado: '#eab308',
  completado: '#10b981',
  cancelado: '#ef4444',
  cerrado: '#64748b',
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// ============================================
// COMPONENTE KANBAN CARD
// ============================================

function KanbanCard({ proyecto, onDragEnd }: { proyecto: any; onDragEnd?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proyecto._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const clienteNombre = typeof proyecto.clienteId === 'object'
    ? proyecto.clienteId?.nombreComercial || proyecto.clienteId?.nombre || '-'
    : '-'

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="p-3 mb-2 cursor-default hover:shadow-md transition-shadow">
        <div className="flex items-start gap-2">
          <button {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <Link href={`/proyectos/${proyecto._id}`} className="font-medium text-sm hover:underline truncate block">
              {proyecto.nombre}
            </Link>
            <p className="text-xs text-muted-foreground truncate">{proyecto.codigo} - {clienteNombre}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${proyecto.progreso || 0}%` }}
                />
              </div>
              <span className="text-xs font-medium">{proyecto.progreso || 0}%</span>
            </div>
            {proyecto.fechaFinPrevista && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(proyecto.fechaFinPrevista).toLocaleDateString('es-ES')}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================
// COMPONENTE KANBAN COLUMN
// ============================================

function KanbanColumn({
  estado,
  proyectos,
  color,
}: {
  estado: { value: string; label: string; color: string }
  proyectos: any[]
  color: string
}) {
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="font-semibold text-sm">{estado.label}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">{proyectos.length}</Badge>
      </div>
      <div className="bg-muted/30 rounded-lg p-2 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto">
        <SortableContext items={proyectos.map(p => p._id)} strategy={verticalListSortingStrategy}>
          {proyectos.map((proyecto) => (
            <KanbanCard key={proyecto._id} proyecto={proyecto} />
          ))}
        </SortableContext>
        {proyectos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Sin proyectos</p>
        )}
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE TIMELINE / GANTT
// ============================================

function TimelineView({ proyectos }: { proyectos: any[] }) {
  const now = new Date()
  const today = now.getTime()

  // Calcular rango de fechas (6 meses antes y 6 despues)
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 9, 0)
  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))

  // Generar meses para el eje
  const months: { label: string; start: number; width: number }[] = []
  let current = new Date(rangeStart)
  while (current < rangeEnd) {
    const monthStart = Math.max(0, Math.ceil((current.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)))
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    const monthEnd = Math.min(totalDays, monthStart + daysInMonth)
    months.push({
      label: `${MESES[current.getMonth()]} ${current.getFullYear()}`,
      start: (monthStart / totalDays) * 100,
      width: ((monthEnd - monthStart) / totalDays) * 100,
    })
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
  }

  // Posicion de hoy
  const todayPos = ((today - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100

  // Filtrar proyectos con fechas
  const proyectosConFechas = proyectos.filter(p => p.fechaInicio)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header con meses */}
        <div className="flex border-b relative h-8">
          {months.map((month, i) => (
            <div
              key={i}
              className="text-xs font-medium text-muted-foreground flex items-center justify-center border-r"
              style={{ position: 'absolute', left: `${month.start}%`, width: `${month.width}%` }}
            >
              {month.label}
            </div>
          ))}
        </div>

        {/* Linea de hoy */}
        <div className="relative">
          {todayPos >= 0 && todayPos <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${todayPos}%` }}
            >
              <div className="absolute -top-5 -left-3 bg-red-500 text-white text-[10px] px-1 rounded">Hoy</div>
            </div>
          )}

          {/* Filas de proyectos */}
          {proyectosConFechas.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay proyectos con fechas asignadas
            </div>
          ) : (
            proyectosConFechas.map((proyecto, idx) => {
              const start = new Date(proyecto.fechaInicio).getTime()
              const end = proyecto.fechaFinPrevista
                ? new Date(proyecto.fechaFinPrevista).getTime()
                : start + 30 * 24 * 60 * 60 * 1000 // +30 dias si no hay fecha fin

              const left = Math.max(0, ((start - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100)
              const right = Math.min(100, ((end - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100)
              const width = Math.max(1, right - left)
              const color = ESTADO_COLORES[proyecto.estado] || '#6b7280'

              return (
                <div key={proyecto._id} className={`flex items-center h-10 ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                  <div className="w-48 flex-shrink-0 px-2 truncate text-xs font-medium">
                    <Link href={`/proyectos/${proyecto._id}`} className="hover:underline">
                      {proyecto.nombre}
                    </Link>
                  </div>
                  <div className="flex-1 relative h-full flex items-center">
                    <div
                      className="absolute h-5 rounded-md cursor-pointer hover:opacity-80 transition-opacity flex items-center px-1.5"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: color,
                        minWidth: '20px',
                      }}
                      title={`${proyecto.nombre}: ${new Date(proyecto.fechaInicio).toLocaleDateString('es-ES')} - ${proyecto.fechaFinPrevista ? new Date(proyecto.fechaFinPrevista).toLocaleDateString('es-ES') : 'Sin fecha fin'}`}
                    >
                      <span className="text-white text-[10px] truncate">{proyecto.progreso || 0}%</span>
                    </div>
                    {/* Hitos como diamantes */}
                    {proyecto.hitos?.map((hito: any, hIdx: number) => {
                      if (!hito.fechaPrevista) return null
                      const hitoDate = new Date(hito.fechaPrevista).getTime()
                      const hitoPos = ((hitoDate - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100
                      if (hitoPos < 0 || hitoPos > 100) return null
                      return (
                        <div
                          key={hIdx}
                          className="absolute w-2.5 h-2.5 rotate-45 z-20"
                          style={{
                            left: `${hitoPos}%`,
                            backgroundColor: hito.completado ? '#10b981' : '#f59e0b',
                            marginLeft: '-5px',
                          }}
                          title={`${hito.nombre} - ${new Date(hito.fechaPrevista).toLocaleDateString('es-ES')}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// PAGINA PRINCIPAL
// ============================================

export default function ProyectosDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [kanbanProyectos, setKanbanProyectos] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('kpis')

  const cargarDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const [dashRes, listRes] = await Promise.all([
        proyectosService.getDashboard(),
        proyectosService.getAll({ limit: 200, activo: 'true' as any }),
      ])

      if (dashRes.success) {
        setDashboardData(dashRes.data)
      }

      if (listRes.success) {
        setKanbanProyectos(listRes.data || [])
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error)
      toast.error('Error al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDashboard()
  }, [cargarDashboard])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Kanban: manejar drag & drop entre columnas
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Encontrar proyecto y nuevo estado
    const proyecto = kanbanProyectos.find(p => p._id === active.id)
    if (!proyecto) return

    // Determinar columna destino buscando el proyecto over
    const targetProyecto = kanbanProyectos.find(p => p._id === over.id)
    if (targetProyecto && targetProyecto.estado !== proyecto.estado) {
      try {
        await proyectosService.cambiarEstado(String(active.id), targetProyecto.estado)
        setKanbanProyectos(prev =>
          prev.map(p => p._id === active.id ? { ...p, estado: targetProyecto.estado } : p)
        )
        toast.success(`Proyecto movido a ${getEstadoConfig(targetProyecto.estado).label}`)
      } catch {
        toast.error('Error al cambiar estado')
      }
    }
  }, [kanbanProyectos])

  // Datos para graficos
  const pieData = dashboardData?.distribucionEstado?.map((d: any) => ({
    name: getEstadoConfig(d.estado)?.label || d.estado,
    value: d.count,
    fill: ESTADO_COLORES[d.estado] || '#6b7280',
  })) || []

  const barData = dashboardData?.proyectosPorMes?.map((d: any) => ({
    name: `${MESES[d.month - 1]} ${d.year}`,
    proyectos: d.count,
  })) || []

  // Kanban columns
  const kanbanEstados = [
    EstadoProyecto.PLANIFICACION,
    EstadoProyecto.EN_CURSO,
    EstadoProyecto.PAUSADO,
    EstadoProyecto.COMPLETADO,
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const kpis = dashboardData?.kpis || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/proyectos')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FolderKanban className="h-7 w-7 text-primary" />
                Dashboard de Proyectos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Vista general de todos los proyectos
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={cargarDashboard}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kpis" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <Kanban className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <GanttChart className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* TAB: KPIs */}
        <TabsContent value="kpis" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FolderKanban className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Proyectos</p>
                  <p className="text-2xl font-bold">{kpis.total || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">En Curso</p>
                  <p className="text-2xl font-bold">{kpis.enCurso || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Completados</p>
                  <p className="text-2xl font-bold">{kpis.completados || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Progreso Medio</p>
                  <p className="text-2xl font-bold">{kpis.progresoPromedio || 0}%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Financiero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Presupuesto Total</p>
              </div>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(kpis.presupuestoTotal || 0)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Coste Real</p>
              </div>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(kpis.costeTotal || 0)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Margen</p>
              </div>
              <p className={`text-xl font-bold ${(kpis.margen || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(kpis.margen || 0)}
              </p>
            </Card>
          </div>

          {/* Horas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Horas Estimadas</p>
              </div>
              <p className="text-xl font-bold">{(kpis.horasEstimadas || 0).toLocaleString('es-ES')}h</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Horas Reales</p>
              </div>
              <p className="text-xl font-bold">{(kpis.horasReales || 0).toLocaleString('es-ES')}h</p>
            </Card>
          </div>

          {/* Graficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribucion por estado (Dona) */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Distribucion por Estado</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  Sin datos disponibles
                </div>
              )}
            </Card>

            {/* Proyectos por mes (Barras) */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Proyectos por Mes</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="proyectos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  Sin datos disponibles
                </div>
              )}
            </Card>
          </div>

          {/* Proyectos recientes */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Proyectos Recientes</h3>
            <div className="space-y-3">
              {(dashboardData?.proyectosRecientes || []).map((proyecto: any) => {
                const estadoConfig = getEstadoConfig(proyecto.estado)
                const clienteNombre = typeof proyecto.clienteId === 'object'
                  ? proyecto.clienteId?.nombreComercial || proyecto.clienteId?.nombre || '-'
                  : '-'

                return (
                  <div key={proyecto._id} className="flex items-center gap-4 py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <Link href={`/proyectos/${proyecto._id}`} className="font-medium text-sm hover:underline">
                        {proyecto.codigo} - {proyecto.nombre}
                      </Link>
                      <p className="text-xs text-muted-foreground">{clienteNombre}</p>
                    </div>
                    <Badge className={`text-xs ${estadoConfig.color}`}>
                      {estadoConfig.label}
                    </Badge>
                    <div className="w-24 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${proyecto.progreso || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{proyecto.progreso || 0}%</span>
                    </div>
                  </div>
                )
              })}
              {(!dashboardData?.proyectosRecientes || dashboardData.proyectosRecientes.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No hay proyectos recientes</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB: KANBAN */}
        <TabsContent value="kanban">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {kanbanEstados.map((estado) => {
                const estadoConfig = ESTADOS_PROYECTO.find(e => e.value === estado)!
                const proyectosEstado = kanbanProyectos.filter(p => p.estado === estado)
                return (
                  <KanbanColumn
                    key={estado}
                    estado={estadoConfig}
                    proyectos={proyectosEstado}
                    color={ESTADO_COLORES[estado]}
                  />
                )
              })}
            </div>
          </DndContext>
        </TabsContent>

        {/* TAB: TIMELINE */}
        <TabsContent value="timeline">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Timeline de Proyectos</h3>
            <TimelineView proyectos={kanbanProyectos} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
