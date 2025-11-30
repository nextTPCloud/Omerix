'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { zonasPreparacionService, ZonaPreparacion } from '@/services/zonas-preparacion.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, ChefHat, RefreshCw, Clock, Bell, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function VerZonaPreparacionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [zona, setZona] = useState<ZonaPreparacion | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await zonasPreparacionService.getById(id)
        if (response.success && response.data) {
          setZona(response.data)
        }
      } catch (error) {
        toast.error('Error al cargar la zona')
        router.push('/zonas-preparacion')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await zonasPreparacionService.delete(id)
      toast.success('Zona eliminada correctamente')
      router.push('/zonas-preparacion')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setIsDeleting(false)
      setDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando zona...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!zona) return null

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/zonas-preparacion"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: zona.color || '#EF4444' }}>
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{zona.nombre}</h1>
                <p className="text-sm text-muted-foreground">Detalles de la zona</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/zonas-preparacion/${id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={zona.activo ? 'default' : 'secondary'} className={zona.activo ? 'bg-green-100 text-green-800' : ''}>
            {zona.activo ? 'Activa' : 'Inactiva'}
          </Badge>
          {zona.kds?.habilitado && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Monitor className="h-3 w-3 mr-1" />
              KDS Habilitado
            </Badge>
          )}
        </div>

        {/* Información General */}
        <Card>
          <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Código</p>
              <p className="text-base font-mono font-semibold">{zona.codigo || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base font-semibold">{zona.nombre}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{zona.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Color</p>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded border" style={{ backgroundColor: zona.color || '#EF4444' }} />
                <span className="font-mono text-sm">{zona.color}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Orden</p>
              <p className="text-base">{zona.orden || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tiempos y Alertas */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Tiempos y Alertas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Tiempo preparación</p>
                <p className="text-2xl font-bold">{zona.tiempoPreparacionPromedio || 15} min</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Alerta retraso</p>
                <p className="text-2xl font-bold">{zona.tiempoAlertaMinutos || 10} min</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Notificar retrasos</span>
              </div>
              <Badge variant={zona.notificarRetraso ? 'default' : 'secondary'}>
                {zona.notificarRetraso ? 'Sí' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* KDS */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" />Kitchen Display System</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>KDS Habilitado</span>
              <Badge variant={zona.kds?.habilitado ? 'default' : 'secondary'}>
                {zona.kds?.habilitado ? 'Sí' : 'No'}
              </Badge>
            </div>
            {zona.kds?.habilitado && (
              <>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Mostrar tiempo</span>
                  <Badge variant={zona.kds?.mostrarTiempo ? 'default' : 'secondary'}>
                    {zona.kds?.mostrarTiempo ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Mostrar prioridad</span>
                  <Badge variant={zona.kds?.mostrarPrioridad ? 'default' : 'secondary'}>
                    {zona.kds?.mostrarPrioridad ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Sonido nueva comanda</span>
                  <Badge variant={zona.kds?.sonidoNuevaComanda ? 'default' : 'secondary'}>
                    {zona.kds?.sonidoNuevaComanda ? 'Sí' : 'No'}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog de eliminación */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar la zona "{zona.nombre}"?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={isDeleting}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
