'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mesa, FormaMesa, EstadoMesa, mesasService } from '@/services/salones.service'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Save,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  Plus,
  Move,
  Grid3X3,
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SalonEditorProps {
  salonId: string
  salonNombre: string
  plano: {
    ancho: number
    alto: number
    imagenFondo?: string
    escala: number
  }
  mesas: Mesa[]
  onMesasChange: (mesas: Mesa[]) => void
  onSave: () => Promise<void>
}

interface Position {
  x: number
  y: number
}

const FORMAS: { value: FormaMesa; label: string }[] = [
  { value: 'cuadrada', label: 'Cuadrada' },
  { value: 'rectangular', label: 'Rectangular' },
  { value: 'redonda', label: 'Redonda' },
  { value: 'ovalada', label: 'Ovalada' },
]

const ESTADOS_COLORES: Record<EstadoMesa, string> = {
  libre: '#22c55e',
  ocupada: '#ef4444',
  reservada: '#3b82f6',
  cuenta_pedida: '#f59e0b',
  por_limpiar: '#8b5cf6',
  fuera_servicio: '#6b7280',
}

export function SalonEditor({
  salonId,
  salonNombre,
  plano,
  mesas,
  onMesasChange,
  onSave,
}: SalonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [selectedMesa, setSelectedMesa] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [showLabels, setShowLabels] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Dialog para nueva mesa
  const [showNewMesaDialog, setShowNewMesaDialog] = useState(false)
  const [newMesaPosition, setNewMesaPosition] = useState<Position>({ x: 100, y: 100 })
  const [newMesaData, setNewMesaData] = useState({
    numero: '',
    forma: 'cuadrada' as FormaMesa,
    capacidadMaxima: 4,
    ancho: 80,
    alto: 80,
  })

  // Dialog para editar mesa
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null)

  const snapToGridValue = (value: number): number => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }

  const handleMouseDown = (e: React.MouseEvent, mesaId: string) => {
    if (isLocked) return
    e.preventDefault()
    e.stopPropagation()

    const mesa = mesas.find((m) => m._id === mesaId)
    if (!mesa) return

    setSelectedMesa(mesaId)
    setIsDragging(true)

    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const x = (e.clientX - rect.left) / zoom - mesa.posicion.x
      const y = (e.clientY - rect.top) / zoom - mesa.posicion.y
      setDragOffset({ x, y })
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !selectedMesa || isLocked) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      let newX = (e.clientX - rect.left) / zoom - dragOffset.x
      let newY = (e.clientY - rect.top) / zoom - dragOffset.y

      // Aplicar snap to grid
      newX = snapToGridValue(newX)
      newY = snapToGridValue(newY)

      // Limitar al área del plano
      const mesa = mesas.find((m) => m._id === selectedMesa)
      if (mesa) {
        newX = Math.max(0, Math.min(newX, plano.ancho - mesa.dimensiones.ancho))
        newY = Math.max(0, Math.min(newY, plano.alto - mesa.dimensiones.alto))
      }

      const updatedMesas = mesas.map((m) =>
        m._id === selectedMesa
          ? { ...m, posicion: { ...m.posicion, x: newX, y: newY } }
          : m
      )
      onMesasChange(updatedMesas)
      setHasChanges(true)
    },
    [isDragging, selectedMesa, dragOffset, zoom, mesas, plano, snapToGrid, gridSize, isLocked]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setSelectedMesa(null)
    }
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (isLocked) return
    if (e.target !== containerRef.current) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = snapToGridValue((e.clientX - rect.left) / zoom)
    const y = snapToGridValue((e.clientY - rect.top) / zoom)

    setNewMesaPosition({ x, y })
    setNewMesaData({
      numero: `${mesas.length + 1}`,
      forma: 'cuadrada',
      capacidadMaxima: 4,
      ancho: 80,
      alto: 80,
    })
    setShowNewMesaDialog(true)
  }

  const handleRotateMesa = (mesaId: string, degrees: number) => {
    if (isLocked) return
    const updatedMesas = mesas.map((m) =>
      m._id === mesaId
        ? { ...m, posicion: { ...m.posicion, rotacion: (m.posicion.rotacion + degrees) % 360 } }
        : m
    )
    onMesasChange(updatedMesas)
    setHasChanges(true)
  }

  const handleDeleteMesa = async (mesaId: string) => {
    if (isLocked) return
    if (!confirm('¿Eliminar esta mesa?')) return

    try {
      await mesasService.delete(mesaId)
      const updatedMesas = mesas.filter((m) => m._id !== mesaId)
      onMesasChange(updatedMesas)
      setSelectedMesa(null)
      toast.success('Mesa eliminada')
    } catch (error) {
      toast.error('Error al eliminar la mesa')
    }
  }

  const handleDuplicateMesa = async (mesa: Mesa) => {
    if (isLocked) return
    try {
      const newMesa = await mesasService.create({
        numero: `${mesa.numero}_copia`,
        salonId,
        posicion: {
          x: mesa.posicion.x + 50,
          y: mesa.posicion.y + 50,
          rotacion: mesa.posicion.rotacion,
        },
        forma: mesa.forma,
        dimensiones: mesa.dimensiones,
        capacidadMinima: mesa.capacidadMinima,
        capacidadMaxima: mesa.capacidadMaxima,
      })
      onMesasChange([...mesas, newMesa.data])
      setHasChanges(true)
      toast.success('Mesa duplicada')
    } catch (error) {
      toast.error('Error al duplicar la mesa')
    }
  }

  const handleCreateMesa = async () => {
    if (!newMesaData.numero.trim()) {
      toast.error('El número de mesa es obligatorio')
      return
    }

    try {
      const response = await mesasService.create({
        numero: newMesaData.numero,
        salonId,
        posicion: {
          x: newMesaPosition.x,
          y: newMesaPosition.y,
          rotacion: 0,
        },
        forma: newMesaData.forma,
        dimensiones: {
          ancho: newMesaData.ancho,
          alto: newMesaData.alto,
        },
        capacidadMinima: 1,
        capacidadMaxima: newMesaData.capacidadMaxima,
      })
      onMesasChange([...mesas, response.data])
      setShowNewMesaDialog(false)
      setHasChanges(true)
      toast.success('Mesa creada')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear la mesa')
    }
  }

  const handleEditMesa = (mesa: Mesa) => {
    setEditingMesa(mesa)
    setShowEditDialog(true)
  }

  const handleSaveEditMesa = async () => {
    if (!editingMesa) return

    try {
      await mesasService.update(editingMesa._id, {
        numero: editingMesa.numero,
        forma: editingMesa.forma,
        dimensiones: editingMesa.dimensiones,
        capacidadMaxima: editingMesa.capacidadMaxima,
      })
      const updatedMesas = mesas.map((m) =>
        m._id === editingMesa._id ? editingMesa : m
      )
      onMesasChange(updatedMesas)
      setShowEditDialog(false)
      setEditingMesa(null)
      setHasChanges(true)
      toast.success('Mesa actualizada')
    } catch (error) {
      toast.error('Error al actualizar la mesa')
    }
  }

  const handleSavePositions = async () => {
    try {
      setSaving(true)
      const posiciones = mesas.map((m) => ({
        id: m._id,
        x: m.posicion.x,
        y: m.posicion.y,
        rotacion: m.posicion.rotacion,
      }))
      await mesasService.actualizarPosiciones(posiciones)
      await onSave()
      setHasChanges(false)
      toast.success('Posiciones guardadas')
    } catch (error) {
      toast.error('Error al guardar las posiciones')
    } finally {
      setSaving(false)
    }
  }

  const getMesaShape = (mesa: Mesa) => {
    const baseStyle: React.CSSProperties = {
      width: mesa.dimensiones.ancho,
      height: mesa.dimensiones.alto,
      backgroundColor: mesa.colores?.fondo || ESTADOS_COLORES[mesa.estado] + '30',
      borderColor: mesa.colores?.borde || ESTADOS_COLORES[mesa.estado],
      borderWidth: 3,
      borderStyle: 'solid',
    }

    switch (mesa.forma) {
      case 'redonda':
        return { ...baseStyle, borderRadius: '50%' }
      case 'ovalada':
        return { ...baseStyle, borderRadius: '50%' }
      case 'rectangular':
        return { ...baseStyle, borderRadius: 4 }
      case 'cuadrada':
      default:
        return { ...baseStyle, borderRadius: 4 }
    }
  }

  const renderMesa = (mesa: Mesa) => {
    const isSelected = selectedMesa === mesa._id
    const style = getMesaShape(mesa)

    return (
      <ContextMenu key={mesa._id}>
        <ContextMenuTrigger>
          <div
            className={cn(
              'absolute cursor-move flex items-center justify-center transition-shadow select-none',
              isSelected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
              isDragging && selectedMesa === mesa._id && 'opacity-80',
              isLocked && 'cursor-not-allowed'
            )}
            style={{
              ...style,
              left: mesa.posicion.x,
              top: mesa.posicion.y,
              transform: `rotate(${mesa.posicion.rotacion || 0}deg)`,
            }}
            onMouseDown={(e) => handleMouseDown(e, mesa._id)}
            onDoubleClick={() => !isLocked && handleEditMesa(mesa)}
          >
            {showLabels && (
              <div className="text-center pointer-events-none">
                <div
                  className="font-bold text-sm"
                  style={{ color: mesa.colores?.texto || ESTADOS_COLORES[mesa.estado] }}
                >
                  {mesa.numero}
                </div>
                <div className="text-xs opacity-70" style={{ color: mesa.colores?.texto || ESTADOS_COLORES[mesa.estado] }}>
                  {mesa.capacidadMaxima}p
                </div>
              </div>
            )}

            {/* Indicador de estado */}
            <div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: ESTADOS_COLORES[mesa.estado] }}
              title={mesasService.getEstadoLabel(mesa.estado)}
            />
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => handleEditMesa(mesa)}>
            <Settings className="mr-2 h-4 w-4" />
            Editar mesa
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleRotateMesa(mesa._id, 45)}>
            <RotateCw className="mr-2 h-4 w-4" />
            Rotar 45°
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleDuplicateMesa(mesa)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleDeleteMesa(mesa._id)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(1)}
              title="Restablecer zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              title="Mostrar/ocultar cuadrícula"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={snapToGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
              title="Ajustar a cuadrícula"
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant={showLabels ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
              title="Mostrar/ocultar etiquetas"
            >
              {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant={isLocked ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setIsLocked(!isLocked)}
              title={isLocked ? 'Desbloquear edición' : 'Bloquear edición'}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewMesaPosition({ x: 100, y: 100 })
                setNewMesaData({
                  numero: `${mesas.length + 1}`,
                  forma: 'cuadrada',
                  capacidadMaxima: 4,
                  ancho: 80,
                  alto: 80,
                })
                setShowNewMesaDialog(true)
              }}
              disabled={isLocked}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Mesa
            </Button>
            <Button
              size="sm"
              onClick={handleSavePositions}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </Card>

      {/* Leyenda de estados */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ESTADOS_COLORES).map(([estado, color]) => (
          <Badge
            key={estado}
            variant="outline"
            className="text-xs"
            style={{ borderColor: color, color }}
          >
            <div
              className="w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: color }}
            />
            {mesasService.getEstadoLabel(estado as EstadoMesa)}
          </Badge>
        ))}
      </div>

      {/* Canvas del plano */}
      <Card className="overflow-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
          }}
        >
          <div
            ref={containerRef}
            className="relative border-2 border-dashed border-muted-foreground/30 bg-muted/20"
            style={{
              width: plano.ancho,
              height: plano.alto,
              backgroundImage: plano.imagenFondo
                ? `url(${plano.imagenFondo})`
                : showGrid
                ? `
                    linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                  `
                : 'none',
              backgroundSize: plano.imagenFondo
                ? 'cover'
                : `${gridSize}px ${gridSize}px`,
              backgroundPosition: 'top left',
            }}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
          >
            {/* Dimensiones del plano */}
            <div className="absolute -top-6 left-0 text-xs text-muted-foreground">
              {plano.ancho} x {plano.alto} px
            </div>

            {/* Mesas */}
            {mesas.map(renderMesa)}

            {/* Mensaje si no hay mesas */}
            {mesas.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Grid3X3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No hay mesas en este salón</p>
                  <p className="text-sm">Haz doble clic para añadir una mesa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Info de mesa seleccionada */}
      {selectedMesa && (
        <Card className="p-3">
          {(() => {
            const mesa = mesas.find((m) => m._id === selectedMesa)
            if (!mesa) return null
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="font-bold">
                    Mesa {mesa.numero}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Posición: ({Math.round(mesa.posicion.x)}, {Math.round(mesa.posicion.y)})
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Rotación: {mesa.posicion.rotacion}°
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Capacidad: {mesa.capacidadMaxima} personas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRotateMesa(selectedMesa, 45)}
                    disabled={isLocked}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMesa(mesa)}
                    disabled={isLocked}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMesa(selectedMesa)}
                    disabled={isLocked}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })()}
        </Card>
      )}

      {/* Dialog Nueva Mesa */}
      <Dialog open={showNewMesaDialog} onOpenChange={setShowNewMesaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Mesa</DialogTitle>
            <DialogDescription>
              Añadir una nueva mesa en la posición ({newMesaPosition.x}, {newMesaPosition.y})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número *</Label>
                <Input
                  value={newMesaData.numero}
                  onChange={(e) => setNewMesaData({ ...newMesaData, numero: e.target.value })}
                  placeholder="Ej: 1, A1, T1..."
                />
              </div>
              <div className="space-y-2">
                <Label>Forma</Label>
                <SearchableSelect
                  value={newMesaData.forma}
                  onValueChange={(v) => setNewMesaData({ ...newMesaData, forma: v as FormaMesa })}
                  options={FORMAS}
                  placeholder="Seleccionar"
                  searchPlaceholder="Buscar..."
                  emptyMessage="Sin resultados"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ancho (px)</Label>
                <Input
                  type="number"
                  value={newMesaData.ancho}
                  onChange={(e) => setNewMesaData({ ...newMesaData, ancho: parseInt(e.target.value) || 80 })}
                  min={40}
                  max={300}
                />
              </div>
              <div className="space-y-2">
                <Label>Alto (px)</Label>
                <Input
                  type="number"
                  value={newMesaData.alto}
                  onChange={(e) => setNewMesaData({ ...newMesaData, alto: parseInt(e.target.value) || 80 })}
                  min={40}
                  max={300}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  value={newMesaData.capacidadMaxima}
                  onChange={(e) => setNewMesaData({ ...newMesaData, capacidadMaxima: parseInt(e.target.value) || 4 })}
                  min={1}
                  max={20}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMesaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMesa}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Mesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Mesa */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Mesa</DialogTitle>
            <DialogDescription>
              Modificar las propiedades de la mesa
            </DialogDescription>
          </DialogHeader>

          {editingMesa && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input
                    value={editingMesa.numero}
                    onChange={(e) => setEditingMesa({ ...editingMesa, numero: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma</Label>
                  <SearchableSelect
                    value={editingMesa.forma}
                    onValueChange={(v) => setEditingMesa({ ...editingMesa, forma: v as FormaMesa })}
                    options={FORMAS}
                    placeholder="Seleccionar"
                    searchPlaceholder="Buscar..."
                    emptyMessage="Sin resultados"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ancho (px)</Label>
                  <Input
                    type="number"
                    value={editingMesa.dimensiones.ancho}
                    onChange={(e) =>
                      setEditingMesa({
                        ...editingMesa,
                        dimensiones: { ...editingMesa.dimensiones, ancho: parseInt(e.target.value) || 80 },
                      })
                    }
                    min={40}
                    max={300}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alto (px)</Label>
                  <Input
                    type="number"
                    value={editingMesa.dimensiones.alto}
                    onChange={(e) =>
                      setEditingMesa({
                        ...editingMesa,
                        dimensiones: { ...editingMesa.dimensiones, alto: parseInt(e.target.value) || 80 },
                      })
                    }
                    min={40}
                    max={300}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    value={editingMesa.capacidadMaxima}
                    onChange={(e) =>
                      setEditingMesa({ ...editingMesa, capacidadMaxima: parseInt(e.target.value) || 4 })
                    }
                    min={1}
                    max={20}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Posición X</Label>
                  <Input
                    type="number"
                    value={Math.round(editingMesa.posicion.x)}
                    onChange={(e) =>
                      setEditingMesa({
                        ...editingMesa,
                        posicion: { ...editingMesa.posicion, x: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Posición Y</Label>
                  <Input
                    type="number"
                    value={Math.round(editingMesa.posicion.y)}
                    onChange={(e) =>
                      setEditingMesa({
                        ...editingMesa,
                        posicion: { ...editingMesa.posicion, y: parseInt(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rotación (°)</Label>
                  <Input
                    type="number"
                    value={editingMesa.posicion.rotacion}
                    onChange={(e) =>
                      setEditingMesa({
                        ...editingMesa,
                        posicion: { ...editingMesa.posicion, rotacion: parseInt(e.target.value) || 0 },
                      })
                    }
                    min={0}
                    max={359}
                    step={15}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditMesa}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
