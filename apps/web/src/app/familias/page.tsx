'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { familiasService } from '@/services/familias.service'
import { Familia } from '@/types/familia.types'
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
  FolderTree,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  XCircle,
  Layers,
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

const DEFAULT_FAMILIAS_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'descripcion', visible: false, orden: 2 },
    { key: 'familiaPadre', visible: true, orden: 3 },
    { key: 'orden', visible: false, orden: 4 },
    { key: 'activo', visible: true, orden: 5 },
  ] as ColumnaConfig[],
  sortConfig: { key: 'orden', direction: 'asc' as const },
  columnFilters: { activo: 'true' },
  paginacion: { limit: 25 as const },
  densidad: 'normal' as const,
}

export default function FamiliasPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)
  const [familias, setFamilias] = useState<Familia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFamilias, setSelectedFamilias] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    familiaIds: string[]
    familiaNombres: string[]
  }>({ open: false, familiaIds: [], familiaNombres: [] })

  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'descripcion', label: 'Descripción', sortable: false },
    { key: 'familiaPadre', label: 'Familia Padre', sortable: false },
    { key: 'orden', label: 'Orden', sortable: true },
    { key: 'activo', label: 'Activo', sortable: false },
  ])

  const {
    config: moduleConfig,
    updateColumnas,
    updateColumnFilters,
    updateSortConfig,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('familias', DEFAULT_FAMILIAS_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  // Derivar valores desde la configuración
  const columnas = useMemo(() => moduleConfig?.columnas || DEFAULT_FAMILIAS_CONFIG.columnas, [moduleConfig])
  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_FAMILIAS_CONFIG.sortConfig, [moduleConfig])
  const columnFilters = useMemo(() => (moduleConfig?.columnFilters || DEFAULT_FAMILIAS_CONFIG.columnFilters) as ColumnFilters, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || DEFAULT_FAMILIAS_CONFIG.densidad, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  // Estadísticas calculadas
  const stats = useMemo(() => {
    if (!familias || !Array.isArray(familias)) {
      return { total: 0, activas: 0, inactivas: 0, conPadre: 0 }
    }
    const total = pagination?.total || 0
    const activas = familias.filter((f) => f?.activo).length
    const inactivas = familias.filter((f) => !f?.activo).length
    const conPadre = familias.filter((f) => f?.familiaPadre).length
    return { total, activas, inactivas, conPadre }
  }, [familias, pagination?.total])

  const fetchFamilias = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      }

      // Búsqueda general
      if (searchTerm.trim()) {
        params.q = searchTerm.trim()
      }

      // Filtros específicos por columna
      if (columnFilters.codigo && String(columnFilters.codigo).trim()) {
        params.codigo = String(columnFilters.codigo).trim()
      }
      if (columnFilters.nombre && String(columnFilters.nombre).trim()) {
        params.nombre = String(columnFilters.nombre).trim()
      }
      if (columnFilters.descripcion && String(columnFilters.descripcion).trim()) {
        params.descripcion = String(columnFilters.descripcion).trim()
      }
      if (columnFilters.familiaPadre && String(columnFilters.familiaPadre).trim()) {
        params.familiaPadre = String(columnFilters.familiaPadre).trim()
      }

      // Filtro de activo
      if (columnFilters.activo && columnFilters.activo !== 'all') {
        params.activo = columnFilters.activo === 'true'
      }

      const response = await familiasService.getAll(params)
      setFamilias(response.data)
      if (response.pagination) {
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.totalPages || Math.ceil(response.pagination.total / response.pagination.limit),
        })
      }
    } catch (error: any) {
      console.error('Error al cargar familias:', error)
      toast.error(error.response?.data?.message || 'Error al cargar las familias')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, sortConfig, searchTerm, columnFilters])

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }
    fetchFamilias()
  }, [fetchFamilias])

  // Cargar y aplicar vista por defecto al iniciar
  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('familias', true)
        const vistaDefault = vistas?.find((v: any) => v.esDefault)

        if (vistaDefault && vistaDefault.configuracion) {
          // Aplicar la configuración de la vista por defecto
          if (vistaDefault.configuracion.columnas) updateColumnas(vistaDefault.configuracion.columnas)
          if (vistaDefault.configuracion.sortConfig) updateSortConfig(vistaDefault.configuracion.sortConfig)
          if (vistaDefault.configuracion.columnFilters) updateColumnFilters(vistaDefault.configuracion.columnFilters)
          if (vistaDefault.configuracion.paginacion) setPagination(prev => ({ ...prev, limit: vistaDefault.configuracion.paginacion.limit }))
          if (vistaDefault.configuracion.densidad) updateDensidad(vistaDefault.configuracion.densidad)
          console.log('✅ Vista por defecto aplicada:', vistaDefault.nombre)
        }
      } catch (error) {
        console.error('Error al cargar vista por defecto:', error)
      }
    }

    cargarVistaDefault()
  }, [])

  useEffect(() => { fetchFamilias() }, [])

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
      for (const id of ids) await familiasService.delete(id)
      toast.success(`${ids.length} familia(s) eliminada(s)`)
      setSelectedFamilias([])
      setSelectAll(false)
      setDeleteDialog({ open: false, familiaIds: [], familiaNombres: [] })
      fetchFamilias()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar familias')
    }
  }

  const handleDuplicar = async (id: string) => {
    try {
      const response = await familiasService.duplicar(id)
      if (response.success && response.data) {
        toast.success('Familia duplicada correctamente')
        router.push(`/familias/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al duplicar')
    }
  }

  const handleSelectAll = () => {
    if (selectAll) setSelectedFamilias([])
    else setSelectedFamilias(familias.map(f => f._id))
    setSelectAll(!selectAll)
  }

  const handleSelectFamilia = (id: string) => {
    setSelectedFamilias(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FolderTree className="h-7 w-7 text-primary" />
              Familias
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Organiza tus productos en categorías</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <FolderTree className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFamilias}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button size="sm" onClick={() => router.push('/familias/nuevo')}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nueva Familia</span>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FolderTree className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
            <Card className="p-3 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Subfamilias</p>
                  <p className="text-xl font-bold">{stats.conPadre}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* MENÚ DE CONFIGURACIÓN (Densidad + Vistas + Restablecer) */}
                <SettingsMenu
                  densidad={densidad}
                  onDensidadChange={(newDensity) => {
                    updateDensidad(newDensity)
                    toast.success(`Densidad cambiada a ${newDensity}`)
                  }}
                  modulo="familias"
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
                      console.log('💾 Guardando vista:', { nombre, descripcion, esDefault, vistaId })

                      if (vistaId) {
                        // Actualizar vista existente
                        await vistasService.update(vistaId, {
                          modulo: 'familias',
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
                        // Crear nueva vista
                        await vistasService.create({
                          modulo: 'familias',
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
                    toast.success('Configuración restablecida')
                  }}
                />

                {/* SELECTOR DE COLUMNAS */}
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

                {/* EXPORTACIÓN */}
                <ExportButton
                  data={familias}
                  columns={(columnas || []).filter((c: ColumnaConfig) => c.visible).map((c: ColumnaConfig) => ({
                    key: c.key,
                    label: columnasDisponibles.find(cd => cd.key === c.key)?.label || c.key,
                  }))}
                  filename="familias"
                />

                {/* IMPRIMIR */}
                <PrintButton
                  data={familias}
                  columns={(columnas || []).filter((c: ColumnaConfig) => c.visible).map((c: ColumnaConfig) => ({
                    key: c.key,
                    label: columnasDisponibles.find(cd => cd.key === c.key)?.label || c.key,
                  }))}
                  title="Listado de Familias"
                />

                {/* ACTUALIZAR */}
                <Button variant="outline" size="sm" onClick={fetchFamilias} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 sm:mr-2 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              </div>
            </div>

            {selectedFamilias.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium">{selectedFamilias.length} seleccionado(s)</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const familiasAEliminar = familias.filter(f => selectedFamilias.includes(f._id))
                    setDeleteDialog({
                      open: true,
                      familiaIds: selectedFamilias,
                      familiaNombres: familiasAEliminar.map(f => f.nombre),
                    })
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar seleccionados
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className={`${densityClasses.header} text-left`}>
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                  </th>
                  {(columnas || []).filter((c: ColumnaConfig) => c.visible).sort((a: ColumnaConfig, b: ColumnaConfig) => a.orden - b.orden).map((columna: ColumnaConfig) => {
                    const colDef = columnasDisponibles.find(c => c.key === columna.key)
                    return (
                      <th key={columna.key} className={`${densityClasses.header} text-left`}>
                        {colDef?.sortable ? (
                          <button onClick={() => handleSort(columna.key)} className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors">
                            {colDef.label}
                            {sortConfig.key === columna.key && (
                              sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                            )}
                            {sortConfig.key !== columna.key && <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-wider">{colDef?.label}</span>
                        )}
                      </th>
                    )
                  })}
                  <th className={`${densityClasses.header} text-right`}>
                    <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>
                  </th>
                </tr>
                <tr className="border-b">
                  <th className={densityClasses.header}></th>
                  {(columnas || []).filter((c: ColumnaConfig) => c.visible).sort((a: ColumnaConfig, b: ColumnaConfig) => a.orden - b.orden).map((columna: ColumnaConfig) => (
                    <th key={`filter-${columna.key}`} className={densityClasses.header}>
                      {columna.key === 'codigo' && (
                        <Input
                          placeholder="Filtrar código..."
                          value={String(columnFilters[columna.key] || '')}
                          onChange={(e) => handleColumnFilterChange(columna.key, e.target.value)}
                          className="h-7 text-xs placeholder:text-muted-foreground"
                        />
                      )}
                      {columna.key === 'nombre' && (
                        <Input
                          placeholder="Filtrar nombre..."
                          value={String(columnFilters[columna.key] || '')}
                          onChange={(e) => handleColumnFilterChange(columna.key, e.target.value)}
                          className="h-7 text-xs placeholder:text-muted-foreground"
                        />
                      )}
                      {columna.key === 'descripcion' && (
                        <Input
                          placeholder="Filtrar descripción..."
                          value={String(columnFilters[columna.key] || '')}
                          onChange={(e) => handleColumnFilterChange(columna.key, e.target.value)}
                          className="h-7 text-xs placeholder:text-muted-foreground"
                        />
                      )}
                      {columna.key === 'familiaPadre' && (
                        <Input
                          placeholder="Filtrar familia..."
                          value={String(columnFilters[columna.key] || '')}
                          onChange={(e) => handleColumnFilterChange(columna.key, e.target.value)}
                          className="h-7 text-xs placeholder:text-muted-foreground"
                        />
                      )}
                      {columna.key === 'orden' && (
                        <Input
                          placeholder="Filtrar orden..."
                          value={String(columnFilters[columna.key] || '')}
                          onChange={(e) => handleColumnFilterChange(columna.key, e.target.value)}
                          className="h-7 text-xs placeholder:text-muted-foreground"
                        />
                      )}
                      {columna.key === 'activo' && (
                        <TableSelect
                          value={String(columnFilters[columna.key] || '')}
                          onValueChange={(value) => handleColumnFilterChange(columna.key, value)}
                          placeholder="Todos"
                          options={[
                            { value: 'true', label: 'Activas' },
                            { value: 'false', label: 'Inactivas' },
                          ]}
                        />
                      )}
                    </th>
                  ))}
                  <th className={densityClasses.header}></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={(columnas || []).filter((c: ColumnaConfig) => c.visible).length + 2} className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : familias.length === 0 ? (
                  <tr>
                    <td colSpan={(columnas || []).filter((c: ColumnaConfig) => c.visible).length + 2} className="text-center py-12">
                      <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No se encontraron familias</p>
                    </td>
                  </tr>
                ) : (
                  familias.map((familia) => (
                    <tr key={familia._id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className={densityClasses.cell}>
                        <Checkbox
                          checked={selectedFamilias.includes(familia._id)}
                          onCheckedChange={() => handleSelectFamilia(familia._id)}
                        />
                      </td>
                      {(columnas || []).filter((c: ColumnaConfig) => c.visible).sort((a: ColumnaConfig, b: ColumnaConfig) => a.orden - b.orden).map((columna: ColumnaConfig) => (
                        <td key={`${familia._id}-${columna.key}`} className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {columna.key === 'codigo' && (familia.codigo || '-')}
                          {columna.key === 'nombre' && <div className="font-medium">{familia.nombre}</div>}
                          {columna.key === 'descripcion' && (
                            <div className="text-muted-foreground truncate max-w-xs">
                              {familia.descripcion || '-'}
                            </div>
                          )}
                          {columna.key === 'familiaPadre' && (
                            <span>{familia.familiaPadre?.nombre || '-'}</span>
                          )}
                          {columna.key === 'orden' && <span>{familia.orden}</span>}
                          {columna.key === 'activo' && (
                            <Badge variant={familia.activo ? 'default' : 'secondary'}>
                              {familia.activo ? 'Activa' : 'Inactiva'}
                            </Badge>
                          )}
                        </td>
                      ))}
                      <td className={`${densityClasses.cell} text-right`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/familias/${familia._id}`)}>
                              <Eye className="h-4 w-4 mr-2" />Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/familias/${familia._id}/editar`)}>
                              <Edit className="h-4 w-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicar(familia._id)}>
                              <Copy className="h-4 w-4 mr-2" />Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({
                                open: true,
                                familiaIds: [familia._id],
                                familiaNombres: [familia.nombre],
                              })}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Eliminar
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

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} familias
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPagination(prev => ({ ...prev, page: 1 }))} disabled={pagination.page === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Página {pagination.page} de {pagination.pages}</span>
                <Button variant="outline" size="icon" onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))} disabled={pagination.page === pagination.pages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, familiaIds: [], familiaNombres: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar {deleteDialog.familiaIds.length === 1 ? 'esta familia' : 'estas familias'}?
              {deleteDialog.familiaNombres.length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {deleteDialog.familiaNombres.map((nombre, i) => <li key={i}>{nombre}</li>)}
                </ul>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, familiaIds: [], familiaNombres: [] })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteDialog.familiaIds)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
