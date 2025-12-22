'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WidgetWrapper } from './WidgetWrapper'
import { IWidget } from '@/services/dashboard.service'
import { tareasService, Tarea, EstadoTarea, PrioridadTarea } from '@/services/tareas.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TareasWidgetProps {
  widget: IWidget
  onRemove?: () => void
  onConfigure?: () => void
}

export function TareasWidget({ widget, onRemove, onConfigure }: TareasWidgetProps) {
  const router = useRouter()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    loadTareas()
  }, [])

  const loadTareas = async () => {
    try {
      const res = await tareasService.widget()
      setTareas(res.data || [])
    } catch (error) {
      console.error('Error cargando tareas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (tarea: Tarea, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompleting(tarea._id)
    try {
      await tareasService.cambiarEstado(tarea._id, { estado: EstadoTarea.COMPLETADA })
      toast.success('Tarea completada')
      loadTareas()
    } catch (error) {
      toast.error('Error al completar la tarea')
    } finally {
      setCompleting(null)
    }
  }

  const getPrioridadIcon = (prioridad: PrioridadTarea) => {
    switch (prioridad) {
      case PrioridadTarea.URGENTE:
        return <AlertTriangle className="h-3 w-3 text-red-600" />
      case PrioridadTarea.ALTA:
        return <AlertTriangle className="h-3 w-3 text-orange-500" />
      default:
        return null
    }
  }

  const getVencimientoInfo = (tarea: Tarea) => {
    if (!tarea.fechaVencimiento) return null

    const fechaVenc = new Date(tarea.fechaVencimiento)
    const ahora = new Date()
    const diffDays = Math.ceil((fechaVenc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { text: 'Vencida', class: 'text-red-600 bg-red-50' }
    } else if (diffDays === 0) {
      return { text: 'Hoy', class: 'text-orange-600 bg-orange-50' }
    } else if (diffDays === 1) {
      return { text: 'Mañana', class: 'text-amber-600 bg-amber-50' }
    } else if (diffDays <= 7) {
      return { text: `${diffDays} días`, class: 'text-blue-600 bg-blue-50' }
    }
    return { text: formatDate(tarea.fechaVencimiento), class: 'text-gray-600 bg-gray-50' }
  }

  if (loading) {
    return (
      <WidgetWrapper widget={widget} onRemove={onRemove} onConfigure={onConfigure}>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </WidgetWrapper>
    )
  }

  return (
    <WidgetWrapper widget={widget} onRemove={onRemove} onConfigure={onConfigure}>
      <ScrollArea className="h-full">
        {tareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">No hay tareas pendientes</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => router.push('/tareas/nuevo')}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva tarea
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {tareas.map((tarea) => {
              const vencInfo = getVencimientoInfo(tarea)
              const isCompleting = completing === tarea._id

              return (
                <div
                  key={tarea._id}
                  className="group flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/tareas/${tarea._id}`)}
                >
                  <div className="pt-0.5">
                    <Checkbox
                      checked={tarea.estado === EstadoTarea.COMPLETADA}
                      disabled={isCompleting}
                      onClick={(e) => handleComplete(tarea, e)}
                      className={cn(
                        "transition-all",
                        isCompleting && "opacity-50"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {getPrioridadIcon(tarea.prioridad)}
                      <span className={cn(
                        "text-sm font-medium truncate",
                        tarea.estado === EstadoTarea.COMPLETADA && "line-through text-muted-foreground"
                      )}>
                        {tarea.titulo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {vencInfo && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          vencInfo.class
                        )}>
                          {vencInfo.text}
                        </span>
                      )}
                      {tarea.asignadoANombre && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <User className="h-3 w-3" />
                          {tarea.asignadoANombre.split(' ')[0]}
                        </span>
                      )}
                      {tarea.clienteNombre && (
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {tarea.clienteNombre}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
      <div className="pt-2 border-t mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => router.push('/tareas')}
        >
          Ver todas las tareas
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </WidgetWrapper>
  )
}

export default TareasWidget
