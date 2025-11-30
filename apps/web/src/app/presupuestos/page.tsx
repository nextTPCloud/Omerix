'use client'

import { useState, useEffect, useCallback, useMemo, useRef  } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { presupuestosService } from '@/services/presupuestos.service'
import vistasService from '@/services/vistas-guardadas.service'
import {
  IPresupuesto,
  ESTADOS_PRESUPUESTO,
  EstadoPresupuesto,
  getEstadoConfig,
} from '@/types/presupuesto.types'
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
  Upload,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'

// NUEVOS IMPORTS
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

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
  [key: string]: string
}

// ============================================
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO PRESUPUESTOS
// ============================================

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'clienteNombre', visible: true, orden: 1 },
    { key: 'titulo', visible: true, orden: 2 },
    { key: 'estado', visible: true, orden: 3 },
    { key: 'fecha', visible: true, orden: 4 },
    { key: 'fechaValidez', visible: true, orden: 5 },
    { key: 'totalPresupuesto', visible: true, orden: 6 },
    { key: 'diasParaCaducar', visible: true, orden: 7 },
    { key: 'agenteComercial', visible: false, orden: 8 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'fechaCreacion',
    direction: 'desc' as const,
  },
  columnFilters: {
    activo: 'true',
  },
  paginacion: {
    limit: 25 as const,
  },
  densidad: 'normal' as const,
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PresupuestosPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  // Estados de datos
  const [presupuestos, setPresupuestos] = useState<IPresupuesto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedPresupuestos, setSelectedPresupuestos] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Filtros generales
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 25,
    sortBy: 'fechaCreacion',
    sortOrder: 'desc',
    activo: true,
  })

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  })

  // UI States
  const [showStats, setShowStats] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    presupuestoIds: string[]
    presupuestoCodigos: string[]
  }>({
    open: false,
    presupuestoIds: [],
    presupuestoCodigos: [],
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'clienteNombre', label: 'Cliente', sortable: true },
    { key: 'titulo', label: 'Título', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'fechaValidez', label: 'Válido Hasta', sortable: true },
    { key: 'totalPresupuesto', label: 'Importe Total', sortable: true },
    { key: 'diasParaCaducar', label: 'Días Para Caducar', sortable: false },
    { key: 'agenteComercial', label: 'Agente Comercial', sortable: true },
  ])

// ============================================
// CONFIGURACIÓN DEL MÓDULO
// ============================================

const {
  config: moduleConfig,
  isLoading: isLoadingConfig,
  updateColumnas,
  updateSortConfig,
  updateColumnFilters,
  updateDensidad,
  resetConfig,
} = useModuleConfig('presupuestos', DEFAULT_CONFIG, {
  autoSave: true,
  debounceMs: 1000,
})

  // ============================================
  // DERIVAR VALORES DESDE LA CONFIGURACIÓN
  // ============================================

  const columnasVisibles = useMemo(() => {
    if (!moduleConfig) return []
    return moduleConfig.columnas
      .filter((col) => col.visible)
      .sort((a, b) => a.orden - b.orden)
      .map((col) => col.key)
  }, [moduleConfig])

  const sortConfig = useMemo(() => {
    return moduleConfig?.sortConfig || DEFAULT_CONFIG.sortConfig
  }, [moduleConfig])

  const currentSortKey = useMemo(() => sortConfig.key, [sortConfig.key])
  const currentSortDirection = useMemo(() => sortConfig.direction, [sortConfig.direction])
  const currentLimit = useMemo(() => moduleConfig?.paginacion?.limit || 25, [moduleConfig?.paginacion?.limit])

  // DENSIDAD Y CLASES
  const densidad = useMemo(() => {
    return moduleConfig?.densidad || 'normal'
  }, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  // ============================================
  // ESTADÍSTICAS CALCULADAS
  // ============================================

  const stats = useMemo(() => {
    if (!presupuestos || !Array.isArray(presupuestos)) {
      return {
        total: 0,
        borradores: 0,
        enviados: 0,
        aceptados: 0,
        rechazados: 0,
        totalImporte: 0,
        tasaConversion: 0,
      }
    }

    const total = pagination?.total || 0
    const borradores = presupuestos.filter((p) => p?.estado === EstadoPresupuesto.BORRADOR).length
    const enviados = presupuestos.filter((p) => p?.estado === EstadoPresupuesto.ENVIADO || p?.estado === EstadoPresupuesto.PENDIENTE).length
    const aceptados = presupuestos.filter((p) => p?.estado === EstadoPresupuesto.ACEPTADO).length
    const rechazados = presupuestos.filter((p) => p?.estado === EstadoPresupuesto.RECHAZADO).length
    const totalImporte = presupuestos.reduce((sum, p) => sum + (p?.totales?.totalPresupuesto || 0), 0)
    const tasaConversion = enviados > 0 ? (aceptados / enviados) * 100 : 0

    return {
      total,
      borradores,
      enviados,
      aceptados,
      rechazados,
      totalImporte,
      tasaConversion,
    }
  }, [presupuestos, pagination?.total])

  // ============================================
  // CARGAR PRESUPUESTOS
  // ============================================

  const cargarPresupuestos = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await presupuestosService.getAll(filters)

      if (response.success) {
        setPresupuestos(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setPresupuestos([])
        toast.error('Error al cargar los presupuestos')
      }
    } catch (error) {
      console.error('Error al cargar presupuestos:', error)
      setPresupuestos([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los presupuestos')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarPresupuestos()
  }, [cargarPresupuestos])

  // ============================================
  // APLICAR FILTROS DEBOUNCED (SIN GUARDAR)
  // ============================================

  useEffect(() => {
    console.log('📊 Filtros debounced cambiaron:', debouncedColumnFilters)

    // Construir filtros combinados
    const combinedFilters: any = {
      page: 1,
      sortBy: currentSortKey,
      sortOrder: currentSortDirection,
      limit: currentLimit,
    }

    // Campos de búsqueda por texto
    const searchableFields = ['codigo', 'clienteNombre', 'titulo', 'agenteComercial']
    const searchTerms: string[] = []

    searchableFields.forEach(field => {
      if (debouncedColumnFilters[field]) {
        searchTerms.push(debouncedColumnFilters[field])
      }
    })

    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }

    // Filtros de select y fechas
    Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
      if (key === 'estado') {
        if (value !== 'all') {
          combinedFilters.estado = value
        }
      } else if (key === 'activo') {
        if (value !== 'all') {
          combinedFilters.activo = value === 'true'
        }
      } else if (key === 'fechaDesde') {
        if (value) {
          combinedFilters.fechaDesde = value
        }
      } else if (key === 'fechaHasta') {
        if (value) {
          combinedFilters.fechaHasta = value
        }
      } else if (key === 'importeMinimo') {
        if (value) {
          combinedFilters.importeMinimo = parseFloat(value)
        }
      } else if (key === 'diasCaducidad') {
        if (value && value !== 'all') {
          combinedFilters.diasCaducidad = value
        }
      }
    })

    console.log('🔄 Aplicando filtros:', combinedFilters)
    setFilters(combinedFilters)

  }, [debouncedColumnFilters, currentSortKey, currentSortDirection, currentLimit])

  // ============================================
  // SINCRONIZAR CONFIGURACIÓN GUARDADA CON FILTROS (SOLO CARGA INICIAL)
  // ============================================
  useEffect(() => {
    if (!moduleConfig || isLoadingConfig) return
    if (!isInitialLoad.current) return

    console.log('🔄 Carga inicial - Aplicando configuración guardada')

    const initialFilters = (moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0)
      ? moduleConfig.columnFilters
      : { activo: 'true' }

    setColumnFiltersInput(initialFilters as any)
    isInitialLoad.current = false

  }, [moduleConfig, isLoadingConfig])

  // ============================================
  // HANDLERS PARA VISTAS GUARDADAS
  // ============================================

  const handleAplicarVista = useCallback((configuracion: any) => {
    console.log('📄 Aplicando vista guardada:', configuracion)

    // Aplicar todas las propiedades de la configuración
    if (configuracion.columnas) {
      updateColumnas(configuracion.columnas)
    }

    if (configuracion.sortConfig) {
      updateSortConfig(configuracion.sortConfig)
    }

    if (configuracion.columnFilters) {
      setColumnFiltersInput(configuracion.columnFilters as any)
    }

    if (configuracion.densidad) {
      updateDensidad(configuracion.densidad)
    }

    if (configuracion.paginacion?.limit) {
      setFilters((prev: any) => ({ ...prev, limit: configuracion.paginacion.limit }))
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
      console.log('💾 Guardando vista:', { nombre, descripcion, esDefault, vistaIdActualizar, config: moduleConfig })

      if (vistaIdActualizar) {
        // Actualizar vista existente
        await vistasService.update(vistaIdActualizar, {
          modulo: 'presupuestos',
          nombre,
          descripcion,
          configuracion: moduleConfig,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        // Crear nueva vista
        await vistasService.create({
          modulo: 'presupuestos',
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

  // Cargar y aplicar vista por defecto al iniciar
  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('presupuestos', true)
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

  // ============================================
  // MANEJADORES DE EVENTOS
  // ============================================

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setFilters((prev: any) => ({
      ...prev,
      search: value,
      page: 1,
    }))
  }

  const handleSort = (key: string) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'

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

  // ============================================
  // FILTROS POR COLUMNA CON DEBOUNCE
  // ============================================

  const handleColumnFilterInput = (column: string, value: string) => {
    console.log(`🔍 Cambio filtro columna: ${column} = ${value}`)

    const newFilters = { ...columnFiltersInput }

    if (value === '' || value === 'all') {
      delete newFilters[column]
    } else {
      newFilters[column] = value
    }

    setColumnFiltersInput(newFilters)
  }

  // ============================================
  // SELECCIÓN MÚLTIPLE
  // ============================================

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPresupuestos([])
    } else {
      setSelectedPresupuestos(presupuestos.map(p => p._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectPresupuesto = (presupuestoId: string) => {
    if (selectedPresupuestos.includes(presupuestoId)) {
      setSelectedPresupuestos(selectedPresupuestos.filter(id => id !== presupuestoId))
    } else {
      setSelectedPresupuestos([...selectedPresupuestos, presupuestoId])
    }
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
        if (selectedPresupuestos.length > 0) {
          const codigosSeleccionados = presupuestos
            .filter(p => selectedPresupuestos.includes(p._id))
            .map(p => p.codigo)

          setDeleteDialog({
            open: true,
            presupuestoIds: selectedPresupuestos,
            presupuestoCodigos: codigosSeleccionados,
          })
        }
        break
    }
  }

  const handleExportSelected = () => {
    const selectedData = presupuestos.filter(p => selectedPresupuestos.includes(p._id))
    toast.success('Presupuestos exportados correctamente')
  }

  // ============================================
  // ELIMINAR PRESUPUESTOS
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.presupuestoIds.length === 1) {
        await presupuestosService.delete(deleteDialog.presupuestoIds[0])
      } else {
        await presupuestosService.deleteMany(deleteDialog.presupuestoIds)
      }

      toast.success('Presupuesto(s) eliminado(s) correctamente')
      cargarPresupuestos()
      setSelectedPresupuestos([])
      setSelectAll(false)
      setDeleteDialog({ open: false, presupuestoIds: [], presupuestoCodigos: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // ACCIONES POR PRESUPUESTO
  // ============================================

  const handlePresupuestoAction = async (presupuestoId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/presupuestos/${presupuestoId}`)
        break
      case 'edit':
        router.push(`/presupuestos/${presupuestoId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando presupuesto...')
          const response = await presupuestosService.duplicar(presupuestoId)
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Presupuesto duplicado correctamente')
            router.push(`/presupuestos/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar el presupuesto')
        }
        break
      case 'delete':
        const presupuesto = presupuestos.find(p => p._id === presupuestoId)
        if (presupuesto) {
          setDeleteDialog({
            open: true,
            presupuestoIds: [presupuestoId],
            presupuestoCodigos: [presupuesto.codigo],
          })
        }
        break
      case 'enviar':
        try {
          await presupuestosService.enviar(presupuestoId)
          toast.success('Presupuesto marcado como enviado')
          cargarPresupuestos()
        } catch (error) {
          toast.error('Error al enviar presupuesto')
        }
        break
      case 'aceptar':
        try {
          await presupuestosService.aceptar(presupuestoId)
          toast.success('Presupuesto aceptado')
          cargarPresupuestos()
        } catch (error) {
          toast.error('Error al aceptar presupuesto')
        }
        break
      case 'rechazar':
        try {
          await presupuestosService.rechazar(presupuestoId)
          toast.success('Presupuesto rechazado')
          cargarPresupuestos()
        } catch (error) {
          toast.error('Error al rechazar presupuesto')
        }
        break
      default:
        toast.info(`Acción "${action}" en desarrollo`)
    }
  }

  // ============================================
  // GESTIÓN DE COLUMNAS
  // ============================================
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

  // ============================================
  // PAGINACIÓN INTELIGENTE
  // ============================================

  // Generar números de página con ellipsis
  const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
    const pages: (number | string)[] = []
    const maxVisible = 7 // Número máximo de botones visibles

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Páginas alrededor de la actual
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Siempre mostrar última página
      pages.push(totalPages)
    }

    return pages
  }

  // Cambiar límite de registros por página
  const handleLimitChange = (newLimit: number) => {
    setFilters((prev: any) => ({
      ...prev,
      limit: newLimit,
      page: 1, // Resetear a página 1
    }))
    toast.success(`Mostrando ${newLimit} registros por página`)
  }

  // ============================================
  // HELPERS
  // ============================================

  const getClienteNombre = (clienteId: any, clienteNombre: string) => {
    if (typeof clienteId === 'object' && clienteId !== null) {
      return clienteId.nombreComercial || clienteId.nombre
    }
    return clienteNombre || '-'
  }

  const getAgenteNombre = (agenteId: any) => {
    if (typeof agenteId === 'object' && agenteId !== null) {
      return `${agenteId.nombre} ${agenteId.apellidos || ''}`.trim()
    }
    return '-'
  }

  const formatFecha = (fecha: any) => {
    if (!fecha) return '-'
    try {
      return new Date(fecha).toLocaleDateString('es-ES')
    } catch {
      return '-'
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
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
              <FileText className="h-7 w-7 text-primary" />
              Presupuestos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tus presupuestos y ofertas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarPresupuestos}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/presupuestos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Presupuesto</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-gray-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                  <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Borradores</p>
                  <p className="text-xl font-bold">{stats.borradores}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-yellow-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Send className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Enviados</p>
                  <p className="text-xl font-bold">{stats.enviados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Aceptados</p>
                  <p className="text-xl font-bold">{stats.aceptados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Importe Total</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalImporte)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Conversión</p>
                  <p className="text-xl font-bold">{stats.tasaConversion.toFixed(1)}%</p>
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
              placeholder="Buscar por código, cliente, título..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {/* MENÚ DE CONFIGURACIÓN (Densidad + Vistas + Restablecer) */}
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(newDensity) => {
                updateDensidad(newDensity)
                toast.success(`Densidad cambiada a ${newDensity}`)
              }}
              modulo="presupuestos"
              configuracionActual={moduleConfig}
              onAplicarVista={handleAplicarVista}
              onGuardarVista={handleGuardarVista}
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

            {/* EXPORTACIÓN */}
            <ExportButton
              data={presupuestos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="presupuestos"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Borradores', value: stats.borradores },
                { label: 'Enviados', value: stats.enviados },
                { label: 'Aceptados', value: stats.aceptados },
                { label: 'Rechazados', value: stats.rechazados },
                { label: 'Importe Total', value: formatCurrency(stats.totalImporte) },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={presupuestos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Presupuestos"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Borradores', value: stats.borradores },
                { label: 'Enviados', value: stats.enviados },
                { label: 'Aceptados', value: stats.aceptados },
              ]}
              filters={columnFiltersInput}
            />

            {/* IMPORTAR */}
            <Button variant="outline" size="sm" onClick={() => toast.info('Importación en desarrollo')}>
              <Upload className="h-4 w-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedPresupuestos.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedPresupuestos.length} {selectedPresupuestos.length === 1 ? 'presupuesto seleccionado' : 'presupuestos seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </Card>
        )}

        {/* TABLA PROFESIONAL CON DENSIDAD */}
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* HEADERS - SOLO TÍTULOS Y SORT */}
                <tr className="border-b bg-muted/50">
                  <th className={`${densityClasses.header} sticky left-0 z-30 bg-muted/50 backdrop-blur-sm text-left w-10`}>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </div>
                  </th>

                  {columnasVisibles.includes('codigo') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button
                        onClick={() => handleSort('codigo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Código
                        {getSortIcon('codigo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('clienteNombre') && (
                    <th className={`${densityClasses.header} text-left w-[200px]`}>
                      <button
                        onClick={() => handleSort('clienteNombre')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Cliente
                        {getSortIcon('clienteNombre')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('titulo') && (
                    <th className={`${densityClasses.header} text-left w-[220px]`}>
                      <button
                        onClick={() => handleSort('titulo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Título
                        {getSortIcon('titulo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('estado') && (
                    <th className={`${densityClasses.header} text-left min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('estado')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Estado
                        {getSortIcon('estado')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('fecha') && (
                    <th className={`${densityClasses.header} text-left min-w-[110px]`}>
                      <button
                        onClick={() => handleSort('fecha')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Fecha
                        {getSortIcon('fecha')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('fechaValidez') && (
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('fechaValidez')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Válido Hasta
                        {getSortIcon('fechaValidez')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('totalPresupuesto') && (
                    <th className={`${densityClasses.header} text-right min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('totales.totalPresupuesto')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Importe Total
                        {getSortIcon('totales.totalPresupuesto')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('diasParaCaducar') && (
                    <th className={`${densityClasses.header} text-center min-w-[100px] text-xs font-semibold uppercase tracking-wider`}>
                      Días Caducar
                    </th>
                  )}

                  {columnasVisibles.includes('agenteComercial') && (
                    <th className={`${densityClasses.header} text-left min-w-[160px]`}>
                      <button
                        onClick={() => handleSort('agenteComercialId')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Agente Comercial
                        {getSortIcon('agenteComercialId')}
                      </button>
                    </th>
                  )}

                  <th className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 backdrop-blur-sm text-right min-w-[70px] text-xs font-semibold uppercase tracking-wider`}>
                    Acciones
                  </th>
                </tr>

                {/* FILTROS */}
                <tr className="border-b bg-background">
                  <th className="sticky left-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>

                  {columnasVisibles.includes('codigo') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.codigo || ''}
                        onChange={(e) => handleColumnFilterInput('codigo', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('clienteNombre') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.clienteNombre || ''}
                        onChange={(e) => handleColumnFilterInput('clienteNombre', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('titulo') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.titulo || ''}
                        onChange={(e) => handleColumnFilterInput('titulo', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('estado') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.estado || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('estado', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          ...ESTADOS_PRESUPUESTO.map(e => ({ value: e.value, label: e.label }))
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('fecha') && (
                    <th className="px-3 py-1.5">
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={columnFiltersInput.fechaDesde || ''}
                        onChange={(e) => handleColumnFilterInput('fechaDesde', e.target.value)}
                        title="Fecha desde"
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('fechaValidez') && (
                    <th className="px-3 py-1.5">
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={columnFiltersInput.fechaHasta || ''}
                        onChange={(e) => handleColumnFilterInput('fechaHasta', e.target.value)}
                        title="Válido hasta"
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('totalPresupuesto') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Min..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        type="number"
                        value={columnFiltersInput.importeMinimo || ''}
                        onChange={(e) => handleColumnFilterInput('importeMinimo', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('diasParaCaducar') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.diasCaducidad || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('diasCaducidad', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'caducados', label: 'Caducados' },
                          { value: 'proximos', label: 'Próximos 7 días' },
                          { value: 'vigentes', label: 'Vigentes' },
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('agenteComercial') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.agenteComercial || ''}
                        onChange={(e) => handleColumnFilterInput('agenteComercial', e.target.value)}
                      />
                    </th>
                  )}

                  <th className="sticky right-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando presupuestos...
                    </td>
                  </tr>
                ) : presupuestos.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron presupuestos</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo presupuesto</p>
                    </td>
                  </tr>
                ) : (
                  presupuestos.map((presupuesto) => (
                    <tr
                      key={presupuesto._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedPresupuestos.includes(presupuesto._id)}
                            onCheckedChange={() => handleSelectPresupuesto(presupuesto._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.includes('codigo') && (
                        <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>{presupuesto.codigo}</td>
                      )}

                      {columnasVisibles.includes('clienteNombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <div className="max-w-[200px] truncate" title={getClienteNombre(presupuesto.clienteId, presupuesto.clienteNombre)}>
                            {getClienteNombre(presupuesto.clienteId, presupuesto.clienteNombre)}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('titulo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          <div className="max-w-[220px] truncate" title={presupuesto.titulo || ''}>
                            {presupuesto.titulo || '-'}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('estado') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge className={`text-xs font-medium ${getEstadoConfig(presupuesto.estado).color}`}>
                            {getEstadoConfig(presupuesto.estado).label}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('fecha') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {formatFecha(presupuesto.fecha)}
                        </td>
                      )}

                      {columnasVisibles.includes('fechaValidez') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {formatFecha(presupuesto.fechaValidez)}
                        </td>
                      )}

                      {columnasVisibles.includes('totalPresupuesto') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold`}>
                          {formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}
                        </td>
                      )}

                      {columnasVisibles.includes('diasParaCaducar') && (
                        <td className={`${densityClasses.cell} text-center ${densityClasses.text}`}>
                          {presupuesto.diasParaCaducar !== null && presupuesto.diasParaCaducar !== undefined ? (
                            <span className={`font-medium ${
                              presupuesto.diasParaCaducar < 0
                                ? 'text-red-600 dark:text-red-400'
                                : presupuesto.diasParaCaducar <= 7
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-green-600 dark:text-green-400'
                            }`}>
                              {presupuesto.diasParaCaducar}
                            </span>
                          ) : '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('agenteComercial') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {getAgenteNombre(presupuesto.agenteComercialId)}
                        </td>
                      )}

                      <td className={`${densityClasses.cell} sticky right-0 z-20 bg-background group-hover:bg-muted/30 transition-colors text-right`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'edit')}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'duplicate')}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>

                            {presupuesto.estado === EstadoPresupuesto.BORRADOR && (
                              <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'enviar')}>
                                <Send className="mr-2 h-4 w-4" />
                                Marcar como Enviado
                              </DropdownMenuItem>
                            )}

                            {(presupuesto.estado === EstadoPresupuesto.ENVIADO || presupuesto.estado === EstadoPresupuesto.PENDIENTE) && (
                              <>
                                <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'aceptar')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Aceptar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'rechazar')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Rechazar
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handlePresupuestoAction(presupuesto._id, 'delete')}
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
        </Card>

        {/* PAGINACIÓN PROFESIONAL */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* SELECTOR DE REGISTROS POR PÁGINA */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => handleLimitChange(Number(value))}
                >
                  <SelectTrigger className="w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-[80px] w-auto">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  de <span className="font-medium">{pagination.total}</span> registros
                </span>
              </div>

              {/* INFORMACIÓN DEL RANGO */}
              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                {' '}(Página <span className="font-medium">{pagination.page}</span> de{' '}
                <span className="font-medium">{pagination.pages}</span>)
              </div>

              {/* NAVEGACIÓN DE PÁGINAS */}
              <div className="flex items-center gap-1">
                {/* Primera página */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: 1 }))}
                  disabled={pagination.page === 1}
                  className="h-9 w-9 p-0"
                  title="Primera página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Página anterior */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                  disabled={pagination.page === 1}
                  className="h-9 w-9 p-0"
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Números de página con ellipsis */}
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
                      onClick={() => setFilters((prev: any) => ({ ...prev, page }))}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}

                {/* Página siguiente */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="h-9 w-9 p-0"
                  title="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Última página */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: pagination.pages }))}
                  disabled={pagination.page === pagination.pages}
                  className="h-9 w-9 p-0"
                  title="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* DIALOG DE CONFIRMACIÓN PARA ELIMINAR */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) =>
          setDeleteDialog({ ...deleteDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.presupuestoIds.length === 1
                  ? 'el siguiente presupuesto'
                  : `los siguientes ${deleteDialog.presupuestoIds.length} presupuestos`}?
                <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {deleteDialog.presupuestoCodigos.map((codigo, index) => (
                    <li key={index} className="text-sm font-medium">• {codigo}</li>
                  ))}
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, presupuestoIds: [], presupuestoCodigos: [] })}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
