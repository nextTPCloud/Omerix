'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  History,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Bell,
  Users,
  FileText,
  Send,
  Check,
  X,
  Edit,
  Plus,
  Clock,
  ArrowRight,
  User,
  RefreshCw,
  Copy,
  Download,
  Printer,
} from 'lucide-react'
import { IHistorialPresupuesto, INotaSeguimiento } from '@/types/presupuesto.types'
import { cn } from '@/lib/utils'

interface PresupuestoHistorialProps {
  historial: IHistorialPresupuesto[]
  notasSeguimiento: INotaSeguimiento[]
  contadorEnvios?: number
  fechaEnvio?: string | Date
  fechaRespuesta?: string | Date
  fechaCreacion: string | Date
  onAddNota?: (nota: Omit<INotaSeguimiento, '_id' | 'fecha' | 'usuarioId'>) => Promise<void>
}

// Iconos según el tipo de acción
const getAccionIcon = (accion: string) => {
  const accionLower = accion.toLowerCase()
  if (accionLower.includes('creación') || accionLower.includes('creado')) return <FileText className="h-4 w-4" />
  if (accionLower.includes('envío') || accionLower.includes('email')) return <Mail className="h-4 w-4" />
  if (accionLower.includes('reenvío')) return <RefreshCw className="h-4 w-4" />
  if (accionLower.includes('modificación') || accionLower.includes('actualizado')) return <Edit className="h-4 w-4" />
  if (accionLower.includes('aceptado')) return <Check className="h-4 w-4" />
  if (accionLower.includes('rechazado')) return <X className="h-4 w-4" />
  if (accionLower.includes('duplica')) return <Copy className="h-4 w-4" />
  if (accionLower.includes('revisión')) return <RefreshCw className="h-4 w-4" />
  if (accionLower.includes('estado')) return <ArrowRight className="h-4 w-4" />
  if (accionLower.includes('imprimir') || accionLower.includes('impreso')) return <Printer className="h-4 w-4" />
  if (accionLower.includes('descargar') || accionLower.includes('pdf')) return <Download className="h-4 w-4" />
  return <History className="h-4 w-4" />
}

// Color según el tipo de acción
const getAccionColor = (accion: string) => {
  const accionLower = accion.toLowerCase()
  if (accionLower.includes('creación') || accionLower.includes('creado')) return 'bg-green-500'
  if (accionLower.includes('envío') || accionLower.includes('email')) return 'bg-blue-500'
  if (accionLower.includes('aceptado')) return 'bg-emerald-500'
  if (accionLower.includes('rechazado')) return 'bg-red-500'
  if (accionLower.includes('modificación')) return 'bg-amber-500'
  return 'bg-gray-500'
}

// Iconos para notas de seguimiento
const getTipoNotaIcon = (tipo: string) => {
  switch (tipo) {
    case 'llamada': return <Phone className="h-4 w-4" />
    case 'email': return <Mail className="h-4 w-4" />
    case 'reunion': return <Users className="h-4 w-4" />
    case 'recordatorio': return <Bell className="h-4 w-4" />
    default: return <MessageSquare className="h-4 w-4" />
  }
}

const getTipoNotaLabel = (tipo: string) => {
  switch (tipo) {
    case 'llamada': return 'Llamada'
    case 'email': return 'Email'
    case 'reunion': return 'Reunión'
    case 'recordatorio': return 'Recordatorio'
    default: return 'Nota'
  }
}

const getTipoNotaColor = (tipo: string) => {
  switch (tipo) {
    case 'llamada': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'reunion': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'recordatorio': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export function PresupuestoHistorial({
  historial,
  notasSeguimiento,
  contadorEnvios = 0,
  fechaEnvio,
  fechaRespuesta,
  fechaCreacion,
  onAddNota,
}: PresupuestoHistorialProps) {
  const [showAddNota, setShowAddNota] = useState(false)
  const [nuevaNota, setNuevaNota] = useState({
    tipo: 'nota' as INotaSeguimiento['tipo'],
    contenido: '',
    resultado: '',
    proximaAccion: '',
    fechaProximaAccion: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays} días`
    return formatDate(date)
  }

  // Calcular tiempo de respuesta
  const calcularTiempoRespuesta = () => {
    if (!fechaEnvio || !fechaRespuesta) return null
    const envio = new Date(fechaEnvio)
    const respuesta = new Date(fechaRespuesta)
    const diffMs = respuesta.getTime() - envio.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays === 0) return `${diffHours} horas`
    if (diffDays === 1) return '1 día'
    return `${diffDays} días`
  }

  const handleAddNota = async () => {
    if (!onAddNota || !nuevaNota.contenido.trim()) return

    setIsSubmitting(true)
    try {
      await onAddNota({
        tipo: nuevaNota.tipo,
        contenido: nuevaNota.contenido,
        resultado: nuevaNota.resultado || undefined,
        proximaAccion: nuevaNota.proximaAccion || undefined,
        fechaProximaAccion: nuevaNota.fechaProximaAccion || undefined,
      })
      setShowAddNota(false)
      setNuevaNota({
        tipo: 'nota',
        contenido: '',
        resultado: '',
        proximaAccion: '',
        fechaProximaAccion: '',
      })
    } catch (error) {
      console.error('Error al añadir nota:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const tiempoRespuesta = calcularTiempoRespuesta()

  // Ordenar historial por fecha descendente
  const historialOrdenado = [...historial].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  // Ordenar notas por fecha descendente
  const notasOrdenadas = [...notasSeguimiento].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial y Seguimiento
            </CardTitle>
            <CardDescription>
              Registro de actividad y notas de seguimiento
            </CardDescription>
          </div>
          {/* Estadísticas rápidas */}
          <div className="flex gap-4 text-sm">
            {contadorEnvios > 0 && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{contadorEnvios}</span>
                <span className="text-muted-foreground">envíos</span>
              </div>
            )}
            {tiempoRespuesta && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{tiempoRespuesta}</span>
                <span className="text-muted-foreground">respuesta</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="historial" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="historial" className="gap-2">
              <History className="h-4 w-4" />
              Historial ({historial.length})
            </TabsTrigger>
            <TabsTrigger value="notas" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Seguimiento ({notasSeguimiento.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Historial */}
          <TabsContent value="historial" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {historialOrdenado.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mb-2 opacity-20" />
                  <p>No hay historial registrado</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Línea de tiempo */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {historialOrdenado.map((item, index) => {
                      const usuario = item.usuarioId && typeof item.usuarioId === 'object'
                        ? item.usuarioId.nombre
                        : 'Usuario'

                      return (
                        <div key={item._id || index} className="relative flex gap-4 pl-2">
                          {/* Punto en la línea de tiempo */}
                          <div className={cn(
                            "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white",
                            getAccionColor(item.accion)
                          )}>
                            {getAccionIcon(item.accion)}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{item.accion}</p>
                                {item.descripcion && (
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {item.descripcion}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                <p>{formatTimeAgo(item.fecha)}</p>
                                <p>{formatDateTime(item.fecha)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{usuario}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab Notas de Seguimiento */}
          <TabsContent value="notas" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowAddNota(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Nota
              </Button>
            </div>

            <ScrollArea className="h-[350px] pr-4">
              {notasOrdenadas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                  <p>No hay notas de seguimiento</p>
                  <p className="text-sm">Añade notas de llamadas, emails o reuniones</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notasOrdenadas.map((nota, index) => {
                    const usuario = nota.usuarioId && typeof nota.usuarioId === 'object'
                      ? nota.usuarioId.nombre
                      : 'Usuario'

                    return (
                      <Card key={nota._id || index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              getTipoNotaColor(nota.tipo)
                            )}>
                              {getTipoNotaIcon(nota.tipo)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={getTipoNotaColor(nota.tipo)}>
                                  {getTipoNotaLabel(nota.tipo)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(nota.fecha)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm">{nota.contenido}</p>
                              {nota.resultado && (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  <span className="font-medium">Resultado: </span>
                                  {nota.resultado}
                                </div>
                              )}
                              {nota.proximaAccion && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                  <Bell className="h-3 w-3" />
                                  <span>Próxima acción: {nota.proximaAccion}</span>
                                  {nota.fechaProximaAccion && (
                                    <span className="text-muted-foreground">
                                      ({formatDate(nota.fechaProximaAccion)})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{usuario}</span>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Diálogo para añadir nota */}
      <Dialog open={showAddNota} onOpenChange={setShowAddNota}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Nueva Nota de Seguimiento
            </DialogTitle>
            <DialogDescription>
              Registra llamadas, emails, reuniones o notas sobre este presupuesto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de seguimiento</Label>
              <Select
                value={nuevaNota.tipo}
                onValueChange={(value) => setNuevaNota(prev => ({ ...prev, tipo: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llamada">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Llamada telefónica
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="reunion">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Reunión
                    </div>
                  </SelectItem>
                  <SelectItem value="recordatorio">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Recordatorio
                    </div>
                  </SelectItem>
                  <SelectItem value="nota">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Nota general
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contenido *</Label>
              <Textarea
                value={nuevaNota.contenido}
                onChange={(e) => setNuevaNota(prev => ({ ...prev, contenido: e.target.value }))}
                placeholder="Describe el contenido de la comunicación..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Resultado (opcional)</Label>
              <Textarea
                value={nuevaNota.resultado}
                onChange={(e) => setNuevaNota(prev => ({ ...prev, resultado: e.target.value }))}
                placeholder="¿Cuál fue el resultado?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Próxima acción</Label>
                <Textarea
                  value={nuevaNota.proximaAccion}
                  onChange={(e) => setNuevaNota(prev => ({ ...prev, proximaAccion: e.target.value }))}
                  placeholder="¿Qué hay que hacer?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha próxima acción</Label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={nuevaNota.fechaProximaAccion}
                  onChange={(e) => setNuevaNota(prev => ({ ...prev, fechaProximaAccion: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNota(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddNota}
              disabled={!nuevaNota.contenido.trim() || isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Nota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
