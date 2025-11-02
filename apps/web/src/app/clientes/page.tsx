"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DataTable, Column } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
} from 'lucide-react'

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ClientesFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  // Cargar clientes
  useEffect(() => {
    loadClientes()
  }, [filters])

  const loadClientes = async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getAll(filters)
      setClientes(response.data)
      setPagination(response.pagination)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  // Búsqueda
  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Cambiar página
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  // Ordenar
  const handleSort = (column: string, order: 'asc' | 'desc') => {
    setFilters({ ...filters, sortBy: column, sortOrder: order })
  }

  // Eliminar cliente
  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de desactivar al cliente "${nombre}"?`)) {
      return
    }

    try {
      await clientesService.delete(id)
      toast.success('Cliente desactivado correctamente')
      loadClientes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar cliente')
    }
  }

  // Exportar CSV
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

  // Definir columnas de la tabla
  const columns: Column<Cliente>[] = [
    {
      key: 'codigo',
      title: 'Código',
      sortable: true,
      render: (cliente) => (
        <span className="font-medium">{cliente.codigo}</span>
      ),
    },
    {
      key: 'nombre',
      title: 'Nombre',
      sortable: true,
      render: (cliente) => (
        <div>
          <div className="font-medium">{cliente.nombre}</div>
          {cliente.nombreComercial && (
            <div className="text-sm text-muted-foreground">
              {cliente.nombreComercial}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'nif',
      title: 'NIF/CIF',
      sortable: true,
    },
    {
      key: 'email',
      title: 'Email',
      render: (cliente) => (
        <span className="text-sm">{cliente.email || '-'}</span>
      ),
    },
    {
      key: 'telefono',
      title: 'Teléfono',
      render: (cliente) => (
        <span className="text-sm">{cliente.telefono || cliente.movil || '-'}</span>
      ),
    },
    {
      key: 'tipoCliente',
      title: 'Tipo',
      render: (cliente) => (
        <Badge variant={cliente.tipoCliente === 'empresa' ? 'default' : 'secondary'}>
          {cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
        </Badge>
      ),
    },
    {
      key: 'activo',
      title: 'Estado',
      render: (cliente) => (
        <Badge variant={cliente.activo ? 'success' : 'destructive'}>
          {cliente.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (cliente) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/clientes/${cliente._id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/clientes/${cliente._id}/editar`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(cliente._id, cliente.nombre)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Desactivar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
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

        {/* Búsqueda y filtros */}
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
        </div>

        {/* Tabla de clientes */}
        <DataTable
          data={clientes}
          columns={columns}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSort={handleSort}
          isLoading={isLoading}
          emptyMessage="No se encontraron clientes"
        />
      </div>
    </DashboardLayout>
  )
}