'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditor } from './EditorContext'
import { EditorBlock, BlockType, BLOCK_METADATA } from './types'
import { cn } from '@/lib/utils'
import {
  GripVertical,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Settings,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

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

// Componente de bloque individual en el canvas
interface CanvasBlockProps {
  block: EditorBlock
  isSelected: boolean
  onClick: () => void
  onRemove: () => void
  onDuplicate: () => void
  onToggleLock: () => void
  onToggleVisibility: () => void
}

function CanvasBlock({
  block,
  isSelected,
  onClick,
  onRemove,
  onDuplicate,
  onToggleLock,
  onToggleVisibility,
}: CanvasBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    disabled: block.locked,
  })

  const metadata = BLOCK_METADATA.find(m => m.type === block.type)
  const Icon = metadata ? ICON_MAP[metadata.icon] : Square

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : block.visible === false ? 0.4 : 1,
    width: `${block.position.width}%`,
    marginLeft: `${block.position.x}%`,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group border-2 rounded-md bg-white mb-2 transition-all',
        isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-300',
        isDragging && 'shadow-xl z-50',
        block.locked && 'border-dashed',
        block.visible === false && 'bg-gray-100'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {/* Barra de control */}
      <div
        className={cn(
          'absolute -top-8 left-0 right-0 flex items-center justify-between bg-gray-800 text-white rounded-t-md px-2 py-1 text-xs transition-opacity',
          isSelected || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className={cn(
              'cursor-grab active:cursor-grabbing p-1 hover:bg-gray-700 rounded',
              block.locked && 'cursor-not-allowed opacity-50'
            )}
          >
            <GripVertical className="h-3 w-3" />
          </div>
          <Icon className="h-3 w-3" />
          <span className="font-medium">{metadata?.label || block.type}</span>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleVisibility()
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {block.visible === false ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {block.visible === false ? 'Mostrar' : 'Ocultar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleLock()
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {block.locked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {block.locked ? 'Desbloquear' : 'Bloquear'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate()
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Duplicar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                  }}
                  className="p-1 hover:bg-red-600 rounded"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Contenido del bloque */}
      <div className="p-3 min-h-[40px]">
        <BlockContent block={block} />
      </div>

      {/* Indicador de selección */}
      {isSelected && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full" />
      )}
    </div>
  )
}

// Contenido visual de cada tipo de bloque
function BlockContent({ block }: { block: EditorBlock }) {
  const { state } = useEditor()
  const { globalStyles } = state.layout

  switch (block.type) {
    case 'logo':
      return (
        <div
          className="flex items-center justify-center p-4 rounded"
          style={{ backgroundColor: globalStyles.secondaryColor + '20' }}
        >
          <div
            className="text-sm font-bold px-4 py-2 rounded"
            style={{ backgroundColor: globalStyles.primaryColor, color: 'white' }}
          >
            LOGO
          </div>
        </div>
      )

    case 'empresa-info':
      return (
        <div className="space-y-1 text-sm">
          <div className="font-bold" style={{ color: globalStyles.textColor }}>Mi Empresa S.L.</div>
          {block.config?.showNIF && <div className="text-xs text-gray-500">NIF: B12345678</div>}
          {block.config?.showDireccion && <div className="text-xs text-gray-500">C/ Principal, 123 - 28001 Madrid</div>}
          {block.config?.showContacto && <div className="text-xs text-gray-500">Tel: 912 345 678</div>}
        </div>
      )

    case 'documento-titulo':
      return (
        <div
          className="text-2xl font-bold"
          style={{
            color: globalStyles.primaryColor,
            textAlign: block.style?.textAlign || 'right',
          }}
        >
          {block.config?.titulo || 'FACTURA'}
        </div>
      )

    case 'documento-info':
      return (
        <div className="text-sm space-y-1" style={{ textAlign: block.style?.textAlign || 'right' }}>
          {block.config?.showNumero && <div>Nº: <strong>F2024-0001</strong></div>}
          {block.config?.showFecha && <div className="text-gray-500">Fecha: 15/01/2024</div>}
          {block.config?.showVencimiento && <div className="text-gray-500">Vencimiento: 15/02/2024</div>}
        </div>
      )

    case 'cliente-info':
      return (
        <div
          className="p-3 rounded space-y-1 text-sm"
          style={{ backgroundColor: globalStyles.backgroundColor, border: `1px solid ${globalStyles.secondaryColor}40` }}
        >
          {block.config?.showTitulo && (
            <div className="font-semibold text-xs mb-2" style={{ color: globalStyles.primaryColor }}>
              DATOS DEL CLIENTE
            </div>
          )}
          <div className="font-bold">Cliente Ejemplo S.A.</div>
          {block.config?.showNIF && <div className="text-gray-500">NIF: A87654321</div>}
          {block.config?.showDireccion && (
            <>
              <div className="text-gray-500">Av. Secundaria, 456</div>
              <div className="text-gray-500">08001 Barcelona</div>
            </>
          )}
        </div>
      )

    case 'tabla-lineas':
      return (
        <div className="overflow-hidden rounded border" style={{ borderColor: globalStyles.secondaryColor + '40' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: globalStyles.primaryColor, color: 'white' }}>
                {block.config?.columnas?.includes('referencia') && <th className="p-2 text-left">Ref.</th>}
                {block.config?.columnas?.includes('descripcion') && <th className="p-2 text-left">Descripción</th>}
                {block.config?.columnas?.includes('cantidad') && <th className="p-2 text-right">Cant.</th>}
                {block.config?.columnas?.includes('precio') && <th className="p-2 text-right">Precio</th>}
                {block.config?.columnas?.includes('subtotal') && <th className="p-2 text-right">Subtotal</th>}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((_, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: block.config?.filasZebra && i % 2 === 1
                      ? globalStyles.secondaryColor + '10'
                      : 'transparent',
                  }}
                >
                  {block.config?.columnas?.includes('referencia') && <td className="p-2">PROD00{i + 1}</td>}
                  {block.config?.columnas?.includes('descripcion') && <td className="p-2">Producto de ejemplo {i + 1}</td>}
                  {block.config?.columnas?.includes('cantidad') && <td className="p-2 text-right">{(i + 1) * 2}</td>}
                  {block.config?.columnas?.includes('precio') && <td className="p-2 text-right">{((i + 1) * 25).toFixed(2)} €</td>}
                  {block.config?.columnas?.includes('subtotal') && <td className="p-2 text-right font-medium">{((i + 1) * 50).toFixed(2)} €</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'totales':
      return (
        <div className="text-sm space-y-1" style={{ textAlign: block.style?.textAlign || 'right' }}>
          {block.config?.showSubtotal && (
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>300.00 €</span>
            </div>
          )}
          {block.config?.showBaseImponible && (
            <div className="flex justify-between">
              <span>Base Imponible:</span>
              <span>300.00 €</span>
            </div>
          )}
          {block.config?.showIVA && (
            <div className="flex justify-between">
              <span>IVA 21%:</span>
              <span>63.00 €</span>
            </div>
          )}
          {block.config?.showTotal && (
            <div
              className="flex justify-between font-bold text-base p-2 rounded mt-2"
              style={{
                backgroundColor: block.config?.resaltarTotal ? globalStyles.primaryColor : 'transparent',
                color: block.config?.resaltarTotal ? 'white' : globalStyles.textColor,
              }}
            >
              <span>TOTAL:</span>
              <span>363.00 €</span>
            </div>
          )}
        </div>
      )

    case 'forma-pago':
      return (
        <div className="text-sm">
          <div className="font-semibold mb-1">Forma de Pago</div>
          <div className="text-gray-500">Transferencia bancaria</div>
          {block.config?.showVencimientos && (
            <div className="text-gray-500 mt-1">Vencimiento: 15/02/2024</div>
          )}
        </div>
      )

    case 'datos-bancarios':
      return (
        <div className="text-sm">
          <div className="font-semibold mb-1">Datos Bancarios</div>
          <div className="text-gray-500 font-mono text-xs">ES12 1234 5678 9012 3456 7890</div>
        </div>
      )

    case 'condiciones':
      return (
        <div className="text-xs text-gray-500 italic">
          {block.config?.texto || 'Condiciones y notas del documento...'}
        </div>
      )

    case 'firma':
      return (
        <div className="text-center">
          <div
            className="border-t-2 border-dashed mx-auto"
            style={{ borderColor: globalStyles.secondaryColor, width: '80%' }}
          />
          <div className="text-xs text-gray-500 mt-2">{block.config?.textoDebajo || 'Firma y sello'}</div>
        </div>
      )

    case 'texto-libre':
      return (
        <div
          className="text-sm"
          style={{
            textAlign: block.style?.textAlign || 'left',
            color: block.style?.color || globalStyles.textColor,
          }}
        >
          {block.config?.texto || 'Texto personalizado'}
        </div>
      )

    case 'separador':
      return (
        <div
          className="border-t"
          style={{
            borderColor: block.style?.borderColor || globalStyles.secondaryColor,
            borderWidth: block.style?.borderWidth || 1,
          }}
        />
      )

    case 'espacio':
      return <div style={{ height: block.position.height === 'auto' ? 20 : block.position.height }} />

    case 'imagen':
      return (
        <div
          className="flex items-center justify-center p-4 rounded bg-gray-100 text-gray-400"
          style={{ minHeight: 60 }}
        >
          <ImagePlus className="h-8 w-8" />
        </div>
      )

    case 'qr-code':
      return (
        <div
          className="flex items-center justify-center p-2 bg-white border rounded"
          style={{ width: block.config?.tamaño || 60, height: block.config?.tamaño || 60 }}
        >
          <QrCode className="h-full w-full text-gray-800" />
        </div>
      )

    default:
      return (
        <div className="text-sm text-gray-500 italic">
          Bloque: {block.type}
        </div>
      )
  }
}

// Componente de sección droppable
interface DropSectionProps {
  sectionId: string
  sectionName: string
  blocks: EditorBlock[]
  children?: React.ReactNode
}

function DropSection({ sectionId, sectionName, blocks }: DropSectionProps) {
  const { state, selectBlock, updateBlock, removeBlock, dispatch } = useEditor()

  const { setNodeRef, isOver } = useDroppable({
    id: sectionId,
    data: {
      sectionId,
      accepts: ['block'],
    },
  })

  const handleDuplicate = (block: EditorBlock) => {
    const newBlock: EditorBlock = {
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      locked: false,
    }
    dispatch({ type: 'ADD_BLOCK', payload: { sectionId, block: newBlock } })
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] p-4 rounded-lg border-2 border-dashed transition-colors',
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50/50'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          {sectionName}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {blocks.length} {blocks.length === 1 ? 'bloque' : 'bloques'}
        </span>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-8">
          Arrastra bloques aquí
        </div>
      ) : (
        <SortableContext
          items={blocks.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {blocks.map((block) => (
              <CanvasBlock
                key={block.id}
                block={block}
                isSelected={state.selectedBlockId === block.id}
                onClick={() => selectBlock(block.id)}
                onRemove={() => removeBlock(block.id)}
                onDuplicate={() => handleDuplicate(block)}
                onToggleLock={() => updateBlock(block.id, { locked: !block.locked })}
                onToggleVisibility={() => updateBlock(block.id, { visible: block.visible === false ? true : false })}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

// Componente principal del canvas
export function EditorCanvas() {
  const { state, selectBlock } = useEditor()
  const { layout, zoom, showGrid } = state

  return (
    <div
      className="flex-1 overflow-auto p-8"
      style={{
        backgroundColor: '#e5e7eb',
        backgroundImage: showGrid
          ? 'linear-gradient(#d1d5db 1px, transparent 1px), linear-gradient(90deg, #d1d5db 1px, transparent 1px)'
          : 'none',
        backgroundSize: `${state.gridSize * 2}px ${state.gridSize * 2}px`,
      }}
      onClick={() => selectBlock(null)}
    >
      {/* Documento */}
      <div
        className="mx-auto bg-white shadow-xl rounded-sm overflow-hidden"
        style={{
          width: `${210 * (zoom / 100)}mm`,
          minHeight: `${297 * (zoom / 100)}mm`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="p-6 space-y-4">
          {layout.sections.map((section) => (
            <DropSection
              key={section.id}
              sectionId={section.id}
              sectionName={section.name}
              blocks={section.blocks}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
