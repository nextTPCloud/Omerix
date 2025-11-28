'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { variantesService, ValorVariante } from '@/services/variantes.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Save, Palette, Plus, Trash2, GripVertical, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarVariantePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    tipoVisualizacion: 'botones' as 'botones' | 'dropdown' | 'colores' | 'imagenes',
    obligatorio: false,
    aplicaA: 'todos' as 'todos' | 'familias' | 'productos',
    orden: 0,
    activo: true,
  })
  const [valores, setValores] = useState<ValorVariante[]>([])
  const [nuevoValor, setNuevoValor] = useState({ valor: '', codigo: '', hexColor: '#3B82F6' })

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await variantesService.getById(id)
        if (response.success && response.data) {
          const v = response.data
          setFormData({
            nombre: v.nombre || '',
            codigo: v.codigo || '',
            descripcion: v.descripcion || '',
            tipoVisualizacion: v.tipoVisualizacion || 'botones',
            obligatorio: v.obligatorio || false,
            aplicaA: v.aplicaA || 'todos',
            orden: v.orden || 0,
            activo: v.activo !== undefined ? v.activo : true,
          })
          setValores(v.valores || [])
        }
      } catch (error) {
        toast.error('Error al cargar la variante')
        router.push('/variantes')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleAddValor = async () => {
    if (!nuevoValor.valor.trim()) {
      toast.error('El valor es obligatorio')
      return
    }
    try {
      const response = await variantesService.addValor(id, {
        valor: nuevoValor.valor,
        codigo: nuevoValor.codigo || undefined,
        hexColor: formData.tipoVisualizacion === 'colores' ? nuevoValor.hexColor : undefined,
        orden: valores.length,
        activo: true,
      })
      if (response.success) {
        toast.success('Valor añadido')
        setValores(response.data.valores || [])
        setNuevoValor({ valor: '', codigo: '', hexColor: '#3B82F6' })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al añadir valor')
    }
  }

  const handleRemoveValor = async (valorId: string) => {
    try {
      const response = await variantesService.removeValor(id, valorId)
      if (response.success) {
        toast.success('Valor eliminado')
        setValores(response.data.valores || [])
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar valor')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      const response = await variantesService.update(id, formData)
      if (response.success) {
        toast.success('Variante actualizada correctamente')
        router.push('/variantes')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando variante...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/variantes"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Palette className="h-7 w-7 text-primary" />
              Editar Variante
            </h1>
            <p className="text-sm text-muted-foreground">Modifica la configuración de la variante</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de visualización</Label>
                  <Select value={formData.tipoVisualizacion} onValueChange={(v: any) => setFormData({ ...formData, tipoVisualizacion: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="botones">Botones</SelectItem>
                      <SelectItem value="dropdown">Desplegable</SelectItem>
                      <SelectItem value="colores">Colores</SelectItem>
                      <SelectItem value="imagenes">Imágenes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aplica a</Label>
                  <Select value={formData.aplicaA} onValueChange={(v: any) => setFormData({ ...formData, aplicaA: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los productos</SelectItem>
                      <SelectItem value="familias">Por familias</SelectItem>
                      <SelectItem value="productos">Productos específicos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orden">Orden de visualización</Label>
                <Input
                  id="orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Valores de la Variante</span>
                <span className="text-sm font-normal text-muted-foreground">{valores.length} valores</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Valor (Ej: S, M, L, XL)"
                  value={nuevoValor.valor}
                  onChange={(e) => setNuevoValor({ ...nuevoValor, valor: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="Código"
                  value={nuevoValor.codigo}
                  onChange={(e) => setNuevoValor({ ...nuevoValor, codigo: e.target.value.toUpperCase() })}
                  className="w-24"
                />
                {formData.tipoVisualizacion === 'colores' && (
                  <Input
                    type="color"
                    value={nuevoValor.hexColor}
                    onChange={(e) => setNuevoValor({ ...nuevoValor, hexColor: e.target.value })}
                    className="w-16 p-1 cursor-pointer"
                  />
                )}
                <Button type="button" onClick={handleAddValor}>
                  <Plus className="h-4 w-4 mr-1" />Añadir
                </Button>
              </div>

              {valores.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12" />
                        <TableHead>Valor</TableHead>
                        <TableHead>Código</TableHead>
                        {formData.tipoVisualizacion === 'colores' && <TableHead>Color</TableHead>}
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {valores.map((v) => (
                        <TableRow key={v._id}>
                          <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                          <TableCell className="font-medium">{v.valor}</TableCell>
                          <TableCell className="text-muted-foreground">{v.codigo || '-'}</TableCell>
                          {formData.tipoVisualizacion === 'colores' && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded border" style={{ backgroundColor: v.hexColor || '#ccc' }} />
                                <span className="text-xs text-muted-foreground">{v.hexColor}</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => v._id && handleRemoveValor(v._id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">Añade valores para esta variante</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Obligatoria</Label>
                  <p className="text-sm text-muted-foreground">El cliente debe seleccionar un valor</p>
                </div>
                <Switch
                  checked={formData.obligatorio}
                  onCheckedChange={(checked) => setFormData({ ...formData, obligatorio: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="font-medium">Activa</Label>
                  <p className="text-sm text-muted-foreground">La variante está disponible</p>
                </div>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild><Link href="/variantes">Cancelar</Link></Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
