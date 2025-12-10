'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { facturasService } from '@/services/facturas.service'
import { api } from '@/services/api'
import vistasService from '@/services/vistas-guardadas.service'
import {
  IFactura,
  ESTADOS_FACTURA,
  EstadoFactura,
  TIPOS_FACTURA,
  TipoFactura,
  METODOS_PAGO,
  getEstadoConfig,
} from '@/types/factura.types'
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
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
  Euro,
  CreditCard,
  QrCode,
  Ban,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Mail,
  MessageCircle,
  Printer,
  ChevronDown,
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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO FACTURAS
// ============================================

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'clienteNombre', visible: true, orden: 1 },
    { key: 'tipo', visible: true, orden: 2 },
    { key: 'estado', visible: true, orden: 3 },
    { key: 'fecha', visible: true, orden: 4 },
    { key: 'fechaVencimiento', visible: true, orden: 5 },
    { key: 'totalFactura', visible: true, orden: 6 },
    { key: 'importePendiente', visible: true, orden: 7 },
    { key: 'diasVencimiento', visible: true, orden: 8 },
    { key: 'agenteComercial', visible: false, orden: 9 },
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

export default function FacturasPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)

  // Estados de datos
  const [facturas, setFacturas] = useState<IFactura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Selección múltiple
  const [selectedFacturas, setSelectedFacturas] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

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
  const [showStats, setShowStats] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    facturaIds: string[]
    facturaCodigos: string[]
  }>({
    open: false,
    facturaIds: [],
    facturaCodigos: [],
  })

  // Estados para diálogos de acciones
  const [emitirDialog, setEmitirDialog] = useState<{
    open: boolean
    facturaId: string
    facturaCodigo: string
  }>({
    open: false,
    facturaId: '',
    facturaCodigo: '',
  })

  const [anularDialog, setAnularDialog] = useState<{
    open: boolean
    facturaId: string
    facturaCodigo: string
    motivo: string
  }>({
    open: false,
    facturaId: '',
    facturaCodigo: '',
    motivo: '',
  })

  const [cobroDialog, setCobroDialog] = useState<{
    open: boolean
    facturaId: string
    facturaCodigo: string
    importe: number
    metodoPago: string
    referencia: string
  }>({
    open: false,
    facturaId: '',
    facturaCodigo: '',
    importe: 0,
    metodoPago: 'transferencia',
    referencia: '',
  })

  const [qrDialog, setQrDialog] = useState<{
    open: boolean
    qrData: string | null
    urlVerificacion: string | null
    isLoading: boolean
  }>({
    open: false,
    qrData: null,
    urlVerificacion: null,
    isLoading: false,
  })

  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'clienteNombre', label: 'Cliente', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true },
    { key: 'fechaVencimiento', label: 'Vencimiento', sortable: true },
    { key: 'totalFactura', label: 'Total', sortable: true },
    { key: 'importePendiente', label: 'Pendiente', sortable: true },
    { key: 'diasVencimiento', label: 'Días Venc.', sortable: false },
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
    updateDensidad,
    resetConfig,
  } = useModuleConfig('facturas', DEFAULT_CONFIG, {
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
    if (!facturas || !Array.isArray(facturas)) {
      return {
        total: 0,
        borradores: 0,
        emitidas: 0,
        cobradas: 0,
        pendientes: 0,
        vencidas: 0,
        totalFacturado: 0,
        totalCobrado: 0,
        totalPendiente: 0,
        totalVencido: 0,
      }
    }

    const total = pagination?.total || 0
    const borradores = facturas.filter((f) => f?.estado === EstadoFactura.BORRADOR).length
    const emitidas = facturas.filter((f) => f?.estado === EstadoFactura.EMITIDA || f?.estado === EstadoFactura.ENVIADA).length
    const cobradas = facturas.filter((f) => f?.estado === EstadoFactura.COBRADA).length
    const pendientes = facturas.filter((f) =>
      f?.estado === EstadoFactura.EMITIDA ||
      f?.estado === EstadoFactura.ENVIADA ||
      f?.estado === EstadoFactura.PARCIALMENTE_COBRADA
    ).length
    const vencidas = facturas.filter((f) => f?.estado === EstadoFactura.VENCIDA || f?.estado === EstadoFactura.IMPAGADA).length

    const totalFacturado = facturas.reduce((sum, f) => sum + (f?.totales?.totalFactura || 0), 0)
    const totalCobrado = facturas.reduce((sum, f) => sum + (f?.importeCobrado || 0), 0)
    const totalPendiente = facturas.reduce((sum, f) => sum + (f?.importePendiente || 0), 0)
    const totalVencido = facturas
      .filter((f) => f?.estado === EstadoFactura.VENCIDA || f?.estado === EstadoFactura.IMPAGADA)
      .reduce((sum, f) => sum + (f?.importePendiente || 0), 0)

    return {
      total,
      borradores,
      emitidas,
      cobradas,
      pendientes,
      vencidas,
      totalFacturado,
      totalCobrado,
      totalPendiente,
      totalVencido,
    }
  }, [facturas, pagination?.total])

  // ============================================
  // CARGAR FACTURAS
  // ============================================

  const cargarFacturas = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await facturasService.getAll(filters)

      if (response.success) {
        setFacturas(response.data || [])
        setPagination({
          page: response.page || 1,
          limit: response.limit || 25,
          total: response.total || 0,
          pages: response.totalPages || 0,
        })
      } else {
        setFacturas([])
        toast.error('Error al cargar las facturas')
      }
    } catch (error) {
      console.error('Error al cargar facturas:', error)
      setFacturas([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar las facturas')
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

    const searchableFields = ['codigo', 'clienteNombre']
    const searchTerms: string[] = []

    searchableFields.forEach(field => {
      if (debouncedColumnFilters[field]) {
        searchTerms.push(debouncedColumnFilters[field])
      }
    })

    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }

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
          combinedFilters.importeMin = value
        }
      } else if (key === 'importeMaximo') {
        if (value) {
          combinedFilters.importeMax = value
        }
      } else if (key === 'cobrada') {
        if (value !== 'all') {
          combinedFilters.cobrada = value
        }
      } else if (key === 'vencida') {
        if (value !== 'all') {
          combinedFilters.vencida = value
        }
      }
    })

    setFilters(combinedFilters)
  }, [debouncedColumnFilters, currentSortKey, currentSortDirection, currentLimit])

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
      if (vistaIdActualizar) {
        await vistasService.update(vistaIdActualizar, {
          modulo: 'facturas',
          nombre,
          descripcion,
          configuracion: moduleConfig,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        await vistasService.create({
          modulo: 'facturas',
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
        const vistas = await vistasService.getAll('facturas', true)
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

  const handleBulkAction = async (action: string) => {
    const facturasSeleccionadas = facturas.filter(f => selectedFacturas.includes(f._id))

    switch (action) {
      case 'export':
        handleExportSelected()
        break

      case 'delete':
        if (selectedFacturas.length > 0) {
          const codigosSeleccionados = facturasSeleccionadas.map(f => f.codigo)
          setDeleteDialog({
            open: true,
            facturaIds: selectedFacturas,
            facturaCodigos: codigosSeleccionados,
          })
        }
        break

      case 'email':
        // Enviar facturas seleccionadas por email
        const facturasConEmail = facturasSeleccionadas.filter(f => f.clienteEmail)
        const facturasSinEmail = facturasSeleccionadas.filter(f => !f.clienteEmail)

        if (facturasConEmail.length === 0) {
          toast.error('Ninguna de las facturas seleccionadas tiene email de cliente')
          return
        }

        if (facturasSinEmail.length > 0) {
          toast.warning(`${facturasSinEmail.length} factura(s) sin email serán omitidas`)
        }

        try {
          toast.loading(`Enviando ${facturasConEmail.length} factura(s) por email...`, { id: 'bulk-email' })

          let enviadas = 0
          let errores = 0

          for (const factura of facturasConEmail) {
            try {
              await facturasService.enviarPorEmail(factura._id)
              enviadas++
            } catch (error) {
              errores++
              console.error(`Error enviando factura ${factura.codigo}:`, error)
            }
          }

          toast.dismiss('bulk-email')

          if (errores === 0) {
            toast.success(`${enviadas} factura(s) enviada(s) correctamente`)
          } else {
            toast.warning(`${enviadas} enviada(s), ${errores} con error`)
          }

          cargarFacturas()
          setSelectedFacturas([])
          setSelectAll(false)
        } catch (error) {
          toast.dismiss('bulk-email')
          toast.error('Error al enviar facturas por email')
        }
        break

      case 'whatsapp':
        // Para WhatsApp, abrir una pestaña por cada factura con teléfono
        const facturasConTelefono = facturasSeleccionadas.filter(f => f.clienteTelefono)

        if (facturasConTelefono.length === 0) {
          toast.error('Ninguna de las facturas seleccionadas tiene teléfono de cliente')
          return
        }

        if (facturasConTelefono.length > 5) {
          toast.warning('Se abrirán múltiples pestañas. Permite las ventanas emergentes.')
        }

        facturasConTelefono.forEach(factura => {
          const telefono = factura.clienteTelefono?.replace(/\s/g, '').replace(/[^0-9]/g, '')
          if (!telefono) return

          let telefonoWA = telefono
          if (!telefono.startsWith('34') && telefono.length === 9) {
            telefonoWA = '34' + telefono
          }

          const mensaje = encodeURIComponent(
            `Hola ${factura.clienteNombre},\n\n` +
            `Le enviamos la factura *${factura.codigo}* por un importe de *${(factura.totales?.totalFactura || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}*.\n\n` +
            `Quedamos a su disposición para cualquier consulta.`
          )

          window.open(`https://wa.me/${telefonoWA}?text=${mensaje}`, '_blank')
        })

        toast.success(`Abierto WhatsApp para ${facturasConTelefono.length} factura(s)`)
        break

      case 'print':
        // Abrir vista de impresión de cada factura
        if (selectedFacturas.length === 1) {
          // Abrir ventana de impresión con zoom
          window.open(`/facturas/${selectedFacturas[0]}/imprimir`, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes')
        } else if (selectedFacturas.length <= 5) {
          // Abrir cada factura en una nueva ventana
          selectedFacturas.forEach((id, index) => {
            setTimeout(() => {
              window.open(`/facturas/${id}/imprimir`, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes')
            }, index * 500) // Esperar 500ms entre cada apertura
          })
          toast.info(`Abriendo ${selectedFacturas.length} facturas para imprimir`)
        } else {
          toast.warning('Seleccione máximo 5 facturas para imprimir a la vez')
        }
        break

      default:
        // Manejar cambios de estado masivos
        if (action.startsWith('estado:')) {
          const nuevoEstado = action.replace('estado:', '') as EstadoFactura

          try {
            toast.loading(`Cambiando estado de ${selectedFacturas.length} factura(s)...`, { id: 'bulk-estado' })

            let cambiadas = 0
            let errores = 0

            for (const facturaId of selectedFacturas) {
              try {
                await facturasService.cambiarEstado(facturaId, { estado: nuevoEstado })
                cambiadas++
              } catch (error) {
                errores++
                console.error(`Error cambiando estado de factura ${facturaId}:`, error)
              }
            }

            toast.dismiss('bulk-estado')

            if (errores === 0) {
              toast.success(`${cambiadas} factura(s) actualizadas a "${getEstadoConfig(nuevoEstado).label}"`)
            } else {
              toast.warning(`${cambiadas} actualizadas, ${errores} con error`)
            }

            cargarFacturas()
            setSelectedFacturas([])
            setSelectAll(false)
          } catch (error) {
            toast.dismiss('bulk-estado')
            toast.error('Error al cambiar estado de facturas')
          }
        } else {
          toast.info(`Acción "${action}" en desarrollo`)
        }
    }
  }

  const handleExportSelected = async () => {
    try {
      const selectedData = facturas.filter(f => selectedFacturas.includes(f._id))

      if (selectedData.length === 0) {
        toast.error('No hay facturas seleccionadas')
        return
      }

      const exportData = selectedData.map(f => ({
        codigo: f.codigo,
        clienteNombre: f.clienteNombre || '-',
        tipo: TIPOS_FACTURA.find(t => t.value === f.tipo)?.label || f.tipo,
        estado: getEstadoConfig(f.estado)?.label || f.estado,
        fecha: f.fecha ? new Date(f.fecha).toLocaleDateString('es-ES') : '-',
        fechaVencimiento: f.fechaVencimiento ? new Date(f.fechaVencimiento).toLocaleDateString('es-ES') : '-',
        totalFactura: (f.totales?.totalFactura || 0).toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }),
        importePendiente: (f.importePendiente || 0).toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }),
        diasVencimiento: f.diasVencimiento?.toString() || '-',
        agenteComercial: getAgenteNombre(f.agenteComercialId) || '-',
      }))

      const columns = columnasDisponibles
        .filter((col) => columnasVisibles.includes(col.key))
        .map((col) => ({
          key: col.key,
          label: col.label,
          width: 20,
        }))

      const response = await api.post('/export/excel', {
        filename: `facturas_seleccionadas_${new Date().toISOString().split('T')[0]}`,
        title: 'Facturas Seleccionadas',
        subtitle: `Exportadas el ${new Date().toLocaleDateString('es-ES')} - ${selectedData.length} registros`,
        columns,
        data: exportData,
        stats: [
          { label: 'Total Seleccionadas', value: selectedData.length },
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
      link.download = `facturas_seleccionadas_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success(`${selectedData.length} factura(s) exportada(s) correctamente`)
    } catch (error: any) {
      console.error('Error al exportar facturas:', error)
      toast.error(error.response?.data?.message || 'Error al exportar facturas')
    }
  }

  // ============================================
  // ELIMINAR FACTURAS
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      for (const id of deleteDialog.facturaIds) {
        await facturasService.delete(id)
      }

      toast.success('Factura(s) eliminada(s) correctamente')
      cargarFacturas()
      setSelectedFacturas([])
      setSelectAll(false)
      setDeleteDialog({ open: false, facturaIds: [], facturaCodigos: [] })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar. Solo se pueden eliminar borradores.')
    }
  }

  // ============================================
  // ACCIONES POR FACTURA
  // ============================================

  const handleFacturaAction = async (facturaId: string, action: string) => {
    const factura = facturas.find(f => f._id === facturaId)

    switch (action) {
      case 'view':
        router.push(`/facturas/${facturaId}`)
        break
      case 'edit':
        router.push(`/facturas/${facturaId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando factura...')
          const response = await facturasService.duplicar(facturaId)
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Factura duplicada correctamente')
            router.push(`/facturas/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar la factura')
        }
        break
      case 'delete':
        if (factura) {
          setDeleteDialog({
            open: true,
            facturaIds: [facturaId],
            facturaCodigos: [factura.codigo],
          })
        }
        break
      case 'emitir':
        if (factura) {
          setEmitirDialog({
            open: true,
            facturaId,
            facturaCodigo: factura.codigo,
          })
        }
        break
      case 'cobrar':
        if (factura) {
          setCobroDialog({
            open: true,
            facturaId,
            facturaCodigo: factura.codigo,
            importe: factura.importePendiente || 0,
            metodoPago: 'transferencia',
            referencia: '',
          })
        }
        break
      case 'anular':
        if (factura) {
          setAnularDialog({
            open: true,
            facturaId,
            facturaCodigo: factura.codigo,
            motivo: '',
          })
        }
        break
      case 'qr':
        await handleShowQR(facturaId)
        break
      case 'email':
        if (!factura) return
        if (!factura.clienteEmail) {
          toast.error('El cliente no tiene email configurado')
          return
        }
        try {
          toast.loading('Enviando factura por email...', { id: 'single-email' })
          await facturasService.enviarPorEmail(facturaId)
          toast.dismiss('single-email')
          toast.success('Factura enviada por email correctamente')
          cargarFacturas()
        } catch (error: any) {
          toast.dismiss('single-email')
          if (error.response?.status === 400 && error.response?.data?.message?.includes('configuración')) {
            toast.error('No hay configuración de email. Configúrala en Ajustes > Email')
          } else {
            toast.error(error.response?.data?.message || 'Error al enviar factura por email')
          }
        }
        break
      case 'whatsapp':
        if (!factura) return
        const telefono = factura.clienteTelefono?.replace(/\s/g, '').replace(/[^0-9]/g, '')
        if (!telefono) {
          toast.error('El cliente no tiene teléfono configurado')
          return
        }

        let telefonoWA = telefono
        if (!telefono.startsWith('34') && telefono.length === 9) {
          telefonoWA = '34' + telefono
        }

        const mensaje = encodeURIComponent(
          `Hola ${factura.clienteNombre},\n\n` +
          `Le enviamos la factura *${factura.codigo}* por un importe de *${(factura.totales?.totalFactura || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}*.\n\n` +
          `Fecha de vencimiento: ${factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toLocaleDateString('es-ES') : 'No especificada'}\n\n` +
          `Quedamos a su disposición para cualquier consulta.`
        )

        window.open(`https://wa.me/${telefonoWA}?text=${mensaje}`, '_blank')
        break
      default:
        toast.info(`Acción "${action}" en desarrollo`)
    }
  }

  // ============================================
  // EMITIR FACTURA
  // ============================================

  const handleEmitirConfirm = async () => {
    try {
      const response = await facturasService.emitir(emitirDialog.facturaId)
      if (response.success) {
        toast.success('Factura emitida correctamente')
        cargarFacturas()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al emitir la factura')
    } finally {
      setEmitirDialog({ open: false, facturaId: '', facturaCodigo: '' })
    }
  }

  // ============================================
  // REGISTRAR COBRO
  // ============================================

  const handleCobroConfirm = async () => {
    try {
      const response = await facturasService.registrarCobro(cobroDialog.facturaId, {
        fecha: new Date().toISOString(),
        importe: cobroDialog.importe,
        metodoPago: cobroDialog.metodoPago as any,
        referencia: cobroDialog.referencia || undefined,
      })
      if (response.success) {
        toast.success('Cobro registrado correctamente')
        cargarFacturas()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar el cobro')
    } finally {
      setCobroDialog({
        open: false,
        facturaId: '',
        facturaCodigo: '',
        importe: 0,
        metodoPago: 'transferencia',
        referencia: '',
      })
    }
  }

  // ============================================
  // ANULAR FACTURA
  // ============================================

  const handleAnularConfirm = async () => {
    if (!anularDialog.motivo.trim()) {
      toast.error('Debe indicar un motivo de anulación')
      return
    }

    try {
      const response = await facturasService.anular(anularDialog.facturaId, {
        motivo: anularDialog.motivo,
      })
      if (response.success) {
        toast.success('Factura anulada correctamente')
        cargarFacturas()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular la factura')
    } finally {
      setAnularDialog({ open: false, facturaId: '', facturaCodigo: '', motivo: '' })
    }
  }

  // ============================================
  // VER QR
  // ============================================

  const handleShowQR = async (facturaId: string) => {
    setQrDialog({
      open: true,
      qrData: null,
      urlVerificacion: null,
      isLoading: true,
    })

    try {
      const response = await facturasService.getQR(facturaId)
      if (response.success && response.data) {
        setQrDialog({
          open: true,
          qrData: response.data.codigoQR,
          urlVerificacion: response.data.urlVerificacion,
          isLoading: false,
        })
      } else {
        toast.error('No se pudo obtener el código QR')
        setQrDialog({ open: false, qrData: null, urlVerificacion: null, isLoading: false })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al obtener el código QR')
      setQrDialog({ open: false, qrData: null, urlVerificacion: null, isLoading: false })
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
              <Receipt className="h-7 w-7 text-primary" />
              Facturas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tus facturas de venta
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
              onClick={cargarFacturas}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            <Button asChild size="sm">
              <Link href="/facturas/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nueva Factura</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* DASHBOARD DE ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Facturas</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Facturado</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalFacturado)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cobrado</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalCobrado)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendiente</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalPendiente)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencido</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalVencido)}</p>
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
              placeholder="Buscar por código, cliente..."
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
              modulo="facturas"
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
              data={facturas}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="facturas"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Facturado', value: formatCurrency(stats.totalFacturado) },
                { label: 'Cobrado', value: formatCurrency(stats.totalCobrado) },
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
              title="Listado de Facturas"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Facturado', value: formatCurrency(stats.totalFacturado) },
              ]}
              filters={columnFiltersInput}
            />
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

              {/* Enviar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('email')}>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar por Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('whatsapp')}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar por WhatsApp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Imprimir */}
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('print')}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>

              {/* Exportar */}
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
              </Button>

              {/* Cambiar Estado */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Estado
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Cambiar estado a:</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ESTADOS_FACTURA.map((estado) => (
                    <DropdownMenuItem
                      key={estado.value}
                      onClick={() => handleBulkAction(`estado:${estado.value}`)}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 ${getEstadoConfig(estado.value).dotColor || 'bg-gray-400'}`} />
                      {estado.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Eliminar */}
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

                  {columnasVisibles.includes('fechaVencimiento') && (
                    <th className={`${densityClasses.header} text-left min-w-[100px]`}>
                      <button
                        onClick={() => handleSort('fechaVencimiento')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Vencimiento
                        {getSortIcon('fechaVencimiento')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('totalFactura') && (
                    <th className={`${densityClasses.header} text-right min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('totales.totalFactura')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Total
                        {getSortIcon('totales.totalFactura')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('importePendiente') && (
                    <th className={`${densityClasses.header} text-right min-w-[120px]`}>
                      <button
                        onClick={() => handleSort('importePendiente')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Pendiente
                        {getSortIcon('importePendiente')}
                      </button>
                    </th>
                  )}

                  {columnasVisibles.includes('diasVencimiento') && (
                    <th className={`${densityClasses.header} text-center min-w-[80px] text-xs font-semibold uppercase tracking-wider`}>
                      Días Venc.
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

                  {columnasVisibles.includes('tipo') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.tipo || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('tipo', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          ...TIPOS_FACTURA.map(t => ({ value: t.value, label: t.label }))
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
                          ...ESTADOS_FACTURA.map(e => ({ value: e.value, label: e.label }))
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
                      <TableSelect
                        value={columnFiltersInput.vencida || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('vencida', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Vencidas' },
                          { value: 'false', label: 'No vencidas' },
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('totalFactura') && (
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

                  {columnasVisibles.includes('importePendiente') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.cobrada || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('cobrada', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'true', label: 'Cobradas' },
                          { value: 'false', label: 'Pendientes' },
                        ]}
                      />
                    </th>
                  )}

                  {columnasVisibles.includes('diasVencimiento') && (
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

                  <th className="sticky right-0 z-30 bg-background backdrop-blur-sm px-3 py-1.5"></th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Cargando facturas...
                    </td>
                  </tr>
                ) : facturas.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron facturas</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear una nueva factura</p>
                    </td>
                  </tr>
                ) : (
                  facturas.map((factura) => (
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
                          <Link href={`/facturas/${factura._id}`} className="hover:text-primary hover:underline">
                            {factura.codigo}
                          </Link>
                        </td>
                      )}

                      {columnasVisibles.includes('clienteNombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <div className="max-w-[200px] truncate" title={getClienteNombre(factura.clienteId, factura.clienteNombre)}>
                            {getClienteNombre(factura.clienteId, factura.clienteNombre)}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('tipo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {TIPOS_FACTURA.find(t => t.value === factura.tipo)?.label || factura.tipo}
                        </td>
                      )}

                      {columnasVisibles.includes('estado') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge className={`text-xs font-medium ${getEstadoConfig(factura.estado).color}`}>
                            {getEstadoConfig(factura.estado).label}
                          </Badge>
                        </td>
                      )}

                      {columnasVisibles.includes('fecha') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {formatFecha(factura.fecha)}
                        </td>
                      )}

                      {columnasVisibles.includes('fechaVencimiento') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {formatFecha(factura.fechaVencimiento)}
                        </td>
                      )}

                      {columnasVisibles.includes('totalFactura') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-semibold`}>
                          {formatCurrency(factura.totales?.totalFactura || 0)}
                        </td>
                      )}

                      {columnasVisibles.includes('importePendiente') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} ${(factura.importePendiente || 0) > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}`}>
                          {formatCurrency(factura.importePendiente || 0)}
                        </td>
                      )}

                      {columnasVisibles.includes('diasVencimiento') && (
                        <td className={`${densityClasses.cell} text-center ${densityClasses.text}`}>
                          {factura.diasVencimiento !== null && factura.diasVencimiento !== undefined ? (
                            <span className={`font-medium ${
                              factura.diasVencimiento < 0
                                ? 'text-red-600 dark:text-red-400'
                                : factura.diasVencimiento <= 7
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-green-600 dark:text-green-400'
                            }`}>
                              {factura.diasVencimiento}
                            </span>
                          ) : '-'}
                        </td>
                      )}

                      {columnasVisibles.includes('agenteComercial') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {getAgenteNombre(factura.agenteComercialId)}
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
                            {!factura.inmutable && (
                              <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'edit')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'duplicate')}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Enviar</DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => handleFacturaAction(factura._id, 'email')}
                              disabled={!factura.clienteEmail}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar por Email
                              {!factura.clienteEmail && <span className="ml-auto text-xs text-muted-foreground">Sin email</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleFacturaAction(factura._id, 'whatsapp')}
                              disabled={!factura.clienteTelefono}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Enviar por WhatsApp
                              {!factura.clienteTelefono && <span className="ml-auto text-xs text-muted-foreground">Sin teléfono</span>}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>

                            {factura.estado === EstadoFactura.BORRADOR && (
                              <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'emitir')}>
                                <Send className="mr-2 h-4 w-4" />
                                Emitir factura
                              </DropdownMenuItem>
                            )}

                            {(factura.estado === EstadoFactura.EMITIDA ||
                              factura.estado === EstadoFactura.ENVIADA ||
                              factura.estado === EstadoFactura.PARCIALMENTE_COBRADA) && (
                              <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'cobrar')}>
                                <CreditCard className="mr-2 h-4 w-4 text-green-600" />
                                Registrar cobro
                              </DropdownMenuItem>
                            )}

                            {factura.codigoQR && (
                              <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'qr')}>
                                <QrCode className="mr-2 h-4 w-4" />
                                Ver código QR
                              </DropdownMenuItem>
                            )}

                            {factura.estado !== EstadoFactura.ANULADA && factura.estado !== EstadoFactura.BORRADOR && (
                              <DropdownMenuItem onClick={() => handleFacturaAction(factura._id, 'anular')}>
                                <Ban className="mr-2 h-4 w-4 text-red-600" />
                                Anular factura
                              </DropdownMenuItem>
                            )}

                            {factura.estado === EstadoFactura.BORRADOR && (
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
                {' '}(Página <span className="font-medium">{pagination.page}</span> de{' '}
                <span className="font-medium">{pagination.pages}</span>)
              </div>

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
                ¿Estás seguro de que deseas eliminar {deleteDialog.facturaIds.length === 1
                  ? 'la siguiente factura'
                  : `las siguientes ${deleteDialog.facturaIds.length} facturas`}?
                <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                  {deleteDialog.facturaCodigos.map((codigo, index) => (
                    <li key={index} className="text-sm font-medium">• {codigo}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-orange-600">
                  Solo se pueden eliminar facturas en estado borrador.
                </p>
              </DialogDescription>
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

        {/* DIALOG PARA EMITIR FACTURA */}
        <Dialog open={emitirDialog.open} onOpenChange={(open) =>
          setEmitirDialog({ ...emitirDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Emitir Factura
              </DialogTitle>
              <DialogDescription>
                ¿Desea emitir la factura <strong>{emitirDialog.facturaCodigo}</strong>?
                <p className="mt-3 text-sm text-orange-600">
                  Una vez emitida, la factura será inmutable y se registrará en el sistema fiscal (VeriFactu/TicketBAI).
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEmitirDialog({ open: false, facturaId: '', facturaCodigo: '' })}
              >
                Cancelar
              </Button>
              <Button onClick={handleEmitirConfirm}>
                <Send className="mr-2 h-4 w-4" />
                Emitir Factura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG PARA REGISTRAR COBRO */}
        <Dialog open={cobroDialog.open} onOpenChange={(open) =>
          setCobroDialog({ ...cobroDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Registrar Cobro
              </DialogTitle>
              <DialogDescription>
                Registrar cobro para la factura <strong>{cobroDialog.facturaCodigo}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="importeCobro">Importe</Label>
                <Input
                  id="importeCobro"
                  type="number"
                  step="0.01"
                  value={cobroDialog.importe}
                  onChange={(e) => setCobroDialog(prev => ({ ...prev, importe: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metodoPago">Método de pago</Label>
                <Select
                  value={cobroDialog.metodoPago}
                  onValueChange={(value) => setCobroDialog(prev => ({ ...prev, metodoPago: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map(mp => (
                      <SelectItem key={mp.value} value={mp.value}>{mp.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenciaCobro">Referencia (opcional)</Label>
                <Input
                  id="referenciaCobro"
                  value={cobroDialog.referencia}
                  onChange={(e) => setCobroDialog(prev => ({ ...prev, referencia: e.target.value }))}
                  placeholder="Nº transferencia, cheque..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCobroDialog({
                  open: false,
                  facturaId: '',
                  facturaCodigo: '',
                  importe: 0,
                  metodoPago: 'transferencia',
                  referencia: '',
                })}
              >
                Cancelar
              </Button>
              <Button onClick={handleCobroConfirm}>
                <CreditCard className="mr-2 h-4 w-4" />
                Registrar Cobro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG PARA ANULAR FACTURA */}
        <Dialog open={anularDialog.open} onOpenChange={(open) =>
          setAnularDialog({ ...anularDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Ban className="h-5 w-5" />
                Anular Factura
              </DialogTitle>
              <DialogDescription>
                ¿Desea anular la factura <strong>{anularDialog.facturaCodigo}</strong>?
                <p className="mt-3 text-sm text-orange-600">
                  Esta acción creará un registro fiscal de anulación y la factura no podrá revertirse.
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="motivoAnulacion">Motivo de anulación *</Label>
                <Input
                  id="motivoAnulacion"
                  value={anularDialog.motivo}
                  onChange={(e) => setAnularDialog(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Indique el motivo de la anulación"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAnularDialog({ open: false, facturaId: '', facturaCodigo: '', motivo: '' })}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleAnularConfirm}>
                <Ban className="mr-2 h-4 w-4" />
                Anular Factura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG PARA VER QR */}
        <Dialog open={qrDialog.open} onOpenChange={(open) =>
          setQrDialog({ ...qrDialog, open })
        }>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código QR de Verificación
              </DialogTitle>
              <DialogDescription>
                Código QR para verificación fiscal
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6">
              {qrDialog.isLoading ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : qrDialog.qrData ? (
                <>
                  <img
                    src={qrDialog.qrData}
                    alt="Código QR de verificación"
                    className="w-48 h-48 mb-4"
                  />
                  {qrDialog.urlVerificacion && (
                    <a
                      href={qrDialog.urlVerificacion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Verificar en Hacienda
                    </a>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No hay código QR disponible</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setQrDialog({ open: false, qrData: null, urlVerificacion: null, isLoading: false })}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
