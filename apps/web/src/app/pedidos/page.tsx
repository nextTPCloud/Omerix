'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { pedidosService } from '@/services/pedidos.service'
import { albaranesService } from '@/services/albaranes.service'
import { api } from '@/services/api'
import vistasService from '@/services/vistas-guardadas.service'
import {
  IPedido,
  ESTADOS_PEDIDO,
  EstadoPedido,
  getEstadoConfig,
  PRIORIDADES,
  Prioridad,
  getPrioridadConfig,
} from '@/types/pedido.types'
import { empresaService, EmpresaInfo } from '@/services/empresa.service'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Printer,
  Loader2,
  Mail,
  MessageCircle,
  Play,
  Truck,
  FileText,
  Ban,
  Package,
  AlertTriangle,
  Clock,
  Bell,
  BellOff,
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

// FILTROS AVANZADOS
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { PEDIDOS_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'
import { PedidosAlertas } from '@/components/pedidos/PedidosAlertas'
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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO PEDIDOS
// ============================================

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'clienteNombre', visible: true, orden: 1 },
    { key: 'clienteNif', visible: false, orden: 2 },
    { key: 'clienteEmail', visible: false, orden: 3 },
    { key: 'clienteTelefono', visible: false, orden: 4 },
    { key: 'titulo', visible: true, orden: 5 },
    { key: 'estado', visible: true, orden: 6 },
    { key: 'prioridad', visible: true, orden: 7 },
    { key: 'fecha', visible: true, orden: 8 },
    { key: 'fechaEntregaComprometida', visible: true, orden: 9 },
    { key: 'totalPedido', visible: true, orden: 10 },
    { key: 'agenteComercial', visible: false, orden: 11 },
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

export default function PedidosPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  // Estados de datos
  const [pedidos, setPedidos] = useState<IPedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
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

  // Estados para impresión masiva
  const [empresa, setEmpresa] = useState<EmpresaInfo | undefined>(undefined)

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'clienteNombre', label: 'Cliente', sortable: true },
    { key: 'clienteNif', label: 'NIF/CIF', sortable: true },
    { key: 'clienteEmail', label: 'Email', sortable: true },
    { key: 'clienteTelefono', label: 'Teléfono', sortable: true },
    { key: 'titulo', label: 'Título', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'prioridad', label: 'Prioridad', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'fechaEntregaComprometida', label: 'Entrega Prev.', sortable: true },
    { key: 'totalPedido', label: 'Importe Total', sortable: true },
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
    updateAdvancedFilters,
    updateDensidad,
    resetConfig,
  } = useModuleConfig('pedidos', DEFAULT_CONFIG, {
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
    if (!pedidos || !Array.isArray(pedidos)) {
      return {
        total: 0,
        borradores: 0,
        confirmados: 0,
        enProceso: 0,
        servidos: 0,
        facturados: 0,
        cancelados: 0,
        totalImporte: 0,
      }
    }

    const total = pagination?.total || 0
    const borradores = pedidos.filter((p) => p?.estado === EstadoPedido.BORRADOR).length
    const confirmados = pedidos.filter((p) => p?.estado === EstadoPedido.CONFIRMADO).length
    const enProceso = pedidos.filter((p) => p?.estado === EstadoPedido.EN_PROCESO).length
    const servidos = pedidos.filter((p) => p?.estado === EstadoPedido.SERVIDO).length
    const facturados = pedidos.filter((p) => p?.estado === EstadoPedido.FACTURADO).length
    const cancelados = pedidos.filter((p) => p?.estado === EstadoPedido.CANCELADO).length
    const totalImporte = pedidos.reduce((sum, p) => sum + (p?.totales?.totalPedido || 0), 0)

    return {
      total,
      borradores,
      confirmados,
      enProceso,
      servidos,
      facturados,
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
      const response = await pedidosService.getAll(filters)

      if (response.success) {
        setPedidos(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setPedidos([])
        toast.error('Error al cargar los pedidos')
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error)
      setPedidos([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los pedidos')
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

    // Búsqueda global desde searchTerm
    if (searchTerm) {
      combinedFilters.search = searchTerm
    }

    // Campos de búsqueda por texto (legacy)
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

  }, [debouncedColumnFilters, debouncedAdvancedFilters, searchTerm, currentSortKey, currentSortDirection, currentLimit])

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

    // Restaurar filtros avanzados guardados
    if (moduleConfig?.advancedFilters && moduleConfig.advancedFilters.length > 0) {
      const restored = savedToFilters(moduleConfig.advancedFilters as any, PEDIDOS_FILTERABLE_FIELDS)
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

    // Restaurar filtros avanzados de la vista
    if (configuracion.advancedFilters && configuracion.advancedFilters.length > 0) {
      const restored = savedToFilters(configuracion.advancedFilters, PEDIDOS_FILTERABLE_FIELDS)
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
          modulo: 'pedidos',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'pedidos',
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
        const vistas = await vistasService.getAll('pedidos', true)
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
  // SELECCIÓN MÚLTIPLE
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

  const handleExportSelected = async () => {
    try {
      const selectedData = pedidos.filter(p => selectedPedidos.includes(p._id))

      if (selectedData.length === 0) {
        toast.error('No hay pedidos seleccionados')
        return
      }

      // Transformar datos para exportación (aplanar campos anidados)
      const exportData = selectedData.map(p => ({
        codigo: p.codigo,
        clienteNombre: p.clienteNombre || '-',
        titulo: p.titulo || '-',
        estado: getEstadoConfig(p.estado)?.label || p.estado,
        prioridad: getPrioridadConfig(p.prioridad)?.label || p.prioridad || '-',
        fecha: p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : '-',
        fechaEntregaComprometida: p.fechaEntregaComprometida
          ? new Date(p.fechaEntregaComprometida).toLocaleDateString('es-ES')
          : '-',
        totalPedido: (p.totales?.totalPedido || 0).toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }),
        agenteComercial: getAgenteNombre(p.agenteComercialId) || '-',
      }))

      // Columnas para exportación
      const columns = columnasDisponibles
        .filter((col) => columnasVisibles.includes(col.key))
        .map((col) => ({
          key: col.key,
          label: col.label,
          width: 20,
        }))

      // Llamar al endpoint de exportación
      const response = await api.post('/export/excel', {
        filename: `pedidos_seleccionados_${new Date().toISOString().split('T')[0]}`,
        title: 'Pedidos de Venta Seleccionados',
        subtitle: `Exportados el ${new Date().toLocaleDateString('es-ES')} - ${selectedData.length} registros`,
        columns,
        data: exportData,
        stats: [
          { label: 'Total Seleccionados', value: selectedData.length },
        ],
        includeStats: true,
      }, {
        responseType: 'blob',
      })

      // Descargar el archivo
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pedidos_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success(`${selectedData.length} pedido(s) exportado(s) correctamente`)
    } catch (error: any) {
      console.error('Error al exportar pedidos:', error)
      toast.error(error.response?.data?.message || 'Error al exportar pedidos')
    }
  }

  // ============================================
  // ACCIONES MASIVAS EMAIL/WHATSAPP
  // ============================================

  const handleBulkEmail = async () => {
    if (selectedPedidos.length === 0) return

    try {
      toast.loading('Enviando pedidos por email...')
      const response = await pedidosService.enviarVariosPorEmail(selectedPedidos)
      toast.dismiss()

      if (response.success && response.data) {
        const { enviados, resultados } = response.data
        const errores = resultados?.filter(r => !r.success) || []

        if (errores.length > 0) {
          toast.warning(`${enviados} enviado(s), ${errores.length} con errores`)
        } else {
          toast.success(`${enviados} pedido(s) enviado(s) por email`)
        }
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al enviar por email')
    }
  }

  const handleBulkWhatsApp = async () => {
    if (selectedPedidos.length === 0) return

    try {
      toast.loading('Generando enlaces de WhatsApp...')
      const response = await pedidosService.generarURLsWhatsApp(selectedPedidos)
      toast.dismiss()

      if (response.success && response.data) {
        const { resultados } = response.data
        const exitosos = resultados?.filter(r => r.success && r.url) || []

        if (exitosos.length === 0) {
          toast.error('No se pudieron generar enlaces de WhatsApp')
          return
        }

        // Abrir cada URL en una nueva pestaña
        exitosos.forEach((r, index) => {
          if (r.url) {
            setTimeout(() => window.open(r.url, '_blank'), index * 500)
          }
        })

        toast.success(`${exitosos.length} enlace(s) de WhatsApp abierto(s)`)
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al generar enlaces de WhatsApp')
    }
  }

  // ============================================
  // ELIMINAR PEDIDOS
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.pedidoIds.length === 1) {
        await pedidosService.delete(deleteDialog.pedidoIds[0])
      } else {
        await pedidosService.deleteMany(deleteDialog.pedidoIds)
      }

      toast.success('Pedido(s) eliminado(s) correctamente')
      cargarPedidos()
      setSelectedPedidos([])
      setSelectAll(false)
      setDeleteDialog({ open: false, pedidoIds: [], pedidoCodigos: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // CARGAR EMPRESA AL INICIO
  // ============================================
  useEffect(() => {
    const loadEmpresa = async () => {
      try {
        const empresaData = await empresaService.getInfo()
        setEmpresa(empresaData)
      } catch (error) {
        console.error('Error cargando empresa:', error)
      }
    }
    loadEmpresa()
  }, [])

  // ============================================
  // ACCIONES POR PEDIDO
  // ============================================

  const handlePedidoAction = async (pedidoId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/pedidos/${pedidoId}`)
        break
      case 'edit':
        router.push(`/pedidos/${pedidoId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando pedido...')
          const response = await pedidosService.duplicar(pedidoId)
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Pedido duplicado correctamente')
            router.push(`/pedidos/${response.data._id}/editar`)
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
      case 'confirmar':
        try {
          await pedidosService.confirmar(pedidoId)
          toast.success('Pedido confirmado')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al confirmar pedido')
        }
        break
      case 'enProceso':
        try {
          await pedidosService.ponerEnProceso(pedidoId)
          toast.success('Pedido en proceso')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al cambiar estado')
        }
        break
      case 'servido':
        try {
          await pedidosService.marcarServido(pedidoId)
          toast.success('Pedido marcado como servido')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al cambiar estado')
        }
        break
      case 'facturado':
        try {
          await pedidosService.facturar(pedidoId)
          toast.success('Pedido marcado como facturado')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al cambiar estado')
        }
        break
      case 'cancelar':
        try {
          await pedidosService.cancelar(pedidoId)
          toast.success('Pedido cancelado')
          cargarPedidos()
        } catch (error) {
          toast.error('Error al cancelar pedido')
        }
        break
      case 'crear_albaran':
        try {
          toast.loading('Creando albarán...')
          const responseAlbaran = await albaranesService.crearDesdePedido(pedidoId, {
            entregarTodo: true,
          })
          toast.dismiss()
          if (responseAlbaran.success && responseAlbaran.data) {
            toast.success('Albarán creado correctamente')
            router.push(`/albaranes/${responseAlbaran.data._id}`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al crear albarán')
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

  const getClienteNombre = (clienteId: any, clienteNombre: string) => {
    if (typeof clienteId === 'object' && clienteId !== null) {
      return clienteId.nombreComercial || clienteId.nombre
    }
    return clienteNombre || '-'
  }

  const getClienteNif = (clienteId: any) => {
    if (typeof clienteId === 'object' && clienteId !== null) {
      return clienteId.nif || clienteId.cif || '-'
    }
    return '-'
  }

  const getClienteEmail = (clienteId: any) => {
    if (typeof clienteId === 'object' && clienteId !== null) {
      return clienteId.email || '-'
    }
    return '-'
  }

  const getClienteTelefono = (clienteId: any) => {
    if (typeof clienteId === 'object' && clienteId !== null) {
      return clienteId.telefono || '-'
    }
    return '-'
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

  // Calcular días hasta entrega comprometida
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
              <ShoppingCart className="h-7 w-7 text-primary" />
              Pedidos de Venta
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tus pedidos de venta
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlertas(!showAlertas)}
            >
              {showAlertas ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Alertas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarPedidos}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
{canCreate('pedidos') && (
            <Button asChild size="sm">
              <Link href="/pedidos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Pedido</span>
              </Link>
            </Button>
            )}
          </div>
        </div>

        {/* ESTADÍSTICAS RÁPIDAS */}
        {showStats && (
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Package className="h-4 w-4 text-gray-600" />
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
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
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
                  <Play className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">En Proceso</p>
                  <p className="text-xl font-bold">{stats.enProceso}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                  <Truck className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Servidos</p>
                  <p className="text-xl font-bold">{stats.servidos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Facturados</p>
                  <p className="text-xl font-bold">{stats.facturados}</p>
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
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalImporte)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ALERTAS */}
        {showAlertas && (
          <PedidosAlertas
            diasAlerta={7}
            onRefresh={cargarPedidos}
            collapsible={true}
            defaultCollapsed={false}
          />
        )}

        {/* BARRA DE FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={PEDIDOS_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por código, cliente, título..."
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
              modulo="pedidos"
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
              data={pedidos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="pedidos"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Confirmados', value: stats.confirmados },
                { label: 'En Proceso', value: stats.enProceso },
                { label: 'Servidos', value: stats.servidos },
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
              title="Listado de Pedidos de Venta"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Confirmados', value: stats.confirmados },
                { label: 'En Proceso', value: stats.enProceso },
                { label: 'Servidos', value: stats.servidos },
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
        {selectedPedidos.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedPedidos.length} {selectedPedidos.length === 1 ? 'pedido seleccionado' : 'pedidos seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleBulkEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkWhatsApp}>
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>
{canDelete('pedidos') && (
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

                  {columnasVisibles.includes('clienteNif') && (
                    <th className={`${densityClasses.header} text-left min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('clienteNif')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        NIF/CIF
                        {getSortIcon('clienteNif')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('clienteEmail') && (
                    <th className={`${densityClasses.header} text-left min-w-[180px]`}>
                      <button
                        onClick={() => handleSort('clienteEmail')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Email
                        {getSortIcon('clienteEmail')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('clienteTelefono') && (
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('clienteTelefono')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Teléfono
                        {getSortIcon('clienteTelefono')}
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

                  {columnasVisibles.includes('fechaEntregaComprometida') && (
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('fechaEntregaComprometida')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Entrega Prev.
                        {getSortIcon('fechaEntregaComprometida')}
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

                  {columnasVisibles.includes('clienteNif') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.clienteNif || ''}
                        onChange={(e) => handleColumnFilterInput('clienteNif', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('clienteEmail') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.clienteEmail || ''}
                        onChange={(e) => handleColumnFilterInput('clienteEmail', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('clienteTelefono') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.clienteTelefono || ''}
                        onChange={(e) => handleColumnFilterInput('clienteTelefono', e.target.value)}
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
                          ...ESTADOS_PEDIDO.map(e => ({ value: e.value, label: e.label }))
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

                  {columnasVisibles.includes('fechaEntregaComprometida') && (
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
                      Cargando pedidos...
                    </td>
                  </tr>
                ) : pedidos.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron pedidos</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo pedido</p>
                    </td>
                  </tr>
                ) : (
                  pedidos.map((pedido) => {
                    const diasEntrega = getDiasEntrega(pedido.fechaEntregaComprometida)
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
                            <Link href={`/pedidos/${pedido._id}`} className="hover:underline hover:text-primary">
                              {pedido.codigo}
                            </Link>
                          </td>
                        )}

                        {columnasVisibles.includes('clienteNombre') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="max-w-[200px] truncate" title={getClienteNombre(pedido.clienteId, pedido.clienteNombre)}>
                              {getClienteNombre(pedido.clienteId, pedido.clienteNombre)}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('clienteNif') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {getClienteNif(pedido.clienteId)}
                          </td>
                        )}

                        {columnasVisibles.includes('clienteEmail') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            <div className="max-w-[180px] truncate" title={getClienteEmail(pedido.clienteId)}>
                              {getClienteEmail(pedido.clienteId)}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('clienteTelefono') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {getClienteTelefono(pedido.clienteId)}
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
                            <Badge className={`text-xs font-medium ${estadoConfig.color}`}>
                              {estadoConfig.label}
                            </Badge>
                          </td>
                        )}

                        {columnasVisibles.includes('prioridad') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <Badge variant="outline" className={`text-xs font-medium ${prioridadConfig.color}`}>
                              {prioridadConfig.label}
                            </Badge>
                          </td>
                        )}

                        {columnasVisibles.includes('fecha') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {formatFecha(pedido.fecha)}
                          </td>
                        )}

                        {columnasVisibles.includes('fechaEntregaComprometida') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">
                                {formatFecha(pedido.fechaEntregaComprometida)}
                              </span>
                              {diasEntrega !== null && pedido.estado !== EstadoPedido.SERVIDO && pedido.estado !== EstadoPedido.FACTURADO && pedido.estado !== EstadoPedido.CANCELADO && (
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

                        {columnasVisibles.includes('agenteComercial') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {getAgenteNombre(pedido.agenteComercialId)}
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

                              {pedido.estado === EstadoPedido.BORRADOR && (
                                <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'confirmar')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" />
                                  Confirmar
                                </DropdownMenuItem>
                              )}

                              {pedido.estado === EstadoPedido.CONFIRMADO && (
                                <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'enProceso')}>
                                  <Play className="mr-2 h-4 w-4 text-yellow-600" />
                                  Poner en Proceso
                                </DropdownMenuItem>
                              )}

                              {(pedido.estado === EstadoPedido.CONFIRMADO || pedido.estado === EstadoPedido.EN_PROCESO || pedido.estado === EstadoPedido.PARCIALMENTE_SERVIDO) && (
                                <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'servido')}>
                                  <Truck className="mr-2 h-4 w-4 text-cyan-600" />
                                  Marcar Servido
                                </DropdownMenuItem>
                              )}

                              {pedido.estado === EstadoPedido.SERVIDO && (
                                <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'facturado')}>
                                  <FileText className="mr-2 h-4 w-4 text-green-600" />
                                  Marcar Facturado
                                </DropdownMenuItem>
                              )}

                              {pedido.estado !== EstadoPedido.CANCELADO && pedido.estado !== EstadoPedido.FACTURADO && (
                                <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'cancelar')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}

                              {/* Crear Albarán - solo si está confirmado, en proceso o parcialmente servido */}
                              {[EstadoPedido.CONFIRMADO, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIALMENTE_SERVIDO].includes(pedido.estado as EstadoPedido) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handlePedidoAction(pedido._id, 'crear_albaran')}>
                                    <Truck className="mr-2 h-4 w-4 text-cyan-600" />
                                    Crear Albarán
                                  </DropdownMenuItem>
                                </>
                              )}

{canDelete('pedidos') && (
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
                ¿Estás seguro de que deseas eliminar {deleteDialog.pedidoIds.length === 1
                  ? 'el siguiente pedido'
                  : `los siguientes ${deleteDialog.pedidoIds.length} pedidos`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.pedidoCodigos.map((codigo, index) => (
                  <li key={index} className="text-sm font-medium">• {codigo}</li>
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
