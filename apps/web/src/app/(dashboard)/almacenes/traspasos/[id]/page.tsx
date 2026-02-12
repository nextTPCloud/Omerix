'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { traspasosService, Traspaso, EstadoTraspaso, LineaTraspaso } from '@/services/traspasos.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Package,
  Warehouse,
  ArrowRightLeft,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  RefreshCw,
  Edit,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function DetalleTraspasoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [traspaso, setTraspaso] = useState<Traspaso | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Estados para diálogos
  const [showConfirmarSalidaDialog, setShowConfirmarSalidaDialog] = useState(false)
  const [showConfirmarRecepcionDialog, setShowConfirmarRecepcionDialog] = useState(false)
  const [showAnularDialog, setShowAnularDialog] = useState(false)

  // Estados para formularios de confirmación
  const [lineasSalida, setLineasSalida] = useState<{ lineaId: string; cantidadEnviada: number }[]>([])
  const [observacionesSalida, setObservacionesSalida] = useState('')
  const [lineasRecepcion, setLineasRecepcion] = useState<{ lineaId: string; cantidadRecibida: number }[]>([])
  const [observacionesRecepcion, setObservacionesRecepcion] = useState('')
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  useEffect(() => {
    if (id) {
      loadTraspaso()
    }
  }, [id])

  const loadTraspaso = async () => {
    setLoading(true)
    try {
      const res = await traspasosService.obtenerPorId(id)
      setTraspaso(res.data)
      // Inicializar líneas para confirmaciones
      if (res.data.lineas) {
        setLineasSalida(res.data.lineas.map(l => ({
          lineaId: l._id!,
          cantidadEnviada: l.cantidadSolicitada
        })))
        setLineasRecepcion(res.data.lineas.map(l => ({
          lineaId: l._id!,
          cantidadRecibida: l.cantidadEnviada || l.cantidadSolicitada
        })))
      }
    } catch (error) {
      console.error('Error cargando traspaso:', error)
      toast.error('Error al cargar el traspaso')
      router.push('/almacenes/traspasos')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarSalida = async () => {
    setActionLoading(true)
    try {
      await traspasosService.confirmarSalida(id, {
        lineas: lineasSalida,
        observacionesSalida: observacionesSalida || undefined,
      })
      toast.success('Salida confirmada correctamente')
      setShowConfirmarSalidaDialog(false)
      loadTraspaso()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al confirmar la salida')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmarRecepcion = async () => {
    setActionLoading(true)
    try {
      await traspasosService.confirmarRecepcion(id, {
        lineas: lineasRecepcion,
        observacionesRecepcion: observacionesRecepcion || undefined,
      })
      toast.success('Recepción confirmada correctamente')
      setShowConfirmarRecepcionDialog(false)
      loadTraspaso()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al confirmar la recepción')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      toast.error('El motivo de anulación es obligatorio')
      return
    }

    setActionLoading(true)
    try {
      await traspasosService.anular(id, motivoAnulacion)
      toast.success('Traspaso anulado correctamente')
      setShowAnularDialog(false)
      loadTraspaso()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular el traspaso')
    } finally {
      setActionLoading(false)
    }
  }

  const getEstadoIcon = (estado: EstadoTraspaso) => {
    switch (estado) {
      case EstadoTraspaso.BORRADOR:
        return <Edit className="h-4 w-4" />
      case EstadoTraspaso.PENDIENTE_SALIDA:
        return <Clock className="h-4 w-4" />
      case EstadoTraspaso.EN_TRANSITO:
        return <Truck className="h-4 w-4" />
      case EstadoTraspaso.RECIBIDO_PARCIAL:
        return <AlertTriangle className="h-4 w-4" />
      case EstadoTraspaso.RECIBIDO:
        return <CheckCircle2 className="h-4 w-4" />
      case EstadoTraspaso.ANULADO:
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      
    )
  }

  if (!traspaso) return null

  const puedeConfirmarSalida = traspasosService.puedeConfirmarSalida(traspaso.estado)
  const puedeConfirmarRecepcion = traspasosService.puedeConfirmarRecepcion(traspaso.estado)
  const puedeAnular = traspasosService.puedeAnular(traspaso.estado)
  const puedeEditar = traspasosService.puedeEditar(traspaso.estado)

  return (
      <>
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/almacenes/traspasos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{traspaso.codigo}</h1>
                <Badge variant={traspasosService.getEstadoVariant(traspaso.estado)} className="flex items-center gap-1">
                  {getEstadoIcon(traspaso.estado)}
                  {traspasosService.getEstadoLabel(traspaso.estado)}
                </Badge>
                {traspaso.prioridad !== 'normal' && (
                  <Badge variant="outline" className={traspasosService.getPrioridadColor(traspaso.prioridad)}>
                    {traspaso.prioridad.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Creado el {formatDate(traspaso.fechaCreacion)} por {traspaso.usuarioCreadorNombre}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            {puedeConfirmarSalida && (
              <Button onClick={() => setShowConfirmarSalidaDialog(true)}>
                <Truck className="h-4 w-4 mr-2" />
                Confirmar Salida
              </Button>
            )}
            {puedeConfirmarRecepcion && (
              <Button onClick={() => setShowConfirmarRecepcionDialog(true)} variant="default">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Recepción
              </Button>
            )}
            {puedeAnular && (
              <Button variant="destructive" onClick={() => setShowAnularDialog(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Anular
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info de almacenes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Almacenes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="p-4 bg-muted rounded-lg">
                      <Warehouse className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-sm text-muted-foreground">Origen</div>
                      <div className="font-semibold text-lg">{traspaso.almacenOrigenNombre}</div>
                    </div>
                    {traspaso.fechaSalida && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Salida: {formatDate(traspaso.fechaSalida)}
                      </div>
                    )}
                  </div>
                  <div className="px-4">
                    <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center flex-1">
                    <div className="p-4 bg-muted rounded-lg">
                      <Warehouse className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-sm text-muted-foreground">Destino</div>
                      <div className="font-semibold text-lg">{traspaso.almacenDestinoNombre}</div>
                    </div>
                    {traspaso.fechaRecepcion && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Recepción: {formatDate(traspaso.fechaRecepcion)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Líneas del traspaso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos ({traspaso.lineas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Solicitado</TableHead>
                        <TableHead className="text-center">Enviado</TableHead>
                        <TableHead className="text-center">Recibido</TableHead>
                        <TableHead className="text-right">Coste Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {traspaso.lineas.map((linea, index) => (
                        <TableRow key={linea._id || index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{linea.productoNombre}</div>
                              <div className="text-xs text-muted-foreground">{linea.productoCodigo}</div>
                              {linea.ubicacionOrigen && (
                                <div className="text-xs text-muted-foreground">Ubic: {linea.ubicacionOrigen}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {linea.cantidadSolicitada}
                          </TableCell>
                          <TableCell className="text-center">
                            {linea.cantidadEnviada > 0 ? (
                              <Badge variant={linea.cantidadEnviada === linea.cantidadSolicitada ? 'default' : 'secondary'}>
                                {linea.cantidadEnviada}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {linea.cantidadRecibida > 0 ? (
                              <Badge variant={linea.cantidadRecibida === linea.cantidadEnviada ? 'default' : 'destructive'}>
                                {linea.cantidadRecibida}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(linea.costeUnitario)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(linea.cantidadSolicitada * linea.costeUnitario)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                    <span className="text-muted-foreground">Total productos:</span>
                    <span className="font-medium">{traspaso.totalProductos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total unidades:</span>
                    <span className="font-medium">{traspaso.totalUnidades}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Valor total:</span>
                    <span className="font-bold text-lg">{formatCurrency(traspaso.valorTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {traspaso.motivoTraspaso && (
                  <div>
                    <Label className="text-muted-foreground">Motivo</Label>
                    <p className="text-sm mt-1">{traspaso.motivoTraspaso}</p>
                  </div>
                )}
                {traspaso.observaciones && (
                  <div>
                    <Label className="text-muted-foreground">Observaciones</Label>
                    <p className="text-sm mt-1">{traspaso.observaciones}</p>
                  </div>
                )}
                {traspaso.observacionesSalida && (
                  <div>
                    <Label className="text-muted-foreground">Observaciones de salida</Label>
                    <p className="text-sm mt-1">{traspaso.observacionesSalida}</p>
                  </div>
                )}
                {traspaso.observacionesRecepcion && (
                  <div>
                    <Label className="text-muted-foreground">Observaciones de recepción</Label>
                    <p className="text-sm mt-1">{traspaso.observacionesRecepcion}</p>
                  </div>
                )}
                {traspaso.motivoAnulacion && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Label className="text-red-700">Motivo de anulación</Label>
                    <p className="text-sm mt-1 text-red-600">{traspaso.motivoAnulacion}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline de usuarios */}
            <Card>
              <CardHeader>
                <CardTitle>Historial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Creado</div>
                      <div className="text-xs text-muted-foreground">{traspaso.usuarioCreadorNombre}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(traspaso.fechaCreacion)}</div>
                    </div>
                  </div>
                  {traspaso.fechaSalida && traspaso.usuarioSalidaNombre && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-full">
                        <Truck className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Salida confirmada</div>
                        <div className="text-xs text-muted-foreground">{traspaso.usuarioSalidaNombre}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(traspaso.fechaSalida)}</div>
                      </div>
                    </div>
                  )}
                  {traspaso.fechaRecepcion && traspaso.usuarioRecepcionNombre && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Recepción confirmada</div>
                        <div className="text-xs text-muted-foreground">{traspaso.usuarioRecepcionNombre}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(traspaso.fechaRecepcion)}</div>
                      </div>
                    </div>
                  )}
                  {traspaso.fechaAnulacion && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Anulado</div>
                        <div className="text-xs text-muted-foreground">{formatDate(traspaso.fechaAnulacion)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Diálogo Confirmar Salida */}
      <Dialog open={showConfirmarSalidaDialog} onOpenChange={setShowConfirmarSalidaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Salida</DialogTitle>
            <DialogDescription>
              Confirme las cantidades enviadas desde {traspaso.almacenOrigenNombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Solicitado</TableHead>
                    <TableHead className="text-center">Cantidad a enviar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traspaso.lineas.map((linea, index) => (
                    <TableRow key={linea._id || index}>
                      <TableCell>
                        <div className="font-medium">{linea.productoNombre}</div>
                      </TableCell>
                      <TableCell className="text-center">{linea.cantidadSolicitada}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={linea.cantidadSolicitada}
                          value={lineasSalida.find(l => l.lineaId === linea._id)?.cantidadEnviada || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            setLineasSalida(prev => prev.map(l =>
                              l.lineaId === linea._id ? { ...l, cantidadEnviada: value } : l
                            ))
                          }}
                          className="w-24 mx-auto text-center"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2">
              <Label>Observaciones de salida</Label>
              <Textarea
                value={observacionesSalida}
                onChange={(e) => setObservacionesSalida(e.target.value)}
                placeholder="Observaciones opcionales..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmarSalidaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarSalida} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Confirmar Salida
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Confirmar Recepción */}
      <Dialog open={showConfirmarRecepcionDialog} onOpenChange={setShowConfirmarRecepcionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Recepción</DialogTitle>
            <DialogDescription>
              Confirme las cantidades recibidas en {traspaso.almacenDestinoNombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Enviado</TableHead>
                    <TableHead className="text-center">Cantidad recibida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traspaso.lineas.map((linea, index) => (
                    <TableRow key={linea._id || index}>
                      <TableCell>
                        <div className="font-medium">{linea.productoNombre}</div>
                      </TableCell>
                      <TableCell className="text-center">{linea.cantidadEnviada}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={linea.cantidadEnviada}
                          value={lineasRecepcion.find(l => l.lineaId === linea._id)?.cantidadRecibida || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0
                            setLineasRecepcion(prev => prev.map(l =>
                              l.lineaId === linea._id ? { ...l, cantidadRecibida: value } : l
                            ))
                          }}
                          className="w-24 mx-auto text-center"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2">
              <Label>Observaciones de recepción</Label>
              <Textarea
                value={observacionesRecepcion}
                onChange={(e) => setObservacionesRecepcion(e.target.value)}
                placeholder="Observaciones opcionales..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmarRecepcionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarRecepcion} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Recepción
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Anular */}
      <Dialog open={showAnularDialog} onOpenChange={setShowAnularDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular Traspaso</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Los movimientos de stock serán revertidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700">
                Al anular el traspaso se revertirán los movimientos de stock realizados.
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo de anulación *</Label>
              <Textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Indique el motivo de la anulación..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnularDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleAnular} disabled={actionLoading || !motivoAnulacion.trim()}>
              {actionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Anulando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Anular Traspaso
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  )
}
