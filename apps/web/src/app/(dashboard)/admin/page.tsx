"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminService, SystemStats } from '@/services/admin.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import {
  Users,
  Building2,
  CheckCircle,
  XCircle,
  PauseCircle,
  TrendingUp,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar que el usuario tiene rol de superadmin
    if (user?.rol !== 'superadmin') {
      toast.error('No tienes permisos para acceder al panel de administración')
      router.push('/dashboard')
      return
    }

    loadStats()
  }, [user, router])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await adminService.getSystemStats()
      setStats(data)
    } catch (error: any) {
      toast.error('Error al cargar estadísticas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando panel de administración...</p>
          </div>
        </div>
      
    )
  }

  if (!stats) {
    return null
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestión y monitoreo de todas las empresas del sistema
          </p>
        </div>

        {/* Stats Cards - Empresas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.empresas.total}</div>
              <p className="text-xs text-muted-foreground">
                En el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.empresas.activas}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.empresas.activas / stats.empresas.total) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspendidas</CardTitle>
              <PauseCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.empresas.suspendidas}</div>
              <p className="text-xs text-muted-foreground">
                Temporalmente inactivas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.empresas.canceladas}</div>
              <p className="text-xs text-muted-foreground">
                Dadas de baja
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards - Usuarios */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usuarios.total}</div>
              <p className="text-xs text-muted-foreground">
                En todas las empresas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usuarios.activos}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.usuarios.activos / stats.usuarios.total) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Empresas por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas por Tipo de Negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.empresasPorTipo.map((tipo) => (
                <div key={tipo._id} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{tipo._id}</span>
                  <span className="font-semibold">{tipo.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push('/admin/empresas')}
          >
            <CardHeader>
              <CardTitle className="text-base">Gestionar Empresas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ver, editar y gestionar todas las empresas del sistema
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push('/admin/empresas?estado=activa')}
          >
            <CardHeader>
              <CardTitle className="text-base">Ver Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Filtrar solo empresas activas
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push('/admin/empresas?estado=suspendida')}
          >
            <CardHeader>
              <CardTitle className="text-base">Ver Suspendidas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Revisar empresas suspendidas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    
  )
}