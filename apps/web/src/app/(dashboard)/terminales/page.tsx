'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { terminalesService } from '@/services/terminales.service'
import vistasService from '@/services/vistas-guardadas.service'
import { Terminal, MARCAS_TERMINAL, ESTADOS_TERMINAL, ESTADOS_CONEXION } from '@/types/terminal.types'
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
  Download,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Fingerprint,
  Wifi,
  WifiOff,
  Clock,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { usePermissions } from '@/hooks/usePermissions'
import { ColumnaConfig } from '@/services/configuracion.service'

// Componentes UI estándar
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

// Filtros avanzados
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { TERMINALES_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'

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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO TERMINALES
// ============================================

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'ip', visible: true, orden: 2 },
    { key: 'marca', visible: true, orden: 3 },
    { key: 'estadoConexion', visible: true, orden: 4 },
    { key: 'estado', visible: true, orden: 5 },
    { key: 'ultimaSincronizacion', visible: true, orden: 6 },
    { key: 'activo', visible: false, orden: 7 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'nombre',
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

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function TerminalesPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  // Estados de datos
  const [terminales, setTerminales] = useState<Terminal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedTerminales, setSelectedTerminales] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Filtros avanzados
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([])
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 300)

  // Filtros generales
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 25,
    sortBy: 'nombre',
    sortOrder: 'asc',
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
    terminalIds: string[]
    terminalNombres: string[]
  }>({
    open: false,
    terminalIds: [],
    terminalNombres: [],
  })

  // Diálogos de sincronización
  const [syncDialog, setSyncDialog] = useState<{
    open: boolean
    terminal: Terminal | null
    tipo: 'empleados' | 'fichajes' | null
  }>({
    open: false,
    terminal: null,
    tipo: null,
  })
  const [syncing, setSyncing] = useState(false)

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'ip', label: 'IP:Puerto', sortable: true },
    { key: 'marca', label: 'Marca', sortable: true },
    { key: 'estadoConexion', label: 'Conexión', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'ultimaSincronizacion', label: 'Última Sync', sortable: true },
    { key: 'activo', label: 'Activo', sortable: true },
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
  } = useModuleConfig('terminales', DEFAULT_CONFIG, {
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

  // Densidad y clases
  const densidad = useMemo(() => {
    return moduleConfig?.densidad || 'normal'
  }, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  // ============================================
  // ESTADÍSTICAS CALCULADAS
  // ============================================

  const stats = useMemo(() => {
    if (!terminales || !Array.isArray(terminales)) {
      return {
        total: 0,
        conectados: 0,
        desconectados: 0,
        errores: 0,
      }
    }

    const total = pagination?.total || 0
    const conectados = terminales.filter((t) => t?.estadoConexion === 'conectado').length
    const desconectados = terminales.filter((t) => t?.estadoConexion === 'desconectado').length
    const errores = terminales.filter((t) => t?.estado === 'error').length

    return {
      total,
      conectados,
      desconectados,
      errores,
    }
  }, [terminales, pagination?.total])

  // ============================================
  // CARGAR TERMINALES
  // ============================================

  const cargarTerminales = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await terminalesService.getAll(filters)

      if (response.success) {
        setTerminales(response.data || [])
        setPagination({
          page: response.page || 1,
          limit: response.limit || 25,
          total: response.total || 0,
          pages: response.totalPages || 0,
        })
      } else {
        setTerminales([])
        toast.error('Error al cargar los terminales')
      }
    } catch (error) {
      console.error('Error al cargar terminales:', error)
      setTerminales([])
      setPagination({ page: 1, limit: 25, total: 0, pages: 0 })
      toast.error('Error al cargar los terminales')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarTerminales()
  }, [cargarTerminales])

  // ============================================
  // APLICAR FILTROS DEBOUNCED
  // ============================================

  useEffect(() => {
    const combinedFilters: any = {
      page: 1,
      sortBy: currentSortKey,
      sortOrder: currentSortDirection,
      limit: currentLimit,
    }

    // Campos de búsqueda por texto
    const searchableFields = ['codigo', 'nombre', 'ip']
    const searchTerms: string[] = []

    searchableFields.forEach((field) => {
      if (debouncedColumnFilters[field]) {
        searchTerms.push(debouncedColumnFilters[field])
      }
    })

    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }

    // Filtros de select
    Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
      if (key === 'marca') {
        if (value !== 'all') {
          combinedFilters.marca = value
        }
      } else if (key === 'estado') {
        if (value !== 'all') {
          combinedFilters.estado = value
        }
      } else if (key === 'estadoConexion') {
        if (value !== 'all') {
          combinedFilters.estadoConexion = value
        }
      } else if (key === 'activo') {
        if (value !== 'all') {
          combinedFilters.activo = value === 'true'
        }
      }
    })

    // Filtros avanzados
    if (debouncedAdvancedFilters.length > 0) {
      const advancedParams = filtersToQueryParams(debouncedAdvancedFilters)
      Object.assign(combinedFilters, advancedParams)
    }

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, debouncedAdvancedFilters, currentSortKey, currentSortDirection, currentLimit])

  // ============================================
  // SINCRONIZAR CONFIGURACIÓN GUARDADA (CARGA INICIAL)
  // ============================================

  useEffect(() => {
    if (!moduleConfig || isLoadingConfig) return
    if (!isInitialLoad.current) return

    const initialFilters =
      moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0
        ? moduleConfig.columnFilters
        : { activo: 'true' }

    setColumnFiltersInput(initialFilters as any)
    isInitialLoad.current = false
  }, [moduleConfig, isLoadingConfig])

  // ============================================
  // HANDLERS PARA VISTAS GUARDADAS
  // ============================================

  const handleAplicarVista = useCallback(
    (configuracion: any) => {
      if (configuracion.columnas) {
        updateColumnas(configuracion.columnas)
      }

      if (configuracion.sortConfig) {
        updateSortConfig(configuracion.sortConfig)
      }

      if (configuracion.columnFilters) {
        setColumnFiltersInput(configuracion.columnFilters as any)
      }

      if (configuracion.advancedFilters && Array.isArray(configuracion.advancedFilters)) {
        const restoredFilters = savedToFilters(configuracion.advancedFilters, TERMINALES_FILTERABLE_FIELDS)
        setAdvancedFilters(restoredFilters)
      } else {
        setAdvancedFilters([])
      }

      if (configuracion.densidad) {
        updateDensidad(configuracion.densidad)
      }

      if (configuracion.paginacion?.limit) {
        setFilters((prev: any) => ({ ...prev, limit: configuracion.paginacion.limit }))
      }

      toast.success('Vista aplicada correctamente')
    },
    [updateColumnas, updateSortConfig, updateDensidad]
  )

  const handleGuardarVista = useCallback(
    async (nombre: string, descripcion?: string, esDefault?: boolean, vistaIdActualizar?: string) => {
      try {
        const configToSave = {
          ...moduleConfig,
          advancedFilters: filtersToSaved(advancedFilters),
          columnFilters: columnFiltersInput,
        }

        if (vistaIdActualizar) {
          await vistasService.update(vistaIdActualizar, {
            modulo: 'terminales',
            nombre,
            descripcion,
            configuracion: configToSave,
            esDefault: esDefault || false,
          })
          toast.success(`Vista "${nombre}" actualizada correctamente`)
        } else {
          await vistasService.create({
            modulo: 'terminales',
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
    },
    [moduleConfig, advancedFilters, columnFiltersInput]
  )

  // Cargar vista por defecto al iniciar
  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('terminales', true)
        const vistaDefault = vistas?.find((v: any) => v.esDefault)

        if (vistaDefault && vistaDefault.configuracion) {
          handleAplicarVista(vistaDefault.configuracion)
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
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    updateSortConfig({ key, direction })
  }

  const getSortIcon = (column: string) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  // ============================================
  // FILTROS POR COLUMNA CON DEBOUNCE
  // ============================================

  const handleColumnFilterInput = (column: string, value: string) => {
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
      setSelectedTerminales([])
    } else {
      setSelectedTerminales(terminales.map((t) => t._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectTerminal = (terminalId: string) => {
    if (selectedTerminales.includes(terminalId)) {
      setSelectedTerminales(selectedTerminales.filter((id) => id !== terminalId))
    } else {
      setSelectedTerminales([...selectedTerminales, terminalId])
    }
  }

  // ============================================
  // ACCIONES EN LOTE
  // ============================================

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'export':
        toast.success('Terminales exportados correctamente')
        break
      case 'delete':
        if (selectedTerminales.length > 0) {
          const nombresSeleccionados = terminales
            .filter((t) => selectedTerminales.includes(t._id))
            .map((t) => t.nombre)

          setDeleteDialog({
            open: true,
            terminalIds: selectedTerminales,
            terminalNombres: nombresSeleccionados,
          })
        }
        break
      case 'activate':
      case 'deactivate':
        handleToggleStatus(action === 'activate')
        break
      case 'sync-all':
        handleSyncAll()
        break
    }
  }

  const handleToggleStatus = async (activate: boolean) => {
    try {
      await Promise.all(selectedTerminales.map((id) => terminalesService.update(id, { activo: activate })))
      toast.success(`Terminales ${activate ? 'activados' : 'desactivados'} correctamente`)
      cargarTerminales()
      setSelectedTerminales([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  const handleSyncAll = async () => {
    try {
      toast.loading('Sincronizando todos los terminales...')
      // Aquí iría la lógica para sincronizar todos los seleccionados
      toast.dismiss()
      toast.success('Sincronización masiva iniciada')
    } catch (error) {
      toast.dismiss()
      toast.error('Error al sincronizar')
    }
  }

  // ============================================
  // ELIMINAR TERMINALES
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      await Promise.all(deleteDialog.terminalIds.map((id) => terminalesService.delete(id)))
      toast.success('Terminal(es) desactivado(s) correctamente')
      cargarTerminales()
      setSelectedTerminales([])
      setSelectAll(false)
      setDeleteDialog({ open: false, terminalIds: [], terminalNombres: [] })
    } catch (error) {
      toast.error('Error al desactivar')
    }
  }

  // ============================================
  // PROBAR CONEXIÓN
  // ============================================

  const handleProbarConexion = async (terminal: Terminal) => {
    try {
      toast.loading('Probando conexión...')
      const response = await terminalesService.probarConexion(terminal._id)
      toast.dismiss()

      if (response.success) {
        toast.success('Conexión exitosa')
        cargarTerminales()
      } else {
        toast.error(response.message)
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al probar conexión')
    }
  }

  // ============================================
  // SINCRONIZACIÓN
  // ============================================

  const handleSync = async () => {
    if (!syncDialog.terminal || !syncDialog.tipo) return

    try {
      setSyncing(true)

      let response
      if (syncDialog.tipo === 'empleados') {
        response = await terminalesService.sincronizarEmpleados(syncDialog.terminal._id)
      } else {
        response = await terminalesService.sincronizarAsistencia(syncDialog.terminal._id)
      }

      toast.success(response.message)
      setSyncDialog({ open: false, terminal: null, tipo: null })
      cargarTerminales()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  // ============================================
  // ACCIONES POR TERMINAL
  // ============================================

  const handleTerminalAction = async (terminalId: string, action: string) => {
    const terminal = terminales.find((t) => t._id === terminalId)

    switch (action) {
      case 'view':
        router.push(`/terminales/${terminalId}`)
        break
      case 'edit':
        router.push(`/terminales/${terminalId}/editar`)
        break
      case 'test':
        if (terminal) handleProbarConexion(terminal)
        break
      case 'sync-employees':
        if (terminal) setSyncDialog({ open: true, terminal, tipo: 'empleados' })
        break
      case 'sync-attendance':
        if (terminal) setSyncDialog({ open: true, terminal, tipo: 'fichajes' })
        break
      case 'delete':
        if (terminal) {
          setDeleteDialog({
            open: true,
            terminalIds: [terminalId],
            terminalNombres: [terminal.nombre],
          })
        }
        break
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
  // PAGINACIÓN
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
    setFilters((prev: any) => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }))
    toast.success(`Mostrando ${newLimit} registros por página`)
  }

  // ============================================
  // HELPERS
  // ============================================

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEstadoConexionBadge = (estado: string) => {
    const config = ESTADOS_CONEXION.find((e) => e.value === estado)
    return (
      <Badge
        variant={estado === 'conectado' ? 'default' : estado === 'desconectado' ? 'destructive' : 'secondary'}
        className="text-xs font-medium"
      >
        {estado === 'conectado' ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
        {config?.label || estado}
      </Badge>
    )
  }

  const getEstadoBadge = (estado: string) => {
    const config = ESTADOS_TERMINAL.find((e) => e.value === estado)
    return (
      <Badge
        variant={estado === 'activo' ? 'default' : estado === 'error' ? 'destructive' : 'secondary'}
        className="text-xs font-medium"
      >
        {config?.label || estado}
      </Badge>
    )
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
              <Fingerprint className="h-7 w-7 text-primary" />
              Terminales Biométricos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión de terminales de fichaje y sincronización
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Eye className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={cargarTerminales}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            {canCreate('terminales') && (
              <Button asChild size="sm">
                <Link href="/terminales/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo Terminal</span>
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
                  <Fingerprint className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Conectados</p>
                  <p className="text-xl font-bold">{stats.conectados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-gray-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                  <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Desconectados</p>
                  <p className="text-xl font-bold">{stats.desconectados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Con Error</p>
                  <p className="text-xl font-bold">{stats.errores}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={TERMINALES_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por código, nombre, IP..."
        />

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {/* MENÚ DE CONFIGURACIÓN */}
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(newDensity) => {
                updateDensidad(newDensity)
                toast.success(`Densidad cambiada a ${newDensity}`)
              }}
              modulo="terminales"
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
              data={terminales}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="terminales"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Conectados', value: stats.conectados },
                { label: 'Desconectados', value: stats.desconectados },
                { label: 'Con Error', value: stats.errores },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={terminales}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Terminales Biométricos"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Conectados', value: stats.conectados },
                { label: 'Desconectados', value: stats.desconectados },
                { label: 'Con Error', value: stats.errores },
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
        {selectedTerminales.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedTerminales.length}{' '}
                {selectedTerminales.length === 1 ? 'terminal seleccionado' : 'terminales seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
                Activar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
                Desactivar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('sync-all')}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              {canDelete('terminales') && (
                <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Desactivar
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* TABLA PROFESIONAL CON DENSIDAD */}
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* HEADERS */}
                <tr className="border-b bg-muted/50">
                  <th
                    className={`${densityClasses.header} sticky left-0 z-30 bg-muted/50 backdrop-blur-sm text-left w-10`}
                  >
                    <div className="flex items-center justify-center">
                      <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
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

                  {columnasVisibles.includes('ip') && (
                    <th className={`${densityClasses.header} text-left w-[150px]`}>
                      <button
                        onClick={() => handleSort('ip')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        IP:Puerto
                        {getSortIcon('ip')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('marca') && (
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('marca')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Marca
                        {getSortIcon('marca')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('estadoConexion') && (
                    <th className={`${densityClasses.header} text-left min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('estadoConexion')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Conexión
                        {getSortIcon('estadoConexion')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('estado') && (
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('estado')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Estado
                        {getSortIcon('estado')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('ultimaSincronizacion') && (
                    <th className={`${densityClasses.header} text-left min-w-[150px]`}>
                      <button
                        onClick={() => handleSort('ultimaSincronizacion')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Última Sync
                        {getSortIcon('ultimaSincronizacion')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('activo') && (
                    <th className={`${densityClasses.header} text-left min-w-[90px]`}>
                      <button
                        onClick={() => handleSort('activo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Activo
                        {getSortIcon('activo')}
                      </button>
                    </th>
                  )}

                  <th
                    className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 backdrop-blur-sm text-right min-w-[70px] text-xs font-semibold uppercase tracking-wider`}
                  >
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

                  {columnasVisibles.includes('ip') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.ip || ''}
                        onChange={(e) => handleColumnFilterInput('ip', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('marca') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.marca || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('marca', value)}
                        placeholder="Todas"
                        options={[
                          { value: 'all', label: 'Todas' },
                          ...MARCAS_TERMINAL.map((m) => ({ value: m.value, label: m.label })),
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('estadoConexion') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.estadoConexion || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('estadoConexion', value)}
                        placeholder="Todas"
                        options={[
                          { value: 'all', label: 'Todas' },
                          ...ESTADOS_CONEXION.map((e) => ({ value: e.value, label: e.label })),
                        ]}
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
                          ...ESTADOS_TERMINAL.map((e) => ({ value: e.value, label: e.label })),
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('ultimaSincronizacion') && (
                    <th className="px-3 py-1.5"></th>
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

                  <th className="sticky right-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={columnasVisibles.length + 2}
                      className="px-3 py-12 text-center text-sm text-muted-foreground"
                    >
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando terminales...
                    </td>
                  </tr>
                ) : terminales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnasVisibles.length + 2}
                      className="px-3 py-12 text-center text-sm text-muted-foreground"
                    >
                      <Fingerprint className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron terminales</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo terminal</p>
                    </td>
                  </tr>
                ) : (
                  terminales.map((terminal) => (
                    <tr key={terminal._id} className="hover:bg-muted/30 transition-colors group">
                      <td
                        className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}
                      >
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedTerminales.includes(terminal._id)}
                            onCheckedChange={() => handleSelectTerminal(terminal._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.includes('codigo') && (
                        <td
                          className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium cursor-pointer hover:text-primary`}
                          onClick={() => router.push(`/terminales/${terminal._id}`)}
                        >
                          {terminal.codigo}
                        </td>
                      )}

                      {columnasVisibles.includes('nombre') && (
                        <td
                          className={`${densityClasses.cell} ${densityClasses.text} font-medium cursor-pointer hover:text-primary`}
                          onClick={() => router.push(`/terminales/${terminal._id}`)}
                        >
                          <div className="max-w-[200px] truncate" title={terminal.nombre}>
                            {terminal.nombre}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('ip') && (
                        <td className={`${densityClasses.cell} font-mono text-sm`}>
                          {terminal.ip}:{terminal.puerto}
                        </td>
                      )}

                      {columnasVisibles.includes('marca') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {MARCAS_TERMINAL.find((m) => m.value === terminal.marca)?.label || terminal.marca}
                        </td>
                      )}

                      {columnasVisibles.includes('estadoConexion') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {getEstadoConexionBadge(terminal.estadoConexion)}
                        </td>
                      )}

                      {columnasVisibles.includes('estado') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {getEstadoBadge(terminal.estado)}
                        </td>
                      )}

                      {columnasVisibles.includes('ultimaSincronizacion') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(terminal.ultimaSincronizacion)}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('activo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge
                            variant={terminal.activo ? 'default' : 'secondary'}
                            className={`text-xs font-medium ${
                              terminal.activo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {terminal.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      )}

                      <td
                        className={`${densityClasses.cell} sticky right-0 z-20 bg-background group-hover:bg-muted/30 transition-colors text-right`}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleTerminalAction(terminal._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTerminalAction(terminal._id, 'edit')}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTerminalAction(terminal._id, 'test')}>
                              <Wifi className="mr-2 h-4 w-4" />
                              Probar conexión
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTerminalAction(terminal._id, 'sync-employees')}>
                              <Upload className="mr-2 h-4 w-4" />
                              Sincronizar empleados
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTerminalAction(terminal._id, 'sync-attendance')}>
                              <Download className="mr-2 h-4 w-4" />
                              Sincronizar fichajes
                            </DropdownMenuItem>

                            {canDelete('terminales') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleTerminalAction(terminal._id, 'delete')}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Desactivar
                                </DropdownMenuItem>
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
                Mostrando <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> a{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>{' '}
                (Página <span className="font-medium">{pagination.page}</span> de{' '}
                <span className="font-medium">{pagination.pages}</span>)
              </div>

              {/* NAVEGACIÓN DE PÁGINAS */}
              <div className="flex items-center gap-1">
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters((prev: any) => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="h-9 w-9 p-0"
                  title="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

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
        <Dialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar desactivación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas desactivar{' '}
                {deleteDialog.terminalIds.length === 1
                  ? 'el siguiente terminal'
                  : `los siguientes ${deleteDialog.terminalIds.length} terminales`}
                ?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.terminalNombres.map((nombre, index) => (
                  <li key={index} className="text-sm font-medium">
                    • {nombre}
                  </li>
                ))}
              </ul>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, terminalIds: [], terminalNombres: [] })}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Desactivar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG DE SINCRONIZACIÓN */}
        <Dialog
          open={syncDialog.open}
          onOpenChange={(open) => setSyncDialog({ open, terminal: null, tipo: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {syncDialog.tipo === 'empleados' ? 'Sincronizar Empleados' : 'Sincronizar Fichajes'}
              </DialogTitle>
              <DialogDescription>
                {syncDialog.tipo === 'empleados'
                  ? `¿Deseas enviar los empleados activos al terminal ${syncDialog.terminal?.nombre}?`
                  : `¿Deseas descargar los fichajes desde el terminal ${syncDialog.terminal?.nombre}?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSyncDialog({ open: false, terminal: null, tipo: null })}
                disabled={syncing}
              >
                Cancelar
              </Button>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    {syncDialog.tipo === 'empleados' ? (
                      <Upload className="h-4 w-4 mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  )
}
