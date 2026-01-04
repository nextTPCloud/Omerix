'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  googleCalendarService,
  CalendarConfig,
  CalendarEvent,
  SyncStats,
} from '@/services/google-calendar.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Link2,
  Unlink,
  Settings,
  ArrowLeftRight,
  Users,
  ClipboardList,
  Bell,
  Briefcase,
  CalendarDays,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function GoogleCalendarPage() {
  const [config, setConfig] = useState<CalendarConfig | null>(null)
  const [eventos, setEventos] = useState<CalendarEvent[]>([])
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Cargar datos
  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      const [configData, eventosData, statsData] = await Promise.all([
        googleCalendarService.getConfig(),
        googleCalendarService.getEventos(10).catch(() => []),
        googleCalendarService.getStats().catch(() => null),
      ])
      setConfig(configData)
      setEventos(eventosData)
      setStats(statsData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // Conectar con Google
  const conectarGoogle = async () => {
    try {
      const { authUrl } = await googleCalendarService.getAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      toast.error('Error al iniciar conexión con Google')
    }
  }

  // Desconectar
  const desconectar = async () => {
    if (!confirm('¿Seguro que quieres desconectar Google Calendar?')) return

    try {
      await googleCalendarService.disconnect()
      toast.success('Desconectado correctamente')
      cargarDatos()
    } catch (error) {
      toast.error('Error al desconectar')
    }
  }

  // Sincronizar
  const sincronizar = async () => {
    try {
      setIsSyncing(true)
      const result = await googleCalendarService.sync()
      toast.success(
        `Sincronización completada: ${result.creados} creados, ${result.actualizados} actualizados`
      )
      cargarDatos()
    } catch (error) {
      toast.error('Error al sincronizar')
    } finally {
      setIsSyncing(false)
    }
  }

  // Guardar configuración
  const guardarConfig = async () => {
    if (!config) return

    try {
      setIsSaving(true)
      await googleCalendarService.updateConfig(config)
      toast.success('Configuración guardada')
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  // Actualizar configuración local
  const updateConfig = (path: string, value: any) => {
    if (!config) return

    const newConfig = { ...config }
    const parts = path.split('.')

    let obj: any = newConfig
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]]
    }
    obj[parts[parts.length - 1]] = value

    setConfig(newConfig)
  }

  // Icono de tipo de evento
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'parte_trabajo':
        return <ClipboardList className="h-4 w-4" />
      case 'tarea':
        return <CheckCircle className="h-4 w-4" />
      case 'actividad_crm':
        return <Briefcase className="h-4 w-4" />
      case 'recordatorio':
        return <Bell className="h-4 w-4" />
      default:
        return <CalendarDays className="h-4 w-4" />
    }
  }

  // Estado badge
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'sincronizado':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Sincronizado</Badge>
      case 'pendiente':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-7 w-7 text-primary" />
              Google Calendar
            </h1>
            <p className="text-muted-foreground">
              Sincroniza partes, tareas, actividades CRM y recordatorios
            </p>
          </div>
          <div className="flex gap-2">
            {config ? (
              <>
                <Button variant="outline" onClick={sincronizar} disabled={isSyncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                <Button variant="outline" onClick={desconectar}>
                  <Unlink className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </>
            ) : (
              <Button onClick={conectarGoogle}>
                <Link2 className="h-4 w-4 mr-2" />
                Conectar con Google
              </Button>
            )}
          </div>
        </div>

        {/* Estado de conexión */}
        {!config ? (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Google Calendar no está conectado</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Conecta tu cuenta de Google para sincronizar automáticamente partes de trabajo,
              tareas, actividades CRM y recordatorios con tu calendario.
            </p>
            <Button size="lg" onClick={conectarGoogle}>
              <Calendar className="h-5 w-5 mr-2" />
              Conectar Google Calendar
            </Button>
          </Card>
        ) : (
          <>
            {/* Estadísticas */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">{stats.totalEventos}</p>
                    <p className="text-xs text-muted-foreground">Total eventos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
                    <p className="text-2xl font-bold">{stats.sincronizados}</p>
                    <p className="text-xs text-muted-foreground">Sincronizados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Clock className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                    <p className="text-2xl font-bold">{stats.pendientes}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-5 w-5 mx-auto text-red-500 mb-1" />
                    <p className="text-2xl font-bold">{stats.errores}</p>
                    <p className="text-xs text-muted-foreground">Errores</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <RefreshCw className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-sm font-medium">
                      {stats.ultimaSincronizacion
                        ? format(new Date(stats.ultimaSincronizacion), 'HH:mm', { locale: es })
                        : 'Nunca'}
                    </p>
                    <p className="text-xs text-muted-foreground">Última sync</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuración */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración
                  </CardTitle>
                  <CardDescription>
                    Conectado como {config.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dirección de sincronización */}
                  <div>
                    <Label>Dirección de sincronización</Label>
                    <Select
                      value={config.sincronizacion.direccion}
                      onValueChange={(v) => updateConfig('sincronizacion.direccion', v)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bidireccional">
                          <div className="flex items-center gap-2">
                            <ArrowLeftRight className="h-4 w-4" />
                            Bidireccional
                          </div>
                        </SelectItem>
                        <SelectItem value="solo_google">Solo hacia Google</SelectItem>
                        <SelectItem value="solo_local">Solo desde Google</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Qué sincronizar */}
                  <div className="space-y-3">
                    <Label>Qué sincronizar</Label>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Partes de trabajo</span>
                      </div>
                      <Switch
                        checked={config.sincronizacion.sincPartesActivos}
                        onCheckedChange={(v) => updateConfig('sincronizacion.sincPartesActivos', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Tareas pendientes</span>
                      </div>
                      <Switch
                        checked={config.sincronizacion.sincTareasPendientes}
                        onCheckedChange={(v) => updateConfig('sincronizacion.sincTareasPendientes', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Actividades CRM</span>
                      </div>
                      <Switch
                        checked={config.sincronizacion.sincActividadesCRM}
                        onCheckedChange={(v) => updateConfig('sincronizacion.sincActividadesCRM', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Recordatorios</span>
                      </div>
                      <Switch
                        checked={config.sincronizacion.sincRecordatorios}
                        onCheckedChange={(v) => updateConfig('sincronizacion.sincRecordatorios', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-cyan-500" />
                        <span className="text-sm">Eventos externos</span>
                      </div>
                      <Switch
                        checked={config.sincronizacion.sincEventos}
                        onCheckedChange={(v) => updateConfig('sincronizacion.sincEventos', v)}
                      />
                    </div>
                  </div>

                  {/* Calendarios destino */}
                  <div className="space-y-3">
                    <Label>Calendarios destino</Label>

                    {['Partes', 'Tareas', 'CRM', 'Recordatorios', 'Eventos'].map((tipo) => {
                      const key = `calendario${tipo === 'CRM' ? 'ActividadesCRM' : tipo}`;
                      return (
                        <div key={tipo} className="grid grid-cols-2 gap-2 items-center">
                          <span className="text-sm text-muted-foreground">{tipo}</span>
                          <Select
                            value={(config as any)[key] || ''}
                            onValueChange={(v) => updateConfig(key, v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {config.calendarios.map((cal) => (
                                <SelectItem key={cal.id} value={cal.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: cal.color }}
                                    />
                                    {cal.nombre}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>

                  <Button onClick={guardarConfig} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Guardar configuración
                  </Button>
                </CardContent>
              </Card>

              {/* Próximos eventos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Próximos eventos
                  </CardTitle>
                  <CardDescription>
                    Eventos sincronizados con Google Calendar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {eventos.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No hay eventos próximos</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {eventos.map((evento) => (
                        <div
                          key={evento._id}
                          className="p-3 border rounded-lg hover:bg-muted/30"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <div className="p-1.5 bg-muted rounded mt-0.5">
                                {getTipoIcon(evento.tipoEntidad)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{evento.titulo}</p>
                                {evento.ubicacion && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {evento.ubicacion}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(evento.fechaInicio), 'EEE d MMM, HH:mm', { locale: es })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getEstadoBadge(evento.estadoSync)}
                              {evento.googleEventId && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                                  <a
                                    href={`https://calendar.google.com/calendar/event?eid=${evento.googleEventId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          {evento.participantes.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {evento.participantes.length} participantes
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
