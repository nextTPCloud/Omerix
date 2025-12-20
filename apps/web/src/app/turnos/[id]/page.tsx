'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { turnosService } from '@/services/turnos.service'
import { Turno, DIAS_SEMANA, COLORES_TURNO } from '@/types/turno.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, Clock, RefreshCw, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { usePermissions } from '@/hooks/usePermissions'

export default function TurnoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { canEdit, canDelete } = usePermissions()
  const [turno, setTurno] = useState<Turno | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const cargarTurno = async () => {
    try {
      setIsLoading(true)
      const response = await turnosService.getById(params.id as string)
      if (response.success && response.data) {
        setTurno(response.data)
      } else {
        toast.error('Turno no encontrado')
        router.push('/turnos')
      }
    } catch (error) {
      toast.error('Error al cargar el turno')
      router.push('/turnos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      cargarTurno()
    }
  }, [params.id])

  const handleDelete = async () => {
    try {
      const response = await turnosService.delete(params.id as string)
      if (response.success) {
        toast.success('Turno eliminado')
        router.push('/turnos')
      }
    } catch (error) {
      toast.error('Error al eliminar')
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

  if (!turno) {
    return null
  }

  const colorInfo = COLORES_TURNO.find(c => c.value === turno.color)
  const horasSemanales = (turno.horasTeoricas || 0) * (turno.diasSemana?.length || 0)

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/turnos"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: turno.color || '#3B82F6' }}
              >
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{turno.nombre}</h1>
                <p className="text-sm text-muted-foreground font-mono">{turno.codigo}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit('turnos') && (
              <Button variant="outline" asChild>
                <Link href={`/turnos/${turno._id}/editar`}>
                  <Edit className="h-4 w-4 mr-2" />Editar
                </Link>
              </Button>
            )}
            {canDelete('turnos') && (
              <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />Eliminar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Informacion Principal */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Horarios</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Entrada</p>
                  <p className="text-3xl font-bold font-mono">{turno.horaEntrada}</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">Salida</p>
                  <p className="text-3xl font-bold font-mono">{turno.horaSalida}</p>
                </div>
              </div>

              {turno.pausaInicio && (
                <div className="p-4 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-2">Pausa / Descanso</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="font-mono">{turno.pausaInicio}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="font-mono">{turno.pausaFin}</span>
                    <Badge variant="outline">{turno.duracionPausaMinutos} min</Badge>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-3">Dias de Trabajo</p>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <Badge
                      key={dia.value}
                      variant={turno.diasSemana?.includes(dia.value) ? 'default' : 'outline'}
                      className={turno.diasSemana?.includes(dia.value) ? '' : 'opacity-40'}
                    >
                      {dia.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {turno.descripcion && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descripcion</p>
                  <p>{turno.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panel lateral */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Estado</CardTitle></CardHeader>
              <CardContent>
                <Badge
                  variant={turno.activo ? 'default' : 'secondary'}
                  className={turno.activo ? 'bg-green-100 text-green-800' : ''}
                >
                  {turno.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Resumen de Horas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horas/dia</span>
                  <span className="font-bold font-mono">{turno.horasTeoricas}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dias/semana</span>
                  <span className="font-bold">{turno.diasSemana?.length || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas/semana</span>
                    <span className="font-bold text-primary font-mono">{horasSemanales.toFixed(1)}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Apariencia</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border"
                    style={{ backgroundColor: turno.color || '#3B82F6' }}
                  />
                  <span>{colorInfo?.label || turno.color}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Fechas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Creado:</span>
                  <span>{new Date(turno.fechaCreacion).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Modificado:</span>
                  <span>{new Date(turno.fechaModificacion).toLocaleDateString('es-ES')}</span>
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
                ¿Esta seguro de eliminar el turno "{turno.nombre}"? Esta accion no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
