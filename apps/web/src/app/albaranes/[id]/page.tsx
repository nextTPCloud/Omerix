'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { albaranesService } from '@/services/albaranes.service'
import {
  IAlbaran,
  EstadoAlbaran,
  ESTADOS_ALBARAN,
  getEstadoConfig,
  getTipoAlbaranLabel,
  getTipoLineaLabel,
} from '@/types/albaran.types'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MoreVertical,
  Calendar,
  User,
  MapPin,
  Truck,
  Package,
  FileText,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Phone,
  Mail,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AlbaranDetallePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [albaran, setAlbaran] = useState<IAlbaran | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const loadAlbaran = async () => {
    try {
      setLoading(true)
      const response = await albaranesService.getById(id)
      if (response.success && response.data) {
        setAlbaran(response.data)
      }
    } catch (error) {
      console.error('Error al cargar albarán:', error)
      toast.error('Error al cargar el albarán')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlbaran()
  }, [id])

  const handleDelete = async () => {
    if (!albaran) return

    try {
      const response = await albaranesService.delete(albaran._id)
      if (response.success) {
        toast.success('Albarán eliminado correctamente')
        router.push('/albaranes')
      }
    } catch (error) {
      toast.error('Error al eliminar el albarán')
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleDuplicar = async () => {
    if (!albaran) return

    try {
      const response = await albaranesService.duplicar(albaran._id)
      if (response.success && response.data) {
        toast.success('Albarán duplicado correctamente')
        router.push(`/albaranes/${response.data._id}`)
      }
    } catch (error) {
      toast.error('Error al duplicar el albarán')
    }
  }

  const handleCambiarEstado = async (nuevoEstado: EstadoAlbaran) => {
    if (!albaran) return

    try {
      const response = await albaranesService.cambiarEstado(albaran._id, { estado: nuevoEstado })
      if (response.success) {
        toast.success('Estado actualizado correctamente')
        loadAlbaran()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Cargando albarán...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!albaran) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-muted-foreground">Albarán no encontrado</div>
          <Link href="/albaranes">
            <Button>Volver a albaranes</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const estadoConfig = getEstadoConfig(albaran.estado)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-4">
            <Link href="/albaranes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{albaran.codigo}</h1>
                <Badge className={estadoConfig.color}>{estadoConfig.label}</Badge>
                {albaran.facturado && (
                  <Badge variant="outline" className="bg-purple-50">
                    <FileText className="h-3 w-3 mr-1" />
                    Facturado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(albaran.fecha)}
                </span>
                <span>Tipo: {getTipoAlbaranLabel(albaran.tipo)}</span>
                {albaran.pedidoOrigenId && (
                  <span>
                    Pedido: {typeof albaran.pedidoOrigenId === 'object' ? albaran.pedidoOrigenId.codigo : '-'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Truck className="h-4 w-4 mr-2" />
                  Cambiar estado
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ESTADOS_ALBARAN.map((estado) => (
                  <DropdownMenuItem
                    key={estado.value}
                    onClick={() => handleCambiarEstado(estado.value)}
                    disabled={estado.value === albaran.estado}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${estado.dotColor}`} />
                    {estado.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href={`/albaranes/${albaran._id}/editar`}>
              <Button variant="outline" disabled={albaran.facturado}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicar}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={albaran.facturado}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos del cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Datos del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{albaran.clienteNombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NIF/CIF</p>
                  <p className="font-medium">{albaran.clienteNif}</p>
                </div>
                {albaran.clienteEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {albaran.clienteEmail}
                    </p>
                  </div>
                )}
                {albaran.clienteTelefono && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {albaran.clienteTelefono}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dirección de entrega */}
            {albaran.direccionEntrega && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Dirección de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {albaran.direccionEntrega.nombre && (
                      <p className="font-medium">{albaran.direccionEntrega.nombre}</p>
                    )}
                    <p>
                      {albaran.direccionEntrega.calle} {albaran.direccionEntrega.numero}
                      {albaran.direccionEntrega.piso && `, ${albaran.direccionEntrega.piso}`}
                    </p>
                    <p>
                      {albaran.direccionEntrega.codigoPostal} {albaran.direccionEntrega.ciudad}
                    </p>
                    <p>{albaran.direccionEntrega.provincia}, {albaran.direccionEntrega.pais}</p>
                    {albaran.direccionEntrega.personaContacto && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Contacto: {albaran.direccionEntrega.personaContacto}
                        {albaran.direccionEntrega.telefonoContacto && ` - ${albaran.direccionEntrega.telefonoContacto}`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Líneas del albarán */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Líneas ({albaran.lineas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Producto</th>
                        <th className="text-center p-4 font-medium">Solicitado</th>
                        <th className="text-center p-4 font-medium">Entregado</th>
                        <th className="text-right p-4 font-medium">Precio</th>
                        <th className="text-right p-4 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {albaran.lineas.map((linea, index) => (
                        <tr key={linea._id || index} className="border-b">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{linea.nombre}</p>
                              {linea.descripcion && (
                                <p className="text-sm text-muted-foreground">{linea.descripcion}</p>
                              )}
                              <Badge variant="outline" className="mt-1">
                                {getTipoLineaLabel(linea.tipo)}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {linea.cantidadSolicitada} {linea.unidad}
                          </td>
                          <td className="p-4 text-center">
                            <span className={linea.cantidadEntregada < linea.cantidadSolicitada ? 'text-orange-600' : 'text-green-600'}>
                              {linea.cantidadEntregada} {linea.unidad}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {formatCurrency(linea.precioUnitario)}
                          </td>
                          <td className="p-4 text-right font-medium">
                            {formatCurrency(linea.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Totales */}
            <Card>
              <CardHeader>
                <CardTitle>Totales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(albaran.totales?.subtotalNeto || 0)}</span>
                </div>
                {albaran.totales?.desgloseIva?.map((iva, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA {iva.tipo}%</span>
                    <span>{formatCurrency(iva.cuota)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(albaran.totales?.totalAlbaran || 0)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Progreso de entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Progreso de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Porcentaje entregado</span>
                    <span className="font-medium">{albaran.porcentajeEntregado || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary rounded-full h-3 transition-all"
                      style={{ width: `${albaran.porcentajeEntregado || 0}%` }}
                    />
                  </div>
                  {albaran.datosEntrega?.fechaEntrega && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Entregado el {formatDate(albaran.datosEntrega.fechaEntrega)}
                    </div>
                  )}
                  {albaran.datosEntrega?.receptorNombre && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Receptor: </span>
                      {albaran.datosEntrega.receptorNombre}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Datos de transporte */}
            {albaran.datosTransporte && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Transporte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {albaran.datosTransporte.nombreTransportista && (
                    <div>
                      <span className="text-muted-foreground">Transportista: </span>
                      {albaran.datosTransporte.nombreTransportista}
                    </div>
                  )}
                  {albaran.datosTransporte.numeroSeguimiento && (
                    <div>
                      <span className="text-muted-foreground">Nº Seguimiento: </span>
                      {albaran.datosTransporte.numeroSeguimiento}
                    </div>
                  )}
                  {albaran.datosTransporte.matricula && (
                    <div>
                      <span className="text-muted-foreground">Matrícula: </span>
                      {albaran.datosTransporte.matricula}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Observaciones */}
            {albaran.observaciones && (
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {albaran.observaciones}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar albarán</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar el albarán {albaran.codigo}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
