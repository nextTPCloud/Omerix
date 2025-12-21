'use client'

import { ReactNode, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  RefreshCw,
  Settings,
  Trash2,
  Maximize2,
  Minimize2,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IWidget, TamanoWidget } from '@/services/dashboard.service'

interface WidgetWrapperProps {
  widget: IWidget
  titulo?: string
  subtitulo?: string
  children: ReactNode
  isLoading?: boolean
  error?: string
  onRefresh?: () => void
  onConfigure?: () => void
  onRemove?: () => void
  onResize?: (tamano: TamanoWidget) => void
  isDragging?: boolean
  className?: string
}

export function WidgetWrapper({
  widget,
  titulo,
  subtitulo,
  children,
  isLoading = false,
  error,
  onRefresh,
  onConfigure,
  onRemove,
  onResize,
  isDragging = false,
  className,
}: WidgetWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const displayTitulo = widget.config.titulo || titulo
  const displaySubtitulo = widget.config.subtitulo || subtitulo

  return (
    <Card
      className={cn(
        'h-full transition-shadow duration-200',
        isDragging && 'shadow-xl ring-2 ring-primary/50',
        isExpanded && 'fixed inset-4 z-50',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
          <div className="min-w-0">
            {displayTitulo && (
              <CardTitle className="text-sm font-medium truncate">
                {displayTitulo}
              </CardTitle>
            )}
            {displaySubtitulo && (
              <p className="text-xs text-muted-foreground truncate">{displaySubtitulo}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isLoading && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRefresh && (
                <DropdownMenuItem onClick={onRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar
                </DropdownMenuItem>
              )}
              {onConfigure && (
                <DropdownMenuItem onClick={onConfigure}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? (
                  <>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Minimizar
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Expandir
                  </>
                )}
              </DropdownMenuItem>
              {onRemove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onRemove}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
