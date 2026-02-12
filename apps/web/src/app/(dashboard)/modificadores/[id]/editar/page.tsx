'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { modificadoresService } from '@/services/modificadores.service'
import { familiasService } from '@/services/familias.service'
import { productosService } from '@/services/productos.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, SlidersHorizontal, RefreshCw, Search, X, FolderTree, Package } from 'lucide-react'
import { toast } from 'sonner'

interface FamiliaSimple {
  _id: string
  nombre: string
  codigo?: string
}

interface ProductoSimple {
  _id: string
  nombre: string
  codigo?: string
  familia?: { _id: string; nombre: string }
}

export default function EditarModificadorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Datos para selección
  const [familias, setFamilias] = useState<FamiliaSimple[]>([])
  const [productos, setProductos] = useState<ProductoSimple[]>([])
  const [busquedaFamilias, setBusquedaFamilias] = useState('')
  const [busquedaProductos, setBusquedaProductos] = useState('')

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'gratis' as 'gratis' | 'cargo' | 'descuento',
    aplicaA: 'todos' as 'todos' | 'familias' | 'productos',
    familiasIds: [] as string[],
    productosIds: [] as string[],
    precioExtra: 0,
    orden: 0,
    activo: true,
  })

  // Cargar familias y productos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [famRes, prodRes] = await Promise.all([
          familiasService.getAll({ limit: 1000, activo: true }),
          productosService.getAll({ limit: 1000, activo: true })
        ])
        if (famRes.success) {
          setFamilias(famRes.data.map((f: any) => ({ _id: f._id, nombre: f.nombre, codigo: f.codigo })))
        }
        if (prodRes.success) {
          setProductos(prodRes.data.map((p: any) => ({
            _id: p._id,
            nombre: p.nombre,
            codigo: p.codigo,
            familia: p.familia ? { _id: p.familia._id, nombre: p.familia.nombre } : undefined
          })))
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
      }
    }
    cargarDatos()
  }, [])

  useEffect(() => {
    const cargar = async () => {
      try {
        setIsLoading(true)
        const response = await modificadoresService.getById(id)
        if (response.success && response.data) {
          const m = response.data
          // Extraer solo los IDs si vienen como objetos poblados
          const extractIds = (items: any[]): string[] => {
            if (!items || !Array.isArray(items)) return []
            return items.map(item => {
              if (typeof item === 'string') return item
              if (item && typeof item === 'object' && item._id) return item._id.toString()
              return null
            }).filter(Boolean) as string[]
          }

          setFormData({
            nombre: m.nombre || '',
            descripcion: m.descripcion || '',
            tipo: m.tipo || 'gratis',
            aplicaA: m.aplicaA || 'todos',
            familiasIds: extractIds(m.familiasIds as any),
            productosIds: extractIds(m.productosIds as any),
            precioExtra: m.precioExtra || 0,
            orden: m.orden || 0,
            activo: m.activo !== undefined ? m.activo : true,
          })
        }
      } catch {
        toast.error('Error al cargar')
        router.push('/modificadores')
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargar()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    // Validar selección según aplicaA
    if (formData.aplicaA === 'familias' && formData.familiasIds.length === 0) {
      toast.error('Selecciona al menos una familia')
      return
    }
    if (formData.aplicaA === 'productos' && formData.productosIds.length === 0) {
      toast.error('Selecciona al menos un producto')
      return
    }

    setIsSaving(true)
    try {
      // Limpiar IDs según el tipo de aplicación
      const dataToSend = {
        ...formData,
        familiasIds: formData.aplicaA === 'familias' ? formData.familiasIds : [],
        productosIds: formData.aplicaA === 'productos' ? formData.productosIds : [],
      }

      const response = await modificadoresService.update(id, dataToSend)
      if (response.success) {
        toast.success('Actualizado correctamente')
        router.push('/modificadores')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleFamilia = (familiaId: string) => {
    setFormData(prev => ({
      ...prev,
      familiasIds: prev.familiasIds.includes(familiaId)
        ? prev.familiasIds.filter(id => id !== familiaId)
        : [...prev.familiasIds, familiaId]
    }))
  }

  const toggleProducto = (productoId: string) => {
    setFormData(prev => ({
      ...prev,
      productosIds: prev.productosIds.includes(productoId)
        ? prev.productosIds.filter(id => id !== productoId)
        : [...prev.productosIds, productoId]
    }))
  }

  const familiasFiltradas = familias.filter(f =>
    f.nombre.toLowerCase().includes(busquedaFamilias.toLowerCase()) ||
    f.codigo?.toLowerCase().includes(busquedaFamilias.toLowerCase())
  )

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busquedaProductos.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busquedaProductos.toLowerCase())
  )

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      
    )
  }

  return (
    
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/modificadores"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-7 w-7 text-primary" />
              Editar Modificador
            </h1>
            <p className="text-sm text-muted-foreground">Modifica la configuración</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gratis">Gratis</SelectItem>
                      <SelectItem value="cargo">Cargo extra</SelectItem>
                      <SelectItem value="descuento">Descuento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aplica a</Label>
                  <Select
                    value={formData.aplicaA}
                    onValueChange={(v: any) => setFormData({ ...formData, aplicaA: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="familias">Familias</SelectItem>
                      <SelectItem value="productos">Productos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Precio extra (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precioExtra}
                    onChange={e => setFormData({ ...formData, precioExtra: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de Familias */}
          {formData.aplicaA === 'familias' && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  Familias Asignadas
                  <Badge variant="secondary" className="ml-auto">
                    {formData.familiasIds.length} seleccionadas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Familias seleccionadas */}
                {formData.familiasIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    {formData.familiasIds.map(id => {
                      const familia = familias.find(f => f._id === id)
                      return familia ? (
                        <Badge key={id} variant="default" className="gap-1">
                          {familia.nombre}
                          <button
                            type="button"
                            onClick={() => toggleFamilia(id)}
                            className="ml-1 hover:bg-white/20 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}

                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar familias..."
                    value={busquedaFamilias}
                    onChange={e => setBusquedaFamilias(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Lista de familias */}
                <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                  {familiasFiltradas.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">
                      No se encontraron familias
                    </p>
                  ) : (
                    familiasFiltradas.map(familia => (
                      <label
                        key={familia._id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.familiasIds.includes(familia._id)}
                          onCheckedChange={() => toggleFamilia(familia._id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{familia.nombre}</p>
                          {familia.codigo && (
                            <p className="text-xs text-muted-foreground">{familia.codigo}</p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selección de Productos */}
          {formData.aplicaA === 'productos' && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos Asignados
                  <Badge variant="secondary" className="ml-auto">
                    {formData.productosIds.length} seleccionados
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Productos seleccionados */}
                {formData.productosIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    {formData.productosIds.map(id => {
                      const producto = productos.find(p => p._id === id)
                      return producto ? (
                        <Badge key={id} variant="default" className="gap-1">
                          {producto.nombre}
                          <button
                            type="button"
                            onClick={() => toggleProducto(id)}
                            className="ml-1 hover:bg-white/20 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}

                {/* Buscador */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={busquedaProductos}
                    onChange={e => setBusquedaProductos(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Lista de productos */}
                <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                  {productosFiltrados.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">
                      No se encontraron productos
                    </p>
                  ) : (
                    productosFiltrados.map(producto => (
                      <label
                        key={producto._id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.productosIds.includes(producto._id)}
                          onCheckedChange={() => toggleProducto(producto._id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {producto.codigo && `${producto.codigo} · `}
                            {producto.familia?.nombre || 'Sin familia'}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-4">
            <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={formData.orden}
                  onChange={e => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">Activo</Label>
                  </div>
                  <Switch
                    checked={formData.activo}
                    onCheckedChange={c => setFormData({ ...formData, activo: c })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/modificadores">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
