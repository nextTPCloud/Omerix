'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { pedidosCompraService } from '@/services/pedidos-compra.service'
import vistasService from '@/services/vistas-guardadas.service'
import {
  PedidoCompra,
  PedidosCompraFilters,
  ESTADOS_PEDIDO_COMPRA,
  PRIORIDADES,
  EstadoPedidoCompra,
} from '@/types/pedido-compra.types'
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
  Copy,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Send,
  Package,
  Truck,
  FileText,
  Ban,
  Clock,
  AlertTriangle,
  Bell,
  BellOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'

// Componentes UI reutilizables
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

// Filtros avanzados
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { PEDIDOS_COMPRA_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'
import { PedidosCompraAlertas } from '@/components/compras/PedidosCompraAlertas'
import { usePermissions } from '@/hooks/usePermissions'

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
    { key: 'proveedorNombre', visible: true, orden: 1 },
    { key: 'titulo', visible: true, orden: 2 },
    { key: 'estado', visible: true, orden: 3 },
    { key: 'prioridad', visible: true, orden: 4 },
    { key: 'fecha', visible: true, orden: 5 },
    { key: 'fechaEntregaPrevista', visible: true, orden: 6 },
    { key: 'totalPedido', visible: true, orden: 7 },
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

const getEstadoConfig = (estado: EstadoPedidoCompra) => {
  return ESTADOS_PEDIDO_COMPRA.find(e => e.value === estado) || ESTADOS_PEDIDO_COMPRA[0]
}

const getPrioridadConfig = (prioridad: string) => {
  return PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[1]
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PedidosCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  // Proveedor preseleccionado desde URL
  const proveedorIdFromUrl = searchParams.get('proveedorId')

  // Estados de datos
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Seleccion multiple
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna (legacy)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // FILTROS AVANZADOS (nuevo sistema)
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([])
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 300)

  // Filtros generales
  const [filters, setFilters] = useState<PedidosCompraFilters>({
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
    pedidoIds: string[]
    pedidoCodigos: string[]
  }>({
    open: false,
    pedidoIds: [],
    pedidoCodigos: [],
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Codigo', sortable: true },
    { key: 'proveedorNombre', label: 'Proveedor', sortable: true },
    { key: 'titulo', label: 'Titulo', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'prioridad', label: 'Prioridad', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'fechaEntregaPrevista', label: 'Entrega Prev.', sortable: true },
    { key: 'totalPedido', label: 'Importe Total', sortable: true },
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
  } = useModuleConfig('pedidos-compra', DEFAULT_CONFIG, {
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
    if (!pedidos || !Array.isArray(pedidos)) {
      return {
        total: 0,
        borradores: 0,
        enviados: 0,
        confirmados: 0,
        parcialmenteRecibidos: 0,
        recibidos: 0,
        cancelados: 0,
        totalImporte: 0,
      }
    }

    const total = pagination?.total || 0
    const borradores = pedidos.filter((p) => p?.estado === 'borrador').length
    const enviados = pedidos.filter((p) => p?.estado === 'enviado').length
    const confirmados = pedidos.filter((p) => p?.estado === 'confirmado').length
    const parcialmenteRecibidos = pedidos.filter((p) => p?.estado === 'parcialmente_recibido').length
    const recibidos = pedidos.filter((p) => p?.estado === 'recibido').length
    const cancelados = pedidos.filter((p) => p?.estado === 'cancelado').length
    const totalImporte = pedidos.reduce((sum, p) => sum + (p?.totales?.totalPedido || 0), 0)

    return {
      total,
      borradores,
      enviados,
      confirmados,
      parcialmenteRecibidos,
      recibidos,
      cancelados,
      totalImporte,
    }
  }, [pedidos, pagination?.total])

  // ============================================
  // CARGAR PEDIDOS
  // ============================================

  const cargarPedidos = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await pedidosCompraService.getAll(filters)

      if (response.success) {
        setPedidos(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setPedidos([])
        toast.error('Error al cargar los pedidos de compra')
      }
    } catch (error) {
      console.error('Error al cargar pedidos de compra:', error)
      setPedidos([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los pedidos de compra')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarPedidos()
  }, [cargarPedidos])

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

    // Mantener filtro de proveedor si viene de URL
    if (proveedorIdFromUrl) {
      combinedFilters.proveedorId = proveedorIdFromUrl
    }

    // Busqueda global desde searchTerm
    if (searchTerm) {
      combinedFilters.search = searchTerm
    }

    // Campos de busqueda por texto (legacy)
    const searchableFields = ['codigo', 'proveedorNombre', 'titulo']
    const searchTerms: string[] = []

    searchableFields.forEach(field => {
      if (debouncedColumnFilters[field]) {
        searchTerms.push(debouncedColumnFilters[field])
      }
    })

    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }

    // Filtros de select y fechas (legacy)
    Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
      if (key === 'estado') {
        if (value !== 'all') {
          combinedFilters.estado = value
        }
      } else if (key === 'prioridad') {
        if (value !== 'all') {
          combinedFilters.prioridad = value
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
      }
    })

    // FILTROS AVANZADOS - Convertir a query params
    if (debouncedAdvancedFilters.length > 0) {
      const advancedParams = filtersToQueryParams(debouncedAdvancedFilters)
      Object.assign(combinedFilters, advancedParams)
    }

    setFilters(combinedFilters)

  }, [debouncedColumnFilters, debouncedAdvancedFilters, searchTerm, currentSortKey, currentSortDirection, currentLimit, proveedorIdFromUrl])

  // ============================================
  // SINCRONIZAR CONFIGURACION GUARDADA CON FILTROS (SOLO CARGA INICIAL)
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
      const restored = savedToFilters(moduleConfig.advancedFilters as any, PEDIDOS_COMPRA_FILTERABLE_FIELDS)
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
      const restored = savedToFilters(configuracion.advancedFilters, PEDIDOS_COMPRA_FILTERABLE_FIELDS)
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
          modulo: 'pedidos-compra',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'pedidos-compra',
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
        const vistas = await vistasService.getAll('pedidos-compra', true)
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
      setSelectedPedidos([])
    } else {
      setSelectedPedidos(pedidos.map(p => p._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectPedido = (pedidoId: string) => {
    if (selectedPedidos.includes(pedidoId)) {
      setSelectedPedidos(selectedPedidos.filter(id => id !== pedidoId))
    } else {
      setSelectedPedidos([...selectedPedidos, pedidoId])
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
        if (selectedPedidos.length > 0) {
          const codigosSeleccionados = pedidos
            .filter(p => selectedPedidos.includes(p._id))
            .map(p => p.codigo)

          setDeleteDialog({
            open: true,
            pedidoIds: selectedPedidos,
            pedidoCodigos: codigosSeleccionados,
          })
        }
        break
    }
  }

  const handleExportSelected = () => {
    const selectedData = pedidos.filter(p => selectedPedidos.includes(p._id))
    toast.success(`${selectedData.length} pedidos seleccionados para exportar`)
  }

  // ============================================
  // ELIMINAR PEDIDOS
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.pedidoIds.length === 1) {
        await pedidosCompraService.delete(deleteDialog.pedidoIds[0])
      } else {
        await pedidosCompraService.deleteMany(deleteDialog.pedidoIds)
      }

      toast.success('Pedido(s) de compra eliminado(s) correctamente')
      cargarPedidos()
      setSelectedPedidos([])
      setSelectAll(false)
      setDeleteDialog({ open: false, pedidoIds: [], pedidoCodigos: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // ACCIONES POR PEDIDO
  // ============================================

  const handlePedidoAction = async (pedidoId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/compras/pedidos/${pedidoId}`)
        break
      case 'edit':
        router.push(`/compras/pedidos/${pedidoId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando pedido...')
          const response = await pedidosCompraService.duplicar(pedidoId)
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Pedido duplicado correctamente')
            router.push(`/compras/pedidos/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar el pedido')
        }
        break
      case 'delete':
        const pedido = pedidos.find(p => p._id === pedidoId)
        if (pedido) {
          setDeleteDialog({
            open: true,
            pedidoIds: [pedidoId],
            pedidoCodigos: [pedido.codigo],
          })
        }
        break
      case 'enviar':
        try {
          await pedidosCompraService.cambiarEstado(pedidoId, 'enviado')
          toast.success('Pedido enviado al proveedor')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al enviar pedido')
        }
        break
      case 'confirmar':
        try {
          await pedidosCompraService.cambiarEstado(pedidoId, 'confirmado')
          toast.success('Pedido confirmado')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al confirmar pedido')
        }
        break
      case 'recibido':
        try {
          await pedidosCompraService.cambiarEstado(pedidoId, 'recibido')
          toast.success('Pedido marcado como recibido')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al cambiar estado')
        }
        break
      case 'cancelar':
        try {
          await pedidosCompraService.cambiarEstado(pedidoId, 'cancelado')
          toast.success('Pedido cancelado')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al cancelar pedido')
        }
        break
      case 'crear-albaran':
        router.push(`/compras/albaranes/nuevo?pedidoCompraId=${pedidoId}`)
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

  // Calcular dias hasta entrega prevista
  const getDiasEntrega = (fecha: any) => {
    if (!fecha) return null
    try {
      const fechaEntrega = new Date(fecha)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      fechaEntrega.setHours(0, 0, 0, 0)
      const diff = Math.ceil((fechaEntrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      return diff
    } catch {
      return null
    }
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
              <Package className="h-7 w-7 text-primary" />
              Pedidos de Compra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tus pedidos a proveedores
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
              {showStats ? <Eye className="h-4 w-4" /> : <Package className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadisticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarPedidos}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
{canCreate('pedidos-compra') && (
            <Button asChild size="sm">
              <Link href="/compras/pedidos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Pedido</span>
              </Link>
            </Button>
)}
          </div>
        </div>

        {/* ALERTAS DE PEDIDOS DE COMPRA */}
        {showAlertas && (
          <PedidosCompraAlertas
            diasAlerta={7}
            onRefresh={cargarPedidos}
            collapsible={true}
            defaultCollapsed={false}
          />
        )}

        {/* ESTADISTICAS RAPIDAS */}
        {showStats && (
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
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
                  <Send className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enviados</p>
                  <p className="text-xl font-bold">{stats.enviados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confirmados</p>
                  <p className="text-xl font-bold">{stats.confirmados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parc. Recibidos</p>
                  <p className="text-xl font-bold">{stats.parcialmenteRecibidos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                  <Truck className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recibidos</p>
                  <p className="text-xl font-bold">{stats.recibidos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                  <Ban className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cancelados</p>
                  <p className="text-xl font-bold">{stats.cancelados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalImporte)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={PEDIDOS_COMPRA_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por codigo, proveedor, titulo..."
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
              modulo="pedidos-compra"
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
              data={pedidos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="pedidos-compra"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Confirmados', value: stats.confirmados },
                { label: 'Recibidos', value: stats.recibidos },
                { label: 'Importe Total', value: formatCurrency(stats.totalImporte) },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={pedidos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Pedidos de Compra"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Confirmados', value: stats.confirmados },
                { label: 'Recibidos', value: stats.recibidos },
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
        {selectedPedidos.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedPedidos.length} {selectedPedidos.length === 1 ? 'pedido seleccionado' : 'pedidos seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>
{canDelete('pedidos-compra') && (
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

                  {columnasVisibles.includes('titulo') && (
                    <th className={`${densityClasses.header} text-left w-[220px]`}>
                      <button
                        onClick={() => handleSort('titulo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Titulo
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

                  {columnasVisibles.includes('prioridad') && (
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('prioridad')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Prioridad
                        {getSortIcon('prioridad')}
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

                  {columnasVisibles.includes('fechaEntregaPrevista') && (
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('fechaEntregaPrevista')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Entrega Prev.
                        {getSortIcon('fechaEntregaPrevista')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('totalPedido') && (
                    <th className={`${densityClasses.header} text-right min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('totales.totalPedido')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Importe Total
                        {getSortIcon('totales.totalPedido')}
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
                          ...ESTADOS_PEDIDO_COMPRA.map(e => ({ value: e.value, label: e.label }))
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('prioridad') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.prioridad || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('prioridad', value)}
                        placeholder="Todas"
                        options={[
                          { value: 'all', label: 'Todas' },
                          ...PRIORIDADES.map(p => ({ value: p.value, label: p.label }))
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

                  {columnasVisibles.includes('fechaEntregaPrevista') && (
                    <th className="px-3 py-1.5">
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={columnFiltersInput.fechaHasta || ''}
                        onChange={(e) => handleColumnFilterInput('fechaHasta', e.target.value)}
                        title="Entrega hasta"
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('totalPedido') && (
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

                  <th className="sticky right-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando pedidos de compra...
                    </td>
                  </tr>
                ) : pedidos.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron pedidos de compra</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo pedido</p>
                    </td>
                  </tr>
                ) : (
                  pedidos.map((pedido) => {
                    const diasEntrega = getDiasEntrega(pedido.fechaEntregaPrevista)
                    const estadoConfig = getEstadoConfig(pedido.estado)
                    const prioridadConfig = getPrioridadConfig(pedido.prioridad)

                    return (
                      <tr
                        key={pedido._id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedPedidos.includes(pedido._id)}
                              onCheckedChange={() => handleSelectPedido(pedido._id)}
                            />
                          </div>
                        </td>

                        {columnasVisibles.includes('codigo') && (
                          <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>
                            <Link href={`/compras/pedidos/${pedido._id}`} className="hover:underline hover:text-primary">
                              {pedido.codigo}
                            </Link>
                          </td>
                        )}

                        {columnasVisibles.includes('proveedorNombre') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="max-w-[200px] truncate" title={getProveedorNombre(pedido.proveedorId, pedido.proveedorNombre)}>
                              {getProveedorNombre(pedido.proveedorId, pedido.proveedorNombre)}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('titulo') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                            <div className="max-w-[220px] truncate" title={pedido.titulo || ''}>
                              {pedido.titulo || '-'}
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

                        {columnasVisibles.includes('prioridad') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <Badge variant="outline" className={`text-xs font-medium text-white ${prioridadConfig.color}`}>
                              {prioridadConfig.label}
                            </Badge>
                          </td>
                        )}

                        {columnasVisibles.includes('fecha') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {formatFecha(pedido.fecha)}
                          </td>
                        )}

                        {columnasVisibles.includes('fechaEntregaPrevista') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">
                                {formatFecha(pedido.fechaEntregaPrevista)}
                              </span>
                              {diasEntrega !== null && pedido.estado !== 'recibido' && pedido.estado !== 'cancelado' && (
                                <span className={`text-xs font-medium ml-1 ${
                                  diasEntrega < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : diasEntrega <= 3
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-green-600 dark:text-green-400'
                                }`}>
                                  ({diasEntrega}d)
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('totalPedido') && (
                          <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold`}>
                            {formatCurrency(pedido.totales?.totalPedido || 0)}
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
                              <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'view')}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'edit')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'duplicate')}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>

                              {pedido.estado === 'borrador' && (
                                <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'enviar')}>
                                  <Send className="mr-2 h-4 w-4 text-blue-600" />
                                  Enviar a Proveedor
                                </DropdownMenuItem>
                              )}

                              {pedido.estado === 'enviado' && (
                                <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'confirmar')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Confirmar
                                </DropdownMenuItem>
                              )}

                              {(pedido.estado === 'confirmado' || pedido.estado === 'parcialmente_recibido') && (
                                <>
                                  <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'crear-albaran')}>
                                    <Truck className="mr-2 h-4 w-4 text-cyan-600" />
                                    Crear Albaran Recepcion
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'recibido')}>
                                    <Package className="mr-2 h-4 w-4 text-emerald-600" />
                                    Marcar Recibido
                                  </DropdownMenuItem>
                                </>
                              )}

                              {pedido.estado !== 'cancelado' && pedido.estado !== 'recibido' && pedido.estado !== 'facturado' && (
                                <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'cancelar')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}

                              {canDelete('pedidos-compra') && (
                              <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handlePedidoAction(pedido._id, 'delete')}
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
                {/* Primera pagina */}
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

                {/* Pagina anterior */}
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

                {/* Numeros de pagina con ellipsis */}
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

                {/* Pagina siguiente */}
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

                {/* Ultima pagina */}
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
                Estas seguro de que deseas eliminar {deleteDialog.pedidoIds.length === 1
                  ? 'el siguiente pedido de compra'
                  : `los siguientes ${deleteDialog.pedidoIds.length} pedidos de compra`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.pedidoCodigos.map((codigo, index) => (
                  <li key={index} className="text-sm font-medium">- {codigo}</li>
                ))}
              </ul>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, pedidoIds: [], pedidoCodigos: [] })}
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
