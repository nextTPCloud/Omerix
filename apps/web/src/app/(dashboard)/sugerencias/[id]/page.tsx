'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

import { sugerenciasService, Sugerencia, TipoSugerencia, MomentoSugerencia } from '@/services/sugerencias.service'
import { productosService } from '@/services/productos.service'
import { familiasService } from '@/services/familias.service'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Lightbulb,
  Package,
  Clock,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

const TIPOS_SUGERENCIA: { value: TipoSugerencia; label: string }[] = [
  { value: 'complementario', label: 'Complementario' },
  { value: 'upgrade', label: 'Mejora (Upgrade)' },
  { value: 'alternativa', label: 'Alternativa' },
  { value: 'acompanamiento', label: 'Acompanamiento' },
  { value: 'postre', label: 'Postre' },
  { value: 'bebida', label: 'Bebida' },
]

const MOMENTOS_SUGERENCIA: { value: MomentoSugerencia; label: string }[] = [
  { value: 'al_agregar', label: 'Al agregar producto' },
  { value: 'al_finalizar', label: 'Al finalizar pedido' },
  { value: 'automatico', label: 'Automatico (por hora)' },
]

interface Producto {
  _id: string
  nombre: string
  sku: string
}

interface Familia {
  _id: string
  nombre: string
}

interface ProductoSugerido {
  productoId: string
  orden: number
  descuento?: number
  textoPersonalizado?: string
}

export default function EditarSugerenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])

  const [formData, setFormData] = useState<Partial<Sugerencia>>({})
  const [productosSugeridos, setProductosSugeridos] = useState<ProductoSugerido[]>([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [sugerenciaResponse, productosResponse, familiasResponse] = await Promise.all([
        sugerenciasService.getById(id),
        productosService.getAll({ activo: true, limit: 500 }),
        familiasService.getAll({ activo: true, limit: 100 }),
      ])

      if (sugerenciaResponse.success) {
        const sugerencia = sugerenciaResponse.data
        setFormData({
          nombre: sugerencia.nombre,
          descripcion: sugerencia.descripcion,
          tipo: sugerencia.tipo,
          momento: sugerencia.momento,
          productoBaseId: typeof sugerencia.productoBaseId === 'object'
            ? sugerencia.productoBaseId._id
            : sugerencia.productoBaseId,
          familiaBaseId: typeof sugerencia.familiaBaseId === 'object'
            ? sugerencia.familiaBaseId._id
            : sugerencia.familiaBaseId,
          condicionHoraria: sugerencia.condicionHoraria,
          prioridad: sugerencia.prioridad,
          activo: sugerencia.activo,
        })
        setProductosSugeridos(
          sugerencia.productosSugeridos.map(ps => ({
            productoId: typeof ps.productoId === 'object' ? ps.productoId._id : ps.productoId,
            orden: ps.orden,
            descuento: ps.descuento,
            textoPersonalizado: ps.textoPersonalizado,
          }))
        )
      }

      if (productosResponse.success) {
        setProductos(productosResponse.data)
      }
      if (familiasResponse.success) {
        setFamilias(familiasResponse.data)
      }
    } catch (error) {
      console.error('Error cargando sugerencia:', error)
      toast.error('Error al cargar la sugerencia')
      router.push('/sugerencias')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre?.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    if (productosSugeridos.length === 0) {
      toast.error('Debe agregar al menos un producto sugerido')
      return
    }

    setSaving(true)
    try {
      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        momento: formData.momento,
        productoBaseId: formData.productoBaseId || undefined,
        familiaBaseId: formData.familiaBaseId || undefined,
        condicionHoraria: formData.condicionHoraria,
        prioridad: formData.prioridad,
        activo: formData.activo,
        productosSugeridos: productosSugeridos.map((p, index) => ({
          productoId: p.productoId,
          orden: index + 1,
          descuento: p.descuento,
          textoPersonalizado: p.textoPersonalizado,
        })),
      }

      await sugerenciasService.update(id, dataToSend)
      toast.success('Sugerencia actualizada correctamente')
      router.push('/sugerencias')
    } catch (error: any) {
      console.error('Error al actualizar sugerencia:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar la sugerencia')
    } finally {
      setSaving(false)
    }
  }

  const addProductoSugerido = () => {
    setProductosSugeridos([
      ...productosSugeridos,
      { productoId: '', orden: productosSugeridos.length + 1, descuento: 0 },
    ])
  }

  const removeProductoSugerido = (index: number) => {
    setProductosSugeridos(productosSugeridos.filter((_, i) => i !== index))
  }

  const updateProductoSugerido = (index: number, field: keyof ProductoSugerido, value: any) => {
    setProductosSugeridos(productosSugeridos.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    ))
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      
    )
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
              <Lightbulb className="h-7 w-7 text-primary" />
              Editar Sugerencia
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica la configuracion de la sugerencia
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informacion General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Informacion General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Sugerir postre con cafe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Sugerencia</Label>
                  <Select
                    value={formData.tipo || 'complementario'}
                    onValueChange={(value: TipoSugerencia) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SUGERENCIA.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripcion de la sugerencia..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="momento">Momento de Sugerencia</Label>
                  <Select
                    value={formData.momento || 'al_agregar'}
                    onValueChange={(value: MomentoSugerencia) => setFormData({ ...formData, momento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOMENTOS_SUGERENCIA.map((momento) => (
                        <SelectItem key={momento.value} value={momento.value}>
                          {momento.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad (1-10)</Label>
                  <Input
                    id="prioridad"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.prioridad || 1}
                    onChange={(e) => setFormData({ ...formData, prioridad: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label htmlFor="activo">Sugerencia activa</Label>
              </div>
            </CardContent>
          </Card>

          {/* Producto/Familia Base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Producto o Familia Base (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productoBaseId">Producto Base</Label>
                  <Select
                    value={formData.productoBaseId || 'none'}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      productoBaseId: value === 'none' ? undefined : value,
                      familiaBaseId: value === 'none' ? formData.familiaBaseId : undefined,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ninguno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {productos.map((producto) => (
                        <SelectItem key={producto._id} value={producto._id}>
                          {producto.nombre} ({producto.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="familiaBaseId">Familia Base</Label>
                  <Select
                    value={formData.familiaBaseId || 'none'}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      familiaBaseId: value === 'none' ? undefined : value,
                      productoBaseId: value === 'none' ? formData.productoBaseId : undefined,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ninguna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna</SelectItem>
                      {familias.map((familia) => (
                        <SelectItem key={familia._id} value={familia._id}>
                          {familia.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos Sugeridos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos Sugeridos *
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addProductoSugerido}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productosSugeridos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay productos sugeridos.
                </p>
              ) : (
                <div className="space-y-3">
                  {productosSugeridos.map((ps, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Producto</Label>
                          <Select
                            value={ps.productoId || 'none'}
                            onValueChange={(value) => updateProductoSugerido(index, 'productoId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {productos.map((producto) => (
                                <SelectItem key={producto._id} value={producto._id}>
                                  {producto.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Descuento (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={ps.descuento || 0}
                            onChange={(e) => updateProductoSugerido(index, 'descuento', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Texto personalizado</Label>
                          <Input
                            value={ps.textoPersonalizado || ''}
                            onChange={(e) => updateProductoSugerido(index, 'textoPersonalizado', e.target.value)}
                            placeholder="Ej: Prueba nuestro..."
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeProductoSugerido(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Condicion Horaria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Condicion Horaria (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora Inicio</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.condicionHoraria?.horaInicio || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      condicionHoraria: {
                        ...formData.condicionHoraria,
                        horaInicio: e.target.value,
                        horaFin: formData.condicionHoraria?.horaFin || '23:59',
                        diasSemana: formData.condicionHoraria?.diasSemana || [0, 1, 2, 3, 4, 5, 6],
                        activo: true,
                      },
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFin">Hora Fin</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={formData.condicionHoraria?.horaFin || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      condicionHoraria: {
                        ...formData.condicionHoraria,
                        horaInicio: formData.condicionHoraria?.horaInicio || '00:00',
                        horaFin: e.target.value,
                        diasSemana: formData.condicionHoraria?.diasSemana || [0, 1, 2, 3, 4, 5, 6],
                        activo: true,
                      },
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
                Los cambios se guardaran inmediatamente
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
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
