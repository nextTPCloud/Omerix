'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { tiposImpuestoService } from '@/services/tipos-impuesto.service'
import vistasService from '@/services/vistas-guardadas.service'
import { TipoImpuesto } from '@/types/tipo-impuesto.types'
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
  Percent,
  AlertCircle,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  CheckCircle,
  XCircle,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'

// Componentes UI
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

interface TiposImpuestoFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  tipo?: 'IVA' | 'IGIC' | 'IPSI' | 'OTRO'
  activo?: boolean
  predeterminado?: boolean
  recargoEquivalencia?: boolean
}

// ============================================
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO
// ============================================

const DEFAULT_TIPOS_IMPUESTO_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'descripcion', visible: true, orden: 2 },
    { key: 'tipo', visible: true, orden: 3 },
    { key: 'porcentaje', visible: true, orden: 4 },
    { key: 'recargoEquivalencia', visible: true, orden: 5 },
    { key: 'porcentajeRecargo', visible: false, orden: 6 },
    { key: 'activo', visible: true, orden: 7 },
    { key: 'predeterminado', visible: true, orden: 8 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'createdAt',
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

export default function TiposImpuestoPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  // Estados de datos
  const [tiposImpuesto, setTiposImpuesto] = useState<TipoImpuesto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedTipos, setSelectedTipos] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Filtros generales
  const [filters, setFilters] = useState<TiposImpuestoFilters>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
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
    tipoIds: string[]
    tipoNombres: string[]
  }>({
    open: false,
    tipoIds: [],
    tipoNombres: [],
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'descripcion', label: 'Descripción', sortable: false },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'porcentaje', label: 'Porcentaje', sortable: true },
    { key: 'recargoEquivalencia', label: 'Recargo Equiv.', sortable: true },
    { key: 'porcentajeRecargo', label: '% Recargo', sortable: true },
    { key: 'activo', label: 'Estado', sortable: true },
    { key: 'predeterminado', label: 'Predeterminado', sortable: true },
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
} = useModuleConfig('tipos-impuesto', DEFAULT_TIPOS_IMPUESTO_CONFIG, {
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
    return moduleConfig?.sortConfig || DEFAULT_TIPOS_IMPUESTO_CONFIG.sortConfig
  }, [moduleConfig])

  const currentSortKey = useMemo(() => sortConfig.key, [sortConfig.key])
  const currentSortDirection = useMemo(() => sortConfig.direction, [sortConfig.direction])
  const currentLimit = useMemo(() => moduleConfig?.paginacion?.limit || 25, [moduleConfig?.paginacion?.limit])

  // Densidad y clases
  const densidad = useMemo(() => {
    return moduleConfig?.densidad || 'normal'
  }, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  // ============================================
  // ESTADÍSTICAS CALCULADAS
  // ============================================

  const stats = useMemo(() => {
    if (!tiposImpuesto || !Array.isArray(tiposImpuesto)) {
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        iva: 0,
        igic: 0,
        ipsi: 0,
        otro: 0,
        conRecargo: 0,
        predeterminados: 0,
      }
    }

    const total = pagination?.total || 0
    const activos = tiposImpuesto.filter((t) => t?.activo).length
    const inactivos = tiposImpuesto.filter((t) => !t?.activo).length
    const iva = tiposImpuesto.filter((t) => t?.tipo === 'IVA').length
    const igic = tiposImpuesto.filter((t) => t?.tipo === 'IGIC').length
    const ipsi = tiposImpuesto.filter((t) => t?.tipo === 'IPSI').length
    const otro = tiposImpuesto.filter((t) => t?.tipo === 'OTRO').length
    const conRecargo = tiposImpuesto.filter((t) => t?.recargoEquivalencia).length
    const predeterminados = tiposImpuesto.filter((t) => t?.predeterminado).length

    return {
      total,
      activos,
      inactivos,
      iva,
      igic,
      ipsi,
      otro,
      conRecargo,
      predeterminados,
    }
  }, [tiposImpuesto, pagination?.total])

  // ============================================
  // CARGAR TIPOS DE IMPUESTO
  // ============================================

  const cargarTiposImpuesto = useCallback(async () => {
    try {
      setIsLoading(true)

      // Construir parámetros de consulta mapeando correctamente los nombres
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }

      // Mapear 'search' a 'q' que es lo que espera el backend
      if (filters.search) {
        params.q = filters.search
      }

      // Agregar otros filtros
      if (filters.tipo) {
        params.tipo = filters.tipo
      }

      if (filters.activo !== undefined) {
        params.activo = filters.activo
      }

      if (filters.predeterminado !== undefined) {
        params.predeterminado = filters.predeterminado
      }

      if (filters.recargoEquivalencia !== undefined) {
        params.recargoEquivalencia = filters.recargoEquivalencia
      }

      const response = await tiposImpuestoService.getAll(params)

      if (response.success) {
        setTiposImpuesto(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setTiposImpuesto([])
        toast.error('Error al cargar los tipos de impuesto')
      }
    } catch (error) {
      console.error('Error al cargar tipos de impuesto:', error)
      setTiposImpuesto([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los tipos de impuesto')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarTiposImpuesto()
  }, [cargarTiposImpuesto])

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

    // Campos de búsqueda por texto (se concatenan en 'search')
    const searchableFields = ['codigo', 'nombre', 'descripcion', 'porcentaje', 'porcentajeRecargo']
    const searchTerms: string[] = []

    searchableFields.forEach(field => {
      if (debouncedColumnFilters[field]) {
        searchTerms.push(debouncedColumnFilters[field])
      }
    })

    // Usar 'search' que luego se mapea a 'q' en cargarTiposImpuesto
    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }

    // Filtros de select
    Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
      if (key === 'tipo') {
        if (value !== 'all') {
          combinedFilters.tipo = value
        }
      } else if (key === 'activo') {
        if (value !== 'all') {
          combinedFilters.activo = value === 'true'
        }
      } else if (key === 'predeterminado') {
        if (value !== 'all') {
          combinedFilters.predeterminado = value === 'true'
        }
      } else if (key === 'recargoEquivalencia') {
        if (value !== 'all') {
          combinedFilters.recargoEquivalencia = value === 'true'
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
      console.log('💾 Guardando vista:', { nombre, descripcion, esDefault, vistaIdActualizar, config: moduleConfig })

      if (vistaIdActualizar) {
        await vistasService.update(vistaIdActualizar, {
          modulo: 'tipos-impuesto',
          nombre,
          descripcion,
          configuracion: moduleConfig,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'tipos-impuesto',
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
        const vistas = await vistasService.getAll('tipos-impuesto', true)
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
    setFilters(prev => ({
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
      setSelectedTipos([])
    } else {
      setSelectedTipos(tiposImpuesto.map(t => t._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectTipo = (tipoId: string) => {
    if (selectedTipos.includes(tipoId)) {
      setSelectedTipos(selectedTipos.filter(id => id !== tipoId))
    } else {
      setSelectedTipos([...selectedTipos, tipoId])
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
        if (selectedTipos.length > 0) {
          const nombresSeleccionados = tiposImpuesto
            .filter(t => selectedTipos.includes(t._id))
            .map(t => t.nombre)

          setDeleteDialog({
            open: true,
            tipoIds: selectedTipos,
            tipoNombres: nombresSeleccionados,
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
    const selectedData = tiposImpuesto.filter(t => selectedTipos.includes(t._id))
    // Implementar exportación a CSV
    toast.success('Tipos de impuesto exportados correctamente')
  }

  const handleToggleStatus = async (activate: boolean) => {
    try {
      await Promise.all(
        selectedTipos.map(id =>
          tiposImpuestoService.update(id, { activo: activate })
        )
      )
      toast.success(`Tipos de impuesto ${activate ? 'activados' : 'desactivados'} correctamente`)
      cargarTiposImpuesto()
      setSelectedTipos([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  // ============================================
  // ELIMINAR TIPOS DE IMPUESTO
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      await Promise.all(
        deleteDialog.tipoIds.map(id => tiposImpuestoService.delete(id))
      )

      toast.success('Tipo(s) de impuesto eliminado(s) correctamente')
      cargarTiposImpuesto()
      setSelectedTipos([])
      setSelectAll(false)
      setDeleteDialog({ open: false, tipoIds: [], tipoNombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // ACCIONES POR TIPO DE IMPUESTO
  // ============================================

  const handleTipoAction = async (tipoId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/tipos-impuesto/${tipoId}`)
        break
      case 'edit':
        router.push(`/tipos-impuesto/${tipoId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando tipo de impuesto...')
          const response = await tiposImpuestoService.duplicar(tipoId)
          toast.dismiss()
          if (response.success) {
            toast.success('Tipo de impuesto duplicado correctamente')
            router.push(`/tipos-impuesto/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar el tipo de impuesto')
        }
        break
      case 'delete':
        const tipo = tiposImpuesto.find(t => t._id === tipoId)
        if (tipo) {
          setDeleteDialog({
            open: true,
            tipoIds: [tipoId],
            tipoNombres: [tipo.nombre],
          })
        }
        break
      case 'setPredeterminado':
        try {
          await tiposImpuestoService.setPredeterminado(tipoId)
          toast.success('Tipo de impuesto establecido como predeterminado')
          cargarTiposImpuesto()
        } catch (error: any) {
          console.error('Error al establecer predeterminado:', error)
          const errorMessage = error?.response?.data?.message || error?.message || 'Error al establecer predeterminado'
          toast.error(errorMessage)
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

  const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

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

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
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
              <Percent className="h-7 w-7 text-primary" />
              Tipos de Impuesto
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona los tipos de impuesto para facturas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Percent className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarTiposImpuesto}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/tipos-impuesto/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Tipo</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Predeterminados</p>
                  <p className="text-xl font-bold">{stats.predeterminados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Con Recargo</p>
                  <p className="text-xl font-bold">{stats.conRecargo}</p>
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
              placeholder="Buscar por código, nombre..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {/* MENÚ DE CONFIGURACIÓN */}
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(newDensity) => {
                updateDensidad(newDensity)
                toast.success(`Densidad cambiada a ${newDensity}`)
              }}
              modulo="tipos-impuesto"
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
              data={tiposImpuesto}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="tipos-impuesto"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Con Recargo', value: stats.conRecargo },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={tiposImpuesto}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Tipos de Impuesto"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
              ]}
              filters={columnFiltersInput}
            />
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedTipos.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedTipos.length} {selectedTipos.length === 1 ? 'tipo seleccionado' : 'tipos seleccionados'}
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
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <button
                        onClick={() => handleSort('codigo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Código
                        {getSortIcon('codigo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('nombre') && (
                    <th className={`${densityClasses.header} text-left w-[200px]`}>
                      <button
                        onClick={() => handleSort('nombre')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Nombre
                        {getSortIcon('nombre')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('descripcion') && (
                    <th className={`${densityClasses.header} text-left w-[250px]`}>
                      <span className="flex items-center text-xs font-semibold uppercase tracking-wider">
                        Descripción
                      </span>
                    </th>
                  )}

                  {columnasVisibles.includes('tipo') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <button
                        onClick={() => handleSort('tipo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Tipo
                        {getSortIcon('tipo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('porcentaje') && (
                    <th className={`${densityClasses.header} text-right w-[100px]`}>
                      <button
                        onClick={() => handleSort('porcentaje')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Porcentaje
                        {getSortIcon('porcentaje')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('recargoEquivalencia') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button
                        onClick={() => handleSort('recargoEquivalencia')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Recargo Equiv.
                        {getSortIcon('recargoEquivalencia')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('porcentajeRecargo') && (
                    <th className={`${densityClasses.header} text-right w-[110px]`}>
                      <button
                        onClick={() => handleSort('porcentajeRecargo')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        % Recargo
                        {getSortIcon('porcentajeRecargo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('activo') && (
                    <th className={`${densityClasses.header} text-left w-[90px]`}>
                      <button
                        onClick={() => handleSort('activo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Estado
                        {getSortIcon('activo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('predeterminado') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button
                        onClick={() => handleSort('predeterminado')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Predeterminado
                        {getSortIcon('predeterminado')}
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

                  {columnasVisibles.includes('nombre') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.nombre || ''}
                        onChange={(e) => handleColumnFilterInput('nombre', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('descripcion') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.descripcion || ''}
                        onChange={(e) => handleColumnFilterInput('descripcion', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('tipo') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.tipo || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('tipo', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'IVA', label: 'IVA' },
                          { value: 'IGIC', label: 'IGIC' },
                          { value: 'IPSI', label: 'IPSI' },
                          { value: 'OTRO', label: 'Otro' },
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('porcentaje') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.porcentaje || ''}
                        onChange={(e) => handleColumnFilterInput('porcentaje', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('recargoEquivalencia') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.recargoEquivalencia || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('recargoEquivalencia', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Sí' },
                          { value: 'false', label: 'No' },
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('porcentajeRecargo') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.porcentajeRecargo || ''}
                        onChange={(e) => handleColumnFilterInput('porcentajeRecargo', e.target.value)}
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

                  {columnasVisibles.includes('predeterminado') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.predeterminado || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('predeterminado', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Sí' },
                          { value: 'false', label: 'No' },
                        ]}
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
                      Cargando tipos de impuesto...
                    </td>
                  </tr>
                ) : tiposImpuesto.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Percent className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron tipos de impuesto</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo tipo</p>
                    </td>
                  </tr>
                ) : (
                  tiposImpuesto.map((tipo) => (
                    <tr
                      key={tipo._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedTipos.includes(tipo._id)}
                            onCheckedChange={() => handleSelectTipo(tipo._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.includes('codigo') && (
                        <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>{tipo.codigo}</td>
                      )}

                      {columnasVisibles.includes('nombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          <div className="max-w-[200px] truncate" title={tipo.nombre}>
                            {tipo.nombre}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('descripcion') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          <div className="max-w-[250px] truncate" title={tipo.descripcion || ''}>
                            {tipo.descripcion || '-'}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('tipo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge
                            variant="default"
                            className="text-xs font-medium"
                          >
                            {tipo.tipo}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('porcentaje') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold`}>
                          {tipo.porcentaje.toFixed(2)}%
                        </td>
                      )}

                      {columnasVisibles.includes('recargoEquivalencia') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge
                            variant={tipo.recargoEquivalencia ? 'default' : 'secondary'}
                            className={`text-xs font-medium ${
                              tipo.recargoEquivalencia
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {tipo.recargoEquivalencia ? 'Sí' : 'No'}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('porcentajeRecargo') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-medium text-muted-foreground`}>
                          {tipo.porcentajeRecargo ? `${tipo.porcentajeRecargo.toFixed(2)}%` : '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('activo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge
                            variant={tipo.activo ? 'default' : 'secondary'}
                            className={`text-xs font-medium ${
                              tipo.activo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {tipo.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('predeterminado') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {tipo.predeterminado && (
                            <Badge
                              variant="default"
                              className="text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            >
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Predeterminado
                            </Badge>
                          )}
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
                            <DropdownMenuItem onClick={() => handleTipoAction(tipo._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTipoAction(tipo._id, 'edit')}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTipoAction(tipo._id, 'duplicate')}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>

                            {!tipo.predeterminado && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleTipoAction(tipo._id, 'setPredeterminado')}>
                                  <Star className="mr-2 h-4 w-4" />
                                  Establecer como predeterminado
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleTipoAction(tipo._id, 'delete')}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
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
                      onClick={() => setFilters(prev => ({ ...prev, page }))}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: pagination.pages }))}
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
                ¿Estás seguro de que deseas eliminar {deleteDialog.tipoIds.length === 1
                  ? 'el siguiente tipo de impuesto'
                  : `los siguientes ${deleteDialog.tipoIds.length} tipos de impuesto`}?
                <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {deleteDialog.tipoNombres.map((nombre, index) => (
                    <li key={index} className="text-sm font-medium">• {nombre}</li>
                  ))}
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, tipoIds: [], tipoNombres: [] })}
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
    
  )
}
