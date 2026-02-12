'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { proveedoresService } from '@/services/proveedores.service'
import vistasService from '@/services/vistas-guardadas.service'
import {
  Proveedor,
  ProveedoresFilters,
  TIPOS_PROVEEDOR,
} from '@/types/proveedor.types'
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
  Upload,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  FileSpreadsheet,
  RefreshCw,
  Building2,
  AlertCircle,
  Columns,
  Package,
  Truck,
  Receipt,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Star,
  User,
  Briefcase,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { usePermissions } from '@/hooks/usePermissions'
import { ColumnaConfig } from '@/services/configuracion.service'

// Componentes UI reutilizables
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

// Filtros avanzados
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { PROVEEDORES_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'

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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO PROVEEDORES
// ============================================

const DEFAULT_PROVEEDORES_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'nombreComercial', visible: false, orden: 2 },
    { key: 'nif', visible: true, orden: 3 },
    { key: 'email', visible: true, orden: 4 },
    { key: 'telefono', visible: true, orden: 5 },
    { key: 'tipoProveedor', visible: true, orden: 6 },
    { key: 'calificacion', visible: true, orden: 7 },
    { key: 'totalCompras', visible: false, orden: 8 },
    { key: 'diasPago', visible: false, orden: 9 },
    { key: 'activo', visible: true, orden: 10 },
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

export default function ProveedoresPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  // Estados de datos
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedProveedores, setSelectedProveedores] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna (legacy)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Filtros avanzados
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([])

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 300)

  // Filtros generales
  const [filters, setFilters] = useState<ProveedoresFilters>({
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
    proveedorIds: string[]
    proveedorNombres: string[]
  }>({
    open: false,
    proveedorIds: [],
    proveedorNombres: [],
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'nombreComercial', label: 'Nombre Comercial', sortable: true },
    { key: 'nif', label: 'NIF/CIF', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: true },
    { key: 'tipoProveedor', label: 'Tipo', sortable: true },
    { key: 'calificacion', label: 'Calificación', sortable: true },
    { key: 'totalCompras', label: 'Total Compras', sortable: true },
    { key: 'diasPago', label: 'Días Pago', sortable: true },
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
  updateAdvancedFilters,
  updateDensidad,
  resetConfig,
} = useModuleConfig('proveedores', DEFAULT_PROVEEDORES_CONFIG, {
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
    return moduleConfig?.sortConfig || DEFAULT_PROVEEDORES_CONFIG.sortConfig
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
    if (!proveedores || !Array.isArray(proveedores)) {
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        empresas: 0,
        autonomos: 0,
        particulares: 0,
      }
    }

    const total = pagination?.total || 0
    const activos = proveedores.filter((p) => p?.activo).length
    const inactivos = proveedores.filter((p) => !p?.activo).length
    const empresas = proveedores.filter((p) => p?.tipoProveedor === 'empresa').length
    const autonomos = proveedores.filter((p) => p?.tipoProveedor === 'autonomo').length
    const particulares = proveedores.filter((p) => p?.tipoProveedor === 'particular').length

    return {
      total,
      activos,
      inactivos,
      empresas,
      autonomos,
      particulares,
    }
  }, [proveedores, pagination?.total])

  // ============================================
  // CARGAR PROVEEDORES
  // ============================================

  const cargarProveedores = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await proveedoresService.getAll(filters)

      if (response.success) {
        setProveedores(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setProveedores([])
        toast.error('Error al cargar los proveedores')
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
      setProveedores([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los proveedores')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarProveedores()
  }, [cargarProveedores])

  // ============================================
  // APLICAR FILTROS DEBOUNCED (SIN GUARDAR)
  // ============================================

  useEffect(() => {
    // Construir filtros combinados
    const combinedFilters: any = {
      page: 1,
      sortBy: currentSortKey,
      sortOrder: currentSortDirection,
      limit: currentLimit,
    }

    // Campos de búsqueda por texto
    const searchableFields = ['codigo', 'nombre', 'nombreComercial', 'nif', 'email', 'telefono']
    const searchTerms: string[] = []

    searchableFields.forEach(field => {
      if (debouncedColumnFilters[field]) {
        searchTerms.push(debouncedColumnFilters[field])
      }
    })

    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }

    // Filtros de select
    Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
      if (key === 'tipoProveedor') {
        if (value !== 'all') {
          combinedFilters.tipoProveedor = value
        }
      } else if (key === 'activo') {
        if (value !== 'all') {
          combinedFilters.activo = value === 'true'
        }
      }
    })

    // APLICAR FILTROS AVANZADOS
    if (debouncedAdvancedFilters.length > 0) {
      Object.assign(combinedFilters, filtersToQueryParams(debouncedAdvancedFilters))
    }

    setFilters(combinedFilters)

  }, [debouncedColumnFilters, debouncedAdvancedFilters, currentSortKey, currentSortDirection, currentLimit])

  // ============================================
  // SINCRONIZAR CONFIGURACIÓN GUARDADA CON FILTROS (SOLO CARGA INICIAL)
  // ============================================
  useEffect(() => {
    if (!moduleConfig || isLoadingConfig) return
    if (!isInitialLoad.current) return

    const initialFilters = (moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0)
      ? moduleConfig.columnFilters
      : { activo: 'true' }

    setColumnFiltersInput(initialFilters as any)

    // Cargar filtros avanzados guardados
    if (moduleConfig?.advancedFilters && moduleConfig.advancedFilters.length > 0) {
      setAdvancedFilters(savedToFilters(moduleConfig.advancedFilters, PROVEEDORES_FILTERABLE_FIELDS))
    }

    isInitialLoad.current = false

  }, [moduleConfig, isLoadingConfig])

  // GUARDAR FILTROS AVANZADOS CUANDO CAMBIAN
  useEffect(() => {
    if (isInitialLoad.current || isLoadingConfig) return
    updateAdvancedFilters(filtersToSaved(advancedFilters))
  }, [advancedFilters, isLoadingConfig, updateAdvancedFilters])

  // ============================================
  // HANDLERS PARA VISTAS GUARDADAS
  // ============================================

  const handleAplicarVista = useCallback((configuracion: any) => {
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

    // Aplicar filtros avanzados de la vista
    if (configuracion.advancedFilters?.length > 0) {
      setAdvancedFilters(savedToFilters(configuracion.advancedFilters, PROVEEDORES_FILTERABLE_FIELDS))
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
      // Combinar moduleConfig con los filtros actuales (evita problemas de debounce)
      const savedAdvancedFilters = filtersToSaved(advancedFilters)
      const configToSave = {
        ...moduleConfig,
        advancedFilters: savedAdvancedFilters,
        columnFilters: columnFiltersInput,
      }

      if (vistaIdActualizar) {
        await vistasService.update(vistaIdActualizar, {
          modulo: 'proveedores',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'proveedores',
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
  }, [moduleConfig, columnFiltersInput, advancedFilters])

  // Cargar y aplicar vista por defecto al iniciar
  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('proveedores', true)
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
      setSelectedProveedores([])
    } else {
      setSelectedProveedores(proveedores.map(p => p._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectProveedor = (proveedorId: string) => {
    if (selectedProveedores.includes(proveedorId)) {
      setSelectedProveedores(selectedProveedores.filter(id => id !== proveedorId))
    } else {
      setSelectedProveedores([...selectedProveedores, proveedorId])
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
        if (selectedProveedores.length > 0) {
          const nombresSeleccionados = proveedores
            .filter(p => selectedProveedores.includes(p._id))
            .map(p => p.nombre)

          setDeleteDialog({
            open: true,
            proveedorIds: selectedProveedores,
            proveedorNombres: nombresSeleccionados,
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
    const selectedData = proveedores.filter(p => selectedProveedores.includes(p._id))
    // TODO: Implementar exportación
    toast.success(`${selectedData.length} proveedores seleccionados para exportar`)
  }

  const handleToggleStatus = async (activate: boolean) => {
    try {
      await proveedoresService.setEstadoMultiples(selectedProveedores, activate)
      toast.success(`Proveedores ${activate ? 'activados' : 'desactivados'} correctamente`)
      cargarProveedores()
      setSelectedProveedores([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  // ============================================
  // ELIMINAR PROVEEDORES
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.proveedorIds.length === 1) {
        await proveedoresService.delete(deleteDialog.proveedorIds[0])
      } else {
        await proveedoresService.deleteMany(deleteDialog.proveedorIds)
      }

      toast.success('Proveedor(es) eliminado(s) correctamente')
      cargarProveedores()
      setSelectedProveedores([])
      setSelectAll(false)
      setDeleteDialog({ open: false, proveedorIds: [], proveedorNombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // ACCIONES POR PROVEEDOR
  // ============================================

  const handleProveedorAction = async (proveedorId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/proveedores/${proveedorId}`)
        break
      case 'edit':
        router.push(`/proveedores/${proveedorId}/editar`)
        break
      case 'delete':
        const proveedor = proveedores.find(p => p._id === proveedorId)
        if (proveedor) {
          setDeleteDialog({
            open: true,
            proveedorIds: [proveedorId],
            proveedorNombres: [proveedor.nombre],
          })
        }
        break
      case 'pedido-compra':
        router.push(`/compras/pedidos/nuevo?proveedorId=${proveedorId}`)
        break
      case 'albaran-compra':
        router.push(`/compras/albaranes/nuevo?proveedorId=${proveedorId}`)
        break
      case 'factura-compra':
        router.push(`/compras/facturas/nuevo?proveedorId=${proveedorId}`)
        break
      case 'consulta-pedidos':
        router.push(`/compras/pedidos?proveedorId=${proveedorId}`)
        break
      case 'consulta-facturas':
        router.push(`/compras/facturas?proveedorId=${proveedorId}`)
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
  // IMPORTAR PROVEEDORES
  // ============================================

  const handleImport = () => {
    toast.info('Importación de proveedores en desarrollo')
  }

  // ============================================
  // RENDERIZAR CALIFICACIÓN CON ESTRELLAS
  // ============================================
  const renderCalificacion = (calificacion?: number) => {
    if (!calificacion) return '-'
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= calificacion
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
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
              <Truck className="h-7 w-7 text-primary" />
              Proveedores
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tu cartera de proveedores
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarProveedores}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
{canCreate('proveedores') && (
            <Button asChild size="sm">
              <Link href="/proveedores/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Proveedor</span>
              </Link>
            </Button>
)}
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
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
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
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
                  <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Empresas</p>
                  <p className="text-xl font-bold">{stats.empresas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Autónomos</p>
                  <p className="text-xl font-bold">{stats.autonomos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Particulares</p>
                  <p className="text-xl font-bold">{stats.particulares}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={PROVEEDORES_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por nombre, NIF, email..."
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
              modulo="proveedores"
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
              data={proveedores}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="proveedores"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Empresas', value: stats.empresas },
                { label: 'Autónomos', value: stats.autonomos },
                { label: 'Particulares', value: stats.particulares },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={proveedores}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Proveedores"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Empresas', value: stats.empresas },
                { label: 'Autónomos', value: stats.autonomos },
                { label: 'Particulares', value: stats.particulares },
              ]}
              filters={columnFiltersInput}
            />

            {/* IMPORTAR */}
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedProveedores.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedProveedores.length} {selectedProveedores.length === 1 ? 'proveedor seleccionado' : 'proveedores seleccionados'}
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
{canDelete('proveedores') && (
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
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
                        onClick={() => handleSort('nombre')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Nombre
                        {getSortIcon('nombre')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('nombreComercial') && (
                    <th className={`${densityClasses.header} text-left w-[200px]`}>
                      <button
                        onClick={() => handleSort('nombreComercial')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Nombre Comercial
                        {getSortIcon('nombreComercial')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('nif') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button
                        onClick={() => handleSort('nif')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        NIF/CIF
                        {getSortIcon('nif')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('email') && (
                    <th className={`${densityClasses.header} text-left w-[240px]`}>
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Email
                        {getSortIcon('email')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('telefono') && (
                    <th className={`${densityClasses.header} text-left w-[140px]`}>
                      <button
                        onClick={() => handleSort('telefono')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Teléfono
                        {getSortIcon('telefono')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('tipoProveedor') && (
                    <th className={`${densityClasses.header} text-left min-w-[110px]`}>
                      <button
                        onClick={() => handleSort('tipoProveedor')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Tipo
                        {getSortIcon('tipoProveedor')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('calificacion') && (
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('calificacion')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Calificación
                        {getSortIcon('calificacion')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('totalCompras') && (
                    <th className={`${densityClasses.header} text-right min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('totalCompras')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Total Compras
                        {getSortIcon('totalCompras')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('diasPago') && (
                    <th className={`${densityClasses.header} text-right min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('diasPago')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Días Pago
                        {getSortIcon('diasPago')}
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

                  {columnasVisibles.includes('nombreComercial') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.nombreComercial || ''}
                        onChange={(e) => handleColumnFilterInput('nombreComercial', e.target.value)}
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

                  {columnasVisibles.includes('email') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.email || ''}
                        onChange={(e) => handleColumnFilterInput('email', e.target.value)}
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

                  {columnasVisibles.includes('tipoProveedor') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.tipoProveedor || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('tipoProveedor', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          ...TIPOS_PROVEEDOR.map(t => ({ value: t.value, label: t.label })),
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('calificacion') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('totalCompras') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('diasPago') && (
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
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando proveedores...
                    </td>
                  </tr>
                ) : proveedores.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron proveedores</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo proveedor</p>
                    </td>
                  </tr>
                ) : (
                  proveedores.map((proveedor) => (
                    <tr
                      key={proveedor._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedProveedores.includes(proveedor._id)}
                            onCheckedChange={() => handleSelectProveedor(proveedor._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.includes('codigo') && (
                        <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>{proveedor.codigo}</td>
                      )}

                      {columnasVisibles.includes('nombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          <div className="max-w-[220px] truncate" title={proveedor.nombre}>
                            {proveedor.nombre}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('nombreComercial') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          <div className="max-w-[200px] truncate" title={proveedor.nombreComercial || ''}>
                            {proveedor.nombreComercial || '-'}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('nif') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-mono`}>{proveedor.nif}</td>
                      )}

                      {columnasVisibles.includes('email') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {proveedor.email && (
                            <a
                              href={`mailto:${proveedor.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline max-w-[240px] truncate block"
                              title={proveedor.email}
                            >
                              {proveedor.email}
                            </a>
                          )}
                        </td>
                      )}

                      {columnasVisibles.includes('telefono') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} whitespace-nowrap`}>
                          {proveedor.telefono && (
                            <a href={`tel:${proveedor.telefono}`} className="hover:text-primary">
                              {proveedor.telefono}
                            </a>
                          )}
                        </td>
                      )}

                      {columnasVisibles.includes('tipoProveedor') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge
                            variant={proveedor.tipoProveedor === 'empresa' ? 'default' : 'secondary'}
                            className="text-xs font-medium"
                          >
                            {TIPOS_PROVEEDOR.find(t => t.value === proveedor.tipoProveedor)?.label || proveedor.tipoProveedor}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('calificacion') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {renderCalificacion(proveedor.calificacion)}
                        </td>
                      )}

                      {columnasVisibles.includes('totalCompras') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-medium`}>
                          {(proveedor.totalCompras || 0).toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </td>
                      )}

                      {columnasVisibles.includes('diasPago') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text}`}>
                          {proveedor.diasPago ? `${proveedor.diasPago} días` : '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('activo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge
                            variant={proveedor.activo ? 'default' : 'secondary'}
                            className={`text-xs font-medium ${
                              proveedor.activo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {proveedor.activo ? 'Activo' : 'Inactivo'}
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
                            <DropdownMenuItem onClick={() => handleProveedorAction(proveedor._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProveedorAction(proveedor._id, 'edit')}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Crear Documento</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => handleProveedorAction(proveedor._id, 'pedido-compra')}>
                              <Package className="mr-2 h-4 w-4" />
                              Pedido de Compra
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProveedorAction(proveedor._id, 'albaran-compra')}>
                              <Truck className="mr-2 h-4 w-4" />
                              Albarán de Compra
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProveedorAction(proveedor._id, 'factura-compra')}>
                              <Receipt className="mr-2 h-4 w-4" />
                              Factura de Compra
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Consultas</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => handleProveedorAction(proveedor._id, 'consulta-pedidos')}>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver Pedidos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProveedorAction(proveedor._id, 'consulta-facturas')}>
                              <Receipt className="mr-2 h-4 w-4" />
                              Ver Facturas
                            </DropdownMenuItem>

{canDelete('proveedores') && (
                            <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleProveedorAction(proveedor._id, 'delete')}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
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
                ¿Estás seguro de que deseas eliminar {deleteDialog.proveedorIds.length === 1
                  ? 'el siguiente proveedor'
                  : `los siguientes ${deleteDialog.proveedorIds.length} proveedores`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.proveedorNombres.map((nombre, index) => (
                  <li key={index} className="text-sm font-medium">• {nombre}</li>
                ))}
              </ul>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, proveedorIds: [], proveedorNombres: [] })}
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
