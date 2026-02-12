'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { reservasService, Reserva, EstadoReserva } from '@/services/reservas.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenuCheckboxItem,
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
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Phone,
  Users,
  Clock,
  Check,
  Play,
  XCircle,
  UserX,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'
import { usePermissions } from '@/hooks/usePermissions'
import { SearchableSelect } from '@/components/ui/searchable-select'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

interface ColumnFilters {
  [key: string]: string
}

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'fecha', visible: true, orden: 0 },
    { key: 'hora', visible: true, orden: 1 },
    { key: 'cliente', visible: true, orden: 2 },
    { key: 'telefono', visible: true, orden: 3 },
    { key: 'comensales', visible: true, orden: 4 },
    { key: 'estado', visible: true, orden: 5 },
    { key: 'origen', visible: true, orden: 6 },
  ] as ColumnaConfig[],
  sortConfig: { key: 'fecha', direction: 'desc' as const },
  columnFilters: {},
  paginacion: { limit: 25 as const },
  densidad: 'normal' as const,
}

export default function ReservasPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  const [reservas, setReservas] = useState<Reserva[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'fecha',
    sortOrder: 'desc' as 'asc' | 'desc',
    estado: undefined as EstadoReserva | undefined,
    fecha: undefined as string | undefined,
  })

  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [showStats, setShowStats] = useState(true)
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[]; nombres: string[] }>({
    open: false, ids: [], nombres: []
  })

  const [columnasDisponibles] = useState([
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'hora', label: 'Hora', sortable: true },
    { key: 'cliente', label: 'Cliente', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: false },
    { key: 'comensales', label: 'Comensales', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'origen', label: 'Origen', sortable: true },
  ])

  const {
    config: moduleConfig,
    isLoading: isLoadingConfig,
    updateColumnas,
    updateSortConfig,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('reservas', DEFAULT_CONFIG, { autoSave: true, debounceMs: 1000 })

  const columnasVisibles = useMemo(() => {
    if (!moduleConfig) return []
    return moduleConfig.columnas.filter((col) => col.visible).sort((a, b) => a.orden - b.orden).map((col) => col.key)
  }, [moduleConfig])

  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_CONFIG.sortConfig, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || 'normal', [moduleConfig])
  const densityClasses = useDensityClasses(densidad)

  const stats = useMemo(() => {
    if (!estadisticas) return { total: 0, confirmadas: 0, completadas: 0, canceladas: 0, tasaCancelacion: 0 }
    return {
      total: estadisticas.total || 0,
      confirmadas: estadisticas.confirmadas || 0,
      completadas: estadisticas.completadas || 0,
      canceladas: estadisticas.canceladas || 0,
      tasaCancelacion: estadisticas.tasaCancelacion || 0,
    }
  }, [estadisticas])

  const cargarReservas = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = { page: filters.page, limit: filters.limit }
      if (filters.estado) params.estado = filters.estado
      if (filters.fecha) params.fecha = filters.fecha

      const [reservasRes, estadisticasRes] = await Promise.all([
        reservasService.getAll(params),
        reservasService.getEstadisticas(),
      ])

      if (reservasRes.success) {
        setReservas(reservasRes.data || [])
        const pag = reservasRes.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      }
      if (estadisticasRes.success) {
        setEstadisticas(estadisticasRes.data)
      }
    } catch (error) {
      setReservas([])
      toast.error('Error al cargar las reservas')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { cargarReservas() }, [cargarReservas])

  useEffect(() => {
    const combinedFilters: any = {
      page: 1,
      limit: moduleConfig?.paginacion?.limit || 25,
    }

    if (debouncedColumnFilters.cliente) combinedFilters.busqueda = debouncedColumnFilters.cliente
    if (debouncedColumnFilters.estado && debouncedColumnFilters.estado !== 'all') {
      combinedFilters.estado = debouncedColumnFilters.estado
    }
    if (debouncedColumnFilters.fecha) {
      combinedFilters.fecha = debouncedColumnFilters.fecha
    }

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, moduleConfig?.paginacion?.limit])

  useEffect(() => {
    if (!moduleConfig || isLoadingConfig || !isInitialLoad.current) return
    const initialFilters = moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0
      ? moduleConfig.columnFilters : {}
    setColumnFiltersInput(initialFilters as any)
    isInitialLoad.current = false
  }, [moduleConfig, isLoadingConfig])

  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    updateSortConfig({ key, direction })
  }

  const getSortIcon = (column: string) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    return sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
  }

  const handleColumnFilterInput = (column: string, value: string) => {
    const newFilters = { ...columnFiltersInput }
    if (value === '' || value === 'all') delete newFilters[column]
    else newFilters[column] = value
    setColumnFiltersInput(newFilters)
  }

  const handleSelectAll = () => {
    setSelectedItems(selectAll ? [] : reservas.map(e => e._id))
    setSelectAll(!selectAll)
  }

  const handleSelect = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleDeleteConfirm = async () => {
    try {
      await Promise.all(deleteDialog.ids.map(id => reservasService.delete(id)))
      toast.success('Reserva(s) eliminada(s) correctamente')
      cargarReservas()
      setSelectedItems([])
      setSelectAll(false)
      setDeleteDialog({ open: false, ids: [], nombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleEstadoAction = async (id: string, action: 'confirmar' | 'iniciar' | 'completar' | 'cancelar' | 'no_show') => {
    try {
      switch (action) {
        case 'confirmar':
          await reservasService.confirmar(id)
          toast.success('Reserva confirmada')
          break
        case 'iniciar':
          await reservasService.iniciar(id)
          toast.success('Reserva iniciada')
          break
        case 'completar':
          await reservasService.completar(id)
          toast.success('Reserva completada')
          break
        case 'cancelar':
          const motivo = prompt('Motivo de cancelación:')
          if (motivo !== null) {
            await reservasService.cancelar(id, motivo)
            toast.success('Reserva cancelada')
          }
          break
        case 'no_show':
          if (confirm('¿Marcar como no-show?')) {
            await reservasService.marcarNoShow(id)
            toast.success('Marcada como no-show')
          }
          break
      }
      cargarReservas()
    } catch (error) {
      toast.error('Error al ejecutar acción')
    }
  }

  const handleDuplicar = async (reserva: Reserva) => {
    try {
      const duplicado = {
        clienteNombre: reserva.clienteNombre,
        clienteTelefono: reserva.clienteTelefono,
        clienteEmail: reserva.clienteEmail,
        fecha: reserva.fecha.split('T')[0],
        horaInicio: reserva.horaInicio,
        duracionMinutos: reserva.duracionMinutos,
        comensales: reserva.comensales,
        origen: reserva.origen,
        notas: reserva.notas,
        ocasionEspecial: reserva.ocasionEspecial,
      }
      await reservasService.create(duplicado)
      toast.success('Reserva duplicada correctamente')
      cargarReservas()
    } catch (error) {
      toast.error('Error al duplicar la reserva')
    }
  }

  const handleAction = async (id: string, action: string) => {
    const reserva = reservas.find(e => e._id === id)
    switch (action) {
      case 'view':
        router.push(`/reservas/${id}`)
        break
      case 'edit':
        router.push(`/reservas/${id}`)
        break
      case 'duplicate':
        if (reserva) handleDuplicar(reserva)
        break
      case 'delete':
        if (reserva) setDeleteDialog({ open: true, ids: [id], nombres: [reserva.clienteNombre] })
        break
    }
  }

  const toggleColumna = (key: string) => {
    if (!moduleConfig) return
    const newColumnas = moduleConfig.columnas.map((col) => {
      if (col.key === key) {
        const visibleCount = moduleConfig.columnas.filter((c) => c.visible).length
        if (col.visible && visibleCount <= 1) {
          toast.warning('Debe haber al menos una columna visible')
          return col
        }
        return { ...col, visible: !col.visible }
      }
      return col
    })
    updateColumnas(newColumnas)
  }

  const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (isLoadingConfig) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-7 w-7 text-primary" />
              Reservas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona las reservas de mesas</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Eye className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={cargarReservas}>
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            {canCreate('reservas') && (
              <Button asChild size="sm">
                <Link href="/reservas/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nueva Reserva</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Confirmadas</p>
                  <p className="text-xl font-bold">{stats.confirmadas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-gray-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Completadas</p>
                  <p className="text-xl font-bold">{stats.completadas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Canceladas</p>
                  <p className="text-xl font-bold">{stats.canceladas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Tasa Cancel.</p>
                  <p className="text-xl font-bold">{stats.tasaCancelacion}%</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              value={columnFiltersInput.cliente || ''}
              onChange={(e) => handleColumnFilterInput('cliente', e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Input
              type="date"
              value={columnFiltersInput.fecha || ''}
              onChange={(e) => handleColumnFilterInput('fecha', e.target.value)}
              className="w-[150px]"
            />

            <SearchableSelect
              value={columnFiltersInput.estado || 'all'}
              onValueChange={(value) => handleColumnFilterInput('estado', value)}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'pendiente', label: 'Pendiente' },
                { value: 'confirmada', label: 'Confirmada' },
                { value: 'en_curso', label: 'En curso' },
                { value: 'completada', label: 'Completada' },
                { value: 'cancelada', label: 'Cancelada' },
                { value: 'no_show', label: 'No show' },
              ]}
              placeholder="Estado"
              searchPlaceholder="Buscar..."
              emptyMessage="Sin resultados"
              className="w-[130px]"
            />

            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(d) => { updateDensidad(d); toast.success(`Densidad cambiada a ${d}`) }}
              modulo="reservas"
              configuracionActual={moduleConfig}
              onAplicarVista={() => {}}
              onGuardarVista={async () => {}}
              onRestablecer={async () => { await resetConfig(); toast.success('Configuración restablecida') }}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="h-4 w-4 sm:mr-2 shrink-0" />
                  <span className="hidden sm:inline">Columnas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columnasDisponibles.map((columna) => (
                  <DropdownMenuCheckboxItem key={columna.key} checked={columnasVisibles.includes(columna.key)} onCheckedChange={() => toggleColumna(columna.key)}>
                    {columna.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <ExportButton data={reservas} columns={columnasDisponibles.filter((col) => columnasVisibles.includes(col.key)).map((col) => ({ key: col.key, label: col.label }))} filename="reservas" stats={[{ label: 'Total', value: stats.total }]} />
            <PrintButton data={reservas} columns={columnasDisponibles.filter((col) => columnasVisibles.includes(col.key)).map((col) => ({ key: col.key, label: col.label }))} title="Reservas" stats={[{ label: 'Total', value: stats.total }]} filters={columnFiltersInput} />
          </div>
        </div>

        {/* TABLA */}
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className={`${densityClasses.header} sticky left-0 z-30 bg-muted/50 backdrop-blur-sm text-left w-10`}>
                    <div className="flex items-center justify-center">
                      <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                    </div>
                  </th>

                  {columnasVisibles.includes('fecha') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button onClick={() => handleSort('fecha')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Fecha {getSortIcon('fecha')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('hora') && (
                    <th className={`${densityClasses.header} text-left w-[80px]`}>
                      <button onClick={() => handleSort('horaInicio')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Hora {getSortIcon('horaInicio')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('cliente') && (
                    <th className={`${densityClasses.header} text-left`}>
                      <button onClick={() => handleSort('clienteNombre')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Cliente {getSortIcon('clienteNombre')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('telefono') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Teléfono</span>
                    </th>
                  )}

                  {columnasVisibles.includes('comensales') && (
                    <th className={`${densityClasses.header} text-center w-[80px]`}>
                      <button onClick={() => handleSort('comensales')} className="flex items-center justify-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        <Users className="h-3 w-3 mr-1" /> {getSortIcon('comensales')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('estado') && (
                    <th className={`${densityClasses.header} text-left w-[110px]`}>
                      <button onClick={() => handleSort('estado')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Estado {getSortIcon('estado')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('origen') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Origen</span>
                    </th>
                  )}

                  <th className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 backdrop-blur-sm text-right min-w-[70px] text-xs font-semibold uppercase tracking-wider`}>
                    Acciones
                  </th>
                </tr>

                {/* FILTROS */}
                <tr className="border-b bg-card">
                  <th className="sticky left-0 z-30 bg-card px-3 py-1.5"></th>
                  {columnasVisibles.includes('fecha') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('hora') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('cliente') && (
                    <th className="px-3 py-1.5">
                      <Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.cliente || ''} onChange={(e) => handleColumnFilterInput('cliente', e.target.value)} />
                    </th>
                  )}
                  {columnasVisibles.includes('telefono') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('comensales') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('estado') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.estado || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('estado', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'pendiente', label: 'Pendiente' },
                          { value: 'confirmada', label: 'Confirmada' },
                          { value: 'en_curso', label: 'En curso' },
                          { value: 'completada', label: 'Completada' },
                        ]}
                      />
                    </th>
                  )}
                  {columnasVisibles.includes('origen') && <th className="px-3 py-1.5"></th>}
                  <th className="sticky right-0 z-30 bg-card px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Cargando reservas...
                  </td></tr>
                ) : reservas.length === 0 ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No se encontraron reservas</p>
                    <p className="text-xs mt-1">Crea una nueva reserva para empezar</p>
                  </td></tr>
                ) : (
                  reservas.map((reserva) => (
                    <tr key={reserva._id} className="hover:bg-muted/30 transition-colors group">
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-card group-hover:bg-muted/50 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox checked={selectedItems.includes(reserva._id)} onCheckedChange={() => handleSelect(reserva._id)} />
                        </div>
                      </td>

                      {columnasVisibles.includes('fecha') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {formatFecha(reserva.fecha)}
                        </td>
                      )}

                      {columnasVisibles.includes('hora') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          {reserva.horaInicio}
                        </td>
                      )}

                      {columnasVisibles.includes('cliente') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <div>
                            <span className="font-medium">{reserva.clienteNombre}</span>
                            {reserva.ocasionEspecial && (
                              <span className="ml-2 text-pink-500 text-xs">🎉 {reserva.ocasionEspecial}</span>
                            )}
                            {reserva.notas && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{reserva.notas}</p>
                            )}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('telefono') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {reserva.clienteTelefono}
                          </span>
                        </td>
                      )}

                      {columnasVisibles.includes('comensales') && (
                        <td className={`${densityClasses.cell} text-center`}>
                          <Badge variant="outline" className="font-medium">
                            {reserva.comensales}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('estado') && (
                        <td className={`${densityClasses.cell}`}>
                          <Badge
                            style={{
                              backgroundColor: `${reservasService.getEstadoColor(reserva.estado)}20`,
                              color: reservasService.getEstadoColor(reserva.estado),
                              borderColor: reservasService.getEstadoColor(reserva.estado),
                            }}
                            className="text-xs font-medium border"
                          >
                            {reservasService.getEstadoLabel(reserva.estado)}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('origen') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {reservasService.getOrigenLabel(reserva.origen)}
                        </td>
                      )}

                      <td className={`${densityClasses.cell} sticky right-0 z-20 bg-card group-hover:bg-muted/50 transition-colors text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Botones de acción rápida según estado */}
                          {reserva.estado === 'pendiente' && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600" onClick={() => handleEstadoAction(reserva._id, 'confirmar')} title="Confirmar">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {reserva.estado === 'confirmada' && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => handleEstadoAction(reserva._id, 'iniciar')} title="Cliente llegó">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {reserva.estado === 'en_curso' && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => handleEstadoAction(reserva._id, 'completar')} title="Completar">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleAction(reserva._id, 'view')}><Eye className="mr-2 h-4 w-4" />Ver</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(reserva._id, 'edit')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(reserva._id, 'duplicate')}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {['pendiente', 'confirmada'].includes(reserva.estado) && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEstadoAction(reserva._id, 'no_show')} className="text-orange-600">
                                    <UserX className="mr-2 h-4 w-4" />No show
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEstadoAction(reserva._id, 'cancelar')} className="text-red-600">
                                    <XCircle className="mr-2 h-4 w-4" />Cancelar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canDelete('reservas') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleAction(reserva._id, 'delete')}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PAGINACIÓN */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
                <TableSelect
                  value={pagination.limit.toString()}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, limit: Number(value), page: 1 }))}
                  options={[
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                  ]}
                />
                <span className="text-sm text-muted-foreground">de <span className="font-medium">{pagination.total}</span> registros</span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: 1 }))} disabled={pagination.page === 1} className="h-9 w-9 p-0"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.page === 1} className="h-9 w-9 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                {getPageNumbers(pagination.page, pagination.pages).map((pageNum, idx) => pageNum === '...' ? (
                  <div key={`ellipsis-${idx}`} className="h-9 w-9 flex items-center justify-center"><span className="text-muted-foreground">...</span></div>
                ) : (
                  <Button key={pageNum} variant={pagination.page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setFilters(prev => ({ ...prev, page: pageNum as number }))} className="h-9 w-9 p-0">{pageNum}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: pagination.pages }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0"><ChevronsRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        )}

        {/* DIALOG ELIMINAR */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.ids.length === 1 ? 'la siguiente reserva' : `las siguientes ${deleteDialog.ids.length} reservas`}?
                <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {deleteDialog.nombres.map((nombre, index) => (<li key={index} className="text-sm font-medium">• {nombre}</li>))}
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, ids: [], nombres: [] })}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
