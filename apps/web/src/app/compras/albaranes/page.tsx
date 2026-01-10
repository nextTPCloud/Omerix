'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { albaranesCompraService } from '@/services/albaranes-compra.service'
import vistasService from '@/services/vistas-guardadas.service'
import {
  AlbaranCompra,
  AlbaranesCompraFilters,
  ESTADOS_ALBARAN_COMPRA,
  EstadoAlbaranCompra,
} from '@/types/albaran-compra.types'
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
  Truck,
  CheckCircle2,
  XCircle,
  FileText,
  Ban,
  Clock,
  Receipt,
  Package,
  ClipboardCheck,
  Bell,
  BellOff,
  Mail,
  MessageCircle,
  Loader2,
  Printer,
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
import { ALBARANES_COMPRA_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'
import { AlbaranesCompraAlertas } from '@/components/compras/AlbaranesCompraAlertas'
import { CrearFacturaDesdeAlbaranesDialog } from '@/components/compras/CrearFacturaDesdeAlbaranesDialog'

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
    { key: 'albaranProveedor', visible: true, orden: 1 },
    { key: 'proveedorNombre', visible: true, orden: 2 },
    { key: 'titulo', visible: false, orden: 3 },
    { key: 'estado', visible: true, orden: 4 },
    { key: 'fecha', visible: true, orden: 5 },
    { key: 'fechaRecepcion', visible: true, orden: 6 },
    { key: 'totalAlbaran', visible: true, orden: 7 },
    { key: 'facturado', visible: true, orden: 8 },
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

const getEstadoConfig = (estado: EstadoAlbaranCompra) => {
  return ESTADOS_ALBARAN_COMPRA.find(e => e.value === estado) || ESTADOS_ALBARAN_COMPRA[0]
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AlbaranesCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  // Proveedor preseleccionado desde URL
  const proveedorIdFromUrl = searchParams.get('proveedorId')
  const pedidoCompraIdFromUrl = searchParams.get('pedidoCompraId')

  // Estados de datos
  const [albaranes, setAlbaranes] = useState<AlbaranCompra[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Seleccion multiple
  const [selectedAlbaranes, setSelectedAlbaranes] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna (legacy)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // FILTROS AVANZADOS
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([])
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 300)

  // Filtros generales
  const [filters, setFilters] = useState<AlbaranesCompraFilters>({
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
    albaranIds: string[]
    albaranCodigos: string[]
  }>({
    open: false,
    albaranIds: [],
    albaranCodigos: [],
  })

  // Estados para acciones masivas
  const [showBulkWhatsAppDialog, setShowBulkWhatsAppDialog] = useState(false)
  const [whatsAppUrls, setWhatsAppUrls] = useState<Array<{
    id: string
    codigo: string
    url?: string
    telefono?: string
    proveedorNombre?: string
    error?: string
  }>>([])
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false)
  const [isSendingBulkEmail, setIsSendingBulkEmail] = useState(false)
  const [showFacturarDialog, setShowFacturarDialog] = useState(false)

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Codigo', sortable: true },
    { key: 'albaranProveedor', label: 'Albaran Prov.', sortable: true },
    { key: 'proveedorNombre', label: 'Proveedor', sortable: true },
    { key: 'titulo', label: 'Titulo', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'fechaRecepcion', label: 'Recepcion', sortable: true },
    { key: 'totalAlbaran', label: 'Importe Total', sortable: true },
    { key: 'facturado', label: 'Facturado', sortable: true },
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
  } = useModuleConfig('albaranes-compra', DEFAULT_CONFIG, {
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
    if (!albaranes || !Array.isArray(albaranes)) {
      return {
        total: 0,
        borradores: 0,
        pendientes: 0,
        recibidosParcial: 0,
        recibidos: 0,
        facturados: 0,
        anulados: 0,
        totalImporte: 0,
        pendientesFacturar: 0,
      }
    }

    const total = pagination?.total || 0
    const borradores = albaranes.filter((a) => a?.estado === 'borrador').length
    const pendientes = albaranes.filter((a) => a?.estado === 'pendiente_recepcion').length
    const recibidosParcial = albaranes.filter((a) => a?.estado === 'recibido_parcial').length
    const recibidos = albaranes.filter((a) => a?.estado === 'recibido').length
    const facturados = albaranes.filter((a) => a?.estado === 'facturado').length
    const anulados = albaranes.filter((a) => a?.estado === 'anulado').length
    const totalImporte = albaranes.reduce((sum, a) => sum + (a?.totales?.totalAlbaran || 0), 0)
    const pendientesFacturar = albaranes.filter((a) => !a?.facturado && a?.estado === 'recibido').length

    return {
      total,
      borradores,
      pendientes,
      recibidosParcial,
      recibidos,
      facturados,
      anulados,
      totalImporte,
      pendientesFacturar,
    }
  }, [albaranes, pagination?.total])

  // ============================================
  // CARGAR ALBARANES
  // ============================================

  const cargarAlbaranes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await albaranesCompraService.getAll(filters)

      if (response.success) {
        setAlbaranes(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setAlbaranes([])
        toast.error('Error al cargar los albaranes de compra')
      }
    } catch (error) {
      console.error('Error al cargar albaranes de compra:', error)
      setAlbaranes([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los albaranes de compra')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarAlbaranes()
  }, [cargarAlbaranes])

  // Si viene pedidoCompraId en URL, redirigir a la pagina de recepcion
  useEffect(() => {
    if (pedidoCompraIdFromUrl) {
      router.replace(`/compras/pedidos/${pedidoCompraIdFromUrl}/recepcion`)
    }
  }, [pedidoCompraIdFromUrl, router])

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
    const searchableFields = ['codigo', 'albaranProveedor', 'proveedorNombre', 'titulo']
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
      } else if (key === 'facturado') {
        if (value !== 'all') {
          combinedFilters.facturado = value === 'true'
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
      const restored = savedToFilters(moduleConfig.advancedFilters as any, ALBARANES_COMPRA_FILTERABLE_FIELDS)
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
      const restored = savedToFilters(configuracion.advancedFilters, ALBARANES_COMPRA_FILTERABLE_FIELDS)
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
          modulo: 'albaranes-compra',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'albaranes-compra',
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
        const vistas = await vistasService.getAll('albaranes-compra', true)
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
      setSelectedAlbaranes([])
    } else {
      setSelectedAlbaranes(albaranes.map(a => a._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectAlbaran = (albaranId: string) => {
    if (selectedAlbaranes.includes(albaranId)) {
      setSelectedAlbaranes(selectedAlbaranes.filter(id => id !== albaranId))
    } else {
      setSelectedAlbaranes([...selectedAlbaranes, albaranId])
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
        if (selectedAlbaranes.length > 0) {
          const codigosSeleccionados = albaranes
            .filter(a => selectedAlbaranes.includes(a._id))
            .map(a => a.codigo)

          setDeleteDialog({
            open: true,
            albaranIds: selectedAlbaranes,
            albaranCodigos: codigosSeleccionados,
          })
        }
        break
    }
  }

  const handleExportSelected = () => {
    const selectedData = albaranes.filter(a => selectedAlbaranes.includes(a._id))
    toast.success(`${selectedData.length} albaranes seleccionados para exportar`)
  }

  // ============================================
  // ENVÍO MASIVO POR EMAIL
  // ============================================

  const handleBulkEmail = async () => {
    if (selectedAlbaranes.length === 0) {
      toast.error('Selecciona al menos un albaran para enviar por email')
      return
    }

    setIsSendingBulkEmail(true)
    try {
      toast.loading('Enviando emails a proveedores...', { id: 'bulk-email' })
      const response = await albaranesCompraService.enviarMasivoPorEmail(selectedAlbaranes)
      toast.dismiss('bulk-email')

      if (response.success && response.data) {
        const { enviados, fallidos, total } = response.data
        if (enviados === total) {
          toast.success(`${enviados} emails enviados correctamente`)
        } else if (enviados > 0) {
          toast.warning(`${enviados} de ${total} emails enviados (${fallidos} fallidos)`)
        } else {
          toast.error('No se pudo enviar ningun email')
        }
        cargarAlbaranes()
        setSelectedAlbaranes([])
        setSelectAll(false)
      } else {
        toast.error(response.message || 'Error al enviar emails')
      }
    } catch (error: any) {
      toast.dismiss('bulk-email')
      toast.error(error.response?.data?.message || 'Error al enviar emails')
    } finally {
      setIsSendingBulkEmail(false)
    }
  }

  // ============================================
  // ENVÍO MASIVO POR WHATSAPP
  // ============================================

  const handleBulkWhatsApp = async () => {
    if (selectedAlbaranes.length === 0) {
      toast.error('Selecciona al menos un albaran para enviar por WhatsApp')
      return
    }

    setIsLoadingWhatsApp(true)
    setWhatsAppUrls([])
    setShowBulkWhatsAppDialog(true)

    try {
      const result = await albaranesCompraService.getWhatsAppURLsMasivo(selectedAlbaranes)
      if (result.success && result.data) {
        setWhatsAppUrls(result.data)
      } else {
        toast.error('Error al generar URLs de WhatsApp')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al generar URLs de WhatsApp')
    } finally {
      setIsLoadingWhatsApp(false)
    }
  }

  const handleOpenWhatsApp = (url: string) => {
    window.open(url, '_blank')
  }

  // ============================================
  // IMPRIMIR MASIVO
  // ============================================

  const handleBulkPrint = () => {
    if (selectedAlbaranes.length === 0) {
      toast.error('Selecciona al menos un albaran para imprimir')
      return
    }
    // Abrir ventana de impresion para cada albaran seleccionado
    selectedAlbaranes.forEach((id, index) => {
      setTimeout(() => {
        window.open(`/compras/albaranes/${id}/imprimir`, '_blank', 'width=900,height=700')
      }, index * 500)
    })
  }

  // ============================================
  // ELIMINAR ALBARANES
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.albaranIds.length === 1) {
        await albaranesCompraService.delete(deleteDialog.albaranIds[0])
      } else {
        await albaranesCompraService.deleteMany(deleteDialog.albaranIds)
      }

      toast.success('Albaran(es) de compra eliminado(s) correctamente')
      cargarAlbaranes()
      setSelectedAlbaranes([])
      setSelectAll(false)
      setDeleteDialog({ open: false, albaranIds: [], albaranCodigos: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // ACCIONES POR ALBARAN
  // ============================================

  const handleAlbaranAction = async (albaranId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/compras/albaranes/${albaranId}`)
        break
      case 'edit':
        router.push(`/compras/albaranes/${albaranId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando albaran...')
          const response = await albaranesCompraService.duplicar(albaranId)
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Albaran duplicado correctamente')
            router.push(`/compras/albaranes/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar el albaran')
        }
        break
      case 'delete':
        const albaran = albaranes.find(a => a._id === albaranId)
        if (albaran) {
          setDeleteDialog({
            open: true,
            albaranIds: [albaranId],
            albaranCodigos: [albaran.codigo],
          })
        }
        break
      case 'recibir':
        try {
          await albaranesCompraService.cambiarEstado(albaranId, 'recibido')
          toast.success('Albaran marcado como recibido')
          cargarAlbaranes()
        } catch (error) {
          toast.error('Error al cambiar estado')
        }
        break
      case 'anular':
        try {
          await albaranesCompraService.cambiarEstado(albaranId, 'anulado')
          toast.success('Albaran anulado')
          cargarAlbaranes()
        } catch (error) {
          toast.error('Error al anular albaran')
        }
        break
      case 'crear-factura':
        router.push(`/compras/facturas/nuevo?albaranCompraIds=${albaranId}`)
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
              <Truck className="h-7 w-7 text-primary" />
              Albaranes de Compra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona las recepciones de mercancia
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
              {showStats ? <Eye className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadisticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarAlbaranes}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
{canCreate('albaranes-compra') && (
              <Button asChild variant="outline" size="sm">
                <Link href="/compras/albaranes/importar">
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Importar con IA</span>
                </Link>
              </Button>
            )}
            {canCreate('albaranes-compra') && (
              <Button asChild size="sm">
                <Link href="/compras/albaranes/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo Albaran</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* ALERTAS DE ALBARANES DE COMPRA */}
        {showAlertas && (
          <AlbaranesCompraAlertas
            diasAlerta={30}
            onRefresh={cargarAlbaranes}
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
                  <Package className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parc. Recibidos</p>
                  <p className="text-xl font-bold">{stats.recibidosParcial}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recibidos</p>
                  <p className="text-xl font-bold">{stats.recibidos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Receipt className="h-4 w-4 text-purple-600" />
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
                  <p className="text-xs text-muted-foreground">Anulados</p>
                  <p className="text-xl font-bold">{stats.anulados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <ClipboardCheck className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pend. Facturar</p>
                  <p className="text-xl font-bold">{stats.pendientesFacturar}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                  <Truck className="h-4 w-4 text-cyan-600" />
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
          fields={ALBARANES_COMPRA_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por codigo, proveedor..."
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
              modulo="albaranes-compra"
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
              data={albaranes}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="albaranes-compra"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Recibidos', value: stats.recibidos },
                { label: 'Pend. Facturar', value: stats.pendientesFacturar },
                { label: 'Importe Total', value: formatCurrency(stats.totalImporte) },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={albaranes}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Albaranes de Compra"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Recibidos', value: stats.recibidos },
                { label: 'Pend. Facturar', value: stats.pendientesFacturar },
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
        {selectedAlbaranes.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedAlbaranes.length} {selectedAlbaranes.length === 1 ? 'albaran seleccionado' : 'albaranes seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleBulkEmail} disabled={isSendingBulkEmail}>
                <Mail className="mr-2 h-4 w-4" />
                {isSendingBulkEmail ? 'Enviando...' : 'Email'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkWhatsApp} className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkPrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFacturarDialog(true)}
                className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Crear Factura
              </Button>
              {canDelete('albaranes-compra') && (
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

                  {columnasVisibles.includes('albaranProveedor') && (
                    <th className={`${densityClasses.header} text-left w-[120px]`}>
                      <button
                        onClick={() => handleSort('albaranProveedor')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Albaran Prov.
                        {getSortIcon('albaranProveedor')}
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
                    <th className={`${densityClasses.header} text-left w-[200px]`}>
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
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
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

                  {columnasVisibles.includes('fechaRecepcion') && (
                    <th className={`${densityClasses.header} text-left min-w-[110px]`}>
                      <button
                        onClick={() => handleSort('fechaRecepcion')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Recepcion
                        {getSortIcon('fechaRecepcion')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('totalAlbaran') && (
                    <th className={`${densityClasses.header} text-right min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('totales.totalAlbaran')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Importe
                        {getSortIcon('totales.totalAlbaran')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('facturado') && (
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('facturado')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Facturado
                        {getSortIcon('facturado')}
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

                  {columnasVisibles.includes('albaranProveedor') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.albaranProveedor || ''}
                        onChange={(e) => handleColumnFilterInput('albaranProveedor', e.target.value)}
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
                          ...ESTADOS_ALBARAN_COMPRA.map(e => ({ value: e.value, label: e.label }))
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

                  {columnasVisibles.includes('fechaRecepcion') && (
                    <th className="px-3 py-1.5">
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={columnFiltersInput.fechaHasta || ''}
                        onChange={(e) => handleColumnFilterInput('fechaHasta', e.target.value)}
                        title="Fecha hasta"
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('totalAlbaran') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('facturado') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.facturado || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('facturado', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Si' },
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
                      Cargando albaranes de compra...
                    </td>
                  </tr>
                ) : albaranes.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron albaranes de compra</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo albaran</p>
                    </td>
                  </tr>
                ) : (
                  albaranes.map((albaran) => {
                    const estadoConfig = getEstadoConfig(albaran.estado)

                    return (
                      <tr
                        key={albaran._id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedAlbaranes.includes(albaran._id)}
                              onCheckedChange={() => handleSelectAlbaran(albaran._id)}
                            />
                          </div>
                        </td>

                        {columnasVisibles.includes('codigo') && (
                          <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>
                            <Link href={`/compras/albaranes/${albaran._id}`} className="hover:underline hover:text-primary">
                              {albaran.codigo}
                            </Link>
                          </td>
                        )}

                        {columnasVisibles.includes('albaranProveedor') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-muted-foreground`}>
                            {albaran.albaranProveedor || '-'}
                          </td>
                        )}

                        {columnasVisibles.includes('proveedorNombre') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="max-w-[200px] truncate" title={getProveedorNombre(albaran.proveedorId, albaran.proveedorNombre)}>
                              {getProveedorNombre(albaran.proveedorId, albaran.proveedorNombre)}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('titulo') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="max-w-[200px] truncate" title={albaran.titulo || ''}>
                              {albaran.titulo || '-'}
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
                            {formatFecha(albaran.fecha)}
                          </td>
                        )}

                        {columnasVisibles.includes('fechaRecepcion') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {formatFecha(albaran.fechaRecepcion)}
                          </td>
                        )}

                        {columnasVisibles.includes('totalAlbaran') && (
                          <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold`}>
                            {formatCurrency(albaran.totales?.totalAlbaran || 0)}
                          </td>
                        )}

                        {columnasVisibles.includes('facturado') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <Badge variant={albaran.facturado ? 'default' : 'secondary'} className={`text-xs ${albaran.facturado ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}`}>
                              {albaran.facturado ? 'Si' : 'No'}
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
                              <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'view')}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'edit')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'duplicate')}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                              {(albaran.estado === 'borrador' || albaran.estado === 'pendiente_recepcion' || albaran.estado === 'recibido_parcial') && (
                                <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'recibir')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Marcar Recibido
                                </DropdownMenuItem>
                              )}

                              {albaran.estado === 'recibido' && !albaran.facturado && (
                                <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'crear-factura')}>
                                  <Receipt className="mr-2 h-4 w-4 text-purple-600" />
                                  Crear Factura
                                </DropdownMenuItem>
                              )}

                              {albaran.estado !== 'anulado' && albaran.estado !== 'facturado' && (
                                <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'anular')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Anular
                                </DropdownMenuItem>
                              )}

{canDelete('albaranes-compra') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleAlbaranAction(albaran._id, 'delete')}
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
                Estas seguro de que deseas eliminar {deleteDialog.albaranIds.length === 1
                  ? 'el siguiente albaran de compra'
                  : `los siguientes ${deleteDialog.albaranIds.length} albaranes de compra`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.albaranCodigos.map((codigo, index) => (
                  <li key={index} className="text-sm font-medium">- {codigo}</li>
                ))}
              </ul>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, albaranIds: [], albaranCodigos: [] })}
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

        {/* DIALOG DE ENVÍO MASIVO POR WHATSAPP */}
        <Dialog open={showBulkWhatsAppDialog} onOpenChange={setShowBulkWhatsAppDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                Enviar por WhatsApp
              </DialogTitle>
              <DialogDescription>
                Haz clic en cada boton para abrir WhatsApp con el mensaje predefinido
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {isLoadingWhatsApp ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-3" />
                  <p className="text-sm text-muted-foreground">Generando enlaces de WhatsApp...</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {whatsAppUrls.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${item.url ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-medium text-sm">{item.codigo}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.proveedorNombre || 'Proveedor'}
                          </p>
                          {item.telefono && (
                            <p className="text-xs text-muted-foreground">
                              Tel: {item.telefono}
                            </p>
                          )}
                          {item.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {item.error}
                            </p>
                          )}
                        </div>
                        {item.url ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenWhatsApp(item.url!)}
                            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Abrir
                          </Button>
                        ) : (
                          <Badge variant="destructive" className="shrink-0">
                            Sin telefono
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingWhatsApp && whatsAppUrls.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-green-600">{whatsAppUrls.filter(u => u.url).length}</span> de {whatsAppUrls.length} albaranes tienen telefono valido para WhatsApp
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkWhatsAppDialog(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG PARA CREAR FACTURA DESDE ALBARANES */}
        <CrearFacturaDesdeAlbaranesDialog
          open={showFacturarDialog}
          onOpenChange={setShowFacturarDialog}
          albaranesIds={selectedAlbaranes}
          onSuccess={() => {
            setSelectedAlbaranes([])
            loadAlbaranes()
          }}
        />
      </div>
    </DashboardLayout>
  )
}
