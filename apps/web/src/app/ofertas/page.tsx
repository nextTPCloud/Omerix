'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ofertasService } from '@/services/ofertas.service'
import { IOferta, GetOfertasQuery, TipoOferta, TipoOfertaLabels } from '@/types/oferta.types'
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
  Percent,
  Gift,
  Columns,
  Calendar,
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

const DEFAULT_OFERTAS_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'tipo', visible: true, orden: 2 },
    { key: 'etiqueta', visible: true, orden: 3 },
    { key: 'vigencia', visible: true, orden: 4 },
    { key: 'usos', visible: false, orden: 5 },
    { key: 'activo', visible: true, orden: 6 },
  ] as ColumnaConfig[],
  sortConfig: { key: 'nombre', direction: 'asc' as const },
  columnFilters: { activo: 'true' },
  paginacion: { limit: 25 as const },
  densidad: 'normal' as const,
}

export default function OfertasPage() {
  const router = useRouter()
  const { canCreate, canDelete } = usePermissions()
  const isInitialLoad = useRef(true)
  const [ofertas, setOfertas] = useState<IOferta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOfertas, setSelectedOfertas] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    ofertaIds: string[]
    ofertaNombres: string[]
  }>({ open: false, ofertaIds: [], ofertaNombres: [] })

  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Codigo', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: false },
    { key: 'etiqueta', label: 'Etiqueta', sortable: false },
    { key: 'vigencia', label: 'Vigencia', sortable: false },
    { key: 'usos', label: 'Usos', sortable: false },
    { key: 'activo', label: 'Activo', sortable: false },
  ])

  const {
    config: moduleConfig,
    updateColumnas,
    updateColumnFilters,
    updateSortConfig,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('ofertas', DEFAULT_OFERTAS_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  const columnas = useMemo(() => moduleConfig?.columnas || DEFAULT_OFERTAS_CONFIG.columnas, [moduleConfig])
  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_OFERTAS_CONFIG.sortConfig, [moduleConfig])
  const columnFilters = useMemo(() => (moduleConfig?.columnFilters || DEFAULT_OFERTAS_CONFIG.columnFilters) as ColumnFilters, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || DEFAULT_OFERTAS_CONFIG.densidad, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  const stats = useMemo(() => {
    if (!ofertas || !Array.isArray(ofertas)) {
      return { total: 0, activas: 0, inactivas: 0, vigentes: 0 }
    }
    const total = pagination?.total || 0
    const activas = ofertas.filter((o) => o?.activo).length
    const inactivas = ofertas.filter((o) => !o?.activo).length
    const ahora = new Date()
    const vigentes = ofertas.filter((o) => {
      if (!o?.activo) return false
      const desde = new Date(o.fechaDesde)
      const hasta = o.fechaHasta ? new Date(o.fechaHasta) : null
      return desde <= ahora && (!hasta || hasta >= ahora)
    }).length
    return { total, activas, inactivas, vigentes }
  }, [ofertas, pagination?.total])

  const fetchOfertas = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: GetOfertasQuery = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      if (columnFilters.activo && columnFilters.activo !== 'all') {
        params.activo = columnFilters.activo === 'true'
      }

      if (columnFilters.tipo && columnFilters.tipo !== 'all') {
        params.tipo = columnFilters.tipo as TipoOferta
      }

      const response = await ofertasService.getAll(params)
      if (response.success) {
        setOfertas(response.data)
        setPagination({
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          pages: response.pagination.totalPages,
        })
      }
    } catch (error: any) {
      console.error('Error al cargar ofertas:', error)
      toast.error(error.response?.data?.message || 'Error al cargar las ofertas')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, sortConfig, searchTerm, columnFilters])

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }
    fetchOfertas()
  }, [fetchOfertas])

  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('ofertas', true)
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

  useEffect(() => { fetchOfertas() }, [])

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
      const result = await ofertasService.bulkDelete(ids)
      toast.success(`${result.deletedCount} oferta(s) eliminada(s)`)
      setSelectedOfertas([])
      setSelectAll(false)
      setDeleteDialog({ open: false, ofertaIds: [], ofertaNombres: [] })
      fetchOfertas()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar ofertas')
    }
  }

  const handleDuplicar = async (id: string) => {
    try {
      const response = await ofertasService.duplicar(id)
      if (response.success && response.data) {
        toast.success('Oferta duplicada correctamente')
        router.push(`/ofertas/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al duplicar')
    }
  }

  const handleToggleActivo = async (oferta: IOferta) => {
    try {
      await ofertasService.changeStatus(oferta._id, !oferta.activo)
      toast.success(oferta.activo ? 'Oferta desactivada' : 'Oferta activada')
      fetchOfertas()
    } catch (error) {
      toast.error('Error al cambiar el estado')
    }
  }

  const handleSelectAll = () => {
    if (selectAll) setSelectedOfertas([])
    else setSelectedOfertas(ofertas.map(o => o._id))
    setSelectAll(!selectAll)
  }

  const handleSelectOferta = (id: string) => {
    setSelectedOfertas(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
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

  const getTipoLabel = (tipo: TipoOferta) => {
    return TipoOfertaLabels[tipo] || tipo
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Gift className="h-7 w-7 text-primary" />
              Ofertas / Promociones
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestiona ofertas y promociones (3x2, 2a unidad, etc.)</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Eye className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadisticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchOfertas}>
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            {canCreate('ofertas') && (
              <Button size="sm" onClick={() => router.push('/ofertas/nuevo')}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nueva Oferta</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Gift className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
            <Card className="p-3 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Vigentes</p>
                  <p className="text-xl font-bold">{stats.vigentes}</p>
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
                  modulo="ofertas"
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
                          modulo: 'ofertas',
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
                          modulo: 'ofertas',
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
                  data={ofertas}
                  filename="ofertas"
                  columns={[
                    { key: 'codigo', label: 'Codigo' },
                    { key: 'nombre', label: 'Nombre' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'etiqueta', label: 'Etiqueta' },
                    { key: 'activo', label: 'Activo' },
                  ]}
                />

                <PrintButton
                  title="Listado de Ofertas"
                  data={ofertas}
                  columns={[
                    { key: 'codigo', label: 'Codigo' },
                    { key: 'nombre', label: 'Nombre' },
                    { key: 'tipo', label: 'Tipo', render: (v: TipoOferta) => getTipoLabel(v) },
                    { key: 'etiqueta', label: 'Etiqueta' },
                    { key: 'activo', label: 'Activo', render: (v: boolean) => v ? 'Si' : 'No' },
                  ]}
                />
              </div>
            </div>

            {/* Selected Actions */}
            {selectedOfertas.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedOfertas.length} seleccionada(s)</span>
                <div className="flex-1" />
                {canDelete('ofertas') && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const nombres = ofertas
                        .filter(o => selectedOfertas.includes(o._id))
                        .map(o => o.nombre)
                      setDeleteDialog({ open: true, ofertaIds: selectedOfertas, ofertaNombres: nombres })
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
                        label="Tipo"
                        value={String(columnFilters.tipo || 'all')}
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: TipoOferta.NXM, label: 'NxM (3x2)' },
                          { value: TipoOferta.SEGUNDA_UNIDAD, label: '2a unidad' },
                          { value: TipoOferta.DESCUENTO_PORCENTAJE, label: 'Descuento %' },
                          { value: TipoOferta.PRECIO_ESPECIAL, label: 'Precio especial' },
                        ]}
                        onChange={(val) => handleColumnFilterChange('tipo', val)}
                      />
                    </th>
                  )}
                  {isColumnVisible('etiqueta') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Etiqueta
                    </th>
                  )}
                  {isColumnVisible('vigencia') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                      Vigencia
                    </th>
                  )}
                  {isColumnVisible('usos') && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                      Usos
                    </th>
                  )}
                  {isColumnVisible('activo') && (
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                      <TableSelect
                        label="Estado"
                        value={String(columnFilters.activo || 'true')}
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Activas' },
                          { value: 'false', label: 'Inactivas' },
                        ]}
                        onChange={(val) => handleColumnFilterChange('activo', val)}
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
                ) : ofertas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className={`px-4 text-center text-muted-foreground ${densityClasses.cell}`}>
                      No hay ofertas
                    </td>
                  </tr>
                ) : (
                  ofertas.map((oferta) => (
                    <tr key={oferta._id} className="hover:bg-muted/50">
                      <td className={`px-4 ${densityClasses.cell}`}>
                        <Checkbox
                          checked={selectedOfertas.includes(oferta._id)}
                          onCheckedChange={() => handleSelectOferta(oferta._id)}
                        />
                      </td>
                      {isColumnVisible('codigo') && (
                        <td className={`px-4 font-medium ${densityClasses.cell} ${densityClasses.text}`}>{oferta.codigo}</td>
                      )}
                      {isColumnVisible('nombre') && (
                        <td className={`px-4 ${densityClasses.cell} ${densityClasses.text}`}>{oferta.nombre}</td>
                      )}
                      {isColumnVisible('tipo') && (
                        <td className={`px-4 ${densityClasses.cell}`}>
                          <Badge variant="outline">{getTipoLabel(oferta.tipo)}</Badge>
                        </td>
                      )}
                      {isColumnVisible('etiqueta') && (
                        <td className={`px-4 ${densityClasses.cell}`}>
                          {oferta.etiqueta ? (
                            <Badge style={{ backgroundColor: oferta.color || '#3b82f6' }} className="text-white">
                              {oferta.etiqueta}
                            </Badge>
                          ) : '-'}
                        </td>
                      )}
                      {isColumnVisible('vigencia') && (
                        <td className={`px-4 text-muted-foreground ${densityClasses.cell} ${densityClasses.text}`}>
                          {formatDate(oferta.fechaDesde)}
                          {oferta.fechaHasta && ` - ${formatDate(oferta.fechaHasta)}`}
                        </td>
                      )}
                      {isColumnVisible('usos') && (
                        <td className={`px-4 text-center ${densityClasses.cell} ${densityClasses.text}`}>
                          {oferta.usosActuales}{oferta.usosMaximos ? `/${oferta.usosMaximos}` : ''}
                        </td>
                      )}
                      {isColumnVisible('activo') && (
                        <td className={`px-4 text-center ${densityClasses.cell}`}>
                          {oferta.activo ? (
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
                            <DropdownMenuItem onClick={() => router.push(`/ofertas/${oferta._id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/ofertas/${oferta._id}/editar`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicar(oferta._id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActivo(oferta)}>
                              {oferta.activo ? (
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
                            {canDelete('ofertas') && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, ofertaIds: [oferta._id], ofertaNombres: [oferta.nombre] })}
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
              Mostrando {ofertas.length} de {pagination.total} ofertas
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
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, ofertaIds: [], ofertaNombres: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Oferta{deleteDialog.ofertaIds.length > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              {deleteDialog.ofertaIds.length === 1
                ? `¿Estas seguro de que quieres eliminar la oferta "${deleteDialog.ofertaNombres[0]}"?`
                : `¿Estas seguro de que quieres eliminar ${deleteDialog.ofertaIds.length} ofertas?`}
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, ofertaIds: [], ofertaNombres: [] })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteDialog.ofertaIds)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
