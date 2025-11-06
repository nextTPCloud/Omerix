"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog-simple'
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
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  TrendingDown,
  Building2,
  UserCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

export default function ClientesPage() {
  const router = useRouter()
  
  // Estado principal
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ClientesFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  
  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  
  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    empresas: 0,
    particulares: 0,
  })
  
  // Dialog de eliminación
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    clienteId: string
    clienteNombre: string
  }>({
    open: false,
    clienteId: '',
    clienteNombre: '',
  })
  
  // Columnas visibles
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
  // EFECTOS
  // ============================================

  useEffect(() => {
    loadClientes()
  }, [filters])

  useEffect(() => {
    calculateStats()
  }, [clientes])

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================

  const loadClientes = async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getAll(filters)
      setClientes(response.data)
      setPagination(response.pagination)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar clientes')
      setClientes([])
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = () => {
    const total = clientes.length
    const activos = clientes.filter((c) => c.activo).length
    const inactivos = total - activos
    const empresas = clientes.filter((c) => c.tipoCliente === 'empresa').length
    const particulares = total - empresas

    setStats({ total, activos, inactivos, empresas, particulares })
  }

  // ============================================
  // BÚSQUEDA Y FILTROS
  // ============================================

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleFilterChange = (key: keyof ClientesFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
    setShowFilters(false)
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

  const handleDelete = (clienteId: string, clienteNombre: string) => {
    setDeleteDialog({
      open: true,
      clienteId,
      clienteNombre,
    })
  }

  const confirmDelete = async () => {
    try {
      await clientesService.delete(deleteDialog.clienteId)
      toast.success('Cliente desactivado correctamente')
      setDeleteDialog({ open: false, clienteId: '', clienteNombre: '' })
      loadClientes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar cliente')
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
      <div className="space-y-6">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gestiona tus clientes y sus datos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={() => router.push('/clientes/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* ============================================ */}
        {/* ESTADÍSTICAS */}
        {/* ============================================ */}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactivos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.empresas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Particulares</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.particulares}</div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================ */}
        {/* BÚSQUEDA Y FILTROS */}
        {/* ============================================ */}
        
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, NIF, email o código..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button onClick={handleSearch}>Buscar</Button>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Cliente</label>
                    <Select
                      value={filters.tipoCliente || 'all'}
                      onValueChange={(value) =>
                        handleFilterChange(
                          'tipoCliente',
                          value === 'all' ? undefined : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="empresa">Empresa</SelectItem>
                        <SelectItem value="particular">Particular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select
                      value={
                        filters.activo === undefined
                          ? 'all'
                          : filters.activo
                          ? 'activo'
                          : 'inactivo'
                      }
                      onValueChange={(value) =>
                        handleFilterChange(
                          'activo',
                          value === 'all'
                            ? undefined
                            : value === 'activo'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="activo">Activos</SelectItem>
                        <SelectItem value="inactivo">Inactivos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de Pago</label>
                    <Select
                      value={filters.formaPago || 'all'}
                      onValueChange={(value) =>
                        handleFilterChange(
                          'formaPago',
                          value === 'all' ? undefined : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="contado">Contado</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="domiciliacion">Domiciliación</SelectItem>
                        <SelectItem value="confirming">Confirming</SelectItem>
                        <SelectItem value="pagare">Pagaré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={clearFilters}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ============================================ */}
        {/* TABLA DE CLIENTES */}
        {/* ============================================ */}
        
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columnasVisibles.includes('codigo') && (
                    <th className="px-4 py-3 text-left text-sm font-medium">Código</th>
                  )}
                  {columnasVisibles.includes('nombre') && (
                    <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                  )}
                  {columnasVisibles.includes('nif') && (
                    <th className="px-4 py-3 text-left text-sm font-medium">NIF/CIF</th>
                  )}
                  {columnasVisibles.includes('email') && (
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  )}
                  {columnasVisibles.includes('telefono') && (
                    <th className="px-4 py-3 text-left text-sm font-medium">Teléfono</th>
                  )}
                  {columnasVisibles.includes('tipoCliente') && (
                    <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                  )}
                  {columnasVisibles.includes('riesgoActual') && (
                    <th className="px-4 py-3 text-left text-sm font-medium">Riesgo Actual</th>
                  )}
                  {columnasVisibles.includes('activo') && (
                    <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                  )}
                  <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center">
                      Cargando clientes...
                    </td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center">
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente._id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      {columnasVisibles.includes('codigo') && (
                        <td className="px-4 py-3 text-sm font-medium">
                          {cliente.codigo}
                        </td>
                      )}
                      {columnasVisibles.includes('nombre') && (
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{cliente.nombre}</div>
                            {cliente.nombreComercial && (
                              <div className="text-sm text-muted-foreground">
                                {cliente.nombreComercial}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {columnasVisibles.includes('nif') && (
                        <td className="px-4 py-3 text-sm">{cliente.nif}</td>
                      )}
                      {columnasVisibles.includes('email') && (
                        <td className="px-4 py-3 text-sm">
                          {cliente.email || '-'}
                        </td>
                      )}
                      {columnasVisibles.includes('telefono') && (
                        <td className="px-4 py-3 text-sm">
                          {cliente.telefono || cliente.movil || '-'}
                        </td>
                      )}
                      {columnasVisibles.includes('tipoCliente') && (
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              cliente.tipoCliente === 'empresa'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {cliente.tipoCliente === 'empresa'
                              ? 'Empresa'
                              : 'Particular'}
                          </Badge>
                        </td>
                      )}
                      {columnasVisibles.includes('riesgoActual') && (
                        <td className="px-4 py-3 text-sm">
                          {/* ⚠️ CORRECCIÓN: Verificar que riesgoActual existe antes de usarlo */}
                          {typeof cliente.riesgoActual === 'number'
                            ? cliente.riesgoActual.toLocaleString('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                              })
                            : '0,00 €'}
                        </td>
                      )}
                      {columnasVisibles.includes('activo') && (
                        <td className="px-4 py-3">
                          <Badge
                            variant={cliente.activo ? 'default' : 'destructive'}
                          >
                            {cliente.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/clientes/${cliente._id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/clientes/${cliente._id}/editar`)
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDelete(cliente._id, cliente.nombre)
                              }
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

          {/* Paginación */}
          {!isLoading && clientes.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} clientes
                </span>
                <Select
                  value={pagination.limit.toString()}
                  onValueChange={(value) => handleLimitChange(parseInt(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <span className="text-sm">
                  Página {pagination.page} de {pagination.pages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ============================================ */}
        {/* DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {/* ============================================ */}
        
        <Dialog open={deleteDialog.open} onOpenChange={(open) => 
          setDeleteDialog({ ...deleteDialog, open })
        }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Desactivar cliente?</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres desactivar al cliente "{deleteDialog.clienteNombre}"?
                Esta acción se puede revertir más tarde.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
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