'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  tareasService,
  Tarea,
  UpdateTareaDTO,
  TipoTarea,
  PrioridadTarea,
  EstadoTarea,
  RecurrenciaTarea,
} from '@/services/tareas.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  User,
  Building2,
  Briefcase,
  Bell,
  RefreshCw,
  Tag,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  Play,
  Pause,
  XCircle,
  MessageSquare,
  Send,
  AlertTriangle,
  ExternalLink,
  History,
  Repeat,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/services/api'
import { formatDate, cn } from '@/lib/utils'

// ============================================
// CONSTANTES
// ============================================

const TIPOS = [
  { value: TipoTarea.GENERAL, label: 'General' },
  { value: TipoTarea.RECORDATORIO, label: 'Recordatorio' },
  { value: TipoTarea.SEGUIMIENTO_CLIENTE, label: 'Seguimiento Cliente' },
  { value: TipoTarea.SEGUIMIENTO_PROVEEDOR, label: 'Seguimiento Proveedor' },
  { value: TipoTarea.COBRO, label: 'Cobro' },
  { value: TipoTarea.PAGO, label: 'Pago' },
  { value: TipoTarea.LLAMADA, label: 'Llamada' },
  { value: TipoTarea.REUNION, label: 'Reunion' },
  { value: TipoTarea.VISITA, label: 'Visita' },
  { value: TipoTarea.REVISION, label: 'Revision' },
  { value: TipoTarea.MANTENIMIENTO, label: 'Mantenimiento' },
  { value: TipoTarea.INVENTARIO, label: 'Inventario' },
  { value: TipoTarea.ENTREGA, label: 'Entrega' },
  { value: TipoTarea.OTRO, label: 'Otro' },
]

const PRIORIDADES = [
  { value: PrioridadTarea.BAJA, label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  { value: PrioridadTarea.NORMAL, label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: PrioridadTarea.ALTA, label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: PrioridadTarea.URGENTE, label: 'Urgente', color: 'bg-red-100 text-red-800' },
]

const RECURRENCIAS = [
  { value: RecurrenciaTarea.NINGUNA, label: 'Sin recurrencia' },
  { value: RecurrenciaTarea.DIARIA, label: 'Diaria' },
  { value: RecurrenciaTarea.SEMANAL, label: 'Semanal' },
  { value: RecurrenciaTarea.QUINCENAL, label: 'Quincenal' },
  { value: RecurrenciaTarea.MENSUAL, label: 'Mensual' },
  { value: RecurrenciaTarea.TRIMESTRAL, label: 'Trimestral' },
  { value: RecurrenciaTarea.ANUAL, label: 'Anual' },
]

const COLORES = [
  { value: 'blue', bg: 'bg-blue-500' },
  { value: 'green', bg: 'bg-green-500' },
  { value: 'yellow', bg: 'bg-yellow-500' },
  { value: 'orange', bg: 'bg-orange-500' },
  { value: 'red', bg: 'bg-red-500' },
  { value: 'purple', bg: 'bg-purple-500' },
  { value: 'pink', bg: 'bg-pink-500' },
  { value: 'gray', bg: 'bg-gray-500' },
]

// ============================================
// HELPERS
// ============================================

function getEstadoColor(estado: EstadoTarea): string {
  switch (estado) {
    case EstadoTarea.PENDIENTE:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case EstadoTarea.EN_PROGRESO:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case EstadoTarea.COMPLETADA:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case EstadoTarea.CANCELADA:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    case EstadoTarea.VENCIDA:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPrioridadColor(prioridad: PrioridadTarea): string {
  switch (prioridad) {
    case PrioridadTarea.BAJA:
      return 'bg-gray-100 text-gray-800'
    case PrioridadTarea.NORMAL:
      return 'bg-blue-100 text-blue-800'
    case PrioridadTarea.ALTA:
      return 'bg-orange-100 text-orange-800'
    case PrioridadTarea.URGENTE:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// ============================================
// COMPONENTE
// ============================================

export default function TareaDetallePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const editParam = searchParams.get('edit')

  const [tarea, setTarea] = useState<Tarea | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(editParam === 'true')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Estados para edicion
  const [formData, setFormData] = useState<UpdateTareaDTO>({})

  // Comentarios
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  // Relaciones (para selectores)
  const [clientes, setClientes] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [personal, setPersonal] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])

  // Cargar tarea
  const cargarTarea = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await tareasService.obtenerPorId(id)
      if (response.success) {
        setTarea(response.data)
        setFormData({
          titulo: response.data.titulo,
          descripcion: response.data.descripcion,
          tipo: response.data.tipo,
          prioridad: response.data.prioridad,
          fechaVencimiento: response.data.fechaVencimiento
            ? new Date(response.data.fechaVencimiento).toISOString().slice(0, 16)
            : '',
          fechaRecordatorio: response.data.fechaRecordatorio
            ? new Date(response.data.fechaRecordatorio).toISOString().slice(0, 16)
            : '',
          fechaInicio: response.data.fechaInicio
            ? new Date(response.data.fechaInicio).toISOString().slice(0, 16)
            : '',
          recurrencia: response.data.recurrencia,
          asignadoAId: response.data.asignadoAId || '',
          departamentoId: response.data.departamentoId || '',
          clienteId: response.data.clienteId || '',
          proveedorId: response.data.proveedorId || '',
          proyectoId: response.data.proyectoId || '',
          horasEstimadas: response.data.horasEstimadas,
          horasReales: response.data.horasReales,
          porcentajeCompletado: response.data.porcentajeCompletado,
          enviarRecordatorio: response.data.enviarRecordatorio,
          notificarAlCompletar: response.data.notificarAlCompletar,
          etiquetas: response.data.etiquetas,
          color: response.data.color,
        })
      }
    } catch (error) {
      console.error('Error cargando tarea:', error)
      toast.error('Error al cargar la tarea')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  // Cargar relaciones
  const cargarRelaciones = useCallback(async () => {
    try {
      const [clientesRes, proveedoresRes, personalRes, depRes, proyectosRes] = await Promise.all([
        api.get('/clientes', { params: { limit: 100, activo: true } }).catch(() => ({ data: { data: [] } })),
        api.get('/proveedores', { params: { limit: 100, activo: true } }).catch(() => ({ data: { data: [] } })),
        api.get('/personal', { params: { limit: 100, activo: true } }).catch(() => ({ data: { data: [] } })),
        api.get('/departamentos').catch(() => ({ data: { data: [] } })),
        api.get('/proyectos', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })),
      ])

      setClientes(clientesRes.data.data || [])
      setProveedores(proveedoresRes.data.data || [])
      setPersonal(personalRes.data.data || [])
      setDepartamentos(depRes.data.data || [])
      setProyectos(proyectosRes.data.data || [])
    } catch (error) {
      console.error('Error cargando relaciones:', error)
    }
  }, [])

  useEffect(() => {
    cargarTarea()
    cargarRelaciones()
  }, [cargarTarea, cargarRelaciones])

  // Handlers
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleGuardar = async () => {
    try {
      setIsSubmitting(true)

      const dataToSend: UpdateTareaDTO = {
        ...formData,
        asignadoAId: formData.asignadoAId || undefined,
        departamentoId: formData.departamentoId || undefined,
        clienteId: formData.clienteId || undefined,
        proveedorId: formData.proveedorId || undefined,
        proyectoId: formData.proyectoId || undefined,
        fechaVencimiento: formData.fechaVencimiento || undefined,
        fechaRecordatorio: formData.fechaRecordatorio || undefined,
        fechaInicio: formData.fechaInicio || undefined,
      }

      const response = await tareasService.actualizar(id, dataToSend)

      if (response.success) {
        setTarea(response.data)
        setIsEditing(false)
        toast.success('Tarea actualizada correctamente')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar la tarea')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCambiarEstado = async (estado: EstadoTarea) => {
    try {
      const response = await tareasService.cambiarEstado(id, { estado })
      if (response.success) {
        setTarea(response.data)
        toast.success(`Estado cambiado a ${tareasService.getEstadoLabel(estado)}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim()) return

    try {
      setEnviandoComentario(true)
      const response = await tareasService.agregarComentario(id, nuevoComentario)
      if (response.success) {
        setTarea(response.data)
        setNuevoComentario('')
        toast.success('Comentario agregado')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al agregar comentario')
    } finally {
      setEnviandoComentario(false)
    }
  }

  const handleEliminar = async () => {
    try {
      await tareasService.eliminar(id)
      toast.success('Tarea eliminada')
      router.push('/tareas')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!tarea) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Tarea no encontrada</p>
          <Button onClick={() => router.push('/tareas')}>Volver a tareas</Button>
        </div>
      </DashboardLayout>
    )
  }

  const isVencida = tareasService.isVencida(tarea)
  const isCompleted = tarea.estado === EstadoTarea.COMPLETADA

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                {tarea.color && (
                  <div
                    className={cn('w-3 h-3 rounded-full', `bg-${tarea.color}-500`)}
                    style={{ backgroundColor: tarea.color }}
                  />
                )}
                <h1 className={cn(
                  'text-2xl font-bold',
                  isCompleted && 'line-through text-muted-foreground'
                )}>
                  {tarea.titulo}
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn(getEstadoColor(tarea.estado))}>
                  {tareasService.getEstadoLabel(tarea.estado)}
                </Badge>
                <Badge className={cn(getPrioridadColor(tarea.prioridad))}>
                  {tareasService.getPrioridadLabel(tarea.prioridad)}
                </Badge>
                <Badge variant="outline">
                  {tareasService.getTipoLabel(tarea.tipo)}
                </Badge>
                {isVencida && !isCompleted && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Vencida
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    cargarTarea()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleGuardar} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Descripcion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descripcion
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titulo</Label>
                      <Input
                        value={formData.titulo}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripcion</Label>
                      <Textarea
                        value={formData.descripcion}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={formData.tipo}
                          onValueChange={(value) => handleChange('tipo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prioridad</Label>
                        <Select
                          value={formData.prioridad}
                          onValueChange={(value) => handleChange('prioridad', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORIDADES.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Recurrencia</Label>
                        <Select
                          value={formData.recurrencia}
                          onValueChange={(value) => handleChange('recurrencia', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RECURRENCIAS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tarea.descripcion ? (
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {tarea.descripcion}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">Sin descripcion</p>
                    )}
                    {tarea.recurrencia !== RecurrenciaTarea.NINGUNA && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Repeat className="h-4 w-4" />
                        <span>Tarea recurrente: {tareasService.getRecurrenciaLabel(tarea.recurrencia)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progreso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Progreso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completado</span>
                    <span>{tarea.porcentajeCompletado}%</span>
                  </div>
                  {isEditing ? (
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.porcentajeCompletado}
                      onChange={(e) => handleChange('porcentajeCompletado', parseInt(e.target.value))}
                      className="w-full"
                    />
                  ) : (
                    <Progress value={tarea.porcentajeCompletado} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Horas Estimadas</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.horasEstimadas || ''}
                        onChange={(e) =>
                          handleChange('horasEstimadas', e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    ) : (
                      <p className="text-lg font-medium">{tarea.horasEstimadas || 0}h</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Horas Reales</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.horasReales || ''}
                        onChange={(e) =>
                          handleChange('horasReales', e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    ) : (
                      <p className="text-lg font-medium">{tarea.horasReales || 0}h</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comentarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comentarios ({tarea.comentarios?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAgregarComentario}
                    disabled={enviandoComentario || !nuevoComentario.trim()}
                  >
                    {enviandoComentario ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {tarea.comentarios && tarea.comentarios.length > 0 && (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {tarea.comentarios.map((comentario, index) => (
                        <div
                          key={comentario._id || index}
                          className="p-3 bg-muted rounded-lg space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {comentario.usuarioNombre}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comentario.fecha)}
                            </span>
                          </div>
                          <p className="text-sm">{comentario.texto}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Acciones rapidas */}
            {!isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tarea.estado !== EstadoTarea.EN_PROGRESO && tarea.estado !== EstadoTarea.COMPLETADA && (
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => handleCambiarEstado(EstadoTarea.EN_PROGRESO)}
                    >
                      <Play className="h-4 w-4 mr-2 text-blue-500" />
                      Iniciar
                    </Button>
                  )}
                  {tarea.estado === EstadoTarea.EN_PROGRESO && (
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => handleCambiarEstado(EstadoTarea.PENDIENTE)}
                    >
                      <Pause className="h-4 w-4 mr-2 text-yellow-500" />
                      Pausar
                    </Button>
                  )}
                  {tarea.estado !== EstadoTarea.COMPLETADA && (
                    <Button
                      className="w-full justify-start bg-green-600 hover:bg-green-700"
                      onClick={() => handleCambiarEstado(EstadoTarea.COMPLETADA)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Completar
                    </Button>
                  )}
                  {tarea.estado !== EstadoTarea.CANCELADA && tarea.estado !== EstadoTarea.COMPLETADA && (
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => handleCambiarEstado(EstadoTarea.CANCELADA)}
                    >
                      <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                      Cancelar
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Fecha de Inicio</Label>
                      <Input
                        type="datetime-local"
                        value={formData.fechaInicio}
                        onChange={(e) => handleChange('fechaInicio', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Vencimiento</Label>
                      <Input
                        type="datetime-local"
                        value={formData.fechaVencimiento}
                        onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Recordatorio</Label>
                      <Input
                        type="datetime-local"
                        value={formData.fechaRecordatorio}
                        onChange={(e) => handleChange('fechaRecordatorio', e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creada:</span>
                      <span>{formatDate(tarea.fechaCreacion)}</span>
                    </div>
                    {tarea.fechaInicio && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inicio:</span>
                        <span>{formatDate(tarea.fechaInicio)}</span>
                      </div>
                    )}
                    {tarea.fechaVencimiento && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vencimiento:</span>
                        <span className={cn(isVencida && 'text-red-600 font-medium')}>
                          {formatDate(tarea.fechaVencimiento)}
                        </span>
                      </div>
                    )}
                    {tarea.fechaRecordatorio && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recordatorio:</span>
                        <span>{formatDate(tarea.fechaRecordatorio)}</span>
                      </div>
                    )}
                    {tarea.fechaCompletada && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completada:</span>
                        <span className="text-green-600">{formatDate(tarea.fechaCompletada)}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Asignacion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Asignacion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label>Asignado a</Label>
                      <Select
                        value={formData.asignadoAId || 'none'}
                        onValueChange={(value) => handleChange('asignadoAId', value === 'none' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {personal.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.nombreCompleto || `${p.nombre} ${p.apellidos}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <Select
                        value={formData.departamentoId || 'none'}
                        onValueChange={(value) => handleChange('departamentoId', value === 'none' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin departamento</SelectItem>
                          {departamentos.map((d) => (
                            <SelectItem key={d._id} value={d._id}>
                              {d.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asignado a:</span>
                      <span>{tarea.asignadoANombre || 'Sin asignar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Departamento:</span>
                      <span>{tarea.departamentoNombre || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creado por:</span>
                      <span>{tarea.creadoPorNombre}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Relaciones */}
            {(tarea.clienteNombre || tarea.proveedorNombre || tarea.proyectoNombre || tarea.documentoCodigo) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Relaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {tarea.clienteNombre && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Cliente:</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => router.push(`/clientes/${tarea.clienteId}`)}
                      >
                        {tarea.clienteNombre}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                  {tarea.proveedorNombre && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Proveedor:</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => router.push(`/proveedores/${tarea.proveedorId}`)}
                      >
                        {tarea.proveedorNombre}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                  {tarea.proyectoNombre && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Proyecto:</span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => router.push(`/proyectos/${tarea.proyectoId}`)}
                      >
                        {tarea.proyectoNombre}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                  {tarea.documentoCodigo && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Documento:</span>
                      <span>{tarea.documentoTipo}: {tarea.documentoCodigo}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Etiquetas */}
            {tarea.etiquetas && tarea.etiquetas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Etiquetas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tarea.etiquetas.map((etiqueta) => (
                      <Badge key={etiqueta} variant="outline">
                        {etiqueta}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Dialog eliminar */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Tarea</DialogTitle>
              <DialogDescription>
                ¿Estas seguro de que deseas eliminar esta tarea? Esta accion no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleEliminar}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
