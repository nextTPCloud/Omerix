'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { alergenosService, Alergeno } from '@/services/alergenos.service'
import vistasService from '@/services/vistas-guardadas.service'
import { Card } from '@/components/ui/card'
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
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface ColumnFilters {
  [key: string]: string
}

interface AlergenosFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  activo?: boolean
  esObligatorioUE?: boolean
}

const DEFAULT_ALERGENOS_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'color', visible: true, orden: 2 },
    { key: 'esObligatorioUE', visible: true, orden: 3 },
    { key: 'activo', visible: true, orden: 4 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'orden',
    direction: 'asc' as const,
  },
  columnFilters: {
    activo: 'true',
  },
  paginacion: {
    limit: 25 as const,
  },
  densidad: 'normal' as const,
}

export default function AlergenosPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  const [alergenos, setAlergenos] = useState<Alergeno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedAlergenos, setSelectedAlergenos] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  const [filters, setFilters] = useState<AlergenosFilters>({
    page: 1,
    limit: 25,
    sortBy: 'orden',
    sortOrder: 'asc',
    activo: true,
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  })

  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    ids: string[]
    nombres: string[]
  }>({
    open: false,
    ids: [],
    nombres: [],
  })

  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'color', label: 'Color', sortable: false },
    { key: 'esObligatorioUE', label: 'Obligatorio UE', sortable: true },
    { key: 'activo', label: 'Estado', sortable: true },
  ])

  const {
    config: moduleConfig,
    isLoading: isLoadingConfig,
    updateColumnas,
    updateSortConfig,
    updateColumnFilters,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('alergenos', DEFAULT_ALERGENOS_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  const columnasVisibles = useMemo(() => {
    if (!moduleConfig) return []
    return moduleConfig.columnas
      .filter((col) => col.visible)
      .sort((a, b) => a.orden - b.orden)
      .map((col) => col.key)
  }, [moduleConfig])

  const sortConfig = useMemo(() => {
    return moduleConfig?.sortConfig || DEFAULT_ALERGENOS_CONFIG.sortConfig
  }, [moduleConfig])

  const currentSortKey = useMemo(() => sortConfig.key, [sortConfig.key])
  const currentSortDirection = useMemo(() => sortConfig.direction, [sortConfig.direction])
  const currentLimit = useMemo(() => moduleConfig?.paginacion?.limit || 25, [moduleConfig?.paginacion?.limit])

  const densidad = useMemo(() => {
    return moduleConfig?.densidad || 'normal'
  }, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  const stats = useMemo(() => {
    if (!alergenos || !Array.isArray(alergenos)) {
      return { total: 0, activos: 0, inactivos: 0, obligatoriosUE: 0 }
    }

    const total = pagination?.total || 0
    const activos = alergenos.filter((e) => e?.activo).length
    const inactivos = alergenos.filter((e) => !e?.activo).length
    const obligatoriosUE = alergenos.filter((e) => e?.esObligatorioUE).length

    return { total, activos, inactivos, obligatoriosUE }
  }, [alergenos, pagination?.total])

  const cargarAlergenos = useCallback(async () => {
    try {
      setIsLoading(true)

      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }

      if (filters.q) params.q = filters.q
      if (filters.activo !== undefined) params.activo = filters.activo
      if (filters.esObligatorioUE !== undefined) params.esObligatorioUE = filters.esObligatorioUE

      const response = await alergenosService.getAll(params)

      if (response.success) {
        setAlergenos(response.data || [])
        setPagination(response.pagination || { page: 1, limit: 25, total: 0, pages: 0 })
      } else {
        setAlergenos([])
        toast.error('Error al cargar los alérgenos')
      }
    } catch (error) {
      console.error('Error al cargar alérgenos:', error)
      setAlergenos([])
      setPagination({ page: 1, limit: 25, total: 0, pages: 0 })
      toast.error('Error al cargar los alérgenos')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarAlergenos()
  }, [cargarAlergenos])

  useEffect(() => {
    const combinedFilters: any = {
      page: 1,
      sortBy: currentSortKey,
      sortOrder: currentSortDirection,
      limit: currentLimit,
    }

    if (debouncedColumnFilters.nombre) {
      combinedFilters.q = debouncedColumnFilters.nombre
    }

    Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
      if (key === 'activo' && value !== 'all') {
        combinedFilters.activo = value === 'true'
      }
      if (key === 'esObligatorioUE' && value !== 'all') {
        combinedFilters.esObligatorioUE = value === 'true'
      }
    })

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, currentSortKey, currentSortDirection, currentLimit])

  useEffect(() => {
    if (!moduleConfig || isLoadingConfig) return
    if (!isInitialLoad.current) return

    const initialFilters = (moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0)
      ? moduleConfig.columnFilters
      : { activo: 'true' }

    setColumnFiltersInput(initialFilters as any)
    isInitialLoad.current = false
  }, [moduleConfig, isLoadingConfig])

  const handleAplicarVista = useCallback((configuracion: any) => {
    if (configuracion.columnas) updateColumnas(configuracion.columnas)
    if (configuracion.sortConfig) updateSortConfig(configuracion.sortConfig)
    if (configuracion.columnFilters) setColumnFiltersInput(configuracion.columnFilters as any)
    if (configuracion.densidad) updateDensidad(configuracion.densidad)
    if (configuracion.paginacion?.limit) setFilters(prev => ({ ...prev, limit: configuracion.paginacion.limit }))
    toast.success('Vista aplicada correctamente')
  }, [updateColumnas, updateSortConfig, updateDensidad])

  const handleGuardarVista = useCallback(async (
    nombre: string,
    descripcion?: string,
    esDefault?: boolean,
    vistaIdActualizar?: string
  ) => {
    try {
      if (vistaIdActualizar) {
        await vistasService.update(vistaIdActualizar, {
          modulo: 'alergenos',
          nombre,
          descripcion,
          configuracion: moduleConfig,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'alergenos',
          nombre,
          descripcion,
          configuracion: moduleConfig,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" guardada correctamente`)
      }
    } catch (error) {
      console.error('Error al guardar vista:', error)
      toast.error('Error al guardar la vista')
      throw error
    }
  }, [moduleConfig])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setFilters(prev => ({ ...prev, q: value, page: 1 }))
  }

  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    updateSortConfig({ key, direction })
  }

  const getSortIcon = (column: string) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />
  }

  const handleColumnFilterInput = (column: string, value: string) => {
    const newFilters = { ...columnFiltersInput }
    if (value === '' || value === 'all') {
      delete newFilters[column]
    } else {
      newFilters[column] = value
    }
    setColumnFiltersInput(newFilters)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAlergenos([])
    } else {
      setSelectedAlergenos(alergenos.map(e => e._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectAlergeno = (id: string) => {
    if (selectedAlergenos.includes(id)) {
      setSelectedAlergenos(selectedAlergenos.filter(i => i !== id))
    } else {
      setSelectedAlergenos([...selectedAlergenos, id])
    }
  }

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'export':
        toast.success('Alérgenos exportados correctamente')
        break
      case 'delete':
        if (selectedAlergenos.length > 0) {
          const nombresSeleccionados = alergenos
            .filter(e => selectedAlergenos.includes(e._id))
            .map(e => e.nombre)
          setDeleteDialog({ open: true, ids: selectedAlergenos, nombres: nombresSeleccionados })
        }
        break
      case 'activate':
      case 'deactivate':
        handleToggleStatus(action === 'activate')
        break
    }
  }

  const handleToggleStatus = async (activate: boolean) => {
    try {
      await Promise.all(
        selectedAlergenos.map(id => alergenosService.update(id, { activo: activate }))
      )
      toast.success(`Alérgenos ${activate ? 'activados' : 'desactivados'} correctamente`)
      cargarAlergenos()
      setSelectedAlergenos([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await Promise.all(deleteDialog.ids.map(id => alergenosService.delete(id)))
      toast.success('Alérgeno(s) eliminado(s) correctamente')
      cargarAlergenos()
      setSelectedAlergenos([])
      setSelectAll(false)
      setDeleteDialog({ open: false, ids: [], nombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleAction = async (id: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/alergenos/${id}`)
        break
      case 'edit':
        router.push(`/alergenos/${id}`)
        break
      case 'delete':
        const item = alergenos.find(e => e._id === id)
        if (item) {
          setDeleteDialog({ open: true, ids: [id], nombres: [item.nombre] })
        }
        break
    }
  }

  const handleInitializeUE = async () => {
    try {
      const response = await alergenosService.initializeUE()
      if (response.success) {
        toast.success(response.message || 'Alérgenos UE inicializados correctamente')
        cargarAlergenos()
      }
    } catch (error) {
      toast.error('Error al inicializar alérgenos UE')
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
    const maxVisible = 7

    if (totalPages <= maxVisible) {
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

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }))
    toast.success(`Mostrando ${newLimit} registros por página`)
  }

  if (isLoadingConfig) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-primary" />
              Alérgenos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona los alérgenos de tus productos
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Eye className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleInitializeUE}>
              <Sparkles className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Inicializar UE</span>
            </Button>
            <Button variant="outline" size="sm" onClick={cargarAlergenos}>
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/alergenos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Alérgeno</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <AlertTriangle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Activos</p>
                  <p className="text-xl font-bold">{stats.activos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Obligatorios UE</p>
                  <p className="text-xl font-bold">{stats.obligatoriosUE}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Inactivos</p>
                  <p className="text-xl font-bold">{stats.inactivos}</p>
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
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(newDensity) => {
                updateDensidad(newDensity)
                toast.success(`Densidad cambiada a ${newDensity}`)
              }}
              modulo="alergenos"
              configuracionActual={moduleConfig}
              onAplicarVista={handleAplicarVista}
              onGuardarVista={handleGuardarVista}
              onRestablecer={async () => {
                await resetConfig()
                toast.success('Configuración restablecida')
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
                {columnasDisponibles.map((columna) => (
                  <DropdownMenuCheckboxItem
                    key={columna.key}
                    checked={columnasVisibles.includes(columna.key)}
                    onCheckedChange={() => toggleColumna(columna.key)}
                  >
                    {columna.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <ExportButton
              data={alergenos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({ key: col.key, label: col.label }))}
              filename="alergenos"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
              ]}
            />

            <PrintButton
              data={alergenos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({ key: col.key, label: col.label }))}
              title="Listado de Alérgenos"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
              ]}
              filters={columnFiltersInput}
            />
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedAlergenos.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedAlergenos.length} {selectedAlergenos.length === 1 ? 'alérgeno seleccionado' : 'alérgenos seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>Activar</Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>Desactivar</Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />Exportar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="mr-2 h-4 w-4" />Eliminar
              </Button>
            </div>
          </Card>
        )}

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

                  {columnasVisibles.includes('codigo') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <button onClick={() => handleSort('codigo')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Código {getSortIcon('codigo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('nombre') && (
                    <th className={`${densityClasses.header} text-left`}>
                      <button onClick={() => handleSort('nombre')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Nombre {getSortIcon('nombre')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('color') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Color</span>
                    </th>
                  )}

                  {columnasVisibles.includes('esObligatorioUE') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button onClick={() => handleSort('esObligatorioUE')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Oblig. UE {getSortIcon('esObligatorioUE')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('activo') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <button onClick={() => handleSort('activo')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Estado {getSortIcon('activo')}
                      </button>
                    </th>
                  )}

                  <th className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 backdrop-blur-sm text-right min-w-[70px] text-xs font-semibold uppercase tracking-wider`}>
                    Acciones
                  </th>
                </tr>

                {/* FILTROS */}
                <tr className="border-b bg-card">
                  <th className="sticky left-0 z-30 bg-card px-3 py-1.5"></th>

                  {columnasVisibles.includes('codigo') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs"
                        value={columnFiltersInput.codigo || ''}
                        onChange={(e) => handleColumnFilterInput('codigo', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('nombre') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs"
                        value={columnFiltersInput.nombre || ''}
                        onChange={(e) => handleColumnFilterInput('nombre', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('color') && <th className="px-3 py-1.5"></th>}

                  {columnasVisibles.includes('esObligatorioUE') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.esObligatorioUE || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('esObligatorioUE', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Sí' },
                          { value: 'false', label: 'No' },
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('activo') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.activo || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('activo', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Activos' },
                          { value: 'false', label: 'Inactivos' },
                        ]}
                      />
                    </th>
                  )}

                  <th className="sticky right-0 z-30 bg-card px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando alérgenos...
                    </td>
                  </tr>
                ) : alergenos.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron alérgenos</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear uno nuevo</p>
                    </td>
                  </tr>
                ) : (
                  alergenos.map((alergeno) => (
                    <tr key={alergeno._id} className="hover:bg-muted/30 transition-colors group">
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-card group-hover:bg-muted/50 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedAlergenos.includes(alergeno._id)}
                            onCheckedChange={() => handleSelectAlergeno(alergeno._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.includes('codigo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-mono`}>
                          {alergeno.codigo}
                        </td>
                      )}

                      {columnasVisibles.includes('nombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          {alergeno.nombre}
                        </td>
                      )}

                      {columnasVisibles.includes('color') && (
                        <td className={`${densityClasses.cell}`}>
                          <div
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: alergeno.color }}
                            title={alergeno.color}
                          />
                        </td>
                      )}

                      {columnasVisibles.includes('esObligatorioUE') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {alergeno.esObligatorioUE ? (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              <Sparkles className="h-3 w-3 mr-1" />UE
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )}

                      {columnasVisibles.includes('activo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge
                            variant={alergeno.activo ? 'default' : 'secondary'}
                            className={`text-xs font-medium ${
                              alergeno.activo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {alergeno.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      )}

                      <td className={`${densityClasses.cell} sticky right-0 z-20 bg-card group-hover:bg-muted/50 transition-colors text-right`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleAction(alergeno._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(alergeno._id, 'edit')}>
                              <Edit className="mr-2 h-4 w-4" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleAction(alergeno._id, 'delete')}>
                              <Trash2 className="mr-2 h-4 w-4" />Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => handleLimitChange(Number(value))}
                >
                  <SelectTrigger className="w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[80px] w-auto" align="start">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  de <span className="font-medium">{pagination.total}</span> registros
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: 1 }))} disabled={pagination.page === 1} className="h-9 w-9 p-0">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))} disabled={pagination.page === 1} className="h-9 w-9 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers(pagination.page, pagination.pages).map((pageNum, idx) => {
                  if (pageNum === '...') {
                    return (
                      <div key={`ellipsis-${idx}`} className="h-9 w-9 flex items-center justify-center">
                        <span className="text-muted-foreground">...</span>
                      </div>
                    )
                  }
                  const page = pageNum as number
                  return (
                    <Button
                      key={page}
                      variant={pagination.page === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, page }))}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}

                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: pagination.pages }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* DIALOG DE CONFIRMACIÓN */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.ids.length === 1 ? 'el siguiente alérgeno' : `los siguientes ${deleteDialog.ids.length} alérgenos`}?
                <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {deleteDialog.nombres.map((nombre, index) => (
                    <li key={index} className="text-sm font-medium">• {nombre}</li>
                  ))}
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, ids: [], nombres: [] })}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
