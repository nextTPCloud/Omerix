'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CalendarDays,
  RefreshCw,
  Plane,
  AlertCircle,
  Calendar,
  Clock,
  Sun,
  Umbrella,
} from 'lucide-react'
import { CalendarView, EventoCalendario } from '@/components/calendarios'
import { calendariosService } from '@/services/calendarios.service'
import { Personal, Vacaciones, Ausencia } from '@/types/personal.types'
import { CalendarioLaboral } from '@/types/calendario.types'
import { toast } from 'sonner'

interface TabCalendarioProps {
  empleado: Personal
}

export function TabCalendario({ empleado }: TabCalendarioProps) {
  const [loading, setLoading] = useState(true)
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear())
  const [calendario, setCalendario] = useState<CalendarioLaboral | null>(null)

  // Años disponibles
  const aniosDisponibles = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  }, [])

  // Cargar calendario laboral del empleado
  useEffect(() => {
    cargarCalendario()
  }, [anioSeleccionado, empleado.datosLaborales?.calendarioLaboralId])

  const cargarCalendario = async () => {
    setLoading(true)
    try {
      let cal: CalendarioLaboral | null = null

      // Si el empleado tiene un calendario específico asignado
      if (empleado.datosLaborales?.calendarioLaboralId) {
        const response = await calendariosService.getById(empleado.datosLaborales.calendarioLaboralId)
        if (response.success && response.data) {
          cal = response.data
        }
      }

      // Si no, buscar el calendario por defecto del año
      if (!cal) {
        const response = await calendariosService.getAll({ anio: anioSeleccionado, activo: 'true' })
        if (response.success && response.data?.length > 0) {
          // Buscar el calendario por defecto o el primero disponible
          cal = response.data.find(c => c.esDefecto) || response.data[0]
        }
      }

      setCalendario(cal)
    } catch (error) {
      console.error('Error cargando calendario:', error)
      toast.error('Error al cargar el calendario')
    } finally {
      setLoading(false)
    }
  }

  // Convertir festivos, vacaciones y ausencias a eventos del calendario
  const eventos = useMemo(() => {
    const eventosArray: EventoCalendario[] = []

    // Añadir festivos del calendario laboral
    if (calendario?.festivos) {
      calendario.festivos.forEach(festivo => {
        eventosArray.push({
          fecha: festivo.fecha.split('T')[0],
          nombre: festivo.nombre,
          tipo: festivo.tipo,
          meta: { sustituible: festivo.sustituible }
        })
      })
    }

    // Añadir vacaciones del empleado
    if (empleado.vacaciones) {
      empleado.vacaciones.forEach(vac => {
        // Las vacaciones se muestran como días específicos si hay registros
        // Por ahora mostramos info general del año
      })
    }

    // Añadir ausencias del empleado
    if (empleado.ausencias) {
      empleado.ausencias
        .filter(aus => {
          const fechaInicio = new Date(aus.fechaInicio)
          return fechaInicio.getFullYear() === anioSeleccionado
        })
        .forEach(ausencia => {
          // Si tiene rango de fechas, añadir cada día
          // Parseamos solo la parte de fecha para evitar problemas de timezone
          const fechaInicioStr = ausencia.fechaInicio.split('T')[0]
          const [yi, mi, di] = fechaInicioStr.split('-').map(Number)
          const fechaInicio = new Date(yi, mi - 1, di)

          let fechaFin = fechaInicio
          if (ausencia.fechaFin) {
            const fechaFinStr = ausencia.fechaFin.split('T')[0]
            const [yf, mf, df] = fechaFinStr.split('-').map(Number)
            fechaFin = new Date(yf, mf - 1, df)
          }

          let currentDate = new Date(fechaInicio)
          while (currentDate <= fechaFin) {
            // Formatear fecha en hora local para evitar desplazamiento por timezone
            const year = currentDate.getFullYear()
            const month = String(currentDate.getMonth() + 1).padStart(2, '0')
            const day = String(currentDate.getDate()).padStart(2, '0')
            eventosArray.push({
              fecha: `${year}-${month}-${day}`,
              nombre: getTipoAusenciaLabel(ausencia.tipo),
              tipo: getEventoTipoFromAusencia(ausencia.tipo),
              meta: {
                motivo: ausencia.motivo,
                aprobada: ausencia.aprobada,
              }
            })
            currentDate.setDate(currentDate.getDate() + 1)
          }
        })
    }

    return eventosArray
  }, [calendario, empleado.vacaciones, empleado.ausencias, anioSeleccionado])

  // Resumen de vacaciones del año seleccionado
  const resumenVacaciones = useMemo(() => {
    const vacAnio = empleado.vacaciones?.find(v => v.anio === anioSeleccionado)
    return {
      diasTotales: vacAnio?.diasTotales || 22,
      diasDisfrutados: vacAnio?.diasDisfrutados || 0,
      diasPendientes: vacAnio?.diasPendientes ?? (vacAnio?.diasTotales || 22) - (vacAnio?.diasDisfrutados || 0),
    }
  }, [empleado.vacaciones, anioSeleccionado])

  // Resumen de ausencias del año
  const resumenAusencias = useMemo(() => {
    const ausenciasAnio = empleado.ausencias?.filter(a => {
      const fecha = new Date(a.fechaInicio)
      return fecha.getFullYear() === anioSeleccionado
    }) || []

    const porTipo: Record<string, number> = {}
    ausenciasAnio.forEach(aus => {
      const tipo = aus.tipo || 'otro'
      const fechaInicio = new Date(aus.fechaInicio)
      const fechaFin = aus.fechaFin ? new Date(aus.fechaFin) : fechaInicio
      const dias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
      porTipo[tipo] = (porTipo[tipo] || 0) + dias
    })

    return {
      total: ausenciasAnio.length,
      porTipo,
    }
  }, [empleado.ausencias, anioSeleccionado])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selector de año */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Calendario Laboral {anioSeleccionado}
        </h3>
        <div className="flex items-center gap-2">
          <Select
            value={anioSeleccionado.toString()}
            onValueChange={(v) => setAnioSeleccionado(parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aniosDisponibles.map(anio => (
                <SelectItem key={anio} value={anio.toString()}>
                  {anio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={cargarCalendario}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Calendario */}
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            {calendario ? (
              <CalendarView
                anio={anioSeleccionado}
                eventos={eventos}
                vistaInicial="anual"
                mostrarControlesVista={true}
                mostrarNavegacion={true}
              />
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-semibold mb-2">Sin calendario asignado</h3>
                <p className="text-sm text-muted-foreground">
                  No hay un calendario laboral configurado para el año {anioSeleccionado}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Resumen de vacaciones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="h-4 w-4 text-yellow-500" />
                Vacaciones {anioSeleccionado}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{resumenVacaciones.diasTotales}</p>
                  <p className="text-xs text-muted-foreground">Totales</p>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{resumenVacaciones.diasDisfrutados}</p>
                  <p className="text-xs text-muted-foreground">Disfrutados</p>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{resumenVacaciones.diasPendientes}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${(resumenVacaciones.diasDisfrutados / resumenVacaciones.diasTotales) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round((resumenVacaciones.diasDisfrutados / resumenVacaciones.diasTotales) * 100)}% consumido
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de ausencias */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Ausencias {anioSeleccionado}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resumenAusencias.total > 0 ? (
                <div className="space-y-2">
                  {Object.entries(resumenAusencias.porTipo).map(([tipo, dias]) => (
                    <div key={tipo} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getIconoAusencia(tipo)}
                        <span className="text-sm capitalize">{getTipoAusenciaLabel(tipo)}</span>
                      </div>
                      <Badge variant="outline">{dias} día{dias !== 1 ? 's' : ''}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin ausencias registradas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Info del calendario laboral */}
          {calendario && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Calendario Aplicado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nombre</span>
                  <span className="text-sm font-medium">{calendario.nombre}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Festivos</span>
                  <Badge variant="outline">{calendario.festivos?.length || 0}</Badge>
                </div>
                {calendario.region && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Región</span>
                    <span className="text-sm">{calendario.region}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Helpers
function getTipoAusenciaLabel(tipo: string): string {
  const labels: Record<string, string> = {
    vacaciones: 'Vacaciones',
    baja_medica: 'Baja Médica',
    baja_maternal: 'Baja Maternal',
    baja_paternal: 'Baja Paternal',
    permiso: 'Permiso',
    asuntos_propios: 'Asuntos Propios',
    formacion: 'Formación',
    otro: 'Otro',
  }
  return labels[tipo] || tipo
}

function getEventoTipoFromAusencia(tipo: string): string {
  const tipos: Record<string, string> = {
    vacaciones: 'vacaciones',
    baja_medica: 'baja',
    baja_maternal: 'baja',
    baja_paternal: 'baja',
    permiso: 'ausencia',
    asuntos_propios: 'ausencia',
    formacion: 'ausencia',
    otro: 'ausencia',
  }
  return tipos[tipo] || 'ausencia'
}

function getIconoAusencia(tipo: string) {
  const iconos: Record<string, React.ReactNode> = {
    vacaciones: <Plane className="h-4 w-4 text-green-500" />,
    baja_medica: <AlertCircle className="h-4 w-4 text-red-500" />,
    baja_maternal: <Umbrella className="h-4 w-4 text-pink-500" />,
    baja_paternal: <Umbrella className="h-4 w-4 text-blue-500" />,
    permiso: <Clock className="h-4 w-4 text-purple-500" />,
    asuntos_propios: <Calendar className="h-4 w-4 text-orange-500" />,
  }
  return iconos[tipo] || <Calendar className="h-4 w-4 text-gray-500" />
}
