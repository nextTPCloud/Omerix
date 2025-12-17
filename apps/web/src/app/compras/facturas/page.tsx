'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { facturasCompraService } from '@/services/facturas-compra.service'
import vistasService from '@/services/vistas-guardadas.service'
import {
  FacturaCompra,
  FacturasCompraFilters,
  ESTADOS_FACTURA_COMPRA,
  EstadoFacturaCompra,
} from '@/types/factura-compra.types'
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
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Receipt,
  CheckCircle2,
  XCircle,
  FileText,
  Ban,
  Clock,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Calendar,
  Bell,
  BellOff,
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
import { FACTURAS_COMPRA_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'
import { FacturasCompraAlertas } from '@/components/compras/FacturasCompraAlertas'

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
// CONFIGURACION POR DEFECTO DEL MODULO
// ============================================

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'numeroFacturaProveedor', visible: true, orden: 1 },
    { key: 'proveedorNombre', visible: true, orden: 2 },
    { key: 'estado', visible: true, orden: 3 },
    { key: 'fecha', visible: true, orden: 4 },
    { key: 'fechaVencimiento', visible: true, orden: 5 },
    { key: 'totalFactura', visible: true, orden: 6 },
    { key: 'totalPendiente', visible: true, orden: 7 },
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
// HELPERS
// ============================================

const getEstadoConfig = (estado: EstadoFacturaCompra) => {
  return ESTADOS_FACTURA_COMPRA.find(e => e.value === estado) || ESTADOS_FACTURA_COMPRA[0]
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function FacturasCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  // Proveedor preseleccionado desde URL
  const proveedorIdFromUrl = searchParams.get('proveedorId')
  const albaranCompraIdsFromUrl = searchParams.get('albaranCompraIds')

  // Estados de datos
  const [facturas, setFacturas] = useState<FacturaCompra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Seleccion multiple
  const [selectedFacturas, setSelectedFacturas] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna (legacy)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // FILTROS AVANZADOS
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([])
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 300)

  // Filtros generales
  const [filters, setFilters] = useState<FacturasCompraFilters>({
    page: 1,
    limit: 25,
    sortBy: 'fechaCreacion',
    sortOrder: 'desc',
    activo: true,
    proveedorId: proveedorIdFromUrl || undefined,
  })

  // Paginacion
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  })

  // UI States
  const [showStats, setShowStats] = useState(false)
  const [showAlertas, setShowAlertas] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    facturaIds: string[]
    facturaCodigos: string[]
  }>({
    open: false,
    facturaIds: [],
    facturaCodigos: [],
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Codigo', sortable: true },
    { key: 'numeroFacturaProveedor', label: 'Factura Prov.', sortable: true },
    { key: 'proveedorNombre', label: 'Proveedor', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'fechaVencimiento', label: 'Vencimiento', sortable: true },
    { key: 'totalFactura', label: 'Importe Total', sortable: true },
    { key: 'totalPendiente', label: 'Pendiente', sortable: true },
  ])

  // ============================================
  // CONFIGURACION DEL MODULO
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
  } = useModuleConfig('facturas-compra', DEFAULT_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  // ============================================
  // DERIVAR VALORES DESDE LA CONFIGURACION
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
  // ESTADISTICAS CALCULADAS
  // ============================================

  const stats = useMemo(() => {
    if (!facturas || !Array.isArray(facturas)) {
      return {
        total: 0,
        borradores: 0,
        pendientes: 0,
        parcialmentePagadas: 0,
        pagadas: 0,
        vencidas: 0,
        anuladas: 0,
        totalImporte: 0,
        totalPendiente: 0,
      }
    }

    const total = pagination?.total || 0
    const borradores = facturas.filter((f) => f?.estado === 'borrador').length
    const pendientes = facturas.filter((f) => f?.estado === 'pendiente_pago').length
    const parcialmentePagadas = facturas.filter((f) => f?.estado === 'parcialmente_pagada').length
    const pagadas = facturas.filter((f) => f?.estado === 'pagada').length
    const vencidas = facturas.filter((f) => f?.estado === 'vencida').length
    const anuladas = facturas.filter((f) => f?.estado === 'anulada').length
    const totalImporte = facturas.reduce((sum, f) => sum + (f?.totales?.totalFactura || 0), 0)
    const totalPendiente = facturas.reduce((sum, f) => sum + (f?.totales?.totalPendiente || 0), 0)

    return {
      total,
      borradores,
      pendientes,
      parcialmentePagadas,
      pagadas,
      vencidas,
      anuladas,
      totalImporte,
      totalPendiente,
    }
  }, [facturas, pagination?.total])

  // ============================================
  // CARGAR FACTURAS
  // ============================================

  const cargarFacturas = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await facturasCompraService.getAll(filters)

      if (response.success) {
        setFacturas(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setFacturas([])
        toast.error('Error al cargar las facturas de compra')
      }
    } catch (error) {
      console.error('Error al cargar facturas de compra:', error)
      setFacturas([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar las facturas de compra')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarFacturas()
  }, [cargarFacturas])

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

    // Mantener filtro de proveedor si viene de URL
    if (proveedorIdFromUrl) {
      combinedFilters.proveedorId = proveedorIdFromUrl
    }

    // Busqueda global
    if (searchTerm) {
      combinedFilters.search = searchTerm
    }

    // Campos de busqueda por texto (legacy)
    const searchableFields = ['codigo', 'numeroFacturaProveedor', 'proveedorNombre']
    const searchTerms: string[] = []

    searchableFields.forEach(field => {
      if (debouncedColumnFilters[field]) {
        searchTerms.push(debouncedColumnFilters[field])
      }
    })

    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }

    // Filtros de select (legacy)
    Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
      if (key === 'estado') {
        if (value !== 'all') {
          combinedFilters.estado = value
        }
      } else if (key === 'contabilizada') {
        if (value !== 'all') {
          combinedFilters.contabilizada = value === 'true'
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
      }
    })

    // FILTROS AVANZADOS
    if (debouncedAdvancedFilters.length > 0) {
      const advancedParams = filtersToQueryParams(debouncedAdvancedFilters)
      Object.assign(combinedFilters, advancedParams)
    }

    setFilters(combinedFilters)

  }, [debouncedColumnFilters, debouncedAdvancedFilters, searchTerm, currentSortKey, currentSortDirection, currentLimit, proveedorIdFromUrl])

  // ============================================
  // SINCRONIZAR CONFIGURACION GUARDADA (SOLO CARGA INICIAL)
  // ============================================
  useEffect(() => {
    if (!moduleConfig || isLoadingConfig) return
    if (!isInitialLoad.current) return

    const initialFilters = (moduleConfig?.columnFilters && Object.keys(moduleConfig.columnFilters).length > 0)
      ? moduleConfig.columnFilters
      : { activo: 'true' }

    setColumnFiltersInput(initialFilters as any)

    // Restaurar filtros avanzados guardados
    if (moduleConfig?.advancedFilters && moduleConfig.advancedFilters.length > 0) {
      const restored = savedToFilters(moduleConfig.advancedFilters as any, FACTURAS_COMPRA_FILTERABLE_FIELDS)
      setAdvancedFilters(restored)
    }

    isInitialLoad.current = false

  }, [moduleConfig, isLoadingConfig])

  // ============================================
  // GUARDAR FILTROS AVANZADOS CUANDO CAMBIAN
  // ============================================
  useEffect(() => {
    if (isInitialLoad.current || isLoadingConfig) return

    const savedFilters = filtersToSaved(advancedFilters)
    updateAdvancedFilters(savedFilters)
  }, [advancedFilters, isLoadingConfig, updateAdvancedFilters])

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

    if (configuracion.advancedFilters && configuracion.advancedFilters.length > 0) {
      const restored = savedToFilters(configuracion.advancedFilters, FACTURAS_COMPRA_FILTERABLE_FIELDS)
      setAdvancedFilters(restored)
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
  }, [updateColumnas, updateSortConfig, updateDensidad])

  const handleGuardarVista = useCallback(async (
    nombre: string,
    descripcion?: string,
    esDefault?: boolean,
    vistaIdActualizar?: string
  ) => {
    try {
      // Combinar moduleConfig con los filtros avanzados actuales (evita problemas de debounce)
      const savedAdvancedFilters = filtersToSaved(advancedFilters)
      const configToSave = {
        ...moduleConfig,
        advancedFilters: savedAdvancedFilters,
        columnFilters: columnFiltersInput,
      }

      if (vistaIdActualizar) {
        await vistasService.update(vistaIdActualizar, {
          modulo: 'facturas-compra',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'facturas-compra',
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

  // Cargar y aplicar vista por defecto al iniciar
  useEffect(() => {
    const cargarVistaDefault = async () => {
      try {
        const vistas = await vistasService.getAll('facturas-compra', true)
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
  // SELECCION MULTIPLE
  // ============================================

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFacturas([])
    } else {
      setSelectedFacturas(facturas.map(f => f._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectFactura = (facturaId: string) => {
    if (selectedFacturas.includes(facturaId)) {
      setSelectedFacturas(selectedFacturas.filter(id => id !== facturaId))
    } else {
      setSelectedFacturas([...selectedFacturas, facturaId])
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
        if (selectedFacturas.length > 0) {
          const codigosSeleccionados = facturas
            .filter(f => selectedFacturas.includes(f._id))
            .map(f => f.codigo)

          setDeleteDialog({
            open: true,
            facturaIds: selectedFacturas,
            facturaCodigos: codigosSeleccionados,
          })
        }
        break
    }
  }

  const handleExportSelected = () => {
    const selectedData = facturas.filter(f => selectedFacturas.includes(f._id))
    toast.success(`${selectedData.length} facturas seleccionadas para exportar`)
  }

  // ============================================
  // ELIMINAR FACTURAS
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.facturaIds.length === 1) {
        await facturasCompraService.delete(deleteDialog.facturaIds[0])
      } else {
        await facturasCompraService.deleteMany(deleteDialog.facturaIds)
      }

      toast.success('Factura(s) de compra eliminada(s) correctamente')
      cargarFacturas()
      setSelectedFacturas([])
      setSelectAll(false)
      setDeleteDialog({ open: false, facturaIds: [], facturaCodigos: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // ACCIONES POR FACTURA
  // ============================================

  const handleFacturaAction = async (facturaId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/compras/facturas/${facturaId}`)
        break
      case 'edit':
        router.push(`/compras/facturas/${facturaId}/editar`)
        break
      case 'delete':
        const factura = facturas.find(f => f._id === facturaId)
        if (factura) {
          setDeleteDialog({
            open: true,
            facturaIds: [facturaId],
            facturaCodigos: [factura.codigo],
          })
        }
        break
      case 'registrar-pago':
        router.push(`/compras/facturas/${facturaId}/pago`)
        break
      case 'anular':
        try {
          await facturasCompraService.cambiarEstado(facturaId, 'anulada')
          toast.success('Factura anulada')
          cargarFacturas()
        } catch (error) {
          toast.error('Error al anular factura')
        }
        break
      default:
        toast.info(`Accion "${action}" en desarrollo`)
    }
  }

  // ============================================
  // GESTION DE COLUMNAS
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
  // PAGINACION INTELIGENTE
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
    toast.success(`Mostrando ${newLimit} registros por pagina`)
  }

  // ============================================
  // HELPERS
  // ============================================

  const getProveedorNombre = (proveedorId: any, proveedorNombre: string) => {
    if (typeof proveedorId === 'object' && proveedorId !== null) {
      return proveedorId.nombreComercial || proveedorId.nombre
    }
    return proveedorNombre || '-'
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

  // Calcular dias vencidos
  const getDiasVencimiento = (vencimientos: any[]) => {
    if (!vencimientos || vencimientos.length === 0) return null

    // Buscar el primer vencimiento pendiente
    const vencimientoPendiente = vencimientos.find(v => !v.pagado)
    if (!vencimientoPendiente) return null

    try {
      const fechaVencimiento = new Date(vencimientoPendiente.fechaVencimiento)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      fechaVencimiento.setHours(0, 0, 0, 0)
      const diff = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      return diff
    } catch {
      return null
    }
  }

  const getProximoVencimiento = (vencimientos: any[]) => {
    if (!vencimientos || vencimientos.length === 0) return null
    const vencimientoPendiente = vencimientos.find(v => !v.pagado)
    return vencimientoPendiente?.fechaVencimiento
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
            <p className="text-sm text-muted-foreground">Cargando configuracion...</p>
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
              <Receipt className="h-7 w-7 text-primary" />
              Facturas de Compra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona las facturas de tus proveedores
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlertas(!showAlertas)}
              title={showAlertas ? 'Ocultar alertas' : 'Mostrar alertas'}
            >
              {showAlertas ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Alertas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadisticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarFacturas}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
{canCreate('facturas-compra') && (
            <Button asChild size="sm">
              <Link href="/compras/facturas/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nueva Factura</span>
              </Link>
            </Button>
            )}
          </div>
        </div>

        {/* ALERTAS DE FACTURAS DE COMPRA */}
        {showAlertas && (
          <FacturasCompraAlertas
            diasAlerta={7}
            onRefresh={cargarFacturas}
            collapsible={true}
            defaultCollapsed={false}
          />
        )}

        {/* ESTADISTICAS RAPIDAS */}
        {showStats && (
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Borradores</p>
                  <p className="text-xl font-bold">{stats.borradores}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                  <p className="text-xl font-bold">{stats.pendientes}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <CreditCard className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parc. Pagadas</p>
                  <p className="text-xl font-bold">{stats.parcialmentePagadas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagadas</p>
                  <p className="text-xl font-bold">{stats.pagadas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencidas</p>
                  <p className="text-xl font-bold">{stats.vencidas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Ban className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Anuladas</p>
                  <p className="text-xl font-bold">{stats.anuladas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Receipt className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalImporte)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendiente</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalPendiente)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={FACTURAS_COMPRA_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por codigo, proveedor, numero factura..."
        />

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {/* MENU DE CONFIGURACION */}
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(newDensity) => {
                updateDensidad(newDensity)
                toast.success(`Densidad cambiada a ${newDensity}`)
              }}
              modulo="facturas-compra"
              configuracionActual={moduleConfig}
              onAplicarVista={handleAplicarVista}
              onGuardarVista={handleGuardarVista}
              onRestablecer={async () => {
                await resetConfig()
                toast.success('Configuracion restablecida')
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

            {/* EXPORTACION */}
            <ExportButton
              data={facturas}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="facturas-compra"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Pagadas', value: stats.pagadas },
                { label: 'Vencidas', value: stats.vencidas },
                { label: 'Importe Total', value: formatCurrency(stats.totalImporte) },
                { label: 'Pendiente', value: formatCurrency(stats.totalPendiente) },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={facturas}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Facturas de Compra"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Pagadas', value: stats.pagadas },
                { label: 'Vencidas', value: stats.vencidas },
              ]}
              filters={columnFiltersInput}
            />

            {/* IMPORTAR */}
            <Button variant="outline" size="sm" onClick={() => toast.info('Importacion en desarrollo')}>
              <Upload className="h-4 w-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedFacturas.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedFacturas.length} {selectedFacturas.length === 1 ? 'factura seleccionada' : 'facturas seleccionadas'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>
{canDelete('facturas-compra') && (
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
              )}
            </div>
          </Card>
        )}

        {/* TABLA PROFESIONAL */}
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

                  {columnasVisibles.includes('codigo') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button
                        onClick={() => handleSort('codigo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Codigo
                        {getSortIcon('codigo')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('numeroFacturaProveedor') && (
                    <th className={`${densityClasses.header} text-left w-[140px]`}>
                      <button
                        onClick={() => handleSort('numeroFacturaProveedor')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Factura Prov.
                        {getSortIcon('numeroFacturaProveedor')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('proveedorNombre') && (
                    <th className={`${densityClasses.header} text-left w-[200px]`}>
                      <button
                        onClick={() => handleSort('proveedorNombre')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Proveedor
                        {getSortIcon('proveedorNombre')}
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

                  {columnasVisibles.includes('fechaVencimiento') && (
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Vencimiento
                      </span>
                    </th>
                  )}

                  {columnasVisibles.includes('totalFactura') && (
                    <th className={`${densityClasses.header} text-right min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('totales.totalFactura')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Importe
                        {getSortIcon('totales.totalFactura')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('totalPendiente') && (
                    <th className={`${densityClasses.header} text-right min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('totales.totalPendiente')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Pendiente
                        {getSortIcon('totales.totalPendiente')}
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

                  {columnasVisibles.includes('numeroFacturaProveedor') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.numeroFacturaProveedor || ''}
                        onChange={(e) => handleColumnFilterInput('numeroFacturaProveedor', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('proveedorNombre') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.proveedorNombre || ''}
                        onChange={(e) => handleColumnFilterInput('proveedorNombre', e.target.value)}
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
                          ...ESTADOS_FACTURA_COMPRA.map(e => ({ value: e.value, label: e.label }))
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

                  {columnasVisibles.includes('fechaVencimiento') && (
                    <th className="px-3 py-1.5">
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={columnFiltersInput.fechaHasta || ''}
                        onChange={(e) => handleColumnFilterInput('fechaHasta', e.target.value)}
                        title="Vencimiento hasta"
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('totalFactura') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('totalPendiente') && (
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
                      Cargando facturas de compra...
                    </td>
                  </tr>
                ) : facturas.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron facturas de compra</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear una nueva factura</p>
                    </td>
                  </tr>
                ) : (
                  facturas.map((factura) => {
                    const estadoConfig = getEstadoConfig(factura.estado)
                    const diasVencimiento = getDiasVencimiento(factura.vencimientos)
                    const proximoVencimiento = getProximoVencimiento(factura.vencimientos)

                    return (
                      <tr
                        key={factura._id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedFacturas.includes(factura._id)}
                              onCheckedChange={() => handleSelectFactura(factura._id)}
                            />
                          </div>
                        </td>

                        {columnasVisibles.includes('codigo') && (
                          <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>
                            <Link href={`/compras/facturas/${factura._id}`} className="hover:underline hover:text-primary">
                              {factura.codigo}
                            </Link>
                          </td>
                        )}

                        {columnasVisibles.includes('numeroFacturaProveedor') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-muted-foreground`}>
                            {factura.numeroFacturaProveedor || '-'}
                          </td>
                        )}

                        {columnasVisibles.includes('proveedorNombre') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="max-w-[200px] truncate" title={getProveedorNombre(factura.proveedorId, factura.proveedorNombre)}>
                              {getProveedorNombre(factura.proveedorId, factura.proveedorNombre)}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('estado') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <Badge className={`text-xs font-medium text-white ${estadoConfig.color}`}>
                              {estadoConfig.label}
                            </Badge>
                          </td>
                        )}

                        {columnasVisibles.includes('fecha') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {formatFecha(factura.fecha)}
                          </td>
                        )}

                        {columnasVisibles.includes('fechaVencimiento') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">
                                {formatFecha(proximoVencimiento)}
                              </span>
                              {diasVencimiento !== null && factura.estado !== 'pagada' && factura.estado !== 'anulada' && (
                                <span className={`text-xs font-medium ml-1 ${
                                  diasVencimiento < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : diasVencimiento <= 7
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-green-600 dark:text-green-400'
                                }`}>
                                  ({diasVencimiento}d)
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('totalFactura') && (
                          <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold`}>
                            {formatCurrency(factura.totales?.totalFactura || 0)}
                          </td>
                        )}

                        {columnasVisibles.includes('totalPendiente') && (
                          <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold ${(factura.totales?.totalPendiente || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(factura.totales?.totalPendiente || 0)}
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
                              <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'view')}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'edit')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Pagos</DropdownMenuLabel>

                              {factura.estado !== 'pagada' && factura.estado !== 'anulada' && (
                                <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'registrar-pago')}>
                                  <CreditCard className="mr-2 h-4 w-4 text-green-600" />
                                  Registrar Pago
                                </DropdownMenuItem>
                              )}

                              {factura.estado !== 'anulada' && factura.estado !== 'pagada' && (
                                <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'anular')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Anular
                                </DropdownMenuItem>
                              )}

                              {canDelete('facturas-compra') && (
                              <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleFacturaAction(factura._id, 'delete')}
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PAGINACION PROFESIONAL */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* SELECTOR DE REGISTROS POR PAGINA */}
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

              {/* INFORMACION DEL RANGO */}
              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                {' '}(Pagina <span className="font-medium">{pagination.page}</span> de{' '}
                <span className="font-medium">{pagination.pages}</span>)
              </div>

              {/* NAVEGACION DE PAGINAS */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: 1 }))}
                  disabled={pagination.page === 1}
                  className="h-9 w-9 p-0"
                  title="Primera pagina"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                  disabled={pagination.page === 1}
                  className="h-9 w-9 p-0"
                  title="Pagina anterior"
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
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="h-9 w-9 p-0"
                  title="Pagina siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: pagination.pages }))}
                  disabled={pagination.page === pagination.pages}
                  className="h-9 w-9 p-0"
                  title="Ultima pagina"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* DIALOG DE CONFIRMACION PARA ELIMINAR */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) =>
          setDeleteDialog({ ...deleteDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminacion</DialogTitle>
              <DialogDescription>
                Estas seguro de que deseas eliminar {deleteDialog.facturaIds.length === 1
                  ? 'la siguiente factura de compra'
                  : `las siguientes ${deleteDialog.facturaIds.length} facturas de compra`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.facturaCodigos.map((codigo, index) => (
                  <li key={index} className="text-sm font-medium">- {codigo}</li>
                ))}
              </ul>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, facturaIds: [], facturaCodigos: [] })}
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
