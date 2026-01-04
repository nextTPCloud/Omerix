'use client'

import { useState, useEffect, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { partesTrabajoService } from '@/services/partes-trabajo.service'
import { personalService } from '@/services/personal.service'
import { recordatoriosService } from '@/services/recordatorios.service'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Bell,
  Users,
  Filter,
  Plus,
  Clock,
  MapPin,
  RefreshCw,
  CalendarDays,
  LayoutGrid,
  List,
  CloudUpload,
  Check,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isToday, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLicense } from '@/hooks/useLicense'

// Tipos de eventos para el calendario
interface EventoCalendario {
  id: string
  tipo: 'parte' | 'recordatorio' | 'crm' | 'evento'
  titulo: string
  descripcion?: string
  fecha: Date
  horaInicio?: string
  horaFin?: string
  estado: string
  prioridad?: string
  cliente?: string
  personal?: string[]
  color: string
  url: string
}

// Colores por tipo de evento
const COLORES_EVENTO: Record<string, string> = {
  parte: 'bg-blue-500',
  recordatorio: 'bg-orange-500',
  crm: 'bg-purple-500',
  evento: 'bg-green-500',
}

// Colores por prioridad
const COLORES_PRIORIDAD: Record<string, string> = {
  baja: 'border-l-gray-400',
  media: 'border-l-blue-400',
  alta: 'border-l-orange-400',
  urgente: 'border-l-red-500',
}

export default function PlanificacionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [fechaActual, setFechaActual] = useState(new Date())
  const [vistaActual, setVistaActual] = useState<'semana' | 'mes'>('semana')
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [personal, setPersonal] = useState<any[]>([])
  const [filtroPersonal, setFiltroPersonal] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [isSyncing, setIsSyncing] = useState(false)
  const { hasModule } = useLicense()

  // Verificar qué módulos están disponibles
  const hasCrmModule = hasModule('crm')

  // Calcular rango de fechas según la vista
  const rangoFechas = useMemo(() => {
    if (vistaActual === 'semana') {
      return {
        inicio: startOfWeek(fechaActual, { weekStartsOn: 1 }),
        fin: endOfWeek(fechaActual, { weekStartsOn: 1 }),
      }
    } else {
      return {
        inicio: startOfMonth(fechaActual),
        fin: endOfMonth(fechaActual),
      }
    }
  }, [fechaActual, vistaActual])

  // Generar días de la semana
  const diasSemana = useMemo(() => {
    const dias = []
    let dia = rangoFechas.inicio
    while (dia <= rangoFechas.fin) {
      dias.push(new Date(dia))
      dia = addDays(dia, 1)
    }
    return dias
  }, [rangoFechas])

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true)
      try {
        // Hacer dos consultas: una por fechaInicio y otra por fecha (documento)
        // para incluir todos los partes del período
        const timestamp = Date.now() // Anti-caché
        const [partesRes1, partesRes2, personalRes, recordatoriosRes] = await Promise.all([
          // Partes con fechaInicio en el rango
          partesTrabajoService.getAll({
            limit: 100,
            fechaInicioDesde: format(rangoFechas.inicio, 'yyyy-MM-dd'),
            fechaInicioHasta: format(rangoFechas.fin, 'yyyy-MM-dd'),
            estados: 'borrador,planificado,en_curso,pausado',
            _t: timestamp,
          } as any),
          // Partes sin fechaInicio (usa fecha del documento)
          partesTrabajoService.getAll({
            limit: 100,
            fechaDesde: format(rangoFechas.inicio, 'yyyy-MM-dd'),
            fechaHasta: format(rangoFechas.fin, 'yyyy-MM-dd'),
            estados: 'borrador,planificado,en_curso,pausado',
            _t: timestamp,
          } as any),
          personalService.getAll({ limit: 100, activo: true }),
          recordatoriosService.listar({
            limite: 100,
            fechaDesde: format(rangoFechas.inicio, 'yyyy-MM-dd'),
            fechaHasta: format(rangoFechas.fin, 'yyyy-MM-dd'),
          }).catch(() => ({ recordatorios: [], total: 0, totalPaginas: 0 })), // Si falla, array vacío
        ])

        const eventosTemp: EventoCalendario[] = []

        // Combinar resultados de ambas consultas eliminando duplicados
        const partesMap = new Map<string, any>()
        if (partesRes1.success && partesRes1.data) {
          partesRes1.data.forEach((parte: any) => partesMap.set(parte._id, parte))
        }
        if (partesRes2.success && partesRes2.data) {
          partesRes2.data.forEach((parte: any) => {
            if (!partesMap.has(parte._id)) {
              partesMap.set(parte._id, parte)
            }
          })
        }

        // Convertir partes de trabajo a eventos
        partesMap.forEach((parte: any) => {
          // Usar fechaInicio si existe, sino usar fecha del documento
          const fechaEvento = parte.fechaInicio
            ? new Date(parte.fechaInicio)
            : new Date(parte.fecha)
          eventosTemp.push({
            id: parte._id,
            tipo: 'parte',
            titulo: parte.titulo || `Parte ${parte.codigo}`,
            descripcion: parte.descripcion,
            fecha: fechaEvento,
            horaInicio: parte.fechaInicio ? format(new Date(parte.fechaInicio), 'HH:mm') : undefined,
            horaFin: parte.fechaFin ? format(new Date(parte.fechaFin), 'HH:mm') : undefined,
            estado: parte.estado,
            prioridad: parte.prioridad,
            cliente: parte.clienteNombre,
            personal: parte.lineasPersonal?.map((l: any) => l.personalNombre) || [],
            color: COLORES_EVENTO.parte,
            url: `/partes-trabajo/${parte._id}`,
          })
        })

        // Convertir recordatorios a eventos
        if (recordatoriosRes.recordatorios && recordatoriosRes.recordatorios.length > 0) {
          recordatoriosRes.recordatorios.forEach((rec: any) => {
            eventosTemp.push({
              id: rec._id,
              tipo: 'recordatorio',
              titulo: rec.titulo,
              descripcion: rec.descripcion,
              fecha: new Date(rec.fechaRecordatorio),
              horaInicio: rec.horaRecordatorio,
              estado: rec.estado,
              prioridad: rec.prioridad,
              color: COLORES_EVENTO.recordatorio,
              url: `/recordatorios`,
            })
          })
        }

        // DEBUG
        console.log('=== DEBUG Eventos ===')
        console.log('Vista actual:', vistaActual)
        console.log('Rango buscado:', format(rangoFechas.inicio, 'yyyy-MM-dd'), 'a', format(rangoFechas.fin, 'yyyy-MM-dd'))
        console.log('Partes res1:', partesRes1.success ? partesRes1.data?.length || 0 : 'error', 'partes')
        console.log('Partes res2:', partesRes2.success ? partesRes2.data?.length || 0 : 'error', 'partes')
        console.log('Partes en map:', partesMap.size)
        console.log('Total eventos creados:', eventosTemp.length)
        eventosTemp.forEach(e => {
          console.log(`  - ${e.tipo}: ${e.titulo}, fecha: ${e.fecha.toISOString()}, key: ${format(e.fecha, 'yyyy-MM-dd')}`)
        })

        setEventos(eventosTemp)
        if (personalRes.success) setPersonal(personalRes.data || [])
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [rangoFechas])

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroTipo !== 'todos' && e.tipo !== filtroTipo) return false
      if (filtroPersonal !== 'todos' && !e.personal?.includes(filtroPersonal)) return false
      return true
    })
  }, [eventos, filtroTipo, filtroPersonal])

  // Agrupar eventos por día
  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>()
    eventosFiltrados.forEach((evento) => {
      const key = format(evento.fecha, 'yyyy-MM-dd')
      if (!mapa.has(key)) mapa.set(key, [])
      mapa.get(key)!.push(evento)
    })
    return mapa
  }, [eventosFiltrados])

  // Navegación
  const irAnterior = () => {
    if (vistaActual === 'semana') {
      setFechaActual(subWeeks(fechaActual, 1))
    } else {
      setFechaActual(subMonths(fechaActual, 1))
    }
  }

  const irSiguiente = () => {
    if (vistaActual === 'semana') {
      setFechaActual(addWeeks(fechaActual, 1))
    } else {
      setFechaActual(addMonths(fechaActual, 1))
    }
  }

  const irHoy = () => {
    setFechaActual(new Date())
  }

  // Sincronizar con Google Calendar
  const sincronizarCalendar = async () => {
    setIsSyncing(true)
    try {
      // Obtener IDs de partes de trabajo del período actual
      const partesIds = eventos
        .filter((e) => e.tipo === 'parte')
        .map((e) => e.id)

      if (partesIds.length === 0) {
        toast.info('No hay partes de trabajo en el período seleccionado')
        setIsSyncing(false)
        return
      }

      let totalSincronizados = 0
      let totalErrores = 0
      let partesConJornadas = 0

      // Sincronizar cada parte
      for (const parteId of partesIds) {
        try {
          const result = await partesTrabajoService.syncCalendar(parteId)
          if (result.success && result.stats) {
            if (result.stats.jornadasProcesadas > 0) {
              partesConJornadas++
              totalSincronizados += result.stats.eventosSincronizados
              totalErrores += result.stats.errores
            }
          }
        } catch (error) {
          // Ignorar errores individuales, contar como error
          totalErrores++
        }
      }

      if (partesConJornadas === 0) {
        toast.info('Los partes no tienen jornadas configuradas. Configure jornadas multi-día para sincronizar.')
      } else if (totalErrores === 0 && totalSincronizados > 0) {
        toast.success(`${totalSincronizados} evento(s) sincronizado(s) con Google Calendar`)
      } else if (totalSincronizados > 0) {
        toast.warning(`${totalSincronizados} sincronizado(s), ${totalErrores} error(es). Verifique que el personal tenga Google Calendar conectado.`)
      } else {
        toast.error('No se pudo sincronizar. Verifique que el personal tenga Google Calendar conectado.')
      }
    } catch (error) {
      toast.error('Ocurrió un error al sincronizar con Google Calendar')
    } finally {
      setIsSyncing(false)
    }
  }

  // Renderizar evento
  const renderEvento = (evento: EventoCalendario, compacto = false) => (
    <Link
      key={evento.id}
      href={evento.url}
      className={cn(
        'block p-2 rounded-md text-xs transition-all hover:opacity-80 border-l-4',
        evento.color,
        evento.prioridad ? COLORES_PRIORIDAD[evento.prioridad] : 'border-l-transparent',
        'text-white'
      )}
    >
      <div className="font-medium truncate">{evento.titulo}</div>
      {!compacto && (
        <>
          {evento.horaInicio && (
            <div className="flex items-center gap-1 mt-1 opacity-80">
              <Clock className="h-3 w-3" />
              {evento.horaInicio}
              {evento.horaFin && ` - ${evento.horaFin}`}
            </div>
          )}
          {evento.cliente && (
            <div className="truncate mt-1 opacity-80">{evento.cliente}</div>
          )}
        </>
      )}
    </Link>
  )

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-primary" />
              Planificación
            </h1>
            <p className="text-sm text-muted-foreground">
              Vista general de partes, recordatorios y actividades
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={sincronizarCalendar}
              disabled={isSyncing || isLoading}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4 mr-2" />
              )}
              {isSyncing ? 'Sincronizando...' : 'Sync Google Calendar'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/partes-trabajo/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Parte
              </Link>
            </Button>
          </div>
        </div>

        {/* Controles del calendario */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Navegación de fechas */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={irAnterior}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={irHoy}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" onClick={irSiguiente}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="ml-2 text-lg font-semibold">
                  {vistaActual === 'semana'
                    ? `${format(rangoFechas.inicio, 'd MMM', { locale: es })} - ${format(rangoFechas.fin, 'd MMM yyyy', { locale: es })}`
                    : format(fechaActual, 'MMMM yyyy', { locale: es })}
                </span>
              </div>

              {/* Filtros y vista */}
              <div className="flex items-center gap-2">
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="parte">Partes</SelectItem>
                    <SelectItem value="recordatorio">Recordatorios</SelectItem>
                    {hasCrmModule && <SelectItem value="crm">CRM</SelectItem>}
                  </SelectContent>
                </Select>

                <Select value={filtroPersonal} onValueChange={setFiltroPersonal}>
                  <SelectTrigger className="w-[160px]">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todo el personal</SelectItem>
                    {personal.map((p) => (
                      <SelectItem key={p._id} value={`${p.nombre} ${p.apellidos}`}>
                        {p.nombre} {p.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  <Button
                    variant={vistaActual === 'semana' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setVistaActual('semana')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={vistaActual === 'mes' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setVistaActual('mes')}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', COLORES_EVENTO.parte)} />
            <span className="text-sm">Partes de trabajo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', COLORES_EVENTO.recordatorio)} />
            <span className="text-sm">Recordatorios</span>
          </div>
          {hasCrmModule && (
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded', COLORES_EVENTO.crm)} />
              <span className="text-sm">Actividades CRM</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded', COLORES_EVENTO.evento)} />
            <span className="text-sm">Eventos</span>
          </div>
        </div>

        {/* Vista Semana */}
        {vistaActual === 'semana' && (
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b">
                {diasSemana.map((dia) => (
                  <div
                    key={dia.toISOString()}
                    className={cn(
                      'p-3 text-center border-r last:border-r-0',
                      isToday(dia) && 'bg-primary/5'
                    )}
                  >
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(dia, 'EEE', { locale: es })}
                    </div>
                    <div
                      className={cn(
                        'text-lg font-semibold',
                        isToday(dia) && 'text-primary'
                      )}
                    >
                      {format(dia, 'd')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[400px]">
                {diasSemana.map((dia) => {
                  const eventosDelDia = eventosPorDia.get(format(dia, 'yyyy-MM-dd')) || []
                  return (
                    <div
                      key={dia.toISOString()}
                      className={cn(
                        'p-2 border-r last:border-r-0 space-y-1',
                        isToday(dia) && 'bg-primary/5'
                      )}
                    >
                      {eventosDelDia.slice(0, 5).map((evento) => renderEvento(evento, true))}
                      {eventosDelDia.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{eventosDelDia.length - 5} más
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vista Mes */}
        {vistaActual === 'mes' && (
          <Card>
            <CardContent className="p-0">
              {/* Cabecera días de la semana */}
              <div className="grid grid-cols-7 border-b">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                  <div key={dia} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                    {dia}
                  </div>
                ))}
              </div>
              {/* Grid del mes */}
              <div className="grid grid-cols-7">
                {(() => {
                  const primerDia = startOfMonth(fechaActual)
                  const ultimoDia = endOfMonth(fechaActual)
                  const inicioSemana = startOfWeek(primerDia, { weekStartsOn: 1 })
                  const finSemana = endOfWeek(ultimoDia, { weekStartsOn: 1 })
                  const dias = []
                  let dia = inicioSemana
                  while (dia <= finSemana) {
                    dias.push(new Date(dia))
                    dia = addDays(dia, 1)
                  }
                  return dias.map((d) => {
                    const esDelMes = d.getMonth() === fechaActual.getMonth()
                    const eventosDelDia = eventosPorDia.get(format(d, 'yyyy-MM-dd')) || []
                    return (
                      <div
                        key={d.toISOString()}
                        className={cn(
                          'min-h-[100px] p-1 border-r border-b last:border-r-0',
                          !esDelMes && 'bg-muted/30',
                          isToday(d) && 'bg-primary/5'
                        )}
                      >
                        <div className={cn(
                          'text-sm font-medium mb-1',
                          !esDelMes && 'text-muted-foreground',
                          isToday(d) && 'text-primary'
                        )}>
                          {format(d, 'd')}
                        </div>
                        <div className="space-y-0.5">
                          {eventosDelDia.slice(0, 3).map((evento) => (
                            <Link
                              key={evento.id}
                              href={evento.url}
                              className={cn(
                                'block px-1 py-0.5 text-[10px] rounded truncate text-white',
                                evento.color
                              )}
                            >
                              {evento.titulo}
                            </Link>
                          ))}
                          {eventosDelDia.length > 3 && (
                            <div className="text-[10px] text-muted-foreground px-1">
                              +{eventosDelDia.length - 3} más
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen del día actual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hoy - {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const eventosHoy = eventosPorDia.get(format(new Date(), 'yyyy-MM-dd')) || []
              if (eventosHoy.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay eventos programados para hoy</p>
                  </div>
                )
              }
              return (
                <div className="space-y-3">
                  {eventosHoy.map((evento) => (
                    <Link
                      key={evento.id}
                      href={evento.url}
                      className={cn(
                        'flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors',
                        evento.prioridad ? COLORES_PRIORIDAD[evento.prioridad] : ''
                      )}
                    >
                      <div className={cn('p-2 rounded-lg text-white', evento.color)}>
                        {evento.tipo === 'parte' && <Wrench className="h-5 w-5" />}
                        {evento.tipo === 'recordatorio' && <Bell className="h-5 w-5" />}
                        {evento.tipo === 'crm' && <Users className="h-5 w-5" />}
                        {evento.tipo === 'evento' && <Calendar className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{evento.titulo}</div>
                        {evento.descripcion && (
                          <div className="text-sm text-muted-foreground truncate">
                            {evento.descripcion}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {evento.horaInicio && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {evento.horaInicio}
                              {evento.horaFin && ` - ${evento.horaFin}`}
                            </span>
                          )}
                          {evento.cliente && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {evento.cliente}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{evento.estado}</Badge>
                    </Link>
                  ))}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
