'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  DollarSign,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Clock,
} from 'lucide-react'
import { pedidosCompraService } from '@/services/pedidos-compra.service'
import { albaranesCompraService } from '@/services/albaranes-compra.service'
import { facturasCompraService } from '@/services/facturas-compra.service'
import { toast } from 'sonner'

interface TabEstadisticasProps {
  proveedorId: string
  proveedorNombre: string
}

interface EstadisticasProveedor {
  totalComprado: number
  totalCompradoAnterior: number
  ticketMedio: number
  numDocumentos: {
    pedidos: number
    albaranes: number
    facturas: number
  }
  tiempoEntregaPromedio: number | null
  productosMasComprados: Array<{
    nombre: string
    cantidad: number
    total: number
  }>
  evolucionMensual: Array<{
    mes: string
    total: number
  }>
}

export function TabEstadisticas({ proveedorId, proveedorNombre }: TabEstadisticasProps) {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('anual')
  const [estadisticas, setEstadisticas] = useState<EstadisticasProveedor | null>(null)

  useEffect(() => {
    cargarEstadisticas()
  }, [proveedorId, periodo])

  const cargarEstadisticas = async () => {
    setLoading(true)
    try {
      const hoy = new Date()
      let desde: Date
      let desdeAnterior: Date
      let hastaAnterior: Date

      switch (periodo) {
        case 'mensual':
          desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
          desdeAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
          hastaAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
          break
        case 'trimestral':
          const trimestre = Math.floor(hoy.getMonth() / 3)
          desde = new Date(hoy.getFullYear(), trimestre * 3, 1)
          desdeAnterior = new Date(hoy.getFullYear(), (trimestre - 1) * 3, 1)
          hastaAnterior = new Date(hoy.getFullYear(), trimestre * 3, 0)
          break
        case 'anual':
        default:
          desde = new Date(hoy.getFullYear(), 0, 1)
          desdeAnterior = new Date(hoy.getFullYear() - 1, 0, 1)
          hastaAnterior = new Date(hoy.getFullYear() - 1, 11, 31)
          break
      }

      const [pedRes, albRes, facRes] = await Promise.all([
        pedidosCompraService.getAll({ proveedorId, limit: 100 }).catch(() => ({ data: [] })),
        albaranesCompraService.getAll({ proveedorId, limit: 100 }).catch(() => ({ data: [] })),
        facturasCompraService.getAll({ proveedorId, limit: 100 }).catch(() => ({ data: [] })),
      ])

      const pedidos = pedRes.data || []
      const albaranes = albRes.data || []
      const facturas = facRes.data || []

      const filtrarPorFecha = (docs: any[], campo: string = 'fecha') => {
        return docs.filter(d => {
          const fecha = new Date(d[campo] || d.fechaCreacion)
          return fecha >= desde && fecha <= hoy
        })
      }

      const facturasPeriodo = filtrarPorFecha(facturas)

      const totalComprado = facturasPeriodo.reduce((sum, f) =>
        sum + (f.totales?.totalFactura || 0), 0)

      const facturasAnteriores = facturas.filter(f => {
        const fecha = new Date(f.fecha || f.fechaCreacion)
        return fecha >= desdeAnterior && fecha <= hastaAnterior
      })
      const totalCompradoAnterior = facturasAnteriores.reduce((sum, f) =>
        sum + (f.totales?.totalFactura || 0), 0)

      const ticketMedio = facturasPeriodo.length > 0
        ? totalComprado / facturasPeriodo.length
        : 0

      // Calcular tiempo de entrega promedio (de pedidos completados)
      let tiempoEntregaPromedio: number | null = null
      const pedidosCompletados = pedidos.filter((p: any) =>
        p.estado === 'completado' || p.estado === 'recibido'
      )
      if (pedidosCompletados.length > 0) {
        const tiempos = pedidosCompletados
          .filter((p: any) => p.fechaEntrega && p.fecha)
          .map((p: any) => {
            const fechaPedido = new Date(p.fecha)
            const fechaEntrega = new Date(p.fechaEntrega)
            return Math.ceil((fechaEntrega.getTime() - fechaPedido.getTime()) / (1000 * 60 * 60 * 24))
          })
          .filter(t => t > 0)

        if (tiempos.length > 0) {
          tiempoEntregaPromedio = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
        }
      }

      // Productos más comprados
      const productosMap = new Map<string, { nombre: string; cantidad: number; total: number }>()
      facturasPeriodo.forEach(factura => {
        (factura.lineas || []).forEach((linea: any) => {
          const nombre = linea.descripcion || linea.nombre || 'Producto'
          const existing = productosMap.get(nombre)
          if (existing) {
            existing.cantidad += linea.cantidad || 1
            existing.total += linea.totalLinea || 0
          } else {
            productosMap.set(nombre, {
              nombre,
              cantidad: linea.cantidad || 1,
              total: linea.totalLinea || 0,
            })
          }
        })
      })
      const productosMasComprados = Array.from(productosMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      // Evolución mensual
      const evolucionMensual: Array<{ mes: string; total: number }> = []
      const mesesAtras = periodo === 'anual' ? 12 : periodo === 'trimestral' ? 3 : 1
      for (let i = mesesAtras - 1; i >= 0; i--) {
        const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const mesStr = mes.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
        const facturasDelMes = facturas.filter(f => {
          const fecha = new Date(f.fecha || f.fechaCreacion)
          return fecha.getMonth() === mes.getMonth() &&
                 fecha.getFullYear() === mes.getFullYear()
        })
        const totalMes = facturasDelMes.reduce((sum, f) =>
          sum + (f.totales?.totalFactura || 0), 0)
        evolucionMensual.push({ mes: mesStr, total: totalMes })
      }

      setEstadisticas({
        totalComprado,
        totalCompradoAnterior,
        ticketMedio,
        numDocumentos: {
          pedidos: pedidos.length,
          albaranes: albaranes.length,
          facturas: facturas.length,
        },
        tiempoEntregaPromedio,
        productosMasComprados,
        evolucionMensual,
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
      toast.error('Error al cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const calcularVariacion = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? 100 : 0
    return ((actual - anterior) / anterior) * 100
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!estadisticas) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">No hay datos estadísticos disponibles</p>
        </CardContent>
      </Card>
    )
  }

  const variacionCompras = calcularVariacion(
    estadisticas.totalComprado,
    estadisticas.totalCompradoAnterior
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Estadísticas de {proveedorNombre}</h3>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensual">Este mes</SelectItem>
              <SelectItem value="trimestral">Trimestre</SelectItem>
              <SelectItem value="anual">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={cargarEstadisticas}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Comprado</p>
                <p className="text-2xl font-bold">
                  {estadisticas.totalComprado.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  })}
                </p>
                <div className={`flex items-center gap-1 text-xs ${variacionCompras <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {variacionCompras >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(variacionCompras).toFixed(1)}% vs anterior
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Ticket Medio</p>
                <p className="text-2xl font-bold">
                  {estadisticas.ticketMedio.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">Por factura</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Tiempo Entrega</p>
                <p className="text-2xl font-bold">
                  {estadisticas.tiempoEntregaPromedio !== null
                    ? `${estadisticas.tiempoEntregaPromedio} días`
                    : 'Sin datos'
                  }
                </p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pedidos</p>
                <p className="text-2xl font-bold">
                  {estadisticas.numDocumentos.pedidos}
                </p>
                <p className="text-xs text-muted-foreground">Total histórico</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Evolución mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolución de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estadisticas.evolucionMensual.map((item, index) => {
                const maxTotal = Math.max(...estadisticas.evolucionMensual.map(e => e.total))
                const porcentaje = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.mes}</span>
                      <span className="font-medium">
                        {item.total.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Productos más comprados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos Más Comprados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadisticas.productosMasComprados.length > 0 ? (
              <div className="space-y-3">
                {estadisticas.productosMasComprados.map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{producto.nombre}</p>
                        <p className="text-xs text-muted-foreground">{producto.cantidad} uds.</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {producto.total.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground">No hay datos de productos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen de documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Documentos</CardTitle>
          <CardDescription>Total histórico de documentos con este proveedor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">
                {estadisticas.numDocumentos.pedidos}
              </p>
              <p className="text-sm text-muted-foreground">Pedidos</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">
                {estadisticas.numDocumentos.albaranes}
              </p>
              <p className="text-sm text-muted-foreground">Albaranes</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {estadisticas.numDocumentos.facturas}
              </p>
              <p className="text-sm text-muted-foreground">Facturas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
