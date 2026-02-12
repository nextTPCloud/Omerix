'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { pedidosCompraService } from '@/services/pedidos-compra.service'
import {
  PedidoCompra,
  ESTADOS_PEDIDO_COMPRA,
  PRIORIDADES,
  EstadoPedidoCompra,
} from '@/types/pedido-compra.types'
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
  Clock,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Phone,
  AtSign,
  Hash,
  Truck,
  Package,
  RefreshCw,
  PackageCheck,
  Layers,
  Mail,
  Download,
  Printer,
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

export default function PedidoCompraDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [pedido, setPedido] = useState<PedidoCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [expandedKits, setExpandedKits] = useState<Set<number>>(new Set())
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const toggleKitExpanded = (index: number) => {
    setExpandedKits(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  useEffect(() => {
    loadPedido()
  }, [resolvedParams.id])

  const loadPedido = async () => {
    try {
      setIsLoading(true)
      const response = await pedidosCompraService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setPedido(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar pedido')
      router.push('/compras/pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!pedido) return

    try {
      await pedidosCompraService.delete(pedido._id)
      toast.success('Pedido de compra eliminado correctamente')
      router.push('/compras/pedidos')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar pedido')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleDuplicar = async () => {
    if (!pedido) return

    try {
      const response = await pedidosCompraService.duplicar(pedido._id)
      if (response.success && response.data) {
        toast.success('Pedido de compra duplicado correctamente')
        router.push(`/compras/pedidos/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al duplicar pedido')
    }
  }

  const handleCambiarEstado = async (estado: EstadoPedidoCompra) => {
    if (!pedido) return

    try {
      const response = await pedidosCompraService.cambiarEstado(pedido._id, estado)
      if (response.success && response.data) {
        setPedido(response.data)
        const estadoConfig = getEstadoConfig(estado)
        toast.success(`Estado cambiado a ${estadoConfig.label}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const handleEnviarEmail = async () => {
    if (!pedido) return

    const email = pedido.proveedorEmail
    if (!email) {
      toast.error('El proveedor no tiene email configurado')
      return
    }

    setIsSendingEmail(true)
    try {
      toast.loading('Enviando pedido por email...', { id: 'sending-email' })

      const response = await pedidosCompraService.enviarPorEmail(pedido._id)

      toast.dismiss('sending-email')

      if (response.success) {
        toast.success('Pedido enviado correctamente al proveedor')
        loadPedido()
      } else {
        toast.error(response.message || 'Error al enviar email')
      }
    } catch (error: any) {
      toast.dismiss('sending-email')

      if (error.response?.status === 400 && error.response?.data?.message?.includes('configuración')) {
        toast.error('No hay configuración de email. Configúrala en Ajustes > Email')
      } else {
        toast.error(error.response?.data?.message || 'Error al enviar email')
      }
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handlePrint = () => {
    if (!pedido) return
    window.open(`/compras/pedidos/${pedido._id}/imprimir`, '_blank', 'width=900,height=700,menubar=yes,toolbar=yes,scrollbars=yes,resizable=yes')
  }

  const handleExportPDF = async () => {
    if (!pedido) return

    setIsExportingPDF(true)
    try {
      toast.loading('Generando PDF...', { id: 'export-pdf' })

      const blob = await pedidosCompraService.generarPDF(pedido._id)

      toast.dismiss('export-pdf')

      // Descargar el PDF
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Pedido_Compra_${pedido.codigo}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('PDF descargado correctamente')
    } catch (error: any) {
      toast.dismiss('export-pdf')
      toast.error(error.response?.data?.message || 'Error al generar PDF')
    } finally {
      setIsExportingPDF(false)
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

  const getEstadoConfig = (estado: EstadoPedidoCompra) => {
    return ESTADOS_PEDIDO_COMPRA.find(e => e.value === estado) || ESTADOS_PEDIDO_COMPRA[0]
  }

  const getPrioridadConfig = (prioridad: string) => {
    return PRIORIDADES.find(p => p.value === prioridad) || PRIORIDADES[1]
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando pedido...</p>
          </div>
        </div>
      
    )
  }

  if (!pedido) {
    return (
      
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Pedido de compra no encontrado</p>
          <Link href="/compras/pedidos">
            <Button variant="link" className="mt-2">
              Volver al listado
            </Button>
          </Link>
        </div>
      
    )
  }

  const estadoConfig = getEstadoConfig(pedido.estado)
  const prioridadConfig = getPrioridadConfig(pedido.prioridad)

  const proveedorNombre = typeof pedido.proveedorId === 'object'
    ? (pedido.proveedorId as any).nombreComercial || (pedido.proveedorId as any).nombre
    : pedido.proveedorNombre

  // Calcular porcentaje de recepcion
  const porcentajeRecibido = pedido.porcentajeRecibido || 0

  return (
      <>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link href="/compras/pedidos">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {pedido.codigo}
                    </h1>
                    <Badge className={`text-white ${estadoConfig.color}`}>
                      {estadoConfig.label}
                    </Badge>
                    <Badge variant="outline" className={`text-white ${prioridadConfig.color}`}>
                      {prioridadConfig.label}
                    </Badge>
                  </div>
                  {pedido.titulo && (
                    <p className="text-lg text-muted-foreground mt-1">{pedido.titulo}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(pedido.fecha)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {proveedorNombre}
                    </span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Botón de recepción - solo mostrar si hay cantidades pendientes */}
                  {pedido.estado !== 'borrador' &&
                   pedido.estado !== 'cancelado' &&
                   pedido.estado !== 'recibido' &&
                   pedido.estado !== 'facturado' && (
                    <Button
                      size="sm"
                      onClick={() => router.push(`/compras/pedidos/${pedido._id}/recepcion`)}
                    >
                      <PackageCheck className="mr-2 h-4 w-4" />
                      Recibir mercancia
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/compras/pedidos/${pedido._id}/editar`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  {/* Cambiar estado */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <span className={`w-2 h-2 rounded-full mr-2 ${estadoConfig.color}`} />
                        Cambiar estado
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Cambiar estado a:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {ESTADOS_PEDIDO_COMPRA.map((estado) => {
                        const config = getEstadoConfig(estado.value)
                        const isCurrentState = pedido.estado === estado.value
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

                  {/* Enviar por Email */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnviarEmail}
                    disabled={isSendingEmail}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isSendingEmail ? 'Enviando...' : 'Email'}
                  </Button>

                  {/* Imprimir / PDF */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isExportingPDF}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                      </DropdownMenuItem>
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

        {/* Progreso de recepcion */}
        {pedido.estado !== 'borrador' && pedido.estado !== 'cancelado' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progreso de Recepcion</span>
                <span className="text-sm text-muted-foreground">{porcentajeRecibido.toFixed(0)}%</span>
              </div>
              <Progress value={porcentajeRecibido} className="h-2" />
              {pedido.estaCompleto && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Pedido completamente recibido
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumen en cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(pedido.totales?.totalPedido || 0)}</div>
              <p className="text-sm text-muted-foreground">Total Pedido</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(pedido.totales?.subtotalNeto || 0)}</div>
              <p className="text-sm text-muted-foreground">Base Imponible</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(pedido.totales?.totalIva || 0)}</div>
              <p className="text-sm text-muted-foreground">Total IVA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pedido.lineas?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Lineas</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna principal - Lineas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lineas del pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Lineas del Pedido
                </CardTitle>
                <CardDescription>
                  {pedido.lineas?.length || 0} lineas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-3 text-left">Descripcion</th>
                        <th className="px-3 py-3 text-right w-16">Pedido</th>
                        <th className="px-3 py-3 text-right w-16">Recibido</th>
                        <th className="px-3 py-3 text-right w-24">Precio</th>
                        <th className="px-3 py-3 text-right w-16">Dto</th>
                        <th className="px-3 py-3 text-right w-28">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pedido.lineas || []).map((linea: any, index) => (
                        <React.Fragment key={linea._id || index}>
                          <tr className="border-b hover:bg-muted/30">
                            <td className="px-3 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {/* Botón expandir kit */}
                                  {linea.tipo === 'kit' && linea.componentesKit && linea.componentesKit.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleKitExpanded(index)}
                                      className="p-0.5 hover:bg-muted rounded"
                                    >
                                      {expandedKits.has(index) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                  <div className="font-medium">{linea.nombre}</div>
                                </div>
                                {linea.descripcion && (
                                  <div className="text-xs text-muted-foreground">{linea.descripcion}</div>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {linea.codigoProveedor && (
                                    <Badge variant="outline" className="text-xs">
                                      Ref: {linea.codigoProveedor}
                                    </Badge>
                                  )}
                                  {/* Badge de Kit */}
                                  {linea.tipo === 'kit' && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Layers className="h-3 w-3 mr-1" />
                                      Kit
                                    </Badge>
                                  )}
                                  {/* Badges de Variante */}
                                  {linea.variante && linea.variante.combinacion && (
                                    Object.entries(linea.variante.combinacion).map(([key, value]) => (
                                      <Badge key={key} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">
                                        {key}: {String(value)}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">{linea.cantidad}</td>
                            <td className="px-3 py-3 text-right">
                              <span className={linea.cantidadRecibida >= linea.cantidad ? 'text-green-600' : 'text-orange-600'}>
                                {linea.cantidadRecibida}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">{formatCurrency(linea.precioUnitario)}</td>
                            <td className="px-3 py-3 text-right">
                              {linea.descuento > 0 ? `${linea.descuento}%` : '-'}
                            </td>
                            <td className="px-3 py-3 text-right font-medium">{formatCurrency(linea.subtotal)}</td>
                          </tr>
                          {/* Componentes del kit expandidos */}
                          {linea.tipo === 'kit' && expandedKits.has(index) && linea.componentesKit && linea.componentesKit.length > 0 && (
                            <tr className="bg-muted/20">
                              <td colSpan={6} className="px-6 py-3">
                                <div className="text-xs text-muted-foreground mb-2">
                                  Componentes del kit ({linea.componentesKit.length}):
                                </div>
                                <div className="space-y-1">
                                  {linea.componentesKit.map((comp: any, compIdx: number) => (
                                    <div
                                      key={compIdx}
                                      className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                                        comp.seleccionado !== false ? 'bg-background' : 'bg-muted/50 opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-muted-foreground">{comp.sku}</span>
                                        <span>{comp.nombre}</span>
                                        {comp.opcional && (
                                          <Badge variant="outline" className="text-xs">Opcional</Badge>
                                        )}
                                        {comp.seleccionado === false && (
                                          <Badge variant="secondary" className="text-xs">No incluido</Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-xs">
                                        <span className="text-muted-foreground">
                                          {comp.cantidad} x {formatCurrency(comp.costeUnitario || comp.precioUnitario || 0)}
                                        </span>
                                        <span className="font-medium">
                                          {formatCurrency(comp.cantidad * (comp.costeUnitario || comp.precioUnitario || 0))}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-right font-medium">
                          Base Imponible:
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(pedido.totales?.subtotalNeto || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-right font-medium">
                          IVA:
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(pedido.totales?.totalIva || 0)}
                        </td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan={5} className="px-3 py-3 text-right font-bold">
                          TOTAL:
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-primary">
                          {formatCurrency(pedido.totales?.totalPedido || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones */}
            {pedido.observaciones && (
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{pedido.observaciones}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna lateral - Info */}
          <div className="space-y-6">
            {/* Estado del Pedido */}
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
                    {pedido.diasHastaEntrega !== null && pedido.diasHastaEntrega !== undefined && (
                      <p className={`text-xs ${pedido.diasHastaEntrega < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {pedido.diasHastaEntrega < 0
                          ? `Retraso de ${Math.abs(pedido.diasHastaEntrega)} dias`
                          : pedido.diasHastaEntrega === 0
                          ? 'Entrega prevista hoy'
                          : `Entrega en ${pedido.diasHastaEntrega} dias`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <p className="text-sm text-muted-foreground">{pedido.proveedorNif}</p>
                  </div>
                </div>
                {pedido.proveedorEmail && (
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${pedido.proveedorEmail}`} className="text-sm hover:underline text-primary">
                      {pedido.proveedorEmail}
                    </a>
                  </div>
                )}
                {pedido.proveedorTelefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${pedido.proveedorTelefono}`} className="text-sm hover:underline">
                      {pedido.proveedorTelefono}
                    </a>
                  </div>
                )}
                {pedido.referenciaProveedor && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ref. Proveedor</p>
                      <p className="text-sm">{pedido.referenciaProveedor}</p>
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
                    <p className="text-xs text-muted-foreground">Fecha Pedido</p>
                    <p className="font-medium">{formatDate(pedido.fecha)}</p>
                  </div>
                  {pedido.fechaEntregaPrevista && (
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega Prevista</p>
                      <p className="font-medium">{formatDate(pedido.fechaEntregaPrevista)}</p>
                    </div>
                  )}
                  {pedido.fechaEnvio && (
                    <div>
                      <p className="text-xs text-muted-foreground">Enviado</p>
                      <p>{formatDate(pedido.fechaEnvio)}</p>
                    </div>
                  )}
                  {pedido.fechaConfirmacion && (
                    <div>
                      <p className="text-xs text-muted-foreground">Confirmado</p>
                      <p>{formatDate(pedido.fechaConfirmacion)}</p>
                    </div>
                  )}
                  {pedido.fechaRecepcion && (
                    <div>
                      <p className="text-xs text-muted-foreground">Recepcion</p>
                      <p className="text-green-600">{formatDate(pedido.fechaRecepcion)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Etiquetas */}
            {pedido.tags && pedido.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Etiquetas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {pedido.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info sistema */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado</span>
                  <span>{new Date(pedido.fechaCreacion).toLocaleString('es-ES')}</span>
                </div>
                {pedido.fechaModificacion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modificado</span>
                    <span>{new Date(pedido.fechaModificacion).toLocaleString('es-ES')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Serie</span>
                  <span className="font-mono">{pedido.serie || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Numero</span>
                  <span className="font-mono">{pedido.numero || '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogo de confirmacion para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pedido de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Estas a punto de eliminar el pedido de compra <span className="font-semibold">{pedido.codigo}</span>.
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
      </>
  )
}
