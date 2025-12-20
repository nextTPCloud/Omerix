'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { fichajesService } from '@/services/fichajes.service'
import { Fichaje, TIPOS_FICHAJE, ESTADOS_FICHAJE } from '@/types/fichaje.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Fingerprint, Clock, Coffee, LogIn, LogOut, MapPin, RefreshCw,
  Calendar, TrendingUp, Play, Pause, Building2, Home, Plane, GraduationCap,
  CheckCircle, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function FichajePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [fichando, setFichando] = useState(false)
  const [enPausa, setEnPausa] = useState(false)
  const [fichajeActual, setFichajeActual] = useState<Fichaje | null>(null)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('normal')
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<string>('00:00:00')
  const [resumenMes, setResumenMes] = useState<{
    totalHoras: number;
    diasTrabajados: number;
    horasExtra: number;
  } | null>(null)
  const [fichajesRecientes, setFichajesRecientes] = useState<Fichaje[]>([])
  const [ubicacion, setUbicacion] = useState<{ latitud: number; longitud: number } | null>(null)
  const [dialogConfirm, setDialogConfirm] = useState<{ open: boolean; accion: 'entrada' | 'salida' | 'pausa'; observaciones: string }>({
    open: false,
    accion: 'entrada',
    observaciones: '',
  })

  const cargarEstado = useCallback(async () => {
    try {
      setIsLoading(true)
      const [estadoRes, resumenRes, fichajesRes] = await Promise.all([
        fichajesService.getEstadoActual(),
        fichajesService.getResumen(),
        fichajesService.getAll({ limit: 5, sortBy: 'fecha', sortOrder: 'desc' }),
      ])

      if (estadoRes.success) {
        setFichando(estadoRes.data.fichando)
        setEnPausa(estadoRes.data.enPausa)
        setFichajeActual(estadoRes.data.fichaje)
      }

      if (resumenRes.success) {
        setResumenMes({
          totalHoras: resumenRes.data.totalHoras,
          diasTrabajados: resumenRes.data.diasTrabajados,
          horasExtra: resumenRes.data.horasExtra,
        })
      }

      if (fichajesRes.success) {
        setFichajesRecientes(fichajesRes.data)
      }
    } catch (error) {
      toast.error('Error al cargar estado')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarEstado()
  }, [cargarEstado])

  // Actualizar tiempo transcurrido cada segundo
  useEffect(() => {
    if (!fichando || !fichajeActual?.horaEntrada) return

    const interval = setInterval(() => {
      const entrada = new Date(fichajeActual.horaEntrada!)
      const ahora = new Date()
      let diff = ahora.getTime() - entrada.getTime()

      // Restar pausa si esta en pausa
      if (enPausa && fichajeActual.pausaInicio) {
        const pausaInicio = new Date(fichajeActual.pausaInicio)
        diff -= (ahora.getTime() - pausaInicio.getTime())
      } else if (fichajeActual.pausaInicio && fichajeActual.pausaFin) {
        const pausaInicio = new Date(fichajeActual.pausaInicio)
        const pausaFin = new Date(fichajeActual.pausaFin)
        diff -= (pausaFin.getTime() - pausaInicio.getTime())
      }

      const horas = Math.floor(diff / (1000 * 60 * 60))
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const segundos = Math.floor((diff % (1000 * 60)) / 1000)

      setTiempoTranscurrido(
        `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [fichando, fichajeActual, enPausa])

  // Obtener ubicacion al cargar
  useEffect(() => {
    fichajesService.obtenerUbicacion().then(setUbicacion)
  }, [])

  const handleFichar = async () => {
    try {
      const response = await fichajesService.ficharRapido({
        tipo: tipoSeleccionado as any,
        ubicacion: ubicacion || undefined,
        observaciones: dialogConfirm.observaciones || undefined,
      })

      if (response.success) {
        toast.success(response.message)
        setDialogConfirm({ open: false, accion: 'entrada', observaciones: '' })
        cargarEstado()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al fichar')
    }
  }

  const handlePausa = async () => {
    if (!fichajeActual) return

    try {
      const tipo = enPausa ? 'fin' : 'inicio'
      const response = await fichajesService.registrarPausa(fichajeActual._id, tipo)

      if (response.success) {
        toast.success(response.message)
        cargarEstado()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al registrar pausa')
    }
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'normal': return <Building2 className="h-5 w-5" />
      case 'teletrabajo': return <Home className="h-5 w-5" />
      case 'viaje': return <Plane className="h-5 w-5" />
      case 'formacion': return <GraduationCap className="h-5 w-5" />
      default: return <Building2 className="h-5 w-5" />
    }
  }

  const formatHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
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

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
            <Fingerprint className="h-8 w-8 text-primary" />
            Fichaje
          </h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Panel Principal de Fichaje */}
        <Card className={`border-2 ${fichando ? (enPausa ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' : 'border-green-500 bg-green-50/50 dark:bg-green-950/20') : 'border-slate-200'}`}>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Estado Actual */}
              <div>
                {fichando ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {enPausa ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-500">
                          <Pause className="h-3 w-3 mr-1" />
                          En Pausa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-500">
                          <Play className="h-3 w-3 mr-1" />
                          Trabajando
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {getIconoTipo(fichajeActual?.tipo || 'normal')}
                        <span className="ml-1">{TIPOS_FICHAJE.find(t => t.value === fichajeActual?.tipo)?.label}</span>
                      </Badge>
                    </div>
                    <p className="text-6xl font-mono font-bold text-primary">{tiempoTranscurrido}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Entrada: {fichajeActual?.horaEntrada && formatHora(fichajeActual.horaEntrada)}
                    </p>
                  </>
                ) : (
                  <>
                    <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-xl text-muted-foreground">No estás fichando</p>
                  </>
                )}
              </div>

              {/* Tipo de Fichaje */}
              {!fichando && (
                <div className="max-w-xs mx-auto">
                  <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de jornada" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_FICHAJE.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          <div className="flex items-center gap-2">
                            {getIconoTipo(tipo.value)}
                            {tipo.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Ubicacion */}
              {ubicacion && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Ubicacion detectada</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}

              {/* Botones de Accion */}
              <div className="flex justify-center gap-4">
                {fichando ? (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handlePausa}
                      className={enPausa ? 'border-green-500 hover:bg-green-50' : 'border-yellow-500 hover:bg-yellow-50'}
                    >
                      {enPausa ? (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Reanudar
                        </>
                      ) : (
                        <>
                          <Coffee className="h-5 w-5 mr-2" />
                          Pausa
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => setDialogConfirm({ open: true, accion: 'salida', observaciones: '' })}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Fichar Salida
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    className="px-12 py-6 text-lg"
                    onClick={() => setDialogConfirm({ open: true, accion: 'entrada', observaciones: '' })}
                  >
                    <LogIn className="h-6 w-6 mr-3" />
                    Fichar Entrada
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadisticas del Mes */}
        {resumenMes && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{resumenMes.totalHoras.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground">Horas este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{resumenMes.diasTrabajados}</p>
                <p className="text-sm text-muted-foreground">Dias trabajados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{resumenMes.horasExtra.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground">Horas extra</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fichajes Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ultimos fichajes</CardTitle>
          </CardHeader>
          <CardContent>
            {fichajesRecientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No hay fichajes recientes</p>
            ) : (
              <div className="space-y-3">
                {fichajesRecientes.map((fichaje) => (
                  <div key={fichaje._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-bold">{formatFecha(fichaje.fecha)}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {fichaje.horaEntrada && (
                            <span className="text-sm">
                              <LogIn className="inline h-3 w-3 mr-1" />
                              {formatHora(fichaje.horaEntrada)}
                            </span>
                          )}
                          {fichaje.horaSalida && (
                            <span className="text-sm">
                              <LogOut className="inline h-3 w-3 mr-1" />
                              {formatHora(fichaje.horaSalida)}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {TIPOS_FICHAJE.find(t => t.value === fichaje.tipo)?.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={fichaje.estado === 'cerrado' || fichaje.estado === 'aprobado' ? 'default' : 'secondary'}
                        className={
                          fichaje.estado === 'abierto' ? 'bg-blue-100 text-blue-800' :
                          fichaje.estado === 'cerrado' ? 'bg-green-100 text-green-800' :
                          fichaje.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                          fichaje.estado === 'rechazado' ? 'bg-red-100 text-red-800' : ''
                        }
                      >
                        {ESTADOS_FICHAJE.find(e => e.value === fichaje.estado)?.label}
                      </Badge>
                      {fichaje.horasTrabajadas !== undefined && fichaje.horasTrabajadas > 0 && (
                        <p className="text-sm font-mono mt-1">{fichaje.horasTrabajadas.toFixed(1)}h</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmacion */}
        <Dialog open={dialogConfirm.open} onOpenChange={(o) => setDialogConfirm({ ...dialogConfirm, open: o })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogConfirm.accion === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Salida'}
              </DialogTitle>
              <DialogDescription>
                {dialogConfirm.accion === 'entrada'
                  ? `Vas a fichar tu entrada como "${TIPOS_FICHAJE.find(t => t.value === tipoSeleccionado)?.label}"`
                  : 'Vas a fichar tu salida de hoy'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Observaciones (opcional)</label>
              <Textarea
                placeholder="Añade observaciones si es necesario..."
                value={dialogConfirm.observaciones}
                onChange={(e) => setDialogConfirm({ ...dialogConfirm, observaciones: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogConfirm({ open: false, accion: 'entrada', observaciones: '' })}>
                Cancelar
              </Button>
              <Button onClick={handleFichar}>
                {dialogConfirm.accion === 'entrada' ? (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Fichar Entrada
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Fichar Salida
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
