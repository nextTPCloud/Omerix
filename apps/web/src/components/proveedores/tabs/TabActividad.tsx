'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Clock,
  FileText,
  Package,
  Truck,
  Receipt,
  Mail,
  Phone,
  MessageSquare,
  RefreshCw,
  User,
} from 'lucide-react'
import { pedidosCompraService } from '@/services/pedidos-compra.service'
import { albaranesCompraService } from '@/services/albaranes-compra.service'
import { facturasCompraService } from '@/services/facturas-compra.service'
import { toast } from 'sonner'

interface TabActividadProps {
  proveedorId: string
  proveedorNombre: string
}

interface ActividadItem {
  id: string
  tipo: 'pedido' | 'albaran' | 'factura' | 'email' | 'llamada' | 'nota'
  accion: string
  descripcion: string
  fecha: Date
  usuario?: string
  documentoId?: string
  documentoCodigo?: string
  estado?: string
  importe?: number
}

const ICONOS_TIPO: Record<string, any> = {
  pedido: Package,
  albaran: Truck,
  factura: Receipt,
  email: Mail,
  llamada: Phone,
  nota: MessageSquare,
}

const COLORES_TIPO: Record<string, string> = {
  pedido: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  albaran: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  factura: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  email: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
  llamada: 'bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
  nota: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function TabActividad({ proveedorId, proveedorNombre }: TabActividadProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actividad, setActividad] = useState<ActividadItem[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)

  useEffect(() => {
    cargarActividad()
  }, [proveedorId])

  const cargarActividad = async () => {
    setLoading(true)
    try {
      const [pedRes, albRes, facRes] = await Promise.all([
        pedidosCompraService.getAll({ proveedorId, limit: 50 }).catch(() => ({ data: [] })),
        albaranesCompraService.getAll({ proveedorId, limit: 50 }).catch(() => ({ data: [] })),
        facturasCompraService.getAll({ proveedorId, limit: 50 }).catch(() => ({ data: [] })),
      ])

      const items: ActividadItem[] = []

      // Procesar pedidos
      const pedidos = pedRes.data || []
      pedidos.forEach((doc: any) => {
        items.push({
          id: `ped-${doc._id}-creado`,
          tipo: 'pedido',
          accion: 'creado',
          descripcion: `Pedido de compra ${doc.codigo} creado`,
          fecha: new Date(doc.fechaCreacion || doc.fecha),
          documentoId: doc._id,
          documentoCodigo: doc.codigo,
          estado: doc.estado,
          importe: doc.totales?.totalPedido,
        })

        if (doc.fechaEnvio) {
          items.push({
            id: `ped-${doc._id}-enviado`,
            tipo: 'pedido',
            accion: 'enviado',
            descripcion: `Pedido ${doc.codigo} enviado al proveedor`,
            fecha: new Date(doc.fechaEnvio),
            documentoId: doc._id,
            documentoCodigo: doc.codigo,
          })
        }

        if (doc.estado === 'recibido' || doc.estado === 'completado') {
          items.push({
            id: `ped-${doc._id}-recibido`,
            tipo: 'pedido',
            accion: 'recibido',
            descripcion: `Pedido ${doc.codigo} recibido`,
            fecha: new Date(doc.fechaEntrega || doc.fechaModificacion || doc.fecha),
            documentoId: doc._id,
            documentoCodigo: doc.codigo,
          })
        }
      })

      // Procesar albaranes
      const albaranes = albRes.data || []
      albaranes.forEach((doc: any) => {
        items.push({
          id: `alb-${doc._id}-creado`,
          tipo: 'albaran',
          accion: 'creado',
          descripcion: `Albarán de compra ${doc.codigo} registrado`,
          fecha: new Date(doc.fechaCreacion || doc.fecha),
          documentoId: doc._id,
          documentoCodigo: doc.codigo,
          estado: doc.estado,
          importe: doc.totales?.totalAlbaran,
        })

        if (doc.estado === 'facturado') {
          items.push({
            id: `alb-${doc._id}-facturado`,
            tipo: 'albaran',
            accion: 'facturado',
            descripcion: `Albarán ${doc.codigo} facturado`,
            fecha: new Date(doc.fechaModificacion || doc.fecha),
            documentoId: doc._id,
            documentoCodigo: doc.codigo,
          })
        }
      })

      // Procesar facturas
      const facturas = facRes.data || []
      facturas.forEach((doc: any) => {
        items.push({
          id: `fac-${doc._id}-creado`,
          tipo: 'factura',
          accion: 'creado',
          descripcion: `Factura de compra ${doc.codigo} registrada`,
          fecha: new Date(doc.fechaCreacion || doc.fecha),
          documentoId: doc._id,
          documentoCodigo: doc.codigo,
          estado: doc.estado,
          importe: doc.totales?.totalFactura,
        })

        if (doc.estado === 'pagada') {
          items.push({
            id: `fac-${doc._id}-pagada`,
            tipo: 'factura',
            accion: 'pagada',
            descripcion: `Factura ${doc.codigo} pagada`,
            fecha: new Date(doc.fechaPago || doc.fechaModificacion || doc.fecha),
            documentoId: doc._id,
            documentoCodigo: doc.codigo,
          })
        }
      })

      items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

      setActividad(items)
    } catch (error) {
      console.error('Error cargando actividad:', error)
      toast.error('Error al cargar la actividad')
    } finally {
      setLoading(false)
    }
  }

  const actividadFiltrada = filtroTipo
    ? actividad.filter(item => item.tipo === filtroTipo)
    : actividad

  const navegarADocumento = (item: ActividadItem) => {
    if (!item.documentoId) return

    const rutas: Record<string, string> = {
      pedido: '/compras/pedidos',
      albaran: '/compras/albaranes',
      factura: '/compras/facturas',
    }

    const ruta = rutas[item.tipo]
    if (ruta) {
      router.push(`${ruta}/${item.documentoId}`)
    }
  }

  const formatearFechaRelativa = (fecha: Date) => {
    const ahora = new Date()
    const diff = ahora.getTime() - fecha.getTime()
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(diff / 3600000)
    const dias = Math.floor(diff / 86400000)

    if (minutos < 60) return `Hace ${minutos} minutos`
    if (horas < 24) return `Hace ${horas} horas`
    if (dias === 1) return 'Ayer'
    if (dias < 7) return `Hace ${dias} días`
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historial de Actividad
            </CardTitle>
            <CardDescription>
              Últimas interacciones y movimientos con {proveedorNombre}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={cargarActividad}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge
            variant={filtroTipo === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFiltroTipo(null)}
          >
            Todos ({actividad.length})
          </Badge>
          {['pedido', 'albaran', 'factura'].map(tipo => {
            const count = actividad.filter(a => a.tipo === tipo).length
            if (count === 0) return null
            return (
              <Badge
                key={tipo}
                variant={filtroTipo === tipo ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => setFiltroTipo(tipo)}
              >
                {tipo}s ({count})
              </Badge>
            )
          })}
        </div>
      </CardHeader>
      <CardContent>
        {actividadFiltrada.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold mb-2">Sin actividad registrada</h3>
            <p className="text-sm text-muted-foreground">
              Aún no hay documentos ni interacciones con este proveedor
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {actividadFiltrada.map((item) => {
                  const Icono = ICONOS_TIPO[item.tipo] || Clock
                  const colorClase = COLORES_TIPO[item.tipo] || COLORES_TIPO.nota

                  return (
                    <div key={item.id} className="relative flex gap-4">
                      <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${colorClase}`}>
                        <Icono className="h-5 w-5" />
                      </div>

                      <div
                        className={`flex-1 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${item.documentoId ? 'cursor-pointer' : ''}`}
                        onClick={() => navegarADocumento(item)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{item.descripcion}</p>
                            {item.importe !== undefined && (
                              <p className="text-sm font-medium text-primary">
                                {item.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatearFechaRelativa(item.fecha)}
                            </p>
                            {item.estado && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {item.estado}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.usuario && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.usuario}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
