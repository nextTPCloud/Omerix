'use client'

import { useState, useEffect, useCallback, useMemo, useRef  } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { clientesService } from '@/services/clientes.service'
import vistasService from '@/services/vistas-guardadas.service'
import {
  Cliente,
  ClientesFilters,
} from '@/types/cliente.types'
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
  Users,
  UserCheck,
  UserX,
  Building2,
  AlertCircle,
  Columns,
  Package,
  Truck,
  Receipt,
  Wrench,
  FileText,
  Calendar,
  Store,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportClientesToCSV, processImportFile } from '@/utils/excel.utils'
import { useModuleConfig } from '@/hooks/useModuleConfig'
import { ColumnaConfig } from '@/services/configuracion.service'

// 🆕 NUEVOS IMPORTS
import { useDensityClasses } from '@/components/ui/DensitySelector'
import { usePermissions } from '@/hooks/usePermissions'
import { SettingsMenu } from '@/components/ui/SettingsMenu'
import { ExportButton } from '@/components/ui/ExportButton'
import { TableSelect } from '@/components/ui/tableSelect'
import { PrintButton } from '@/components/ui/PrintButton'

// 🆕 FILTROS AVANZADOS
import { AdvancedFilters, ActiveFilter, filtersToQueryParams, filtersToSaved, savedToFilters } from '@/components/ui/advanced-filters'
import { CLIENTES_FILTERABLE_FIELDS } from '@/components/presupuestos/presupuestos-filters.config'

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
// CONFIGURACIÓN POR DEFECTO DEL MÓDULO CLIENTES
// ============================================

const DEFAULT_CLIENTES_CONFIG = {
  columnas: [
    { key: 'codigo', visible: true, orden: 0 },
    { key: 'nombre', visible: true, orden: 1 },
    { key: 'nombreComercial', visible: true, orden: 2 },
    { key: 'nif', visible: true, orden: 3 },
    { key: 'email', visible: true, orden: 4 },
    { key: 'telefono', visible: true, orden: 5 },
    { key: 'tipoCliente', visible: true, orden: 6 },
    { key: 'direccion', visible: false, orden: 7 },
    { key: 'formaPago', visible: false, orden: 8 },
    { key: 'riesgoActual', visible: true, orden: 9 },
    { key: 'limiteCredito', visible: false, orden: 10 },
    { key: 'activo', visible: true, orden: 11 },
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

export default function ClientesPage() {
  const router = useRouter()
  const isInitialLoad = useRef(true)
  const { canCreate, canDelete } = usePermissions()

  // Estados de datos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selección múltiple
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Filtros por columna (legacy)
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})

  // 🆕 Filtros avanzados
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([])

  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 300)
  
  // Filtros generales
  const [filters, setFilters] = useState<ClientesFilters>({
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
    clienteIds: string[]
    clienteNombres: string[]
  }>({
    open: false,
    clienteIds: [],
    clienteNombres: [],
  })
  
  // Columnas disponibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'nombreComercial', label: 'Nombre Comercial', sortable: true },
    { key: 'nif', label: 'NIF/CIF', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: true },
    { key: 'tipoCliente', label: 'Tipo', sortable: true },
    { key: 'direccion', label: 'Dirección', sortable: false },
    { key: 'formaPago', label: 'Forma Pago', sortable: true },
    { key: 'riesgoActual', label: 'Riesgo', sortable: true },
    { key: 'limiteCredito', label: 'Límite', sortable: true },
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
} = useModuleConfig('clientes', DEFAULT_CLIENTES_CONFIG, {
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
    return moduleConfig?.sortConfig || DEFAULT_CLIENTES_CONFIG.sortConfig
  }, [moduleConfig])

  const currentSortKey = useMemo(() => sortConfig.key, [sortConfig.key])
  const currentSortDirection = useMemo(() => sortConfig.direction, [sortConfig.direction])
  const currentLimit = useMemo(() => moduleConfig?.paginacion?.limit || 25, [moduleConfig?.paginacion?.limit])

  // 🆕 DENSIDAD Y CLASES
  const densidad = useMemo(() => {
    return moduleConfig?.densidad || 'normal'
  }, [moduleConfig])

  const densityClasses = useDensityClasses(densidad)

  // ============================================
  // ESTADÍSTICAS CALCULADAS
  // ============================================

  const stats = useMemo(() => {
    if (!clientes || !Array.isArray(clientes)) {
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        empresas: 0,
        particulares: 0,
        conRiesgo: 0,
      }
    }

    const total = pagination?.total || 0
    const activos = clientes.filter((c) => c?.activo).length
    const inactivos = clientes.filter((c) => !c?.activo).length
    const empresas = clientes.filter((c) => c?.tipoCliente === 'empresa').length
    const particulares = clientes.filter((c) => c?.tipoCliente === 'particular').length
    const conRiesgo = clientes.filter((c) => (c?.riesgoActual || 0) > 0).length

    return {
      total,
      activos,
      inactivos,
      empresas,
      particulares,
      conRiesgo,
    }
  }, [clientes, pagination?.total])

  // ============================================
  // CARGAR CLIENTES
  // ============================================

  const cargarClientes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getAll(filters)
      
      if (response.success) {
        setClientes(response.data || [])
        const pag = response.pagination as any
        if (pag) {
          setPagination({ page: pag.page, limit: pag.limit, total: pag.total, pages: pag.totalPages || pag.pages || 0 })
        }
      } else {
        setClientes([])
        toast.error('Error al cargar los clientes')
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      setClientes([])
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        pages: 0,
      })
      toast.error('Error al cargar los clientes')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    cargarClientes()
  }, [cargarClientes])

  // ============================================
  // APLICAR FILTROS DEBOUNCED (SIN GUARDAR)
  // ============================================

  useEffect(() => {
    console.log('📊 Filtros debounced cambiaron:', debouncedColumnFilters)

    // Construir filtros combinados
    const combinedFilters: any = {
      page: 1,
      sortBy: currentSortKey,
      sortOrder: currentSortDirection,
      limit: currentLimit,
    }

    // Campos de búsqueda por texto
    const searchableFields = ['codigo', 'nombre', 'nombreComercial', 'nif', 'email', 'telefono', 'direccion', 'riesgoActual', 'limiteCredito']
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
      if (key === 'tipoCliente') {
        if (value !== 'all') {
          combinedFilters.tipoCliente = value
        }
      } else if (key === 'formaPago') {
        if (value !== 'all') {
          combinedFilters.formaPago = value
        }
      } else if (key === 'activo') {
        if (value !== 'all') {
          combinedFilters.activo = value === 'true'
        }
      }
    })

    // 🆕 APLICAR FILTROS AVANZADOS
    if (debouncedAdvancedFilters.length > 0) {
      Object.assign(combinedFilters, filtersToQueryParams(debouncedAdvancedFilters))
    }

    console.log('🔄 Aplicando filtros:', combinedFilters)
    setFilters(combinedFilters)

  }, [debouncedColumnFilters, debouncedAdvancedFilters, currentSortKey, currentSortDirection, currentLimit])

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

    // 🆕 Cargar filtros avanzados guardados
    if (moduleConfig?.advancedFilters && moduleConfig.advancedFilters.length > 0) {
      setAdvancedFilters(savedToFilters(moduleConfig.advancedFilters, CLIENTES_FILTERABLE_FIELDS))
    }

    isInitialLoad.current = false

  }, [moduleConfig, isLoadingConfig])

  // 🆕 GUARDAR FILTROS AVANZADOS CUANDO CAMBIAN
  useEffect(() => {
    if (isInitialLoad.current || isLoadingConfig) return
    updateAdvancedFilters(filtersToSaved(advancedFilters))
  }, [advancedFilters, isLoadingConfig, updateAdvancedFilters])

  // ============================================
  // 🆕 HANDLERS PARA VISTAS GUARDADAS
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

    // 🆕 Aplicar filtros avanzados de la vista
    if (configuracion.advancedFilters?.length > 0) {
      setAdvancedFilters(savedToFilters(configuracion.advancedFilters, CLIENTES_FILTERABLE_FIELDS))
    } else {
      setAdvancedFilters([])
    }

    if (configuracion.densidad) {
      updateDensidad(configuracion.densidad)
    }

    if (configuracion.paginacion?.limit) {
      // Actualizar límite de paginación si es necesario
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
      // Combinar moduleConfig con los filtros avanzados actuales (evita problemas de debounce)
      const configToSave = {
        ...moduleConfig,
        advancedFilters: filtersToSaved(advancedFilters),
        columnFilters: columnFiltersInput,
      }

      console.log('💾 Guardando vista:', { nombre, descripcion, esDefault, vistaIdActualizar, config: configToSave })

      if (vistaIdActualizar) {
        // Actualizar vista existente
        await vistasService.update(vistaIdActualizar, {
          modulo: 'clientes',
          nombre,
          descripcion,
          configuracion: configToSave,
          esDefault: esDefault || false,
        })
        toast.success(`Vista "${nombre}" actualizada correctamente`)
      } else {
        // Crear nueva vista
        await vistasService.create({
          modulo: 'clientes',
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
        const vistas = await vistasService.getAll('clientes', true)
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
      setSelectedClientes([])
    } else {
      setSelectedClientes(clientes.map(c => c._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectCliente = (clienteId: string) => {
    if (selectedClientes.includes(clienteId)) {
      setSelectedClientes(selectedClientes.filter(id => id !== clienteId))
    } else {
      setSelectedClientes([...selectedClientes, clienteId])
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
        if (selectedClientes.length > 0) {
          const nombresSeleccionados = clientes
            .filter(c => selectedClientes.includes(c._id))
            .map(c => c.nombre)
          
          setDeleteDialog({
            open: true,
            clienteIds: selectedClientes,
            clienteNombres: nombresSeleccionados,
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
    const selectedData = clientes.filter(c => selectedClientes.includes(c._id))
    exportClientesToCSV(selectedData, 'clientes_seleccionados.csv')
    toast.success('Clientes exportados correctamente')
  }

  const handleToggleStatus = async (activate: boolean) => {
    try {
      await Promise.all(
        selectedClientes.map(id =>
          clientesService.update(id, { activo: activate })
        )
      )
      toast.success(`Clientes ${activate ? 'activados' : 'desactivados'} correctamente`)
      cargarClientes()
      setSelectedClientes([])
      setSelectAll(false)
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  // ============================================
  // ELIMINAR CLIENTES
  // ============================================

  const handleDeleteConfirm = async () => {
    try {
      if (deleteDialog.clienteIds.length === 1) {
        await clientesService.delete(deleteDialog.clienteIds[0])
      } else {
        await clientesService.deleteMany(deleteDialog.clienteIds)
      }
      
      toast.success('Cliente(s) eliminado(s) correctamente')
      cargarClientes()
      setSelectedClientes([])
      setSelectAll(false)
      setDeleteDialog({ open: false, clienteIds: [], clienteNombres: [] })
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // ============================================
  // ACCIONES POR CLIENTE
  // ============================================

  const handleClientAction = async (clienteId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/clientes/${clienteId}`)
        break
      case 'edit':
        router.push(`/clientes/${clienteId}/editar`)
        break
      case 'duplicate':
        try {
          toast.loading('Duplicando cliente...')
          const response = await clientesService.duplicar(clienteId)
          toast.dismiss()
          if (response.success) {
            toast.success('Cliente duplicado correctamente')
            router.push(`/clientes/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al duplicar el cliente')
        }
        break
      case 'delete':
        const cliente = clientes.find(c => c._id === clienteId)
        if (cliente) {
          setDeleteDialog({
            open: true,
            clienteIds: [clienteId],
            clienteNombres: [cliente.nombre],
          })
        }
        break
      case 'pedido':
        router.push(`/pedidos/nuevo?clienteId=${clienteId}`)
        break
      case 'albaran':
        router.push(`/albaranes/nuevo?clienteId=${clienteId}`)
        break
      case 'factura':
        router.push(`/facturas/nuevo?clienteId=${clienteId}`)
        break
      case 'presupuesto':
        router.push(`/presupuestos/nuevo?clienteId=${clienteId}`)
        break
      case 'parte':
        router.push(`/partes/nuevo?clienteId=${clienteId}`)
        break
      case 'consulta-pedidos':
        router.push(`/pedidos?clienteId=${clienteId}`)
        break
      case 'vencimientos':
        router.push(`/vencimientos?clienteId=${clienteId}`)
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
    setFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1, // Resetear a página 1
    }))
    toast.success(`Mostrando ${newLimit} registros por página`)
  }

  // ============================================
  // IMPORTAR CLIENTES
  // ============================================

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        try {
          if (file.name.endsWith('.csv')) {
            const clientesImportados = await processImportFile(file)
            toast.info(`${clientesImportados.length} clientes listos para importar`)
          } else {
            toast.error('Por favor selecciona un archivo CSV')
          }
        } catch (error) {
          console.error('Error al procesar archivo:', error)
          toast.error('Error al procesar el archivo')
        }
      }
    }
    input.click()
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
              <Users className="h-7 w-7 text-primary" />
              Clientes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona tu cartera de clientes
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Estadísticas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cargarClientes}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Actualizar</span>
            </Button>
            {canCreate('clientes') && (
              <Button asChild size="sm">
                <Link href="/clientes/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nuevo Cliente</span>
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
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                  <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
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
                  <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
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
                  <Store className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Particulares</p>
                  <p className="text-xl font-bold">{stats.particulares}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 border-l-4 border-l-orange-500">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Con Riesgo</p>
                  <p className="text-xl font-bold">{stats.conRiesgo}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 🆕 FILTROS AVANZADOS */}
        <AdvancedFilters
          fields={CLIENTES_FILTERABLE_FIELDS}
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          searchValue={searchTerm}
          onSearchChange={handleSearch}
          searchPlaceholder="Buscar por nombre, NIF, email..."
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
              modulo="clientes"
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
              data={clientes}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              filename="clientes"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Empresas', value: stats.empresas },
                { label: 'Particulares', value: stats.particulares },
                { label: 'Con Riesgo', value: stats.conRiesgo },
              ]}
            />

            {/* IMPRIMIR */}
            <PrintButton
              data={clientes}
              columns={columnasDisponibles
                .filter((col) => columnasVisibles.includes(col.key))
                .map((col) => ({
                  key: col.key,
                  label: col.label,
                }))}
              title="Listado de Clientes"
              stats={[
                { label: 'Total', value: stats.total },
                { label: 'Activos', value: stats.activos },
                { label: 'Inactivos', value: stats.inactivos },
                { label: 'Empresas', value: stats.empresas },
                { label: 'Particulares', value: stats.particulares },
                { label: 'Con Riesgo', value: stats.conRiesgo },
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
        {selectedClientes.length > 0 && (
          <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedClientes.length} {selectedClientes.length === 1 ? 'cliente seleccionado' : 'clientes seleccionados'}
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
              {canDelete('clientes') && (
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
                  
                  {columnasVisibles.includes('tipoCliente') && (
                    <th className={`${densityClasses.header} text-left min-w-[110px]`}>
                      <button
                        onClick={() => handleSort('tipoCliente')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Tipo
                        {getSortIcon('tipoCliente')}
                      </button>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('direccion') && (
                    <th className={`${densityClasses.header} text-left text-xs font-semibold uppercase tracking-wider min-w-[200px]`}>
                      Dirección
                    </th>
                  )}
                  
                  {columnasVisibles.includes('formaPago') && (
                    <th className={`${densityClasses.header} text-left min-w-[130px]`}>
                      <button
                        onClick={() => handleSort('formaPago')}
                        className="flex items-center hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Forma Pago
                        {getSortIcon('formaPago')}
                      </button>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('riesgoActual') && (
                    <th className={`${densityClasses.header} text-right min-w-[110px]`}>
                      <button
                        onClick={() => handleSort('riesgoActual')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Riesgo
                        {getSortIcon('riesgoActual')}
                      </button>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('limiteCredito') && (
                    <th className={`${densityClasses.header} text-right min-w-[110px]`}>
                      <button
                        onClick={() => handleSort('limiteCredito')}
                        className="flex items-center justify-end w-full hover:text-primary text-xs font-semibold uppercase tracking-wider transition-colors"
                      >
                        Límite
                        {getSortIcon('limiteCredito')}
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

                {/* ✅ FILTROS - CON position="popper" PARA ALINEACIÓN CORRECTA */}
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
                  
                  {columnasVisibles.includes('tipoCliente') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.tipoCliente || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('tipoCliente', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'empresa', label: 'Empresa' },
                          { value: 'particular', label: 'Particular' },
                        ]}
                      />
                    </th>
                  )}
                  
                  {columnasVisibles.includes('direccion') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.direccion || ''}
                        onChange={(e) => handleColumnFilterInput('direccion', e.target.value)}
                      />
                    </th>
                  )}
                  
                  {columnasVisibles.includes('formaPago') && (
                    <th className="px-3 py-1.5">
                      <TableSelect
                        value={columnFiltersInput.formaPago || 'all'}
                        onValueChange={(value) => handleColumnFilterInput('formaPago', value)}
                        placeholder="Todos"
                        options={[
                          { value: 'all', label: 'Todos' },
                          { value: 'contado', label: 'Contado' },
                          { value: 'transferencia', label: 'Transferencia' },
                          { value: 'domiciliacion', label: 'Domiciliación' },
                          { value: 'confirming', label: 'Confirming' },
                          { value: 'pagare', label: 'Pagaré' },
                        ]}
                      />
                    </th>
                  )}
                  
                  {columnasVisibles.includes('riesgoActual') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.riesgoActual || ''}
                        onChange={(e) => handleColumnFilterInput('riesgoActual', e.target.value)}
                      />
                    </th>
                  )}
                  
                  {columnasVisibles.includes('limiteCredito') && (
                    <th className="px-3 py-1.5">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs placeholder:text-muted-foreground"
                        value={columnFiltersInput.limiteCredito || ''}
                        onChange={(e) => handleColumnFilterInput('limiteCredito', e.target.value)}
                      />
                    </th>
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
                      Cargando clientes...
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={columnasVisibles.length + 2} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No se encontraron clientes</p>
                      <p className="text-xs mt-1">Prueba ajustando los filtros o crear un nuevo cliente</p>
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className={`${densityClasses.cell} sticky left-0 z-20 bg-background group-hover:bg-muted/30 transition-colors`}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedClientes.includes(cliente._id)}
                            onCheckedChange={() => handleSelectCliente(cliente._id)}
                          />
                        </div>
                      </td>
                      
                      {columnasVisibles.includes('codigo') && (
                        <td className={`${densityClasses.cell} font-mono ${densityClasses.text} font-medium`}>{cliente.codigo}</td>
                      )}
                      
                      {columnasVisibles.includes('nombre') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-medium`}>
                          <div className="max-w-[220px] truncate" title={cliente.nombre}>
                            {cliente.nombre}
                          </div>
                        </td>
                      )}

                      {columnasVisibles.includes('nombreComercial') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          <div className="max-w-[200px] truncate" title={cliente.nombreComercial || ''}>
                            {cliente.nombreComercial || '-'}
                          </div>
                        </td>
                      )}
                      
                      {columnasVisibles.includes('nif') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} font-mono`}>{cliente.nif}</td>
                      )}
                      
                      {columnasVisibles.includes('email') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {cliente.email && (
                            <a 
                              href={`mailto:${cliente.email}`} 
                              className="text-blue-600 dark:text-blue-400 hover:underline max-w-[240px] truncate block"
                              title={cliente.email}
                            >
                              {cliente.email}
                            </a>
                          )}
                        </td>
                      )}
                      
                      {columnasVisibles.includes('telefono') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} whitespace-nowrap`}>
                          {cliente.telefono && (
                            <a href={`tel:${cliente.telefono}`} className="hover:text-primary">
                              {cliente.telefono}
                            </a>
                          )}
                        </td>
                      )}
                      
                      {columnasVisibles.includes('tipoCliente') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge 
                            variant={cliente.tipoCliente === 'empresa' ? 'default' : 'secondary'} 
                            className="text-xs font-medium"
                          >
                            {cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
                          </Badge>
                        </td>
                      )}
                      
                      {columnasVisibles.includes('direccion') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text} text-muted-foreground`}>
                          {cliente.direccion?.calle && (
                            <div className="max-w-[200px] truncate">
                              {cliente.direccion.calle}, {cliente.direccion.codigoPostal} {cliente.direccion.ciudad}
                            </div>
                          )}
                        </td>
                      )}
                      
                      {columnasVisibles.includes('formaPago') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          {cliente.formaPago === 'contado' && 'Contado'}
                          {cliente.formaPago === 'transferencia' && 'Transferencia'}
                          {cliente.formaPago === 'domiciliacion' && 'Domiciliación'}
                          {cliente.formaPago === 'confirming' && 'Confirming'}
                          {cliente.formaPago === 'pagare' && 'Pagaré'}
                        </td>
                      )}
                      
                      {columnasVisibles.includes('riesgoActual') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text}`}>
                          <span className={`font-semibold ${
                            cliente.limiteCredito && (cliente.riesgoActual || 0) > cliente.limiteCredito 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-muted-foreground'
                          }`}>
                            {(cliente.riesgoActual || 0).toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </span>
                        </td>
                      )}
                      
                      {columnasVisibles.includes('limiteCredito') && (
                        <td className={`${densityClasses.cell} text-right ${densityClasses.text} font-medium text-muted-foreground`}>
                          {cliente.limiteCredito ? (
                            cliente.limiteCredito.toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            })
                          ) : (
                            '-'
                          )}
                        </td>
                      )}
                      
                      {columnasVisibles.includes('activo') && (
                        <td className={`${densityClasses.cell} ${densityClasses.text}`}>
                          <Badge 
                            variant={cliente.activo ? 'default' : 'secondary'} 
                            className={`text-xs font-medium ${
                              cliente.activo 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {cliente.activo ? 'Activo' : 'Inactivo'}
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
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'edit')}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'duplicate')}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Crear Documento</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'presupuesto')}>
                              <FileText className="mr-2 h-4 w-4" />
                              Presupuesto
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'pedido')}>
                              <Package className="mr-2 h-4 w-4" />
                              Pedido
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'albaran')}>
                              <Truck className="mr-2 h-4 w-4" />
                              Albarán
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'factura')}>
                              <Receipt className="mr-2 h-4 w-4" />
                              Factura
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'parte')}>
                              <Wrench className="mr-2 h-4 w-4" />
                              Parte de Trabajo
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Consultas</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'consulta-pedidos')}>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver Pedidos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'vencimientos')}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Vencimientos
                            </DropdownMenuItem>
                            
                            {canDelete('clientes') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleClientAction(cliente._id, 'delete')}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
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
                      onClick={() => setFilters(prev => ({ ...prev, page }))}
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
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))}
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
                ¿Estás seguro de que deseas eliminar {deleteDialog.clienteIds.length === 1
                  ? 'el siguiente cliente'
                  : `los siguientes ${deleteDialog.clienteIds.length} clientes`}?
              </DialogDescription>
              <ul className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {deleteDialog.clienteNombres.map((nombre, index) => (
                  <li key={index} className="text-sm font-medium">• {nombre}</li>
                ))}
              </ul>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, clienteIds: [], clienteNombres: [] })}
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