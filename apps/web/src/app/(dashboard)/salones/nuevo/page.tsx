'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

import { salonesService, CreateSalonDTO } from '@/services/salones.service'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select'
import {
  ArrowLeft,
  Save,
  LayoutGrid,
  Settings,
  Clock,
  Palette,
} from 'lucide-react'
import { toast } from 'sonner'
import { almacenesService } from '@/services/almacenes.service'

const COLORES_PREDEFINIDOS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c', '#64748b', '#71717a',
]

const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miercoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sabado' },
  { key: 'domingo', label: 'Domingo' },
]

interface Almacen {
  _id: string
  nombre: string
}

export default function NuevoSalonPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const codigoInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<CreateSalonDTO>({
    nombre: '',
    codigo: '',
    descripcion: '',
    color: '#3b82f6',
    plano: {
      ancho: 800,
      alto: 600,
      escala: 1,
    },
    capacidadTotal: 0,
    capacidadMesas: 0,
    almacenId: '',
    configuracion: {
      permiteFumar: false,
      tieneClimatizacion: true,
      esExterior: false,
      tieneMusica: false,
      tieneTV: false,
      accesibleMinusvalidos: true,
      requiereReserva: false,
      suplemento: 0,
    },
    horarios: {
      lunes: { desde: '09:00', hasta: '23:00', cerrado: false },
      martes: { desde: '09:00', hasta: '23:00', cerrado: false },
      miercoles: { desde: '09:00', hasta: '23:00', cerrado: false },
      jueves: { desde: '09:00', hasta: '23:00', cerrado: false },
      viernes: { desde: '09:00', hasta: '23:00', cerrado: false },
      sabado: { desde: '09:00', hasta: '23:00', cerrado: false },
      domingo: { desde: '09:00', hasta: '23:00', cerrado: true },
    },
    activo: true,
  })

  useEffect(() => {
    loadAlmacenes()
  }, [])

  const loadAlmacenes = async () => {
    try {
      const response = await almacenesService.getAll({ activo: true, limit: 100 })
      if (response.success) {
        setAlmacenes(response.data)
      }
    } catch (error) {
      console.error('Error cargando almacenes:', error)
    }
  }

  // Convertir almacenes a opciones para SearchableSelect
  const almacenOptions: SearchableSelectOption[] = almacenes.map((a) => ({
    value: a._id,
    label: a.nombre,
  }))

  // Manejar sugerencia de codigo con flecha abajo
  const handleCodigoKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      try {
        const codigoActual = (e.currentTarget as HTMLInputElement).value
        const match = codigoActual.match(/^([A-Za-z]+-?)/)
        const prefijo = match ? match[1] : 'SAL'
        const response = await salonesService.sugerirSiguienteCodigo(prefijo)
        if (response.success) {
          setFormData((prev) => ({ ...prev, codigo: response.data.codigo }))
        }
      } catch (error) {
        console.error('Error al sugerir codigo:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setLoading(true)
    try {
      const dataToSend = { ...formData }
      if (!dataToSend.almacenId) {
        delete dataToSend.almacenId
      }

      await salonesService.create(dataToSend)
      toast.success('Salon creado correctamente')
      router.push('/salones')
    } catch (error: any) {
      console.error('Error al crear salon:', error)
      toast.error(error.response?.data?.message || 'Error al crear el salon')
    } finally {
      setLoading(false)
    }
  }

  const handleHorarioChange = (dia: string, field: 'desde' | 'hasta' | 'cerrado', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...((prev.horarios as any)?.[dia] || { desde: '09:00', hasta: '23:00', cerrado: false }),
          [field]: value,
        },
      },
    }))
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
              <LayoutGrid className="h-7 w-7 text-primary" />
              Nuevo Salon
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configura un nuevo salon para el restaurante
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informacion General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Informacion General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Codigo primero */}
                <div className="space-y-2">
                  <Label htmlFor="codigo">Codigo</Label>
                  <Input
                    id="codigo"
                    ref={codigoInputRef}
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    onKeyDown={handleCodigoKeyDown}
                    placeholder="Pulsa ↓ para sugerir codigo"
                    title="Pulsa la tecla ↓ para sugerir el siguiente codigo"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pulsa ↓ para sugerir el siguiente codigo automaticamente
                  </p>
                </div>
                {/* Nombre despues */}
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Terraza, Salon Principal"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripcion del salon..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacidadTotal">Capacidad Total (personas)</Label>
                  <Input
                    id="capacidadTotal"
                    type="number"
                    min="0"
                    value={formData.capacidadTotal}
                    onChange={(e) => setFormData({ ...formData, capacidadTotal: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidadMesas">Numero de Mesas</Label>
                  <Input
                    id="capacidadMesas"
                    type="number"
                    min="0"
                    value={formData.capacidadMesas}
                    onChange={(e) => setFormData({ ...formData, capacidadMesas: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="almacenId">Almacen</Label>
                  <SearchableSelect
                    options={almacenOptions}
                    value={formData.almacenId || ''}
                    onValueChange={(value) => setFormData({ ...formData, almacenId: value })}
                    placeholder="Seleccionar almacen"
                    searchPlaceholder="Buscar almacen..."
                    emptyMessage="No hay almacenes"
                    allowClear
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color del Salon</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORES_PREDEFINIDOS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Salon activo</Label>
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
                    id="esExterior"
                    checked={formData.configuracion?.esExterior}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, esExterior: checked }
                    })}
                  />
                  <Label htmlFor="esExterior">Exterior</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="permiteFumar"
                    checked={formData.configuracion?.permiteFumar}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, permiteFumar: checked }
                    })}
                  />
                  <Label htmlFor="permiteFumar">Permite Fumar</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tieneClimatizacion"
                    checked={formData.configuracion?.tieneClimatizacion}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, tieneClimatizacion: checked }
                    })}
                  />
                  <Label htmlFor="tieneClimatizacion">Climatizacion</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tieneMusica"
                    checked={formData.configuracion?.tieneMusica}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, tieneMusica: checked }
                    })}
                  />
                  <Label htmlFor="tieneMusica">Musica</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="tieneTV"
                    checked={formData.configuracion?.tieneTV}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, tieneTV: checked }
                    })}
                  />
                  <Label htmlFor="tieneTV">TV</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="accesibleMinusvalidos"
                    checked={formData.configuracion?.accesibleMinusvalidos}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, accesibleMinusvalidos: checked }
                    })}
                  />
                  <Label htmlFor="accesibleMinusvalidos">Accesible</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="suplemento">Suplemento (%)</Label>
                  <Input
                    id="suplemento"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-24"
                    value={formData.configuracion?.suplemento || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuracion: { ...formData.configuracion!, suplemento: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DIAS_SEMANA.map(({ key, label }) => {
                  const horario = (formData.horarios as any)?.[key] || { desde: '09:00', hasta: '23:00', cerrado: false }
                  return (
                    <div key={key} className="flex items-center gap-4 py-2 border-b last:border-b-0">
                      <div className="w-24 font-medium">{label}</div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!horario.cerrado}
                          onCheckedChange={(checked) => handleHorarioChange(key, 'cerrado', !checked)}
                        />
                        <span className="text-sm text-muted-foreground w-16">
                          {horario.cerrado ? 'Cerrado' : 'Abierto'}
                        </span>
                      </div>
                      {!horario.cerrado && (
                        <>
                          <Input
                            type="time"
                            className="w-32"
                            value={horario.desde}
                            onChange={(e) => handleHorarioChange(key, 'desde', e.target.value)}
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            className="w-32"
                            value={horario.hasta}
                            onChange={(e) => handleHorarioChange(key, 'hasta', e.target.value)}
                          />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Plano */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Dimensiones del Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planoAncho">Ancho (px)</Label>
                  <Input
                    id="planoAncho"
                    type="number"
                    min="200"
                    value={formData.plano?.ancho || 800}
                    onChange={(e) => setFormData({
                      ...formData,
                      plano: { ...formData.plano!, ancho: parseInt(e.target.value) || 800 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planoAlto">Alto (px)</Label>
                  <Input
                    id="planoAlto"
                    type="number"
                    min="200"
                    value={formData.plano?.alto || 600}
                    onChange={(e) => setFormData({
                      ...formData,
                      plano: { ...formData.plano!, alto: parseInt(e.target.value) || 600 }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planoEscala">Escala</Label>
                  <Input
                    id="planoEscala"
                    type="number"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={formData.plano?.escala || 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      plano: { ...formData.plano!, escala: parseFloat(e.target.value) || 1 }
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
                Despues de crear el salon podras agregar mesas
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
                      Crear Salon
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
