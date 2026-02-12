"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Bell,
  BellRing,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Filter,
  Mail,
  Phone,
  Plus,
  Search,
  Target,
  Trash2,
  Users,
  XCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Settings,
  ChevronRight,
  MoreVertical,
  Eye,
  Pause,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import recordatoriosService, {
  IRecordatorio,
  TipoRecordatorio,
  PrioridadRecordatorio,
  EstadoRecordatorio,
  CanalNotificacion,
  Estadisticas,
} from '@/services/recordatorios.service'


// ============================================
// HELPERS
// ============================================

const iconosPorTipo: Record<string, any> = {
  actividad_crm: Target,
  seguimiento_lead: Users,
  oportunidad_cierre: TrendingUp,
  presupuesto_expiracion: FileText,
  presupuesto_seguimiento: FileText,
  factura_vencimiento: AlertTriangle,
  cobro_pendiente: AlertTriangle,
  parte_trabajo: Clock,
  tarea_proyecto: CheckCircle,
  cita: Calendar,
  reunion: Users,
  llamada: Phone,
  personalizado: Bell,
}

const coloresPorPrioridad: Record<string, string> = {
  baja: 'bg-slate-100 text-slate-600 border-slate-200',
  normal: 'bg-blue-100 text-blue-600 border-blue-200',
  alta: 'bg-amber-100 text-amber-600 border-amber-200',
  urgente: 'bg-red-100 text-red-600 border-red-200',
}

const coloresBadgePrioridad: Record<string, string> = {
  baja: 'bg-slate-500',
  normal: 'bg-blue-500',
  alta: 'bg-amber-500',
  urgente: 'bg-red-500',
}

const formatFecha = (fecha: string) => {
  const date = new Date(fecha)
  const ahora = new Date()
  const diffDias = Math.floor((date.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDias === 0) return 'Hoy'
  if (diffDias === 1) return 'Manana'
  if (diffDias === -1) return 'Ayer'
  if (diffDias > 1 && diffDias <= 7) return `En ${diffDias} dias`
  if (diffDias < -1 && diffDias >= -7) return `Hace ${Math.abs(diffDias)} dias`

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatHora = (fecha: string) => {
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================
// COMPONENTES
// ============================================

function RecordatorioCard({
  recordatorio,
  onAccion,
}: {
  recordatorio: IRecordatorio
  onAccion: (accion: string, id: string, data?: any) => void
}) {
  const Icono = iconosPorTipo[recordatorio.tipo] || Bell
  const esVencido = new Date(recordatorio.fechaProgramada) < new Date()
  const [posponerDialogOpen, setPosponerDialogOpen] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')

  return (
    <div
      className={`group flex items-start gap-4 p-4 border rounded-lg transition-all hover:shadow-md ${
        recordatorio.estado === 'completado'
          ? 'bg-slate-50 opacity-60'
          : recordatorio.estado === 'descartado'
          ? 'bg-slate-50 opacity-40'
          : esVencido
          ? 'bg-red-50 border-red-200'
          : 'bg-white'
      }`}
    >
      {/* Icono */}
      <div
        className={`p-3 rounded-lg ${coloresPorPrioridad[recordatorio.prioridad]}`}
        style={recordatorio.color ? { backgroundColor: `${recordatorio.color}20`, color: recordatorio.color } : {}}
      >
        <Icono className="h-5 w-5" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className={`font-medium ${recordatorio.estado === 'completado' ? 'line-through text-slate-500' : ''}`}>
              {recordatorio.titulo}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2">{recordatorio.mensaje}</p>
          </div>

          <Badge className={coloresBadgePrioridad[recordatorio.prioridad]}>
            {recordatorio.prioridad}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatFecha(recordatorio.fechaProgramada)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatHora(recordatorio.fechaProgramada)}
          </span>
          {recordatorio.entidadNombre && (
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {recordatorio.entidadNombre}
            </span>
          )}
          {recordatorio.repetir && (
            <Badge variant="outline" className="text-xs h-5">
              Repetitivo
            </Badge>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {recordatorio.estado !== 'completado' && recordatorio.estado !== 'descartado' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAccion('completar', recordatorio._id)}
              title="Completar"
            >
              <Check className="h-4 w-4" />
            </Button>

            <Dialog open={posponerDialogOpen} onOpenChange={setPosponerDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" title="Posponer">
                  <Pause className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Posponer recordatorio</DialogTitle>
                  <DialogDescription>Selecciona la nueva fecha para este recordatorio</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label>Nueva fecha y hora</Label>
                  <Input
                    type="datetime-local"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPosponerDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      if (nuevaFecha) {
                        onAccion('posponer', recordatorio._id, { nuevaFecha })
                        setPosponerDialogOpen(false)
                      }
                    }}
                  >
                    Posponer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {recordatorio.estado !== 'leido' && recordatorio.estado !== 'completado' && (
              <DropdownMenuItem onClick={() => onAccion('leer', recordatorio._id)}>
                <Eye className="h-4 w-4 mr-2" />
                Marcar como leido
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onAccion('descartar', recordatorio._id)}>
              <XCircle className="h-4 w-4 mr-2" />
              Descartar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAccion('eliminar', recordatorio._id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function NuevoRecordatorioDialog({
  open,
  onOpenChange,
  onCrear,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCrear: () => void
}) {
  const [formData, setFormData] = useState({
    tipo: TipoRecordatorio.PERSONALIZADO,
    prioridad: PrioridadRecordatorio.NORMAL,
    titulo: '',
    mensaje: '',
    fechaProgramada: '',
    canales: [CanalNotificacion.APP],
    repetir: false,
    frecuenciaRepeticion: '' as '' | 'diario' | 'semanal' | 'mensual' | 'anual',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await recordatoriosService.crear({
        ...formData,
        frecuenciaRepeticion: formData.repetir ? formData.frecuenciaRepeticion as any : undefined,
      })
      toast.success('Recordatorio creado')
      onCrear()
      onOpenChange(false)
      setFormData({
        tipo: TipoRecordatorio.PERSONALIZADO,
        prioridad: PrioridadRecordatorio.NORMAL,
        titulo: '',
        mensaje: '',
        fechaProgramada: '',
        canales: [CanalNotificacion.APP],
        repetir: false,
        frecuenciaRepeticion: '',
      })
    } catch (error) {
      toast.error('Error al crear recordatorio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo recordatorio</DialogTitle>
          <DialogDescription>Crea un recordatorio personalizado</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v as TipoRecordatorio })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TipoRecordatorio.PERSONALIZADO}>Personalizado</SelectItem>
                  <SelectItem value={TipoRecordatorio.CITA}>Cita</SelectItem>
                  <SelectItem value={TipoRecordatorio.REUNION}>Reunion</SelectItem>
                  <SelectItem value={TipoRecordatorio.LLAMADA}>Llamada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridad</Label>
              <Select
                value={formData.prioridad}
                onValueChange={(v) => setFormData({ ...formData, prioridad: v as PrioridadRecordatorio })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PrioridadRecordatorio.BAJA}>Baja</SelectItem>
                  <SelectItem value={PrioridadRecordatorio.NORMAL}>Normal</SelectItem>
                  <SelectItem value={PrioridadRecordatorio.ALTA}>Alta</SelectItem>
                  <SelectItem value={PrioridadRecordatorio.URGENTE}>Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Titulo</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Titulo del recordatorio"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <Label>Mensaje</Label>
            <Textarea
              value={formData.mensaje}
              onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
              placeholder="Descripcion del recordatorio"
              className="mt-1.5"
              rows={3}
              required
            />
          </div>

          <div>
            <Label>Fecha y hora</Label>
            <Input
              type="datetime-local"
              value={formData.fechaProgramada}
              onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
              className="mt-1.5"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="repetir"
                checked={formData.repetir}
                onChange={(e) => setFormData({ ...formData, repetir: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="repetir">Repetir</Label>
            </div>

            {formData.repetir && (
              <Select
                value={formData.frecuenciaRepeticion}
                onValueChange={(v) => setFormData({ ...formData, frecuenciaRepeticion: v as any })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diario</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Notificar por</Label>
            <div className="flex gap-4 mt-2">
              {[
                { value: CanalNotificacion.APP, label: 'App', icon: Bell },
                { value: CanalNotificacion.EMAIL, label: 'Email', icon: Mail },
              ].map((canal) => (
                <label key={canal.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canales.includes(canal.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, canales: [...formData.canales, canal.value] })
                      } else {
                        setFormData({
                          ...formData,
                          canales: formData.canales.filter((c) => c !== canal.value),
                        })
                      }
                    }}
                    className="rounded"
                  />
                  <canal.icon className="h-4 w-4" />
                  {canal.label}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear recordatorio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function RecordatoriosPage() {
  const router = useRouter()
  const [recordatorios, setRecordatorios] = useState<IRecordatorio[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [tabActiva, setTabActiva] = useState('pendientes')
  const [filtros, setFiltros] = useState({
    prioridad: 'todas',
    tipo: 'todos',
    busqueda: '',
  })
  const [dialogNuevoOpen, setDialogNuevoOpen] = useState(false)

  const cargarDatos = async () => {
    try {
      setLoading(true)

      const [recordatoriosRes, statsRes] = await Promise.all([
        recordatoriosService.listar({
          estado:
            tabActiva === 'pendientes'
              ? EstadoRecordatorio.PENDIENTE
              : tabActiva === 'completados'
              ? EstadoRecordatorio.COMPLETADO
              : undefined,
          prioridad: filtros.prioridad !== 'todas' ? (filtros.prioridad as PrioridadRecordatorio) : undefined,
          tipo: filtros.tipo !== 'todos' ? (filtros.tipo as TipoRecordatorio) : undefined,
          limite: 50,
        }),
        recordatoriosService.getEstadisticas(),
      ])

      setRecordatorios(recordatoriosRes.recordatorios)
      setEstadisticas(statsRes)
    } catch (error) {
      toast.error('Error al cargar recordatorios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [tabActiva, filtros.prioridad, filtros.tipo])

  const handleAccion = async (accion: string, id: string, data?: any) => {
    try {
      switch (accion) {
        case 'completar':
          await recordatoriosService.completar(id)
          toast.success('Recordatorio completado')
          break
        case 'leer':
          await recordatoriosService.marcarLeido(id)
          toast.success('Marcado como leido')
          break
        case 'posponer':
          await recordatoriosService.posponer(id, data.nuevaFecha)
          toast.success('Recordatorio pospuesto')
          break
        case 'descartar':
          await recordatoriosService.descartar(id)
          toast.success('Recordatorio descartado')
          break
        case 'eliminar':
          await recordatoriosService.eliminar(id)
          toast.success('Recordatorio eliminado')
          break
      }
      cargarDatos()
    } catch (error) {
      toast.error('Error al realizar la accion')
    }
  }

  const recordatoriosFiltrados = recordatorios.filter((r) => {
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
      return (
        r.titulo.toLowerCase().includes(busqueda) ||
        r.mensaje.toLowerCase().includes(busqueda) ||
        r.entidadNombre?.toLowerCase().includes(busqueda)
      )
    }
    return true
  })

  return (
    
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="h-7 w-7 text-blue-600" />
            Recordatorios
          </h1>
          <p className="text-slate-500">Gestiona tus alertas y recordatorios</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/recordatorios/configuracion')}>
            <Settings className="h-4 w-4 mr-2" />
            Configuracion
          </Button>
          <Button onClick={() => setDialogNuevoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo recordatorio
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pendientes</p>
                <p className="text-2xl font-bold">{estadisticas?.pendientes || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completados hoy</p>
                <p className="text-2xl font-bold">{estadisticas?.completadosHoy || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Esta semana</p>
                <p className="text-2xl font-bold">{estadisticas?.completadosSemana || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {estadisticas?.porPrioridad?.find((p) => p.prioridad === 'urgente')?.count || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y lista */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                <TabsTrigger value="completados">Completados</TabsTrigger>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  className="pl-10 w-full sm:w-[200px]"
                />
              </div>

              <Select
                value={filtros.prioridad}
                onValueChange={(v) => setFiltros({ ...filtros, prioridad: v })}
              >
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recordatoriosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">Sin recordatorios</h3>
              <p className="text-slate-500 mt-1">
                {tabActiva === 'pendientes'
                  ? 'No tienes recordatorios pendientes'
                  : 'No se encontraron recordatorios'}
              </p>
              <Button onClick={() => setDialogNuevoOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear recordatorio
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recordatoriosFiltrados.map((recordatorio) => (
                <RecordatorioCard
                  key={recordatorio._id}
                  recordatorio={recordatorio}
                  onAccion={handleAccion}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nuevo recordatorio */}
      <NuevoRecordatorioDialog
        open={dialogNuevoOpen}
        onOpenChange={setDialogNuevoOpen}
        onCrear={cargarDatos}
      />
    </div>
    
  )
}
