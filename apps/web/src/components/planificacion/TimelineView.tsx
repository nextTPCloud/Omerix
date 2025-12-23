'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Clock,
  Wrench,
  CheckSquare,
  AlertTriangle,
  GripVertical,
  MapPin,
} from 'lucide-react'
import { VistaCompletaSemana, EmpleadoVista, ParteTrabajoDia, TareaDia } from '@/services/planificacion.service'

// Tipos para drag & drop
interface DragItem {
  type: 'asignacion' | 'parte' | 'tarea'
  id: string
  empleadoId: string
  fecha: string
  horaInicio?: string
  horaFin?: string
  data: any
}

interface DropResult {
  empleadoId: string
  fecha: string
  hora: string
}

interface TimelineViewProps {
  vistaCompleta: VistaCompletaSemana | null
  fechasSemana: { date: Date; dateStr: string; esHoy: boolean }[]
  onMoverAsignacion?: (item: DragItem, destino: DropResult) => Promise<boolean>
  onMoverParte?: (parteId: string, empleadoId: string, nuevaFecha: string, nuevaHora: string) => Promise<boolean>
  onMoverTarea?: (tareaId: string, empleadoId: string, nuevaFecha: string) => Promise<boolean>
  onClickAsignacion?: (fecha: string, empleadoId: string) => void
  onClickParte?: (parteId: string) => void
  onClickTarea?: (tareaId: string) => void
}

// Constantes
const HORAS_DIA = Array.from({ length: 24 }, (_, i) => i) // 0-23
const HORA_INICIO_VISIBLE = 6 // Empezar a mostrar desde las 6:00
const HORA_FIN_VISIBLE = 22 // Mostrar hasta las 22:00
const HORAS_VISIBLES = HORAS_DIA.filter(h => h >= HORA_INICIO_VISIBLE && h <= HORA_FIN_VISIBLE)
const PIXEL_POR_HORA = 60 // Ancho en pixeles por hora

const COLORES_PRIORIDAD = {
  urgente: 'bg-red-500 border-red-600',
  alta: 'bg-orange-500 border-orange-600',
  media: 'bg-blue-500 border-blue-600',
  baja: 'bg-gray-400 border-gray-500',
  normal: 'bg-blue-500 border-blue-600',
}

export function TimelineView({
  vistaCompleta,
  fechasSemana,
  onMoverAsignacion,
  onMoverParte,
  onMoverTarea,
  onClickAsignacion,
  onClickParte,
  onClickTarea,
}: TimelineViewProps) {
  // Estado para drag & drop
  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [dragOverCell, setDragOverCell] = useState<{ empleadoId: string; fecha: string; hora: number } | null>(null)

  // Estado para dialogo de confirmacion
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingMove, setPendingMove] = useState<{ item: DragItem; destino: DropResult } | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  // Ref para scroll horizontal
  const timelineRef = useRef<HTMLDivElement>(null)

  // Calcular posicion horizontal basada en hora
  const getHoraPosition = useCallback((hora: string): number => {
    const [h, m] = hora.split(':').map(Number)
    const horaDecimal = h + m / 60
    return (horaDecimal - HORA_INICIO_VISIBLE) * PIXEL_POR_HORA
  }, [])

  // Calcular ancho basado en duracion
  const getAnchoDuracion = useCallback((horaInicio: string, horaFin: string): number => {
    const [hi, mi] = horaInicio.split(':').map(Number)
    const [hf, mf] = horaFin.split(':').map(Number)
    let inicioDecimal = hi + mi / 60
    let finDecimal = hf + mf / 60
    if (finDecimal < inicioDecimal) finDecimal += 24 // Cruza medianoche
    return (finDecimal - inicioDecimal) * PIXEL_POR_HORA
  }, [])

  // Handlers de drag
  const handleDragStart = useCallback((item: DragItem) => {
    setDragItem(item)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, empleadoId: string, fecha: string, hora: number) => {
    e.preventDefault()
    setDragOverCell({ empleadoId, fecha, hora })
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, empleadoId: string, fecha: string, hora: number) => {
    e.preventDefault()
    setDragOverCell(null)

    if (!dragItem) return

    const horaStr = `${hora.toString().padStart(2, '0')}:00`
    const destino: DropResult = { empleadoId, fecha, hora: horaStr }

    // Mostrar dialogo de confirmacion
    setPendingMove({ item: dragItem, destino })
    setShowConfirmDialog(true)
    setDragItem(null)
  }, [dragItem])

  const handleConfirmMove = useCallback(async () => {
    if (!pendingMove) return

    setIsMoving(true)
    try {
      const { item, destino } = pendingMove
      let success = false

      switch (item.type) {
        case 'asignacion':
          if (onMoverAsignacion) {
            success = await onMoverAsignacion(item, destino)
          }
          break
        case 'parte':
          if (onMoverParte) {
            success = await onMoverParte(item.id, destino.empleadoId, destino.fecha, destino.hora)
          }
          break
        case 'tarea':
          if (onMoverTarea) {
            success = await onMoverTarea(item.id, destino.empleadoId, destino.fecha)
          }
          break
      }

      if (!success) {
        // El handler ya deberia mostrar el error
      }
    } finally {
      setIsMoving(false)
      setShowConfirmDialog(false)
      setPendingMove(null)
    }
  }, [pendingMove, onMoverAsignacion, onMoverParte, onMoverTarea])

  const handleCancelMove = useCallback(() => {
    setShowConfirmDialog(false)
    setPendingMove(null)
  }, [])

  // Renderizar bloque de asignacion (horario)
  const renderAsignacion = useCallback((
    empleadoId: string,
    fecha: string,
    asignacion: EmpleadoVista['dias'][string]['asignacion']
  ) => {
    if (!asignacion) return null

    const left = getHoraPosition(asignacion.horaInicio)
    const width = getAnchoDuracion(asignacion.horaInicio, asignacion.horaFin)

    return (
      <TooltipProvider key={`asig-${empleadoId}-${fecha}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              draggable
              onDragStart={() => handleDragStart({
                type: 'asignacion',
                id: `${empleadoId}-${fecha}`,
                empleadoId,
                fecha,
                horaInicio: asignacion.horaInicio,
                horaFin: asignacion.horaFin,
                data: asignacion,
              })}
              className={cn(
                'absolute top-1 h-8 rounded-md border-2 cursor-grab active:cursor-grabbing',
                'flex items-center gap-1 px-2 text-xs text-white font-medium shadow-sm',
                'hover:ring-2 hover:ring-offset-1 hover:ring-primary transition-all',
                asignacion.esAusencia
                  ? 'bg-red-400 border-red-500'
                  : 'bg-green-500 border-green-600'
              )}
              style={{ left: `${left}px`, width: `${Math.max(width, 40)}px` }}
              onClick={(e) => {
                e.stopPropagation()
                onClickAsignacion?.(fecha, empleadoId)
              }}
            >
              <GripVertical className="h-3 w-3 flex-shrink-0 opacity-50" />
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {asignacion.horaInicio}-{asignacion.horaFin}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{asignacion.horaInicio} - {asignacion.horaFin}</p>
              <p className="text-xs">{asignacion.horas}h</p>
              {asignacion.turnoNombre && <p className="text-xs">Turno: {asignacion.turnoNombre}</p>}
              {asignacion.notas && <p className="text-xs text-muted-foreground">{asignacion.notas}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }, [getHoraPosition, getAnchoDuracion, handleDragStart, onClickAsignacion])

  // Renderizar bloque de parte de trabajo
  const renderParte = useCallback((
    empleadoId: string,
    fecha: string,
    parte: ParteTrabajoDia,
    index: number
  ) => {
    const horaInicio = parte.horaInicio || '09:00'
    const horaFin = parte.horaFin || '10:00'
    const left = getHoraPosition(horaInicio)
    const width = getAnchoDuracion(horaInicio, horaFin)

    return (
      <TooltipProvider key={`parte-${parte._id}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              draggable
              onDragStart={() => handleDragStart({
                type: 'parte',
                id: parte._id,
                empleadoId,
                fecha,
                horaInicio,
                horaFin,
                data: parte,
              })}
              className={cn(
                'absolute h-7 rounded border-l-4 cursor-grab active:cursor-grabbing',
                'flex items-center gap-1 px-1.5 text-[10px] shadow-sm',
                'hover:ring-2 hover:ring-offset-1 hover:ring-primary transition-all',
                COLORES_PRIORIDAD[parte.prioridad as keyof typeof COLORES_PRIORIDAD] || COLORES_PRIORIDAD.normal,
                'text-white'
              )}
              style={{
                left: `${left}px`,
                width: `${Math.max(width, 60)}px`,
                top: `${12 + index * 28}px`,
              }}
              onClick={(e) => {
                e.stopPropagation()
                onClickParte?.(parte._id)
              }}
            >
              <GripVertical className="h-3 w-3 flex-shrink-0 opacity-50" />
              <Wrench className="h-3 w-3 flex-shrink-0" />
              <span className="truncate font-medium">{parte.codigo}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 max-w-xs">
              <p className="font-medium">{parte.codigo}</p>
              {parte.titulo && <p className="text-xs">{parte.titulo}</p>}
              <p className="text-xs text-muted-foreground">{parte.cliente}</p>
              {parte.direccion && (
                <p className="text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {parte.direccion}
                </p>
              )}
              {parte.horaInicio && <p className="text-xs">{parte.horaInicio} - {parte.horaFin}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }, [getHoraPosition, getAnchoDuracion, handleDragStart, onClickParte])

  // Renderizar bloque de tarea
  const renderTarea = useCallback((
    empleadoId: string,
    fecha: string,
    tarea: TareaDia,
    index: number,
    offsetPartes: number
  ) => {
    // Las tareas no tienen hora especifica, las colocamos al inicio
    const left = 0
    const width = PIXEL_POR_HORA * 2 // 2 horas de ancho por defecto

    return (
      <TooltipProvider key={`tarea-${tarea._id}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              draggable
              onDragStart={() => handleDragStart({
                type: 'tarea',
                id: tarea._id,
                empleadoId,
                fecha,
                data: tarea,
              })}
              className={cn(
                'absolute h-6 rounded border-l-4 cursor-grab active:cursor-grabbing',
                'flex items-center gap-1 px-1.5 text-[10px] shadow-sm',
                'hover:ring-2 hover:ring-offset-1 hover:ring-primary transition-all',
                tarea.prioridad === 'urgente'
                  ? 'bg-purple-500 border-purple-600'
                  : 'bg-slate-500 border-slate-600',
                'text-white'
              )}
              style={{
                left: `${left}px`,
                width: `${width}px`,
                top: `${12 + offsetPartes * 28 + index * 26}px`,
              }}
              onClick={(e) => {
                e.stopPropagation()
                onClickTarea?.(tarea._id)
              }}
            >
              <GripVertical className="h-2.5 w-2.5 flex-shrink-0 opacity-50" />
              <CheckSquare className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{tarea.titulo}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{tarea.titulo}</p>
              <p className="text-xs capitalize">{tarea.tipo}</p>
              {tarea.cliente && <p className="text-xs text-muted-foreground">{tarea.cliente}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }, [handleDragStart, onClickTarea])

  if (!vistaCompleta) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay datos de planificacion para mostrar
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header con horas */}
      <div className="flex border rounded-lg overflow-hidden">
        {/* Columna de empleados */}
        <div className="w-48 flex-shrink-0 bg-muted/50 border-r">
          <div className="h-10 flex items-center justify-center text-sm font-medium border-b">
            Empleado
          </div>
        </div>

        {/* Timeline con scroll */}
        <div className="flex-1 overflow-x-auto" ref={timelineRef}>
          <div style={{ minWidth: `${HORAS_VISIBLES.length * PIXEL_POR_HORA}px` }}>
            {/* Header de horas */}
            <div className="h-10 flex border-b bg-muted/30">
              {HORAS_VISIBLES.map((hora) => (
                <div
                  key={hora}
                  className="flex-shrink-0 border-r text-xs text-center flex items-center justify-center text-muted-foreground"
                  style={{ width: `${PIXEL_POR_HORA}px` }}
                >
                  {hora.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo con empleados y timeline */}
      <div className="border rounded-lg overflow-hidden">
        {fechasSemana.map((fechaInfo) => (
          <div key={fechaInfo.dateStr}>
            {/* Header del dia */}
            <div className={cn(
              'px-4 py-2 text-sm font-medium border-b',
              fechaInfo.esHoy ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-muted/30'
            )}>
              {fechaInfo.date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })}
            </div>

            {/* Filas de empleados para este dia */}
            {vistaCompleta.empleados.map((empleado) => {
              const diaInfo = empleado.dias[fechaInfo.dateStr]
              const partes = diaInfo?.partesTrabajo || []
              const tareas = diaInfo?.tareas || []
              const alturaFila = Math.max(40, 12 + partes.length * 28 + tareas.length * 26 + 8)

              return (
                <div key={`${fechaInfo.dateStr}-${empleado._id}`} className="flex border-b last:border-b-0">
                  {/* Info del empleado */}
                  <div className="w-48 flex-shrink-0 border-r bg-background p-2">
                    <div className="text-sm font-medium truncate">{empleado.nombreCompleto}</div>
                    {empleado.cargo && (
                      <div className="text-xs text-muted-foreground truncate">{empleado.cargo}</div>
                    )}
                  </div>

                  {/* Timeline del empleado */}
                  <div
                    className="flex-1 overflow-x-auto"
                    style={{ minHeight: `${alturaFila}px` }}
                  >
                    <div
                      className="relative"
                      style={{
                        minWidth: `${HORAS_VISIBLES.length * PIXEL_POR_HORA}px`,
                        height: `${alturaFila}px`,
                      }}
                    >
                      {/* Grid de horas (lineas verticales) */}
                      {HORAS_VISIBLES.map((hora) => (
                        <div
                          key={hora}
                          className={cn(
                            'absolute top-0 bottom-0 border-r border-dashed border-muted-foreground/20',
                            dragOverCell?.empleadoId === empleado._id &&
                            dragOverCell?.fecha === fechaInfo.dateStr &&
                            dragOverCell?.hora === hora &&
                            'bg-primary/10'
                          )}
                          style={{
                            left: `${(hora - HORA_INICIO_VISIBLE) * PIXEL_POR_HORA}px`,
                            width: `${PIXEL_POR_HORA}px`,
                          }}
                          onDragOver={(e) => handleDragOver(e, empleado._id, fechaInfo.dateStr, hora)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, empleado._id, fechaInfo.dateStr, hora)}
                          onClick={() => onClickAsignacion?.(fechaInfo.dateStr, empleado._id)}
                        />
                      ))}

                      {/* Asignacion de horario */}
                      {diaInfo?.asignacion && renderAsignacion(empleado._id, fechaInfo.dateStr, diaInfo.asignacion)}

                      {/* Partes de trabajo */}
                      {partes.map((parte, idx) => renderParte(empleado._id, fechaInfo.dateStr, parte, idx))}

                      {/* Tareas */}
                      {tareas.map((tarea, idx) => renderTarea(empleado._id, fechaInfo.dateStr, tarea, idx, partes.length))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Horario asignado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-400" />
          <span>Ausencia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Parte de trabajo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-slate-500" />
          <span>Tarea</span>
        </div>
      </div>

      {/* Dialog de confirmacion */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar cambio
            </DialogTitle>
            <DialogDescription>
              {pendingMove && (
                <div className="space-y-2 mt-2">
                  <p>
                    Vas a mover{' '}
                    <strong>
                      {pendingMove.item.type === 'asignacion' && 'el horario'}
                      {pendingMove.item.type === 'parte' && `el parte ${pendingMove.item.data.codigo}`}
                      {pendingMove.item.type === 'tarea' && `la tarea "${pendingMove.item.data.titulo}"`}
                    </strong>
                  </p>
                  <p>
                    Nueva fecha/hora:{' '}
                    <strong>
                      {new Date(pendingMove.destino.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      a las {pendingMove.destino.hora}
                    </strong>
                  </p>
                  {pendingMove.item.type === 'parte' && (
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                      Este cambio actualizara tambien el parte de trabajo.
                    </p>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelMove} disabled={isMoving}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmMove} disabled={isMoving}>
              {isMoving ? 'Moviendo...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
