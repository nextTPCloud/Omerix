'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  LayoutGrid,
  List,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type VistaCalendario = 'anual' | 'mensual' | 'trimestral' | 'semanal'

export interface EventoCalendario {
  fecha: string // YYYY-MM-DD
  nombre: string
  tipo: string
  color?: string
  icono?: React.ReactNode
  meta?: Record<string, any>
}

interface CalendarViewProps {
  anio: number
  eventos: EventoCalendario[]
  vistaInicial?: VistaCalendario
  onVistaChange?: (vista: VistaCalendario) => void
  onFechaClick?: (fecha: Date, eventos: EventoCalendario[]) => void
  onEventoClick?: (evento: EventoCalendario) => void
  className?: string
  mostrarControlesVista?: boolean
  mostrarNavegacion?: boolean
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const DIAS_SEMANA_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const COLORES_TIPO: Record<string, string> = {
  nacional: 'bg-red-500',
  autonomico: 'bg-orange-500',
  local: 'bg-blue-500',
  empresa: 'bg-purple-500',
  vacaciones: 'bg-green-500',
  ausencia: 'bg-yellow-500',
  baja: 'bg-gray-500',
  festivo: 'bg-red-400',
}

// Helpers - Formateo de fechas en hora local (evita desplazamiento por timezone UTC)
const formatFecha = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseFecha = (fecha: string): Date => {
  // Si viene con timestamp, parseamos solo la parte de fecha para evitar problemas de timezone
  const fechaStr = fecha.split('T')[0]
  const [year, month, day] = fechaStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getDiasDelMes = (anio: number, mes: number): Date[] => {
  const dias: Date[] = []
  const primerDia = new Date(anio, mes, 1)
  const ultimoDia = new Date(anio, mes + 1, 0)

  // Añadir días del mes anterior para completar la semana
  const diaSemanaInicio = (primerDia.getDay() + 6) % 7 // Lunes = 0
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const d = new Date(anio, mes, -i)
    dias.push(d)
  }

  // Días del mes actual
  for (let i = 1; i <= ultimoDia.getDate(); i++) {
    dias.push(new Date(anio, mes, i))
  }

  // Completar la última semana
  const diasRestantes = (7 - (dias.length % 7)) % 7
  for (let i = 1; i <= diasRestantes; i++) {
    dias.push(new Date(anio, mes + 1, i))
  }

  return dias
}

const getDiasSemana = (fecha: Date): Date[] => {
  const dias: Date[] = []
  const diaSemana = (fecha.getDay() + 6) % 7 // Lunes = 0
  const lunes = new Date(fecha)
  lunes.setDate(fecha.getDate() - diaSemana)

  for (let i = 0; i < 7; i++) {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    dias.push(d)
  }

  return dias
}

export function CalendarView({
  anio,
  eventos,
  vistaInicial = 'mensual',
  onVistaChange,
  onFechaClick,
  onEventoClick,
  className,
  mostrarControlesVista = true,
  mostrarNavegacion = true,
}: CalendarViewProps) {
  const [vista, setVista] = useState<VistaCalendario>(vistaInicial)
  const [mesActual, setMesActual] = useState(new Date().getMonth())
  const [fechaActual, setFechaActual] = useState(new Date())

  // Mapa de eventos por fecha
  const eventosPorFecha = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>()
    eventos.forEach(evento => {
      const fecha = evento.fecha.split('T')[0]
      if (!mapa.has(fecha)) mapa.set(fecha, [])
      mapa.get(fecha)!.push(evento)
    })
    return mapa
  }, [eventos])

  const cambiarVista = (nuevaVista: VistaCalendario) => {
    setVista(nuevaVista)
    onVistaChange?.(nuevaVista)
  }

  const navegar = (direccion: 'anterior' | 'siguiente') => {
    const delta = direccion === 'anterior' ? -1 : 1

    switch (vista) {
      case 'semanal':
        const nuevaFecha = new Date(fechaActual)
        nuevaFecha.setDate(fechaActual.getDate() + (delta * 7))
        setFechaActual(nuevaFecha)
        break
      case 'mensual':
        setMesActual(prev => (prev + delta + 12) % 12)
        break
      case 'trimestral':
        setMesActual(prev => {
          const nuevo = prev + (delta * 3)
          if (nuevo < 0) return 9
          if (nuevo > 9) return 0
          return nuevo
        })
        break
    }
  }

  const renderDiaCell = (fecha: Date, esMesActual: boolean = true, tamanio: 'sm' | 'md' | 'lg' = 'md') => {
    const fechaStr = formatFecha(fecha)
    const eventosDelDia = eventosPorFecha.get(fechaStr) || []
    const esHoy = formatFecha(new Date()) === fechaStr
    const esFinSemana = fecha.getDay() === 0 || fecha.getDay() === 6

    const tamanoClases = {
      sm: 'h-6 w-6 text-[10px]',
      md: 'h-8 w-8 text-xs',
      lg: 'h-10 w-10 text-sm min-h-[80px] w-full',
    }

    const contenido = (
      <div
        className={cn(
          'relative flex flex-col items-center justify-start rounded-md transition-colors cursor-pointer hover:bg-muted/50',
          tamanoClases[tamanio],
          !esMesActual && 'text-muted-foreground/40',
          esFinSemana && esMesActual && 'text-muted-foreground',
          esHoy && 'ring-2 ring-primary ring-offset-1',
          eventosDelDia.length > 0 && 'font-medium',
        )}
        onClick={() => onFechaClick?.(fecha, eventosDelDia)}
      >
        <span className={cn(
          'flex items-center justify-center rounded-full',
          tamanio === 'lg' ? 'w-7 h-7 mb-1' : 'w-full h-full',
          esHoy && 'bg-primary text-primary-foreground',
        )}>
          {fecha.getDate()}
        </span>

        {/* Indicadores de eventos */}
        {tamanio === 'lg' && eventosDelDia.length > 0 && (
          <div className="flex flex-col gap-0.5 w-full px-1 overflow-hidden">
            {eventosDelDia.slice(0, 3).map((evento, idx) => (
              <div
                key={idx}
                className={cn(
                  'text-[9px] px-1 py-0.5 rounded truncate text-white',
                  COLORES_TIPO[evento.tipo] || 'bg-gray-400'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventoClick?.(evento)
                }}
              >
                {evento.nombre}
              </div>
            ))}
            {eventosDelDia.length > 3 && (
              <span className="text-[9px] text-muted-foreground">
                +{eventosDelDia.length - 3} más
              </span>
            )}
          </div>
        )}

        {tamanio !== 'lg' && eventosDelDia.length > 0 && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
            {eventosDelDia.slice(0, 3).map((evento, idx) => (
              <div
                key={idx}
                className={cn(
                  'w-1 h-1 rounded-full',
                  COLORES_TIPO[evento.tipo] || 'bg-gray-400'
                )}
              />
            ))}
          </div>
        )}
      </div>
    )

    if (eventosDelDia.length > 0 && tamanio !== 'lg') {
      return (
        <TooltipProvider key={fechaStr}>
          <Tooltip>
            <TooltipTrigger asChild>{contenido}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                {eventosDelDia.map((evento, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', COLORES_TIPO[evento.tipo] || 'bg-gray-400')} />
                    <span className="text-xs">{evento.nombre}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return contenido
  }

  // Vista Anual
  const renderVistaAnual = () => (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
      {MESES.map((nombreMes, mesIndex) => {
        const dias = getDiasDelMes(anio, mesIndex)

        return (
          <div key={mesIndex} className="border rounded-lg p-2">
            <h4 className="text-sm font-medium text-center mb-2">{nombreMes}</h4>
            <div className="grid grid-cols-7 gap-0.5">
              {DIAS_SEMANA.map(dia => (
                <div key={dia} className="text-[9px] text-center text-muted-foreground font-medium">
                  {dia}
                </div>
              ))}
              {dias.map((fecha, idx) => (
                <div key={idx}>
                  {renderDiaCell(fecha, fecha.getMonth() === mesIndex, 'sm')}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  // Vista Mensual
  const renderVistaMensual = () => {
    const dias = getDiasDelMes(anio, mesActual)

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1">
          {DIAS_SEMANA_LARGO.map(dia => (
            <div key={dia} className="text-xs font-medium text-center text-muted-foreground py-2">
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((fecha, idx) => (
            <div key={idx} className="border rounded-md min-h-[80px]">
              {renderDiaCell(fecha, fecha.getMonth() === mesActual, 'lg')}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Vista Trimestral
  const renderVistaTrimestral = () => {
    const mesesTrimestre = [mesActual, (mesActual + 1) % 12, (mesActual + 2) % 12]

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mesesTrimestre.map(mesIndex => {
          const dias = getDiasDelMes(anio, mesIndex)

          return (
            <div key={mesIndex} className="border rounded-lg p-3">
              <h4 className="text-sm font-semibold text-center mb-3">{MESES[mesIndex]}</h4>
              <div className="grid grid-cols-7 gap-1">
                {DIAS_SEMANA.map(dia => (
                  <div key={dia} className="text-xs text-center text-muted-foreground font-medium">
                    {dia}
                  </div>
                ))}
                {dias.map((fecha, idx) => (
                  <div key={idx}>
                    {renderDiaCell(fecha, fecha.getMonth() === mesIndex, 'md')}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Vista Semanal
  const renderVistaSemanal = () => {
    const diasSemana = getDiasSemana(fechaActual)

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {diasSemana.map((fecha, idx) => {
            const fechaStr = formatFecha(fecha)
            const eventosDelDia = eventosPorFecha.get(fechaStr) || []
            const esHoy = formatFecha(new Date()) === fechaStr

            return (
              <div
                key={idx}
                className={cn(
                  'border rounded-lg p-3 min-h-[200px] cursor-pointer hover:bg-muted/50 transition-colors',
                  esHoy && 'ring-2 ring-primary'
                )}
                onClick={() => onFechaClick?.(fecha, eventosDelDia)}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-muted-foreground">{DIAS_SEMANA_LARGO[idx]}</div>
                  <div className={cn(
                    'text-lg font-bold',
                    esHoy && 'text-primary'
                  )}>
                    {fecha.getDate()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {MESES[fecha.getMonth()].slice(0, 3)}
                  </div>
                </div>
                <div className="space-y-1">
                  {eventosDelDia.map((evento, evIdx) => (
                    <div
                      key={evIdx}
                      className={cn(
                        'text-xs px-2 py-1 rounded text-white',
                        COLORES_TIPO[evento.tipo] || 'bg-gray-400'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventoClick?.(evento)
                      }}
                    >
                      {evento.nombre}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const getTituloNavegacion = () => {
    switch (vista) {
      case 'anual':
        return `${anio}`
      case 'mensual':
        return `${MESES[mesActual]} ${anio}`
      case 'trimestral':
        return `${MESES[mesActual]} - ${MESES[(mesActual + 2) % 12]} ${anio}`
      case 'semanal':
        const diasSemana = getDiasSemana(fechaActual)
        const inicio = diasSemana[0]
        const fin = diasSemana[6]
        return `${inicio.getDate()} ${MESES[inicio.getMonth()].slice(0, 3)} - ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)} ${anio}`
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {mostrarNavegacion && vista !== 'anual' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navegar('anterior')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {getTituloNavegacion()}
            </span>
            <Button variant="outline" size="icon" onClick={() => navegar('siguiente')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {vista === 'anual' && (
          <span className="text-lg font-semibold">{getTituloNavegacion()}</span>
        )}

        {mostrarControlesVista && (
          <div className="flex items-center gap-2">
            <Select value={vista} onValueChange={(v) => cambiarVista(v as VistaCalendario)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anual">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Anual
                  </div>
                </SelectItem>
                <SelectItem value="trimestral">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Trimestral
                  </div>
                </SelectItem>
                <SelectItem value="mensual">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mensual
                  </div>
                </SelectItem>
                <SelectItem value="semanal">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Semanal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(COLORES_TIPO).slice(0, 6).map(([tipo, color]) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-full', color)} />
            <span className="capitalize">{tipo}</span>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="bg-card rounded-lg">
        {vista === 'anual' && renderVistaAnual()}
        {vista === 'mensual' && renderVistaMensual()}
        {vista === 'trimestral' && renderVistaTrimestral()}
        {vista === 'semanal' && renderVistaSemanal()}
      </div>
    </div>
  )
}
