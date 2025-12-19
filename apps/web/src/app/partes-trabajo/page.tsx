'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { partesTrabajoService } from '@/services/partes-trabajo.service'
import { api } from '@/services/api'
import {
  ParteTrabajo,
  ESTADOS_PARTE_TRABAJO,
  TIPOS_PARTE_TRABAJO,
  PRIORIDADES,
  getEstadoParteColor,
  getEstadoParteLabel,
  getPrioridadColor,
  getPrioridadLabel,
  getTipoParteLabel,
  EstadoParteTrabajo,
  TipoParteTrabajo,
  Prioridad,
} from '@/types/parte-trabajo.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Wrench,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Calendar,
  Building2,
  AlertTriangle,
  Users,
  Package,
  Truck,
  Receipt,
  Play,
  Pause,
  Ban,
  Mail,
  MessageCircle,
  FileSpreadsheet,
  Columns,
  BarChart3,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { PrintButton } from '@/components/ui/PrintButton'
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
// CONFIGURACION POR DEFECTO
// ============================================

const DEFAULT_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'clienteNombre', visible: true, orden: 1 },
    { key: 'titulo', visible: true, orden: 2 },
    { key: 'tipo', visible: true, orden: 3 },
    { key: 'prioridad', visible: true, orden: 4 },
    { key: 'estado', visible: true, orden: 5 },
    { key: 'fecha', visible: true, orden: 6 },
    { key: 'responsable', visible: true, orden: 7 },
    { key: 'proyecto', visible: false, orden: 8 },
    { key: 'totalVenta', visible: true, orden: 9 },
    { key: 'totalHoras', visible: false, orden: 10 },
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
// COLUMNAS DISPONIBLES
// ============================================

const COLUMNAS_DISPONIBLES = [
  { key: 'codigo', label: 'Codigo' },
  { key: 'clienteNombre', label: 'Cliente' },
  { key: 'titulo', label: 'Titulo' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'responsable', label: 'Responsable' },
  { key: 'proyecto', label: 'Proyecto' },
  { key: 'totalVenta', label: 'Total Venta' },
  { key: 'totalHoras', label: 'Horas' },
]

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function PartesTrabajoPage() {
  const router = useRouter()
  const { canCreate, canDelete } = usePermissions()

  // Estados de datos
  const [partes, setPartes] = useState<ParteTrabajo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [showStats, setShowStats] = useState(true)

  // Seleccion multiple
  const [selectedPartes, setSelectedPartes] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<Record<string, string>>({})
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)

  // Filtros generales
  const [filters, setFilters] = useState<any>({
    page: 1,
    limit: 25,
    sortBy: 'fecha',
    sortOrder: 'desc',
    activo: 'true',
  })

  // Paginacion
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Dialogos
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [parteToDelete, setParteToDelete] = useState<string | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Configuracion del modulo
  const {
    config,
    updateColumnas,
    updateDensidad,
    resetConfig,
    isLoading: isLoadingConfig,
  } = useModuleConfig('partes-trabajo', DEFAULT_CONFIG, {
    autoSave: true,
    debounceMs: 1000,
  })

  // Densidad
  const densidad = useMemo(() => config?.densidad || 'normal', [config?.densidad])
  const densityClasses = useDensityClasses(densidad)

  // Columnas visibles
  const columnasVisibles = useMemo(() => {
    if (!config) return []
    return config.columnas
      .filter((col) => col.visible)
      .sort((a, b) => a.orden - b.orden)
      .map((col) => col.key)
  }, [config])

  // ============================================
  // CARGAR DATOS
  // ============================================

  const cargarPartes = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        activo: filters.activo,
      }

      if (searchTerm) params.search = searchTerm

      // Agregar filtros de columna
      Object.entries(debouncedColumnFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params[key] = value
        }
      })

      const response = await partesTrabajoService.getAll(params)

      if (response.success) {
        setPartes(response.data)
        setTotalPages(response.totalPages)
        setTotalItems(response.total)
      }
    } catch (error) {
      console.error('Error cargando partes:', error)
      toast.error('Error al cargar los partes de trabajo')
    } finally {
      setIsLoading(false)
    }
  }, [filters, searchTerm, debouncedColumnFilters])

  const cargarEstadisticas = useCallback(async () => {
    try {
      const response = await partesTrabajoService.getEstadisticas()
      if (response.success) {
        setEstadisticas(response.data)
      }
    } catch (error) {
      console.error('Error cargando estadisticas:', error)
    }
  }, [])

  useEffect(() => {
    cargarPartes()
  }, [cargarPartes])

  useEffect(() => {
    cargarEstadisticas()
  }, [cargarEstadisticas])

  // ============================================
  // HANDLERS
  // ============================================

  const handleSort = (key: string) => {
    setFilters((prev: any) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev: any) => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev: any) => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFiltersInput((prev) => ({
      ...prev,
      [column]: value,
    }))
    setFilters((prev: any) => ({ ...prev, page: 1 }))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedPartes(partes.map((p) => p._id))
    } else {
      setSelectedPartes([])
    }
  }

  const handleSelectParte = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPartes((prev) => [...prev, id])
    } else {
      setSelectedPartes((prev) => prev.filter((i) => i !== id))
      setSelectAll(false)
    }
  }

  const handleDelete = async () => {
    if (!parteToDelete) return

    try {
      const response = await partesTrabajoService.delete(parteToDelete)
      if (response.success) {
        toast.success('Parte de trabajo eliminado')
        cargarPartes()
        cargarEstadisticas()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setDeleteDialogOpen(false)
      setParteToDelete(null)
    }
  }

  const handleBulkDelete = async () => {
    try {
      const response = await partesTrabajoService.deleteMany(selectedPartes)
      if (response.success) {
        toast.success(`${response.count} partes de trabajo eliminados`)
        setSelectedPartes([])
        setSelectAll(false)
        cargarPartes()
        cargarEstadisticas()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  const handleDuplicar = async (id: string) => {
    try {
      const response = await partesTrabajoService.duplicar(id)
      if (response.success && response.data) {
        toast.success('Parte de trabajo duplicado')
        router.push(`/partes-trabajo/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al duplicar')
    }
  }

  const handleCambiarEstado = async (id: string, estado: EstadoParteTrabajo) => {
    try {
      const response = await partesTrabajoService.cambiarEstado(id, { estado })
      if (response.success) {
        toast.success(`Estado cambiado a ${getEstadoParteLabel(estado)}`)
        cargarPartes()
        cargarEstadisticas()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado')
    }
  }

  // ============================================
  // ACCIONES MASIVAS
  // ============================================

  const handleExportSelected = async () => {
    if (selectedPartes.length === 0) {
      toast.error('No hay partes seleccionados')
      return
    }

    try {
      const selectedData = partes.filter((p) => selectedPartes.includes(p._id))

      const exportData = selectedData.map((p) => ({
        codigo: p.codigo,
        clienteNombre: p.clienteNombre || '-',
        titulo: p.titulo || '-',
        tipo: getTipoParteLabel(p.tipo),
        prioridad: getPrioridadLabel(p.prioridad),
        estado: getEstadoParteLabel(p.estado),
        fecha: new Date(p.fecha).toLocaleDateString('es-ES'),
        responsable: p.responsableNombre || '-',
        proyecto: p.proyectoCodigo || '-',
        totalVenta: (p.totales?.totalVenta || 0).toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }),
        totalHoras: `${p.totalHorasTrabajadas || 0}h`,
      }))

      const columns = COLUMNAS_DISPONIBLES
        .filter((col) => columnasVisibles.includes(col.key))
        .map((col) => ({
          key: col.key,
          label: col.label,
          width: 20,
        }))

      const response = await api.post(
        '/export/excel',
        {
          filename: `partes_trabajo_seleccionados_${new Date().toISOString().split('T')[0]}`,
          title: 'Partes de Trabajo Seleccionados',
          subtitle: `Exportados el ${new Date().toLocaleDateString('es-ES')} - ${selectedData.length} registros`,
          columns,
          data: exportData,
          stats: [{ label: 'Total Seleccionados', value: selectedData.length }],
          includeStats: true,
        },
        { responseType: 'blob' }
      )

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `partes_trabajo_seleccionados_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success(`${selectedData.length} parte(s) exportado(s) correctamente`)
    } catch (error: any) {
      console.error('Error al exportar:', error)
      toast.error(error.response?.data?.message || 'Error al exportar partes')
    }
  }

  const handleBulkEmail = async () => {
    if (selectedPartes.length === 0) {
      toast.warning('Selecciona al menos un parte de trabajo')
      return
    }

    try {
      toast.loading('Enviando partes por email...')
      // Aqui se implementaria la llamada al servicio de email
      // const response = await partesTrabajoService.enviarVariosPorEmail(selectedPartes)
      toast.dismiss()
      toast.info('Funcion de email masivo en desarrollo')
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al enviar por email')
    }
  }

  const handleBulkWhatsApp = async () => {
    if (selectedPartes.length === 0) {
      toast.warning('Selecciona al menos un parte de trabajo')
      return
    }

    try {
      toast.loading('Generando enlaces de WhatsApp...')
      // Aqui se implementaria la llamada al servicio de WhatsApp
      toast.dismiss()
      toast.info('Funcion de WhatsApp masivo en desarrollo')
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al generar enlaces de WhatsApp')
    }
  }

  const handleBulkPrint = () => {
    if (selectedPartes.length === 0) {
      toast.warning('Selecciona al menos un parte de trabajo')
      return
    }

    // Abrir cada parte seleccionado en una nueva pestaña para imprimir
    selectedPartes.forEach((id, index) => {
      setTimeout(() => {
        window.open(`/partes-trabajo/${id}/imprimir`, '_blank')
      }, index * 500)
    })

    toast.success(`Abriendo ${selectedPartes.length} parte(s) para imprimir`)
  }

  // ============================================
  // TOGGLE COLUMNA
  // ============================================

  const toggleColumna = (key: string) => {
    if (!config) return

    const newColumnas = config.columnas.map((col) => {
      if (col.key === key) {
        const visibleCount = config.columnas.filter((c) => c.visible).length
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
  // COLUMNAS
  // ============================================

  const columnsConfig = useMemo(
    () => [
      {
        key: 'codigo',
        label: 'Codigo',
        sortable: true,
        filterable: true,
        width: 'w-32',
        render: (parte: ParteTrabajo) => (
          <Link
            href={`/partes-trabajo/${parte._id}`}
            className="font-medium text-primary hover:underline"
          >
            {parte.codigo}
          </Link>
        ),
      },
      {
        key: 'clienteNombre',
        label: 'Cliente',
        sortable: true,
        filterable: true,
        width: 'w-48',
        render: (parte: ParteTrabajo) => <div className="truncate">{parte.clienteNombre}</div>,
      },
      {
        key: 'titulo',
        label: 'Titulo',
        sortable: true,
        filterable: true,
        width: 'w-56',
        render: (parte: ParteTrabajo) => <div className="truncate">{parte.titulo || '-'}</div>,
      },
      {
        key: 'tipo',
        label: 'Tipo',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: TIPOS_PARTE_TRABAJO,
        width: 'w-32',
        render: (parte: ParteTrabajo) => (
          <Badge variant="outline">{getTipoParteLabel(parte.tipo)}</Badge>
        ),
      },
      {
        key: 'prioridad',
        label: 'Prioridad',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: PRIORIDADES,
        width: 'w-28',
        render: (parte: ParteTrabajo) => {
          const color = getPrioridadColor(parte.prioridad)
          return (
            <Badge
              variant="outline"
              className={
                color === 'red'
                  ? 'border-red-500 text-red-500'
                  : color === 'orange'
                    ? 'border-orange-500 text-orange-500'
                    : color === 'blue'
                      ? 'border-blue-500 text-blue-500'
                      : 'border-gray-500 text-gray-500'
              }
            >
              {getPrioridadLabel(parte.prioridad)}
            </Badge>
          )
        },
      },
      {
        key: 'estado',
        label: 'Estado',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: ESTADOS_PARTE_TRABAJO,
        width: 'w-32',
        render: (parte: ParteTrabajo) => {
          const color = getEstadoParteColor(parte.estado)
          return (
            <Badge
              variant="outline"
              className={
                color === 'green'
                  ? 'border-green-500 text-green-500 bg-green-50'
                  : color === 'yellow'
                    ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                    : color === 'blue'
                      ? 'border-blue-500 text-blue-500 bg-blue-50'
                      : color === 'orange'
                        ? 'border-orange-500 text-orange-500 bg-orange-50'
                        : color === 'purple'
                          ? 'border-purple-500 text-purple-500 bg-purple-50'
                          : color === 'red'
                            ? 'border-red-500 text-red-500 bg-red-50'
                            : 'border-gray-500 text-gray-500 bg-gray-50'
              }
            >
              {getEstadoParteLabel(parte.estado)}
            </Badge>
          )
        },
      },
      {
        key: 'fecha',
        label: 'Fecha',
        sortable: true,
        filterable: false,
        width: 'w-28',
        render: (parte: ParteTrabajo) => (
          <div className="text-sm">{new Date(parte.fecha).toLocaleDateString('es-ES')}</div>
        ),
      },
      {
        key: 'responsable',
        label: 'Responsable',
        sortable: false,
        filterable: false,
        width: 'w-36',
        render: (parte: ParteTrabajo) => (
          <div className="truncate text-sm">{parte.responsableNombre || '-'}</div>
        ),
      },
      {
        key: 'proyecto',
        label: 'Proyecto',
        sortable: false,
        filterable: false,
        width: 'w-32',
        render: (parte: ParteTrabajo) => (
          <div className="truncate text-sm">{parte.proyectoCodigo || '-'}</div>
        ),
      },
      {
        key: 'totalVenta',
        label: 'Total Venta',
        sortable: true,
        filterable: false,
        width: 'w-28',
        render: (parte: ParteTrabajo) => (
          <div className="text-right font-medium">
            {parte.totales?.totalVenta?.toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR',
            }) || '0,00 €'}
          </div>
        ),
      },
      {
        key: 'totalHoras',
        label: 'Horas',
        sortable: false,
        filterable: false,
        width: 'w-20',
        render: (parte: ParteTrabajo) => (
          <div className="text-center">{parte.totalHorasTrabajadas || 0}h</div>
        ),
      },
    ],
    []
  )

  // Columnas visibles renderizadas
  const displayColumns = useMemo(() => {
    return columnsConfig.filter((col) => columnasVisibles.includes(col.key))
  }, [columnsConfig, columnasVisibles])

  // ============================================
  // FORMATO CURRENCY
  // ============================================

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  // ============================================
  // RENDER
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="h-7 w-7 text-primary" />
              Partes de Trabajo
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestion de partes de trabajo y ordenes de servicio
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {showStats ? 'Ocultar Stats' : 'Mostrar Stats'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                cargarPartes()
                cargarEstadisticas()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            {canCreate && (
              <Button asChild>
                <Link href="/partes-trabajo/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Parte
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Estadisticas */}
        {showStats && estadisticas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{estadisticas.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">En Curso</p>
                    <p className="text-xl font-bold">{estadisticas.enCurso || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pend. Facturar</p>
                    <p className="text-xl font-bold">{estadisticas.pendientesFacturar || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Urgentes</p>
                    <p className="text-xl font-bold">{estadisticas.urgentes || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Horas</p>
                    <p className="text-xl font-bold">{(estadisticas.totalHoras || 0).toFixed(1)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Venta</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(estadisticas.totalVenta || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barra de acciones masivas - visible cuando hay seleccion */}
        {selectedPartes.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedPartes.length} parte{selectedPartes.length !== 1 ? 's' : ''}{' '}
                    seleccionado{selectedPartes.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPartes([])
                      setSelectAll(false)
                    }}
                  >
                    Deseleccionar todos
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleBulkPrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportSelected}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleBulkWhatsApp}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkDeleteDialogOpen(true)}
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

        {/* Barra de herramientas */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar partes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Settings Menu */}
            <SettingsMenu
              densidad={densidad}
              onDensidadChange={(newDensity) => {
                updateDensidad(newDensity)
                toast.success(`Densidad cambiada a ${newDensity}`)
              }}
              modulo="partes-trabajo"
              configuracionActual={config}
              onRestablecer={async () => {
                await resetConfig()
                toast.success('Configuracion restablecida')
              }}
            />

            {/* Selector de columnas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="h-4 w-4 sm:mr-2" />
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

            {/* Exportar */}
            <ExportButton
              data={partes}
              columns={COLUMNAS_DISPONIBLES.filter((col) => columnasVisibles.includes(col.key)).map(
                (col) => ({
                  key: col.key,
                  label: col.label,
                })
              )}
              filename="partes_trabajo"
              stats={[
                { label: 'Total', value: estadisticas?.total || 0 },
                { label: 'En Curso', value: estadisticas?.enCurso || 0 },
                { label: 'Urgentes', value: estadisticas?.urgentes || 0 },
                { label: 'Total Venta', value: formatCurrency(estadisticas?.totalVenta || 0) },
              ]}
            />

            {/* Imprimir */}
            <PrintButton
              data={partes}
              columns={COLUMNAS_DISPONIBLES.filter((col) => columnasVisibles.includes(col.key)).map(
                (col) => ({
                  key: col.key,
                  label: col.label,
                })
              )}
              title="Listado de Partes de Trabajo"
              stats={[
                { label: 'Total', value: estadisticas?.total || 0 },
                { label: 'En Curso', value: estadisticas?.enCurso || 0 },
                { label: 'Urgentes', value: estadisticas?.urgentes || 0 },
              ]}
              filters={columnFiltersInput}
            />

            {/* Importar */}
            <Button variant="outline" size="sm" onClick={() => toast.info('Importacion en desarrollo')}>
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Importar</span>
            </Button>

            {/* Filtro activo/inactivo */}
            <Select
              value={filters.activo}
              onValueChange={(value) =>
                setFilters((prev: any) => ({ ...prev, activo: value, page: 1 }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className={`${densityClasses.header} sticky left-0 z-30 bg-muted/50 w-10`}>
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                  </th>
                  {displayColumns.map((column) => (
                    <th
                      key={column.key}
                      className={`${densityClasses.header} text-left text-xs font-semibold uppercase tracking-wider`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {column.sortable ? (
                            <button
                              onClick={() => handleSort(column.key)}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              {column.label}
                              {filters.sortBy === column.key ? (
                                filters.sortOrder === 'asc' ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </button>
                          ) : (
                            column.label
                          )}
                        </div>
                        {column.filterable &&
                          (column.filterType === 'select' && column.filterOptions ? (
                            <Select
                              value={columnFiltersInput[column.key] || 'all'}
                              onValueChange={(value) =>
                                handleColumnFilterChange(column.key, value)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {column.filterOptions.map((option: any) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="Filtrar..."
                              value={columnFiltersInput[column.key] || ''}
                              onChange={(e) =>
                                handleColumnFilterChange(column.key, e.target.value)
                              }
                              className="h-7 text-xs"
                            />
                          ))}
                      </div>
                    </th>
                  ))}
                  <th
                    className={`${densityClasses.header} sticky right-0 z-30 bg-muted/50 w-16 text-right text-xs font-semibold uppercase tracking-wider`}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={displayColumns.length + 2} className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
                    </td>
                  </tr>
                ) : partes.length === 0 ? (
                  <tr>
                    <td colSpan={displayColumns.length + 2} className="p-8 text-center">
                      <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">
                        No se encontraron partes de trabajo
                      </p>
                      {canCreate && (
                        <Button asChild className="mt-4" variant="outline">
                          <Link href="/partes-trabajo/nuevo">
                            <Plus className="h-4 w-4 mr-2" />
                            Crear primer parte
                          </Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  partes.map((parte) => (
                    <tr
                      key={parte._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td
                        className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30`}
                      >
                        <Checkbox
                          checked={selectedPartes.includes(parte._id)}
                          onCheckedChange={(checked) =>
                            handleSelectParte(parte._id, checked as boolean)
                          }
                        />
                      </td>
                      {displayColumns.map((column) => (
                        <td key={column.key} className={densityClasses.cell}>
                          {column.render(parte)}
                        </td>
                      ))}
                      <td
                        className={`${densityClasses.cell} sticky right-0 z-20 bg-background group-hover:bg-muted/30 text-right`}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/partes-trabajo/${parte._id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/partes-trabajo/${parte._id}/editar`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/partes-trabajo/${parte._id}/imprimir`}>
                                <Printer className="h-4 w-4 mr-2" />
                                Imprimir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicar(parte._id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs">Cambiar estado</DropdownMenuLabel>
                            {parte.estado === 'borrador' && (
                              <DropdownMenuItem
                                onClick={() => handleCambiarEstado(parte._id, 'en_curso')}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Iniciar
                              </DropdownMenuItem>
                            )}
                            {parte.estado === 'en_curso' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleCambiarEstado(parte._id, 'pausado')}
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pausar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCambiarEstado(parte._id, 'completado')}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completar
                                </DropdownMenuItem>
                              </>
                            )}
                            {parte.estado === 'pausado' && (
                              <DropdownMenuItem
                                onClick={() => handleCambiarEstado(parte._id, 'en_curso')}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Reanudar
                              </DropdownMenuItem>
                            )}
                            {['borrador', 'planificado', 'en_curso', 'pausado'].includes(
                              parte.estado
                            ) && (
                              <DropdownMenuItem
                                onClick={() => handleCambiarEstado(parte._id, 'anulado')}
                                className="text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Anular
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setParteToDelete(parte._id)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
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

        {/* Paginacion */}
        {!isLoading && partes.length > 0 && (
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Mostrar</span>
                <Select
                  value={String(filters.limit)}
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
                  de <span className="font-medium">{totalItems}</span> registros
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>{' '}
                a <span className="font-medium">{Math.min(filters.page * filters.limit, totalItems)}</span>{' '}
                (Pagina <span className="font-medium">{filters.page}</span> de{' '}
                <span className="font-medium">{totalPages}</span>)
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={filters.page === 1}
                  className="h-9 w-9 p-0"
                  title="Primera pagina"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="h-9 w-9 p-0"
                  title="Pagina anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm">
                  {filters.page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="h-9 w-9 p-0"
                  title="Pagina siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={filters.page >= totalPages}
                  className="h-9 w-9 p-0"
                  title="Ultima pagina"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog de eliminacion individual */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Parte de Trabajo</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que quieres eliminar este parte de trabajo? Esta accion no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de eliminacion masiva */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Partes de Trabajo</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que quieres eliminar {selectedPartes.length} partes de trabajo? Esta
              accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Eliminar {selectedPartes.length} partes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
