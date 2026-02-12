'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { pedidosCompraService } from '@/services/pedidos-compra.service'
import { albaranesCompraService } from '@/services/albaranes-compra.service'
import { almacenesService } from '@/services/almacenes.service'
import { PedidoCompra, ESTADOS_PEDIDO_COMPRA } from '@/types/pedido-compra.types'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Package,
  Check,
  RefreshCw,
  Building2,
  Calendar,
  Truck,
  Box,
  ChevronRight,
  AlertCircle,
  Layers,
  Tag,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

interface LineaRecepcion {
  lineaId: string
  productoId?: string
  codigo?: string
  nombre: string
  descripcion?: string
  sku?: string
  cantidadPedida: number
  cantidadRecibida: number
  cantidadPendiente: number
  cantidadARecibir: number // Cantidad que se va a recibir en esta recepción
  precioUnitario: number
  unidad?: string
  esKit: boolean
  tieneVariantes: boolean
  variantes?: Array<{
    varianteId: string
    sku: string
    combinacion: Record<string, string>
    stockActual: number
  }>
  varianteSeleccionada?: {
    varianteId: string
    sku: string
    valores: Record<string, string>
  }
  componentesKit?: Array<{
    productoId: string
    codigo?: string
    nombre: string
    cantidad: number
    cantidadPorRecibir: number
  }>
  // Campos de trazabilidad
  lote?: string
  numeroSerie?: string
  ubicacion?: string
}

interface Almacen {
  _id: string
  codigo: string
  nombre: string
}

export default function RecepcionPedidoCompraPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [pedido, setPedido] = useState<PedidoCompra | null>(null)
  const [lineasRecepcion, setLineasRecepcion] = useState<LineaRecepcion[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [numeroAlbaranProveedor, setNumeroAlbaranProveedor] = useState('')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    loadData()
  }, [resolvedParams.id])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // Cargar datos en paralelo
      const [recepcionResponse, almacenesResponse] = await Promise.all([
        pedidosCompraService.prepararParaRecepcion(resolvedParams.id),
        almacenesService.getAll(),
      ])

      if (recepcionResponse.success && recepcionResponse.data) {
        setPedido(recepcionResponse.data.pedido)

        // Preparar líneas con cantidad a recibir por defecto = cantidad pendiente
        const lineas = recepcionResponse.data.lineasRecepcion.map(linea => ({
          ...linea,
          cantidadARecibir: linea.cantidadPendiente,
        }))
        setLineasRecepcion(lineas)
      }

      if (almacenesResponse.success && almacenesResponse.data) {
        setAlmacenes(almacenesResponse.data)
        // Seleccionar el primer almacén por defecto
        if (almacenesResponse.data.length > 0) {
          setAlmacenSeleccionado(almacenesResponse.data[0]._id)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar datos')
      router.push('/compras/pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCantidadChange = (lineaId: string, cantidad: number) => {
    setLineasRecepcion(prev =>
      prev.map(linea =>
        linea.lineaId === lineaId
          ? { ...linea, cantidadARecibir: Math.max(0, Math.min(cantidad, linea.cantidadPendiente)) }
          : linea
      )
    )
  }

  const handleVarianteChange = (lineaId: string, varianteId: string) => {
    setLineasRecepcion(prev =>
      prev.map(linea => {
        if (linea.lineaId !== lineaId) return linea
        const variante = linea.variantes?.find(v => v.varianteId === varianteId)
        return {
          ...linea,
          varianteSeleccionada: variante ? {
            varianteId: variante.varianteId,
            sku: variante.sku,
            valores: variante.combinacion,
          } : undefined,
        }
      })
    )
  }

  const handleLoteChange = (lineaId: string, lote: string) => {
    setLineasRecepcion(prev =>
      prev.map(linea =>
        linea.lineaId === lineaId ? { ...linea, lote } : linea
      )
    )
  }

  const handleUbicacionChange = (lineaId: string, ubicacion: string) => {
    setLineasRecepcion(prev =>
      prev.map(linea =>
        linea.lineaId === lineaId ? { ...linea, ubicacion } : linea
      )
    )
  }

  const handleRecibirTodo = () => {
    setLineasRecepcion(prev =>
      prev.map(linea => ({
        ...linea,
        cantidadARecibir: linea.cantidadPendiente,
      }))
    )
  }

  const handleRecibirNada = () => {
    setLineasRecepcion(prev =>
      prev.map(linea => ({
        ...linea,
        cantidadARecibir: 0,
      }))
    )
  }

  const handleCrearAlbaran = async () => {
    if (!pedido || !almacenSeleccionado) {
      toast.error('Debe seleccionar un almacen')
      return
    }

    // Verificar que hay algo que recibir
    const lineasARecibir = lineasRecepcion.filter(l => l.cantidadARecibir > 0)
    if (lineasARecibir.length === 0) {
      toast.error('Debe indicar al menos una cantidad a recibir')
      return
    }

    // Verificar que productos con variantes tengan variante seleccionada
    for (const linea of lineasARecibir) {
      if (linea.tieneVariantes && !linea.varianteSeleccionada) {
        toast.error(`Debe seleccionar una variante para "${linea.nombre}"`)
        return
      }
    }

    try {
      setIsSaving(true)

      // Crear albarán de compra desde el pedido
      const response = await albaranesCompraService.crearDesdePedido({
        pedidoCompraId: pedido._id,
        almacenId: almacenSeleccionado,
        numeroAlbaranProveedor,
        observaciones,
        recibirTodo: false,
        lineas: lineasARecibir.map(linea => ({
          lineaId: linea.lineaId,
          cantidadRecibida: linea.cantidadARecibir,
          varianteId: linea.varianteSeleccionada?.varianteId,
          lote: linea.lote,
          ubicacion: linea.ubicacion,
        })),
      })

      if (response.success && response.data) {
        toast.success('Albaran de compra creado correctamente')
        router.push(`/compras/albaranes/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear albaran')
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0)
  }

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Calcular totales
  const totalLineasPendientes = lineasRecepcion.filter(l => l.cantidadPendiente > 0).length
  const totalARecibir = lineasRecepcion.reduce((sum, l) => sum + l.cantidadARecibir, 0)
  const importeARecibir = lineasRecepcion.reduce(
    (sum, l) => sum + l.cantidadARecibir * l.precioUnitario,
    0
  )

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando datos de recepcion...</p>
          </div>
        </div>
      
    )
  }

  if (!pedido) {
    return (
      
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Pedido de compra no encontrado</p>
          <Link href="/compras/pedidos">
            <Button variant="link" className="mt-2">
              Volver al listado
            </Button>
          </Link>
        </div>
      
    )
  }

  const proveedorNombre = typeof pedido.proveedorId === 'object'
    ? (pedido.proveedorId as any).nombreComercial || (pedido.proveedorId as any).nombre
    : pedido.proveedorNombre

  return (
    
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link href={`/compras/pedidos/${pedido._id}`}>
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight">
                      Recepcion de Pedido
                    </h1>
                    <Badge variant="outline">{pedido.codigo}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {proveedorNombre}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(pedido.fecha)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRecibirTodo}
                    disabled={isSaving}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Recibir todo
                  </Button>
                  <Button
                    onClick={handleCrearAlbaran}
                    disabled={isSaving || totalARecibir === 0}
                  >
                    {isSaving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Truck className="mr-2 h-4 w-4" />
                    )}
                    Crear Albaran
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalLineasPendientes}</div>
              <p className="text-sm text-muted-foreground">Lineas pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalARecibir}</div>
              <p className="text-sm text-muted-foreground">Unidades a recibir</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(importeARecibir)}</div>
              <p className="text-sm text-muted-foreground">Importe a recibir</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(pedido.totales?.totalPedido || 0)}</div>
              <p className="text-sm text-muted-foreground">Total pedido</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna principal - Lineas */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lineas a recibir
                </CardTitle>
                <CardDescription>
                  Indique las cantidades a recibir para cada linea
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineasRecepcion.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay lineas pendientes de recibir
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-2">
                    {lineasRecepcion.map((linea, index) => (
                      <AccordionItem
                        key={linea.lineaId}
                        value={linea.lineaId}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{linea.nombre}</span>
                                {linea.esKit && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Layers className="h-3 w-3 mr-1" />
                                    Kit
                                  </Badge>
                                )}
                                {linea.tieneVariantes && (
                                  <Badge variant="outline" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    Variantes
                                  </Badge>
                                )}
                              </div>
                              {linea.codigo && (
                                <p className="text-xs text-muted-foreground">{linea.codigo}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-right">
                                <div className="font-medium">
                                  {linea.cantidadARecibir} / {linea.cantidadPendiente}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  a recibir / pendiente
                                </div>
                              </div>
                              <div className="text-right min-w-[80px]">
                                <div className="font-medium">
                                  {formatCurrency(linea.cantidadARecibir * linea.precioUnitario)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <div className="grid gap-4 pt-2">
                            {/* Info del producto */}
                            <div className="grid gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <span className="text-muted-foreground">Pedido:</span>
                                  <span className="ml-2 font-medium">{linea.cantidadPedida} {linea.unidad}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Recibido:</span>
                                  <span className="ml-2 font-medium">{linea.cantidadRecibida} {linea.unidad}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Pendiente:</span>
                                  <span className="ml-2 font-medium text-orange-600">{linea.cantidadPendiente} {linea.unidad}</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Precio unitario:</span>
                                <span className="ml-2 font-medium">{formatCurrency(linea.precioUnitario)}</span>
                              </div>
                            </div>

                            {/* Selector de variante si tiene */}
                            {linea.tieneVariantes && linea.variantes && linea.variantes.length > 0 && (
                              <div className="space-y-2">
                                <Label>Variante</Label>
                                <Select
                                  value={linea.varianteSeleccionada?.varianteId || ''}
                                  onValueChange={(value) => handleVarianteChange(linea.lineaId, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar variante..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {linea.variantes.map((variante) => (
                                      <SelectItem key={variante.varianteId} value={variante.varianteId}>
                                        <div className="flex items-center gap-2">
                                          <span>{variante.sku}</span>
                                          <span className="text-muted-foreground">
                                            ({Object.values(variante.combinacion).join(' / ')})
                                          </span>
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            Stock: {variante.stockActual}
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {!linea.varianteSeleccionada && (
                                  <p className="text-xs text-orange-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Debe seleccionar una variante
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Componentes del kit si es kit */}
                            {linea.esKit && linea.componentesKit && linea.componentesKit.length > 0 && (
                              <div className="space-y-2">
                                <Label>Componentes del kit</Label>
                                <div className="border rounded-lg divide-y">
                                  {linea.componentesKit.map((comp, idx) => (
                                    <div key={idx} className="p-2 flex items-center justify-between text-sm">
                                      <div>
                                        <span className="font-medium">{comp.nombre}</span>
                                        {comp.codigo && (
                                          <span className="text-muted-foreground ml-2">({comp.codigo})</span>
                                        )}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {comp.cantidad} x {linea.cantidadARecibir} = {comp.cantidad * linea.cantidadARecibir} uds
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Al recibir el kit, se daran entrada a todos sus componentes
                                </p>
                              </div>
                            )}

                            {/* Cantidad a recibir */}
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Cantidad a recibir</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={linea.cantidadPendiente}
                                  value={linea.cantidadARecibir}
                                  onChange={(e) => handleCantidadChange(linea.lineaId, Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Lote (opcional)</Label>
                                <Input
                                  placeholder="Numero de lote..."
                                  value={linea.lote || ''}
                                  onChange={(e) => handleLoteChange(linea.lineaId, e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Ubicacion en almacen (opcional)</Label>
                              <Input
                                placeholder="Pasillo, estanteria..."
                                value={linea.ubicacion || ''}
                                onChange={(e) => handleUbicacionChange(linea.lineaId, e.target.value)}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral - Configuración */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Configuracion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Almacen de recepcion *</Label>
                  <SearchableSelect
                    options={almacenes.map(a => ({
                      value: a._id,
                      label: `${a.nombre} (${a.codigo})`
                    }))}
                    value={almacenSeleccionado}
                    onValueChange={setAlmacenSeleccionado}
                    placeholder="Seleccionar almacen..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>N albaran proveedor</Label>
                  <Input
                    placeholder="Numero del albaran del proveedor..."
                    value={numeroAlbaranProveedor}
                    onChange={(e) => setNumeroAlbaranProveedor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <textarea
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    placeholder="Observaciones de la recepcion..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Progreso actual */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Progreso del pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={pedido.porcentajeRecibido || 0} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {pedido.porcentajeRecibido || 0}% recibido
                </p>
              </CardContent>
            </Card>

            {/* Acciones rapidas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Acciones rapidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleRecibirTodo}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Marcar todo como recibido
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleRecibirNada}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpiar cantidades
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  )
}
