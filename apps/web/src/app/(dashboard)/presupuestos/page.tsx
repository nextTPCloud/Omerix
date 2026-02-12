'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { presupuestosService } from '@/services/presupuestos.service'
import { pedidosService } from '@/services/pedidos.service'
import { albaranesService } from '@/services/albaranes.service'
import { api } from '@/services/api'
import vistasService from '@/services/vistas-guardadas.service'
import {
  IPresupuesto,
  ESTADOS_PRESUPUESTO,
  EstadoPresupuesto,
  getEstadoConfig,
} from '@/types/presupuesto.types'
import { PresupuestoPrintView, PrintOptions, defaultPrintOptions } from '@/components/presupuestos/PresupuestoPrintView'
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
  AlertCircle,
  Columns,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Printer,
  Loader2,
  Mail,
  MessageCircle,
  ClipboardList,
  Truck,
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
import { PresupuestosAlertas, PresupuestosAlertasBadge } from '@/components/presupuestos/PresupuestosAlertas'
import PresupuestosDashboard from '@/components/presupuestos/PresupuestosDashboard'
import { RecordatoriosWidget } from '@/components/presupuestos/RecordatoriosPresupuestos'
import { usePermissions } from '@/hooks/usePermissions'

// FILTROS AVANZADOS
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { PRESUPUESTOS_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'

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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO PRESUPUESTOS
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
    { key: 'fecha', visible: true, orden: 7 },
    { key: 'fechaValidez', visible: true, orden: 8 },
    { key: 'totalPresupuesto', visible: true, orden: 9 },
    { key: 'diasParaCaducar', visible: true, orden: 10 },
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

export default function PresupuestosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canCreate, canDelete } = usePermissions()
  const isInitialLoad = useRef(true)
  const urlParamsApplied = useRef(false)

  // Estados de datos
  const [presupuestos, setPresupuestos] = useState<IPresupuesto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedPresupuestos, setSelectedPresupuestos] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna (legacy - mantener por compatibilidad)
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
    presupuestoIds: string[]
    presupuestoCodigos: string[]
  }>({
    open: false,
    presupuestoIds: [],
    presupuestoCodigos: [],
  })

  // Estados para impresión masiva
  const [empresa, setEmpresa] = useState<EmpresaInfo | undefined>(undefined)
  const [showBulkPrintDialog, setShowBulkPrintDialog] = useState(false)
  const [showBulkPrintView, setShowBulkPrintView] = useState(false)
  const [bulkPrintOptions, setBulkPrintOptions] = useState<PrintOptions>(defaultPrintOptions)
  const [presupuestosToImprimir, setPresupuestosToImprimir] = useState<IPresupuesto[]>([])
  const [isLoadingPresupuestosCompletos, setIsLoadingPresupuestosCompletos] = useState(false)
  const bulkPrintRef = useRef<HTMLDivElement>(null)

  // Estados para envío masivo de emails y WhatsApp
  const [showBulkEmailDialog, setShowBulkEmailDialog] = useState(false)
  const [showBulkWhatsAppDialog, setShowBulkWhatsAppDialog] = useState(false)
  const [bulkEmailOptions, setBulkEmailOptions] = useState({
    asunto: '',
    mensaje: '',
    pdfOptions: defaultPrintOptions,
  })
  const [isSendingBulkEmail, setIsSendingBulkEmail] = useState(false)
  const [bulkEmailResults, setBulkEmailResults] = useState<{
    total: number;
    enviados: number;
    fallidos: number;
    resultados: Array<{ id: string; codigo: string; success: boolean; message: string }>;
  } | null>(null)
  const [whatsAppUrls, setWhatsAppUrls] = useState<Array<{
    id: string;
    codigo: string;
    url?: string;
    telefono?: string;
    clienteNombre?: string;
    error?: string;
  }>>([])
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false)

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'clienteNombre', label: 'Cliente', sortable: true },
    { key: 'clienteNif', label: 'NIF/CIF', sortable: true },
    { key: 'clienteEmail', label: 'Email', sortable: true },
    { key: 'clienteTelefono', label: 'Teléfono', sortable: true },
    { key: 'titulo', label: 'Título', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'fechaValidez', label: 'Válido Hasta', sortable: true },
    { key: 'totalPresupuesto', label: 'Importe Total', sortable: true },
    { key: 'diasParaCaducar', label: 'Días Para Caducar', sortable: false },
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
} = useModuleConfig('presupuestos', DEFAULT_CONFIG, {
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
    if (!presupuestos || !Array.isArray(presupuestos)) {
      return {
        total: 0,
        borradores: 0,
        enviados: 0,
        aceptados: 0,
        rechazados: 0,
        totalImporte: 0,
        tasaConversion: 0,
      }
    }

    const total = pagination?.total || 0
    const borradores = presupuestos.filter((p) => p?.estado === EstadoPresupuesto.BORRADOR).length
    const enviados = presupuestos.filter((p) => p?.estado === EstadoPresupuesto.ENVIADO || p?.estado === EstadoPresupuesto.PENDIENTE).length
    const aceptados = presupuestos.filter((p) => p?.estado === EstadoPresupuesto.ACEPTADO).length
    const rechazados = presupuestos.filter((p) => p?.estado === EstadoPresupuesto.RECHAZADO).length
    const totalImporte = presupuestos.reduce((sum, p) => sum + (p?.totales?.totalPresupuesto || 0), 0)
    const tasaConversion = enviados > 0 ? (aceptados / enviados) * 100 : 0

    return {
      total,
      borradores,
      enviados,
      aceptados,
      rechazados,
      totalImporte,
      tasaConversion,
    }
  }, [presupuestos, pagination?.total])

  // ============================================
  // CARGAR PRESUPUESTOS
  // ============================================

  const cargarPresupuestos = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await presupuestosService.getAll(filters)

      if (response.success) {
        setPresupuestos(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setPresupuestos([])
        toast.error('Error al cargar los presupuestos')
      }
    } catch (error) {
      console.error('Error al cargar presupuestos:', error)
      setPresupuestos([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los presupuestos')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarPresupuestos()
  }, [cargarPresupuestos])

  // ============================================
  // APLICAR FILTROS DEBOUNCED (SIN GUARDAR)
  // ============================================

  useEffect(() => {
    console.log('📊 Filtros debounced cambiaron:', debouncedColumnFilters, debouncedAdvancedFilters)

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
      } else if (key === 'diasCaducidad') {
        if (value && value !== 'all') {
          combinedFilters.diasCaducidad = value
        }
      }
    })

    // FILTROS AVANZADOS - Convertir a query params
    if (debouncedAdvancedFilters.length > 0) {
      const advancedParams = filtersToQueryParams(debouncedAdvancedFilters)
      Object.assign(combinedFilters, advancedParams)
    }

    console.log('🔄 Aplicando filtros:', combinedFilters)
    setFilters(combinedFilters)

  }, [debouncedColumnFilters, debouncedAdvancedFilters, searchTerm, currentSortKey, currentSortDirection, currentLimit])

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

    // Restaurar filtros avanzados guardados
    if (moduleConfig?.advancedFilters && moduleConfig.advancedFilters.length > 0) {
      const restored = savedToFilters(moduleConfig.advancedFilters as any, PRESUPUESTOS_FILTERABLE_FIELDS)
      setAdvancedFilters(restored)
      console.log('✅ Filtros avanzados restaurados:', restored)
    }

    isInitialLoad.current = false

  }, [moduleConfig, isLoadingConfig])

  // ============================================
  // APLICAR FILTROS DESDE URL (caducado=si, caducado=pronto)
  // ============================================
  useEffect(() => {
    if (urlParamsApplied.current) return

    const caducadoParam = searchParams.get('caducado')
    if (caducadoParam) {
      urlParamsApplied.current = true

      if (caducadoParam === 'si') {
        // Presupuestos caducados
        setFilters((prev: any) => ({
          ...prev,
          caducados: 'true',
          activo: undefined,
        }))
        toast.info('Mostrando presupuestos caducados')
      } else if (caducadoParam === 'pronto') {
        // Presupuestos proximos a caducar
        setFilters((prev: any) => ({
          ...prev,
          porCaducar: 'true',
          activo: undefined,
        }))
        toast.info('Mostrando presupuestos proximos a caducar')
      }
    }
  }, [searchParams])

  // ============================================
  // GUARDAR FILTROS AVANZADOS CUANDO CAMBIAN
  // ============================================
  useEffect(() => {
    if (isInitialLoad.current || isLoadingConfig) return

    // Guardar filtros avanzados en la configuración
    const savedFilters = filtersToSaved(advancedFilters)
    updateAdvancedFilters(savedFilters)
  }, [advancedFilters, isLoadingConfig, updateAdvancedFilters])

  // ============================================
  // HANDLERS PARA VISTAS GUARDADAS
  // ============================================

  const handleAplicarVista = useCallback((configuracion: any) => {
    console.log('📄 Aplicando vista guardada:', configuracion)

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
      const restored = savedToFilters(configuracion.advancedFilters, PRESUPUESTOS_FILTERABLE_FIELDS)
      setAdvancedFilters(restored)
    } else {
      // Limpiar filtros avanzados si la vista no tiene
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

      console.log('💾 Guardando vista:', { nombre, descripcion, esDefault, vistaIdActualizar, config: configToSave })

      if (vistaIdActualizar) {
        // Actualizar vista existente
        await vistasService.update(vistaIdActualizar, {
          modulo: 'presupuestos',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        // Crear nueva vista
        await vistasService.create({
          modulo: 'presupuestos',
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
        const vistas = await vistasService.getAll('presupuestos', true)
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
      setSelectedPresupuestos([])
    } else {
      setSelectedPresupuestos(presupuestos.map(p => p._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectPresupuesto = (presupuestoId: string) => {
    if (selectedPresupuestos.includes(presupuestoId)) {
      setSelectedPresupuestos(selectedPresupuestos.filter(id => id !== presupuestoId))
    } else {
      setSelectedPresupuestos([...selectedPresupuestos, presupuestoId])
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
        if (selectedPresupuestos.length > 0) {
          const codigosSeleccionados = presupuestos
            .filter(p => selectedPresupuestos.includes(p._id))
            .map(p => p.codigo)

          setDeleteDialog({
            open: true,
            presupuestoIds: selectedPresupuestos,
            presupuestoCodigos: codigosSeleccionados,
          })
        }
        break
    }
  }

  const handleExportSelected = async () => {
    try {
      const selectedData = presupuestos.filter(p => selectedPresupuestos.includes(p._id))

      if (selectedData.length === 0) {
        toast.error('No hay presupuestos seleccionados')
        return
      }

      // Transformar datos para exportación (aplanar campos anidados)
      const exportData = selectedData.map(p => ({
        codigo: p.codigo,
        clienteNombre: p.clienteNombre || '-',
        titulo: p.titulo || '-',
        estado: getEstadoConfig(p.estado)?.label || p.estado,
        fecha: p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : '-',
        fechaValidez: p.fechaValidez ? new Date(p.fechaValidez).toLocaleDateString('es-ES') : '-',
        totalPresupuesto: (p.totales?.totalPresupuesto || 0).toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }),
        diasParaCaducar: p.diasParaCaducar?.toString() || '-',
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
        filename: `presupuestos_seleccionados_${new Date().toISOString().split('T')[0]}`,
        title: 'Presupuestos Seleccionados',
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
      link.download = `presupuestos_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success(`${selectedData.length} presupuesto(s) exportado(s) correctamente`)
    } catch (error: any) {
      console.error('Error al exportar presupuestos:', error)
      toast.error(error.response?.data?.message || 'Error al exportar presupuestos')
    }
  }

  // ============================================
  // ELIMINAR PRESUPUESTOS
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.presupuestoIds.length === 1) {
        await presupuestosService.delete(deleteDialog.presupuestoIds[0])
      } else {
        await presupuestosService.deleteMany(deleteDialog.presupuestoIds)
      }

      toast.success('Presupuesto(s) eliminado(s) correctamente')
      cargarPresupuestos()
      setSelectedPresupuestos([])
      setSelectAll(false)
      setDeleteDialog({ open: false, presupuestoIds: [], presupuestoCodigos: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // IMPRESIÓN MASIVA
  // ============================================

  // Cargar empresa al inicio
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

  // Hook para imprimir masivo
  const handleBulkPrintDocument = useReactToPrint({
    contentRef: bulkPrintRef,
    documentTitle: `Presupuestos-${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: () => {
      setShowBulkPrintView(false)
      setPresupuestosToImprimir([])
    },
  })

  // Iniciar impresión masiva
  const handleBulkPrint = () => {
    if (selectedPresupuestos.length === 0) {
      toast.error('Selecciona al menos un presupuesto para imprimir')
      return
    }
    setShowBulkPrintDialog(true)
  }

  // Confirmar impresión masiva - cargar presupuestos completos
  const handleConfirmBulkPrint = async () => {
    setShowBulkPrintDialog(false)
    setIsLoadingPresupuestosCompletos(true)

    try {
      // Cargar cada presupuesto completo (con líneas y totales)
      const presupuestosCompletos: IPresupuesto[] = []

      for (const id of selectedPresupuestos) {
        const response = await presupuestosService.getById(id)
        if (response.success && response.data) {
          presupuestosCompletos.push(response.data)
        }
      }

      if (presupuestosCompletos.length === 0) {
        toast.error('No se pudieron cargar los presupuestos')
        return
      }

      setPresupuestosToImprimir(presupuestosCompletos)
      setShowBulkPrintView(true)

      // Esperar a que se renderice y luego imprimir
      setTimeout(() => {
        handleBulkPrintDocument()
      }, 500)

    } catch (error) {
      console.error('Error cargando presupuestos:', error)
      toast.error('Error al cargar los presupuestos para imprimir')
    } finally {
      setIsLoadingPresupuestosCompletos(false)
    }
  }

  // ============================================
  // ENVÍO MASIVO POR EMAIL
  // ============================================

  const handleBulkEmail = () => {
    if (selectedPresupuestos.length === 0) {
      toast.error('Selecciona al menos un presupuesto para enviar por email')
      return
    }
    setBulkEmailOptions({
      asunto: '',
      mensaje: '',
      pdfOptions: defaultPrintOptions,
    })
    setBulkEmailResults(null)
    setShowBulkEmailDialog(true)
  }

  const handleConfirmBulkEmail = async () => {
    setIsSendingBulkEmail(true)
    try {
      const result = await presupuestosService.enviarMasivoPorEmail(selectedPresupuestos, {
        asunto: bulkEmailOptions.asunto || undefined,
        mensaje: bulkEmailOptions.mensaje || undefined,
        pdfOptions: {
          mostrarDescripcion: bulkEmailOptions.pdfOptions.mostrarDescripcion,
          mostrarReferencias: bulkEmailOptions.pdfOptions.mostrarReferencias,
          mostrarCondiciones: bulkEmailOptions.pdfOptions.mostrarCondiciones,
          mostrarFirmas: bulkEmailOptions.pdfOptions.mostrarFirmas,
          mostrarCuentaBancaria: bulkEmailOptions.pdfOptions.mostrarCuentaBancaria,
          mostrarLOPD: bulkEmailOptions.pdfOptions.mostrarLOPD,
          mostrarRegistroMercantil: bulkEmailOptions.pdfOptions.mostrarRegistroMercantil,
        },
      })

      if (result.success && result.data) {
        setBulkEmailResults(result.data)
        if (result.data.enviados === result.data.total) {
          toast.success(`${result.data.enviados} emails enviados correctamente`)
        } else {
          toast.warning(`${result.data.enviados} de ${result.data.total} emails enviados`)
        }
        cargarPresupuestos()
      } else {
        toast.error(result.message || 'Error al enviar emails')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar emails')
    } finally {
      setIsSendingBulkEmail(false)
    }
  }

  // ============================================
  // ENVÍO MASIVO POR WHATSAPP
  // ============================================

  const handleBulkWhatsApp = async () => {
    if (selectedPresupuestos.length === 0) {
      toast.error('Selecciona al menos un presupuesto para enviar por WhatsApp')
      return
    }

    setIsLoadingWhatsApp(true)
    setWhatsAppUrls([])
    setShowBulkWhatsAppDialog(true)

    try {
      const result = await presupuestosService.getWhatsAppURLsMasivo(selectedPresupuestos)
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
  // ACCIONES POR PRESUPUESTO
  // ============================================

  const handlePresupuestoAction = async (presupuestoId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/presupuestos/${presupuestoId}`)
        break
      case 'edit':
        router.push(`/presupuestos/${presupuestoId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando presupuesto...')
          const response = await presupuestosService.duplicar(presupuestoId)
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Presupuesto duplicado correctamente')
            router.push(`/presupuestos/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar el presupuesto')
        }
        break
      case 'delete':
        const presupuesto = presupuestos.find(p => p._id === presupuestoId)
        if (presupuesto) {
          setDeleteDialog({
            open: true,
            presupuestoIds: [presupuestoId],
            presupuestoCodigos: [presupuesto.codigo],
          })
        }
        break
      case 'enviar':
        try {
          await presupuestosService.enviar(presupuestoId)
          toast.success('Presupuesto marcado como enviado')
          cargarPresupuestos()
        } catch (error) {
          toast.error('Error al enviar presupuesto')
        }
        break
      case 'aceptar':
        try {
          await presupuestosService.aceptar(presupuestoId)
          toast.success('Presupuesto aceptado')
          cargarPresupuestos()
        } catch (error) {
          toast.error('Error al aceptar presupuesto')
        }
        break
      case 'rechazar':
        try {
          await presupuestosService.rechazar(presupuestoId)
          toast.success('Presupuesto rechazado')
          cargarPresupuestos()
        } catch (error) {
          toast.error('Error al rechazar presupuesto')
        }
        break
      case 'convertir_pedido':
        try {
          toast.loading('Convirtiendo a pedido...')
          const response = await pedidosService.crearDesdePresupuesto(presupuestoId, {
            copiarNotas: true,
          })
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Presupuesto convertido a pedido correctamente')
            router.push(`/pedidos/${response.data._id}`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al convertir a pedido')
        }
        break
      case 'convertir_albaran':
        try {
          toast.loading('Convirtiendo a albarán...')
          const responseAlbaran = await albaranesService.crearDesdePresupuesto(presupuestoId, {
            copiarNotas: true,
          })
          toast.dismiss()
          if (responseAlbaran.success && responseAlbaran.data) {
            toast.success('Presupuesto convertido a albarán correctamente')
            router.push(`/albaranes/${responseAlbaran.data._id}`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al convertir a albarán')
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

  // Generar números de página con ellipsis
  const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
    const pages: (number | string)[] = []
    const maxVisible = 7 // Número máximo de botones visibles

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Páginas alrededor de la actual
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Siempre mostrar última página
      pages.push(totalPages)
    }

    return pages
  }

  // Cambiar límite de registros por página
  const handleLimitChange = (newLimit: number) => {
    setFilters((prev: any) => ({
      ...prev,
      limit: newLimit,
      page: 1, // Resetear a página 1
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
              <FileText className="h-7 w-7 text-primary" />
              Presupuestos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tus presupuestos y ofertas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
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
              onClick={cargarPresupuestos}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
{canCreate('presupuestos') && (
            <Button asChild size="sm">
              <Link href="/presupuestos/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nuevo Presupuesto</span>
              </Link>
            </Button>
            )}
          </div>
        </div>

        {/* DASHBOARD DE KPIS */}
        {showStats && <PresupuestosDashboard />}

        {/* ALERTAS Y RECORDATORIOS */}
        {showAlertas && (
          <div className="grid gap-4 md:grid-cols-[1fr,300px]">
            <PresupuestosAlertas
              diasAlerta={7}
              onRefresh={cargarPresupuestos}
              collapsible={true}
              defaultCollapsed={false}
            />
            <RecordatoriosWidget />
          </div>
        )}

        {/* BARRA DE FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={PRESUPUESTOS_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por código, cliente, título..."
        />

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {/* MENÚ DE CONFIGURACIÓN (Densidad + Vistas + Restablecer) */}
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(newDensity) => {
                updateDensidad(newDensity)
                toast.success(`Densidad cambiada a ${newDensity}`)
              }}
              modulo="presupuestos"
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
              data={presupuestos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="presupuestos"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Borradores', value: stats.borradores },
                { label: 'Enviados', value: stats.enviados },
                { label: 'Aceptados', value: stats.aceptados },
                { label: 'Rechazados', value: stats.rechazados },
                { label: 'Importe Total', value: formatCurrency(stats.totalImporte) },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={presupuestos}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Presupuestos"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Borradores', value: stats.borradores },
                { label: 'Enviados', value: stats.enviados },
                { label: 'Aceptados', value: stats.aceptados },
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
        {selectedPresupuestos.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedPresupuestos.length} {selectedPresupuestos.length === 1 ? 'presupuesto seleccionado' : 'presupuestos seleccionados'}
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleBulkEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
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
                Exportar
              </Button>
{canDelete('presupuestos') && (
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

                  {columnasVisibles.includes('fechaValidez') && (
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('fechaValidez')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Válido Hasta
                        {getSortIcon('fechaValidez')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('totalPresupuesto') && (
                    <th className={`${densityClasses.header} text-right min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('totales.totalPresupuesto')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Importe Total
                        {getSortIcon('totales.totalPresupuesto')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('diasParaCaducar') && (
                    <th className={`${densityClasses.header} text-center min-w-[100px] text-xs font-semibold uppercase tracking-wider`}>
                      Días Caducar
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

                {/* FILTROS POR COLUMNA */}
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
                          ...ESTADOS_PRESUPUESTO.map(e => ({ value: e.value, label: e.label }))
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
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('fechaValidez') && (
                    <th className="px-3 py-1.5">
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={columnFiltersInput.fechaHasta || ''}
                        onChange={(e) => handleColumnFilterInput('fechaHasta', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('totalPresupuesto') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Min..."
                        type="number"
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.importeMinimo || ''}
                        onChange={(e) => handleColumnFilterInput('importeMinimo', e.target.value)}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('diasParaCaducar') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.diasCaducidad || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('diasCaducidad', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'vencidos', label: 'Vencidos' },
                          { value: '7', label: '< 7 días' },
                          { value: '15', label: '< 15 días' },
                          { value: '30', label: '< 30 días' },
                        ]}
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
                      Cargando presupuestos...
                    </td>
                  </tr>
                ) : presupuestos.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron presupuestos</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo presupuesto</p>
                    </td>
                  </tr>
                ) : (
                  presupuestos.map((presupuesto) => (
                    <tr
                      key={presupuesto._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedPresupuestos.includes(presupuesto._id)}
                            onCheckedChange={() => handleSelectPresupuesto(presupuesto._id)}
                          />
                        </div>
                      </td>

                      {columnasVisibles.includes('codigo') && (
                        <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>{presupuesto.codigo}</td>
                      )}

                      {columnasVisibles.includes('clienteNombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <div className="max-w-[200px] truncate" title={getClienteNombre(presupuesto.clienteId, presupuesto.clienteNombre)}>
                            {getClienteNombre(presupuesto.clienteId, presupuesto.clienteNombre)}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('clienteNif') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {getClienteNif(presupuesto.clienteId)}
                        </td>
                      )}

                      {columnasVisibles.includes('clienteEmail') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          <div className="max-w-[180px] truncate" title={getClienteEmail(presupuesto.clienteId)}>
                            {getClienteEmail(presupuesto.clienteId)}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('clienteTelefono') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {getClienteTelefono(presupuesto.clienteId)}
                        </td>
                      )}

                      {columnasVisibles.includes('titulo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          <div className="max-w-[220px] truncate" title={presupuesto.titulo || ''}>
                            {presupuesto.titulo || '-'}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('estado') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge className={`text-xs font-medium ${getEstadoConfig(presupuesto.estado).color}`}>
                            {getEstadoConfig(presupuesto.estado).label}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('fecha') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {formatFecha(presupuesto.fecha)}
                        </td>
                      )}

                      {columnasVisibles.includes('fechaValidez') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {formatFecha(presupuesto.fechaValidez)}
                        </td>
                      )}

                      {columnasVisibles.includes('totalPresupuesto') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold`}>
                          {formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}
                        </td>
                      )}

                      {columnasVisibles.includes('diasParaCaducar') && (
                        <td className={`${densityClasses.cell} text-center ${densityClasses.text}`}>
                          {presupuesto.diasParaCaducar !== null && presupuesto.diasParaCaducar !== undefined ? (
                            <span className={`font-medium ${
                              presupuesto.diasParaCaducar < 0
                                ? 'text-red-600 dark:text-red-400'
                                : presupuesto.diasParaCaducar <= 7
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-green-600 dark:text-green-400'
                            }`}>
                              {presupuesto.diasParaCaducar}
                            </span>
                          ) : '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('agenteComercial') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {getAgenteNombre(presupuesto.agenteComercialId)}
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
                            <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'edit')}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'duplicate')}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>

                            {presupuesto.estado === EstadoPresupuesto.BORRADOR && (
                              <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'enviar')}>
                                <Send className="mr-2 h-4 w-4" />
                                Marcar como Enviado
                              </DropdownMenuItem>
                            )}

                            {(presupuesto.estado === EstadoPresupuesto.ENVIADO || presupuesto.estado === EstadoPresupuesto.PENDIENTE) && (
                              <>
                                <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'aceptar')}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                  Aceptar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'rechazar')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  Rechazar
                                </DropdownMenuItem>
                              </>
                            )}

                            {/* Convertir a Pedido/Albarán - solo si aceptado o enviado y no ya convertido */}
                            {presupuesto.estado !== EstadoPresupuesto.CONVERTIDO &&
                             presupuesto.estado !== EstadoPresupuesto.RECHAZADO &&
                             presupuesto.estado !== EstadoPresupuesto.BORRADOR && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Convertir a</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'convertir_pedido')}>
                                  <ClipboardList className="mr-2 h-4 w-4 text-blue-600" />
                                  Pedido
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePresupuestoAction(presupuesto._id, 'convertir_albaran')}>
                                  <Truck className="mr-2 h-4 w-4 text-green-600" />
                                  Albarán
                                </DropdownMenuItem>
                              </>
                            )}

{canDelete('presupuestos') && (
                            <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handlePresupuestoAction(presupuesto._id, 'delete')}
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
                ¿Estás seguro de que deseas eliminar {deleteDialog.presupuestoIds.length === 1
                  ? 'el siguiente presupuesto'
                  : `los siguientes ${deleteDialog.presupuestoIds.length} presupuestos`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.presupuestoCodigos.map((codigo, index) => (
                  <li key={index} className="text-sm font-medium">• {codigo}</li>
                ))}
              </ul>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, presupuestoIds: [], presupuestoCodigos: [] })}
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

        {/* DIALOG DE OPCIONES DE IMPRESIÓN MASIVA */}
        <Dialog open={showBulkPrintDialog} onOpenChange={setShowBulkPrintDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Imprimir {selectedPresupuestos.length} Presupuesto{selectedPresupuestos.length > 1 ? 's' : ''}
              </DialogTitle>
              <DialogDescription>
                Personaliza cómo se imprimirán los presupuestos seleccionados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Lista de presupuestos a imprimir */}
              <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Presupuestos seleccionados:</p>
                <ul className="space-y-1">
                  {presupuestos
                    .filter(p => selectedPresupuestos.includes(p._id))
                    .map(p => (
                      <li key={p._id} className="text-sm">
                        <span className="font-mono font-medium">{p.codigo}</span>
                        <span className="text-muted-foreground"> - {getClienteNombre(p.clienteId, p.clienteNombre)}</span>
                      </li>
                    ))
                  }
                </ul>
              </div>

              <Separator />

              {/* Descripción de productos */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descripción de productos</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={bulkPrintOptions.mostrarDescripcion === 'ninguna' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBulkPrintOptions(prev => ({ ...prev, mostrarDescripcion: 'ninguna' }))}
                    className="w-full"
                  >
                    Ninguna
                  </Button>
                  <Button
                    type="button"
                    variant={bulkPrintOptions.mostrarDescripcion === 'corta' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBulkPrintOptions(prev => ({ ...prev, mostrarDescripcion: 'corta' }))}
                    className="w-full"
                  >
                    Corta
                  </Button>
                  <Button
                    type="button"
                    variant={bulkPrintOptions.mostrarDescripcion === 'larga' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBulkPrintOptions(prev => ({ ...prev, mostrarDescripcion: 'larga' }))}
                    className="w-full"
                  >
                    Completa
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {bulkPrintOptions.mostrarDescripcion === 'ninguna' && 'Solo se mostrará el nombre del producto'}
                  {bulkPrintOptions.mostrarDescripcion === 'corta' && 'Descripción truncada a 100 caracteres'}
                  {bulkPrintOptions.mostrarDescripcion === 'larga' && 'Descripción completa del producto'}
                </p>
              </div>

              <Separator />

              {/* Otras opciones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bulkMostrarReferencias" className="cursor-pointer">
                    Mostrar referencias (SKU)
                  </Label>
                  <Switch
                    id="bulkMostrarReferencias"
                    checked={bulkPrintOptions.mostrarReferencias}
                    onCheckedChange={(checked) => setBulkPrintOptions(prev => ({ ...prev, mostrarReferencias: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bulkMostrarCondiciones" className="cursor-pointer">
                    Mostrar condiciones comerciales
                  </Label>
                  <Switch
                    id="bulkMostrarCondiciones"
                    checked={bulkPrintOptions.mostrarCondiciones}
                    onCheckedChange={(checked) => setBulkPrintOptions(prev => ({ ...prev, mostrarCondiciones: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bulkMostrarFirmas" className="cursor-pointer">
                    Mostrar espacio para firmas
                  </Label>
                  <Switch
                    id="bulkMostrarFirmas"
                    checked={bulkPrintOptions.mostrarFirmas}
                    onCheckedChange={(checked) => setBulkPrintOptions(prev => ({ ...prev, mostrarFirmas: checked }))}
                  />
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between">
                  <Label htmlFor="bulkMostrarCuentaBancaria" className="cursor-pointer">
                    Mostrar datos bancarios
                  </Label>
                  <Switch
                    id="bulkMostrarCuentaBancaria"
                    checked={bulkPrintOptions.mostrarCuentaBancaria}
                    onCheckedChange={(checked) => setBulkPrintOptions(prev => ({ ...prev, mostrarCuentaBancaria: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bulkMostrarLOPD" className="cursor-pointer">
                    Mostrar texto LOPD/RGPD
                  </Label>
                  <Switch
                    id="bulkMostrarLOPD"
                    checked={bulkPrintOptions.mostrarLOPD}
                    onCheckedChange={(checked) => setBulkPrintOptions(prev => ({ ...prev, mostrarLOPD: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="bulkMostrarRegistroMercantil" className="cursor-pointer">
                    Mostrar registro mercantil
                  </Label>
                  <Switch
                    id="bulkMostrarRegistroMercantil"
                    checked={bulkPrintOptions.mostrarRegistroMercantil}
                    onCheckedChange={(checked) => setBulkPrintOptions(prev => ({ ...prev, mostrarRegistroMercantil: checked }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowBulkPrintDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmBulkPrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* LOADING MIENTRAS CARGA PRESUPUESTOS COMPLETOS */}
        {isLoadingPresupuestosCompletos && (
          <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center">
            <Card className="p-6 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Cargando presupuestos para imprimir...</p>
              <p className="text-xs text-muted-foreground">
                {selectedPresupuestos.length} presupuesto{selectedPresupuestos.length > 1 ? 's' : ''}
              </p>
            </Card>
          </div>
        )}

        {/* VISTA DE IMPRESIÓN MASIVA */}
        {showBulkPrintView && presupuestosToImprimir.length > 0 && (
          <div className="fixed inset-0 bg-white z-[9999] overflow-auto print:relative print:inset-auto print:z-auto">
            <div className="no-print absolute top-4 right-4 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBulkPrintView(false)
                  setPresupuestosToImprimir([])
                }}
              >
                Cerrar vista previa
              </Button>
            </div>
            <div ref={bulkPrintRef}>
              {presupuestosToImprimir.map((presupuesto, index) => (
                <div key={presupuesto._id}>
                  <PresupuestoPrintView
                    presupuesto={presupuesto}
                    empresa={empresa}
                    options={bulkPrintOptions}
                  />
                  {/* Salto de página entre presupuestos */}
                  {index < presupuestosToImprimir.length - 1 && (
                    <div className="page-break" style={{ pageBreakAfter: 'always', height: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIALOG DE ENVÍO MASIVO POR EMAIL */}
        <Dialog open={showBulkEmailDialog} onOpenChange={setShowBulkEmailDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Enviar {selectedPresupuestos.length} Presupuesto{selectedPresupuestos.length > 1 ? 's' : ''} por Email
              </DialogTitle>
              <DialogDescription>
                Cada presupuesto se enviará al email del cliente correspondiente con el PDF adjunto
              </DialogDescription>
            </DialogHeader>

            {bulkEmailResults ? (
              // Mostrar resultados del envío
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3 text-center border-l-4 border-l-blue-500">
                    <p className="text-2xl font-bold">{bulkEmailResults.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </Card>
                  <Card className="p-3 text-center border-l-4 border-l-green-500">
                    <p className="text-2xl font-bold text-green-600">{bulkEmailResults.enviados}</p>
                    <p className="text-xs text-muted-foreground">Enviados</p>
                  </Card>
                  <Card className="p-3 text-center border-l-4 border-l-red-500">
                    <p className="text-2xl font-bold text-red-600">{bulkEmailResults.fallidos}</p>
                    <p className="text-xs text-muted-foreground">Fallidos</p>
                  </Card>
                </div>

                <div className="max-h-60 overflow-y-auto bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Detalle del envío:</p>
                  <ul className="space-y-2">
                    {bulkEmailResults.resultados.map((r, idx) => (
                      <li key={idx} className={`text-sm flex items-start gap-2 p-2 rounded ${r.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                        {r.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-mono font-medium">{r.codigo}</span>
                          <span className="text-muted-foreground block text-xs">{r.message}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              // Formulario de configuración
              <div className="space-y-4 py-4">
                {/* Lista de presupuestos */}
                <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Presupuestos seleccionados:</p>
                  <ul className="space-y-1">
                    {presupuestos
                      .filter(p => selectedPresupuestos.includes(p._id))
                      .map(p => (
                        <li key={p._id} className="text-sm flex items-center gap-2">
                          <span className="font-mono font-medium">{p.codigo}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-muted-foreground truncate">{p.clienteEmail || 'Sin email'}</span>
                        </li>
                      ))
                    }
                  </ul>
                </div>

                <Separator />

                {/* Asunto personalizado */}
                <div className="space-y-2">
                  <Label htmlFor="bulkEmailAsunto">Asunto (opcional)</Label>
                  <Input
                    id="bulkEmailAsunto"
                    placeholder="Dejar vacío para usar el asunto por defecto"
                    value={bulkEmailOptions.asunto}
                    onChange={(e) => setBulkEmailOptions(prev => ({ ...prev, asunto: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Por defecto: "Presupuesto [CÓDIGO]"
                  </p>
                </div>

                {/* Mensaje personalizado */}
                <div className="space-y-2">
                  <Label htmlFor="bulkEmailMensaje">Mensaje personalizado (opcional)</Label>
                  <textarea
                    id="bulkEmailMensaje"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Añadir un mensaje personalizado al cuerpo del email..."
                    value={bulkEmailOptions.mensaje}
                    onChange={(e) => setBulkEmailOptions(prev => ({ ...prev, mensaje: e.target.value }))}
                  />
                </div>

                <Separator />

                {/* Opciones del PDF */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Opciones del PDF adjunto</Label>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={bulkEmailOptions.pdfOptions.mostrarDescripcion === 'ninguna' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarDescripcion: 'ninguna' }
                      }))}
                    >
                      Sin descripción
                    </Button>
                    <Button
                      type="button"
                      variant={bulkEmailOptions.pdfOptions.mostrarDescripcion === 'corta' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarDescripcion: 'corta' }
                      }))}
                    >
                      Corta
                    </Button>
                    <Button
                      type="button"
                      variant={bulkEmailOptions.pdfOptions.mostrarDescripcion === 'larga' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarDescripcion: 'larga' }
                      }))}
                    >
                      Completa
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulkEmailReferencias" className="cursor-pointer text-sm">
                      Mostrar referencias (SKU)
                    </Label>
                    <Switch
                      id="bulkEmailReferencias"
                      checked={bulkEmailOptions.pdfOptions.mostrarReferencias}
                      onCheckedChange={(checked) => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarReferencias: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulkEmailCondiciones" className="cursor-pointer text-sm">
                      Mostrar condiciones
                    </Label>
                    <Switch
                      id="bulkEmailCondiciones"
                      checked={bulkEmailOptions.pdfOptions.mostrarCondiciones}
                      onCheckedChange={(checked) => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarCondiciones: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulkEmailFirmas" className="cursor-pointer text-sm">
                      Espacio para firmas
                    </Label>
                    <Switch
                      id="bulkEmailFirmas"
                      checked={bulkEmailOptions.pdfOptions.mostrarFirmas}
                      onCheckedChange={(checked) => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarFirmas: checked }
                      }))}
                    />
                  </div>

                  <Separator className="my-2" />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulkEmailCuentaBancaria" className="cursor-pointer text-sm">
                      Mostrar datos bancarios
                    </Label>
                    <Switch
                      id="bulkEmailCuentaBancaria"
                      checked={bulkEmailOptions.pdfOptions.mostrarCuentaBancaria}
                      onCheckedChange={(checked) => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarCuentaBancaria: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulkEmailLOPD" className="cursor-pointer text-sm">
                      Mostrar texto LOPD/RGPD
                    </Label>
                    <Switch
                      id="bulkEmailLOPD"
                      checked={bulkEmailOptions.pdfOptions.mostrarLOPD}
                      onCheckedChange={(checked) => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarLOPD: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulkEmailRegistroMercantil" className="cursor-pointer text-sm">
                      Mostrar registro mercantil
                    </Label>
                    <Switch
                      id="bulkEmailRegistroMercantil"
                      checked={bulkEmailOptions.pdfOptions.mostrarRegistroMercantil}
                      onCheckedChange={(checked) => setBulkEmailOptions(prev => ({
                        ...prev,
                        pdfOptions: { ...prev.pdfOptions, mostrarRegistroMercantil: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowBulkEmailDialog(false)}
              >
                {bulkEmailResults ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!bulkEmailResults && (
                <Button onClick={handleConfirmBulkEmail} disabled={isSendingBulkEmail}>
                  {isSendingBulkEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Emails
                    </>
                  )}
                </Button>
              )}
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
                Haz clic en cada botón para abrir WhatsApp con el mensaje predefinido
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
                            {item.clienteNombre || 'Cliente'}
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
                            Sin teléfono
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
                    <span className="font-medium text-green-600">{whatsAppUrls.filter(u => u.url).length}</span> de {whatsAppUrls.length} presupuestos tienen teléfono válido para WhatsApp
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
      </div>
    
  )
}
