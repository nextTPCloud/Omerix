"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { adminService, EmpresaDetalle } from '@/services/admin.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Users,
  Database,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
} from 'lucide-react'

export default function EmpresaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [empresa, setEmpresa] = useState<EmpresaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingEstado, setUpdatingEstado] = useState(false)

  useEffect(() => {
    if (user?.rol !== 'superadmin') {
      toast.error('No tienes permisos para acceder a esta página')
      router.push('/dashboard')
      return
    }

    loadEmpresa()
  }, [user, router, params.id])

  const loadEmpresa = async () => {
    try {
      setLoading(true)
      const data = await adminService.getEmpresaById(params.id)
      setEmpresa(data)
    } catch (error: any) {
      toast.error('Error al cargar empresa')
      console.error(error)
      router.push('/admin/empresas')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeEstado = async (nuevoEstado: 'activa' | 'suspendida' | 'cancelada') => {
    if (!empresa) return

    try {
      setUpdatingEstado(true)
      await adminService.updateEmpresaEstado(empresa._id, nuevoEstado)
      toast.success(`Empresa ${nuevoEstado === 'activa' ? 'activada' : nuevoEstado === 'suspendida' ? 'suspendida' : 'cancelada'}`)
      loadEmpresa()
    } catch (error: any) {
      toast.error('Error al cambiar estado de empresa')
      console.error(error)
    } finally {
      setUpdatingEstado(false)
    }
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando empresa...</p>
          </div>
        </div>
      
    )
  }

  if (!empresa) {
    return null
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      activa: 'default',
      suspendida: 'secondary',
      cancelada: 'destructive',
    }

    return (
      <Badge variant={variants[estado] || 'outline'} className="text-sm">
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    )
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin/empresas')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{empresa.nombre}</h1>
              <p className="text-muted-foreground">{empresa.nif}</p>
            </div>
          </div>
          {getEstadoBadge(empresa.estado)}
        </div>

        {/* Información General */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{empresa.stats.totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">
                {empresa.stats.usuariosActivos} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{empresa.stats.adminCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Con permisos de admin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono">{empresa.databaseConfig.name}</div>
              <p className="text-xs text-muted-foreground">
                {empresa.databaseConfig.host}:{empresa.databaseConfig.port}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Información de Contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{empresa.email}</p>
                </div>
              </div>

              {empresa.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{empresa.telefono}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tipo de Negocio</p>
                  <p className="text-sm text-muted-foreground capitalize">{empresa.tipoNegocio}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Fecha de Alta</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(empresa.fechaAlta).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {empresa.direccion && (
              <div className="flex items-start gap-2 pt-4 border-t">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground">
                    {empresa.direccion.calle}<br />
                    {empresa.direccion.codigoPostal} {empresa.direccion.ciudad}, {empresa.direccion.provincia}<br />
                    {empresa.direccion.pais}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cambiar Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">Cambiar estado de la empresa:</p>
              <Select
                value={empresa.estado}
                onValueChange={(value) => handleChangeEstado(value as any)}
                disabled={updatingEstado}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="suspendida">Suspendida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios de la Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            {empresa.usuarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay usuarios registrados</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresa.usuarios.map((usuario: any) => (
                    <TableRow key={usuario._id}>
                      <TableCell className="font-medium">
                        {usuario.nombre} {usuario.apellidos}
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell className="capitalize">{usuario.rol}</TableCell>
                      <TableCell>
                        {usuario.activo ? (
                          <Badge variant="default">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {usuario.twoFactorEnabled ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(usuario.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    
  )
}