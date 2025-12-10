'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  History,
  Mail,
  Calendar,
  FileText,
  Check,
  X,
  Edit,
  Clock,
  ArrowRight,
  User,
  RefreshCw,
  Copy,
  Download,
  Printer,
  CreditCard,
  Euro,
  Ban,
  Send,
  QrCode,
} from 'lucide-react'
import { IHistorialFactura, ICobro, getMetodoPagoLabel } from '@/types/factura.types'
import { cn } from '@/lib/utils'

interface FacturaHistorialProps {
  historial: IHistorialFactura[]
  cobros: ICobro[]
  contadorEnvios?: number
  fechaEnvio?: string | Date
  fechaCreacion: string | Date
  importeCobrado: number
  importePendiente: number
  totalFactura: number
}

// Iconos según el tipo de acción
const getAccionIcon = (accion: string) => {
  const accionLower = accion.toLowerCase()
  if (accionLower.includes('creación') || accionLower.includes('creado') || accionLower.includes('creada')) return <FileText className="h-4 w-4" />
  if (accionLower.includes('envío') || accionLower.includes('email') || accionLower.includes('enviada')) return <Mail className="h-4 w-4" />
  if (accionLower.includes('reenvío')) return <RefreshCw className="h-4 w-4" />
  if (accionLower.includes('modificación') || accionLower.includes('actualizado') || accionLower.includes('actualizada')) return <Edit className="h-4 w-4" />
  if (accionLower.includes('emitida') || accionLower.includes('emitir')) return <Send className="h-4 w-4" />
  if (accionLower.includes('cobro') || accionLower.includes('pago')) return <CreditCard className="h-4 w-4" />
  if (accionLower.includes('anulada') || accionLower.includes('anular')) return <Ban className="h-4 w-4" />
  if (accionLower.includes('duplica')) return <Copy className="h-4 w-4" />
  if (accionLower.includes('estado')) return <ArrowRight className="h-4 w-4" />
  if (accionLower.includes('imprimir') || accionLower.includes('impreso')) return <Printer className="h-4 w-4" />
  if (accionLower.includes('descargar') || accionLower.includes('pdf')) return <Download className="h-4 w-4" />
  if (accionLower.includes('qr') || accionLower.includes('verifactu')) return <QrCode className="h-4 w-4" />
  return <History className="h-4 w-4" />
}

// Color según el tipo de acción
const getAccionColor = (accion: string) => {
  const accionLower = accion.toLowerCase()
  if (accionLower.includes('creación') || accionLower.includes('creado') || accionLower.includes('creada')) return 'bg-green-500'
  if (accionLower.includes('envío') || accionLower.includes('email') || accionLower.includes('enviada')) return 'bg-blue-500'
  if (accionLower.includes('emitida') || accionLower.includes('emitir')) return 'bg-emerald-500'
  if (accionLower.includes('cobro') || accionLower.includes('pago')) return 'bg-purple-500'
  if (accionLower.includes('anulada') || accionLower.includes('anular')) return 'bg-red-500'
  if (accionLower.includes('modificación') || accionLower.includes('actualizado')) return 'bg-amber-500'
  return 'bg-gray-500'
}

export function FacturaHistorial({
  historial,
  cobros,
  contadorEnvios = 0,
  fechaEnvio,
  fechaCreacion,
  importeCobrado,
  importePendiente,
  totalFactura,
}: FacturaHistorialProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0)
  }

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays} días`
    return formatDate(date)
  }

  // Calcular porcentaje cobrado
  const porcentajeCobrado = totalFactura > 0 ? Math.round((importeCobrado / totalFactura) * 100) : 0

  // Ordenar historial por fecha descendente
  const historialOrdenado = [...historial].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  // Ordenar cobros por fecha descendente
  const cobrosOrdenados = [...cobros].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial y Cobros
            </CardTitle>
            <CardDescription>
              Registro de actividad y pagos de la factura
            </CardDescription>
          </div>
          {/* Estadísticas rápidas */}
          <div className="flex gap-4 text-sm">
            {contadorEnvios > 0 && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{contadorEnvios}</span>
                <span className="text-muted-foreground">envíos</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Euro className="h-4 w-4 text-green-500" />
              <span className="font-medium">{porcentajeCobrado}%</span>
              <span className="text-muted-foreground">cobrado</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="historial" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="historial" className="gap-2">
              <History className="h-4 w-4" />
              Historial ({historial.length})
            </TabsTrigger>
            <TabsTrigger value="cobros" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Cobros ({cobros.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Historial */}
          <TabsContent value="historial" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {historialOrdenado.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mb-2 opacity-20" />
                  <p>No hay historial registrado</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Línea de tiempo */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {historialOrdenado.map((item, index) => {
                      const usuario = item.usuarioId && typeof item.usuarioId === 'object'
                        ? (item.usuarioId as any).nombre
                        : 'Usuario'

                      return (
                        <div key={item._id || index} className="relative flex gap-4 pl-2">
                          {/* Punto en la línea de tiempo */}
                          <div className={cn(
                            "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white",
                            getAccionColor(item.accion)
                          )}>
                            {getAccionIcon(item.accion)}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{item.accion}</p>
                                {item.descripcion && (
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {item.descripcion}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                <p>{formatTimeAgo(item.fecha)}</p>
                                <p>{formatDateTime(item.fecha)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{usuario}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab Cobros */}
          <TabsContent value="cobros" className="mt-4">
            {/* Resumen de cobros */}
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Factura</p>
                  <p className="text-lg font-bold">{formatCurrency(totalFactura)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cobrado</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(importeCobrado)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendiente</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(importePendiente)}</p>
                </div>
              </div>
              {/* Barra de progreso */}
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${porcentajeCobrado}%` }}
                />
              </div>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {cobrosOrdenados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mb-2 opacity-20" />
                  <p>No hay cobros registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cobrosOrdenados.map((cobro, index) => {
                    const usuario = cobro.registradoPor && typeof cobro.registradoPor === 'object'
                      ? (cobro.registradoPor as any).nombre
                      : 'Usuario'

                    return (
                      <Card key={cobro._id || index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                              <Euro className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-green-600">
                                  {formatCurrency(cobro.importe)}
                                </span>
                                <Badge variant="secondary">
                                  {getMetodoPagoLabel(cobro.metodoPago)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatDate(cobro.fecha)}
                              </p>
                              {cobro.referencia && (
                                <p className="text-sm text-muted-foreground">
                                  Ref: {cobro.referencia}
                                </p>
                              )}
                              {cobro.observaciones && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {cobro.observaciones}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Registrado por {usuario}</span>
                          {cobro.fechaRegistro && (
                            <span> · {formatDateTime(cobro.fechaRegistro)}</span>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default FacturaHistorial
