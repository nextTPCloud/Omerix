'use client'

import React, { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { pedidosService } from '@/services/pedidos.service'
import { albaranesService } from '@/services/albaranes.service'
import { empresaService, EmpresaInfo } from '@/services/empresa.service'
import {
  IPedido,
  getEstadoConfig,
  getPrioridadConfig,
  getTipoLineaLabel,
  ESTADOS_PEDIDO,
  EstadoPedido,
} from '@/types/pedido.types'
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
  Mail,
  Download,
  MoreVertical,
  Calendar,
  FileText,
  User,
  MapPin,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  Package,
  ShoppingCart,
  Printer,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Truck,
  FileCheck,
  Building,
  Phone,
  AtSign,
  Hash,
  Timer,
  Shield,
  Banknote,
  Play,
  Ban,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PackageCheck,
  Layers,
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

export default function PedidoDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [pedido, setPedido] = useState<IPedido | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaInfo | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCrearAlbaranDialog, setShowCrearAlbaranDialog] = useState(false)
  const [isCreandoAlbaran, setIsCreandoAlbaran] = useState(false)
  const [mostrarCostes, setMostrarCostes] = useState(true)
  const [expandedKits, setExpandedKits] = useState<Set<number>>(new Set())

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
    loadEmpresa()
  }, [resolvedParams.id])

  const loadPedido = async () => {
    try {
      setIsLoading(true)
      const response = await pedidosService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setPedido(response.data)
        setMostrarCostes(response.data.mostrarCostes !== false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar pedido')
      router.push('/pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  const loadEmpresa = async () => {
    try {
      const response = await empresaService.getMiEmpresa()
      if (response.success && response.data) {
        setEmpresa(response.data)
      }
    } catch (error) {
      console.error('Error al cargar empresa:', error)
    }
  }

  const handleDelete = async () => {
    if (!pedido) return

    try {
      await pedidosService.delete(pedido._id)
      toast.success('Pedido eliminado correctamente')
      router.push('/pedidos')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar pedido')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleDuplicar = async () => {
    if (!pedido) return

    try {
      const response = await pedidosService.duplicar(pedido._id)
      if (response.success && response.data) {
        toast.success('Pedido duplicado correctamente')
        router.push(`/pedidos/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al duplicar pedido')
    }
  }

  const handleCambiarEstado = async (estado: EstadoPedido) => {
    if (!pedido) return

    try {
      const response = await pedidosService.cambiarEstado(pedido._id, estado)
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

    const email = pedido.clienteEmail
    if (!email) {
      toast.error('El cliente no tiene email configurado')
      return
    }

    try {
      toast.loading('Enviando email...', { id: 'sending-email' })
      const response = await pedidosService.enviarPorEmail(pedido._id)
      toast.dismiss('sending-email')

      if (response.success) {
        toast.success('Email enviado correctamente')
        loadPedido()
      } else {
        toast.error(response.message || 'Error al enviar email')
      }
    } catch (error: any) {
      toast.dismiss('sending-email')
      toast.error(error.response?.data?.message || 'Error al enviar email')
    }
  }

  const handleEnviarWhatsApp = async () => {
    if (!pedido) return

    try {
      const response = await pedidosService.getWhatsAppURL(pedido._id)
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank')
      } else {
        toast.error('El cliente no tiene teléfono configurado')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al generar URL de WhatsApp')
    }
  }

  const handleCrearAlbaran = async () => {
    if (!pedido) return

    setIsCreandoAlbaran(true)
    try {
      const response = await albaranesService.crearDesdePedido(pedido._id, {
        entregarTodo: true,
      })

      if (response.success && response.data) {
        toast.success('Albarán creado correctamente')
        router.push(`/albaranes/${response.data._id}`)
      } else {
        toast.error(response.message || 'Error al crear albarán')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear albarán')
    } finally {
      setIsCreandoAlbaran(false)
      setShowCrearAlbaranDialog(false)
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

  // Calcular días hasta entrega comprometida
  const getDiasEntrega = () => {
    if (!pedido?.fechaEntregaComprometida) return null
    const fechaEntrega = new Date(pedido.fechaEntregaComprometida)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    fechaEntrega.setHours(0, 0, 0, 0)
    return Math.ceil((fechaEntrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando pedido...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!pedido) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Pedido no encontrado</p>
        </div>
      </DashboardLayout>
    )
  }

  const estadoConfig = getEstadoConfig(pedido.estado)
  const prioridadConfig = getPrioridadConfig(pedido.prioridad)
  const diasEntrega = getDiasEntrega()
  const clienteNombre = typeof pedido.clienteId === 'object'
    ? pedido.clienteId.nombre
    : pedido.clienteNombre

  const agenteNombre = typeof pedido.agenteComercialId === 'object'
    ? `${pedido.agenteComercialId.nombre} ${pedido.agenteComercialId.apellidos}`
    : undefined

  const proyectoNombre = typeof pedido.proyectoId === 'object'
    ? pedido.proyectoId.nombre
    : undefined

  const presupuestoOrigen = typeof pedido.presupuestoOrigenId === 'object'
    ? pedido.presupuestoOrigenId
    : null

  // Obtener nombres de forma de pago y término de pago si vienen poblados
  const formaPagoNombre = pedido.condiciones?.formaPagoId
    ? (typeof pedido.condiciones.formaPagoId === 'object'
      ? (pedido.condiciones.formaPagoId as any).nombre
      : null)
    : null

  const terminoPagoNombre = pedido.condiciones?.terminoPagoId
    ? (typeof pedido.condiciones.terminoPagoId === 'object'
      ? (pedido.condiciones.terminoPagoId as any).nombre
      : null)
    : null

  // Determinar si el pedido puede cambiar de estado
  const puedeConfirmar = pedido.estado === EstadoPedido.BORRADOR
  const puedePonerEnProceso = pedido.estado === EstadoPedido.CONFIRMADO
  const puedeServir = [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIALMENTE_SERVIDO].includes(pedido.estado as EstadoPedido)
  const puedeFacturar = pedido.estado === EstadoPedido.SERVIDO
  const puedeCancelar = ![EstadoPedido.CANCELADO, EstadoPedido.FACTURADO].includes(pedido.estado as EstadoPedido)
  const puedeCrearAlbaran = [EstadoPedido.CONFIRMADO, EstadoPedido.EN_PROCESO, EstadoPedido.PARCIALMENTE_SERVIDO].includes(pedido.estado as EstadoPedido)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link href="/pedidos">
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
                    <Badge className={estadoConfig.color}>
                      {estadoConfig.label}
                    </Badge>
                    <Badge variant="outline" className={prioridadConfig.color}>
                      {prioridadConfig.label}
                    </Badge>
                    {diasEntrega !== null && pedido.estado !== EstadoPedido.SERVIDO && pedido.estado !== EstadoPedido.FACTURADO && pedido.estado !== EstadoPedido.CANCELADO && (
                      <Badge variant={diasEntrega < 0 ? 'destructive' : diasEntrega <= 3 ? 'secondary' : 'outline'}>
                        <Clock className="h-3 w-3 mr-1" />
                        {diasEntrega < 0
                          ? `Retrasado ${Math.abs(diasEntrega)}d`
                          : diasEntrega === 0
                          ? 'Entrega hoy'
                          : `${diasEntrega} días`}
                      </Badge>
                    )}
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
                      <User className="h-4 w-4" />
                      {clienteNombre}
                    </span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle costes */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <Switch
                      id="mostrarCostes"
                      checked={mostrarCostes}
                      onCheckedChange={setMostrarCostes}
                    />
                    <Label htmlFor="mostrarCostes" className="text-sm cursor-pointer">
                      {mostrarCostes ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Label>
                  </div>

                  <Separator orientation="vertical" className="h-8" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/pedidos/${pedido._id}/editar`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  {/* Crear Albarán (Entregar pedido) */}
                  {puedeCrearAlbaran && (
                    <Button
                      size="sm"
                      onClick={() => setShowCrearAlbaranDialog(true)}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <PackageCheck className="mr-2 h-4 w-4" />
                      Crear Albarán
                    </Button>
                  )}

                  {/* Cambiar estado - Dropdown con estados disponibles */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <span className={`w-2 h-2 rounded-full mr-2 ${estadoConfig.dotColor || 'bg-gray-400'}`} />
                        Cambiar estado
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Cambiar estado a:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {puedeConfirmar && (
                        <DropdownMenuItem onClick={() => handleCambiarEstado(EstadoPedido.CONFIRMADO)}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-blue-600" />
                          Confirmar
                        </DropdownMenuItem>
                      )}
                      {puedePonerEnProceso && (
                        <DropdownMenuItem onClick={() => handleCambiarEstado(EstadoPedido.EN_PROCESO)}>
                          <Play className="mr-2 h-4 w-4 text-yellow-600" />
                          Poner en Proceso
                        </DropdownMenuItem>
                      )}
                      {puedeServir && (
                        <DropdownMenuItem onClick={() => handleCambiarEstado(EstadoPedido.SERVIDO)}>
                          <Truck className="mr-2 h-4 w-4 text-cyan-600" />
                          Marcar Servido
                        </DropdownMenuItem>
                      )}
                      {puedeFacturar && (
                        <DropdownMenuItem onClick={() => handleCambiarEstado(EstadoPedido.FACTURADO)}>
                          <FileText className="mr-2 h-4 w-4 text-green-600" />
                          Marcar Facturado
                        </DropdownMenuItem>
                      )}
                      {puedeCancelar && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleCambiarEstado(EstadoPedido.CANCELADO)} className="text-red-600">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar Pedido
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Acciones de envío */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleEnviarEmail}>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar por Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleEnviarWhatsApp}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Enviar por WhatsApp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Más acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Más acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDuplicar}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info('Imprimir en desarrollo')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info('Descargar PDF en desarrollo')}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
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
          {mostrarCostes && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(pedido.totales?.costeTotal || 0)}</div>
                  <p className="text-sm text-muted-foreground">Coste Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${(pedido.totales?.margenBruto || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(pedido.totales?.margenBruto || 0)}
                    <span className="text-sm font-normal ml-2">
                      ({(pedido.totales?.margenPorcentaje || 0).toFixed(1)}%)
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Margen Bruto</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Contenido principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna principal - Líneas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Líneas del pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Líneas del Pedido
                </CardTitle>
                <CardDescription>
                  {pedido.lineas?.length || 0} líneas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-3 text-left">Descripción</th>
                        <th className="px-3 py-3 text-right w-16">Cant.</th>
                        <th className="px-3 py-3 text-right w-16">Serv.</th>
                        <th className="px-3 py-3 text-right w-24">Precio</th>
                        {mostrarCostes && (
                          <th className="px-3 py-3 text-right w-24 text-blue-600">Coste</th>
                        )}
                        <th className="px-3 py-3 text-right w-16">Dto</th>
                        <th className="px-3 py-3 text-right w-28">Subtotal</th>
                        {mostrarCostes && (
                          <th className="px-3 py-3 text-right w-24 text-green-600">Margen</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(pedido.lineas || []).map((linea, index) => (
                        <React.Fragment key={linea._id || index}>
                          <tr className="border-b hover:bg-muted/30">
                            <td className="px-3 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {/* Boton expandir kit */}
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
                                  <Badge variant="outline" className="text-xs">
                                    {getTipoLineaLabel(linea.tipo)}
                                  </Badge>
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
                            <td className="px-3 py-3 text-right">{linea.cantidad} {linea.unidad}</td>
                            <td className="px-3 py-3 text-right">
                              <span className={linea.cantidadServida === linea.cantidad ? 'text-green-600' : linea.cantidadServida > 0 ? 'text-yellow-600' : 'text-muted-foreground'}>
                                {linea.cantidadServida || 0}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">{formatCurrency(linea.precioUnitario)}</td>
                            {mostrarCostes && (
                              <td className="px-3 py-3 text-right text-blue-600">{formatCurrency(linea.costeUnitario)}</td>
                            )}
                            <td className="px-3 py-3 text-right">
                              {linea.descuento > 0 ? `${linea.descuento}%` : '-'}
                            </td>
                            <td className="px-3 py-3 text-right font-medium">{formatCurrency(linea.subtotal)}</td>
                            {mostrarCostes && (
                              <td className="px-3 py-3 text-right">
                                <span className={linea.margenTotalLinea >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatCurrency(linea.margenTotalLinea)}
                                </span>
                                <span className="text-xs text-muted-foreground block">
                                  {linea.margenPorcentaje.toFixed(1)}%
                                </span>
                              </td>
                            )}
                          </tr>
                          {/* Componentes del kit expandidos */}
                          {linea.tipo === 'kit' && expandedKits.has(index) && linea.componentesKit && linea.componentesKit.length > 0 && (
                            <tr className="bg-muted/20">
                              <td colSpan={mostrarCostes ? 8 : 6} className="px-6 py-3">
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
                                          {comp.cantidad} x {formatCurrency(comp.precioUnitario || 0)}
                                        </span>
                                        <span className="font-medium">
                                          {formatCurrency(comp.cantidad * (comp.precioUnitario || 0))}
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
                        <td colSpan={mostrarCostes ? 6 : 5} className="px-3 py-2 text-right font-medium">
                          Base Imponible:
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(pedido.totales?.subtotalNeto || 0)}
                        </td>
                        {mostrarCostes && <td></td>}
                      </tr>
                      <tr>
                        <td colSpan={mostrarCostes ? 6 : 5} className="px-3 py-2 text-right font-medium">
                          IVA:
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(pedido.totales?.totalIva || 0)}
                        </td>
                        {mostrarCostes && <td></td>}
                      </tr>
                      <tr className="text-lg">
                        <td colSpan={mostrarCostes ? 6 : 5} className="px-3 py-3 text-right font-bold">
                          TOTAL:
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-primary">
                          {formatCurrency(pedido.totales?.totalPedido || 0)}
                        </td>
                        {mostrarCostes && <td></td>}
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

            {/* Observaciones de almacén */}
            {pedido.observacionesAlmacen && (
              <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <Package className="h-5 w-5" />
                    Observaciones de Almacén
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-yellow-800 dark:text-yellow-300">{pedido.observacionesAlmacen}</p>
                </CardContent>
              </Card>
            )}

            {/* Historial */}
            {pedido.historial && pedido.historial.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial de Cambios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pedido.historial.map((item, index) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{item.accion}</p>
                          {item.descripcion && <p className="text-muted-foreground">{item.descripcion}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.fecha).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <FileCheck className="h-5 w-5" />
                  Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-3 h-3 rounded-full ${estadoConfig.dotColor}`} />
                  <div className="flex-1">
                    <p className="font-medium">{estadoConfig.label}</p>
                    {diasEntrega !== null && pedido.estado !== EstadoPedido.SERVIDO && pedido.estado !== EstadoPedido.FACTURADO && pedido.estado !== EstadoPedido.CANCELADO && (
                      <p className={`text-xs ${diasEntrega < 0 ? 'text-destructive' : diasEntrega <= 3 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {diasEntrega < 0
                          ? `Entrega retrasada ${Math.abs(diasEntrega)} días`
                          : diasEntrega === 0
                          ? 'Entrega programada para hoy'
                          : `Entrega en ${diasEntrega} días`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Prioridad:</span>
                  <Badge variant="outline" className={prioridadConfig.color}>
                    {prioridadConfig.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Presupuesto origen */}
            {presupuestoOrigen && (
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <FileText className="h-5 w-5" />
                    Origen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/presupuestos/${presupuestoOrigen._id}`} className="flex items-center gap-2 hover:underline text-blue-600">
                    <span className="font-mono font-medium">{presupuestoOrigen.codigo}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">Presupuesto de origen</p>
                </CardContent>
              </Card>
            )}

            {/* Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{clienteNombre}</p>
                    <p className="text-sm text-muted-foreground">{pedido.clienteNif}</p>
                  </div>
                </div>
                {pedido.clienteEmail && (
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${pedido.clienteEmail}`} className="text-sm hover:underline text-primary">
                      {pedido.clienteEmail}
                    </a>
                  </div>
                )}
                {pedido.clienteTelefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${pedido.clienteTelefono}`} className="text-sm hover:underline">
                      {pedido.clienteTelefono}
                    </a>
                  </div>
                )}
                {pedido.referenciaCliente && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ref. Cliente</p>
                      <p className="text-sm">{pedido.referenciaCliente}</p>
                    </div>
                  </div>
                )}
                {pedido.pedidoCliente && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pedido Cliente</p>
                      <p className="text-sm font-medium">{pedido.pedidoCliente}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Condiciones Comerciales */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Condiciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formaPagoNombre && (
                  <div className="flex items-start gap-2">
                    <Banknote className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Forma de Pago</p>
                      <p className="text-sm font-medium">{formaPagoNombre}</p>
                    </div>
                  </div>
                )}
                {terminoPagoNombre && (
                  <div className="flex items-start gap-2">
                    <Timer className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Término de Pago</p>
                      <p className="text-sm font-medium">{terminoPagoNombre}</p>
                    </div>
                  </div>
                )}
                {pedido.condiciones?.tiempoEntrega && (
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tiempo Entrega</p>
                      <p className="text-sm">{pedido.condiciones.tiempoEntrega}</p>
                    </div>
                  </div>
                )}
                {pedido.condiciones?.garantia && (
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Garantía</p>
                      <p className="text-sm">{pedido.condiciones.garantia}</p>
                    </div>
                  </div>
                )}
                {pedido.condiciones?.portesPagados !== undefined && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {pedido.condiciones.portesPagados
                        ? <span className="text-green-600 font-medium">Portes incluidos</span>
                        : pedido.condiciones.portesImporte
                          ? `Portes: ${formatCurrency(pedido.condiciones.portesImporte)}`
                          : 'Portes a cargo del cliente'}
                    </p>
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
                    <p className="text-xs text-muted-foreground">Emisión</p>
                    <p className="font-medium">{formatDate(pedido.fecha)}</p>
                  </div>
                  {pedido.fechaConfirmacion && (
                    <div>
                      <p className="text-xs text-muted-foreground">Confirmación</p>
                      <p className="font-medium">{formatDate(pedido.fechaConfirmacion)}</p>
                    </div>
                  )}
                  {pedido.fechaEntregaComprometida && (
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega Comprometida</p>
                      <p className={`font-medium ${diasEntrega !== null && diasEntrega < 0 ? 'text-red-600' : ''}`}>
                        {formatDate(pedido.fechaEntregaComprometida)}
                      </p>
                    </div>
                  )}
                  {pedido.fechaEntregaReal && (
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega Real</p>
                      <p className="font-medium text-green-600">{formatDate(pedido.fechaEntregaReal)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dirección de entrega */}
            {pedido.direccionEntrega && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pedido.direccionEntrega.tipo === 'recogida' ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Recogida en tienda</p>
                        {pedido.direccionEntrega.instrucciones && (
                          <p className="text-xs text-blue-700 mt-1">{pedido.direccionEntrega.instrucciones}</p>
                        )}
                      </div>
                    </div>
                  ) : pedido.direccionEntrega.calle ? (
                    <div className="space-y-2">
                      <address className="not-italic text-sm">
                        {pedido.direccionEntrega.nombre && (
                          <p className="font-medium">{pedido.direccionEntrega.nombre}</p>
                        )}
                        <p>{pedido.direccionEntrega.calle} {pedido.direccionEntrega.numero}</p>
                        {pedido.direccionEntrega.piso && <p>{pedido.direccionEntrega.piso}</p>}
                        <p>{pedido.direccionEntrega.codigoPostal} {pedido.direccionEntrega.ciudad}</p>
                        {pedido.direccionEntrega.provincia && (
                          <p>{pedido.direccionEntrega.provincia}, {pedido.direccionEntrega.pais || 'España'}</p>
                        )}
                      </address>
                      {(pedido.direccionEntrega.personaContacto || pedido.direccionEntrega.telefonoContacto) && (
                        <div className="pt-2 border-t text-sm">
                          {pedido.direccionEntrega.personaContacto && (
                            <p><span className="text-muted-foreground">Contacto:</span> {pedido.direccionEntrega.personaContacto}</p>
                          )}
                          {pedido.direccionEntrega.telefonoContacto && (
                            <p><span className="text-muted-foreground">Tel:</span> {pedido.direccionEntrega.telefonoContacto}</p>
                          )}
                        </div>
                      )}
                      {pedido.direccionEntrega.horarioEntrega && (
                        <p className="text-xs text-muted-foreground pt-1 border-t">
                          Horario: {pedido.direccionEntrega.horarioEntrega}
                        </p>
                      )}
                      {pedido.direccionEntrega.instrucciones && (
                        <p className="text-xs bg-amber-50 p-2 rounded border border-amber-200 text-amber-800">
                          {pedido.direccionEntrega.instrucciones}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Dirección del cliente</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Relaciones */}
            {(agenteNombre || proyectoNombre) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Relaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agenteNombre && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Agente Comercial</p>
                        <p className="text-sm font-medium">{agenteNombre}</p>
                      </div>
                    </div>
                  )}
                  {proyectoNombre && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Proyecto</p>
                        <p className="text-sm font-medium">{proyectoNombre}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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

            {/* Información del sistema */}
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
                  <span className="text-muted-foreground">Número</span>
                  <span className="font-mono">{pedido.numero || '-'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Diálogo de crear albarán */}
      <Dialog open={showCrearAlbaranDialog} onOpenChange={setShowCrearAlbaranDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-cyan-600" />
              Crear Albarán de Entrega
            </DialogTitle>
            <DialogDescription>
              Se creará un albarán de entrega para este pedido con todas las líneas pendientes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pedido:</span>
                <span className="font-medium">{pedido.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{clienteNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Líneas:</span>
                <span className="font-medium">{pedido.lineas?.length || 0} productos</span>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>El albarán incluirá:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Todas las líneas del pedido pendientes de entregar</li>
                <li>Dirección de entrega del pedido</li>
                <li>Datos del transportista (si están configurados)</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCrearAlbaranDialog(false)} disabled={isCreandoAlbaran}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearAlbaran}
              disabled={isCreandoAlbaran}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              {isCreandoAlbaran ? 'Creando...' : 'Crear Albarán'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el pedido
              <span className="font-semibold"> {pedido.codigo}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
