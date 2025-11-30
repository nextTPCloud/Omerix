'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { personalService } from '@/services/personal.service'
import vistasService from '@/services/vistas-guardadas.service'
import {
  Personal,
  PersonalFilters,
  TIPOS_CONTRATO,
  ESTADOS_EMPLEADO,
  TIPOS_JORNADA,
} from '@/types/personal.types'
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
  Users,
  UserCheck,
  UserX,
  Briefcase,
  AlertCircle,
  Columns,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'

// Nuevos imports
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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO PERSONAL
// ============================================

const DEFAULT_PERSONAL_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'nif', visible: true, orden: 2 },
    { key: 'puesto', visible: true, orden: 3 },
    { key: 'tipoContrato', visible: true, orden: 4 },
    { key: 'emailCorporativo', visible: true, orden: 5 },
    { key: 'telefono', visible: true, orden: 6 },
    { key: 'antiguedad', visible: true, orden: 7 },
    { key: 'departamento', visible: false, orden: 8 },
    { key: 'salario', visible: false, orden: 9 },
    { key: 'activo', visible: true, orden: 10 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'apellidos',
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

export default function PersonalPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  // Estados de datos
  const [personal, setPersonal] = useState<Personal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedPersonal, setSelectedPersonal] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Filtros generales
  const [filters, setFilters] = useState<PersonalFilters>({
    page: 1,
    limit: 25,
    sortBy: 'apellidos',
    sortOrder: 'asc',
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
    personalIds: string[]
    personalNombres: string[]
  }>({
    open: false,
    personalIds: [],
    personalNombres: [],
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'nif', label: 'NIF', sortable: true },
    { key: 'puesto', label: 'Puesto', sortable: true },
    { key: 'tipoContrato', label: 'Tipo Contrato', sortable: true },
    { key: 'emailCorporativo', label: 'Email Corp.', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: false },
    { key: 'antiguedad', label: 'Antigüedad', sortable: true },
    { key: 'departamento', label: 'Departamento', sortable: true },
    { key: 'salario', label: 'Salario', sortable: true },
    { key: 'activo', label: 'Estado', sortable: true },
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
  } = useModuleConfig('personal', DEFAULT_PERSONAL_CONFIG, {
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
    return moduleConfig?.sortConfig || DEFAULT_PERSONAL_CONFIG.sortConfig
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
    if (!personal || !Array.isArray(personal)) {
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        indefinidos: 0,
        temporales: 0,
        enVacaciones: 0,
      }
    }

    const total = pagination?.total || 0
    const activos = personal.filter((p) => p?.activo).length
    const inactivos = personal.filter((p) => !p?.activo).length
    const indefinidos = personal.filter((p) => p?.datosLaborales?.tipoContrato === 'indefinido').length
    const temporales = personal.filter((p) => p?.datosLaborales?.tipoContrato === 'temporal').length
    const enVacaciones = personal.filter((p) => p?.estado === 'vacaciones').length

    return {
      total,
      activos,
      inactivos,
      indefinidos,
      temporales,
      enVacaciones,
    }
  }, [personal, pagination?.total])

  // ============================================
  // CARGAR PERSONAL
  // ============================================

  const cargarPersonal = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await personalService.getAll(filters)

      if (response.success) {
        setPersonal(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setPersonal([])
        toast.error('Error al cargar el personal')
      }
    } catch (error) {
      console.error('Error al cargar personal:', error)
      setPersonal([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar el personal')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarPersonal()
  }, [cargarPersonal])

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
    const searchableFields = ['codigo', 'nombre', 'nif', 'puesto', 'emailCorporativo', 'telefono', 'departamento']
    const searchTerms: string[] = []

    searchableFields.forEach(field => {
      if (debouncedColumnFilters[field]) {
        searchTerms.push(debouncedColumnFilters[field])
      }
    })

    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }

    // Filtros de select y numéricos
    Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
      if (key === 'tipoContrato') {
        if (value !== 'all') {
          combinedFilters.tipoContrato = value
        }
      } else if (key === 'activo') {
        if (value !== 'all') {
          combinedFilters.activo = value === 'true'
        }
      } else if (key === 'estado') {
        if (value !== 'all') {
          combinedFilters.estado = value
        }
      } else if (key === 'antiguedadRango') {
        if (value && value !== 'all') {
          combinedFilters.antiguedadRango = value
        }
      } else if (key === 'salarioMinimo') {
        if (value) {
          combinedFilters.salarioMinimo = parseFloat(value)
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
          modulo: 'personal',
          nombre,
          descripcion,
          configuracion: moduleConfig,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'personal',
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
        const vistas = await vistasService.getAll('personal', true)
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
      setSelectedPersonal([])
    } else {
      setSelectedPersonal(personal.map(p => p._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectPersonal = (personalId: string) => {
    if (selectedPersonal.includes(personalId)) {
      setSelectedPersonal(selectedPersonal.filter(id => id !== personalId))
    } else {
      setSelectedPersonal([...selectedPersonal, personalId])
    }
  }

  // ============================================
  // ACCIONES EN LOTE
  // ============================================

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'delete':
        if (selectedPersonal.length > 0) {
          const nombresSeleccionados = personal
            .filter(p => selectedPersonal.includes(p._id))
            .map(p => `${p.nombre} ${p.apellidos}`)

          setDeleteDialog({
            open: true,
            personalIds: selectedPersonal,
            personalNombres: nombresSeleccionados,
          })
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
        selectedPersonal.map(id =>
          personalService.changeStatus(id, activate)
        )
      )
      toast.success(`Personal ${activate ? 'activado' : 'desactivado'} correctamente`)
      cargarPersonal()
      setSelectedPersonal([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  // ============================================
  // ELIMINAR PERSONAL
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.personalIds.length === 1) {
        await personalService.delete(deleteDialog.personalIds[0])
      } else {
        await personalService.deleteMany(deleteDialog.personalIds)
      }

      toast.success('Personal eliminado correctamente')
      cargarPersonal()
      setSelectedPersonal([])
      setSelectAll(false)
      setDeleteDialog({ open: false, personalIds: [], personalNombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // ACCIONES POR EMPLEADO
  // ============================================

  const handleAction = async (personalId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/personal/${personalId}`)
        break
      case 'edit':
        router.push(`/personal/${personalId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando empleado...')
          const response = await personalService.duplicar(personalId)
          toast.dismiss()
          if (response.success) {
            toast.success('Empleado duplicado correctamente')
            router.push(`/personal/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar el empleado')
        }
        break
      case 'delete':
        const empleado = personal.find(p => p._id === personalId)
        if (empleado) {
          setDeleteDialog({
            open: true,
            personalIds: [personalId],
            personalNombres: [`${empleado.nombre} ${empleado.apellidos}`],
          })
        }
        break
      case 'toggle-active':
        const emp = personal.find(p => p._id === personalId)
        if (emp) {
          await handleToggleStatus(!emp.activo)
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
              <Users className="h-7 w-7 text-primary" />
              Personal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona los empleados y personal de la empresa
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarPersonal}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/personal/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Empleado</span>
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
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
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
                  <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
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
                  <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Indefinidos</p>
                  <p className="text-xl font-bold">{stats.indefinidos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Temporales</p>
                  <p className="text-xl font-bold">{stats.temporales}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Vacaciones</p>
                  <p className="text-xl font-bold">{stats.enVacaciones}</p>
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
              placeholder="Buscar por nombre, NIF, puesto..."
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
              modulo="personal"
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
              data={personal}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="personal"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Indefinidos', value: stats.indefinidos },
                { label: 'Temporales', value: stats.temporales },
                { label: 'Vacaciones', value: stats.enVacaciones },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={personal}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Personal"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Indefinidos', value: stats.indefinidos },
                { label: 'Temporales', value: stats.temporales },
                { label: 'Vacaciones', value: stats.enVacaciones },
              ]}
              filters={columnFiltersInput}
            />

            {/* IMPORTAR */}
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedPersonal.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedPersonal.length} {selectedPersonal.length === 1 ? 'empleado seleccionado' : 'empleados seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
                Activar
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
                Desactivar
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
                    <th className={`${densityClasses.header} text-left w-[220px]`}>
                      <button
                        onClick={() => handleSort('apellidos')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Nombre
                        {getSortIcon('apellidos')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('nif') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button
                        onClick={() => handleSort('nif')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        NIF
                        {getSortIcon('nif')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('puesto') && (
                    <th className={`${densityClasses.header} text-left w-[180px]`}>
                      <button
                        onClick={() => handleSort('puesto')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Puesto
                        {getSortIcon('puesto')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('tipoContrato') && (
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('tipoContrato')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Tipo Contrato
                        {getSortIcon('tipoContrato')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('emailCorporativo') && (
                    <th className={`${densityClasses.header} text-left w-[240px]`}>
                      <button
                        onClick={() => handleSort('emailCorporativo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Email Corp.
                        {getSortIcon('emailCorporativo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('telefono') && (
                    <th className={`${densityClasses.header} text-left w-[140px] text-xs font-semibold uppercase tracking-wider`}>
                      Teléfono
                    </th>
                  )}

                  {columnasVisibles.includes('antiguedad') && (
                    <th className={`${densityClasses.header} text-center min-w-[110px]`}>
                      <button
                        onClick={() => handleSort('antiguedad')}
                        className="flex items-center justify-center w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Antigüedad
                        {getSortIcon('antiguedad')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('departamento') && (
                    <th className={`${densityClasses.header} text-left min-w-[150px]`}>
                      <button
                        onClick={() => handleSort('departamento')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Departamento
                        {getSortIcon('departamento')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('salario') && (
                    <th className={`${densityClasses.header} text-right min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('salario')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Salario
                        {getSortIcon('salario')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('activo') && (
                    <th className={`${densityClasses.header} text-left min-w-[90px]`}>
                      <button
                        onClick={() => handleSort('activo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Estado
                        {getSortIcon('activo')}
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

                  {columnasVisibles.includes('nif') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.nif || ''}
                        onChange={(e) => handleColumnFilterInput('nif', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('puesto') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.puesto || ''}
                        onChange={(e) => handleColumnFilterInput('puesto', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('tipoContrato') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.tipoContrato || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('tipoContrato', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          ...TIPOS_CONTRATO.map(t => ({ value: t.value, label: t.label })),
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('emailCorporativo') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.emailCorporativo || ''}
                        onChange={(e) => handleColumnFilterInput('emailCorporativo', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('telefono') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.telefono || ''}
                        onChange={(e) => handleColumnFilterInput('telefono', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('antiguedad') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.antiguedadRango || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('antiguedadRango', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: '0-1', label: '< 1 año' },
                          { value: '1-3', label: '1-3 años' },
                          { value: '3-5', label: '3-5 años' },
                          { value: '5+', label: '> 5 años' },
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('departamento') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.departamento || ''}
                        onChange={(e) => handleColumnFilterInput('departamento', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('salario') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Min..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        type="number"
                        value={columnFiltersInput.salarioMinimo || ''}
                        onChange={(e) => handleColumnFilterInput('salarioMinimo', e.target.value)}
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

                  <th className="sticky right-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando personal...
                    </td>
                  </tr>
                ) : personal.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontró personal</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo empleado</p>
                    </td>
                  </tr>
                ) : (
                  personal.map((empleado) => (
                    <tr
                      key={empleado._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedPersonal.includes(empleado._id)}
                            onCheckedChange={() => handleSelectPersonal(empleado._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.includes('codigo') && (
                        <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>{empleado.codigo}</td>
                      )}

                      {columnasVisibles.includes('nombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          <div className="max-w-[220px] truncate" title={empleado.nombreCompleto || `${empleado.nombre} ${empleado.apellidos}`}>
                            {empleado.nombreCompleto || `${empleado.nombre} ${empleado.apellidos}`}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('nif') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-mono`}>{empleado.documentacion?.nif || '-'}</td>
                      )}

                      {columnasVisibles.includes('puesto') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {empleado.datosLaborales?.puesto || '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('tipoContrato') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge variant="outline" className="text-xs font-medium">
                            {TIPOS_CONTRATO.find(t => t.value === empleado.datosLaborales?.tipoContrato)?.label || empleado.datosLaborales?.tipoContrato || '-'}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('emailCorporativo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {empleado.contacto?.emailCorporativo && (
                            <a
                              href={`mailto:${empleado.contacto.emailCorporativo}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline max-w-[240px] truncate block"
                              title={empleado.contacto.emailCorporativo}
                            >
                              {empleado.contacto.emailCorporativo}
                            </a>
                          )}
                          {!empleado.contacto?.emailCorporativo && (empleado.contacto?.email || '-')}
                        </td>
                      )}

                      {columnasVisibles.includes('telefono') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} whitespace-nowrap`}>
                          {empleado.contacto?.telefonoMovil || empleado.contacto?.telefono || '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('antiguedad') && (
                        <td className={`${densityClasses.cell} text-center ${densityClasses.text}`}>
                          <Badge variant="secondary" className="text-xs">
                            {empleado.antiguedad ? `${empleado.antiguedad} años` : '-'}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('departamento') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {empleado.datosLaborales?.departamento?.nombre || '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('salario') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-medium text-muted-foreground`}>
                          {empleado.datosEconomicos?.salarioBrutoAnual ? (
                            empleado.datosEconomicos.salarioBrutoAnual.toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            })
                          ) : (
                            '-'
                          )}
                        </td>
                      )}

                      {columnasVisibles.includes('activo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge
                            variant={empleado.activo ? 'default' : 'secondary'}
                            className={`text-xs font-medium ${
                              empleado.activo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {empleado.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
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
                            <DropdownMenuItem onClick={() => handleAction(empleado._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(empleado._id, 'edit')}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(empleado._id, 'duplicate')}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleAction(empleado._id, 'toggle-active')}>
                              {empleado.activo ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleAction(empleado._id, 'delete')}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))}
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

        {/* DIALOG DE CONFIRMACIÓN PARA ELIMINAR */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) =>
          setDeleteDialog({ ...deleteDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.personalIds.length === 1
                  ? 'el siguiente empleado'
                  : `los siguientes ${deleteDialog.personalIds.length} empleados`}?
                <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {deleteDialog.personalNombres.map((nombre, index) => (
                    <li key={index} className="text-sm font-medium">• {nombre}</li>
                  ))}
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, personalIds: [], personalNombres: [] })}
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
