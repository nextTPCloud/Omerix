'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { seriesDocumentosService } from '@/services/series-documentos.service'
import vistasService from '@/services/vistas-guardadas.service'
import {
  ISerieDocumento,
  CreateSerieDocumentoDTO,
  TipoDocumentoSerie,
  TIPOS_DOCUMENTO_OPTIONS,
  getTipoDocumentoLabel,
} from '@/types/serie-documento.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Star,
  RefreshCw,
  Hash,
  Settings,
  Eye,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'

// Componentes reutilizables
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { PrintButton } from '@/components/ui/PrintButton'
import { TableSelect } from '@/components/ui/tableSelect'

// ============================================
// HOOK PARA DEBOUNCE
// ============================================

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

// ============================================
// INTERFACES Y TIPOS
// ============================================

interface ColumnFilters {
  [key: string]: string | number | boolean
}

// ============================================
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO
// ============================================

const DEFAULT_SERIES_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'tipoDocumento', visible: true, orden: 2 },
    { key: 'prefijo', visible: true, orden: 3 },
    { key: 'previsualizacion', visible: true, orden: 4 },
    { key: 'siguienteNumero', visible: false, orden: 5 },
    { key: 'activo', visible: true, orden: 6 },
    { key: 'predeterminada', visible: true, orden: 7 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'codigo',
    direction: 'asc' as const,
  },
  columnFilters: {},
  paginacion: {
    limit: 25 as const,
  },
  densidad: 'normal' as const,
}

// ============================================
// VALORES POR DEFECTO PARA FORMULARIO
// ============================================

const defaultFormData: CreateSerieDocumentoDTO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipoDocumento: 'presupuesto',
  prefijo: '',
  sufijo: '',
  longitudNumero: 5,
  siguienteNumero: 1,
  incluirAnio: true,
  separadorAnio: '/',
  reiniciarAnualmente: true,
  activo: true,
  predeterminada: false,
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function SeriesDocumentosPage() {
  const isInitialLoad = useRef(true)

  // Estados de datos
  const [series, setSeries] = useState<ISerieDocumento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedSeries, setSelectedSeries] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  })

  // UI States
  const [showStats, setShowStats] = useState(false)

  // Estados del diálogo de edición/creación
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSerie, setEditingSerie] = useState<ISerieDocumento | null>(null)
  const [formData, setFormData] = useState<CreateSerieDocumentoDTO>(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)

  // Diálogo de eliminación
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    serieIds: string[]
    serieNombres: string[]
  }>({
    open: false,
    serieIds: [],
    serieNombres: [],
  })

  // Diálogo de previsualización
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean
    serie: ISerieDocumento | null
  }>({
    open: false,
    serie: null,
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'tipoDocumento', label: 'Tipo Documento', sortable: true },
    { key: 'prefijo', label: 'Prefijo', sortable: false },
    { key: 'previsualizacion', label: 'Previsualización', sortable: false },
    { key: 'siguienteNumero', label: 'Siguiente Nº', sortable: true },
    { key: 'activo', label: 'Activa', sortable: false },
    { key: 'predeterminada', label: 'Predeterminada', sortable: false },
  ])

  // Hook de configuración del módulo
  const {
    config: moduleConfig,
    updateColumnas,
    updateColumnFilters,
    updateSortConfig,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('series-documentos', DEFAULT_SERIES_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  // Derivar valores desde la configuración
  const columnas = useMemo(() => moduleConfig?.columnas || DEFAULT_SERIES_CONFIG.columnas, [moduleConfig])
  const sortConfig = useMemo(() => moduleConfig?.sortConfig || DEFAULT_SERIES_CONFIG.sortConfig, [moduleConfig])
  const columnFilters = useMemo(() => (moduleConfig?.columnFilters || DEFAULT_SERIES_CONFIG.columnFilters) as ColumnFilters, [moduleConfig])
  const densidad = useMemo(() => moduleConfig?.densidad || DEFAULT_SERIES_CONFIG.densidad, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  // ============================================
  // ESTADÍSTICAS CALCULADAS
  // ============================================

  const stats = useMemo(() => {
    if (!series || !Array.isArray(series)) {
      return {
        total: 0,
        activas: 0,
        inactivas: 0,
        predeterminadas: 0,
      }
    }

    const total = pagination?.total || series.length
    const activas = series.filter((s) => s?.activo).length
    const inactivas = series.filter((s) => !s?.activo).length
    const predeterminadas = series.filter((s) => s?.predeterminada).length

    return {
      total,
      activas,
      inactivas,
      predeterminadas,
    }
  }, [series, pagination?.total])

  // ============================================
  // CARGAR DATOS
  // ============================================

  const fetchSeries = useCallback(async () => {
    try {
      setIsLoading(true)

      const params: Record<string, string> = {
        page: String(pagination.page),
        limit: String(pagination.limit),
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      }

      if (searchTerm.trim()) {
        params.q = searchTerm.trim()
      }

      // Filtros de columna
      if (columnFilters.tipoDocumento && columnFilters.tipoDocumento !== '') {
        params.tipoDocumento = String(columnFilters.tipoDocumento)
      }

      if (columnFilters.activo && columnFilters.activo !== '' && columnFilters.activo !== 'all') {
        params.activo = String(columnFilters.activo)
      }

      if (columnFilters.predeterminada && columnFilters.predeterminada !== '' && columnFilters.predeterminada !== 'all') {
        params.predeterminada = String(columnFilters.predeterminada)
      }

      const response = await seriesDocumentosService.getAll(params)

      if (response.success) {
        setSeries(response.data || [])
        setPagination(prev => ({
          ...prev,
          total: response.total || response.data?.length || 0,
          pages: response.pages || Math.ceil((response.total || response.data?.length || 0) / prev.limit),
        }))
      }
    } catch (error: any) {
      console.error('Error al cargar series:', error)
      toast.error(error.response?.data?.message || 'Error al cargar series de documentos')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, sortConfig, searchTerm, columnFilters])

  // Cargar y aplicar vista por defecto al montar
  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('series-documentos', true)
        const vistaDefault = vistas?.find((v: any) => v.esDefault)

        if (vistaDefault && vistaDefault.configuracion) {
          if (vistaDefault.configuracion.columnas) {
            updateColumnas(vistaDefault.configuracion.columnas)
          }
          if (vistaDefault.configuracion.sortConfig) {
            updateSortConfig(vistaDefault.configuracion.sortConfig)
          }
          if (vistaDefault.configuracion.columnFilters) {
            updateColumnFilters(vistaDefault.configuracion.columnFilters)
          }
          if (vistaDefault.configuracion.paginacion) {
            setPagination(prev => ({ ...prev, limit: vistaDefault.configuracion.paginacion.limit }))
          }
          if (vistaDefault.configuracion.densidad) {
            updateDensidad(vistaDefault.configuracion.densidad)
          }
        }
      } catch (error) {
        console.error('Error al cargar vista por defecto:', error)
      }
    }

    cargarVistaDefault()
  }, [])

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }
    fetchSeries()
  }, [fetchSeries])

  useEffect(() => {
    fetchSeries()
  }, [])

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleSort = (key: string) => {
    const newDirection =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'

    updateSortConfig({
      key,
      direction: newDirection,
    })
  }

  const handleColumnFilterChange = (columnKey: string, value: string) => {
    const newFilters = { ...columnFilters, [columnKey]: value }
    updateColumnFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSeries([])
    } else {
      setSelectedSeries(series.map(s => s._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectSerie = (id: string) => {
    setSelectedSeries(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  // ============================================
  // CRUD HANDLERS
  // ============================================

  const handleOpenCreate = () => {
    setEditingSerie(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  const handleOpenEdit = (serie: ISerieDocumento) => {
    setEditingSerie(serie)
    setFormData({
      codigo: serie.codigo,
      nombre: serie.nombre,
      descripcion: serie.descripcion || '',
      tipoDocumento: serie.tipoDocumento,
      prefijo: serie.prefijo || '',
      sufijo: serie.sufijo || '',
      longitudNumero: serie.longitudNumero,
      siguienteNumero: serie.siguienteNumero,
      incluirAnio: serie.incluirAnio,
      separadorAnio: serie.separadorAnio,
      reiniciarAnualmente: serie.reiniciarAnualmente,
      activo: serie.activo,
      predeterminada: serie.predeterminada,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio')
      return
    }
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      setIsSaving(true)

      if (editingSerie) {
        const response = await seriesDocumentosService.update(editingSerie._id, formData)
        if (response.success) {
          toast.success('Serie actualizada correctamente')
          fetchSeries()
          setDialogOpen(false)
        }
      } else {
        const response = await seriesDocumentosService.create(formData)
        if (response.success) {
          toast.success('Serie creada correctamente')
          fetchSeries()
          setDialogOpen(false)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar serie')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await seriesDocumentosService.delete(id)
      }

      toast.success(`${ids.length} serie(s) eliminada(s)`)
      setSelectedSeries([])
      setSelectAll(false)
      setDeleteDialog({ open: false, serieIds: [], serieNombres: [] })
      fetchSeries()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar series')
    }
  }

  const handleSetPredeterminada = async (serie: ISerieDocumento) => {
    try {
      const response = await seriesDocumentosService.setPredeterminada(serie._id)
      if (response.success) {
        toast.success(`Serie "${serie.codigo}" establecida como predeterminada`)
        fetchSeries()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al establecer predeterminada')
    }
  }

  const handleDuplicar = async (serie: ISerieDocumento) => {
    try {
      const response = await seriesDocumentosService.duplicar(serie._id)
      if (response.success) {
        toast.success('Serie duplicada correctamente')
        fetchSeries()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al duplicar serie')
    }
  }

  const handleCrearPorDefecto = async () => {
    try {
      toast.loading('Creando series por defecto...')
      const response = await seriesDocumentosService.crearSeriesPorDefecto()
      toast.dismiss()
      if (response.success) {
        toast.success('Series por defecto creadas correctamente')
        fetchSeries()
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.error || 'Error al crear series por defecto')
    }
  }

  // ============================================
  // GENERAR PREVISUALIZACIÓN DEL CÓDIGO
  // ============================================

  const generarPrevisualizacion = () => {
    const anio = new Date().getFullYear()
    let codigo = ''

    if (formData.prefijo) {
      codigo += formData.prefijo
    }

    if (formData.incluirAnio) {
      codigo += anio.toString() + (formData.separadorAnio || '/')
    }

    codigo += (formData.siguienteNumero || 1)
      .toString()
      .padStart(formData.longitudNumero || 5, '0')

    if (formData.sufijo) {
      codigo += formData.sufijo
    }

    return codigo
  }

  const generarPrevisualizacionSerie = (serie: ISerieDocumento) => {
    const anio = new Date().getFullYear()
    let codigo = ''

    if (serie.prefijo) {
      codigo += serie.prefijo
    }

    if (serie.incluirAnio) {
      codigo += anio.toString() + (serie.separadorAnio || '/')
    }

    codigo += (serie.siguienteNumero || 1)
      .toString()
      .padStart(serie.longitudNumero || 5, '0')

    if (serie.sufijo) {
      codigo += serie.sufijo
    }

    return codigo
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Hash className="h-7 w-7 text-primary" />
              Series de Documentos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configura las series de numeración para presupuestos, pedidos, albaranes y facturas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleCrearPorDefecto}>
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Crear Por Defecto</span>
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nueva Serie</span>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
            <Card className="p-3 border-l-4 border-l-yellow-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Predeterminadas</p>
                  <p className="text-xl font-bold">{stats.predeterminadas}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Barra de herramientas */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código o nombre..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* MENÚ DE CONFIGURACIÓN */}
                <SettingsMenu
                  densidad={densidad}
                  onDensidadChange={(newDensity) => {
                    updateDensidad(newDensity)
                    toast.success(`Densidad cambiada a ${newDensity}`)
                  }}
                  modulo="series-documentos"
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
                          modulo: 'series-documentos',
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
                          modulo: 'series-documentos',
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
                      const columna = columnas?.find(c => c.key === col.key)
                      return (
                        <DropdownMenuCheckboxItem
                          key={col.key}
                          checked={columna?.visible ?? false}
                          onCheckedChange={(checked) => {
                            if (!columnas) return
                            const newColumnas = columnas.map(c =>
                              c.key === col.key ? { ...c, visible: checked } : c
                            )
                            updateColumnas(newColumnas)
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
                  data={series}
                  columns={(columnas || []).filter(c => c.visible).map(c => ({
                    key: c.key,
                    label: columnasDisponibles.find(cd => cd.key === c.key)?.label || c.key,
                  }))}
                  filename="series-documentos"
                />

                {/* IMPRIMIR */}
                <PrintButton
                  data={series}
                  columns={(columnas || []).filter(c => c.visible).map(c => ({
                    key: c.key,
                    label: columnasDisponibles.find(cd => cd.key === c.key)?.label || c.key,
                  }))}
                  title="Series de Documentos"
                />

                {/* ACTUALIZAR */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSeries()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 sm:mr-2 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              </div>
            </div>

            {/* Acciones en lote */}
            {selectedSeries.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  {selectedSeries.length} seleccionada(s)
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const seriesAEliminar = series.filter(s =>
                      selectedSeries.includes(s._id) && !s.predeterminada
                    )
                    if (seriesAEliminar.length === 0) {
                      toast.error('No se pueden eliminar series predeterminadas')
                      return
                    }
                    setDeleteDialog({
                      open: true,
                      serieIds: seriesAEliminar.map(s => s._id),
                      serieNombres: seriesAEliminar.map(s => `${s.codigo} - ${s.nombre}`),
                    })
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar seleccionadas
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Tabla */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className={`${densityClasses.header} text-left`}>
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  {(columnas || [])
                    .filter(c => c.visible)
                    .sort((a, b) => a.orden - b.orden)
                    .map((columna) => {
                      const colDef = columnasDisponibles.find(c => c.key === columna.key)
                      return (
                        <th
                          key={columna.key}
                          className={`${densityClasses.header} text-left`}
                        >
                          {colDef?.sortable ? (
                            <button
                              onClick={() => handleSort(columna.key)}
                              className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                            >
                              {colDef.label}
                              {sortConfig.key === columna.key && (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUp className="h-3 w-3 ml-1" />
                                ) : (
                                  <ArrowDown className="h-3 w-3 ml-1" />
                                )
                              )}
                              {sortConfig.key !== columna.key && (
                                <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
                              )}
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

                {/* Fila de filtros */}
                <tr className="border-b">
                  <th className={densityClasses.header}></th>
                  {(columnas || [])
                    .filter(c => c.visible)
                    .sort((a, b) => a.orden - b.orden)
                    .map((columna) => (
                      <th key={`filter-${columna.key}`} className={`${densityClasses.header}`}>
                        {columna.key === 'codigo' && (
                          <Input
                            placeholder="Filtrar..."
                            value={String(columnFilters[columna.key] || '')}
                            onChange={(e) => handleColumnFilterChange(columna.key, e.target.value)}
                            className="h-7 text-xs"
                          />
                        )}
                        {columna.key === 'nombre' && (
                          <Input
                            placeholder="Filtrar..."
                            value={String(columnFilters[columna.key] || '')}
                            onChange={(e) => handleColumnFilterChange(columna.key, e.target.value)}
                            className="h-7 text-xs"
                          />
                        )}
                        {columna.key === 'tipoDocumento' && (
                          <TableSelect
                            value={String(columnFilters[columna.key] || '')}
                            onValueChange={(value) => handleColumnFilterChange(columna.key, value)}
                            placeholder="Todos"
                            options={[
                              { value: '', label: 'Todos' },
                              ...TIPOS_DOCUMENTO_OPTIONS.map(t => ({
                                value: t.value,
                                label: t.label,
                              }))
                            ]}
                          />
                        )}
                        {columna.key === 'activo' && (
                          <TableSelect
                            value={String(columnFilters[columna.key] || '')}
                            onValueChange={(value) => handleColumnFilterChange(columna.key, value)}
                            placeholder="Todas"
                            options={[
                              { value: '', label: 'Todas' },
                              { value: 'true', label: 'Activas' },
                              { value: 'false', label: 'Inactivas' },
                            ]}
                          />
                        )}
                        {columna.key === 'predeterminada' && (
                          <TableSelect
                            value={String(columnFilters[columna.key] || '')}
                            onValueChange={(value) => handleColumnFilterChange(columna.key, value)}
                            placeholder="Todas"
                            options={[
                              { value: '', label: 'Todas' },
                              { value: 'true', label: 'Sí' },
                              { value: 'false', label: 'No' },
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
                    <td colSpan={(columnas || []).filter(c => c.visible).length + 2} className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : series.length === 0 ? (
                  <tr>
                    <td colSpan={(columnas || []).filter(c => c.visible).length + 2} className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
                      <p className="text-muted-foreground font-medium">No hay series configuradas</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crea una nueva serie o usa el botón "Crear Por Defecto"
                      </p>
                    </td>
                  </tr>
                ) : (
                  series.map((serie) => (
                    <tr
                      key={serie._id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className={densityClasses.cell}>
                        <Checkbox
                          checked={selectedSeries.includes(serie._id)}
                          onCheckedChange={() => handleSelectSerie(serie._id)}
                        />
                      </td>
                      {(columnas || [])
                        .filter(c => c.visible)
                        .sort((a, b) => a.orden - b.orden)
                        .map((columna) => (
                          <td key={`${serie._id}-${columna.key}`} className={`${densityClasses.cell} ${densityClasses.text}`}>
                            {columna.key === 'codigo' && (
                              <span className="font-mono font-bold">{serie.codigo}</span>
                            )}
                            {columna.key === 'nombre' && (
                              <div>
                                <p className="font-medium">{serie.nombre}</p>
                                {serie.descripcion && (
                                  <p className="text-xs text-muted-foreground">{serie.descripcion}</p>
                                )}
                              </div>
                            )}
                            {columna.key === 'tipoDocumento' && (
                              <Badge variant="outline">
                                {getTipoDocumentoLabel(serie.tipoDocumento)}
                              </Badge>
                            )}
                            {columna.key === 'prefijo' && (
                              <span className="font-mono">{serie.prefijo || '-'}</span>
                            )}
                            {columna.key === 'previsualizacion' && (
                              <span className="font-mono text-sm">
                                {serie.previsualizacion || generarPrevisualizacionSerie(serie)}
                              </span>
                            )}
                            {columna.key === 'siguienteNumero' && (
                              <span className="font-mono">{serie.siguienteNumero}</span>
                            )}
                            {columna.key === 'activo' && (
                              <Badge variant={serie.activo ? 'default' : 'secondary'}>
                                {serie.activo ? 'Activa' : 'Inactiva'}
                              </Badge>
                            )}
                            {columna.key === 'predeterminada' && (
                              serie.predeterminada ? (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )
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
                            <DropdownMenuItem onClick={() => setPreviewDialog({ open: true, serie })}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(serie)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicar(serie)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            {!serie.predeterminada && (
                              <DropdownMenuItem onClick={() => handleSetPredeterminada(serie)}>
                                <Star className="mr-2 h-4 w-4" />
                                Establecer predeterminada
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  serieIds: [serie._id],
                                  serieNombres: [`${serie.codigo} - ${serie.nombre}`],
                                })
                              }
                              disabled={serie.predeterminada}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
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

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} series
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagination(prev => ({ ...prev, page: pagination.pages }))}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* DIÁLOGO DE CREACIÓN/EDICIÓN */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSerie ? 'Editar Serie' : 'Nueva Serie de Documentos'}
            </DialogTitle>
            <DialogDescription>
              {editingSerie
                ? 'Modifica los datos de la serie de documentos'
                : 'Configura una nueva serie de numeración para documentos'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Fila 1: Código, Nombre, Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                  }
                  placeholder="A, B, FC..."
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Serie Principal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">Tipo de Documento</Label>
                <Select
                  value={formData.tipoDocumento}
                  onValueChange={(v) =>
                    setFormData({ ...formData, tipoDocumento: v as TipoDocumentoSerie })
                  }
                  disabled={!!editingSerie}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO_OPTIONS.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fila 2: Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional..."
              />
            </div>

            {/* Fila 3: Formato del código */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefijo">Prefijo</Label>
                <Input
                  id="prefijo"
                  value={formData.prefijo}
                  onChange={(e) =>
                    setFormData({ ...formData, prefijo: e.target.value.toUpperCase() })
                  }
                  placeholder="PRES, FAC..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sufijo">Sufijo</Label>
                <Input
                  id="sufijo"
                  value={formData.sufijo}
                  onChange={(e) => setFormData({ ...formData, sufijo: e.target.value })}
                  placeholder="Opcional..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitudNumero">Longitud Número</Label>
                <Input
                  id="longitudNumero"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.longitudNumero}
                  onChange={(e) =>
                    setFormData({ ...formData, longitudNumero: parseInt(e.target.value) || 5 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siguienteNumero">Siguiente Número</Label>
                <Input
                  id="siguienteNumero"
                  type="number"
                  min={1}
                  value={formData.siguienteNumero}
                  onChange={(e) =>
                    setFormData({ ...formData, siguienteNumero: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            {/* Fila 4: Opciones de año */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="flex items-center space-x-2">
                <Switch
                  id="incluirAnio"
                  checked={formData.incluirAnio}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, incluirAnio: checked })
                  }
                />
                <Label htmlFor="incluirAnio">Incluir año</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="separadorAnio">Separador Año</Label>
                <Input
                  id="separadorAnio"
                  value={formData.separadorAnio}
                  onChange={(e) => setFormData({ ...formData, separadorAnio: e.target.value })}
                  placeholder="/, -, etc."
                  maxLength={5}
                  disabled={!formData.incluirAnio}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="reiniciarAnualmente"
                  checked={formData.reiniciarAnualmente}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, reiniciarAnualmente: checked })
                  }
                />
                <Label htmlFor="reiniciarAnualmente">Reiniciar cada año</Label>
              </div>
            </div>

            {/* Fila 5: Estado y Predeterminada */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Serie activa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="predeterminada"
                  checked={formData.predeterminada}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, predeterminada: checked })
                  }
                />
                <Label htmlFor="predeterminada">Predeterminada</Label>
              </div>
            </div>

            {/* Previsualización */}
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Previsualización del código:</p>
                  <p className="text-2xl font-mono font-bold">{generarPrevisualizacion()}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Próximo número: {formData.siguienteNumero}
                </Badge>
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : editingSerie ? (
                'Guardar Cambios'
              ) : (
                'Crear Serie'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE ELIMINACIÓN */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, serieIds: [], serieNombres: [] })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar {deleteDialog.serieIds.length === 1 ? 'esta serie' : 'estas series'}?
              {deleteDialog.serieNombres.length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {deleteDialog.serieNombres.map((nombre, i) => (
                    <li key={i}>{nombre}</li>
                  ))}
                </ul>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, serieIds: [], serieNombres: [] })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteDialog.serieIds)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE DETALLES */}
      <Dialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog({ open, serie: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de Serie</DialogTitle>
          </DialogHeader>
          {previewDialog.serie && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-bold font-mono">{previewDialog.serie.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{previewDialog.serie.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo Documento</p>
                  <p>{getTipoDocumentoLabel(previewDialog.serie.tipoDocumento)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximo Número</p>
                  <p className="font-bold">{previewDialog.serie.siguienteNumero}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prefijo</p>
                  <p>{previewDialog.serie.prefijo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sufijo</p>
                  <p>{previewDialog.serie.sufijo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Incluir Año</p>
                  <p>{previewDialog.serie.incluirAnio ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reiniciar Anualmente</p>
                  <p>{previewDialog.serie.reiniciarAnualmente ? 'Sí' : 'No'}</p>
                </div>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">Previsualización:</p>
                <p className="text-2xl font-mono font-bold">
                  {previewDialog.serie.previsualizacion || generarPrevisualizacionSerie(previewDialog.serie)}
                </p>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialog({ open: false, serie: null })}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
