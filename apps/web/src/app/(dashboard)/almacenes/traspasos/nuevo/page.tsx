'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { traspasosService, CreateTraspasoDTO } from '@/services/traspasos.service'
import { almacenesService } from '@/services/almacenes.service'
import { productosService } from '@/services/productos.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Save,
  Package,
  Warehouse,
  ArrowRightLeft,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { useUserPreferences } from '@/hooks/useUserPreferences'

interface LineaForm {
  id: string
  productoId: string
  productoCodigo: string
  productoNombre: string
  cantidadSolicitada: number
  stockDisponible: number
  costeUnitario: number
  ubicacionOrigen: string
  observaciones: string
}

export default function NuevoTraspasoPage() {
  const router = useRouter()
  const { almacenDefaultId } = useUserPreferences()

  // Estado del formulario principal
  const [almacenOrigenId, setAlmacenOrigenId] = useState('')
  const [almacenDestinoId, setAlmacenDestinoId] = useState('')
  const [motivoTraspaso, setMotivoTraspaso] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [prioridad, setPrioridad] = useState<'baja' | 'normal' | 'alta' | 'urgente'>('normal')

  // Estado de líneas
  const [lineas, setLineas] = useState<LineaForm[]>([])

  // Estado de datos auxiliares
  const [almacenes, setAlmacenes] = useState<{ _id: string; nombre: string; codigo?: string; esPrincipal?: boolean }[]>([])
  const [productoSearch, setProductoSearch] = useState('')
  const [productos, setProductos] = useState<any[]>([])
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
        // Establecer almacen origen por defecto: preferencia usuario > principal > primero
        if (almacenesData.length > 0) {
          const almacenDefault = almacenDefaultId
            ? almacenesData.find((a: any) => a._id === almacenDefaultId)
            : almacenesData.find((a: any) => a.esPrincipal) || almacenesData[0]
          if (almacenDefault) {
            setAlmacenOrigenId(almacenDefault._id)
          }
        }
      } catch (error) {
        console.error('Error cargando almacenes:', error)
      }
    }
    loadAlmacenes()
  }, [almacenDefaultId])

  // Buscar productos
  useEffect(() => {
    if (!productoSearch || productoSearch.length < 2 || !almacenOrigenId) {
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
  }, [productoSearch, almacenOrigenId])

  const agregarProducto = async (producto: any) => {
    // Verificar que no esté ya agregado
    if (lineas.some(l => l.productoId === producto._id)) {
      toast.error('Este producto ya está en la lista')
      return
    }

    // Obtener stock disponible en almacén origen
    let stockDisponible = 0
    try {
      const stockAlmacen = producto.stockPorAlmacen?.find((s: any) => s.almacenId === almacenOrigenId)
      stockDisponible = stockAlmacen?.cantidad || 0
    } catch (error) {
      console.error('Error obteniendo stock:', error)
    }

    const nuevaLinea: LineaForm = {
      id: `${Date.now()}-${Math.random()}`,
      productoId: producto._id,
      productoCodigo: producto.codigo || producto.sku || '',
      productoNombre: producto.nombre,
      cantidadSolicitada: 1,
      stockDisponible,
      costeUnitario: producto.costes?.costeUltimo || producto.costes?.costeMedio || 0,
      ubicacionOrigen: '',
      observaciones: '',
    }

    setLineas(prev => [...prev, nuevaLinea])
    setProductoSearch('')
    setProductos([])
  }

  const eliminarLinea = (id: string) => {
    setLineas(prev => prev.filter(l => l.id !== id))
  }

  const actualizarLinea = (id: string, campo: keyof LineaForm, valor: any) => {
    setLineas(prev => prev.map(l =>
      l.id === id ? { ...l, [campo]: valor } : l
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!almacenOrigenId) {
      toast.error('Selecciona un almacén de origen')
      return
    }
    if (!almacenDestinoId) {
      toast.error('Selecciona un almacén de destino')
      return
    }
    if (almacenOrigenId === almacenDestinoId) {
      toast.error('El almacén de origen y destino no pueden ser el mismo')
      return
    }
    if (lineas.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    // Validar cantidades
    for (const linea of lineas) {
      if (linea.cantidadSolicitada <= 0) {
        toast.error(`La cantidad para ${linea.productoNombre} debe ser mayor a 0`)
        return
      }
      if (linea.cantidadSolicitada > linea.stockDisponible) {
        toast.error(`Stock insuficiente para ${linea.productoNombre}. Disponible: ${linea.stockDisponible}`)
        return
      }
    }

    setSaving(true)
    try {
      const data: CreateTraspasoDTO = {
        almacenOrigenId,
        almacenDestinoId,
        lineas: lineas.map(l => ({
          productoId: l.productoId,
          cantidadSolicitada: l.cantidadSolicitada,
          ubicacionOrigen: l.ubicacionOrigen || undefined,
          costeUnitario: l.costeUnitario || undefined,
          observaciones: l.observaciones || undefined,
        })),
        motivoTraspaso: motivoTraspaso || undefined,
        observaciones: observaciones || undefined,
        prioridad,
      }

      await traspasosService.crear(data)
      toast.success('Traspaso creado correctamente')
      router.push('/almacenes/traspasos')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear el traspaso')
    } finally {
      setSaving(false)
    }
  }

  const almacenOrigenNombre = almacenes.find(a => a._id === almacenOrigenId)?.nombre || ''
  const almacenDestinoNombre = almacenes.find(a => a._id === almacenDestinoId)?.nombre || ''

  const totalProductos = lineas.length
  const totalUnidades = lineas.reduce((sum, l) => sum + l.cantidadSolicitada, 0)
  const valorTotal = lineas.reduce((sum, l) => sum + (l.cantidadSolicitada * l.costeUnitario), 0)

  return (
    
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/almacenes/traspasos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nuevo Traspaso</h1>
            <p className="text-muted-foreground">Crear traspaso entre almacenes</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Almacenes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    Almacenes
                  </CardTitle>
                  <CardDescription>
                    Selecciona el almacén de origen y destino del traspaso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="origen">Almacén de Origen *</Label>
                      <SearchableSelect
                        options={almacenes
                          .filter(a => a._id !== almacenDestinoId)
                          .map(a => ({
                            value: a._id,
                            label: a.nombre,
                            description: a.esPrincipal ? 'Principal' : a.codigo
                          }))}
                        value={almacenOrigenId}
                        onValueChange={(value) => {
                          setAlmacenOrigenId(value)
                          // Limpiar líneas si cambia el almacén origen
                          if (lineas.length > 0) {
                            toast.info('Se limpiaron las líneas al cambiar el almacén de origen')
                            setLineas([])
                          }
                        }}
                        placeholder="Seleccionar almacén origen..."
                        searchPlaceholder="Buscar almacén..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destino">Almacén de Destino *</Label>
                      <SearchableSelect
                        options={almacenes
                          .filter(a => a._id !== almacenOrigenId)
                          .map(a => ({
                            value: a._id,
                            label: a.nombre,
                            description: a.esPrincipal ? 'Principal' : a.codigo
                          }))}
                        value={almacenDestinoId}
                        onValueChange={setAlmacenDestinoId}
                        placeholder="Seleccionar almacén destino..."
                        searchPlaceholder="Buscar almacén..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Productos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Productos a Traspasar
                  </CardTitle>
                  <CardDescription>
                    Busca y agrega los productos que deseas traspasar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Buscador de productos */}
                  {almacenOrigenId ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar producto por nombre o código..."
                        value={productoSearch}
                        onChange={(e) => setProductoSearch(e.target.value)}
                        className="pl-9"
                      />
                      {searchingProductos && (
                        <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}

                      {/* Lista de productos encontrados */}
                      {productos.length > 0 && (
                        <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                          {productos.map((p) => {
                            const stockAlmacen = p.stockPorAlmacen?.find((s: any) => s.almacenId === almacenOrigenId)
                            const stockDisponible = stockAlmacen?.cantidad || 0
                            return (
                              <div
                                key={p._id}
                                className="p-3 hover:bg-muted cursor-pointer flex items-center justify-between"
                                onClick={() => agregarProducto(p)}
                              >
                                <div className="flex items-center gap-3">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{p.nombre}</div>
                                    <div className="text-xs text-muted-foreground">{p.codigo || p.sku}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-sm font-medium ${stockDisponible > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Stock: {stockDisponible}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="text-amber-700">Selecciona primero el almacén de origen para buscar productos</span>
                    </div>
                  )}

                  {/* Tabla de líneas */}
                  {lineas.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="w-[120px] text-center">Stock Disp.</TableHead>
                            <TableHead className="w-[120px] text-center">Cantidad</TableHead>
                            <TableHead className="w-[120px] text-right">Coste Unit.</TableHead>
                            <TableHead className="w-[120px] text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineas.map((linea) => (
                            <TableRow key={linea.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{linea.productoNombre}</div>
                                  <div className="text-xs text-muted-foreground">{linea.productoCodigo}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={linea.stockDisponible > 0 ? 'default' : 'destructive'}>
                                  {linea.stockDisponible}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  max={linea.stockDisponible}
                                  value={linea.cantidadSolicitada}
                                  onChange={(e) => actualizarLinea(linea.id, 'cantidadSolicitada', parseInt(e.target.value) || 0)}
                                  className={`w-full text-center ${linea.cantidadSolicitada > linea.stockDisponible ? 'border-red-500' : ''}`}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(linea.costeUnitario)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(linea.cantidadSolicitada * linea.costeUnitario)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => eliminarLinea(linea.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hay productos agregados</p>
                      <p className="text-sm">Usa el buscador para agregar productos al traspaso</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Columna lateral */}
            <div className="space-y-6">
              {/* Resumen */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Origen:</span>
                      <span className="font-medium">{almacenOrigenNombre || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Destino:</span>
                      <span className="font-medium">{almacenDestinoNombre || '-'}</span>
                    </div>
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Productos:</span>
                      <span className="font-medium">{totalProductos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unidades:</span>
                      <span className="font-medium">{totalUnidades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor total:</span>
                      <span className="font-bold text-lg">{formatCurrency(valorTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prioridad y observaciones */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <Select
                      value={prioridad}
                      onValueChange={(value) => setPrioridad(value as 'baja' | 'normal' | 'alta' | 'urgente')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">Motivo del Traspaso</Label>
                    <Input
                      id="motivo"
                      value={motivoTraspaso}
                      onChange={(e) => setMotivoTraspaso(e.target.value)}
                      placeholder="Ej: Reposición de stock"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Observaciones adicionales..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Botones */}
              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={saving || lineas.length === 0}>
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Crear Traspaso
                    </>
                  )}
                </Button>
                <Link href="/almacenes/traspasos" className="w-full">
                  <Button type="button" variant="outline" className="w-full">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    
  )
}
