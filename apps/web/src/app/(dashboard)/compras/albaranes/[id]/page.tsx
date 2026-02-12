'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { albaranesCompraService } from '@/services/albaranes-compra.service'
import {
  AlbaranCompra,
  ESTADOS_ALBARAN_COMPRA,
  EstadoAlbaranCompra,
} from '@/types/albaran-compra.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Truck,
  RefreshCw,
  Edit,
  Trash2,
  MoreHorizontal,
  Copy,
  CheckCircle2,
  XCircle,
  FileText,
  Receipt,
  Calendar,
  Building2,
  Mail,
  Phone,
  Package,
  Hash,
  Clock,
  Send,
  Printer,
  ChevronRight,
  ChevronDown,
  Layers,
  Download,
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
import { Progress } from '@/components/ui/progress'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AlbaranCompraDetallePage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [albaran, setAlbaran] = useState<AlbaranCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
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
    loadAlbaran()
  }, [resolvedParams.id])

  const loadAlbaran = async () => {
    try {
      setIsLoading(true)
      const response = await albaranesCompraService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setAlbaran(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar albaran')
      router.push('/compras/albaranes')
    } finally {
      setIsLoading(false)
    }
  }

  const getEstadoConfig = (estado: EstadoAlbaranCompra) => {
    return ESTADOS_ALBARAN_COMPRA.find(e => e.value === estado) || ESTADOS_ALBARAN_COMPRA[0]
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

  const handleCambiarEstado = async (nuevoEstado: EstadoAlbaranCompra) => {
    try {
      const response = await albaranesCompraService.cambiarEstado(resolvedParams.id, nuevoEstado)
      if (response.success && response.data) {
        setAlbaran(response.data)
        toast.success('Estado actualizado correctamente')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const handleDuplicar = async () => {
    try {
      toast.loading('Duplicando albaran...')
      const response = await albaranesCompraService.duplicar(resolvedParams.id)
      toast.dismiss()
      if (response.success && response.data) {
        toast.success('Albaran duplicado correctamente')
        router.push(`/compras/albaranes/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.response?.data?.message || 'Error al duplicar')
    }
  }

  const handleEliminar = async () => {
    try {
      await albaranesCompraService.delete(resolvedParams.id)
      toast.success('Albaran eliminado correctamente')
      router.push('/compras/albaranes')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar')
    }
  }

  const handleCrearFactura = () => {
    router.push(`/compras/facturas/nuevo?albaranCompraIds=${resolvedParams.id}`)
  }

  const handleEnviarEmail = async () => {
    if (!albaran) return

    const email = albaran.proveedorEmail
    if (!email) {
      toast.error('El proveedor no tiene email configurado')
      return
    }

    setIsSendingEmail(true)
    try {
      toast.loading('Enviando email al proveedor...', { id: 'sending-email' })

      const response = await albaranesCompraService.enviarPorEmail(albaran._id)

      toast.dismiss('sending-email')

      if (response.success) {
        toast.success('Email enviado correctamente al proveedor')
        loadAlbaran()
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
    if (!albaran) return
    window.open(`/compras/albaranes/${albaran._id}/imprimir`, '_blank', 'width=900,height=700,menubar=yes,toolbar=yes,scrollbars=yes,resizable=yes')
  }

  const handleExportPDF = async () => {
    if (!albaran) return

    setIsExportingPDF(true)
    try {
      toast.loading('Generando PDF...', { id: 'export-pdf' })

      const blob = await albaranesCompraService.generarPDF(albaran._id)

      toast.dismiss('export-pdf')

      // Descargar el PDF
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Albaran_Compra_${albaran.codigo}.pdf`
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

  // Calcular porcentaje de recepcion
  const calcularPorcentajeRecepcion = () => {
    if (!albaran || !albaran.lineas || albaran.lineas.length === 0) return 0
    const totalCantidad = albaran.lineas.reduce((sum, l) => sum + (l.cantidad || 0), 0)
    const totalRecibido = albaran.lineas.reduce((sum, l) => sum + (l.cantidadRecibida || 0), 0)
    if (totalCantidad === 0) return 0
    return Math.round((totalRecibido / totalCantidad) * 100)
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando albaran...</p>
          </div>
        </div>
      
    )
  }

  if (!albaran) {
    return (
      
        <div className="text-center py-12">
          <Truck className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Albaran de compra no encontrado</p>
          <Link href="/compras/albaranes">
            <Button variant="link" className="mt-2">
              Volver al listado
            </Button>
          </Link>
        </div>
      
    )
  }

  const estadoConfig = getEstadoConfig(albaran.estado)
  const porcentajeRecepcion = calcularPorcentajeRecepcion()

  return (
    
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/compras/albaranes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Truck className="h-6 w-6 text-primary" />
                  {albaran.codigo}
                </h1>
                <Badge className={`text-white ${estadoConfig.color}`}>
                  {estadoConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {albaran.titulo || 'Albaran de compra'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Acciones rapidas segun estado */}
            {albaran.estado === 'borrador' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCambiarEstado('pendiente_recepcion')}
              >
                <Send className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            )}

            {(albaran.estado === 'pendiente_recepcion' || albaran.estado === 'recibido_parcial') && (
              <Button
                size="sm"
                onClick={() => handleCambiarEstado('recibido')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar Recibido
              </Button>
            )}

            {albaran.estado === 'recibido' && !albaran.facturado && (
              <Button
                size="sm"
                onClick={handleCrearFactura}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Crear Factura
              </Button>
            )}

            {/* Enviar por Email */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnviarEmail}
              disabled={isSendingEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSendingEmail ? 'Enviando...' : 'Email'}
            </Button>

            {/* Imprimir / PDF */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExportingPDF}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
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

            <Link href={`/compras/albaranes/${resolvedParams.id}/editar`}>
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
                <DropdownMenuItem onClick={handleDuplicar}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={loadAlbaran}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                {albaran.estado !== 'anulado' && albaran.estado !== 'facturado' && (
                  <DropdownMenuItem onClick={() => handleCambiarEstado('anulado')}>
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

        {/* Progreso de recepcion */}
        {['pendiente_recepcion', 'recibido_parcial'].includes(albaran.estado) && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso de recepcion</span>
              <span className="text-sm text-muted-foreground">{porcentajeRecepcion}%</span>
            </div>
            <Progress value={porcentajeRecepcion} className="h-2" />
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informacion principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Datos generales */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Datos del Albaran
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Codigo</p>
                  <p className="font-medium">{albaran.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serie</p>
                  <p className="font-medium">{albaran.serie || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Numero</p>
                  <p className="font-medium">{albaran.numero || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Fecha
                  </p>
                  <p className="font-medium">{formatDate(albaran.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Fecha Recepcion
                  </p>
                  <p className="font-medium">{formatDate(albaran.fechaRecepcion)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Albaran Proveedor</p>
                  <p className="font-medium">{albaran.albaranProveedor || '-'}</p>
                </div>
              </div>
            </Card>

            {/* Lineas del albaran */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Lineas ({albaran.lineas?.length || 0})
              </h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Recibido</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Dto. %</TableHead>
                      <TableHead className="text-right">IVA %</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {albaran.lineas?.map((linea: any, index) => (
                      <React.Fragment key={linea._id || index}>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
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
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{linea.nombre}</p>
                              {linea.descripcion && (
                                <p className="text-xs text-muted-foreground">{linea.descripcion}</p>
                              )}
                              {linea.sku && (
                                <p className="text-xs text-muted-foreground">SKU: {linea.sku}</p>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {linea.tipo === 'kit' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Layers className="h-3 w-3 mr-1" />
                                    Kit
                                  </Badge>
                                )}
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
                          <TableCell className="text-right">
                            <span className={linea.cantidadRecibida >= linea.cantidad ? 'text-green-600' : 'text-yellow-600'}>
                              {linea.cantidadRecibida || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(linea.precioUnitario)}</TableCell>
                          <TableCell className="text-right">{linea.descuento}%</TableCell>
                          <TableCell className="text-right">{linea.iva}%</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(linea.total)}</TableCell>
                        </TableRow>
                        {linea.tipo === 'kit' && expandedKits.has(index) && linea.componentesKit && linea.componentesKit.length > 0 && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={8} className="px-6 py-3">
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

            {/* Observaciones */}
            {(albaran.observaciones || albaran.observacionesAlmacen) && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Observaciones</h2>
                {albaran.observaciones && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Observaciones generales</p>
                    <p className="text-sm whitespace-pre-wrap">{albaran.observaciones}</p>
                  </div>
                )}
                {albaran.observacionesAlmacen && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Observaciones de almacen</p>
                    <p className="text-sm whitespace-pre-wrap">{albaran.observacionesAlmacen}</p>
                  </div>
                )}
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
                  <p className="font-medium">{albaran.proveedorNombre}</p>
                  <p className="text-sm text-muted-foreground">NIF: {albaran.proveedorNif || '-'}</p>
                </div>
                {albaran.proveedorEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {albaran.proveedorEmail}
                  </div>
                )}
                {albaran.proveedorTelefono && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {albaran.proveedorTelefono}
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
                  <span>{formatCurrency(albaran.totales?.subtotalBruto || 0)}</span>
                </div>
                {(albaran.totales?.totalDescuentos || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuentos</span>
                    <span className="text-red-600">-{formatCurrency(albaran.totales.totalDescuentos)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal neto</span>
                  <span>{formatCurrency(albaran.totales?.subtotalNeto || 0)}</span>
                </div>
                <Separator className="my-2" />
                {albaran.totales?.desgloseIva?.map((desglose, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA {desglose.tipo}%</span>
                    <span>{formatCurrency(desglose.cuota)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total IVA</span>
                  <span>{formatCurrency(albaran.totales?.totalIva || 0)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(albaran.totales?.totalAlbaran || 0)}</span>
                </div>
              </div>
            </Card>

            {/* Estado de facturacion */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Facturacion
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <Badge variant={albaran.facturado ? 'default' : 'secondary'}>
                    {albaran.facturado ? 'Facturado' : 'Pendiente'}
                  </Badge>
                </div>
                {albaran.facturaCompraId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Factura</span>
                    <Link href={`/compras/facturas/${albaran.facturaCompraId}`}>
                      <Button variant="link" size="sm" className="p-0 h-auto">
                        Ver factura
                      </Button>
                    </Link>
                  </div>
                )}
                {!albaran.facturado && albaran.estado === 'recibido' && (
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleCrearFactura}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Crear Factura
                  </Button>
                )}
              </div>
            </Card>

            {/* Referencias */}
            {albaran.pedidoCompraId && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  Referencias
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pedido origen</span>
                    <Link href={`/compras/pedidos/${typeof albaran.pedidoCompraId === 'object' ? (albaran.pedidoCompraId as any)?._id : albaran.pedidoCompraId}`}>
                      <Button variant="link" size="sm" className="p-0 h-auto">
                        Ver pedido
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {/* Auditoria */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Auditoria</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado</span>
                  <span>{formatDate(albaran.fechaCreacion)}</span>
                </div>
                {albaran.fechaModificacion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modificado</span>
                    <span>{formatDate(albaran.fechaModificacion)}</span>
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
                Estas seguro de que deseas eliminar el albaran {albaran.codigo}?
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
      </div>
    
  )
}
