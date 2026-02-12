'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { albaranesService } from '@/services/albaranes.service'
import { facturasService } from '@/services/facturas.service'
import { api } from '@/services/api'
import vistasService from '@/services/vistas-guardadas.service'
import {
  IAlbaran,
  ESTADOS_ALBARAN,
  EstadoAlbaran,
  TIPOS_ALBARAN,
  TipoAlbaran,
  getEstadoConfig,
  getTipoAlbaranLabel,
} from '@/types/albaran.types'
import { empresaService, EmpresaInfo } from '@/services/empresa.service'
import { Card, CardContent } from '@/components/ui/card'
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
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Mail,
  MessageCircle,
  FileText,
  MapPin,
  Calendar,
  Building2,
  AlertTriangle,
  Ban,
  Receipt,
  Bell,
  BellOff,
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

// FILTROS AVANZADOS
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { ALBARANES_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'
import { AlbaranesAlertas } from '@/components/albaranes/AlbaranesAlertas'
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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO ALBARANES
// ============================================

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'clienteNombre', visible: true, orden: 1 },
    { key: 'clienteNif', visible: false, orden: 2 },
    { key: 'clienteEmail', visible: false, orden: 3 },
    { key: 'clienteTelefono', visible: false, orden: 4 },
    { key: 'pedidoOrigen', visible: true, orden: 5 },
    { key: 'tipo', visible: true, orden: 6 },
    { key: 'estado', visible: true, orden: 7 },
    { key: 'fecha', visible: true, orden: 8 },
    { key: 'fechaEntrega', visible: true, orden: 9 },
    { key: 'totalAlbaran', visible: true, orden: 10 },
    { key: 'porcentajeEntregado', visible: true, orden: 11 },
    { key: 'agenteComercial', visible: false, orden: 12 },
    { key: 'direccionEntrega', visible: false, orden: 13 },
  ] as ColumnaConfig[],
  sortConfig: {
    key: 'fecha',
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

export default function AlbaranesPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  // Estados de datos
  const [albaranes, setAlbaranes] = useState<IAlbaran[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedAlbaranes, setSelectedAlbaranes] = useState<string[]>([])
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
    sortBy: 'fecha',
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
    albaranIds: string[]
    albaranCodigos: string[]
  }>({
    open: false,
    albaranIds: [],
    albaranCodigos: [],
  })

  // Estados para empresa e impresión
  const [empresa, setEmpresa] = useState<EmpresaInfo | undefined>(undefined)

  // Estados para cambio de estado
  const [estadoDialog, setEstadoDialog] = useState<{
    open: boolean
    albaran: IAlbaran | null
    nuevoEstado: EstadoAlbaran | ''
  }>({
    open: false,
    albaran: null,
    nuevoEstado: '',
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'clienteNombre', label: 'Cliente', sortable: true },
    { key: 'clienteNif', label: 'NIF/CIF', sortable: true },
    { key: 'clienteEmail', label: 'Email', sortable: true },
    { key: 'clienteTelefono', label: 'Teléfono', sortable: true },
    { key: 'pedidoOrigen', label: 'Pedido Origen', sortable: false },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'fechaEntrega', label: 'Fecha Entrega', sortable: true },
    { key: 'totalAlbaran', label: 'Importe Total', sortable: true },
    { key: 'porcentajeEntregado', label: '% Entregado', sortable: false },
    { key: 'agenteComercial', label: 'Agente Comercial', sortable: true },
    { key: 'direccionEntrega', label: 'Dirección Entrega', sortable: false },
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
  } = useModuleConfig('albaranes', DEFAULT_CONFIG, {
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
    if (!albaranes || !Array.isArray(albaranes)) {
      return {
        total: 0,
        borradores: 0,
        pendientes: 0,
        enTransito: 0,
        entregados: 0,
        facturados: 0,
        anulados: 0,
        totalImporte: 0,
      }
    }

    const total = pagination?.total || 0
    const borradores = albaranes.filter((a) => a?.estado === EstadoAlbaran.BORRADOR).length
    const pendientes = albaranes.filter((a) => a?.estado === EstadoAlbaran.PENDIENTE_ENTREGA).length
    const enTransito = albaranes.filter((a) => a?.estado === EstadoAlbaran.EN_TRANSITO).length
    const entregados = albaranes.filter((a) => a?.estado === EstadoAlbaran.ENTREGADO).length
    const facturados = albaranes.filter((a) => a?.estado === EstadoAlbaran.FACTURADO).length
    const anulados = albaranes.filter((a) => a?.estado === EstadoAlbaran.ANULADO).length
    const totalImporte = albaranes.reduce((sum, a) => sum + (a?.totales?.totalAlbaran || 0), 0)

    return {
      total,
      borradores,
      pendientes,
      enTransito,
      entregados,
      facturados,
      anulados,
      totalImporte,
    }
  }, [albaranes, pagination?.total])

  // ============================================
  // CARGAR ALBARANES
  // ============================================

  const cargarAlbaranes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await albaranesService.getAll(filters)

      if (response.success !== false) {
        setAlbaranes(response.data || [])
        setPagination({
          page: response.page || 1,
          limit: response.limit || 25,
          total: response.total || 0,
          pages: response.totalPages || 0,
        })
      } else {
        setAlbaranes([])
        toast.error('Error al cargar los albaranes')
      }
    } catch (error) {
      console.error('Error al cargar albaranes:', error)
      setAlbaranes([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los albaranes')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarAlbaranes()
  }, [cargarAlbaranes])

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

    // Búsqueda global desde searchTerm
    if (searchTerm) {
      combinedFilters.search = searchTerm
    }

    // Campos de búsqueda por texto (legacy)
    const searchableFields = ['codigo', 'clienteNombre', 'agenteComercial']
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
      } else if (key === 'tipo') {
        if (value !== 'all') {
          combinedFilters.tipo = value
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
  // SINCRONIZAR CONFIGURACIÓN GUARDADA CON FILTROS
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
      const restored = savedToFilters(moduleConfig.advancedFilters as any, ALBARANES_FILTERABLE_FIELDS)
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

    // Restaurar filtros avanzados de la vista
    if (configuracion.advancedFilters && configuracion.advancedFilters.length > 0) {
      const restored = savedToFilters(configuracion.advancedFilters, ALBARANES_FILTERABLE_FIELDS)
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
          modulo: 'albaranes',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'albaranes',
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
        const vistas = await vistasService.getAll('albaranes', true)
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

  const handleExportSelected = async () => {
    try {
      const selectedData = albaranes.filter(a => selectedAlbaranes.includes(a._id))

      if (selectedData.length === 0) {
        toast.error('No hay albaranes seleccionados')
        return
      }

      const exportData = selectedData.map(a => ({
        codigo: a.codigo,
        clienteNombre: getClienteNombre(a.clienteId) || '-',
        tipo: getTipoAlbaranLabel(a.tipo) || '-',
        estado: getEstadoConfig(a.estado)?.label || a.estado,
        fecha: a.fecha ? new Date(a.fecha).toLocaleDateString('es-ES') : '-',
        fechaEntrega: a.datosEntrega?.fechaEntrega
          ? new Date(a.datosEntrega.fechaEntrega).toLocaleDateString('es-ES')
          : '-',
        totalAlbaran: (a.totales?.totalAlbaran || 0).toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }),
        porcentajeEntregado: `${a.porcentajeEntregado || 0}%`,
      }))

      const columns = columnasDisponibles
        .filter((col) => columnasVisibles.includes(col.key))
        .map((col) => ({
          key: col.key,
          label: col.label,
          width: 20,
        }))

      const response = await api.post('/export/excel', {
        filename: `albaranes_seleccionados_${new Date().toISOString().split('T')[0]}`,
        title: 'Albaranes Seleccionados',
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
      link.download = `albaranes_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success(`${selectedData.length} albarán(es) exportado(s) correctamente`)
    } catch (error: any) {
      console.error('Error al exportar albaranes:', error)
      toast.error(error.response?.data?.message || 'Error al exportar albaranes')
    }
  }

  // ============================================
  // ACCIONES MASIVAS EMAIL/WHATSAPP
  // ============================================

  const handleBulkEmail = async () => {
    if (selectedAlbaranes.length === 0) return

    try {
      toast.loading('Enviando albaranes por email...')
      const response = await albaranesService.enviarVariosPorEmail(selectedAlbaranes)
      toast.dismiss()

      if (response.success && response.data) {
        const { enviados, resultados } = response.data
        const errores = resultados?.filter(r => !r.success) || []

        if (errores.length > 0) {
          toast.warning(`${enviados} enviado(s), ${errores.length} con errores`)
        } else {
          toast.success(`${enviados} albarán(es) enviado(s) por email`)
        }
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al enviar por email')
    }
  }

  const handleBulkWhatsApp = async () => {
    if (selectedAlbaranes.length === 0) return

    try {
      toast.loading('Generando enlaces de WhatsApp...')
      const response = await albaranesService.generarURLsWhatsApp(selectedAlbaranes)
      toast.dismiss()

      if (response.success && response.data) {
        const { resultados } = response.data
        const exitosos = resultados?.filter(r => r.success && r.url) || []

        if (exitosos.length === 0) {
          toast.error('No se pudieron generar enlaces de WhatsApp')
          return
        }

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
  // ELIMINAR ALBARANES
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.albaranIds.length === 1) {
        await albaranesService.delete(deleteDialog.albaranIds[0])
      } else {
        await albaranesService.deleteMany(deleteDialog.albaranIds)
      }

      toast.success('Albarán(es) eliminado(s) correctamente')
      cargarAlbaranes()
      setSelectedAlbaranes([])
      setSelectAll(false)
      setDeleteDialog({ open: false, albaranIds: [], albaranCodigos: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // Eliminar múltiples albaranes seleccionados
  const handleDeleteMultiple = () => {
    if (selectedAlbaranes.length === 0) {
      toast.error('No hay albaranes seleccionados')
      return
    }

    const codigosSeleccionados = albaranes
      .filter(a => selectedAlbaranes.includes(a._id))
      .map(a => a.codigo)

    setDeleteDialog({
      open: true,
      albaranIds: selectedAlbaranes,
      albaranCodigos: codigosSeleccionados,
    })
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
  // FACTURAR ALBARANES SELECCIONADOS
  // ============================================
  const handleFacturarSeleccionados = async () => {
    if (selectedAlbaranes.length === 0) {
      toast.warning('Selecciona al menos un albarán')
      return
    }

    // Filtrar solo los albaranes que están entregados y sin facturar
    const albaranesFacturables = albaranes
      .filter(a => selectedAlbaranes.includes(a._id))
      .filter(a => a.estado === EstadoAlbaran.ENTREGADO && !a.facturaId)

    if (albaranesFacturables.length === 0) {
      toast.warning('Los albaranes seleccionados ya están facturados o no están entregados')
      return
    }

    if (albaranesFacturables.length !== selectedAlbaranes.length) {
      toast.info(`Solo ${albaranesFacturables.length} de ${selectedAlbaranes.length} albaranes pueden facturarse`)
    }

    try {
      toast.loading('Generando facturas...')
      const response = await facturasService.crearDesdeAlbaranes({
        albaranesIds: albaranesFacturables.map(a => a._id),
        agruparPorCliente: true,
      })
      toast.dismiss()

      if (response.success && response.data) {
        const numFacturas = response.data.length
        toast.success(`Se han creado ${numFacturas} factura${numFacturas !== 1 ? 's' : ''} correctamente`)

        // Recargar y limpiar selección
        await cargarAlbaranes()
        setSelectedAlbaranes([])
        setSelectAll(false)

        // Si solo se creó una factura, ir a ella
        if (numFacturas === 1) {
          router.push(`/facturas/${response.data[0]._id}`)
        }
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al generar facturas')
    }
  }

  // ============================================
  // ACCIONES POR ALBARÁN
  // ============================================

  const handleAlbaranAction = async (albaranId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/albaranes/${albaranId}`)
        break
      case 'edit':
        router.push(`/albaranes/${albaranId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando albarán...')
          const response = await albaranesService.duplicar(albaranId)
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Albarán duplicado correctamente')
            router.push(`/albaranes/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar el albarán')
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
      case 'pendiente':
        try {
          await albaranesService.marcarPendienteEntrega(albaranId)
          toast.success('Albarán marcado como pendiente de entrega')
          cargarAlbaranes()
        } catch (error) {
          toast.error('Error al cambiar estado')
        }
        break
      case 'enTransito':
        try {
          await albaranesService.marcarEnTransito(albaranId)
          toast.success('Albarán marcado como en tránsito')
          cargarAlbaranes()
        } catch (error) {
          toast.error('Error al cambiar estado')
        }
        break
      case 'entregado':
        try {
          await albaranesService.marcarEntregado(albaranId)
          toast.success('Albarán marcado como entregado')
          cargarAlbaranes()
        } catch (error) {
          toast.error('Error al cambiar estado')
        }
        break
      case 'anular':
        try {
          await albaranesService.anular(albaranId)
          toast.success('Albarán anulado')
          cargarAlbaranes()
        } catch (error) {
          toast.error('Error al anular albarán')
        }
        break
      case 'facturar':
        try {
          toast.loading('Creando factura...')
          const responseFactura = await facturasService.crearDesdeAlbaranes({
            albaranesIds: [albaranId],
            agruparPorCliente: false,
          })
          toast.dismiss()
          if (responseFactura.success && responseFactura.data && responseFactura.data.length > 0) {
            toast.success('Factura creada correctamente')
            router.push(`/facturas/${responseFactura.data[0]._id}`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al crear factura')
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

  const getClienteNombre = (clienteId: any): string => {
    if (typeof clienteId === 'object' && clienteId !== null) {
      return clienteId.nombreComercial || clienteId.nombre || '-'
    }
    return '-'
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

  const getPedidoOrigen = (pedidoId: any): string => {
    if (typeof pedidoId === 'object' && pedidoId !== null) {
      return pedidoId.codigo || '-'
    }
    return '-'
  }

  const formatDate = (fecha: any) => {
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
              Albaranes de Entrega
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tus albaranes de entrega y seguimiento
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
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarAlbaranes}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
              <Link href="/facturas/facturar-albaranes">
                <Receipt className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Facturar Albaranes</span>
              </Link>
            </Button>
{canCreate('albaranes') && (
              <Button asChild size="sm">
                <Link href="/albaranes/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo Albarán</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* ALERTAS DE ALBARANES */}
        {showAlertas && (
          <AlbaranesAlertas
            diasAlerta={30}
            onRefresh={cargarAlbaranes}
            collapsible={true}
            defaultCollapsed={false}
          />
        )}

        {/* Barra de acciones masivas - visible cuando hay selección */}
        {selectedAlbaranes.length > 0 && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedAlbaranes.length} albarán{selectedAlbaranes.length !== 1 ? 'es' : ''} seleccionado{selectedAlbaranes.length !== 1 ? 's' : ''}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAlbaranes([])}>
                    Deseleccionar todos
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    onClick={handleFacturarSeleccionados}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Facturar seleccionados
                  </Button>
{canDelete('albaranes') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={handleDeleteMultiple}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                  <p className="text-xl font-bold">{stats.pendientes}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">En Tránsito</p>
                  <p className="text-xl font-bold">{stats.enTransito}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entregados</p>
                  <p className="text-xl font-bold">{stats.entregados}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <FileText className="h-4 w-4 text-purple-600" />
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
          fields={ALBARANES_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por código, cliente..."
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
              modulo="albaranes"
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
              data={albaranes}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="albaranes"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Pendientes', value: stats.pendientes },
                { label: 'En Tránsito', value: stats.enTransito },
                { label: 'Entregados', value: stats.entregados },
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
              title="Listado de Albaranes"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Pendientes', value: stats.pendientes },
                { label: 'Entregados', value: stats.entregados },
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
        {selectedAlbaranes.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedAlbaranes.length} {selectedAlbaranes.length === 1 ? 'albarán seleccionado' : 'albaranes seleccionados'}
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
{canDelete('albaranes') && (
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

                  {columnasVisibles.includes('pedidoOrigen') && (
                    <th className={`${densityClasses.header} text-left w-[100px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Pedido
                      </span>
                    </th>
                  )}

                  {columnasVisibles.includes('tipo') && (
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('tipo')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Tipo
                        {getSortIcon('tipo')}
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
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('fecha')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Fecha
                        {getSortIcon('fecha')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('fechaEntrega') && (
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        F. Entrega
                      </span>
                    </th>
                  )}

                  {columnasVisibles.includes('totalAlbaran') && (
                    <th className={`${densityClasses.header} text-right min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('totales.totalAlbaran')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Importe
                        {getSortIcon('totales.totalAlbaran')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('porcentajeEntregado') && (
                    <th className={`${densityClasses.header} text-center min-w-[100px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        % Entreg.
                      </span>
                    </th>
                  )}

                  {columnasVisibles.includes('agenteComercial') && (
                    <th className={`${densityClasses.header} text-left min-w-[150px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Agente
                      </span>
                    </th>
                  )}

                  {columnasVisibles.includes('direccionEntrega') && (
                    <th className={`${densityClasses.header} text-left min-w-[150px]`}>
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Dirección
                      </span>
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

                  {columnasVisibles.includes('pedidoOrigen') && (
                    <th className="px-3 py-1.5"></th>
                  )}

                  {columnasVisibles.includes('tipo') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.tipo || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('tipo', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          ...TIPOS_ALBARAN.map(t => ({ value: t.value, label: t.label }))
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
                          ...ESTADOS_ALBARAN.map(e => ({ value: e.value, label: e.label }))
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

                  {columnasVisibles.includes('fechaEntrega') && (
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

                  {columnasVisibles.includes('porcentajeEntregado') && (
                    <th className="px-3 py-1.5"></th>
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

                  {columnasVisibles.includes('direccionEntrega') && (
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
                      Cargando albaranes...
                    </td>
                  </tr>
                ) : albaranes.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron albaranes</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo albarán</p>
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
                            <Link href={`/albaranes/${albaran._id}`} className="hover:underline hover:text-primary">
                              {albaran.codigo}
                            </Link>
                          </td>
                        )}

                        {columnasVisibles.includes('clienteNombre') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <div className="max-w-[200px] truncate" title={getClienteNombre(albaran.clienteId)}>
                              {getClienteNombre(albaran.clienteId)}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('clienteNif') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {getClienteNif(albaran.clienteId)}
                          </td>
                        )}

                        {columnasVisibles.includes('clienteEmail') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            <div className="max-w-[180px] truncate" title={getClienteEmail(albaran.clienteId)}>
                              {getClienteEmail(albaran.clienteId)}
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('clienteTelefono') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {getClienteTelefono(albaran.clienteId)}
                          </td>
                        )}

                        {columnasVisibles.includes('pedidoOrigen') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} font-mono text-muted-foreground`}>
                            {getPedidoOrigen(albaran.pedidoOrigenId)}
                          </td>
                        )}

                        {columnasVisibles.includes('tipo') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <Badge variant="outline" className="text-xs">
                              {getTipoAlbaranLabel(albaran.tipo)}
                            </Badge>
                          </td>
                        )}

                        {columnasVisibles.includes('estado') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                            <Badge className={`text-xs font-medium ${estadoConfig.color}`}>
                              {estadoConfig.label}
                            </Badge>
                          </td>
                        )}

                        {columnasVisibles.includes('fecha') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {formatDate(albaran.fecha)}
                          </td>
                        )}

                        {columnasVisibles.includes('fechaEntrega') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {formatDate(albaran.datosEntrega?.fechaEntrega)}
                          </td>
                        )}

                        {columnasVisibles.includes('totalAlbaran') && (
                          <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold`}>
                            {formatCurrency(albaran.totales?.totalAlbaran || 0)}
                          </td>
                        )}

                        {columnasVisibles.includes('porcentajeEntregado') && (
                          <td className={`${densityClasses.cell} text-center`}>
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary rounded-full h-2"
                                  style={{ width: `${albaran.porcentajeEntregado || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {albaran.porcentajeEntregado || 0}%
                              </span>
                            </div>
                          </td>
                        )}

                        {columnasVisibles.includes('agenteComercial') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            {getAgenteNombre(albaran.agenteComercialId)}
                          </td>
                        )}

                        {columnasVisibles.includes('direccionEntrega') && (
                          <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                            <div className="max-w-[150px] truncate" title={albaran.direccionEntrega?.ciudad || ''}>
                              {albaran.direccionEntrega?.ciudad || '-'}
                            </div>
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
                              <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>

                              {albaran.estado === EstadoAlbaran.BORRADOR && (
                                <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'pendiente')}>
                                  <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                                  Pendiente Entrega
                                </DropdownMenuItem>
                              )}

                              {(albaran.estado === EstadoAlbaran.BORRADOR || albaran.estado === EstadoAlbaran.PENDIENTE_ENTREGA) && (
                                <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'enTransito')}>
                                  <Truck className="mr-2 h-4 w-4 text-blue-600" />
                                  En Tránsito
                                </DropdownMenuItem>
                              )}

                              {(albaran.estado === EstadoAlbaran.PENDIENTE_ENTREGA || albaran.estado === EstadoAlbaran.EN_TRANSITO) && (
                                <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'entregado')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Marcar Entregado
                                </DropdownMenuItem>
                              )}

                              {albaran.estado !== EstadoAlbaran.ANULADO && albaran.estado !== EstadoAlbaran.FACTURADO && (
                                <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'anular')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Anular
                                </DropdownMenuItem>
                              )}

                              {/* Facturar - solo si está entregado y no facturado */}
                              {albaran.estado === EstadoAlbaran.ENTREGADO && !albaran.facturaId && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleAlbaranAction(albaran._id, 'facturar')}>
                                    <Receipt className="mr-2 h-4 w-4 text-purple-600" />
                                    Facturar
                                  </DropdownMenuItem>
                                </>
                              )}

{canDelete('albaranes') && (
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
                  onClick={() => setFilters((prev: any) => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))}
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
        <Dialog open={deleteDialog.open} onOpenChange={(open) =>
          setDeleteDialog({ ...deleteDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar {deleteDialog.albaranIds.length === 1
                  ? 'el siguiente albarán'
                  : `los siguientes ${deleteDialog.albaranIds.length} albaranes`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.albaranCodigos.map((codigo, index) => (
                  <li key={index} className="text-sm font-medium">• {codigo}</li>
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
      </div>
    
  )
}
