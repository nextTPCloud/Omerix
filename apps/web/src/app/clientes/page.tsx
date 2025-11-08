'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { clientesService } from '@/services/clientes.service'
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
  Download,
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
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportClientesToCSV, processImportFile } from '@/utils/excel.utils'

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

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ClientesPage() {
  const router = useRouter()

  // Estados de datos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selección múltiple
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Ordenamiento
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  })
  
  // Filtros por columna
  const [columnFiltersInput, setColumnFiltersInput] = useState<ColumnFilters>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({})
  
  // Aplicar debounce a los filtros de columna
  const debouncedColumnFilters = useDebounce(columnFiltersInput, 500)
  
  // Filtros generales - CON ACTIVO=TRUE POR DEFECTO
  const [filters, setFilters] = useState<ClientesFilters>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    activo: true,  // ← FILTRO POR DEFECTO: SOLO ACTIVOS
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
  
  // Columnas disponibles con anchos optimizados
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
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
  
  const [columnasVisibles, setColumnasVisibles] = useState<string[]>([
    'codigo',
    'nombre',
    'nif',
    'email',
    'telefono',
    'tipoCliente',
    'riesgoActual',
    'activo',
  ])

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
        setPagination(response.pagination || {
          page: 1,
          limit: 25,
          total: 0,
          pages: 0,
        })
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
  // APLICAR FILTROS DEBOUNCED
  // ============================================
  
  useEffect(() => {
    setColumnFilters(debouncedColumnFilters)
    applyAllFilters(debouncedColumnFilters)
  }, [debouncedColumnFilters])

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
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }
    
    setSortConfig({ key, direction })
    setFilters(prev => ({
      ...prev,
      sortBy: key,
      sortOrder: direction,
      page: 1,
    }))
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

  const applyAllFilters = (colFilters: ColumnFilters) => {
    const combinedFilters: any = { 
      page: 1,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      limit: filters.limit,
    }
    
    // Campos de búsqueda por texto
    const searchableFields = ['codigo', 'nombre', 'nif', 'email', 'telefono', 'direccion', 'riesgoActual', 'limiteCredito']
    const searchTerms: string[] = []
    
    searchableFields.forEach(field => {
      if (colFilters[field]) {
        searchTerms.push(colFilters[field])
      }
    })
    
    if (searchTerms.length > 0) {
      combinedFilters.search = searchTerms.join(' ')
    }
    
    // Filtros de select
    Object.entries(colFilters).forEach(([key, value]) => {
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
    
    setFilters(combinedFilters)
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

  const handleClientAction = (clienteId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/clientes/${clienteId}`)
        break
      case 'edit':
        router.push(`/clientes/${clienteId}/editar`)
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
    if (columnasVisibles.includes(key)) {
      if (columnasVisibles.length > 1) {
        setColumnasVisibles(columnasVisibles.filter(c => c !== key))
      }
    } else {
      setColumnasVisibles([...columnasVisibles, key])
    }
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

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona tu cartera de clientes
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowStats(!showStats)}
              title="Ver estadísticas"
            >
              {showStats ? <Eye className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={cargarClientes}
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild>
              <Link href="/clientes/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
                <span className="sm:hidden">Nuevo</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ESTADÍSTICAS */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold">{stats.activos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Inactivos</p>
                  <p className="text-2xl font-bold">{stats.inactivos}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Empresas</p>
                  <p className="text-2xl font-bold">{stats.empresas}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Particulares</p>
                  <p className="text-2xl font-bold">{stats.particulares}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Con Riesgo</p>
                  <p className="text-2xl font-bold">{stats.conRiesgo}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center w-full sm:max-w-md">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Buscar por nombre, NIF, email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            {/* Selector de columnas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="mr-2 h-4 w-4" />
                  Columnas
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleImport}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportClientesToCSV(clientes)
                toast.success('Clientes exportados correctamente')
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* ACCIONES EN LOTE */}
        {selectedClientes.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg items-center">
            <span className="text-sm text-muted-foreground mr-2">
              {selectedClientes.length} seleccionados
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('activate')}
            >
              Activar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('deactivate')}
            >
              Desactivar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('export')}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction('delete')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}

        {/* TABLA CON SCROLL HORIZONTAL */}
        <Card className="w-full">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
                <thead>
                  {/* Headers con ordenamiento */}
                  <tr className="border-b bg-muted/30">
                    <th className="sticky left-0 z-20 bg-muted/30 px-4 py-3 text-left w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    
                    {columnasVisibles.includes('codigo') && (
                      <th className="px-4 py-3 text-left min-w-[100px]">
                        <button
                          onClick={() => handleSort('codigo')}
                          className="flex items-center hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Código
                          {getSortIcon('codigo')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('nombre') && (
                      <th className="px-4 py-3 text-left min-w-[250px]">
                        <button
                          onClick={() => handleSort('nombre')}
                          className="flex items-center hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Nombre
                          {getSortIcon('nombre')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('nif') && (
                      <th className="px-4 py-3 text-left min-w-[120px]">
                        <button
                          onClick={() => handleSort('nif')}
                          className="flex items-center hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          NIF/CIF
                          {getSortIcon('nif')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('email') && (
                      <th className="px-4 py-3 text-left min-w-[220px]">
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Email
                          {getSortIcon('email')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('telefono') && (
                      <th className="px-4 py-3 text-left min-w-[130px]">
                        <button
                          onClick={() => handleSort('telefono')}
                          className="flex items-center hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Teléfono
                          {getSortIcon('telefono')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('tipoCliente') && (
                      <th className="px-4 py-3 text-left min-w-[120px]">
                        <button
                          onClick={() => handleSort('tipoCliente')}
                          className="flex items-center hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Tipo
                          {getSortIcon('tipoCliente')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('direccion') && (
                      <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap min-w-[250px]">
                        Dirección
                      </th>
                    )}
                    
                    {columnasVisibles.includes('formaPago') && (
                      <th className="px-4 py-3 text-left min-w-[140px]">
                        <button
                          onClick={() => handleSort('formaPago')}
                          className="flex items-center hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Forma Pago
                          {getSortIcon('formaPago')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('riesgoActual') && (
                      <th className="px-4 py-3 text-right min-w-[120px]">
                        <button
                          onClick={() => handleSort('riesgoActual')}
                          className="flex items-center justify-end w-full hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Riesgo
                          {getSortIcon('riesgoActual')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('limiteCredito') && (
                      <th className="px-4 py-3 text-right min-w-[120px]">
                        <button
                          onClick={() => handleSort('limiteCredito')}
                          className="flex items-center justify-end w-full hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Límite
                          {getSortIcon('limiteCredito')}
                        </button>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('activo') && (
                      <th className="px-4 py-3 text-left min-w-[100px]">
                        <button
                          onClick={() => handleSort('activo')}
                          className="flex items-center hover:text-primary text-sm font-medium whitespace-nowrap"
                        >
                          Estado
                          {getSortIcon('activo')}
                        </button>
                      </th>
                    )}
                    
                    <th className="sticky right-0 z-20 bg-muted/30 px-4 py-3 text-right min-w-[80px] text-sm font-medium whitespace-nowrap">
                      Acciones
                    </th>
                  </tr>

                  {/* Fila de filtros por columna */}
                  <tr className="border-b bg-muted/10">
                    <th className="sticky left-0 z-20 bg-muted/10 px-4 py-2"></th>
                    
                    {columnasVisibles.includes('codigo') && (
                      <th className="px-4 py-2">
                        <Input
                          placeholder="Filtrar..."
                          className="h-8 text-sm"
                          value={columnFiltersInput.codigo || ''}
                          onChange={(e) => handleColumnFilterInput('codigo', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('nombre') && (
                      <th className="px-4 py-2">
                        <Input
                          placeholder="Filtrar..."
                          className="h-8 text-sm"
                          value={columnFiltersInput.nombre || ''}
                          onChange={(e) => handleColumnFilterInput('nombre', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('nif') && (
                      <th className="px-4 py-2">
                        <Input
                          placeholder="Filtrar..."
                          className="h-8 text-sm"
                          value={columnFiltersInput.nif || ''}
                          onChange={(e) => handleColumnFilterInput('nif', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('email') && (
                      <th className="px-4 py-2">
                        <Input
                          placeholder="Filtrar..."
                          className="h-8 text-sm"
                          value={columnFiltersInput.email || ''}
                          onChange={(e) => handleColumnFilterInput('email', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('telefono') && (
                      <th className="px-4 py-2">
                        <Input
                          placeholder="Filtrar..."
                          className="h-8 text-sm"
                          value={columnFiltersInput.telefono || ''}
                          onChange={(e) => handleColumnFilterInput('telefono', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('tipoCliente') && (
                      <th className="px-4 py-2">
                        <Select
                          value={columnFiltersInput.tipoCliente || 'all'}
                          onValueChange={(value) => 
                            handleColumnFilterInput('tipoCliente', value)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="empresa">Empresa</SelectItem>
                            <SelectItem value="particular">Particular</SelectItem>
                          </SelectContent>
                        </Select>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('direccion') && (
                      <th className="px-4 py-2">
                        <Input
                          placeholder="Filtrar..."
                          className="h-8 text-sm"
                          value={columnFiltersInput.direccion || ''}
                          onChange={(e) => handleColumnFilterInput('direccion', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('formaPago') && (
                      <th className="px-4 py-2">
                        <Select
                          value={columnFiltersInput.formaPago || 'all'}
                          onValueChange={(value) => 
                            handleColumnFilterInput('formaPago', value)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="contado">Contado</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="domiciliacion">Domiciliación</SelectItem>
                            <SelectItem value="confirming">Confirming</SelectItem>
                            <SelectItem value="pagare">Pagaré</SelectItem>
                          </SelectContent>
                        </Select>
                      </th>
                    )}
                    
                    {columnasVisibles.includes('riesgoActual') && (
                      <th className="px-4 py-2">
                        <Input
                          placeholder="Filtrar..."
                          className="h-8 text-sm"
                          value={columnFiltersInput.riesgoActual || ''}
                          onChange={(e) => handleColumnFilterInput('riesgoActual', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('limiteCredito') && (
                      <th className="px-4 py-2">
                        <Input
                          placeholder="Filtrar..."
                          className="h-8 text-sm"
                          value={columnFiltersInput.limiteCredito || ''}
                          onChange={(e) => handleColumnFilterInput('limiteCredito', e.target.value)}
                        />
                      </th>
                    )}
                    
                    {columnasVisibles.includes('activo') && (
                      <th className="px-4 py-2">
                        <Select
                          value={columnFiltersInput.activo || (filters.activo === true ? 'true' : filters.activo === false ? 'false' : 'all')}
                          onValueChange={(value) => 
                            handleColumnFilterInput('activo', value)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Activos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="true">Activos</SelectItem>
                            <SelectItem value="false">Inactivos</SelectItem>
                          </SelectContent>
                        </Select>
                      </th>
                    )}
                    
                    <th className="sticky right-0 z-20 bg-muted/10 px-4 py-2"></th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={columnasVisibles.length + 2} className="px-2 py-8 text-center text-sm">
                        Cargando clientes...
                      </td>
                    </tr>
                  ) : clientes.length === 0 ? (
                    <tr>
                      <td colSpan={columnasVisibles.length + 2} className="px-2 py-8 text-center text-sm text-muted-foreground">
                        No se encontraron clientes
                      </td>
                    </tr>
                  ) : (
                    clientes.map((cliente) => (
                      <tr
                        key={cliente._id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-background px-2 py-2">
                          <Checkbox
                            checked={selectedClientes.includes(cliente._id)}
                            onCheckedChange={() => handleSelectCliente(cliente._id)}
                          />
                        </td>
                        
                        {columnasVisibles.includes('codigo') && (
                          <td className="px-2 py-2 font-medium text-xs whitespace-nowrap">{cliente.codigo}</td>
                        )}
                        
                        {columnasVisibles.includes('nombre') && (
                          <td className="px-2 py-2 text-xs whitespace-nowrap">
                            <div className="max-w-[200px] truncate">
                              <p className="font-medium">{cliente.nombre}</p>
                              {cliente.nombreComercial && (
                                <p className="text-muted-foreground text-[10px]">
                                  {cliente.nombreComercial}
                                </p>
                              )}
                            </div>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('nif') && (
                          <td className="px-2 py-2 text-xs whitespace-nowrap">{cliente.nif}</td>
                        )}
                        
                        {columnasVisibles.includes('email') && (
                          <td className="px-2 py-2 text-xs whitespace-nowrap">
                            {cliente.email && (
                              <a href={`mailto:${cliente.email}`} className="text-primary hover:underline max-w-[180px] truncate block">
                                {cliente.email}
                              </a>
                            )}
                          </td>
                        )}
                        
                        {columnasVisibles.includes('telefono') && (
                          <td className="px-2 py-2 text-xs whitespace-nowrap">
                            {cliente.telefono && (
                              <a href={`tel:${cliente.telefono}`} className="hover:underline">
                                {cliente.telefono}
                              </a>
                            )}
                          </td>
                        )}
                        
                        {columnasVisibles.includes('tipoCliente') && (
                          <td className="px-2 py-2 text-xs whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">
                              {cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
                            </Badge>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('direccion') && (
                          <td className="px-2 py-2 text-xs whitespace-nowrap">
                            <div className="max-w-[220px] truncate">
                              <p>{cliente.direccion?.calle}</p>
                              <p className="text-muted-foreground text-[10px]">
                                {cliente.direccion?.codigoPostal} {cliente.direccion?.ciudad}
                              </p>
                            </div>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('formaPago') && (
                          <td className="px-2 py-2 text-xs whitespace-nowrap">
                            {cliente.formaPago === 'contado' && 'Contado'}
                            {cliente.formaPago === 'transferencia' && 'Transferencia'}
                            {cliente.formaPago === 'domiciliacion' && 'Domiciliación'}
                            {cliente.formaPago === 'confirming' && 'Confirming'}
                            {cliente.formaPago === 'pagare' && 'Pagaré'}
                          </td>
                        )}
                        
                        {columnasVisibles.includes('riesgoActual') && (
                          <td className="px-2 py-2 text-right text-xs whitespace-nowrap">
                            <span className={`font-medium ${
                              cliente.limiteCredito && (cliente.riesgoActual || 0) > cliente.limiteCredito 
                                ? 'text-red-500' 
                                : ''
                            }`}>
                              {(cliente.riesgoActual || 0).toLocaleString('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                            </span>
                          </td>
                        )}
                        
                        {columnasVisibles.includes('limiteCredito') && (
                          <td className="px-2 py-2 text-right text-xs whitespace-nowrap">
                            {cliente.limiteCredito ? (
                              <span>
                                {cliente.limiteCredito.toLocaleString('es-ES', {
                                  style: 'currency',
                                  currency: 'EUR',
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        )}
                        
                        {columnasVisibles.includes('activo') && (
                          <td className="px-2 py-2 text-xs whitespace-nowrap">
                            <Badge variant={cliente.activo ? 'default' : 'secondary'} className="text-xs">
                              {cliente.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                        )}
                        
                        <td className="sticky right-0 z-10 bg-background px-2 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleClientAction(cliente._id, 'delete')}
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

        {/* PAGINACIÓN */}
        {pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} clientes
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page! - 1) }))}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page! + 1) }))}
                disabled={pagination.page === pagination.pages}
              >
                Siguiente
              </Button>
            </div>
          </div>
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
                <ul className="mt-2 max-h-32 overflow-y-auto">
                  {deleteDialog.clienteNombres.map((nombre, index) => (
                    <li key={index} className="text-sm">• {nombre}</li>
                  ))}
                </ul>
              </DialogDescription>
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