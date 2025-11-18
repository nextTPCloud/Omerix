'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { productosService } from '@/services/productos.service'
import { familiasService } from '@/services/familias.service'
import { Familia } from '@/types/familia.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  Package,
  Info,
  Warehouse,
  Barcode,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoProductoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [familias, setFamilias] = useState<Familia[]>([])
  const [activeTab, setActiveTab] = useState('datos')

  const [formData, setFormData] = useState({
    // Datos generales
    nombre: '',
    descripcion: '',
    sku: '',
    codigoBarras: '',
    referencia: '',
    familiaId: '',
    marca: '',
    tags: [] as string[],
    tipo: 'simple' as 'simple' | 'variantes' | 'compuesto' | 'servicio' | 'materia_prima',

    // Precios
    precios: {
      compra: 0,
      venta: 0,
      pvp: 0,
      margen: 0,
    },

    // Stock
    stock: {
      cantidad: 0,
      minimo: 0,
      maximo: 0,
      ubicacion: '',
    },
    gestionaStock: true,

    // Trazabilidad
    trazabilidad: {
      tipo: 'ninguna' as 'ninguna' | 'lote' | 'numero_serie',
      lotes: [],
      numerosSerie: [],
    },

    // Impuestos
    iva: 21,
    tipoImpuesto: 'iva' as 'iva' | 'igic' | 'exento',

    // Características físicas
    peso: 0,
    dimensiones: {
      largo: 0,
      ancho: 0,
      alto: 0,
    },

    // Estado
    activo: true,
    disponible: true,
    destacado: false,

    // TPV
    usarEnTPV: true,
    permiteDescuento: true,
    precioModificable: false,

    // Notas
    notas: '',
  })

  useEffect(() => {
    fetchFamilias()
  }, [])

  const fetchFamilias = async () => {
    try {
      const response = await familiasService.getAll({ limit: 1000, activo: true })
      setFamilias(response.data)
    } catch (err) {
      console.error('Error al cargar familias:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        throw new Error('El nombre es obligatorio')
      }
      if (!formData.sku.trim()) {
        throw new Error('El SKU es obligatorio')
      }
      if (formData.precios.venta < 0) {
        throw new Error('El precio de venta no puede ser negativo')
      }

      // Calcular margen automáticamente
      if (formData.precios.compra > 0 && formData.precios.venta > 0) {
        formData.precios.margen =
          ((formData.precios.venta - formData.precios.compra) / formData.precios.compra) * 100
      }

      // Si no tiene PVP, usar precio de venta
      if (!formData.precios.pvp || formData.precios.pvp === 0) {
        formData.precios.pvp = formData.precios.venta
      }

      await productosService.create(formData)
      toast.success('Producto creado correctamente')
      router.push('/productos')
    } catch (err: any) {
      console.error('Error al crear producto:', err)
      toast.error(err.response?.data?.message || err.message || 'Error al crear el producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-7 w-7 text-primary" />
              Nuevo Producto
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Completa los datos del nuevo producto
            </p>
          </div>
        </div>

        {/* Formulario con pestañas */}
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="datos" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Datos</span>
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                <span className="hidden sm:inline">Stock</span>
              </TabsTrigger>
              <TabsTrigger value="trazabilidad" className="flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                <span className="hidden sm:inline">Trazabilidad</span>
              </TabsTrigger>
              <TabsTrigger value="tpv" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">TPV</span>
              </TabsTrigger>
              <TabsTrigger value="consumo" className="flex items-center gap-2" disabled>
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Consumo</span>
              </TabsTrigger>
            </TabsList>

            {/* PESTAÑA: DATOS GENERALES */}
            <TabsContent value="datos" className="space-y-4 mt-4">
              {/* Información básica */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Portátil Dell XPS 15"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      placeholder="Ej: DELL-XPS-15-001"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="codigoBarras">Código de Barras</Label>
                    <Input
                      id="codigoBarras"
                      value={formData.codigoBarras}
                      onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                      placeholder="Ej: 1234567890123"
                    />
                  </div>

                  <div>
                    <Label htmlFor="referencia">Referencia Proveedor</Label>
                    <Input
                      id="referencia"
                      value={formData.referencia}
                      onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                      placeholder="Referencia del proveedor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="marca">Marca</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                      placeholder="Ej: Dell, HP, Apple"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción detallada del producto..."
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="familiaId">Familia</Label>
                    <Select
                      value={formData.familiaId}
                      onValueChange={(value) => setFormData({ ...formData, familiaId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una familia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin familia</SelectItem>
                        {familias.map((familia) => (
                          <SelectItem key={familia._id} value={familia._id}>
                            {familia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Producto</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="variantes">Con Variantes</SelectItem>
                        <SelectItem value="compuesto">Compuesto/Kit</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                        <SelectItem value="materia_prima">Materia Prima</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Precios */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Precios</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="precioCompra">Precio Compra</Label>
                    <div className="relative">
                      <Input
                        id="precioCompra"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precios.compra}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            precios: { ...formData.precios, compra: parseFloat(e.target.value) || 0 },
                          })
                        }
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                        €
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="precioVenta">Precio Venta *</Label>
                    <div className="relative">
                      <Input
                        id="precioVenta"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precios.venta}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            precios: { ...formData.precios, venta: parseFloat(e.target.value) || 0 },
                          })
                        }
                        placeholder="0.00"
                        required
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                        €
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pvp">PVP (Recomendado)</Label>
                    <div className="relative">
                      <Input
                        id="pvp"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precios.pvp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            precios: { ...formData.precios, pvp: parseFloat(e.target.value) || 0 },
                          })
                        }
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                        €
                      </span>
                    </div>
                  </div>
                </div>

                {formData.precios.compra > 0 && formData.precios.venta > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">Margen estimado:</span>{' '}
                      {(
                        ((formData.precios.venta - formData.precios.compra) / formData.precios.compra) *
                        100
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                )}
              </Card>

              {/* Impuestos */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Impuestos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoImpuesto">Tipo de Impuesto</Label>
                    <Select
                      value={formData.tipoImpuesto}
                      onValueChange={(value: any) => setFormData({ ...formData, tipoImpuesto: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iva">IVA</SelectItem>
                        <SelectItem value="igic">IGIC (Canarias)</SelectItem>
                        <SelectItem value="exento">Exento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="iva">% {formData.tipoImpuesto.toUpperCase()}</Label>
                    <Select
                      value={formData.iva.toString()}
                      onValueChange={(value) => setFormData({ ...formData, iva: parseFloat(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="4">4% (Superreducido)</SelectItem>
                        <SelectItem value="10">10% (Reducido)</SelectItem>
                        <SelectItem value="21">21% (General)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Características físicas */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Características Físicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="largo">Largo (cm)</Label>
                    <Input
                      id="largo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.dimensiones.largo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensiones: { ...formData.dimensiones, largo: parseFloat(e.target.value) || 0 },
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ancho">Ancho (cm)</Label>
                    <Input
                      id="ancho"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.dimensiones.ancho}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensiones: { ...formData.dimensiones, ancho: parseFloat(e.target.value) || 0 },
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="alto">Alto (cm)</Label>
                    <Input
                      id="alto"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.dimensiones.alto}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dimensiones: { ...formData.dimensiones, alto: parseFloat(e.target.value) || 0 },
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </Card>

              {/* Estado */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Estado</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: !!checked })}
                    />
                    <Label htmlFor="activo" className="cursor-pointer">
                      Producto activo
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="disponible"
                      checked={formData.disponible}
                      onCheckedChange={(checked) => setFormData({ ...formData, disponible: !!checked })}
                    />
                    <Label htmlFor="disponible" className="cursor-pointer">
                      Disponible para venta
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="destacado"
                      checked={formData.destacado}
                      onCheckedChange={(checked) => setFormData({ ...formData, destacado: !!checked })}
                    />
                    <Label htmlFor="destacado" className="cursor-pointer">
                      Producto destacado
                    </Label>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* PESTAÑA: STOCK */}
            <TabsContent value="stock" className="space-y-4 mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Gestión de Stock</h3>

                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gestionaStock"
                      checked={formData.gestionaStock}
                      onCheckedChange={(checked) => setFormData({ ...formData, gestionaStock: !!checked })}
                    />
                    <Label htmlFor="gestionaStock" className="cursor-pointer">
                      Gestionar inventario automáticamente
                    </Label>
                  </div>
                </div>

                {formData.gestionaStock && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="cantidad">Cantidad Inicial</Label>
                      <Input
                        id="cantidad"
                        type="number"
                        min="0"
                        value={formData.stock.cantidad}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: { ...formData.stock, cantidad: parseInt(e.target.value) || 0 },
                          })
                        }
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="minimo">Stock Mínimo</Label>
                      <Input
                        id="minimo"
                        type="number"
                        min="0"
                        value={formData.stock.minimo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: { ...formData.stock, minimo: parseInt(e.target.value) || 0 },
                          })
                        }
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Alerta cuando esté por debajo</p>
                    </div>

                    <div>
                      <Label htmlFor="maximo">Stock Máximo</Label>
                      <Input
                        id="maximo"
                        type="number"
                        min="0"
                        value={formData.stock.maximo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: { ...formData.stock, maximo: parseInt(e.target.value) || 0 },
                          })
                        }
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ubicacion">Ubicación</Label>
                      <Input
                        id="ubicacion"
                        value={formData.stock.ubicacion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: { ...formData.stock, ubicacion: e.target.value },
                          })
                        }
                        placeholder="Ej: A-12-3"
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* Multi-almacén (próximamente) */}
              <Card className="p-6 bg-muted/50">
                <h3 className="text-lg font-semibold mb-2">Stock por Almacenes</h3>
                <p className="text-sm text-muted-foreground">
                  La gestión multi-almacén estará disponible después de crear el producto. Podrás distribuir el
                  stock entre diferentes almacenes desde la pantalla de edición.
                </p>
              </Card>
            </TabsContent>

            {/* PESTAÑA: TRAZABILIDAD */}
            <TabsContent value="trazabilidad" className="space-y-4 mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tipo de Trazabilidad</h3>

                <div>
                  <Label htmlFor="tipoTrazabilidad">Selecciona el tipo de control</Label>
                  <Select
                    value={formData.trazabilidad.tipo}
                    onValueChange={(value: any) =>
                      setFormData({
                        ...formData,
                        trazabilidad: { ...formData.trazabilidad, tipo: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguna">Sin trazabilidad</SelectItem>
                      <SelectItem value="lote">Por Lotes (Productos con caducidad, alimentos, etc.)</SelectItem>
                      <SelectItem value="numero_serie">
                        Por Número de Serie (Equipos, electrodomésticos, etc.)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-md">
                  {formData.trazabilidad.tipo === 'ninguna' && (
                    <p className="text-sm text-muted-foreground">
                      El producto no requiere control de trazabilidad especial.
                    </p>
                  )}

                  {formData.trazabilidad.tipo === 'lote' && (
                    <div>
                      <p className="text-sm font-medium mb-2">Trazabilidad por Lotes</p>
                      <p className="text-sm text-muted-foreground">
                        Podrás gestionar lotes con fechas de fabricación y caducidad después de crear el producto.
                        Ideal para productos alimenticios, farmacéuticos o con fecha de expiración.
                      </p>
                    </div>
                  )}

                  {formData.trazabilidad.tipo === 'numero_serie' && (
                    <div>
                      <p className="text-sm font-medium mb-2">Trazabilidad por Número de Serie</p>
                      <p className="text-sm text-muted-foreground">
                        Cada unidad tendrá un número de serie único. Podrás registrar números de serie después de
                        crear el producto. Ideal para equipos electrónicos, electrodomésticos, maquinaria, etc.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* PESTAÑA: TPV */}
            <TabsContent value="tpv" className="space-y-4 mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Configuración TPV</h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="usarEnTPV"
                      checked={formData.usarEnTPV}
                      onCheckedChange={(checked) => setFormData({ ...formData, usarEnTPV: !!checked })}
                    />
                    <Label htmlFor="usarEnTPV" className="cursor-pointer">
                      Usar en TPV (Punto de Venta)
                    </Label>
                  </div>

                  {formData.usarEnTPV && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="permiteDescuento"
                          checked={formData.permiteDescuento}
                          onCheckedChange={(checked) => setFormData({ ...formData, permiteDescuento: !!checked })}
                        />
                        <Label htmlFor="permiteDescuento" className="cursor-pointer">
                          Permitir descuentos
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="precioModificable"
                          checked={formData.precioModificable}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, precioModificable: !!checked })
                          }
                        />
                        <Label htmlFor="precioModificable" className="cursor-pointer">
                          Permitir modificar precio en TPV
                        </Label>
                      </div>

                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          <strong>Nota:</strong> Este producto aparecerá en el TPV cuando esté activo y disponible.
                          Asegúrate de configurar correctamente los precios y el stock.
                        </p>
                      </div>
                    </>
                  )}

                  {!formData.usarEnTPV && (
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Este producto no aparecerá en el Punto de Venta. Activa esta opción si quieres venderlo
                        desde el TPV.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* PESTAÑA: CONSUMO (Deshabilitada para nuevo producto) */}
            <TabsContent value="consumo" className="space-y-4 mt-4">
              <Card className="p-6">
                <p className="text-muted-foreground">
                  Las estadísticas de consumo estarán disponibles después de crear el producto y realizar ventas.
                </p>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 mt-6">
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
                  Crear Producto
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
