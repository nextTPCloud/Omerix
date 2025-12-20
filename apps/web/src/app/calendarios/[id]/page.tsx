'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { calendariosService } from '@/services/calendarios.service'
import { CalendarioLaboral, REGIONES_ESPANA, TIPOS_FESTIVO } from '@/types/calendario.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, CalendarDays, RefreshCw, Star, Calendar, MapPin, Copy } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { usePermissions } from '@/hooks/usePermissions'

export default function CalendarioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { canEdit, canDelete } = usePermissions()
  const [calendario, setCalendario] = useState<CalendarioLaboral | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [copiarDialog, setCopiarDialog] = useState({ open: false, nuevoAnio: new Date().getFullYear() + 1 })

  const cargarCalendario = async () => {
    try {
      setIsLoading(true)
      const response = await calendariosService.getById(params.id as string)
      if (response.success && response.data) {
        setCalendario(response.data)
      } else {
        toast.error('Calendario no encontrado')
        router.push('/calendarios')
      }
    } catch (error) {
      toast.error('Error al cargar el calendario')
      router.push('/calendarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      cargarCalendario()
    }
  }, [params.id])

  const handleDelete = async () => {
    try {
      const response = await calendariosService.delete(params.id as string)
      if (response.success) {
        toast.success('Calendario eliminado')
        router.push('/calendarios')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleCopiar = async () => {
    try {
      const response = await calendariosService.copiarCalendario(params.id as string, copiarDialog.nuevoAnio)
      if (response.success && response.data) {
        toast.success(`Calendario copiado al año ${copiarDialog.nuevoAnio}`)
        router.push(`/calendarios/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al copiar')
    }
  }

  const handleSetDefecto = async () => {
    try {
      const response = await calendariosService.setDefecto(params.id as string)
      if (response.success) {
        toast.success('Calendario establecido como defecto')
        cargarCalendario()
      }
    } catch (error) {
      toast.error('Error al establecer como defecto')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!calendario) {
    return null
  }

  const festivosOrdenados = [...(calendario.festivos || [])].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  // Agrupar festivos por mes
  const festivosPorMes = festivosOrdenados.reduce((acc, festivo) => {
    const mes = new Date(festivo.fecha + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long' })
    if (!acc[mes]) acc[mes] = []
    acc[mes].push(festivo)
    return acc
  }, {} as Record<string, typeof festivosOrdenados>)

  return (
    <DashboardLayout>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/calendarios"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{calendario.nombre}</h1>
                  {calendario.esDefecto && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
                </div>
                <p className="text-sm text-muted-foreground">Año {calendario.anio} • {calendario.festivos?.length || 0} festivos</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!calendario.esDefecto && (
              <Button variant="outline" onClick={handleSetDefecto}>
                <Star className="h-4 w-4 mr-2" />Por defecto
              </Button>
            )}
            <Button variant="outline" onClick={() => setCopiarDialog({ open: true, nuevoAnio: calendario.anio + 1 })}>
              <Copy className="h-4 w-4 mr-2" />Copiar
            </Button>
            {canEdit('calendarios') && (
              <Button variant="outline" asChild>
                <Link href={`/calendarios/${calendario._id}/editar`}>
                  <Edit className="h-4 w-4 mr-2" />Editar
                </Link>
              </Button>
            )}
            {canDelete('calendarios') && (
              <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />Eliminar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Informacion Principal */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Festivos del Año {calendario.anio}</CardTitle></CardHeader>
            <CardContent>
              {festivosOrdenados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No hay festivos configurados</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(festivosPorMes).map(([mes, festivos]) => (
                    <div key={mes}>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize">{mes}</h3>
                      <div className="space-y-2">
                        {festivos.map((festivo, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="text-center min-w-[50px]">
                                <div className="text-lg font-bold">{new Date(festivo.fecha + 'T00:00:00').getDate()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(festivo.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short' })}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium">{festivo.nombre}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {TIPOS_FESTIVO.find(t => t.value === festivo.tipo)?.label || festivo.tipo}
                                  </Badge>
                                  {festivo.sustituible && <Badge variant="secondary" className="text-xs">Sustituible</Badge>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panel lateral */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Estado</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge
                    variant={calendario.activo ? 'default' : 'secondary'}
                    className={calendario.activo ? 'bg-green-100 text-green-800' : ''}
                  >
                    {calendario.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                {calendario.esDefecto && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">Calendario por defecto</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Ubicacion</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {calendario.region && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{REGIONES_ESPANA.find(r => r.value === calendario.region)?.label || calendario.region}</span>
                  </div>
                )}
                {calendario.provincia && (
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-muted-foreground">Provincia:</span>
                    <span>{calendario.provincia}</span>
                  </div>
                )}
                {calendario.localidad && (
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-muted-foreground">Localidad:</span>
                    <span>{calendario.localidad}</span>
                  </div>
                )}
                {!calendario.region && !calendario.provincia && !calendario.localidad && (
                  <p className="text-muted-foreground text-sm">Sin ubicacion especifica</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total festivos</span>
                  <span className="font-medium">{calendario.festivos?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nacionales</span>
                  <span className="font-medium">{calendario.festivos?.filter(f => f.tipo === 'nacional').length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Autonomicos</span>
                  <span className="font-medium">{calendario.festivos?.filter(f => f.tipo === 'autonomico').length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Locales</span>
                  <span className="font-medium">{calendario.festivos?.filter(f => f.tipo === 'local').length || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Fechas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Creado:</span>
                  <span>{new Date(calendario.fechaCreacion).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Modificado:</span>
                  <span>{new Date(calendario.fechaModificacion).toLocaleDateString('es-ES')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminacion</DialogTitle>
              <DialogDescription>
                ¿Esta seguro de eliminar el calendario "{calendario.nombre} ({calendario.anio})"? Esta accion no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Copiar Dialog */}
        <Dialog open={copiarDialog.open} onOpenChange={(o) => setCopiarDialog({ ...copiarDialog, open: o })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Copiar Calendario</DialogTitle>
              <DialogDescription>Copiar "{calendario.nombre}" a otro año</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Nuevo año</label>
              <Input
                type="number"
                value={copiarDialog.nuevoAnio}
                onChange={(e) => setCopiarDialog({ ...copiarDialog, nuevoAnio: Number(e.target.value) })}
                min={2020}
                max={2050}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCopiarDialog({ open: false, nuevoAnio: new Date().getFullYear() + 1 })}>Cancelar</Button>
              <Button onClick={handleCopiar}>Copiar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
