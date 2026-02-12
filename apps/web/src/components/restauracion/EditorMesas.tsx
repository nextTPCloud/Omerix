'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Salon,
  Mesa,
  CreateMesaDTO,
  UpdateMesaDTO,
  FormaMesa,
  mesasService,
} from '@/services/salones.service'
import { toast } from 'sonner'
import {
  Plus,
  Loader2,
  Save,
  Trash2,
  RotateCw,
  Move,
  Square,
  Circle,
  RectangleHorizontal,
  MoreVertical,
  Settings,
  Users,
  Star,
  ZoomIn,
  ZoomOut,
  Grid,
  Pencil,
} from 'lucide-react'

interface EditorMesasProps {
  salon: Salon
  mesas: Mesa[]
  onMesasUpdated: () => void
}

const CELL_SIZE = 30 // Tamano de cada celda en pixels
const FORMAS: { value: FormaMesa; label: string; icon: React.ReactNode }[] = [
  { value: 'cuadrada', label: 'Cuadrada', icon: <Square className="h-4 w-4" /> },
  { value: 'rectangular', label: 'Rectangular', icon: <RectangleHorizontal className="h-4 w-4" /> },
  { value: 'redonda', label: 'Redonda', icon: <Circle className="h-4 w-4" /> },
  { value: 'ovalada', label: 'Ovalada', icon: <Circle className="h-4 w-4" /> },
]

export function EditorMesas({ salon, mesas, onMesasUpdated }: EditorMesasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Estado
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null)
  const [draggingMesa, setDraggingMesa] = useState<Mesa | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [mesaPositions, setMesaPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Dialogos
  const [showMesaDialog, setShowMesaDialog] = useState(false)
  const [mesaEditando, setMesaEditando] = useState<Mesa | null>(null)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkCantidad, setBulkCantidad] = useState(10)
  const [bulkPrefijo, setBulkPrefijo] = useState('')

  // Formulario de mesa
  const [formMesa, setFormMesa] = useState<CreateMesaDTO>({
    numero: '',
    nombre: '',
    salonId: salon._id,
    forma: 'cuadrada',
    dimensiones: { ancho: 2, alto: 2 },
    capacidadMinima: 1,
    capacidadMaxima: 4,
    configuracion: {
      prioridad: 5,
      esVIP: false,
      esFumadores: false,
      tieneEnchufe: false,
      tieneVistas: false,
      esAccesible: true,
      requiereReserva: false,
    },
    activo: true,
  })

  // Inicializar posiciones
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    mesas.forEach((mesa) => {
      positions[mesa._id] = { x: mesa.posicion.x, y: mesa.posicion.y }
    })
    setMesaPositions(positions)
    setHasChanges(false)
  }, [mesas])

  // Dimensiones del plano
  const planoAncho = (salon.plano?.ancho || 20) * CELL_SIZE * zoom
  const planoAlto = (salon.plano?.alto || 15) * CELL_SIZE * zoom

  // Obtener siguiente numero de mesa
  const getNextMesaNumber = useCallback(() => {
    if (mesas.length === 0) return '1'
    const numeros = mesas.map((m) => parseInt(m.numero) || 0).filter((n) => !isNaN(n))
    if (numeros.length === 0) return '1'
    return String(Math.max(...numeros) + 1)
  }, [mesas])

  // Calcular posicion libre para nueva mesa
  const getNextFreePosition = useCallback(() => {
    const gridAncho = salon.plano?.ancho || 20
    const ocupadas = new Set(mesas.map((m) => `${m.posicion.x}-${m.posicion.y}`))

    for (let y = 1; y < (salon.plano?.alto || 15) - 2; y += 3) {
      for (let x = 1; x < gridAncho - 2; x += 3) {
        if (!ocupadas.has(`${x}-${y}`)) {
          return { x, y }
        }
      }
    }
    return { x: 1, y: 1 }
  }, [mesas, salon.plano])

  // Abrir dialogo para nueva mesa
  const handleNuevaMesa = () => {
    const pos = getNextFreePosition()
    setMesaEditando(null)
    setFormMesa({
      numero: getNextMesaNumber(),
      nombre: '',
      salonId: salon._id,
      posicion: { x: pos.x, y: pos.y, rotacion: 0 },
      forma: 'cuadrada',
      dimensiones: { ancho: 2, alto: 2 },
      capacidadMinima: 1,
      capacidadMaxima: 4,
      configuracion: {
        prioridad: 5,
        esVIP: false,
        esFumadores: false,
        tieneEnchufe: false,
        tieneVistas: false,
        esAccesible: true,
        requiereReserva: false,
      },
      activo: true,
    })
    setShowMesaDialog(true)
  }

  // Abrir dialogo para editar mesa
  const handleEditarMesa = (mesa: Mesa) => {
    setMesaEditando(mesa)
    setFormMesa({
      numero: mesa.numero,
      nombre: mesa.nombre || '',
      salonId: salon._id,
      posicion: mesa.posicion,
      forma: mesa.forma,
      dimensiones: mesa.dimensiones,
      capacidadMinima: mesa.capacidadMinima,
      capacidadMaxima: mesa.capacidadMaxima,
      configuracion: mesa.configuracion,
      colores: mesa.colores,
      activo: mesa.activo,
    })
    setShowMesaDialog(true)
  }

  // Guardar mesa
  const handleGuardarMesa = async () => {
    if (!formMesa.numero.trim()) {
      toast.error('El numero de mesa es obligatorio')
      return
    }

    try {
      setIsSaving(true)

      if (mesaEditando) {
        await mesasService.update(mesaEditando._id, formMesa)
        toast.success('Mesa actualizada')
      } else {
        await mesasService.create(formMesa)
        toast.success('Mesa creada')
      }

      setShowMesaDialog(false)
      onMesasUpdated()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Eliminar mesa
  const handleEliminarMesa = async (mesa: Mesa) => {
    if (!confirm(`Eliminar mesa ${mesa.numero}?`)) return

    try {
      await mesasService.delete(mesa._id)
      toast.success('Mesa eliminada')
      setSelectedMesa(null)
      onMesasUpdated()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  // Crear mesas en bulk
  const handleCrearBulk = async () => {
    if (bulkCantidad < 1 || bulkCantidad > 50) {
      toast.error('Cantidad debe estar entre 1 y 50')
      return
    }

    try {
      setIsSaving(true)
      const result = await mesasService.createBulk(salon._id, bulkCantidad, bulkPrefijo)
      toast.success(result.message)
      setShowBulkDialog(false)
      onMesasUpdated()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Guardar posiciones
  const handleGuardarPosiciones = async () => {
    try {
      setIsSaving(true)
      const mesasToUpdate = Object.entries(mesaPositions).map(([id, pos]) => ({
        id,
        x: pos.x,
        y: pos.y,
      }))
      await mesasService.actualizarPosiciones(mesasToUpdate)
      toast.success('Posiciones guardadas')
      setHasChanges(false)
      onMesasUpdated()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, mesa: Mesa) => {
    if (e.button !== 0) return // Solo click izquierdo
    e.preventDefault()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const pos = mesaPositions[mesa._id] || mesa.posicion
    const mesaX = pos.x * CELL_SIZE * zoom
    const mesaY = pos.y * CELL_SIZE * zoom

    setDragOffset({
      x: e.clientX - rect.left - mesaX,
      y: e.clientY - rect.top - mesaY,
    })
    setDraggingMesa(mesa)
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingMesa || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = Math.round((e.clientX - rect.left - dragOffset.x) / (CELL_SIZE * zoom))
      const y = Math.round((e.clientY - rect.top - dragOffset.y) / (CELL_SIZE * zoom))

      // Limitar a los bordes del plano
      const maxX = (salon.plano?.ancho || 20) - (draggingMesa.dimensiones.ancho || 2)
      const maxY = (salon.plano?.alto || 15) - (draggingMesa.dimensiones.alto || 2)
      const clampedX = Math.max(0, Math.min(maxX, x))
      const clampedY = Math.max(0, Math.min(maxY, y))

      setMesaPositions((prev) => ({
        ...prev,
        [draggingMesa._id]: { x: clampedX, y: clampedY },
      }))
      setHasChanges(true)
    },
    [draggingMesa, dragOffset, salon.plano, zoom]
  )

  const handleMouseUp = useCallback(() => {
    setDraggingMesa(null)
  }, [])

  // Obtener color de estado
  const getEstadoColor = (mesa: Mesa) => {
    return mesasService.getEstadoColor(mesa.estado)
  }

  // Renderizar mesa
  const renderMesa = (mesa: Mesa) => {
    const pos = mesaPositions[mesa._id] || mesa.posicion
    const width = (mesa.dimensiones.ancho || 2) * CELL_SIZE * zoom
    const height = (mesa.dimensiones.alto || 2) * CELL_SIZE * zoom
    const left = pos.x * CELL_SIZE * zoom
    const top = pos.y * CELL_SIZE * zoom
    const isSelected = selectedMesa?._id === mesa._id
    const isDragging = draggingMesa?._id === mesa._id

    const borderRadius = mesa.forma === 'redonda' || mesa.forma === 'ovalada' ? '50%' : '4px'

    return (
      <div
        key={mesa._id}
        className={`absolute cursor-move transition-shadow ${isDragging ? 'z-50 shadow-lg' : 'z-10'} ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}
        style={{
          left,
          top,
          width,
          height,
          backgroundColor: mesa.colores?.fondo || getEstadoColor(mesa),
          borderRadius,
          border: `2px solid ${mesa.colores?.borde || '#fff'}`,
          transform: `rotate(${pos.rotacion || 0}deg)`,
          opacity: mesa.activo ? 1 : 0.5,
        }}
        onMouseDown={(e) => handleMouseDown(e, mesa)}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedMesa(mesa)
        }}
        onDoubleClick={() => handleEditarMesa(mesa)}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold"
          style={{ color: mesa.colores?.texto || '#fff' }}
        >
          <span className="text-sm">{mesa.numero}</span>
          {mesa.configuracion?.esVIP && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
        </div>

        {/* Badge de capacidad */}
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1 text-[10px] text-gray-700 border">
          {mesa.capacidadMaxima}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNuevaMesa}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Mesa
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBulkDialog(true)}>
            <Grid className="h-4 w-4 mr-2" />
            Crear Varias
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Grid toggle */}
          <Button
            variant={showGrid ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="h-4 w-4" />
          </Button>

          {/* Guardar posiciones */}
          <Button onClick={handleGuardarPosiciones} disabled={!hasChanges || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar Posiciones
          </Button>
        </div>
      </div>

      {/* Editor visual */}
      <div className="flex gap-4">
        {/* Plano */}
        <div
          ref={containerRef}
          className="relative border rounded-lg overflow-hidden bg-gray-100"
          style={{
            width: planoAncho,
            height: planoAlto,
            minWidth: 400,
            minHeight: 300,
            backgroundImage: showGrid
              ? `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `
              : undefined,
            backgroundSize: showGrid ? `${CELL_SIZE * zoom}px ${CELL_SIZE * zoom}px` : undefined,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => setSelectedMesa(null)}
        >
          {mesas.map(renderMesa)}
        </div>

        {/* Panel de propiedades */}
        {selectedMesa && (
          <div className="w-64 border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Mesa {selectedMesa.numero}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditarMesa(selectedMesa)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleEliminarMesa(selectedMesa)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <Badge
                  style={{ backgroundColor: getEstadoColor(selectedMesa) }}
                  className="text-white"
                >
                  {mesasService.getEstadoLabel(selectedMesa.estado)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacidad:</span>
                <span>{selectedMesa.capacidadMaxima} personas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forma:</span>
                <span className="capitalize">{selectedMesa.forma}</span>
              </div>
              {selectedMesa.configuracion?.esVIP && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Star className="h-4 w-4 fill-current" />
                  <span>Mesa VIP</span>
                </div>
              )}
            </div>

            <Button className="w-full" onClick={() => handleEditarMesa(selectedMesa)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Mesa
            </Button>
          </div>
        )}
      </div>

      {/* Leyenda de estados */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Estados:</span>
        {(['libre', 'ocupada', 'reservada', 'cuenta_pedida', 'por_limpiar', 'fuera_servicio'] as const).map(
          (estado) => (
            <div key={estado} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: mesasService.getEstadoColor(estado) }}
              />
              <span>{mesasService.getEstadoLabel(estado)}</span>
            </div>
          )
        )}
      </div>

      {/* Dialogo de edicion de mesa */}
      <Dialog open={showMesaDialog} onOpenChange={setShowMesaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{mesaEditando ? 'Editar Mesa' : 'Nueva Mesa'}</DialogTitle>
            <DialogDescription>Configura los datos de la mesa</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numero *</Label>
                <Input
                  value={formMesa.numero}
                  onChange={(e) => setFormMesa({ ...formMesa, numero: e.target.value })}
                  placeholder="Ej: 1, T1, VIP-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre (opcional)</Label>
                <Input
                  value={formMesa.nombre}
                  onChange={(e) => setFormMesa({ ...formMesa, nombre: e.target.value })}
                  placeholder="Ej: Ventana"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma</Label>
              <Select
                value={formMesa.forma}
                onValueChange={(value) => setFormMesa({ ...formMesa, forma: value as FormaMesa })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <div className="flex items-center gap-2">
                        {f.icon}
                        {f.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ancho (celdas)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={formMesa.dimensiones?.ancho || 2}
                  onChange={(e) =>
                    setFormMesa({
                      ...formMesa,
                      dimensiones: { ...formMesa.dimensiones, ancho: parseInt(e.target.value) || 2, alto: formMesa.dimensiones?.alto || 2 },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Alto (celdas)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={formMesa.dimensiones?.alto || 2}
                  onChange={(e) =>
                    setFormMesa({
                      ...formMesa,
                      dimensiones: { ...formMesa.dimensiones, alto: parseInt(e.target.value) || 2, ancho: formMesa.dimensiones?.ancho || 2 },
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacidad minima</Label>
                <Input
                  type="number"
                  min={1}
                  value={formMesa.capacidadMinima || 1}
                  onChange={(e) => setFormMesa({ ...formMesa, capacidadMinima: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidad maxima</Label>
                <Input
                  type="number"
                  min={1}
                  value={formMesa.capacidadMaxima || 4}
                  onChange={(e) => setFormMesa({ ...formMesa, capacidadMaxima: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Mesa VIP</span>
              </div>
              <Switch
                checked={formMesa.configuracion?.esVIP}
                onCheckedChange={(checked) =>
                  setFormMesa({
                    ...formMesa,
                    configuracion: { ...formMesa.configuracion!, esVIP: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span>Mesa activa</span>
              <Switch
                checked={formMesa.activo}
                onCheckedChange={(checked) => setFormMesa({ ...formMesa, activo: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMesaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarMesa} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mesaEditando ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de creacion masiva */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Varias Mesas</DialogTitle>
            <DialogDescription>Crea multiples mesas de una vez</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cantidad de mesas</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={bulkCantidad}
                onChange={(e) => setBulkCantidad(parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-2">
              <Label>Prefijo (opcional)</Label>
              <Input
                value={bulkPrefijo}
                onChange={(e) => setBulkPrefijo(e.target.value)}
                placeholder="Ej: T para T1, T2, T3..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearBulk} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear {bulkCantidad} mesas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
