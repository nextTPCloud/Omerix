'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { mesasService, CreateMesaDTO, FormaMesa } from '@/services/salones.service'
import { salonesService, Salon } from '@/services/salones.service'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Save,
  Grid3X3,
  Settings,
  Palette,
} from 'lucide-react'
import { toast } from 'sonner'

const FORMAS_MESA: { value: FormaMesa; label: string }[] = [
  { value: 'cuadrada', label: 'Cuadrada' },
  { value: 'rectangular', label: 'Rectangular' },
  { value: 'redonda', label: 'Redonda' },
  { value: 'ovalada', label: 'Ovalada' },
  { value: 'irregular', label: 'Irregular' },
]

const COLORES_PREDEFINIDOS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
]

export default function NuevaMesaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const salonIdParam = searchParams.get('salonId')

  const [loading, setLoading] = useState(false)
  const [loadingSalones, setLoadingSalones] = useState(true)
  const [salones, setSalones] = useState<Salon[]>([])

  const [formData, setFormData] = useState<CreateMesaDTO>({
    numero: '',
    nombre: '',
    salonId: salonIdParam || '',
    posicion: {
      x: 100,
      y: 100,
      rotacion: 0,
    },
    forma: 'cuadrada',
    dimensiones: {
      ancho: 80,
      alto: 80,
    },
    capacidadMinima: 1,
    capacidadMaxima: 4,
    capacidadOptima: 2,
    estado: 'libre',
    configuracion: {
      prioridad: 1,
      esVIP: false,
      esFumadores: false,
      tieneEnchufe: false,
      tieneVistas: false,
      esAccesible: true,
      requiereReserva: false,
    },
    colores: {
      fondo: '#ffffff',
      borde: '#e5e7eb',
      texto: '#374151',
    },
    activo: true,
  })

  useEffect(() => {
    loadSalones()
  }, [])

  const loadSalones = async () => {
    setLoadingSalones(true)
    try {
      const response = await salonesService.getAll({ activo: true, limit: 100 })
      if (response.success) {
        setSalones(response.data)
        // Si no hay salon seleccionado y hay salones, seleccionar el primero
        if (!formData.salonId && response.data.length > 0) {
          setFormData(prev => ({ ...prev, salonId: response.data[0]._id }))
        }
      }
    } catch (error) {
      console.error('Error cargando salones:', error)
      toast.error('Error al cargar los salones')
    } finally {
      setLoadingSalones(false)
    }
  }

  // Convertir salones a opciones para SearchableSelect
  const salonOptions: SearchableSelectOption[] = salones.map((s) => ({
    value: s._id,
    label: s.nombre,
    description: s.codigo || undefined,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.numero.trim()) {
      toast.error('El numero de mesa es obligatorio')
      return
    }

    if (!formData.salonId) {
      toast.error('Debe seleccionar un salon')
      return
    }

    setLoading(true)
    try {
      await mesasService.create(formData)
      toast.success('Mesa creada correctamente')
      router.push('/mesas')
    } catch (error: any) {
      console.error('Error al crear mesa:', error)
      toast.error(error.response?.data?.message || 'Error al crear la mesa')
    } finally {
      setLoading(false)
    }
  }

  return (
    
      <div className="w-full space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Grid3X3 className="h-7 w-7 text-primary" />
              Nueva Mesa
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega una nueva mesa al salon
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informacion General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Informacion General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Numero de Mesa *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ej: 1, A1, T01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre (opcional)</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Mesa Ventana"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salonId">Salon *</Label>
                  <SearchableSelect
                    options={salonOptions}
                    value={formData.salonId}
                    onValueChange={(value) => setFormData({ ...formData, salonId: value })}
                    placeholder="Seleccionar salon"
                    searchPlaceholder="Buscar salon..."
                    emptyMessage="No hay salones disponibles"
                    loading={loadingSalones}
                    allowClear={false}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forma">Forma</Label>
                  <Select
                    value={formData.forma}
                    onValueChange={(value: FormaMesa) => setFormData({ ...formData, forma: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_MESA.map((forma) => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidadMinima">Capacidad Min</Label>
                  <Input
                    id="capacidadMinima"
                    type="number"
                    min="1"
                    value={formData.capacidadMinima}
                    onChange={(e) => setFormData({ ...formData, capacidadMinima: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidadMaxima">Capacidad Max</Label>
                  <Input
                    id="capacidadMaxima"
                    type="number"
                    min="1"
                    value={formData.capacidadMaxima}
                    onChange={(e) => setFormData({ ...formData, capacidadMaxima: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidadOptima">Capacidad Optima</Label>
                  <Input
                    id="capacidadOptima"
                    type="number"
                    min="1"
                    value={formData.capacidadOptima}
                    onChange={(e) => setFormData({ ...formData, capacidadOptima: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Mesa activa</Label>
              </div>
            </CardContent>
          </Card>

          {/* Dimensiones y Posicion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Dimensiones y Posicion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ancho">Ancho (px)</Label>
                  <Input
                    id="ancho"
                    type="number"
                    min="40"
                    value={formData.dimensiones?.ancho || 80}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensiones: { ...formData.dimensiones!, ancho: parseInt(e.target.value) || 80 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alto">Alto (px)</Label>
                  <Input
                    id="alto"
                    type="number"
                    min="40"
                    value={formData.dimensiones?.alto || 80}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensiones: { ...formData.dimensiones!, alto: parseInt(e.target.value) || 80 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="posX">Posicion X</Label>
                  <Input
                    id="posX"
                    type="number"
                    min="0"
                    value={formData.posicion?.x || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      posicion: { ...formData.posicion!, x: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="posY">Posicion Y</Label>
                  <Input
                    id="posY"
                    type="number"
                    min="0"
                    value={formData.posicion?.y || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      posicion: { ...formData.posicion!, y: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rotacion">Rotacion</Label>
                  <Input
                    id="rotacion"
                    type="number"
                    min="0"
                    max="360"
                    value={formData.posicion?.rotacion || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      posicion: { ...formData.posicion!, rotacion: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>Color de Fondo</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 bg-white transition-transform hover:scale-110 ${
                      formData.colores?.fondo === '#ffffff' ? 'border-gray-900 scale-110' : 'border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, colores: { ...formData.colores!, fondo: '#ffffff' } })}
                  />
                  {COLORES_PREDEFINIDOS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        formData.colores?.fondo === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, colores: { ...formData.colores!, fondo: color } })}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuracion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuracion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="esVIP"
                    checked={formData.configuracion?.esVIP}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, esVIP: checked }
                    })}
                  />
                  <Label htmlFor="esVIP">VIP</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="esFumadores"
                    checked={formData.configuracion?.esFumadores}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, esFumadores: checked }
                    })}
                  />
                  <Label htmlFor="esFumadores">Fumadores</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tieneEnchufe"
                    checked={formData.configuracion?.tieneEnchufe}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, tieneEnchufe: checked }
                    })}
                  />
                  <Label htmlFor="tieneEnchufe">Enchufe</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tieneVistas"
                    checked={formData.configuracion?.tieneVistas}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, tieneVistas: checked }
                    })}
                  />
                  <Label htmlFor="tieneVistas">Vistas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="esAccesible"
                    checked={formData.configuracion?.esAccesible}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, esAccesible: checked }
                    })}
                  />
                  <Label htmlFor="esAccesible">Accesible</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="requiereReserva"
                    checked={formData.configuracion?.requiereReserva}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, requiereReserva: checked }
                    })}
                  />
                  <Label htmlFor="requiereReserva">Requiere Reserva</Label>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="prioridad">Prioridad (1-10)</Label>
                  <Input
                    id="prioridad"
                    type="number"
                    min="1"
                    max="10"
                    className="w-24"
                    value={formData.configuracion?.prioridad || 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, prioridad: parseInt(e.target.value) || 1 }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de accion */}
          <Card className="p-4 bg-muted/50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                La posicion de la mesa se puede ajustar en el editor de plano
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Mesa
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    
  )
}
