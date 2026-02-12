'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  tareasService,
  Tarea,
  EstadoTarea,
  PrioridadTarea,
  TipoTarea,
  EstadisticasTareas,
} from '@/services/tareas.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Briefcase,
  Play,
  Pause,
  XCircle,
  Check,
  Filter,
  ListTodo,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, cn } from '@/lib/utils'

// ============================================
// CONSTANTES
// ============================================

const ESTADOS = [
  { value: EstadoTarea.PENDIENTE, label: 'Pendiente' },
  { value: EstadoTarea.EN_PROGRESO, label: 'En Progreso' },
  { value: EstadoTarea.COMPLETADA, label: 'Completada' },
  { value: EstadoTarea.CANCELADA, label: 'Cancelada' },
  { value: EstadoTarea.VENCIDA, label: 'Vencida' },
]

const PRIORIDADES = [
  { value: PrioridadTarea.BAJA, label: 'Baja' },
  { value: PrioridadTarea.NORMAL, label: 'Normal' },
  { value: PrioridadTarea.ALTA, label: 'Alta' },
  { value: PrioridadTarea.URGENTE, label: 'Urgente' },
]

const TIPOS = [
  { value: TipoTarea.GENERAL, label: 'General' },
  { value: TipoTarea.RECORDATORIO, label: 'Recordatorio' },
  { value: TipoTarea.SEGUIMIENTO_CLIENTE, label: 'Seguimiento cliente' },
  { value: TipoTarea.SEGUIMIENTO_PROVEEDOR, label: 'Seguimiento proveedor' },
  { value: TipoTarea.COBRO, label: 'Cobro' },
  { value: TipoTarea.PAGO, label: 'Pago' },
  { value: TipoTarea.LLAMADA, label: 'Llamada' },
  { value: TipoTarea.REUNION, label: 'Reunion' },
  { value: TipoTarea.VISITA, label: 'Visita' },
  { value: TipoTarea.REVISION, label: 'Revision' },
  { value: TipoTarea.MANTENIMIENTO, label: 'Mantenimiento' },
  { value: TipoTarea.INVENTARIO, label: 'Inventario' },
  { value: TipoTarea.ENTREGA, label: 'Entrega' },
  { value: TipoTarea.OTRO, label: 'Otro' },
]

// ============================================
// HELPERS
// ============================================

function getEstadoColor(estado: EstadoTarea): string {
  switch (estado) {
    case EstadoTarea.PENDIENTE:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case EstadoTarea.EN_PROGRESO:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case EstadoTarea.COMPLETADA:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case EstadoTarea.CANCELADA:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    case EstadoTarea.VENCIDA:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPrioridadColor(prioridad: PrioridadTarea): string {
  switch (prioridad) {
    case PrioridadTarea.BAJA:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    case PrioridadTarea.NORMAL:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case PrioridadTarea.ALTA:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case PrioridadTarea.URGENTE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getVencimientoInfo(tarea: Tarea) {
  if (!tarea.fechaVencimiento) return null

  const fechaVenc = new Date(tarea.fechaVencimiento)
  const ahora = new Date()
  const diffDays = Math.ceil((fechaVenc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))

  if (tarea.estado === EstadoTarea.COMPLETADA || tarea.estado === EstadoTarea.CANCELADA) {
    return { text: formatDate(tarea.fechaVencimiento), class: 'text-gray-500' }
  }

  if (diffDays < 0) {
    return { text: `Vencida hace ${Math.abs(diffDays)} dias`, class: 'text-red-600 font-medium' }
  } else if (diffDays === 0) {
    return { text: 'Vence hoy', class: 'text-orange-600 font-medium' }
  } else if (diffDays === 1) {
    return { text: 'Vence manana', class: 'text-amber-600' }
  } else if (diffDays <= 7) {
    return { text: `En ${diffDays} dias`, class: 'text-blue-600' }
  }
  return { text: formatDate(tarea.fechaVencimiento), class: 'text-gray-600' }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function TareasPage() {
  const router = useRouter()

  // Estados de datos
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadisticas, setEstadisticas] = useState<EstadisticasTareas | null>(null)
  const [showStats, setShowStats] = useState(true)

  // Seleccion multiple
  const [selectedTareas, setSelectedTareas] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 25,
    sortBy: 'fechaVencimiento',
    sortOrder: 'asc',
    estado: '',
    prioridad: '',
    tipo: '',
    misTareas: false,
  })

  // Paginacion
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Dialogos
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tareaToDelete, setTareaToDelete] = useState<string | null>(null)

  // ============================================
  // CARGAR DATOS
  // ============================================

  const cargarTareas = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }

      if (searchTerm) params.q = searchTerm
      if (filters.estado) params.estado = filters.estado
      if (filters.prioridad) params.prioridad = filters.prioridad
      if (filters.tipo) params.tipo = filters.tipo
      if (filters.misTareas) params.misTareas = true
      if (filters.vencidas) params.vencidas = true
      if (filters.hoy) params.hoy = true
      if (filters.semana) params.semana = true

      const response = await tareasService.listar(params)

      if (response.success) {
        setTareas(response.data)
        setTotalPages(response.pagination.totalPages)
        setTotalItems(response.pagination.total)
      }
    } catch (error) {
      console.error('Error cargando tareas:', error)
      toast.error('Error al cargar las tareas')
    } finally {
      setIsLoading(false)
    }
  }, [filters, searchTerm])

  const cargarEstadisticas = useCallback(async () => {
    try {
      const response = await tareasService.estadisticas()
      if (response.success) {
        setEstadisticas(response.data)
      }
    } catch (error) {
      console.error('Error cargando estadisticas:', error)
    }
  }, [])

  useEffect(() => {
    cargarTareas()
  }, [cargarTareas])

  useEffect(() => {
    cargarEstadisticas()
  }, [cargarEstadisticas])

  // ============================================
  // HANDLERS
  // ============================================

  const handleSort = (key: string) => {
    setFilters((prev: any) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev: any) => ({ ...prev, page: newPage }))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedTareas(tareas.map((t) => t._id))
    } else {
      setSelectedTareas([])
    }
  }

  const handleSelectTarea = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTareas((prev) => [...prev, id])
    } else {
      setSelectedTareas((prev) => prev.filter((i) => i !== id))
      setSelectAll(false)
    }
  }

  const handleDelete = async () => {
    if (!tareaToDelete) return

    try {
      await tareasService.eliminar(tareaToDelete)
      toast.success('Tarea eliminada')
      cargarTareas()
      cargarEstadisticas()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setDeleteDialogOpen(false)
      setTareaToDelete(null)
    }
  }

  const handleCambiarEstado = async (id: string, estado: EstadoTarea) => {
    try {
      await tareasService.cambiarEstado(id, { estado })
      toast.success(`Estado cambiado a ${tareasService.getEstadoLabel(estado)}`)
      cargarTareas()
      cargarEstadisticas()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const handleCompletarRapido = async (tarea: Tarea, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await tareasService.cambiarEstado(tarea._id, { estado: EstadoTarea.COMPLETADA })
      toast.success('Tarea completada')
      cargarTareas()
      cargarEstadisticas()
    } catch (error) {
      toast.error('Error al completar la tarea')
    }
  }

  const handleQuickFilter = (filterType: string) => {
    setFilters((prev: any) => {
      const newFilters = { ...prev, page: 1, vencidas: false, hoy: false, semana: false }

      switch (filterType) {
        case 'pendientes':
          return { ...newFilters, estado: EstadoTarea.PENDIENTE }
        case 'enProgreso':
          return { ...newFilters, estado: EstadoTarea.EN_PROGRESO }
        case 'vencidas':
          return { ...newFilters, estado: '', vencidas: true }
        case 'hoy':
          return { ...newFilters, estado: '', hoy: true }
        case 'semana':
          return { ...newFilters, estado: '', semana: true }
        case 'urgentes':
          return { ...newFilters, estado: '', prioridad: PrioridadTarea.URGENTE }
        case 'todas':
        default:
          return { ...newFilters, estado: '', prioridad: '', tipo: '' }
      }
    })
  }

  // ============================================
  // RENDER
  // ============================================

  const SortIcon = ({ column }: { column: string }) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return filters.sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  return (
    
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tareas</h1>
            <p className="text-muted-foreground">
              Gestion de tareas y recordatorios
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                cargarTareas()
                cargarEstadisticas()
              }}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Actualizar
            </Button>
            <Button onClick={() => router.push('/tareas/nuevo')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </div>

        {/* Estadisticas */}
        {showStats && estadisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleQuickFilter('pendientes')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{estadisticas.pendientes}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleQuickFilter('enProgreso')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Play className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{estadisticas.enProgreso}</p>
                    <p className="text-xs text-muted-foreground">En Progreso</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleQuickFilter('hoy')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{estadisticas.paraHoy}</p>
                    <p className="text-xs text-muted-foreground">Para Hoy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleQuickFilter('semana')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{estadisticas.paraSemana}</p>
                    <p className="text-xs text-muted-foreground">Esta Semana</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleQuickFilter('vencidas')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{estadisticas.vencidas}</p>
                    <p className="text-xs text-muted-foreground">Vencidas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleQuickFilter('urgentes')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{estadisticas.urgentes}</p>
                    <p className="text-xs text-muted-foreground">Urgentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{estadisticas.completadasHoy}</p>
                    <p className="text-xs text-muted-foreground">Hoy Completadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tareas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filters.estado || 'all'}
                onValueChange={(value) =>
                  setFilters((prev: any) => ({
                    ...prev,
                    estado: value === 'all' ? '' : value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.prioridad || 'all'}
                onValueChange={(value) =>
                  setFilters((prev: any) => ({
                    ...prev,
                    prioridad: value === 'all' ? '' : value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.tipo || 'all'}
                onValueChange={(value) =>
                  setFilters((prev: any) => ({
                    ...prev,
                    tipo: value === 'all' ? '' : value,
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={filters.misTareas ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setFilters((prev: any) => ({
                    ...prev,
                    misTareas: !prev.misTareas,
                    page: 1,
                  }))
                }
              >
                <User className="h-4 w-4 mr-2" />
                Mis Tareas
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickFilter('todas')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 w-10"></th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('titulo')}
                    >
                      <div className="flex items-center gap-2">
                        Titulo
                        <SortIcon column="titulo" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('tipo')}
                    >
                      <div className="flex items-center gap-2">
                        Tipo
                        <SortIcon column="tipo" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('prioridad')}
                    >
                      <div className="flex items-center gap-2">
                        Prioridad
                        <SortIcon column="prioridad" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('estado')}
                    >
                      <div className="flex items-center gap-2">
                        Estado
                        <SortIcon column="estado" />
                      </div>
                    </th>
                    <th
                      className="p-3 text-left cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('fechaVencimiento')}
                    >
                      <div className="flex items-center gap-2">
                        Vencimiento
                        <SortIcon column="fechaVencimiento" />
                      </div>
                    </th>
                    <th className="p-3 text-left">Asignado</th>
                    <th className="p-3 text-left">Cliente</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </td>
                    </tr>
                  ) : tareas.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No hay tareas que mostrar</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => router.push('/tareas/nuevo')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear primera tarea
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    tareas.map((tarea) => {
                      const vencInfo = getVencimientoInfo(tarea)
                      const isCompleted = tarea.estado === EstadoTarea.COMPLETADA
                      const isVencida = tareasService.isVencida(tarea)

                      return (
                        <tr
                          key={tarea._id}
                          className={cn(
                            'border-b hover:bg-muted/50 cursor-pointer transition-colors',
                            isCompleted && 'opacity-60',
                            isVencida && 'bg-red-50/50 dark:bg-red-950/20'
                          )}
                          onClick={() => router.push(`/tareas/${tarea._id}`)}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedTareas.includes(tarea._id)}
                              onCheckedChange={(checked) =>
                                handleSelectTarea(tarea._id, checked as boolean)
                              }
                            />
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isCompleted}
                              disabled={isCompleted}
                              onClick={(e) => handleCompletarRapido(tarea, e as any)}
                              className={cn(
                                'rounded-full',
                                isCompleted && 'bg-green-500 border-green-500'
                              )}
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className={cn(
                                'font-medium',
                                isCompleted && 'line-through text-muted-foreground'
                              )}>
                                {tarea.titulo}
                              </span>
                              {tarea.descripcion && (
                                <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                                  {tarea.descripcion}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {tareasService.getTipoLabel(tarea.tipo)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={cn(getPrioridadColor(tarea.prioridad))}>
                              {tareasService.getPrioridadLabel(tarea.prioridad)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={cn(getEstadoColor(tarea.estado))}>
                              {tareasService.getEstadoLabel(tarea.estado)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {vencInfo && (
                              <span className={vencInfo.class}>{vencInfo.text}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {tarea.asignadoANombre && (
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3" />
                                {tarea.asignadoANombre}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {tarea.clienteNombre && (
                              <span className="text-sm truncate max-w-[150px] block">
                                {tarea.clienteNombre}
                              </span>
                            )}
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => router.push(`/tareas/${tarea._id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/tareas/${tarea._id}?edit=true`)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">
                                  Cambiar estado
                                </DropdownMenuLabel>
                                {tarea.estado !== EstadoTarea.EN_PROGRESO && (
                                  <DropdownMenuItem
                                    onClick={() => handleCambiarEstado(tarea._id, EstadoTarea.EN_PROGRESO)}
                                  >
                                    <Play className="h-4 w-4 mr-2 text-blue-500" />
                                    En Progreso
                                  </DropdownMenuItem>
                                )}
                                {tarea.estado !== EstadoTarea.COMPLETADA && (
                                  <DropdownMenuItem
                                    onClick={() => handleCambiarEstado(tarea._id, EstadoTarea.COMPLETADA)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                                    Completar
                                  </DropdownMenuItem>
                                )}
                                {tarea.estado !== EstadoTarea.CANCELADA && (
                                  <DropdownMenuItem
                                    onClick={() => handleCambiarEstado(tarea._id, EstadoTarea.CANCELADA)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                                    Cancelar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setTareaToDelete(tarea._id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginacion */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(filters.page - 1) * filters.limit + 1} a{' '}
                  {Math.min(filters.page * filters.limit, totalItems)} de {totalItems}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={filters.page === 1}
                    onClick={() => handlePageChange(1)}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={filters.page === 1}
                    onClick={() => handlePageChange(filters.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    Pagina {filters.page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={filters.page === totalPages}
                    onClick={() => handlePageChange(filters.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={filters.page === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de confirmacion eliminar */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Tarea</DialogTitle>
              <DialogDescription>
                Esta accion no se puede deshacer. ¿Estas seguro de que deseas eliminar esta tarea?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
