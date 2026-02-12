'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { stockService, CreateAjusteDTO } from '@/services/stock.service'
import { almacenesService } from '@/services/almacenes.service'
import { productosService } from '@/services/productos.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  ArrowLeft,
  Save,
  Package,
  Warehouse,
  Plus,
  Minus,
  AlertTriangle,
  Search,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useUserPreferences } from '@/hooks/useUserPreferences'

export default function NuevoAjustePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productoIdParam = searchParams.get('productoId')
  const { almacenDefaultId } = useUserPreferences()

  // Estado del formulario
  const [formData, setFormData] = useState<CreateAjusteDTO>({
    productoId: '',
    almacenId: '',
    tipo: 'entrada',
    cantidad: 0,
    motivo: '',
  })

  // Estado de datos auxiliares
  const [almacenes, setAlmacenes] = useState<{ _id: string; nombre: string }[]>([])
  const [productoSearch, setProductoSearch] = useState('')
  const [productos, setProductos] = useState<any[]>([])
  const [selectedProducto, setSelectedProducto] = useState<any>(null)
  const [stockActual, setStockActual] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchingProductos, setSearchingProductos] = useState(false)

  // Cargar almacenes al inicio
  useEffect(() => {
    const loadAlmacenes = async () => {
      try {
        const res = await almacenesService.getActivos()
        const almacenesData = res.data || []
        setAlmacenes(almacenesData)
        // Seleccionar almacen por defecto: preferencia usuario > principal > primero
        if (almacenesData.length > 0) {
          const almacenDefault = almacenDefaultId
            ? almacenesData.find((a: any) => a._id === almacenDefaultId)
            : almacenesData.find((a: any) => a.esPrincipal) || almacenesData[0]
          if (almacenDefault) {
            setFormData(prev => ({ ...prev, almacenId: almacenDefault._id }))
          }
        }
      } catch (error) {
        console.error('Error cargando almacenes:', error)
      }
    }
    loadAlmacenes()
  }, [almacenDefaultId])

  // Cargar producto si viene por parámetro
  useEffect(() => {
    if (productoIdParam) {
      loadProductoById(productoIdParam)
    }
  }, [productoIdParam])

  // Buscar productos
  useEffect(() => {
    if (!productoSearch || productoSearch.length < 2) {
      setProductos([])
      return
    }

    const search = async () => {
      setSearchingProductos(true)
      try {
        const res = await productosService.getAll({ q: productoSearch, limit: 10 })
        setProductos(res.data || [])
      } catch (error) {
        console.error('Error buscando productos:', error)
      } finally {
        setSearchingProductos(false)
      }
    }

    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [productoSearch])

  // Cargar stock actual cuando cambia producto o almacén
  useEffect(() => {
    if (formData.productoId && formData.almacenId) {
      loadStockActual()
    } else {
      setStockActual(null)
    }
  }, [formData.productoId, formData.almacenId])

  const loadProductoById = async (id: string) => {
    setLoading(true)
    try {
      const res = await productosService.getById(id)
      if (res.data) {
        setSelectedProducto(res.data)
        setFormData(prev => ({ ...prev, productoId: id }))
        setProductoSearch(res.data.nombre)
      }
    } catch (error) {
      console.error('Error cargando producto:', error)
      toast.error('Error al cargar el producto')
    } finally {
      setLoading(false)
    }
  }

  const loadStockActual = async () => {
    try {
      const res = await stockService.getResumenProducto(formData.productoId)
      const stockAlmacen = res.data?.stockPorAlmacen?.find(s => s.almacenId === formData.almacenId)
      setStockActual(stockAlmacen?.cantidad ?? 0)
    } catch (error) {
      console.error('Error cargando stock:', error)
      setStockActual(null)
    }
  }

  const selectProducto = (producto: any) => {
    setSelectedProducto(producto)
    setFormData(prev => ({ ...prev, productoId: producto._id }))
    setProductoSearch(producto.nombre)
    setProductos([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.productoId) {
      toast.error('Selecciona un producto')
      return
    }
    if (!formData.almacenId) {
      toast.error('Selecciona un almacén')
      return
    }
    if (formData.cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }
    if (!formData.motivo || formData.motivo.trim().length < 3) {
      toast.error('El motivo es obligatorio (mínimo 3 caracteres)')
      return
    }

    // Validar stock suficiente para salidas
    if ((formData.tipo === 'salida' || formData.tipo === 'merma') && stockActual !== null) {
      if (formData.cantidad > stockActual) {
        toast.error(`Stock insuficiente. Stock actual: ${stockActual}`)
        return
      }
    }

    setSaving(true)
    try {
      await stockService.crearAjuste(formData)
      toast.success('Ajuste de stock registrado correctamente')
      router.push('/almacenes/movimientos')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar el ajuste')
    } finally {
      setSaving(false)
    }
  }

  const stockResultante = stockActual !== null
    ? formData.tipo === 'entrada'
      ? stockActual + formData.cantidad
      : stockActual - formData.cantidad
    : null

  return (
    
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/almacenes/stock">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nuevo Ajuste de Stock</h1>
            <p className="text-muted-foreground">Registrar entrada o salida manual de stock</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Datos del Ajuste</CardTitle>
              <CardDescription>
                Complete los datos para registrar el movimiento de stock
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de ajuste */}
              <div className="space-y-3">
                <Label>Tipo de ajuste *</Label>
                <RadioGroup
                  value={formData.tipo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as any }))}
                  className="grid grid-cols-3 gap-4"
                >
                  <Label
                    htmlFor="entrada"
                    className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.tipo === 'entrada' ? 'border-green-500 bg-green-50' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="entrada" id="entrada" />
                    <Plus className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Entrada</div>
                      <div className="text-xs text-muted-foreground">Aumentar stock</div>
                    </div>
                  </Label>
                  <Label
                    htmlFor="salida"
                    className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.tipo === 'salida' ? 'border-red-500 bg-red-50' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="salida" id="salida" />
                    <Minus className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium">Salida</div>
                      <div className="text-xs text-muted-foreground">Reducir stock</div>
                    </div>
                  </Label>
                  <Label
                    htmlFor="merma"
                    className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.tipo === 'merma' ? 'border-amber-500 bg-amber-50' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="merma" id="merma" />
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <div>
                      <div className="font-medium">Merma</div>
                      <div className="text-xs text-muted-foreground">Pérdida/deterioro</div>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Producto */}
              <div className="space-y-2">
                <Label htmlFor="producto">Producto *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="producto"
                    placeholder="Buscar producto por nombre o código..."
                    value={productoSearch}
                    onChange={(e) => {
                      setProductoSearch(e.target.value)
                      if (!e.target.value) {
                        setSelectedProducto(null)
                        setFormData(prev => ({ ...prev, productoId: '' }))
                      }
                    }}
                    className="pl-9"
                  />
                  {searchingProductos && (
                    <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Lista de productos */}
                {productos.length > 0 && (
                  <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {productos.map((p) => (
                      <div
                        key={p._id}
                        className="p-3 hover:bg-muted cursor-pointer flex items-center gap-3"
                        onClick={() => selectProducto(p)}
                      >
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-xs text-muted-foreground">{p.codigo || p.sku}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Producto seleccionado */}
                {selectedProducto && (
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{selectedProducto.nombre}</div>
                      <div className="text-sm text-muted-foreground">{selectedProducto.codigo || selectedProducto.sku}</div>
                    </div>
                    {selectedProducto.costes?.costeUltimo > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Coste: {formatCurrency(selectedProducto.costes.costeUltimo)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Almacén */}
              <div className="space-y-2">
                <Label htmlFor="almacen">Almacén *</Label>
                <SearchableSelect
                  options={almacenes.map((a: any) => ({
                    value: a._id,
                    label: a.nombre,
                    description: a.esPrincipal ? 'Principal' : a.codigo
                  }))}
                  value={formData.almacenId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, almacenId: value }))}
                  placeholder="Seleccionar almacén..."
                  searchPlaceholder="Buscar almacén..."
                  emptyMessage="No hay almacenes disponibles"
                />
              </div>

              {/* Stock actual e info */}
              {stockActual !== null && (
                <div className="p-4 bg-muted/50 rounded-lg grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Stock actual</div>
                    <div className="text-xl font-bold">{stockActual}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cantidad ajuste</div>
                    <div className={`text-xl font-bold ${formData.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.tipo === 'entrada' ? '+' : '-'}{formData.cantidad || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Stock resultante</div>
                    <div className={`text-xl font-bold ${stockResultante !== null && stockResultante < 0 ? 'text-red-600' : ''}`}>
                      {stockResultante ?? '-'}
                    </div>
                  </div>
                </div>
              )}

              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.cantidad || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="text-lg"
                />
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Textarea
                  id="motivo"
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Describe el motivo del ajuste..."
                  rows={3}
                />
              </div>

              {/* Campos opcionales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lote">Lote (opcional)</Label>
                  <Input
                    id="lote"
                    value={formData.lote || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, lote: e.target.value }))}
                    placeholder="Número de lote"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación (opcional)</Label>
                  <Input
                    id="ubicacion"
                    value={formData.ubicacion || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, ubicacion: e.target.value }))}
                    placeholder="Ej: A1-E3-P2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end gap-4 mt-6">
            <Link href="/almacenes/stock">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Ajuste
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    
  )
}
