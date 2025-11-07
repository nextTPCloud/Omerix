"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { clientesService } from '@/services/clientes.service'
import { Cliente, ClientesFilters } from '@/types/cliente.types'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  UserCircle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
  FileText,
  Package,
  Truck,
  Receipt,
  Wrench,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ============================================
// TIPOS
// ============================================

type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
} | null

type ColumnFilters = {
  [key: string]: string
}

export default function ClientesPage() {
  const router = useRouter()
  
  // Estado principal
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
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({})
  
  // Filtros generales
  const [filters, setFilters] = useState<ClientesFilters>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc',
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
  
  // Columnas disponibles y visibles
  const [columnasDisponibles] = useState([
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'nif', label: 'NIF/CIF' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'tipoCliente', label: 'Tipo' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'formaPago', label: 'Forma Pago' },
    { key: 'riesgoActual', label: 'Riesgo' },
    { key: 'limiteCredito', label: 'Límite' },
    { key: 'activo', label: 'Estado' },
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
    const total = pagination.total
    const activos = clientes.filter((c) => c.activo).length
    const inactivos = clientes.filter((c) => !c.activo).length
    const empresas = clientes.filter((c) => c.tipoCliente === 'empresa').length
    const particulares = clientes.filter((c) => c.tipoCliente === 'particular').length

    return { total, activos, inactivos, empresas, particulares }
  }, [clientes, pagination.total])

  // ============================================
  // EFECTOS
  // ============================================

  useEffect(() => {
    loadClientes()
  }, [filters])

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ ...filters, search: searchTerm, page: 1 })
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================

  const loadClientes = async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getAll(filters)
      setClientes(response.data)
      setPagination(response.pagination)
      setSelectedClientes([])
      setSelectAll(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar clientes')
      setClientes([])
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // ORDENAMIENTO
  // ============================================

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
    setFilters({ ...filters, sortBy: key, sortOrder: direction, page: 1 })
  }

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-3 w-3" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-3 w-3" />
      : <ArrowDown className="ml-2 h-3 w-3" />
  }

  // ============================================
  // FILTROS POR COLUMNA
  // ============================================

  const handleColumnFilter = (column: string, value: string) => {
    const newFilters = { ...columnFilters }
    
    if (value === '') {
      delete newFilters[column]
    } else {
      newFilters[column] = value
    }
    
    setColumnFilters(newFilters)
    // Aplicar filtros combinados
    applyAllFilters(newFilters)
  }

  const applyAllFilters = (colFilters: ColumnFilters) => {
    // Combinar filtros de columna con filtros generales
    const combinedFilters: any = { ...filters, page: 1 }
    
    Object.entries(colFilters).forEach(([key, value]) => {
      if (key === 'tipoCliente' || key === 'formaPago') {
        combinedFilters[key] = value
      } else if (key === 'activo') {
        combinedFilters.activo = value === 'true'
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
  // PAGINACIÓN
  // ============================================

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setFilters({ ...filters, page: newPage })
    }
  }

  const handleLimitChange = (newLimit: number) => {
    setFilters({ ...filters, limit: newLimit, page: 1 })
  }

  // ============================================
  // ACCIONES
  // ============================================

  const handleDelete = (clienteIds: string[], clienteNombres: string[]) => {
    setDeleteDialog({
      open: true,
      clienteIds,
      clienteNombres,
    })
  }

  const confirmDelete = async () => {
    try {
      if (deleteDialog.clienteIds.length === 1) {
        await clientesService.delete(deleteDialog.clienteIds[0])
        toast.success('Cliente desactivado correctamente')
      } else {
        await clientesService.deleteMany(deleteDialog.clienteIds)
        toast.success(`${deleteDialog.clienteIds.length} clientes desactivados correctamente`)
      }
      
      setDeleteDialog({ open: false, clienteIds: [], clienteNombres: [] })
      setSelectedClientes([])
      loadClientes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar clientes')
    }
  }

  const handleExportCSV = async () => {
    try {
      const blob = await clientesService.exportToCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Clientes exportados correctamente')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al exportar clientes')
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedClientes.length === 0) {
      toast.error('Selecciona al menos un cliente')
      return
    }

    const nombres = clientes
      .filter(c => selectedClientes.includes(c._id))
      .map(c => c.nombre)

    switch (action) {
      case 'delete':
        handleDelete(selectedClientes, nombres)
        break
      case 'export':
        toast.info('Exportando clientes seleccionados...')
        break
      default:
        toast.info(`Acción "${action}" en desarrollo`)
    }
  }

  // Acciones específicas por cliente
  const handleClientAction = (clienteId: string, action: string) => {
    const cliente = clientes.find(c => c._id === clienteId)
    if (!cliente) return

    switch (action) {
      case 'view':
        router.push(`/clientes/${clienteId}`)
        break
      case 'edit':
        router.push(`/clientes/${clienteId}/editar`)
        break
      case 'delete':
        handleDelete([clienteId], [cliente.nombre])
        break
      // Nuevas acciones
      case 'pedido':
        router.push(`/pedidos/nuevo?clienteId=${clienteId}`)
        break
      case 'albaran':
        router.push(`/albaranes/nuevo?clienteId=${clienteId}`)
        break
      case 'factura':
        router.push(`/facturas/nuevo?clienteId=${clienteId}`)
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
  // COLUMNAS
  // ============================================

  const toggleColumna = (columna: string) => {
    if (columnasVisibles.includes(columna)) {
      setColumnasVisibles(columnasVisibles.filter((c) => c !== columna))
    } else {
      setColumnasVisibles([...columnasVisibles, columna])
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {/* ============================================ */}
        {/* HEADER COMPACTO */}
        {/* ============================================ */}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              {pagination.total} clientes | {selectedClientes.length} seleccionados
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Estadísticas Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {/* Selector de columnas */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Columnas
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Mostrar columnas</h4>
                  {columnasDisponibles.map((col) => (
                    <div key={col.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={col.key}
                        checked={columnasVisibles.includes(col.key)}
                        onCheckedChange={() => toggleColumna(col.key)}
                      />
                      <label htmlFor={col.key} className="text-sm cursor-pointer">
                        {col.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            
            <Button size="sm" onClick={() => router.push('/clientes/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* ============================================ */}
        {/* ESTADÍSTICAS COLAPSABLES */}
        {/* ============================================ */}
        
        {showStats && (
          <Card>
            <CardContent className="py-3">
              <div className="grid grid-cols-5 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Activos</p>
                    <p className="text-lg font-bold text-green-600">{stats.activos}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Inactivos</p>
                    <p className="text-lg font-bold text-red-600">{stats.inactivos}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Empresas</p>
                    <p className="text-lg font-bold">{stats.empresas}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Particulares</p>
                    <p className="text-lg font-bold">{stats.particulares}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================ */}
        {/* BARRA DE BÚSQUEDA Y ACCIONES MASIVAS */}
        {/* ============================================ */}
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, NIF, email o código..."
              className="pl-8 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {selectedClientes.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                Exportar ({selectedClientes.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar ({selectedClientes.length})
              </Button>
            </>
          )}
        </div>

        {/* ============================================ */}
        {/* TABLA COMPACTA CON FILTROS */}
        {/* ============================================ */}
        
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Headers con ordenamiento */}
                <tr className="border-b bg-muted/30">
                  <th className="px-3 py-2 text-left w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  
                  {columnasVisibles.includes('codigo') && (
                    <th className="px-3 py-2 text-left">
                      <button
                        onClick={() => handleSort('codigo')}
                        className="flex items-center hover:text-primary"
                      >
                        Código
                        {getSortIcon('codigo')}
                      </button>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('nombre') && (
                    <th className="px-3 py-2 text-left">
                      <button
                        onClick={() => handleSort('nombre')}
                        className="flex items-center hover:text-primary"
                      >
                        Nombre
                        {getSortIcon('nombre')}
                      </button>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('nif') && (
                    <th className="px-3 py-2 text-left">
                      <button
                        onClick={() => handleSort('nif')}
                        className="flex items-center hover:text-primary"
                      >
                        NIF/CIF
                        {getSortIcon('nif')}
                      </button>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('email') && (
                    <th className="px-3 py-2 text-left">Email</th>
                  )}
                  
                  {columnasVisibles.includes('telefono') && (
                    <th className="px-3 py-2 text-left">Teléfono</th>
                  )}
                  
                  {columnasVisibles.includes('tipoCliente') && (
                    <th className="px-3 py-2 text-left">
                      <button
                        onClick={() => handleSort('tipoCliente')}
                        className="flex items-center hover:text-primary"
                      >
                        Tipo
                        {getSortIcon('tipoCliente')}
                      </button>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('riesgoActual') && (
                    <th className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleSort('riesgoActual')}
                        className="flex items-center justify-end w-full hover:text-primary"
                      >
                        Riesgo
                        {getSortIcon('riesgoActual')}
                      </button>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('activo') && (
                    <th className="px-3 py-2 text-left">
                      <button
                        onClick={() => handleSort('activo')}
                        className="flex items-center hover:text-primary"
                      >
                        Estado
                        {getSortIcon('activo')}
                      </button>
                    </th>
                  )}
                  
                  <th className="px-3 py-2 text-right w-16">Acciones</th>
                </tr>

                {/* Fila de filtros por columna */}
                <tr className="border-b bg-muted/10">
                  <th className="px-3 py-1"></th>
                  
                  {columnasVisibles.includes('codigo') && (
                    <th className="px-3 py-1">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs"
                        value={columnFilters.codigo || ''}
                        onChange={(e) => handleColumnFilter('codigo', e.target.value)}
                      />
                    </th>
                  )}
                  
                  {columnasVisibles.includes('nombre') && (
                    <th className="px-3 py-1">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs"
                        value={columnFilters.nombre || ''}
                        onChange={(e) => handleColumnFilter('nombre', e.target.value)}
                      />
                    </th>
                  )}
                  
                  {columnasVisibles.includes('nif') && (
                    <th className="px-3 py-1">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs"
                        value={columnFilters.nif || ''}
                        onChange={(e) => handleColumnFilter('nif', e.target.value)}
                      />
                    </th>
                  )}
                  
                  {columnasVisibles.includes('email') && (
                    <th className="px-3 py-1">
                      <Input
                        placeholder="Filtrar..."
                        className="h-7 text-xs"
                        value={columnFilters.email || ''}
                        onChange={(e) => handleColumnFilter('email', e.target.value)}
                      />
                    </th>
                  )}
                  
                  {columnasVisibles.includes('telefono') && (
                    <th className="px-3 py-1"></th>
                  )}
                  
                  {columnasVisibles.includes('tipoCliente') && (
                    <th className="px-3 py-1">
                      <Select
                        value={columnFilters.tipoCliente || 'all'}
                        onValueChange={(value) => 
                          handleColumnFilter('tipoCliente', value === 'all' ? '' : value)
                        }
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="empresa">Empresa</SelectItem>
                          <SelectItem value="particular">Particular</SelectItem>
                        </SelectContent>
                      </Select>
                    </th>
                  )}
                  
                  {columnasVisibles.includes('riesgoActual') && (
                    <th className="px-3 py-1"></th>
                  )}
                  
                  {columnasVisibles.includes('activo') && (
                    <th className="px-3 py-1">
                      <Select
                        value={columnFilters.activo || 'all'}
                        onValueChange={(value) => 
                          handleColumnFilter('activo', value === 'all' ? '' : value)
                        }
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="true">Activos</SelectItem>
                          <SelectItem value="false">Inactivos</SelectItem>
                        </SelectContent>
                      </Select>
                    </th>
                  )}
                  
                  <th className="px-3 py-1"></th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={20} className="px-3 py-8 text-center text-sm">
                      Cargando clientes...
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="px-3 py-8 text-center text-sm">
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente._id}
                      className="border-b transition-colors hover:bg-muted/30"
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selectedClientes.includes(cliente._id)}
                          onCheckedChange={() => handleSelectCliente(cliente._id)}
                        />
                      </td>
                      
                      {columnasVisibles.includes('codigo') && (
                        <td className="px-3 py-2 font-medium">{cliente.codigo}</td>
                      )}
                      
                      {columnasVisibles.includes('nombre') && (
                        <td className="px-3 py-2">
                          <div>
                            <div className="font-medium">{cliente.nombre}</div>
                            {cliente.nombreComercial && (
                              <div className="text-xs text-muted-foreground">
                                {cliente.nombreComercial}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      
                      {columnasVisibles.includes('nif') && (
                        <td className="px-3 py-2">{cliente.nif}</td>
                      )}
                      
                      {columnasVisibles.includes('email') && (
                        <td className="px-3 py-2 text-xs">{cliente.email || '-'}</td>
                      )}
                      
                      {columnasVisibles.includes('telefono') && (
                        <td className="px-3 py-2 text-xs">
                          {cliente.telefono || cliente.movil || '-'}
                        </td>
                      )}
                      
                      {columnasVisibles.includes('tipoCliente') && (
                        <td className="px-3 py-2">
                          <Badge
                            variant={cliente.tipoCliente === 'empresa' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
                          </Badge>
                        </td>
                      )}
                      
                      {columnasVisibles.includes('riesgoActual') && (
                        <td className="px-3 py-2 text-right text-xs">
                          {typeof cliente.riesgoActual === 'number'
                            ? cliente.riesgoActual.toLocaleString('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                              })
                            : '0,00 €'}
                        </td>
                      )}
                      
                      {columnasVisibles.includes('activo') && (
                        <td className="px-3 py-2">
                          <Badge
                            variant={cliente.activo ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {cliente.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      )}
                      
                      <td className="px-3 py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'edit')}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel>Crear Documento</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'pedido')}>
                              <Package className="mr-2 h-4 w-4" />
                              Nuevo Pedido
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'albaran')}>
                              <Truck className="mr-2 h-4 w-4" />
                              Nuevo Albarán
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'factura')}>
                              <Receipt className="mr-2 h-4 w-4" />
                              Nueva Factura
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'parte')}>
                              <Wrench className="mr-2 h-4 w-4" />
                              Nuevo Parte de Trabajo
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel>Consultas</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'consulta-pedidos')}>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver Pedidos
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => handleClientAction(cliente._id, 'vencimientos')}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Ver Vencimientos
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => handleClientAction(cliente._id, 'delete')}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Desactivar
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

          {/* Paginación compacta */}
          {!isLoading && clientes.length > 0 && (
            <div className="flex items-center justify-between border-t px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                </span>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => handleLimitChange(parseInt(value))}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="h-7"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-xs px-2">
                  {pagination.page} / {pagination.pages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="h-7"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ============================================ */}
        {/* DIALOG DE CONFIRMACIÓN */}
        {/* ============================================ */}
        
        <Dialog 
          open={deleteDialog.open} 
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Desactivar cliente{deleteDialog.clienteIds.length > 1 ? 's' : ''}?</DialogTitle>
              <DialogDescription>
                {deleteDialog.clienteIds.length === 1 ? (
                  <>¿Estás seguro de que quieres desactivar al cliente "{deleteDialog.clienteNombres[0]}"?</>
                ) : (
                  <>¿Estás seguro de que quieres desactivar {deleteDialog.clienteIds.length} clientes?</>
                )}
                <br />Esta acción se puede revertir más tarde.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ open: false, clienteIds: [], clienteNombres: [] })}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Desactivar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}