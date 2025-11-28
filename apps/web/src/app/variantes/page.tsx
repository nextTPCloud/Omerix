'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { variantesService, Variante } from '@/services/variantes.service'
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
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Palette,
  XCircle,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  CheckCircle,
  AlertCircle,
  SquareStack,
  ChevronDown,
  Image,
  List,
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
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

interface ColumnFilters {
  [key: string]: string
}

const TIPOS_VISUALIZACION: Record<string, { label: string; color: string; icon: any }> = {
  botones: { label: 'Botones', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: SquareStack },
  dropdown: { label: 'Desplegable', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: ChevronDown },
  colores: { label: 'Colores', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400', icon: Palette },
  imagenes: { label: 'Imágenes', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: Image },
}

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'tipoVisualizacion', visible: true, orden: 2 },
    { key: 'valoresCount', visible: true, orden: 3 },
    { key: 'obligatorio', visible: true, orden: 4 },
    { key: 'activo', visible: true, orden: 5 },
  ] as ColumnaConfig[],
  sortConfig: { key: 'orden', direction: 'asc' as const },
  columnFilters: { activo: 'true' },
  paginacion: { limit: 25 as const },
  densidad: 'normal' as const,
}

export default function VariantesPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  const [variantes, setVariantes] = useState<Variante[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'orden',
    sortOrder: 'asc' as 'asc' | 'desc',
    activo: true as boolean | undefined,
  })

  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[]; nombres: string[] }>({
    open: false, ids: [], nombres: []
  })

  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'tipoVisualizacion', label: 'Visualización', sortable: true },
    { key: 'valoresCount', label: 'Valores', sortable: false },
    { key: 'obligatorio', label: 'Obligatorio', sortable: true },
    { key: 'activo', label: 'Estado', sortable: true },
  ])

  const {
    config: moduleConfig,
    isLoading: isLoadingConfig,
    updateColumnas,
    updateSortConfig,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('variantes', DEFAULT_CONFIG, { autoSave: true, debounceMs: 1000 })

  const columnasVisibles = useMemo(() => {
    if (!moduleConfig) return []
    return moduleConfig.columnas.filter((col) => col.visible).sort((a, b) => a.orden - b.orden).map((col) => col.key)
  }, [moduleConfig])

  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_CONFIG.sortConfig, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || 'normal', [moduleConfig])
  const densityClasses = useDensityClasses(densidad)

  const stats = useMemo(() => {
    if (!variantes?.length) return { total: 0, activos: 0, inactivos: 0, obligatorios: 0 }
    return {
      total: pagination?.total || 0,
      activos: variantes.filter(v => v?.activo).length,
      inactivos: variantes.filter(v => !v?.activo).length,
      obligatorios: variantes.filter(v => v?.obligatorio).length,
    }
  }, [variantes, pagination?.total])

  const cargarVariantes = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = { page: filters.page, limit: filters.limit, sortBy: filters.sortBy, sortOrder: filters.sortOrder }
      if (filters.activo !== undefined) params.activo = filters.activo

      const response = await variantesService.getAll(params)
      if (response.success) {
        setVariantes(response.data || [])
        setPagination({
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 25,
          total: response.pagination?.total || 0,
          pages: response.pagination?.totalPages || 0
        })
      } else {
        setVariantes([])
        toast.error('Error al cargar las variantes')
      }
    } catch (error) {
      setVariantes([])
      toast.error('Error al cargar las variantes')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { cargarVariantes() }, [cargarVariantes])

  useEffect(() => {
    const combinedFilters: any = {
      page: 1,
      sortBy: sortConfig.key,
      sortOrder: sortConfig.direction,
      limit: moduleConfig?.paginacion?.limit || 25,
    }

    if (debouncedColumnFilters.nombre) combinedFilters.q = debouncedColumnFilters.nombre
    if (debouncedColumnFilters.codigo) combinedFilters.q = debouncedColumnFilters.codigo
    if (debouncedColumnFilters.tipoVisualizacion && debouncedColumnFilters.tipoVisualizacion !== 'all') {
      combinedFilters.tipoVisualizacion = debouncedColumnFilters.tipoVisualizacion
    }
    if (debouncedColumnFilters.activo && debouncedColumnFilters.activo !== 'all') {
      combinedFilters.activo = debouncedColumnFilters.activo === 'true'
    }

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, sortConfig, moduleConfig?.paginacion?.limit])

  useEffect(() => {
    if (!moduleConfig || isLoadingConfig || !isInitialLoad.current) return
    const initialFilters = moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0
      ? moduleConfig.columnFilters : { activo: 'true' }
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
    setSelectedItems(selectAll ? [] : variantes.map(v => v._id))
    setSelectAll(!selectAll)
  }

  const handleSelect = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleDeleteConfirm = async () => {
    try {
      await Promise.all(deleteDialog.ids.map(id => variantesService.delete(id)))
      toast.success('Variante(s) eliminada(s) correctamente')
      cargarVariantes()
      setSelectedItems([])
      setSelectAll(false)
      setDeleteDialog({ open: false, ids: [], nombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleAction = async (id: string, action: string) => {
    switch (action) {
      case 'view':
      case 'edit':
        router.push(`/variantes/${id}`)
        break
      case 'delete':
        const item = variantes.find(v => v._id === id)
        if (item) setDeleteDialog({ open: true, ids: [id], nombres: [item.nombre] })
        break
    }
  }

  const handleBulkDelete = () => {
    const nombres = variantes.filter(v => selectedItems.includes(v._id)).map(v => v.nombre)
    setDeleteDialog({ open: true, ids: selectedItems, nombres })
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
              <Palette className="h-7 w-7 text-primary" />
              Variantes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona las variantes de productos (talla, color, etc.)</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Eye className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={cargarVariantes}>
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/variantes/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nueva Variante</span>
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
                  <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <p className="text-xs text-muted-foreground font-medium">Activos</p>
                  <p className="text-xl font-bold">{stats.activos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Obligatorios</p>
                  <p className="text-xl font-bold">{stats.obligatorios}</p>
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
            <Input placeholder="Buscar por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {selectedItems.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar ({selectedItems.length})
              </Button>
            )}

            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(d) => { updateDensidad(d); toast.success(`Densidad cambiada a ${d}`) }}
              modulo="variantes"
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

            <ExportButton data={variantes} columns={columnasDisponibles.filter((col) => columnasVisibles.includes(col.key)).map((col) => ({ key: col.key, label: col.label }))} filename="variantes" stats={[{ label: 'Total', value: stats.total }]} />
            <PrintButton data={variantes} columns={columnasDisponibles.filter((col) => columnasVisibles.includes(col.key)).map((col) => ({ key: col.key, label: col.label }))} title="Variantes" stats={[{ label: 'Total', value: stats.total }]} filters={columnFiltersInput} />
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

                  {columnasVisibles.includes('codigo') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
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

                  {columnasVisibles.includes('tipoVisualizacion') && (
                    <th className={`${densityClasses.header} text-left w-[140px]`}>
                      <button onClick={() => handleSort('tipoVisualizacion')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Visualización {getSortIcon('tipoVisualizacion')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('valoresCount') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Valores</span>
                    </th>
                  )}

                  {columnasVisibles.includes('obligatorio') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <button onClick={() => handleSort('obligatorio')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Obligatorio {getSortIcon('obligatorio')}
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
                      <Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.codigo || ''} onChange={(e) => handleColumnFilterInput('codigo', e.target.value)} />
                    </th>
                  )}
                  {columnasVisibles.includes('nombre') && (
                    <th className="px-3 py-1.5">
                      <Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.nombre || ''} onChange={(e) => handleColumnFilterInput('nombre', e.target.value)} />
                    </th>
                  )}
                  {columnasVisibles.includes('tipoVisualizacion') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.tipoVisualizacion || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('tipoVisualizacion', value)}
                        placeholder="Todos"
                        options={[{ value: 'all', label: 'Todos' }, ...Object.entries(TIPOS_VISUALIZACION).map(([k, v]) => ({ value: k, label: v.label }))]}
                      />
                    </th>
                  )}
                  {columnasVisibles.includes('valoresCount') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('obligatorio') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.obligatorio || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('obligatorio', value)}
                        placeholder="Todos"
                        options={[{ value: 'all', label: 'Todos' }, { value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
                      />
                    </th>
                  )}
                  {columnasVisibles.includes('activo') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.activo || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('activo', value)}
                        placeholder="Todos"
                        options={[{ value: 'all', label: 'Todos' }, { value: 'true', label: 'Activos' }, { value: 'false', label: 'Inactivos' }]}
                      />
                    </th>
                  )}
                  <th className="sticky right-0 z-30 bg-card px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Cargando variantes...
                  </td></tr>
                ) : variantes.length === 0 ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    <Palette className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No se encontraron variantes</p>
                  </td></tr>
                ) : (
                  variantes.map((variante) => {
                    const tipoInfo = TIPOS_VISUALIZACION[variante.tipoVisualizacion]
                    const TipoIcon = tipoInfo?.icon || List
                    return (
                      <tr key={variante._id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => router.push(`/variantes/${variante._id}`)}>
                        <td className={`${densityClasses.cell} sticky left-0 z-20 bg-card group-hover:bg-muted/50 transition-colors`} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <Checkbox checked={selectedItems.includes(variante._id)} onCheckedChange={() => handleSelect(variante._id)} />
                          </div>
                        </td>

                        {columnasVisibles.includes('codigo') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} font-mono`}>{variante.codigo || '-'}</td>
                        )}

                        {columnasVisibles.includes('nombre') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>{variante.nombre}</td>
                        )}

                        {columnasVisibles.includes('tipoVisualizacion') && (
                          <td className={`${densityClasses.cell}`}>
                            <Badge className={`text-xs font-medium ${tipoInfo?.color || 'bg-gray-100'}`}>
                              <TipoIcon className="h-3 w-3 mr-1" />
                              {tipoInfo?.label || variante.tipoVisualizacion}
                            </Badge>
                          </td>
                        )}

                        {columnasVisibles.includes('valoresCount') && (
                          <td className={`${densityClasses.cell}`}>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">{variante.valores?.length || 0} valores</Badge>
                              {variante.tipoVisualizacion === 'colores' && variante.valores?.slice(0, 4).map((v, i) => (
                                <span key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: v.hexColor || '#ccc' }} title={v.valor} />
                              ))}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('obligatorio') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            {variante.obligatorio ? (
                              <span className="text-blue-600 font-medium">Sí</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                        )}

                        {columnasVisibles.includes('activo') && (
                          <td className={`${densityClasses.cell}`}>
                            <Badge variant={variante.activo ? 'default' : 'secondary'} className={`text-xs font-medium ${variante.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
                              {variante.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                        )}

                        <td className={`${densityClasses.cell} sticky right-0 z-20 bg-card group-hover:bg-muted/50 transition-colors text-right`} onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleAction(variante._id, 'edit')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleAction(variante._id, 'delete')}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
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
        </Card>

        {/* PAGINACIÓN */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
                <Select value={pagination.limit.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, limit: Number(value), page: 1 }))}>
                  <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
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
                ¿Estás seguro de que deseas eliminar {deleteDialog.ids.length === 1 ? 'la siguiente variante' : `las siguientes ${deleteDialog.ids.length} variantes`}?
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
    </DashboardLayout>
  )
}
