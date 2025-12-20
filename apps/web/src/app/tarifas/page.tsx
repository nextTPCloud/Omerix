'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { tarifasService } from '@/services/tarifas.service'
import { ITarifa, GetTarifasQuery } from '@/types/tarifa.types'
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
  Eye,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  XCircle,
  Copy,
  Tag,
  Percent,
  DollarSign,
  Columns,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { usePermissions } from '@/hooks/usePermissions'
import { ColumnaConfig } from '@/services/configuracion.service'
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'
import vistasService from '@/services/vistas-guardadas.service'

interface ColumnFilters {
  [key: string]: string | number | boolean
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

const DEFAULT_TARIFAS_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'tipo', visible: true, orden: 2 },
    { key: 'productos', visible: true, orden: 3 },
    { key: 'vigencia', visible: true, orden: 4 },
    { key: 'prioridad', visible: false, orden: 5 },
    { key: 'activo', visible: true, orden: 6 },
  ] as ColumnaConfig[],
  sortConfig: { key: 'nombre', direction: 'asc' as const },
  columnFilters: { activo: 'true' },
  paginacion: { limit: 25 as const },
  densidad: 'normal' as const,
}

export default function TarifasPage() {
  const router = useRouter()
  const { canCreate, canDelete } = usePermissions()
  const isInitialLoad = useRef(true)
  const [tarifas, setTarifas] = useState<ITarifa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTarifas, setSelectedTarifas] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    tarifaIds: string[]
    tarifaNombres: string[]
  }>({ open: false, tarifaIds: [], tarifaNombres: [] })

  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Codigo', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: false },
    { key: 'productos', label: 'Productos', sortable: false },
    { key: 'vigencia', label: 'Vigencia', sortable: false },
    { key: 'prioridad', label: 'Prioridad', sortable: true },
    { key: 'activo', label: 'Activo', sortable: false },
  ])

  const {
    config: moduleConfig,
    updateColumnas,
    updateColumnFilters,
    updateSortConfig,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('tarifas', DEFAULT_TARIFAS_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  const columnas = useMemo(() => moduleConfig?.columnas || DEFAULT_TARIFAS_CONFIG.columnas, [moduleConfig])
  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_TARIFAS_CONFIG.sortConfig, [moduleConfig])
  const columnFilters = useMemo(() => (moduleConfig?.columnFilters || DEFAULT_TARIFAS_CONFIG.columnFilters) as ColumnFilters, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || DEFAULT_TARIFAS_CONFIG.densidad, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  const stats = useMemo(() => {
    if (!tarifas || !Array.isArray(tarifas)) {
      return { total: 0, activas: 0, inactivas: 0, fijas: 0, porcentaje: 0 }
    }
    const total = pagination?.total || 0
    const activas = tarifas.filter((t) => t?.activo).length
    const inactivas = tarifas.filter((t) => !t?.activo).length
    const fijas = tarifas.filter((t) => t?.tipo === 'fija').length
    const porcentaje = tarifas.filter((t) => t?.tipo === 'porcentaje').length
    return { total, activas, inactivas, fijas, porcentaje }
  }, [tarifas, pagination?.total])

  const fetchTarifas = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: GetTarifasQuery = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      if (columnFilters.activo !== undefined && columnFilters.activo !== 'all') {
        // Manejar tanto string como boolean
        params.activo = columnFilters.activo === 'true' || columnFilters.activo === true
      }

      if (columnFilters.tipo && columnFilters.tipo !== 'all') {
        params.tipo = columnFilters.tipo as 'fija' | 'porcentaje'
      }

      const response = await tarifasService.getAll(params)
      if (response.success) {
        setTarifas(response.data)
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.totalPages,
        })
      }
    } catch (error: any) {
      console.error('Error al cargar tarifas:', error)
      toast.error(error.response?.data?.message || 'Error al cargar las tarifas')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, sortConfig, searchTerm, columnFilters])

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }
    fetchTarifas()
  }, [fetchTarifas])

  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('tarifas', true)
        const vistaDefault = vistas?.find((v: any) => v.esDefault)
        if (vistaDefault && vistaDefault.configuracion) {
          if (vistaDefault.configuracion.columnas) updateColumnas(vistaDefault.configuracion.columnas)
          if (vistaDefault.configuracion.sortConfig) updateSortConfig(vistaDefault.configuracion.sortConfig)
          if (vistaDefault.configuracion.columnFilters) updateColumnFilters(vistaDefault.configuracion.columnFilters)
          if (vistaDefault.configuracion.paginacion) setPagination(prev => ({ ...prev, limit: vistaDefault.configuracion.paginacion.limit }))
          if (vistaDefault.configuracion.densidad) updateDensidad(vistaDefault.configuracion.densidad)
        }
      } catch (error) {
        console.error('Error al cargar vista por defecto:', error)
      }
    }
    cargarVistaDefault()
  }, [])

  useEffect(() => { fetchTarifas() }, [])

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSort = (key: string) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    updateSortConfig({ key, direction: newDirection })
  }

  const handleColumnFilterChange = (columnKey: string, value: string) => {
    updateColumnFilters({ ...columnFilters, [columnKey]: value })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleDelete = async (ids: string[]) => {
    try {
      const result = await tarifasService.bulkDelete(ids)
      toast.success(`${result.deletedCount} tarifa(s) eliminada(s)`)
      setSelectedTarifas([])
      setSelectAll(false)
      setDeleteDialog({ open: false, tarifaIds: [], tarifaNombres: [] })
      fetchTarifas()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar tarifas')
    }
  }

  const handleDuplicar = async (id: string) => {
    try {
      const response = await tarifasService.duplicar(id)
      if (response.success && response.data) {
        toast.success('Tarifa duplicada correctamente')
        router.push(`/tarifas/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al duplicar')
    }
  }

  const handleToggleActivo = async (tarifa: ITarifa) => {
    try {
      await tarifasService.changeStatus(tarifa._id, !tarifa.activo)
      toast.success(tarifa.activo ? 'Tarifa desactivada' : 'Tarifa activada')
      fetchTarifas()
    } catch (error) {
      toast.error('Error al cambiar el estado')
    }
  }

  const handleSelectAll = () => {
    if (selectAll) setSelectedTarifas([])
    else setSelectedTarifas(tarifas.map(t => t._id))
    setSelectAll(!selectAll)
  }

  const handleSelectTarifa = (id: string) => {
    setSelectedTarifas(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    )
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES')
  }

  const isColumnVisible = (key: string) => {
    const col = columnas.find((c: ColumnaConfig) => c.key === key)
    return col?.visible ?? true
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3 opacity-30" />
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Tag className="h-7 w-7 text-primary" />
              Tarifas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona las tarifas de precios para tus clientes</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Eye className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadisticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchTarifas}>
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            {canCreate('tarifas') && (
              <Button size="sm" onClick={() => router.push('/tarifas/nuevo')}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nueva Tarifa</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Activas</p>
                  <p className="text-xl font-bold">{stats.activas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Inactivas</p>
                  <p className="text-xl font-bold">{stats.inactivas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Precio fijo</p>
                  <p className="text-xl font-bold">{stats.fijas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Percent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Porcentaje</p>
                  <p className="text-xl font-bold">{stats.porcentaje}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o codigo..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <SettingsMenu
                  densidad={densidad}
                  onDensidadChange={(newDensity) => {
                    updateDensidad(newDensity)
                    toast.success(`Densidad cambiada a ${newDensity}`)
                  }}
                  modulo="tarifas"
                  configuracionActual={{
                    columnas,
                    sortConfig,
                    columnFilters,
                    paginacion: { limit: pagination.limit },
                    densidad,
                  }}
                  onAplicarVista={(configuracion) => {
                    if (configuracion.columnas) updateColumnas(configuracion.columnas)
                    if (configuracion.sortConfig) updateSortConfig(configuracion.sortConfig)
                    if (configuracion.columnFilters) updateColumnFilters(configuracion.columnFilters)
                    if (configuracion.paginacion) setPagination(prev => ({ ...prev, limit: configuracion.paginacion.limit }))
                    if (configuracion.densidad) updateDensidad(configuracion.densidad)
                  }}
                  onGuardarVista={async (nombre, descripcion, esDefault, vistaId) => {
                    try {
                      if (vistaId) {
                        await vistasService.update(vistaId, {
                          modulo: 'tarifas',
                          nombre,
                          descripcion,
                          configuracion: {
                            columnas,
                            sortConfig,
                            columnFilters,
                            paginacion: { limit: pagination.limit },
                            densidad,
                          },
                          esDefault: esDefault || false,
                        })
                        toast.success(`Vista "${nombre}" actualizada correctamente`)
                      } else {
                        await vistasService.create({
                          modulo: 'tarifas',
                          nombre,
                          descripcion,
                          configuracion: {
                            columnas,
                            sortConfig,
                            columnFilters,
                            paginacion: { limit: pagination.limit },
                            densidad,
                          },
                          esDefault: esDefault || false,
                        })
                        toast.success(`Vista "${nombre}" guardada correctamente`)
                      }
                    } catch (error) {
                      console.error('Error al guardar vista:', error)
                      toast.error('Error al guardar la vista')
                      throw error
                    }
                  }}
                  onRestablecer={async () => {
                    await resetConfig()
                    toast.success('Configuracion restablecida')
                  }}
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
                    {columnasDisponibles.map((col) => {
                      const columna = columnas?.find((c: ColumnaConfig) => c.key === col.key)
                      return (
                        <DropdownMenuCheckboxItem
                          key={col.key}
                          checked={columna?.visible ?? false}
                          onCheckedChange={(checked) => {
                            if (!columnas) return
                            updateColumnas(columnas.map((c: ColumnaConfig) =>
                              c.key === col.key ? { ...c, visible: checked } : c
                            ))
                          }}
                        >
                          {col.label}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <ExportButton
                  data={tarifas}
                  filename="tarifas"
                  columns={[
                    { key: 'codigo', label: 'Codigo' },
                    { key: 'nombre', label: 'Nombre' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'activo', label: 'Activo' },
                  ]}
                />

                <PrintButton
                  title="Listado de Tarifas"
                  data={tarifas}
                  columns={[
                    { key: 'codigo', label: 'Codigo' },
                    { key: 'nombre', label: 'Nombre' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'activo', label: 'Activo', render: (v: boolean) => v ? 'Si' : 'No' },
                  ]}
                />
              </div>
            </div>

            {/* Selected Actions */}
            {selectedTarifas.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedTarifas.length} seleccionada(s)</span>
                <div className="flex-1" />
                {canDelete('tarifas') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const nombres = tarifas
                        .filter(t => selectedTarifas.includes(t._id))
                        .map(t => t.nombre)
                      setDeleteDialog({ open: true, tarifaIds: selectedTarifas, tarifaNombres: nombres })
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                  </th>
                  {isColumnVisible('codigo') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-muted" onClick={() => handleSort('codigo')}>
                      <div className="flex items-center gap-1">
                        Codigo {getSortIcon('codigo')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('nombre') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-muted" onClick={() => handleSort('nombre')}>
                      <div className="flex items-center gap-1">
                        Nombre {getSortIcon('nombre')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('tipo') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      <TableSelect
                        value={String(columnFilters.tipo || 'all')}
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'fija', label: 'Precio fijo' },
                          { value: 'porcentaje', label: 'Porcentaje' },
                        ]}
                        onValueChange={(val) => handleColumnFilterChange('tipo', val)}
                      />
                    </th>
                  )}
                  {isColumnVisible('productos') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Productos
                    </th>
                  )}
                  {isColumnVisible('vigencia') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Vigencia
                    </th>
                  )}
                  {isColumnVisible('prioridad') && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-muted" onClick={() => handleSort('prioridad')}>
                      <div className="flex items-center justify-center gap-1">
                        Prioridad {getSortIcon('prioridad')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('activo') && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                      <TableSelect
                        value={String(columnFilters.activo || 'true')}
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Activas' },
                          { value: 'false', label: 'Inactivas' },
                        ]}
                        onValueChange={(val) => handleColumnFilterChange('activo', val)}
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className={`px-4 text-center ${densityClasses.cell}`}>
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : tarifas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className={`px-4 text-center text-muted-foreground ${densityClasses.cell}`}>
                      No hay tarifas
                    </td>
                  </tr>
                ) : (
                  tarifas.map((tarifa) => (
                    <tr key={tarifa._id} className="hover:bg-muted/50">
                      <td className={`px-4 ${densityClasses.cell}`}>
                        <Checkbox
                          checked={selectedTarifas.includes(tarifa._id)}
                          onCheckedChange={() => handleSelectTarifa(tarifa._id)}
                        />
                      </td>
                      {isColumnVisible('codigo') && (
                        <td className={`px-4 font-medium ${densityClasses.cell} ${densityClasses.text}`}>{tarifa.codigo}</td>
                      )}
                      {isColumnVisible('nombre') && (
                        <td className={`px-4 ${densityClasses.cell} ${densityClasses.text}`}>{tarifa.nombre}</td>
                      )}
                      {isColumnVisible('tipo') && (
                        <td className={`px-4 ${densityClasses.cell}`}>
                          <Badge variant="outline" className="gap-1">
                            {tarifa.tipo === 'fija' ? (
                              <>
                                <DollarSign className="h-3 w-3" />
                                Fija
                              </>
                            ) : (
                              <>
                                <Percent className="h-3 w-3" />
                                {tarifa.porcentajeGeneral}%
                              </>
                            )}
                          </Badge>
                        </td>
                      )}
                      {isColumnVisible('productos') && (
                        <td className={`px-4 text-muted-foreground ${densityClasses.cell} ${densityClasses.text}`}>
                          {tarifa.precios?.length || 0} productos
                        </td>
                      )}
                      {isColumnVisible('vigencia') && (
                        <td className={`px-4 text-muted-foreground ${densityClasses.cell} ${densityClasses.text}`}>
                          {tarifa.fechaDesde && formatDate(tarifa.fechaDesde)}
                          {tarifa.fechaHasta && ` - ${formatDate(tarifa.fechaHasta)}`}
                          {!tarifa.fechaDesde && !tarifa.fechaHasta && 'Sin limite'}
                        </td>
                      )}
                      {isColumnVisible('prioridad') && (
                        <td className={`px-4 text-center ${densityClasses.cell} ${densityClasses.text}`}>
                          {tarifa.prioridad}
                        </td>
                      )}
                      {isColumnVisible('activo') && (
                        <td className={`px-4 text-center ${densityClasses.cell}`}>
                          {tarifa.activo ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactiva
                            </Badge>
                          )}
                        </td>
                      )}
                      <td className={`px-4 text-center ${densityClasses.cell}`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/tarifas/${tarifa._id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/tarifas/${tarifa._id}/editar`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicar(tarifa._id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActivo(tarifa)}>
                              {tarifa.activo ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>
                            {canDelete('tarifas') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, tarifaIds: [tarifa._id], tarifaNombres: [tarifa.nombre] })}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {tarifas.length} de {pagination.total} tarifas
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Pagina {pagination.page} de {pagination.pages || 1}
              </span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, tarifaIds: [], tarifaNombres: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Tarifa{deleteDialog.tarifaIds.length > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              {deleteDialog.tarifaIds.length === 1
                ? `¿Estas seguro de que quieres eliminar la tarifa "${deleteDialog.tarifaNombres[0]}"?`
                : `¿Estas seguro de que quieres eliminar ${deleteDialog.tarifaIds.length} tarifas?`}
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, tarifaIds: [], tarifaNombres: [] })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteDialog.tarifaIds)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
