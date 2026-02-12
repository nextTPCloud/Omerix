'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BLOCK_METADATA, BlockMetadata, BlockType } from './types'
import { useEditor } from './EditorContext'
import {
  Image,
  Building2,
  Type,
  FileText,
  User,
  Table,
  Calculator,
  CreditCard,
  Landmark,
  ScrollText,
  PenTool,
  AlignLeft,
  Minus,
  Square,
  ImagePlus,
  QrCode,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Magnet,
  Save,
  Eye,
  RotateCcw,
} from 'lucide-react'

// Mapeo de iconos
const ICON_MAP: Record<string, React.ElementType> = {
  Image,
  Building2,
  Type,
  FileText,
  User,
  Table,
  Calculator,
  CreditCard,
  Landmark,
  ScrollText,
  PenTool,
  AlignLeft,
  Minus,
  Square,
  ImagePlus,
  QrCode,
}

// Componente de bloque arrastrable en el toolbar
interface DraggableBlockProps {
  metadata: BlockMetadata
}

function DraggableBlock({ metadata }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `toolbar-${metadata.type}`,
    data: {
      type: metadata.type,
      fromToolbar: true,
    },
  })

  const Icon = ICON_MAP[metadata.icon] || Square

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="flex items-center gap-2 p-2 rounded-md border bg-white hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{metadata.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{metadata.label}</p>
          <p className="text-xs text-muted-foreground">{metadata.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Categorías de bloques
const categories = [
  { id: 'cabecera', label: 'Cabecera', color: 'bg-blue-100 text-blue-800' },
  { id: 'cuerpo', label: 'Cuerpo', color: 'bg-green-100 text-green-800' },
  { id: 'pie', label: 'Pie de Página', color: 'bg-amber-100 text-amber-800' },
  { id: 'utilidades', label: 'Utilidades', color: 'bg-purple-100 text-purple-800' },
]

interface EditorToolbarProps {
  onSave?: () => void
  onPreview?: () => void
  onReset?: () => void
  isSaving?: boolean
}

export function EditorToolbar({ onSave, onPreview, onReset, isSaving }: EditorToolbarProps) {
  const { state, dispatch, canUndo, canRedo, undo, redo } = useEditor()

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col h-full">
      {/* Barra de herramientas superior */}
      <div className="p-3 border-b bg-white space-y-2">
        {/* Acciones principales */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-1">
            {onPreview && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onPreview}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Vista Previa</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {onReset && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onReset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Restaurar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Zoom */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => dispatch({ type: 'SET_ZOOM', payload: state.zoom - 10 })}
              disabled={state.zoom <= 25}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs w-10 text-center">{state.zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => dispatch({ type: 'SET_ZOOM', payload: state.zoom + 10 })}
              disabled={state.zoom >= 200}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Opciones de cuadrícula */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={state.showGrid ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1 h-7"
                  onClick={() => dispatch({ type: 'TOGGLE_GRID' })}
                >
                  <Grid3X3 className="h-3 w-3 mr-1" />
                  <span className="text-xs">Cuadrícula</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mostrar/ocultar cuadrícula</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={state.snapToGrid ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1 h-7"
                  onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
                >
                  <Magnet className="h-3 w-3 mr-1" />
                  <span className="text-xs">Ajustar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ajustar a cuadrícula</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Botón guardar */}
        {onSave && (
          <Button className="w-full" onClick={onSave} disabled={isSaving || !state.isDirty}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        )}
      </div>

      {/* Lista de bloques arrastrables */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Bloques Disponibles
          </div>
          <p className="text-xs text-muted-foreground">
            Arrastra los bloques al documento para añadirlos
          </p>

          {categories.map((category) => {
            const blocks = BLOCK_METADATA.filter(b => b.category === category.id)
            if (blocks.length === 0) return null

            return (
              <div key={category.id} className="space-y-2">
                <Badge variant="outline" className={`text-xs ${category.color}`}>
                  {category.label}
                </Badge>
                <div className="space-y-1">
                  {blocks.map((metadata) => (
                    <DraggableBlock key={metadata.type} metadata={metadata} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Indicador de estado */}
      {state.isDirty && (
        <div className="p-2 border-t bg-amber-50">
          <p className="text-xs text-amber-700 text-center">
            Hay cambios sin guardar
          </p>
        </div>
      )}
    </div>
  )
}
