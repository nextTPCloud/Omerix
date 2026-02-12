'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { salonesService, Salon } from '@/services/salones.service'
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
  Trash2,
  MoreHorizontal,
  RefreshCw,
  LayoutGrid,
  XCircle,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Grid3X3,
  Users,
  FileSpreadsheet,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { usePermissions } from '@/hooks/usePermissions'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

// Filtros avanzados
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { SALONES_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'

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
    { key: 'nombre', visible: true, orden: 0 },
    { key: 'codigo', visible: true, orden: 1 },
    { key: 'color', visible: true, orden: 2 },
    { key: 'capacidadTotal', visible: true, orden: 3 },
    { key: 'mesas', visible: true, orden: 4 },
    { key: 'activo', visible: true, orden: 5 },
  ] as ColumnaConfig[],
  sortConfig: { key: 'orden', direction: 'asc' as const },
  columnFilters: { activo: 'true' },
  paginacion: { limit: 25 as const },
  densidad: 'normal' as const,
}

export default function SalonesPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  const [salones, setSalones] = useState<Salon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Filtros avanzados
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([])
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 300)

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
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'color', label: 'Color', sortable: false },
    { key: 'capacidadTotal', label: 'Capacidad', sortable: true },
    { key: 'mesas', label: 'Mesas', sortable: false },
    { key: 'activo', label: 'Estado', sortable: true },
  ])

  const {
    config: moduleConfig,
    isLoading: isLoadingConfig,
    updateColumnas,
    updateSortConfig,
    updateAdvancedFilters,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('salones', DEFAULT_CONFIG, { autoSave: true, debounceMs: 1000 })

  const columnasVisibles = useMemo(() => {
    if (!moduleConfig) return []
    return moduleConfig.columnas.filter((col) => col.visible).sort((a, b) => a.orden - b.orden).map((col) => col.key)
  }, [moduleConfig])

  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_CONFIG.sortConfig, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || 'normal', [moduleConfig])
  const densityClasses = useDensityClasses(densidad)
  const currentLimit = useMemo(() => moduleConfig?.paginacion?.limit || 25, [moduleConfig?.paginacion?.limit])

  const stats = useMemo(() => {
    if (!salones?.length) return { total: 0, activos: 0, inactivos: 0, capacidadTotal: 0 }
    return {
      total: pagination?.total || 0,
      activos: salones.filter(e => e?.activo).length,
      inactivos: salones.filter(e => !e?.activo).length,
      capacidadTotal: salones.reduce((acc, s) => acc + (s.capacidadTotal || 0), 0),
    }
  }, [salones, pagination?.total])

  const cargarSalones = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = { page: filters.page, limit: filters.limit }
      if (filters.activo !== undefined) params.activo = filters.activo

      const response = await salonesService.getAll(params)
      if (response.success) {
        setSalones(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setSalones([])
        toast.error('Error al cargar los salones')
      }
    } catch (error) {
      setSalones([])
      toast.error('Error al cargar los salones')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => { cargarSalones() }, [cargarSalones])

  // Aplicar filtros debounced
  useEffect(() => {
    const combinedFilters: any = {
      page: 1,
      limit: currentLimit,
      sortBy: sortConfig.key,
      sortOrder: sortConfig.direction,
    }

    if (debouncedColumnFilters.nombre) combinedFilters.q = debouncedColumnFilters.nombre
    if (debouncedColumnFilters.activo && debouncedColumnFilters.activo !== 'all') {
      combinedFilters.activo = debouncedColumnFilters.activo === 'true'
    }

    // Aplicar filtros avanzados
    if (debouncedAdvancedFilters.length > 0) {
      Object.assign(combinedFilters, filtersToQueryParams(debouncedAdvancedFilters))
    }

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, debouncedAdvancedFilters, sortConfig.key, sortConfig.direction, currentLimit])

  // Sincronizar configuración guardada (solo carga inicial)
  useEffect(() => {
    if (!moduleConfig || isLoadingConfig || !isInitialLoad.current) return
    const initialFilters = moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0
      ? moduleConfig.columnFilters : { activo: 'true' }
    setColumnFiltersInput(initialFilters as any)

    // Cargar filtros avanzados guardados
    if (moduleConfig?.advancedFilters && moduleConfig.advancedFilters.length > 0) {
      setAdvancedFilters(savedToFilters(moduleConfig.advancedFilters, SALONES_FILTERABLE_FIELDS))
    }

    isInitialLoad.current = false
  }, [moduleConfig, isLoadingConfig])

  // Guardar filtros avanzados cuando cambian
  useEffect(() => {
    if (isInitialLoad.current || isLoadingConfig) return
    updateAdvancedFilters(filtersToSaved(advancedFilters))
  }, [advancedFilters, isLoadingConfig, updateAdvancedFilters])

  // ============================================
  // HANDLERS PARA VISTAS GUARDADAS
  // ============================================

  const handleAplicarVista = useCallback((configuracion: any) => {
    console.log('📄 Aplicando vista guardada:', configuracion)

    if (configuracion.columnas) {
      updateColumnas(configuracion.columnas)
    }

    if (configuracion.sortConfig) {
      updateSortConfig(configuracion.sortConfig)
    }

    if (configuracion.columnFilters) {
      setColumnFiltersInput(configuracion.columnFilters as any)
    }

    // Aplicar filtros avanzados de la vista
    if (configuracion.advancedFilters?.length > 0) {
      setAdvancedFilters(savedToFilters(configuracion.advancedFilters, SALONES_FILTERABLE_FIELDS))
    } else {
      setAdvancedFilters([])
    }

    if (configuracion.densidad) {
      updateDensidad(configuracion.densidad)
    }

    if (configuracion.paginacion?.limit) {
      setFilters(prev => ({ ...prev, limit: configuracion.paginacion.limit }))
    }

    toast.success('Vista aplicada correctamente')
  }, [updateColumnas, updateSortConfig, updateDensidad])

  const handleGuardarVista = useCallback(async (
    nombre: string,
    descripcion?: string,
    esDefault?: boolean,
    vistaIdActualizar?: string
  ) => {
    try {
      const configToSave = {
        ...moduleConfig,
        advancedFilters: filtersToSaved(advancedFilters),
        columnFilters: columnFiltersInput,
      }

      console.log('💾 Guardando vista:', { nombre, descripcion, esDefault, vistaIdActualizar, config: configToSave })

      if (vistaIdActualizar) {
        await vistasService.update(vistaIdActualizar, {
          modulo: 'salones',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'salones',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" guardada correctamente`)
      }
    } catch (error) {
      console.error('Error al guardar vista:', error)
      toast.error('Error al guardar la vista')
      throw error
    }
  }, [moduleConfig, advancedFilters, columnFiltersInput])

  // Cargar vista por defecto al iniciar
  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('salones', true)
        const vistaDefault = vistas?.find((v: any) => v.esDefault)

        if (vistaDefault && vistaDefault.configuracion) {
          handleAplicarVista(vistaDefault.configuracion)
          console.log('✅ Vista por defecto aplicada:', vistaDefault.nombre)
        }
      } catch (error) {
        console.error('Error al cargar vista por defecto:', error)
      }
    }

    cargarVistaDefault()
  }, [handleAplicarVista])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setFilters(prev => ({ ...prev, search: value, page: 1 } as any))
  }

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
    setSelectedItems(selectAll ? [] : salones.map(e => e._id))
    setSelectAll(!selectAll)
  }

  const handleSelect = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  // ============================================
  // ACCIONES EN LOTE
  // ============================================

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'export':
        handleExportSelected()
        break
      case 'delete':
        if (selectedItems.length > 0) {
          const nombresSeleccionados = salones
            .filter(s => selectedItems.includes(s._id))
            .map(s => s.nombre)
          setDeleteDialog({
            open: true,
            ids: selectedItems,
            nombres: nombresSeleccionados,
          })
        }
        break
      case 'activate':
      case 'deactivate':
        handleToggleStatus(action === 'activate')
        break
    }
  }

  const handleExportSelected = () => {
    const selectedData = salones.filter(s => selectedItems.includes(s._id))
    // Exportar usando el ExportButton manualmente
    toast.success(`${selectedData.length} salones exportados`)
  }

  const handleToggleStatus = async (activate: boolean) => {
    try {
      await Promise.all(
        selectedItems.map(id =>
          salonesService.update(id, { activo: activate })
        )
      )
      toast.success(`Salones ${activate ? 'activados' : 'desactivados'} correctamente`)
      cargarSalones()
      setSelectedItems([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await Promise.all(deleteDialog.ids.map(id => salonesService.delete(id)))
      toast.success('Salón(es) eliminado(s) correctamente')
      cargarSalones()
      setSelectedItems([])
      setSelectAll(false)
      setDeleteDialog({ open: false, ids: [], nombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleDuplicar = async (salon: Salon) => {
    try {
      const duplicado = {
        nombre: `${salon.nombre} (copia)`,
        codigo: salon.codigo ? `${salon.codigo}_COPIA` : undefined,
        descripcion: salon.descripcion,
        color: salon.color,
        icono: salon.icono,
        plano: salon.plano,
        capacidadTotal: salon.capacidadTotal,
        capacidadMesas: salon.capacidadMesas,
        almacenId: salon.almacenId,
        tpvsIds: salon.tpvsIds,
        zonasPreparacionIds: salon.zonasPreparacionIds,
        horarios: salon.horarios,
        configuracion: salon.configuracion,
        activo: true,
      }
      await salonesService.create(duplicado)
      toast.success('Salón duplicado correctamente')
      cargarSalones()
    } catch (error) {
      toast.error('Error al duplicar el salón')
    }
  }

  const handleAction = async (id: string, action: string) => {
    const salon = salones.find(e => e._id === id)
    switch (action) {
      case 'view':
        router.push(`/salones/${id}`)
        break
      case 'edit':
        router.push(`/salones/${id}`)
        break
      case 'mesas':
        router.push(`/mesas?salonId=${id}`)
        break
      case 'plano':
        router.push(`/salones/${id}/plano`)
        break
      case 'duplicate':
        if (salon) handleDuplicar(salon)
        break
      case 'delete':
        if (salon) setDeleteDialog({ open: true, ids: [id], nombres: [salon.nombre] })
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

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }))
    toast.success(`Mostrando ${newLimit} registros por página`)
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
              <LayoutGrid className="h-7 w-7 text-primary" />
              Salones
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona los salones del establecimiento</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Eye className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={cargarSalones}>
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            {canCreate('salones') && (
              <Button asChild size="sm">
                <Link href="/salones/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo Salón</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <LayoutGrid className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Activos</p>
                  <p className="text-xl font-bold">{stats.activos}</p>
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
            <Card className="p-3 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Capacidad Total</p>
                  <p className="text-xl font-bold">{stats.capacidadTotal}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={SALONES_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por nombre, código..."
        />

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(d) => { updateDensidad(d); toast.success(`Densidad cambiada a ${d}`) }}
              modulo="salones"
              configuracionActual={moduleConfig}
              onAplicarVista={handleAplicarVista}
              onGuardarVista={handleGuardarVista}
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

            <ExportButton
              data={salones}
              columns={columnasDisponibles.filter((col) => columnasVisibles.includes(col.key)).map((col) => ({ key: col.key, label: col.label }))}
              filename="salones"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Capacidad Total', value: stats.capacidadTotal },
              ]}
            />
            <PrintButton
              data={salones}
              columns={columnasDisponibles.filter((col) => columnasVisibles.includes(col.key)).map((col) => ({ key: col.key, label: col.label }))}
              title="Salones"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Capacidad Total', value: stats.capacidadTotal },
              ]}
              filters={columnFiltersInput}
            />
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedItems.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedItems.length} {selectedItems.length === 1 ? 'salón seleccionado' : 'salones seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
                Activar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
                Desactivar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              {canDelete('salones') && (
                <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              )}
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

                  {columnasVisibles.includes('nombre') && (
                    <th className={`${densityClasses.header} text-left`}>
                      <button onClick={() => handleSort('nombre')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Nombre {getSortIcon('nombre')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('codigo') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <button onClick={() => handleSort('codigo')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Código {getSortIcon('codigo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('color') && (
                    <th className={`${densityClasses.header} text-left w-[80px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Color</span>
                    </th>
                  )}

                  {columnasVisibles.includes('capacidadTotal') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <button onClick={() => handleSort('capacidadTotal')} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                        Capacidad {getSortIcon('capacidadTotal')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('mesas') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Mesas</span>
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
                <tr className="border-b bg-background">
                  <th className="sticky left-0 z-30 bg-background px-3 py-1.5"></th>
                  {columnasVisibles.includes('nombre') && (
                    <th className="px-3 py-1.5">
                      <Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.nombre || ''} onChange={(e) => handleColumnFilterInput('nombre', e.target.value)} />
                    </th>
                  )}
                  {columnasVisibles.includes('codigo') && (
                    <th className="px-3 py-1.5">
                      <Input placeholder="Filtrar..." className="h-7 text-xs" value={columnFiltersInput.codigo || ''} onChange={(e) => handleColumnFilterInput('codigo', e.target.value)} />
                    </th>
                  )}
                  {columnasVisibles.includes('color') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('capacidadTotal') && <th className="px-3 py-1.5"></th>}
                  {columnasVisibles.includes('mesas') && <th className="px-3 py-1.5"></th>}
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
                  <th className="sticky right-0 z-30 bg-background px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />Cargando salones...
                  </td></tr>
                ) : salones.length === 0 ? (
                  <tr><td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    <LayoutGrid className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">No se encontraron salones</p>
                    <p className="text-xs mt-1">Prueba ajustando los filtros o crea un nuevo salón</p>
                  </td></tr>
                ) : (
                  salones.map((salon) => (
                    <tr key={salon._id} className="hover:bg-muted/30 transition-colors group">
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox checked={selectedItems.includes(salon._id)} onCheckedChange={() => handleSelect(salon._id)} />
                        </div>
                      </td>

                      {columnasVisibles.includes('nombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>{salon.nombre}</td>
                      )}

                      {columnasVisibles.includes('codigo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-muted-foreground`}>{salon.codigo || '-'}</td>
                      )}

                      {columnasVisibles.includes('color') && (
                        <td className={`${densityClasses.cell}`}>
                          <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: salon.color }} title={salon.color} />
                        </td>
                      )}

                      {columnasVisibles.includes('capacidadTotal') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {salon.capacidadTotal || 0} personas
                        </td>
                      )}

                      {columnasVisibles.includes('mesas') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {salon.capacidadMesas || '-'} mesas
                        </td>
                      )}

                      {columnasVisibles.includes('activo') && (
                        <td className={`${densityClasses.cell}`}>
                          <Badge variant={salon.activo ? 'default' : 'secondary'} className={`text-xs font-medium ${salon.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {salon.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      )}

                      <td className={`${densityClasses.cell} sticky right-0 z-20 bg-background group-hover:bg-muted/30 transition-colors text-right`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleAction(salon._id, 'view')}><Eye className="mr-2 h-4 w-4" />Ver</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(salon._id, 'edit')}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(salon._id, 'mesas')}><Grid3X3 className="mr-2 h-4 w-4" />Ver mesas</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(salon._id, 'plano')}><LayoutGrid className="mr-2 h-4 w-4" />Editar plano</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(salon._id, 'duplicate')}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                            {canDelete('salones') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleAction(salon._id, 'delete')}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                              </>
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
        </Card>

        {/* PAGINACIÓN */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
                <Select value={pagination.limit.toString()} onValueChange={(value) => handleLimitChange(Number(value))}>
                  <SelectTrigger className="w-[80px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="min-w-[80px] w-auto">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">de <span className="font-medium">{pagination.total}</span> registros</span>
              </div>

              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                {' '}(Página <span className="font-medium">{pagination.page}</span> de{' '}
                <span className="font-medium">{pagination.pages}</span>)
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: 1 }))} disabled={pagination.page === 1} className="h-9 w-9 p-0" title="Primera página"><ChevronsLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.page === 1} className="h-9 w-9 p-0" title="Página anterior"><ChevronLeft className="h-4 w-4" /></Button>
                {getPageNumbers(pagination.page, pagination.pages).map((pageNum, idx) => pageNum === '...' ? (
                  <div key={`ellipsis-${idx}`} className="h-9 w-9 flex items-center justify-center"><span className="text-muted-foreground">...</span></div>
                ) : (
                  <Button key={pageNum} variant={pagination.page === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setFilters(prev => ({ ...prev, page: pageNum as number }))} className="h-9 w-9 p-0">{pageNum}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0" title="Página siguiente"><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, page: pagination.pages }))} disabled={pagination.page === pagination.pages} className="h-9 w-9 p-0" title="Última página"><ChevronsRight className="h-4 w-4" /></Button>
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
                ¿Estás seguro de que deseas eliminar {deleteDialog.ids.length === 1 ? 'el siguiente salón' : `los siguientes ${deleteDialog.ids.length} salones`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.nombres.map((nombre, index) => (<li key={index} className="text-sm font-medium">• {nombre}</li>))}
              </ul>
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
