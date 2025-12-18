'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { facturasCompraService } from '@/services/facturas-compra.service'
import {
  FacturaCompra,
  ESTADOS_FACTURA_COMPRA,
  EstadoFacturaCompra,
} from '@/types/factura-compra.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Receipt,
  RefreshCw,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Building2,
  Mail,
  Phone,
  Package,
  Hash,
  Clock,
  Printer,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Truck,
  ChevronRight,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function FacturaCompraDetallePage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [factura, setFactura] = useState<FacturaCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [pagoDialog, setPagoDialog] = useState(false)
  const [importePago, setImportePago] = useState('')
  const [referenciaPago, setReferenciaPago] = useState('')
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
    loadFactura()
  }, [resolvedParams.id])

  const loadFactura = async () => {
    try {
      setIsLoading(true)
      const response = await facturasCompraService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setFactura(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar factura')
      router.push('/compras/facturas')
    } finally {
      setIsLoading(false)
    }
  }

  const getEstadoConfig = (estado: EstadoFacturaCompra) => {
    return ESTADOS_FACTURA_COMPRA.find(e => e.value === estado) || ESTADOS_FACTURA_COMPRA[0]
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  const formatDate = (fecha: string | undefined) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleCambiarEstado = async (nuevoEstado: EstadoFacturaCompra) => {
    try {
      const response = await facturasCompraService.cambiarEstado(resolvedParams.id, nuevoEstado)
      if (response.success && response.data) {
        setFactura(response.data)
        toast.success('Estado actualizado correctamente')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const handleEliminar = async () => {
    try {
      await facturasCompraService.delete(resolvedParams.id)
      toast.success('Factura eliminada correctamente')
      router.push('/compras/facturas')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar')
    }
  }

  const handleRegistrarPago = async () => {
    try {
      const importe = parseFloat(importePago)
      if (isNaN(importe) || importe <= 0) {
        toast.error('El importe debe ser mayor que 0')
        return
      }

      const response = await facturasCompraService.registrarPago(resolvedParams.id, {
        importe,
        fechaPago: new Date().toISOString(),
        referenciaPago: referenciaPago || undefined,
      })

      if (response.success && response.data) {
        setFactura(response.data)
        toast.success('Pago registrado correctamente')
        setPagoDialog(false)
        setImportePago('')
        setReferenciaPago('')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar pago')
    }
  }

  // Calcular porcentaje de pago
  const calcularPorcentajePago = () => {
    if (!factura || !factura.totales) return 0
    const total = factura.totales.totalFactura || 0
    const pagado = factura.totales.totalPagado || 0
    if (total === 0) return 0
    return Math.round((pagado / total) * 100)
  }

  // Calcular dias hasta vencimiento
  const calcularDiasVencimiento = () => {
    if (!factura?.vencimientos || factura.vencimientos.length === 0) return null
    const vencimientoPendiente = factura.vencimientos.find(v => !v.pagado)
    if (!vencimientoPendiente) return null

    const fechaVencimiento = new Date(vencimientoPendiente.fechaVencimiento)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    fechaVencimiento.setHours(0, 0, 0, 0)
    return Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando factura...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!factura) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Factura de compra no encontrada</p>
          <Link href="/compras/facturas">
            <Button variant="link" className="mt-2">
              Volver al listado
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const estadoConfig = getEstadoConfig(factura.estado)
  const porcentajePago = calcularPorcentajePago()
  const diasVencimiento = calcularDiasVencimiento()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/compras/facturas">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  {factura.codigo}
                </h1>
                <Badge className={`text-white ${estadoConfig.color}`}>
                  {estadoConfig.label}
                </Badge>
                {diasVencimiento !== null && factura.estado !== 'pagada' && factura.estado !== 'anulada' && (
                  <Badge
                    variant="outline"
                    className={
                      diasVencimiento < 0
                        ? 'border-red-500 text-red-600'
                        : diasVencimiento <= 7
                          ? 'border-orange-500 text-orange-600'
                          : 'border-green-500 text-green-600'
                    }
                  >
                    {diasVencimiento < 0 ? `Vencida hace ${Math.abs(diasVencimiento)} dias` : `Vence en ${diasVencimiento} dias`}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Factura proveedor: {factura.numeroFacturaProveedor || '-'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Acciones rapidas segun estado */}
            {factura.estado !== 'pagada' && factura.estado !== 'anulada' && (
              <Button
                size="sm"
                onClick={() => {
                  setImportePago((factura.totales?.totalPendiente || 0).toString())
                  setPagoDialog(true)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Registrar Pago
              </Button>
            )}

            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>

            <Link href={`/compras/facturas/${resolvedParams.id}/editar`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={loadFactura}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                {factura.estado !== 'anulada' && factura.estado !== 'pagada' && (
                  <DropdownMenuItem onClick={() => handleCambiarEstado('anulada')}>
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    Anular
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progreso de pago */}
        {factura.estado !== 'pagada' && factura.estado !== 'anulada' && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso de pago</span>
              <span className="text-sm text-muted-foreground">{porcentajePago}% ({formatCurrency(factura.totales?.totalPagado || 0)} de {formatCurrency(factura.totales?.totalFactura || 0)})</span>
            </div>
            <Progress value={porcentajePago} className="h-2" />
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Pendiente: <span className="font-medium text-orange-600">{formatCurrency(factura.totales?.totalPendiente || 0)}</span></span>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informacion principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos generales */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Datos de la Factura
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Codigo interno</p>
                  <p className="font-medium">{factura.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Factura proveedor</p>
                  <p className="font-medium">{factura.numeroFacturaProveedor || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serie / Numero</p>
                  <p className="font-medium">{factura.serie || '-'} / {factura.numero || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha factura
                  </p>
                  <p className="font-medium">{formatDate(factura.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Fecha factura prov.
                  </p>
                  <p className="font-medium">{formatDate(factura.fechaFacturaProveedor)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contabilizada</p>
                  <Badge variant={factura.contabilizada ? 'default' : 'secondary'}>
                    {factura.contabilizada ? 'Si' : 'No'}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Lineas de la factura */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Lineas ({factura.lineas?.length || 0})
              </h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Dto. %</TableHead>
                      <TableHead className="text-right">IVA %</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factura.lineas?.map((linea: any, index) => (
                      <React.Fragment key={linea._id || index}>
                        <TableRow>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell>
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
                                <p className="font-medium">{linea.nombre}</p>
                              </div>
                              {linea.descripcion && (
                                <p className="text-xs text-muted-foreground">{linea.descripcion}</p>
                              )}
                              {linea.sku && (
                                <p className="text-xs text-muted-foreground">SKU: {linea.sku}</p>
                              )}
                              <div className="flex flex-wrap gap-1">
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
                          </TableCell>
                          <TableCell className="text-right">{linea.cantidad} {linea.unidad || 'ud.'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(linea.precioUnitario)}</TableCell>
                          <TableCell className="text-right">{linea.descuento}%</TableCell>
                          <TableCell className="text-right">{linea.iva}%</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(linea.total)}</TableCell>
                        </TableRow>
                        {/* Componentes del kit expandidos */}
                        {linea.tipo === 'kit' && expandedKits.has(index) && linea.componentesKit && linea.componentesKit.length > 0 && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={7} className="px-6 py-3">
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
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Vencimientos */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Vencimientos ({factura.vencimientos?.length || 0})
              </h2>
              {factura.vencimientos && factura.vencimientos.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Fecha Vencimiento</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {factura.vencimientos.map((venc, index) => (
                        <TableRow key={venc._id || index}>
                          <TableCell className="text-muted-foreground">{venc.numero || index + 1}</TableCell>
                          <TableCell>{formatDate(venc.fechaVencimiento)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(venc.importe)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(venc.importePagado || 0)}</TableCell>
                          <TableCell className="text-right text-orange-600">{formatCurrency(venc.importePendiente || 0)}</TableCell>
                          <TableCell>
                            <Badge variant={venc.pagado ? 'default' : 'secondary'} className={venc.pagado ? 'bg-green-500' : ''}>
                              {venc.pagado ? 'Pagado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay vencimientos definidos</p>
              )}
            </Card>

            {/* Historial de pagos */}
            {factura.pagos && factura.pagos.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Historial de Pagos ({factura.pagos.length})
                </h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {factura.pagos.map((pago, index) => (
                        <TableRow key={pago._id || index}>
                          <TableCell>{formatDate(pago.fecha)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{formatCurrency(pago.importe)}</TableCell>
                          <TableCell>{pago.referenciaPago || '-'}</TableCell>
                          <TableCell>{pago.observaciones || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* Observaciones */}
            {factura.observaciones && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Observaciones</h2>
                <p className="text-sm whitespace-pre-wrap">{factura.observaciones}</p>
              </Card>
            )}
          </div>

          {/* Sidebar derecha */}
          <div className="space-y-6">
            {/* Proveedor */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Proveedor
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">{factura.proveedorNombre}</p>
                  <p className="text-sm text-muted-foreground">NIF: {factura.proveedorNif || '-'}</p>
                </div>
                {factura.proveedorEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {factura.proveedorEmail}
                  </div>
                )}
                {factura.proveedorTelefono && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {factura.proveedorTelefono}
                  </div>
                )}
              </div>
            </Card>

            {/* Totales */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Totales</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal bruto</span>
                  <span>{formatCurrency(factura.totales?.subtotalBruto || 0)}</span>
                </div>
                {(factura.totales?.totalDescuentos || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuentos</span>
                    <span className="text-red-600">-{formatCurrency(factura.totales.totalDescuentos)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal neto</span>
                  <span>{formatCurrency(factura.totales?.subtotalNeto || 0)}</span>
                </div>
                <Separator className="my-2" />
                {factura.totales?.desgloseIva?.map((desglose, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA {desglose.tipo}%</span>
                    <span>{formatCurrency(desglose.cuota)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total IVA</span>
                  <span>{formatCurrency(factura.totales?.totalIva || 0)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Factura</span>
                  <span className="text-primary">{formatCurrency(factura.totales?.totalFactura || 0)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Pagado</span>
                  <span className="text-green-600 font-medium">{formatCurrency(factura.totales?.totalPagado || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Pendiente</span>
                  <span className="text-orange-600">{formatCurrency(factura.totales?.totalPendiente || 0)}</span>
                </div>
              </div>
            </Card>

            {/* Referencias (albaranes) */}
            {factura.albaranesCompraIds && factura.albaranesCompraIds.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Albaranes Asociados
                </h2>
                <div className="space-y-2">
                  {factura.albaranesCompraIds.map((albaranId, idx) => (
                    <Link key={idx} href={`/compras/albaranes/${albaranId}`}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Truck className="h-4 w-4 mr-2" />
                        Ver albaran
                      </Button>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Auditoria */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Auditoria</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado</span>
                  <span>{formatDate(factura.fechaCreacion)}</span>
                </div>
                {factura.fechaModificacion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modificado</span>
                    <span>{formatDate(factura.fechaModificacion)}</span>
                  </div>
                )}
                {factura.fechaContabilizacion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contabilizado</span>
                    <span>{formatDate(factura.fechaContabilizacion)}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Dialog de confirmacion para eliminar */}
        <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminacion</DialogTitle>
              <DialogDescription>
                Estas seguro de que deseas eliminar la factura {factura.codigo}?
                Esta accion no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleEliminar}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para registrar pago */}
        <Dialog open={pagoDialog} onOpenChange={setPagoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
              <DialogDescription>
                Pendiente: {formatCurrency(factura.totales?.totalPendiente || 0)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="importe">Importe *</Label>
                <Input
                  id="importe"
                  type="number"
                  step="0.01"
                  min="0"
                  value={importePago}
                  onChange={(e) => setImportePago(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referencia">Referencia de pago</Label>
                <Input
                  id="referencia"
                  value={referenciaPago}
                  onChange={(e) => setReferenciaPago(e.target.value)}
                  placeholder="N. transferencia, cheque, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPagoDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarPago}>
                Registrar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
