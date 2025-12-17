'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { presupuestosCompraService } from '@/services/presupuestos-compra.service'
import {
  PresupuestoCompra,
  ESTADOS_PRESUPUESTO_COMPRA,
  PRIORIDADES,
  EstadoPresupuestoCompra,
} from '@/types/presupuesto-compra.types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MoreVertical,
  Calendar,
  FileText,
  Building2,
  Copy,
  Send,
  Check,
  X,
  Clock,
  ShoppingCart,
  ChevronDown,
  Phone,
  AtSign,
  Hash,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PresupuestoCompraDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [presupuesto, setPresupuesto] = useState<PresupuestoCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showConvertirDialog, setShowConvertirDialog] = useState(false)
  const [isConvirtiendo, setIsConvirtiendo] = useState(false)

  useEffect(() => {
    loadPresupuesto()
  }, [resolvedParams.id])

  const loadPresupuesto = async () => {
    try {
      setIsLoading(true)
      const response = await presupuestosCompraService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setPresupuesto(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar presupuesto')
      router.push('/compras/presupuestos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!presupuesto) return

    try {
      await presupuestosCompraService.delete(presupuesto._id)
      toast.success('Presupuesto de compra eliminado correctamente')
      router.push('/compras/presupuestos')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar presupuesto')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleDuplicar = async () => {
    if (!presupuesto) return

    try {
      const response = await presupuestosCompraService.duplicar(presupuesto._id)
      if (response.success && response.data) {
        toast.success('Presupuesto de compra duplicado correctamente')
        router.push(`/compras/presupuestos/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al duplicar presupuesto')
    }
  }

  const handleCambiarEstado = async (estado: EstadoPresupuestoCompra) => {
    if (!presupuesto) return

    try {
      const response = await presupuestosCompraService.cambiarEstado(presupuesto._id, estado)
      if (response.success && response.data) {
        setPresupuesto(response.data)
        const estadoConfig = getEstadoConfig(estado)
        toast.success(`Estado cambiado a ${estadoConfig.label}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const handleConvertirAPedido = async () => {
    if (!presupuesto) return

    setIsConvirtiendo(true)
    try {
      const response = await presupuestosCompraService.convertirAPedido(presupuesto._id)
      if (response.success && response.data) {
        toast.success(`Pedido ${response.data.pedido.codigo} creado correctamente`)
        router.push(`/compras/pedidos/${response.data.pedido._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al convertir a pedido')
    } finally {
      setIsConvirtiendo(false)
      setShowConvertirDialog(false)
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

  const getEstadoConfig = (estado: EstadoPresupuestoCompra) => {
    return ESTADOS_PRESUPUESTO_COMPRA.find(e => e.value === estado) || ESTADOS_PRESUPUESTO_COMPRA[0]
  }

  const getPrioridadConfig = (prioridad: string) => {
    return PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[1]
  }

  const getDiasValidez = () => {
    if (!presupuesto?.fechaValidez) return null
    const fechaValidez = new Date(presupuesto.fechaValidez)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    fechaValidez.setHours(0, 0, 0, 0)
    return Math.ceil((fechaValidez.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando presupuesto...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!presupuesto) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Presupuesto de compra no encontrado</p>
          <Link href="/compras/presupuestos">
            <Button variant="link" className="mt-2">
              Volver al listado
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const estadoConfig = getEstadoConfig(presupuesto.estado)
  const prioridadConfig = getPrioridadConfig(presupuesto.prioridad)
  const diasValidez = getDiasValidez()

  const proveedorNombre = typeof presupuesto.proveedorId === 'object'
    ? (presupuesto.proveedorId as any).nombreComercial || (presupuesto.proveedorId as any).nombre
    : presupuesto.proveedorNombre

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link href="/compras/presupuestos">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {presupuesto.codigo}
                    </h1>
                    <Badge className={`text-white ${estadoConfig.color}`}>
                      {estadoConfig.label}
                    </Badge>
                    <Badge variant="outline" className={`text-white ${prioridadConfig.color}`}>
                      {prioridadConfig.label}
                    </Badge>
                    {diasValidez !== null && presupuesto.estado !== 'convertido' && presupuesto.estado !== 'cancelado' && (
                      <Badge variant={diasValidez < 0 ? 'destructive' : diasValidez <= 7 ? 'secondary' : 'outline'}>
                        <Clock className="h-3 w-3 mr-1" />
                        {diasValidez < 0
                          ? 'Expirado'
                          : diasValidez === 0
                          ? 'Expira hoy'
                          : `${diasValidez} dias`}
                      </Badge>
                    )}
                  </div>
                  {presupuesto.titulo && (
                    <p className="text-lg text-muted-foreground mt-1">{presupuesto.titulo}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(presupuesto.fecha)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {proveedorNombre}
                    </span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/compras/presupuestos/${presupuesto._id}/editar`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  {/* Boton de convertir a pedido - solo si aceptado */}
                  {presupuesto.estado === 'aceptado' && (
                    <Button
                      size="sm"
                      onClick={() => setShowConvertirDialog(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Crear Pedido
                    </Button>
                  )}

                  {/* Cambiar estado - Dropdown con todos los estados */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <span className={`w-2 h-2 rounded-full mr-2 ${estadoConfig.color}`} />
                        Cambiar estado
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Cambiar estado a:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {ESTADOS_PRESUPUESTO_COMPRA.map((estado) => {
                        const config = getEstadoConfig(estado.value)
                        const isCurrentState = presupuesto.estado === estado.value
                        return (
                          <DropdownMenuItem
                            key={estado.value}
                            onClick={() => !isCurrentState && handleCambiarEstado(estado.value)}
                            disabled={isCurrentState}
                            className={isCurrentState ? 'opacity-50' : ''}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${config.color}`} />
                            {estado.label}
                            {isCurrentState && <Check className="ml-auto h-4 w-4" />}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Mas acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Mas acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {presupuesto.estado === 'aceptado' && (
                        <>
                          <DropdownMenuItem onClick={() => setShowConvertirDialog(true)}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Convertir a Pedido
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={handleDuplicar}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen en cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}</div>
              <p className="text-sm text-muted-foreground">Total Presupuesto</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(presupuesto.totales?.subtotalNeto || 0)}</div>
              <p className="text-sm text-muted-foreground">Base Imponible</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(presupuesto.totales?.totalIva || 0)}</div>
              <p className="text-sm text-muted-foreground">Total IVA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{presupuesto.lineas?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Lineas</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna principal - Lineas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lineas del presupuesto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Lineas del Presupuesto
                </CardTitle>
                <CardDescription>
                  {presupuesto.lineas?.length || 0} lineas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-3 text-left">Descripcion</th>
                        <th className="px-3 py-3 text-right w-16">Cant.</th>
                        <th className="px-3 py-3 text-right w-24">Precio</th>
                        <th className="px-3 py-3 text-right w-16">Dto</th>
                        <th className="px-3 py-3 text-right w-28">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(presupuesto.lineas || []).map((linea, index) => (
                        <tr key={linea._id || index} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-medium">{linea.nombre}</div>
                              {linea.descripcion && (
                                <div className="text-xs text-muted-foreground">{linea.descripcion}</div>
                              )}
                              {linea.codigoProveedor && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Ref: {linea.codigoProveedor}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">{linea.cantidad} {linea.unidad}</td>
                          <td className="px-3 py-3 text-right">{formatCurrency(linea.precioUnitario)}</td>
                          <td className="px-3 py-3 text-right">
                            {linea.descuento > 0 ? `${linea.descuento}%` : '-'}
                          </td>
                          <td className="px-3 py-3 text-right font-medium">{formatCurrency(linea.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right font-medium">
                          Base Imponible:
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(presupuesto.totales?.subtotalNeto || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right font-medium">
                          IVA:
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(presupuesto.totales?.totalIva || 0)}
                        </td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan={4} className="px-3 py-3 text-right font-bold">
                          TOTAL:
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-primary">
                          {formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones */}
            {presupuesto.observaciones && (
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{presupuesto.observaciones}</p>
                </CardContent>
              </Card>
            )}

            {/* Condiciones del proveedor */}
            {presupuesto.condicionesProveedor && (
              <Card>
                <CardHeader>
                  <CardTitle>Condiciones del Proveedor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{presupuesto.condicionesProveedor}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna lateral - Info */}
          <div className="space-y-6">
            {/* Estado del Presupuesto */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-3 h-3 rounded-full ${estadoConfig.color}`} />
                  <div className="flex-1">
                    <p className="font-medium">{estadoConfig.label}</p>
                    {diasValidez !== null && presupuesto.estado !== 'convertido' && presupuesto.estado !== 'cancelado' && (
                      <p className={`text-xs ${diasValidez < 0 ? 'text-destructive' : diasValidez <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {diasValidez < 0
                          ? `Expirado hace ${Math.abs(diasValidez)} dias`
                          : diasValidez === 0
                          ? 'Expira hoy'
                          : `Valido ${diasValidez} dias mas`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones rapidas segun estado */}
                <div className="mt-4 space-y-2">
                  {presupuesto.estado === 'borrador' && (
                    <Button size="sm" className="w-full" onClick={() => handleCambiarEstado('enviado')}>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Solicitud
                    </Button>
                  )}
                  {presupuesto.estado === 'enviado' && (
                    <Button size="sm" className="w-full" onClick={() => handleCambiarEstado('recibido')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Marcar como Recibido
                    </Button>
                  )}
                  {presupuesto.estado === 'recibido' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="bg-green-50" onClick={() => handleCambiarEstado('aceptado')}>
                        <CheckCircle2 className="mr-1 h-4 w-4 text-green-600" />
                        Aceptar
                      </Button>
                      <Button size="sm" variant="outline" className="bg-red-50" onClick={() => handleCambiarEstado('rechazado')}>
                        <XCircle className="mr-1 h-4 w-4 text-red-600" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                  {presupuesto.estado === 'aceptado' && (
                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setShowConvertirDialog(true)}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Convertir a Pedido
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pedido generado */}
            {presupuesto.pedidoCompraId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Pedido Generado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/compras/pedidos/${presupuesto.pedidoCompraId}`}>
                    <Button variant="outline" className="w-full">
                      Ver Pedido de Compra
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Proveedor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Proveedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{proveedorNombre}</p>
                    <p className="text-sm text-muted-foreground">{presupuesto.proveedorNif}</p>
                  </div>
                </div>
                {presupuesto.proveedorEmail && (
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${presupuesto.proveedorEmail}`} className="text-sm hover:underline text-primary">
                      {presupuesto.proveedorEmail}
                    </a>
                  </div>
                )}
                {presupuesto.proveedorTelefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${presupuesto.proveedorTelefono}`} className="text-sm hover:underline">
                      {presupuesto.proveedorTelefono}
                    </a>
                  </div>
                )}
                {presupuesto.referenciaProveedor && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ref. Proveedor</p>
                      <p className="text-sm">{presupuesto.referenciaProveedor}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fechas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">{formatDate(presupuesto.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Validez</p>
                    <p className="font-medium">{formatDate(presupuesto.fechaValidez)}</p>
                  </div>
                  {presupuesto.fechaSolicitud && (
                    <div>
                      <p className="text-xs text-muted-foreground">Solicitud</p>
                      <p>{formatDate(presupuesto.fechaSolicitud)}</p>
                    </div>
                  )}
                  {presupuesto.fechaRecepcion && (
                    <div>
                      <p className="text-xs text-muted-foreground">Recepcion</p>
                      <p>{formatDate(presupuesto.fechaRecepcion)}</p>
                    </div>
                  )}
                  {presupuesto.fechaAceptacion && (
                    <div>
                      <p className="text-xs text-muted-foreground">Aceptacion</p>
                      <p className="text-green-600">{formatDate(presupuesto.fechaAceptacion)}</p>
                    </div>
                  )}
                  {presupuesto.fechaRechazo && (
                    <div>
                      <p className="text-xs text-muted-foreground">Rechazo</p>
                      <p className="text-red-600">{formatDate(presupuesto.fechaRechazo)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Etiquetas */}
            {presupuesto.tags && presupuesto.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Etiquetas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {presupuesto.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informacion del sistema */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado</span>
                  <span>{new Date(presupuesto.fechaCreacion).toLocaleString('es-ES')}</span>
                </div>
                {presupuesto.fechaModificacion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modificado</span>
                    <span>{new Date(presupuesto.fechaModificacion).toLocaleString('es-ES')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Serie</span>
                  <span className="font-mono">{presupuesto.serie || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numero</span>
                  <span className="font-mono">{presupuesto.numero || '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogo de convertir a Pedido */}
      <Dialog open={showConvertirDialog} onOpenChange={setShowConvertirDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Convertir a Pedido de Compra
            </DialogTitle>
            <DialogDescription>
              Se creara un nuevo pedido de compra a partir de este presupuesto. El presupuesto quedara marcado como &quot;Convertido&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Presupuesto:</span>
                <span className="font-medium">{presupuesto.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proveedor:</span>
                <span className="font-medium">{proveedorNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Importe:</span>
                <span className="font-medium">{formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}</span>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Se copiaran:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Todas las lineas con sus precios</li>
                <li>Datos del proveedor</li>
                <li>Observaciones</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConvertirDialog(false)} disabled={isConvirtiendo}>
              Cancelar
            </Button>
            <Button onClick={handleConvertirAPedido} disabled={isConvirtiendo}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isConvirtiendo ? 'Convirtiendo...' : 'Crear Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de confirmacion para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar presupuesto de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Estas a punto de eliminar el presupuesto de compra <span className="font-semibold">{presupuesto.codigo}</span>.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
