"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { adminService, EmpresaListItem } from '@/services/admin.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

export default function EmpresasListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [estado, setEstado] = useState<string>(searchParams.get('estado') || 'all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (user?.rol !== 'superadmin') {
      toast.error('No tienes permisos para acceder a esta página')
      router.push('/dashboard')
      return
    }

    loadEmpresas()
  }, [user, router, page, search, estado])

  const loadEmpresas = async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: 10,
      }

      if (search) params.search = search
      if (estado !== 'all') params.estado = estado

      const response = await adminService.getEmpresas(params)
      setEmpresas(response.data)
      setTotalPages(response.pagination.totalPages)
    } catch (error: any) {
      toast.error('Error al cargar empresas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadEmpresas()
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      activa: 'default',
      suspendida: 'secondary',
      cancelada: 'destructive',
    }

    return (
      <Badge variant={variants[estado] || 'outline'}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
            <p className="text-muted-foreground">
              Administra todas las empresas del sistema
            </p>
          </div>
          <Button onClick={() => router.push('/admin')}>
            Volver al Panel
          </Button>
        </div>

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, NIF o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activa">Activas</SelectItem>
                <SelectItem value="suspendida">Suspendidas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Buscar</Button>
          </div>
        </Card>

        {/* Tabla */}
        <Card>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando empresas...</p>
            </div>
          ) : empresas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No se encontraron empresas</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Fecha Alta</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas.map((empresa) => (
                    <TableRow key={empresa._id}>
                      <TableCell className="font-medium">{empresa.nombre}</TableCell>
                      <TableCell>{empresa.nif}</TableCell>
                      <TableCell>{empresa.email}</TableCell>
                      <TableCell className="capitalize">{empresa.tipoNegocio}</TableCell>
                      <TableCell>{getEstadoBadge(empresa.estado)}</TableCell>
                      <TableCell>
                        {empresa.stats.usuariosActivos}/{empresa.stats.totalUsuarios}
                      </TableCell>
                      <TableCell>
                        {new Date(empresa.fechaAlta).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/empresas/${empresa._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}