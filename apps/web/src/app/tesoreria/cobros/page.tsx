'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { vencimientosService } from '@/services/vencimientos.service'
import { api } from '@/services/api'
import vistasService from '@/services/vistas-guardadas.service'
import { Vencimiento, ESTADOS_VENCIMIENTO } from '@/types/vencimiento.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  Euro,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ArrowLeftRight,
} from 'lucide-react'
import { toast } from 'sonner'

// Componentes UI
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { PrintButton } from '@/components/ui/PrintButton'
import { TableSelect } from '@/components/ui/tableSelect'

// FILTROS AVANZADOS
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { COBROS_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'

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
// INTERFACES
// ============================================

interface ColumnFilters {
  [key: string]: string
}

// ============================================
// CONFIGURACION DE COLUMNAS
// ============================================

const COLUMNAS_DISPONIBLES = [
  { key: 'numero', label: 'Numero', sortable: true },
  { key: 'terceroNombre', label: 'Cliente', sortable: true },
  { key: 'terceroNif', label: 'NIF', sortable: true },
  { key: 'documentoNumero', label: 'Factura', sortable: true },
  { key: 'importe', label: 'Importe', sortable: true },
  { key: 'importePendiente', label: 'Pendiente', sortable: true },
  { key: 'fechaVencimiento', label: 'Vencimiento', sortable: true },
  { key: 'diasVencido', label: 'Dias', sortable: false },
  { key: 'estado', label: 'Estado', sortable: true },
]

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'numero', visible: true, orden: 0 },
    { key: 'terceroNombre', visible: true, orden: 1 },
    { key: 'terceroNif', visible: false, orden: 2 },
    { key: 'documentoNumero', visible: true, orden: 3 },
    { key: 'importe', visible: true, orden: 4 },
    { key: 'importePendiente', visible: true, orden: 5 },
    { key: 'fechaVencimiento', visible: true, orden: 6 },
    { key: 'diasVencido', visible: true, orden: 7 },
    { key: 'estado', visible: true, orden: 8 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'fechaVencimiento',
    direction: 'asc' as const,
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

export default function CobrosPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  // Estados de datos
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Seleccion multiple
  const [selectedItems, setSelectedItems] = useState<string[]>([])
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
    sortBy: 'fechaVencimiento',
    sortOrder: 'asc',
  })

  // Paginacion
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  })

  // Estadisticas
  const [stats, setStats] = useState({
    totalPendiente: 0,
    totalVencido: 0,
    countPendientes: 0,
    countVencidos: 0,
  })

  // UI States
  const [showStats, setShowStats] = useState(true)

  // Dialog de cobro
  const [cobroDialog, setCobroDialog] = useState<{
    open: boolean
    vencimiento: Vencimiento | null
    isMasivo: boolean
  }>({ open: false, vencimiento: null, isMasivo: false })
  const [importeCobro, setImporteCobro] = useState('')
  const [referenciaCobro, setReferenciaCobro] = useState('')

  // Dialog de eliminar
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    ids: string[]
    numeros: string[]
  }>({
    open: false,
    ids: [],
    numeros: [],
  })

  // Dialog de impagado
  const [impagadoDialog, setImpagadoDialog] = useState<{
    open: boolean
    ids: string[]
    numeros: string[]
    isMasivo: boolean
  }>({
    open: false,
    ids: [],
    numeros: [],
    isMasivo: false,
  })

  // ============================================
  // CONFIGURACION DEL MODULO
  // ============================================

  const {
    config: moduleConfig,
    isLoading: isLoadingConfig,
    densidad,
    updateDensidad,
    updateColumnas,
    toggleColumna,
    updateSortConfig,
    updateAdvancedFilters,
    resetConfig,
  } = useModuleConfig('tesoreria-cobros', DEFAULT_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  const densityClasses = useDensityClasses(densidad)

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

  // ============================================
  // CARGAR VENCIMIENTOS
  // ============================================

  const cargarVencimientos = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = {
        tipo: 'cobro',
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        sortBy: currentSortKey,
        sortOrder: currentSortDirection,
      }

      if (searchTerm) params.q = searchTerm

      // Filtros por columna
      Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          if (key === 'estado') {
            params.estado = value
          } else if (key === 'vencido') {
            params.vencido = value === 'true'
          } else if (key === 'numero' || key === 'terceroNombre' || key === 'terceroNif' || key === 'documentoNumero') {
            params.q = (params.q ? params.q + ' ' : '') + value
          }
        }
      })

      // Aplicar filtros avanzados
      if (debouncedAdvancedFilters.length > 0) {
        const advancedParams = filtersToQueryParams(debouncedAdvancedFilters)
        Object.assign(params, advancedParams)
      }

      const response = await vencimientosService.getCobros(params)
      setVencimientos(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.totalPages || 0,
        page: filters.page || 1,
        limit: filters.limit || 25,
      }))

      if (response.stats) {
        setStats({
          totalPendiente: response.stats.totalPendiente,
          totalVencido: response.stats.totalVencido,
          countPendientes: response.stats.countPendientes,
          countVencidos: response.stats.countVencidos,
        })
      }
    } catch (error) {
      console.error('Error al cargar cobros:', error)
      toast.error('Error al cargar los cobros')
    } finally {
      setIsLoading(false)
    }
  }, [filters, pagination.page, pagination.limit, searchTerm, debouncedColumnFilters, debouncedAdvancedFilters, currentSortKey, currentSortDirection])

  useEffect(() => {
    cargarVencimientos()
  }, [cargarVencimientos])

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

    if (searchTerm) {
      combinedFilters.search = searchTerm
    }

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, debouncedAdvancedFilters, searchTerm, currentSortKey, currentSortDirection, currentLimit])

  // ============================================
  // SINCRONIZAR CONFIGURACION GUARDADA
  // ============================================

  useEffect(() => {
    if (!moduleConfig || isLoadingConfig) return
    if (!isInitialLoad.current) return

    if (moduleConfig?.columnFilters) {
      setColumnFiltersInput(moduleConfig.columnFilters as any)
    }

    if (moduleConfig?.advancedFilters && moduleConfig.advancedFilters.length > 0) {
      const restored = savedToFilters(moduleConfig.advancedFilters as any, COBROS_FILTERABLE_FIELDS)
      setAdvancedFilters(restored)
    }

    isInitialLoad.current = false
  }, [moduleConfig, isLoadingConfig])

  // Guardar filtros avanzados cuando cambian
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
      const restored = savedToFilters(configuracion.advancedFilters, COBROS_FILTERABLE_FIELDS)
      setAdvancedFilters(restored)
    } else {
      setAdvancedFilters([])
    }

    if (configuracion.densidad) {
      updateDensidad(configuracion.densidad)
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
      const savedAdvancedFilters = filtersToSaved(advancedFilters)
      const configToSave = {
        ...moduleConfig,
        advancedFilters: savedAdvancedFilters,
        columnFilters: columnFiltersInput,
      }

      if (vistaIdActualizar) {
        await vistasService.update(vistaIdActualizar, {
          modulo: 'tesoreria-cobros',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'tesoreria-cobros',
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
      setSelectedItems([])
    } else {
      setSelectedItems(vencimientos.map(v => v._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectOne = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  // ============================================
  // ACCIONES EN LOTE
  // ============================================

  const handleBulkAction = async (action: string) => {
    const itemsSeleccionados = vencimientos.filter(v => selectedItems.includes(v._id))

    switch (action) {
      case 'cobrar':
        // Abrir dialog de cobro masivo
        setCobroDialog({ open: true, vencimiento: null, isMasivo: true })
        const totalPendiente = itemsSeleccionados.reduce((sum, v) => sum + v.importePendiente, 0)
        setImporteCobro(totalPendiente.toString())
        break

      case 'impagado':
        // Marcar como impagado masivo
        setImpagadoDialog({
          open: true,
          ids: selectedItems,
          numeros: itemsSeleccionados.map(v => v.numero),
          isMasivo: true,
        })
        break

      case 'export':
        await handleExportSelected()
        break

      case 'delete':
        if (selectedItems.length > 0) {
          setDeleteDialog({
            open: true,
            ids: selectedItems,
            numeros: itemsSeleccionados.map(v => v.numero),
          })
        }
        break

      default:
        toast.info(`Accion "${action}" en desarrollo`)
    }
  }

  const handleExportSelected = async () => {
    try {
      const selectedData = vencimientos.filter(v => selectedItems.includes(v._id))

      if (selectedData.length === 0) {
        toast.error('No hay cobros seleccionados')
        return
      }

      const exportData = selectedData.map(v => ({
        numero: v.numero,
        terceroNombre: v.terceroNombre || '-',
        terceroNif: v.terceroNif || '-',
        documentoNumero: v.documentoNumero || '-',
        importe: formatCurrency(v.importe),
        importePendiente: formatCurrency(v.importePendiente),
        fechaVencimiento: formatDate(v.fechaVencimiento),
        diasVencido: v.diasVencido?.toString() || '-',
        estado: ESTADOS_VENCIMIENTO.find(e => e.value === v.estado)?.label || v.estado,
      }))

      const columns = COLUMNAS_DISPONIBLES
        .filter((col) => columnasVisibles.includes(col.key))
        .map((col) => ({
          key: col.key,
          label: col.label,
          width: 20,
        }))

      const response = await api.post('/export/excel', {
        filename: `cobros_seleccionados_${new Date().toISOString().split('T')[0]}`,
        title: 'Cobros Seleccionados',
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

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cobros_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success(`${selectedData.length} cobro(s) exportado(s) correctamente`)
    } catch (error: any) {
      console.error('Error al exportar cobros:', error)
      toast.error(error.response?.data?.message || 'Error al exportar cobros')
    }
  }

  // ============================================
  // ACCIONES POR FILA
  // ============================================

  const handleRegistrarCobro = async () => {
    if (!importeCobro) return

    try {
      if (cobroDialog.isMasivo) {
        // Cobro masivo
        let cobrados = 0
        let errores = 0

        toast.loading(`Registrando cobros...`, { id: 'bulk-cobro' })

        for (const id of selectedItems) {
          try {
            const venc = vencimientos.find(v => v._id === id)
            if (venc && (venc.estado === 'pendiente' || venc.estado === 'parcial')) {
              await vencimientosService.registrarCobro(id, {
                importe: venc.importePendiente,
                referencia: referenciaCobro || undefined,
              })
              cobrados++
            }
          } catch (error) {
            errores++
          }
        }

        toast.dismiss('bulk-cobro')

        if (errores === 0) {
          toast.success(`${cobrados} cobro(s) registrado(s) correctamente`)
        } else {
          toast.warning(`${cobrados} registrado(s), ${errores} con error`)
        }

        setSelectedItems([])
        setSelectAll(false)
      } else if (cobroDialog.vencimiento) {
        // Cobro individual
        await vencimientosService.registrarCobro(cobroDialog.vencimiento._id, {
          importe: parseFloat(importeCobro),
          referencia: referenciaCobro || undefined,
        })
        toast.success('Cobro registrado correctamente')
      }

      setCobroDialog({ open: false, vencimiento: null, isMasivo: false })
      setImporteCobro('')
      setReferenciaCobro('')
      cargarVencimientos()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar el cobro')
    }
  }

  const handleMarcarImpagado = async () => {
    try {
      if (impagadoDialog.isMasivo) {
        let marcados = 0
        let errores = 0

        toast.loading(`Marcando como impagados...`, { id: 'bulk-impagado' })

        for (const id of impagadoDialog.ids) {
          try {
            await vencimientosService.marcarImpagado(id)
            marcados++
          } catch (error) {
            errores++
          }
        }

        toast.dismiss('bulk-impagado')

        if (errores === 0) {
          toast.success(`${marcados} cobro(s) marcado(s) como impagado(s)`)
        } else {
          toast.warning(`${marcados} marcado(s), ${errores} con error`)
        }

        setSelectedItems([])
        setSelectAll(false)
      } else {
        for (const id of impagadoDialog.ids) {
          await vencimientosService.marcarImpagado(id)
        }
        toast.success('Marcado como impagado')
      }

      setImpagadoDialog({ open: false, ids: [], numeros: [], isMasivo: false })
      cargarVencimientos()
    } catch (error) {
      toast.error('Error al marcar como impagado')
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      for (const id of deleteDialog.ids) {
        await vencimientosService.delete(id)
      }

      toast.success('Cobro(s) eliminado(s) correctamente')
      cargarVencimientos()
      setSelectedItems([])
      setSelectAll(false)
      setDeleteDialog({ open: false, ids: [], numeros: [] })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar')
    }
  }

  // ============================================
  // PAGINACION
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

  const getEstadoBadge = (estado: string, estaVencido?: boolean) => {
    const config: Record<string, { color: string; icon: any }> = {
      pendiente: { color: estaVencido ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800', icon: estaVencido ? AlertTriangle : Clock },
      parcial: { color: 'bg-blue-100 text-blue-800', icon: DollarSign },
      cobrado: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      impagado: { color: 'bg-red-100 text-red-800', icon: XCircle },
      anulado: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    }

    const { color, icon: Icon } = config[estado] || config.pendiente
    const label = ESTADOS_VENCIMIENTO.find(e => e.value === estado)?.label || estado

    return (
      <Badge className={`${color} text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES')
  }

  // Renderizar celda
  const renderCell = (venc: Vencimiento, key: string) => {
    switch (key) {
      case 'numero':
        return (
          <Link href={`/tesoreria/cobros/${venc._id}`} className="font-mono text-xs hover:text-primary hover:underline">
            {venc.numero}
          </Link>
        )
      case 'terceroNombre':
        return (
          <div className="max-w-[200px] truncate" title={venc.terceroNombre}>
            <span className="font-medium">{venc.terceroNombre}</span>
          </div>
        )
      case 'terceroNif':
        return <span className="text-muted-foreground">{venc.terceroNif || '-'}</span>
      case 'documentoNumero':
        return <span className="text-muted-foreground">{venc.documentoNumero || '-'}</span>
      case 'importe':
        return <span className="font-medium">{formatCurrency(venc.importe)}</span>
      case 'importePendiente':
        return <span className="font-bold text-orange-600">{formatCurrency(venc.importePendiente)}</span>
      case 'fechaVencimiento':
        return (
          <div className={venc.estaVencido ? 'text-red-600 font-medium' : ''}>
            {formatDate(venc.fechaVencimiento)}
          </div>
        )
      case 'diasVencido':
        return venc.diasVencido !== undefined && venc.diasVencido > 0 ? (
          <span className="text-xs text-red-500 font-medium">{venc.diasVencido}d</span>
        ) : '-'
      case 'estado':
        return getEstadoBadge(venc.estado, venc.estaVencido)
      default:
        return '-'
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
              <Euro className="h-7 w-7 text-green-600" />
              Cartera de Cobros
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion de vencimientos de clientes
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Euro className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadisticas</span>
            </Button>
            <Button variant="outline" size="sm" onClick={cargarVencimientos}>
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/tesoreria/cobros/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Cobro</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ESTADISTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Euro className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendiente Total</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalPendiente)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencido</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalVencido)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-yellow-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Efectos Pendientes</p>
                  <p className="text-lg font-bold">{stats.countPendientes}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Efectos Vencidos</p>
                  <p className="text-lg font-bold">{stats.countVencidos}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={COBROS_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por cliente, numero, factura..."
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
              modulo="tesoreria-cobros"
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
                {COLUMNAS_DISPONIBLES.map((columna) => (
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
              data={vencimientos}
              columns={COLUMNAS_DISPONIBLES
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="cartera-cobros"
              stats={[
                { label: 'Total Pendiente', value: formatCurrency(stats.totalPendiente) },
                { label: 'Total Vencido', value: formatCurrency(stats.totalVencido) },
                { label: 'Efectos', value: stats.countPendientes },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={vencimientos}
              columns={COLUMNAS_DISPONIBLES
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Cartera de Cobros"
              stats={[
                { label: 'Total Pendiente', value: formatCurrency(stats.totalPendiente) },
                { label: 'Total Vencido', value: formatCurrency(stats.totalVencido) },
              ]}
            />
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedItems.length > 0 && (
          <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                {selectedItems.length} {selectedItems.length === 1 ? 'cobro seleccionado' : 'cobros seleccionados'}
              </span>
              <div className="flex-1" />

              {/* Registrar cobro masivo */}
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('cobrar')}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                Registrar Cobro
              </Button>

              {/* Marcar impagado masivo */}
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('impagado')}>
                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                Marcar Impagado
              </Button>

              {/* Exportar */}
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>

              {/* Eliminar */}
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
                {/* HEADERS - TITULOS Y SORT */}
                <tr className="border-b bg-muted/50">
                  <th className={`${densityClasses.header} sticky left-0 z-30 bg-muted/50 backdrop-blur-sm text-left w-10`}>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </div>
                  </th>

                  {columnasVisibles.map((key) => {
                    const col = COLUMNAS_DISPONIBLES.find(c => c.key === key)
                    if (!col) return null
                    const isNumeric = ['importe', 'importePendiente'].includes(key)
                    return (
                      <th key={key} className={`${densityClasses.header} ${isNumeric ? 'text-right' : 'text-left'} min-w-[100px]`}>
                        {col.sortable ? (
                          <button
                            onClick={() => handleSort(key)}
                            className={`flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors ${isNumeric ? 'justify-end w-full' : ''}`}
                          >
                            {col.label}
                            {getSortIcon(key)}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-wider">{col.label}</span>
                        )}
                      </th>
                    )
                  })}

                  <th className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 backdrop-blur-sm text-right min-w-[70px] text-xs font-semibold uppercase tracking-wider`}>
                    Acciones
                  </th>
                </tr>

                {/* FILTROS POR COLUMNA */}
                <tr className="border-b bg-background">
                  <th className="sticky left-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>

                  {columnasVisibles.map((key) => {
                    const isNumeric = ['importe', 'importePendiente', 'diasVencido'].includes(key)

                    if (key === 'numero' || key === 'terceroNombre' || key === 'terceroNif' || key === 'documentoNumero') {
                      return (
                        <th key={key} className="px-3 py-1.5">
                          <Input
                            placeholder="Filtrar..."
                            className="h-7 text-xs placeholder:text-muted-foreground"
                            value={columnFiltersInput[key] || ''}
                            onChange={(e) => handleColumnFilterInput(key, e.target.value)}
                          />
                        </th>
                      )
                    }

                    if (key === 'estado') {
                      return (
                        <th key={key} className="px-3 py-1.5">
                          <TableSelect
                            value={columnFiltersInput.estado || 'all'}
                            onValueChange={(value) => handleColumnFilterInput('estado', value)}
                            placeholder="Todos"
                            options={[
                              { value: 'all', label: 'Todos' },
                              ...ESTADOS_VENCIMIENTO.map(e => ({ value: e.value, label: e.label }))
                            ]}
                          />
                        </th>
                      )
                    }

                    if (key === 'fechaVencimiento') {
                      return (
                        <th key={key} className="px-3 py-1.5">
                          <TableSelect
                            value={columnFiltersInput.vencido || 'all'}
                            onValueChange={(value) => handleColumnFilterInput('vencido', value)}
                            placeholder="Todos"
                            options={[
                              { value: 'all', label: 'Todos' },
                              { value: 'true', label: 'Vencidos' },
                              { value: 'false', label: 'No vencidos' },
                            ]}
                          />
                        </th>
                      )
                    }

                    // Columnas sin filtro
                    return <th key={key} className="px-3 py-1.5"></th>
                  })}

                  <th className="sticky right-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando cobros...
                    </td>
                  </tr>
                ) : vencimientos.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Euro className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron cobros</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros</p>
                    </td>
                  </tr>
                ) : (
                  vencimientos.map((venc) => (
                    <tr
                      key={venc._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedItems.includes(venc._id)}
                            onCheckedChange={() => handleSelectOne(venc._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.map((key) => {
                        const isNumeric = ['importe', 'importePendiente'].includes(key)
                        return (
                          <td key={key} className={`${densityClasses.cell} ${isNumeric ? 'text-right' : ''}`}>
                            {renderCell(venc, key)}
                          </td>
                        )
                      })}

                      <td className={`${densityClasses.cell} sticky right-0 z-20 bg-background group-hover:bg-muted/30 transition-colors text-right`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/tesoreria/cobros/${venc._id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/tesoreria/cobros/${venc._id}/editar`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            {(venc.estado === 'pendiente' || venc.estado === 'parcial') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setCobroDialog({ open: true, vencimiento: venc, isMasivo: false })
                                  setImporteCobro(venc.importePendiente.toString())
                                }}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Registrar cobro
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setImpagadoDialog({
                                    open: true,
                                    ids: [venc._id],
                                    numeros: [venc.numero],
                                    isMasivo: false,
                                  })
                                }}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Marcar impagado
                                </DropdownMenuItem>
                              </>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/tesoreria/cobros/${venc._id}/movimientos`)}>
                              <ArrowLeftRight className="mr-2 h-4 w-4" />
                              Ver movimientos
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDeleteDialog({
                                  open: true,
                                  ids: [venc._id],
                                  numeros: [venc.numero],
                                })
                              }}
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

        {/* PAGINACION */}
        {pagination.total > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
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

              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
                {' '}(Pagina <span className="font-medium">{pagination.page}</span> de{' '}
                <span className="font-medium">{pagination.pages}</span>)
              </div>

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

        {/* DIALOG REGISTRAR COBRO */}
        <Dialog open={cobroDialog.open} onOpenChange={(open) => setCobroDialog({ open, vencimiento: null, isMasivo: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {cobroDialog.isMasivo ? 'Registrar Cobro Masivo' : 'Registrar Cobro'}
              </DialogTitle>
              <DialogDescription>
                {cobroDialog.isMasivo ? (
                  <div className="mt-2 space-y-1">
                    <p><strong>Cobros seleccionados:</strong> {selectedItems.length}</p>
                    <p><strong>Total pendiente:</strong> {formatCurrency(vencimientos.filter(v => selectedItems.includes(v._id)).reduce((sum, v) => sum + v.importePendiente, 0))}</p>
                  </div>
                ) : cobroDialog.vencimiento && (
                  <div className="mt-2 space-y-1">
                    <p><strong>Cliente:</strong> {cobroDialog.vencimiento.terceroNombre}</p>
                    <p><strong>Pendiente:</strong> {formatCurrency(cobroDialog.vencimiento.importePendiente)}</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!cobroDialog.isMasivo && (
                <div className="space-y-2">
                  <Label>Importe a cobrar</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={importeCobro}
                    onChange={(e) => setImporteCobro(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Referencia (opcional)</Label>
                <Input
                  value={referenciaCobro}
                  onChange={(e) => setReferenciaCobro(e.target.value)}
                  placeholder="No transferencia, cheque..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCobroDialog({ open: false, vencimiento: null, isMasivo: false })}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarCobro}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registrar Cobro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG MARCAR IMPAGADO */}
        <Dialog open={impagadoDialog.open} onOpenChange={(open) => setImpagadoDialog({ open, ids: [], numeros: [], isMasivo: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Marcar como Impagado
              </DialogTitle>
              <DialogDescription>
                {impagadoDialog.isMasivo ? (
                  <p>Estas a punto de marcar {impagadoDialog.ids.length} cobro(s) como impagado(s). Esta accion no se puede deshacer facilmente.</p>
                ) : (
                  <p>Estas a punto de marcar el cobro <strong>{impagadoDialog.numeros[0]}</strong> como impagado.</p>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImpagadoDialog({ open: false, ids: [], numeros: [], isMasivo: false })}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleMarcarImpagado}>
                <XCircle className="mr-2 h-4 w-4" />
                Marcar Impagado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG DE CONFIRMACION PARA ELIMINAR */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminacion</DialogTitle>
              <DialogDescription>
                Estas seguro de que deseas eliminar {deleteDialog.ids.length === 1
                  ? 'el siguiente cobro'
                  : `los siguientes ${deleteDialog.ids.length} cobros`}?
              </DialogDescription>
            </DialogHeader>
            <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
              {deleteDialog.numeros.map((numero, index) => (
                <li key={index} className="text-sm font-medium">- {numero}</li>
              ))}
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, ids: [], numeros: [] })}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
