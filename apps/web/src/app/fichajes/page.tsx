'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { fichajesService, SearchFichajesParams } from '@/services/fichajes.service'
import { personalService } from '@/services/personal.service'
import { departamentosService } from '@/services/departamentos.service'
import { Fichaje, TIPOS_FICHAJE, ESTADOS_FICHAJE } from '@/types/fichaje.types'
import { Personal } from '@/types/personal.types'
import { Departamento } from '@/types/departamento.types'
import vistasService from '@/services/vistas-guardadas.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
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
  Fingerprint, RefreshCw, Calendar, Clock, LogIn, LogOut,
  Building2, Home, Plane, GraduationCap, ChevronLeft, ChevronRight,
  Eye, MapPin, Wifi, Pause, MoreHorizontal, Columns, Edit, Trash2,
  CheckCircle, XCircle, AlertCircle, ChevronsLeft, ChevronsRight,
  ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'

// Componentes UI compartidos
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

// Filtros avanzados
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { FICHAJES_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'

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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO FICHAJES
// ============================================

const DEFAULT_FICHAJES_CONFIG = {
  columnas: [
    { key: 'fecha', visible: true, orden: 0 },
    { key: 'empleado', visible: true, orden: 1 },
    { key: 'departamento', visible: true, orden: 2 },
    { key: 'tipo', visible: true, orden: 3 },
    { key: 'entrada', visible: true, orden: 4 },
    { key: 'salida', visible: true, orden: 5 },
    { key: 'horas', visible: true, orden: 6 },
    { key: 'estado', visible: true, orden: 7 },
    { key: 'observaciones', visible: false, orden: 8 },
    { key: 'incidencia', visible: false, orden: 9 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'fecha',
    direction: 'desc' as const,
  },
  columnFilters: {},
  paginacion: {
    limit: 25 as const,
  },
  densidad: 'normal' as const,
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function FichajesListPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  // Estados de datos
  const [fichajes, setFichajes] = useState<Fichaje[]>([])
  const [personalList, setPersonalList] = useState<Personal[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedFichajes, setSelectedFichajes] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
  })
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Filtros avanzados
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([])
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 300)

  // Filtros generales
  const [filters, setFilters] = useState<SearchFichajesParams>({
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    sortBy: 'fecha',
    sortOrder: 'desc',
    page: 1,
    limit: 25,
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
  const [fichajeSeleccionado, setFichajeSeleccionado] = useState<Fichaje | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    fichajeIds: string[]
  }>({
    open: false,
    fichajeIds: [],
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'empleado', label: 'Empleado', sortable: true },
    { key: 'departamento', label: 'Departamento', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'entrada', label: 'Entrada', sortable: true },
    { key: 'salida', label: 'Salida', sortable: true },
    { key: 'horas', label: 'Horas', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'observaciones', label: 'Observaciones', sortable: false },
    { key: 'incidencia', label: 'Incidencia', sortable: false },
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
  } = useModuleConfig('fichajes', DEFAULT_FICHAJES_CONFIG, {
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
    return moduleConfig?.sortConfig || DEFAULT_FICHAJES_CONFIG.sortConfig
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
    if (!fichajes || !Array.isArray(fichajes)) {
      return {
        total: 0,
        abiertos: 0,
        cerrados: 0,
        aprobados: 0,
        rechazados: 0,
        horasTotales: 0,
      }
    }

    const total = pagination?.total || 0
    const abiertos = fichajes.filter((f) => f?.estado === 'abierto').length
    const cerrados = fichajes.filter((f) => f?.estado === 'cerrado').length
    const aprobados = fichajes.filter((f) => f?.estado === 'aprobado').length
    const rechazados = fichajes.filter((f) => f?.estado === 'rechazado').length
    const horasTotales = fichajes.reduce((acc, f) => acc + (f?.horasTrabajadas || 0), 0)

    return {
      total,
      abiertos,
      cerrados,
      aprobados,
      rechazados,
      horasTotales,
    }
  }, [fichajes, pagination?.total])

  // ============================================
  // CARGAR DATOS
  // ============================================

  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true)

      const [fichajesRes, personalRes, deptosRes] = await Promise.all([
        fichajesService.getAll({
          ...filters,
          personalId: filters.personalId || undefined,
          departamentoId: filters.departamentoId || undefined,
          estado: filters.estado || undefined,
          tipo: filters.tipo || undefined,
        }),
        personalService.getAll({ activo: true, limit: 100 }),
        departamentosService.getActivos(),
      ])

      if (fichajesRes.success) {
        setFichajes(fichajesRes.data)
        setPagination({
          page: filters.page || 1,
          limit: filters.limit || 25,
          total: fichajesRes.total || 0,
          pages: Math.ceil((fichajesRes.total || 0) / (filters.limit || 25)),
        })
      }

      if (personalRes.success) {
        setPersonalList(personalRes.data)
      }

      if (deptosRes.success) {
        setDepartamentos(deptosRes.data)
      }
    } catch (error) {
      toast.error('Error al cargar fichajes')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

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

    // Filtros de fecha
    if (debouncedColumnFilters.fechaDesde) {
      combinedFilters.fechaDesde = debouncedColumnFilters.fechaDesde
    }
    if (debouncedColumnFilters.fechaHasta) {
      combinedFilters.fechaHasta = debouncedColumnFilters.fechaHasta
    }

    // Filtros de select
    if (debouncedColumnFilters.personalId && debouncedColumnFilters.personalId !== 'all') {
      combinedFilters.personalId = debouncedColumnFilters.personalId
    }
    if (debouncedColumnFilters.departamentoId && debouncedColumnFilters.departamentoId !== 'all') {
      combinedFilters.departamentoId = debouncedColumnFilters.departamentoId
    }
    if (debouncedColumnFilters.estado && debouncedColumnFilters.estado !== 'all') {
      combinedFilters.estado = debouncedColumnFilters.estado
    }
    if (debouncedColumnFilters.tipo && debouncedColumnFilters.tipo !== 'all') {
      combinedFilters.tipo = debouncedColumnFilters.tipo
    }

    // Filtros avanzados
    if (debouncedAdvancedFilters.length > 0) {
      const advancedParams = filtersToQueryParams(debouncedAdvancedFilters)
      Object.assign(combinedFilters, advancedParams)
    }

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, debouncedAdvancedFilters, currentSortKey, currentSortDirection, currentLimit])

  // ============================================
  // SINCRONIZAR CONFIGURACIÓN GUARDADA
  // ============================================

  useEffect(() => {
    if (!moduleConfig || isLoadingConfig) return
    if (!isInitialLoad.current) return

    const initialFilters = moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0
      ? moduleConfig.columnFilters
      : {
          fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          fechaHasta: new Date().toISOString().split('T')[0],
        }

    setColumnFiltersInput(initialFilters as any)
    isInitialLoad.current = false
  }, [moduleConfig, isLoadingConfig])

  // ============================================
  // HANDLERS PARA VISTAS GUARDADAS
  // ============================================

  const handleAplicarVista = useCallback((configuracion: any) => {
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
      const restoredFilters = savedToFilters(configuracion.advancedFilters, FICHAJES_FILTERABLE_FIELDS)
      setAdvancedFilters(restoredFilters)
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

      if (vistaIdActualizar) {
        await vistasService.update(vistaIdActualizar, {
          modulo: 'fichajes',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'fichajes',
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

  // Cargar y aplicar vista por defecto
  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('fichajes', true)
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
    setFilters(prev => ({
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

  // ============================================
  // SELECCIÓN MÚLTIPLE
  // ============================================

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFichajes([])
    } else {
      setSelectedFichajes(fichajes.map(f => f._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectFichaje = (fichajeId: string) => {
    if (selectedFichajes.includes(fichajeId)) {
      setSelectedFichajes(selectedFichajes.filter(id => id !== fichajeId))
    } else {
      setSelectedFichajes([...selectedFichajes, fichajeId])
    }
  }

  // ============================================
  // ACCIONES
  // ============================================

  const handleAction = async (fichajeId: string, action: string) => {
    switch (action) {
      case 'view':
        const fichaje = fichajes.find(f => f._id === fichajeId)
        if (fichaje) {
          setFichajeSeleccionado(fichaje)
          setDialogOpen(true)
        }
        break
      case 'aprobar':
        try {
          await fichajesService.aprobar(fichajeId)
          toast.success('Fichaje aprobado')
          cargarDatos()
        } catch (error) {
          toast.error('Error al aprobar fichaje')
        }
        break
      case 'rechazar':
        try {
          await fichajesService.rechazar(fichajeId)
          toast.success('Fichaje rechazado')
          cargarDatos()
        } catch (error) {
          toast.error('Error al rechazar fichaje')
        }
        break
      case 'delete':
        setDeleteDialog({
          open: true,
          fichajeIds: [fichajeId],
        })
        break
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      for (const id of deleteDialog.fichajeIds) {
        await fichajesService.delete(id)
      }
      toast.success('Fichaje(s) eliminado(s) correctamente')
      cargarDatos()
      setSelectedFichajes([])
      setSelectAll(false)
      setDeleteDialog({ open: false, fichajeIds: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'delete':
        if (selectedFichajes.length > 0) {
          setDeleteDialog({
            open: true,
            fichajeIds: selectedFichajes,
          })
        }
        break
      case 'aprobar':
        handleBulkAprobar()
        break
      case 'rechazar':
        handleBulkRechazar()
        break
    }
  }

  const handleBulkAprobar = async () => {
    try {
      for (const id of selectedFichajes) {
        await fichajesService.aprobar(id)
      }
      toast.success('Fichajes aprobados correctamente')
      cargarDatos()
      setSelectedFichajes([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al aprobar fichajes')
    }
  }

  const handleBulkRechazar = async () => {
    try {
      for (const id of selectedFichajes) {
        await fichajesService.rechazar(id)
      }
      toast.success('Fichajes rechazados correctamente')
      cargarDatos()
      setSelectedFichajes([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al rechazar fichajes')
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
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1,
    }))
    toast.success(`Mostrando ${newLimit} registros por página`)
  }

  // ============================================
  // HELPERS
  // ============================================

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'normal': return <Building2 className="h-4 w-4" />
      case 'teletrabajo': return <Home className="h-4 w-4" />
      case 'viaje': return <Plane className="h-4 w-4" />
      case 'formacion': return <GraduationCap className="h-4 w-4" />
      default: return <Building2 className="h-4 w-4" />
    }
  }

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'cerrado': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      case 'aprobado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rechazado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const formatHora = (fecha?: string) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  // ============================================
  // RENDER
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
              <Fingerprint className="h-7 w-7 text-primary" />
              Fichajes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión de fichajes de personal
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarDatos}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
            <Card className="p-3 border-l-4 border-l-cyan-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                  <LogIn className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Abiertos</p>
                  <p className="text-xl font-bold">{stats.abiertos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-gray-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                  <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Cerrados</p>
                  <p className="text-xl font-bold">{stats.cerrados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-green-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Aprobados</p>
                  <p className="text-xl font-bold">{stats.aprobados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Rechazados</p>
                  <p className="text-xl font-bold">{stats.rechazados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Horas Totales</p>
                  <p className="text-xl font-bold">{stats.horasTotales.toFixed(1)}h</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={FICHAJES_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por empleado, departamento..."
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
              modulo="fichajes"
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
              data={fichajes}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="fichajes"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Abiertos', value: stats.abiertos },
                { label: 'Cerrados', value: stats.cerrados },
                { label: 'Aprobados', value: stats.aprobados },
                { label: 'Rechazados', value: stats.rechazados },
                { label: 'Horas Totales', value: stats.horasTotales.toFixed(1) + 'h' },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={fichajes}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Fichajes"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Abiertos', value: stats.abiertos },
                { label: 'Cerrados', value: stats.cerrados },
                { label: 'Aprobados', value: stats.aprobados },
                { label: 'Rechazados', value: stats.rechazados },
                { label: 'Horas Totales', value: stats.horasTotales.toFixed(1) + 'h' },
              ]}
              filters={columnFiltersInput}
            />
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedFichajes.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedFichajes.length} {selectedFichajes.length === 1 ? 'fichaje seleccionado' : 'fichajes seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('aprobar')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('rechazar')}>
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          </Card>
        )}

        {/* TABLA */}
        <Card className="overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* HEADERS */}
                <tr className="border-b bg-muted/50">
                  <th className={`${densityClasses.header} sticky left-0 z-30 bg-muted/50 backdrop-blur-sm text-left w-10`}>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </div>
                  </th>

                  {columnasVisibles.includes('fecha') && (
                    <th className={`${densityClasses.header} text-left min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('fecha')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Fecha
                        {getSortIcon('fecha')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('empleado') && (
                    <th className={`${densityClasses.header} text-left min-w-[180px]`}>
                      <button
                        onClick={() => handleSort('personalNombre')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Empleado
                        {getSortIcon('personalNombre')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('departamento') && (
                    <th className={`${densityClasses.header} text-left min-w-[150px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Departamento</span>
                    </th>
                  )}

                  {columnasVisibles.includes('tipo') && (
                    <th className={`${densityClasses.header} text-left min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('tipo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Tipo
                        {getSortIcon('tipo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('entrada') && (
                    <th className={`${densityClasses.header} text-center min-w-[80px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Entrada</span>
                    </th>
                  )}

                  {columnasVisibles.includes('salida') && (
                    <th className={`${densityClasses.header} text-center min-w-[80px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Salida</span>
                    </th>
                  )}

                  {columnasVisibles.includes('horas') && (
                    <th className={`${densityClasses.header} text-center min-w-[80px]`}>
                      <button
                        onClick={() => handleSort('horasTrabajadas')}
                        className="flex items-center justify-center w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Horas
                        {getSortIcon('horasTrabajadas')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('estado') && (
                    <th className={`${densityClasses.header} text-center min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('estado')}
                        className="flex items-center justify-center w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Estado
                        {getSortIcon('estado')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('observaciones') && (
                    <th className={`${densityClasses.header} text-left min-w-[200px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Observaciones</span>
                    </th>
                  )}

                  {columnasVisibles.includes('incidencia') && (
                    <th className={`${densityClasses.header} text-left min-w-[200px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">Incidencia</span>
                    </th>
                  )}

                  <th className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 backdrop-blur-sm text-right min-w-[70px] text-xs font-semibold uppercase tracking-wider`}>
                    Acciones
                  </th>
                </tr>

                {/* FILTROS */}
                <tr className="border-b bg-background">
                  <th className="sticky left-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>

                  {columnasVisibles.includes('fecha') && (
                    <th className="px-3 py-1.5">
                      <div className="flex gap-1">
                        <Input
                          type="date"
                          className="h-7 text-xs w-[120px]"
                          value={columnFiltersInput.fechaDesde || ''}
                          onChange={(e) => handleColumnFilterInput('fechaDesde', e.target.value)}
                        />
                        <Input
                          type="date"
                          className="h-7 text-xs w-[120px]"
                          value={columnFiltersInput.fechaHasta || ''}
                          onChange={(e) => handleColumnFilterInput('fechaHasta', e.target.value)}
                        />
                      </div>
                    </th>
                  )}

                  {columnasVisibles.includes('empleado') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.personalId || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('personalId', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          ...personalList.map(p => ({ value: p._id, label: `${p.nombre} ${p.apellidos}` })),
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('departamento') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.departamentoId || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('departamentoId', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          ...departamentos.map(d => ({ value: d._id, label: d.nombre })),
                        ]}
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
                          ...TIPOS_FICHAJE.map(t => ({ value: t.value, label: t.label })),
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('entrada') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('salida') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('horas') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('estado') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.estado || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('estado', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          ...ESTADOS_FICHAJE.map(e => ({ value: e.value, label: e.label })),
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('observaciones') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('incidencia') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  <th className="sticky right-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando fichajes...
                    </td>
                  </tr>
                ) : fichajes.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Fingerprint className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron fichajes</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros</p>
                    </td>
                  </tr>
                ) : (
                  fichajes.map((fichaje) => (
                    <tr
                      key={fichaje._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedFichajes.includes(fichaje._id)}
                            onCheckedChange={() => handleSelectFichaje(fichaje._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.includes('fecha') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatFecha(fichaje.fecha)}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('empleado') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          {fichaje.personalNombre || 'Sin nombre'}
                        </td>
                      )}

                      {columnasVisibles.includes('departamento') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {fichaje.departamentoNombre || '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('tipo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <div className="flex items-center gap-1">
                            {getIconoTipo(fichaje.tipo)}
                            <span className="text-sm">
                              {TIPOS_FICHAJE.find((t) => t.value === fichaje.tipo)?.label}
                            </span>
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('entrada') && (
                        <td className={`${densityClasses.cell} text-center ${densityClasses.text}`}>
                          <div className="flex items-center justify-center gap-1">
                            <LogIn className="h-3 w-3 text-green-600" />
                            {formatHora(fichaje.horaEntrada)}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('salida') && (
                        <td className={`${densityClasses.cell} text-center ${densityClasses.text}`}>
                          <div className="flex items-center justify-center gap-1">
                            <LogOut className="h-3 w-3 text-red-600" />
                            {formatHora(fichaje.horaSalida)}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('horas') && (
                        <td className={`${densityClasses.cell} text-center font-mono ${densityClasses.text}`}>
                          {fichaje.horasTrabajadas !== undefined && fichaje.horasTrabajadas > 0
                            ? `${fichaje.horasTrabajadas.toFixed(1)}h`
                            : '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('estado') && (
                        <td className={`${densityClasses.cell} text-center`}>
                          <Badge className={`text-xs font-medium ${getColorEstado(fichaje.estado)}`}>
                            {ESTADOS_FICHAJE.find((e) => e.value === fichaje.estado)?.label}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('observaciones') && (
                        <td className={`${densityClasses.cell} max-w-[200px] truncate ${densityClasses.text} text-muted-foreground`}>
                          {fichaje.observaciones || '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('incidencia') && (
                        <td className={`${densityClasses.cell} max-w-[200px] truncate ${densityClasses.text}`}>
                          {fichaje.incidencia ? (
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {fichaje.incidencia}
                            </span>
                          ) : '-'}
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
                            <DropdownMenuItem onClick={() => handleAction(fichaje._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            {fichaje.estado === 'cerrado' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleAction(fichaje._id, 'aprobar')}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Aprobar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction(fichaje._id, 'rechazar')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Rechazar
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleAction(fichaje._id, 'delete')}
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
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
                      onClick={() => setFilters(prev => ({ ...prev, page }))}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, (prev.page || 1) + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="h-9 w-9 p-0"
                  title="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

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
      </div>

      {/* DIALOG DETALLE FICHAJE */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Detalle del Fichaje
            </DialogTitle>
          </DialogHeader>

          {fichajeSeleccionado && (
            <div className="space-y-4">
              {/* Empleado */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-semibold text-lg">
                  {fichajeSeleccionado.personalNombre || 'Sin nombre'}
                </p>
                {fichajeSeleccionado.departamentoNombre && (
                  <p className="text-sm text-muted-foreground">
                    {fichajeSeleccionado.departamentoNombre}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {formatFecha(fichajeSeleccionado.fecha)}
                </p>
              </div>

              {/* Horarios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm font-medium">Entrada</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatHora(fichajeSeleccionado.horaEntrada)}
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Salida</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatHora(fichajeSeleccionado.horaSalida)}
                  </p>
                </div>
              </div>

              {/* Pausa */}
              {(fichajeSeleccionado.pausaInicio || fichajeSeleccionado.pausaFin) && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <Pause className="h-4 w-4" />
                    <span className="text-sm font-medium">Pausa</span>
                  </div>
                  <p className="text-sm">
                    {formatHora(fichajeSeleccionado.pausaInicio)} - {formatHora(fichajeSeleccionado.pausaFin)}
                  </p>
                </div>
              )}

              {/* Horas trabajadas */}
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Horas trabajadas</span>
                </div>
                <span className="text-lg font-semibold">
                  {fichajeSeleccionado.horasTrabajadas?.toFixed(2) || '0'} h
                </span>
              </div>

              {/* Tipo y Estado */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIconoTipo(fichajeSeleccionado.tipo)}
                  <span>{TIPOS_FICHAJE.find((t) => t.value === fichajeSeleccionado.tipo)?.label}</span>
                </div>
                <Badge className={getColorEstado(fichajeSeleccionado.estado)}>
                  {ESTADOS_FICHAJE.find((e) => e.value === fichajeSeleccionado.estado)?.label}
                </Badge>
              </div>

              {/* Ubicación Entrada */}
              {fichajeSeleccionado.ubicacionEntrada && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Ubicación Entrada</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lat: {fichajeSeleccionado.ubicacionEntrada.latitud?.toFixed(6)},
                    Lng: {fichajeSeleccionado.ubicacionEntrada.longitud?.toFixed(6)}
                  </p>
                  {fichajeSeleccionado.ubicacionEntrada.direccion && (
                    <p className="text-sm mt-1">{fichajeSeleccionado.ubicacionEntrada.direccion}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${fichajeSeleccionado.ubicacionEntrada.latitud},${fichajeSeleccionado.ubicacionEntrada.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              )}

              {/* Ubicación Salida */}
              {fichajeSeleccionado.ubicacionSalida && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">Ubicación Salida</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lat: {fichajeSeleccionado.ubicacionSalida.latitud?.toFixed(6)},
                    Lng: {fichajeSeleccionado.ubicacionSalida.longitud?.toFixed(6)}
                  </p>
                  {fichajeSeleccionado.ubicacionSalida.direccion && (
                    <p className="text-sm mt-1">{fichajeSeleccionado.ubicacionSalida.direccion}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${fichajeSeleccionado.ubicacionSalida.latitud},${fichajeSeleccionado.ubicacionSalida.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              )}

              {/* IPs */}
              {(fichajeSeleccionado.ipEntrada || fichajeSeleccionado.ipSalida) && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm font-medium">Direcciones IP</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {fichajeSeleccionado.ipEntrada && (
                      <div>
                        <span className="text-muted-foreground">Entrada:</span>{' '}
                        <span className="font-mono">{fichajeSeleccionado.ipEntrada}</span>
                      </div>
                    )}
                    {fichajeSeleccionado.ipSalida && (
                      <div>
                        <span className="text-muted-foreground">Salida:</span>{' '}
                        <span className="font-mono">{fichajeSeleccionado.ipSalida}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {fichajeSeleccionado.observaciones && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Observaciones</p>
                  <p className="text-sm text-muted-foreground">
                    {fichajeSeleccionado.observaciones}
                  </p>
                </div>
              )}

              {/* Incidencia */}
              {fichajeSeleccionado.incidencia && (
                <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Incidencia</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {fichajeSeleccionado.incidencia}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMACIÓN PARA ELIMINAR */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) =>
        setDeleteDialog({ ...deleteDialog, open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar {deleteDialog.fichajeIds.length === 1
                ? 'este fichaje'
                : `estos ${deleteDialog.fichajeIds.length} fichajes`}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, fichajeIds: [] })}
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
    </DashboardLayout>
  )
}
