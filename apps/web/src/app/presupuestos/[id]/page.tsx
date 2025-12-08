'use client'

import React, { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useReactToPrint } from 'react-to-print'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { presupuestosService } from '@/services/presupuestos.service'
import { empresaService, EmpresaInfo } from '@/services/empresa.service'
import { IPresupuesto, getEstadoConfig, getTipoLineaLabel, ESTADOS_PRESUPUESTO, EstadoPresupuesto } from '@/types/presupuesto.types'
import { PresupuestoPrintView, PrintOptions, defaultPrintOptions } from '@/components/presupuestos/PresupuestoPrintView'
import { PresupuestoHistorial } from '@/components/presupuestos/PresupuestoHistorial'
import { GuardarPlantillaDialog } from '@/components/presupuestos/PlantillasPresupuesto'
import { HistorialRecordatorios } from '@/components/presupuestos/RecordatoriosPresupuestos'
import { ImportarLineasDialog } from '@/components/presupuestos/ImportarLineasDialog'
import { EnlacePortalPresupuesto } from '@/components/presupuestos/EnlacePortalPresupuesto'
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
  Send,
  Check,
  X,
  Clock,
  TrendingUp,
  Package,
  ShoppingCart,
  Printer,
  MessageCircle,
  ChevronDown,
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
  Files,
  Import,
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

export default function PresupuestoDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [presupuesto, setPresupuesto] = useState<IPresupuesto | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaInfo | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPrintView, setShowPrintView] = useState(false)
  const [showPrintOptionsDialog, setShowPrintOptionsDialog] = useState(false)
  const [showImportarLineas, setShowImportarLineas] = useState(false)
  const [printOptionsMode, setPrintOptionsMode] = useState<'print' | 'email'>('print')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [mostrarCostes, setMostrarCostes] = useState(true)
  const [printOptions, setPrintOptions] = useState<PrintOptions>(defaultPrintOptions)
  const printRef = useRef<HTMLDivElement>(null)

  // Hook para imprimir
  const handlePrintDocument = useReactToPrint({
    contentRef: printRef,
    documentTitle: presupuesto ? `Presupuesto_${presupuesto.codigo}` : 'Presupuesto',
    onAfterPrint: () => setShowPrintView(false),
  })

  useEffect(() => {
    loadPresupuesto()
    loadEmpresa()
  }, [resolvedParams.id])

  const loadPresupuesto = async () => {
    try {
      setIsLoading(true)
      const response = await presupuestosService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setPresupuesto(response.data)
        setMostrarCostes(response.data.mostrarCostes !== false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar presupuesto')
      router.push('/presupuestos')
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
    if (!presupuesto) return

    try {
      await presupuestosService.delete(presupuesto._id)
      toast.success('Presupuesto eliminado correctamente')
      router.push('/presupuestos')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar presupuesto')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleDuplicar = async () => {
    if (!presupuesto) return

    try {
      const response = await presupuestosService.duplicar(presupuesto._id)
      if (response.success && response.data) {
        toast.success('Presupuesto duplicado correctamente')
        router.push(`/presupuestos/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al duplicar presupuesto')
    }
  }

  const handleCambiarEstado = async (estado: EstadoPresupuesto) => {
    if (!presupuesto) return

    try {
      const response = await presupuestosService.cambiarEstado(presupuesto._id, estado)
      if (response.success && response.data) {
        setPresupuesto(response.data)
        const estadoConfig = getEstadoConfig(estado)
        toast.success(`Estado cambiado a ${estadoConfig.label}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const handlePrint = () => {
    if (!presupuesto) return
    // Abrir diálogo de opciones antes de imprimir
    setPrintOptionsMode('print')
    setShowPrintOptionsDialog(true)
  }

  const handleExportPDF = () => {
    if (!presupuesto) return
    // Abrir diálogo de opciones antes de exportar
    setPrintOptionsMode('print')
    setShowPrintOptionsDialog(true)
  }

  const handleConfirmPrint = () => {
    setShowPrintOptionsDialog(false)
    setShowPrintView(true)
    // Esperar a que se renderice la vista y luego imprimir
    setTimeout(() => {
      handlePrintDocument()
    }, 100)
  }

  // Abrir diálogo de opciones antes de enviar email
  const handleEnviarEmail = () => {
    if (!presupuesto) return

    const email = presupuesto.clienteEmail
    if (!email) {
      toast.error('El cliente no tiene email configurado')
      return
    }

    // Abrir diálogo de opciones antes de enviar email
    setPrintOptionsMode('email')
    setShowPrintOptionsDialog(true)
  }

  // Confirmar envío de email con las opciones seleccionadas
  const handleConfirmEnviarEmail = async () => {
    if (!presupuesto) return

    setIsSendingEmail(true)
    setShowPrintOptionsDialog(false)

    try {
      toast.loading('Enviando email con PDF adjunto...', { id: 'sending-email' })

      // Usar el nuevo endpoint que envía el PDF adjunto
      const response = await presupuestosService.enviarPorEmail(presupuesto._id, {
        pdfOptions: {
          mostrarDescripcion: printOptions.mostrarDescripcion,
          mostrarReferencias: printOptions.mostrarReferencias,
          mostrarCondiciones: printOptions.mostrarCondiciones,
          mostrarFirmas: printOptions.mostrarFirmas,
          mostrarCuentaBancaria: printOptions.mostrarCuentaBancaria,
          mostrarLOPD: printOptions.mostrarLOPD,
          mostrarRegistroMercantil: printOptions.mostrarRegistroMercantil,
        },
      })

      toast.dismiss('sending-email')

      if (response.success) {
        toast.success('Email con PDF enviado correctamente')
        // Recargar presupuesto para actualizar estado
        loadPresupuesto()
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

  const handleEnviarWhatsApp = () => {
    if (!presupuesto) return

    const telefono = presupuesto.clienteTelefono?.replace(/\s/g, '').replace(/[^0-9]/g, '')
    if (!telefono) {
      toast.error('El cliente no tiene teléfono configurado')
      return
    }

    // Formatear teléfono para WhatsApp (añadir código de país si no lo tiene)
    let telefonoWA = telefono
    if (!telefono.startsWith('34') && telefono.length === 9) {
      telefonoWA = '34' + telefono
    }

    const mensaje = encodeURIComponent(
      `Hola ${clienteNombre},\n\n` +
      `Le enviamos el presupuesto *${presupuesto.codigo}* por un importe de *${formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}*.\n\n` +
      `Válido hasta: ${formatDate(presupuesto.fechaValidez)}\n\n` +
      `Quedamos a su disposición para cualquier consulta.`
    )

    window.open(`https://wa.me/${telefonoWA}?text=${mensaje}`, '_blank')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
          <p className="text-muted-foreground">Presupuesto no encontrado</p>
        </div>
      </DashboardLayout>
    )
  }

  const estadoConfig = getEstadoConfig(presupuesto.estado)
  const clienteNombre = typeof presupuesto.clienteId === 'object'
    ? presupuesto.clienteId.nombre
    : presupuesto.clienteNombre

  const agenteNombre = typeof presupuesto.agenteComercialId === 'object'
    ? `${presupuesto.agenteComercialId.nombre} ${presupuesto.agenteComercialId.apellidos}`
    : undefined

  const proyectoNombre = typeof presupuesto.proyectoId === 'object'
    ? presupuesto.proyectoId.nombre
    : undefined

  // Obtener nombres de forma de pago y término de pago si vienen poblados
  const formaPagoNombre = presupuesto.condiciones?.formaPagoId
    ? (typeof presupuesto.condiciones.formaPagoId === 'object'
      ? (presupuesto.condiciones.formaPagoId as any).nombre
      : null)
    : null

  const terminoPagoNombre = presupuesto.condiciones?.terminoPagoId
    ? (typeof presupuesto.condiciones.terminoPagoId === 'object'
      ? (presupuesto.condiciones.terminoPagoId as any).nombre
      : null)
    : null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link href="/presupuestos">
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
                    <Badge className={estadoConfig.color}>
                      {estadoConfig.label}
                    </Badge>
                    {presupuesto.diasParaCaducar !== null && presupuesto.diasParaCaducar !== undefined && (
                      <Badge variant={presupuesto.diasParaCaducar < 0 ? 'destructive' : presupuesto.diasParaCaducar <= 7 ? 'secondary' : 'outline'}>
                        <Clock className="h-3 w-3 mr-1" />
                        {presupuesto.diasParaCaducar < 0
                          ? 'Caducado'
                          : presupuesto.diasParaCaducar === 0
                          ? 'Caduca hoy'
                          : `${presupuesto.diasParaCaducar} días`}
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
                    onClick={() => router.push(`/presupuestos/${presupuesto._id}/editar`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  {/* Cambiar estado - Dropdown con todos los estados */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <span className={`w-2 h-2 rounded-full mr-2 ${estadoConfig.dotColor || 'bg-gray-400'}`} />
                        Cambiar estado
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Cambiar estado a:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {ESTADOS_PRESUPUESTO.map((estado) => {
                        const config = getEstadoConfig(estado.value)
                        const isCurrentState = presupuesto.estado === estado.value
                        return (
                          <DropdownMenuItem
                            key={estado.value}
                            onClick={() => !isCurrentState && handleCambiarEstado(estado.value)}
                            disabled={isCurrentState}
                            className={isCurrentState ? 'opacity-50' : ''}
                          >
                            <span className={`w-2 h-2 rounded-full mr-2 ${config.dotColor || 'bg-gray-400'}`} />
                            {estado.label}
                            {isCurrentState && <Check className="ml-auto h-4 w-4" />}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Acciones de envío */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Send className="mr-2 h-4 w-4" />
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

                  {/* Imprimir / PDF */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
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
                      <DropdownMenuItem onClick={() => setShowImportarLineas(true)}>
                        <Import className="mr-2 h-4 w-4" />
                        Importar líneas
                      </DropdownMenuItem>
                      <GuardarPlantillaDialog
                        presupuestoId={presupuesto._id}
                        codigoPresupuesto={presupuesto.codigo}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Files className="mr-2 h-4 w-4" />
                            Guardar como plantilla
                          </DropdownMenuItem>
                        }
                        onSuccess={() => toast.success('Plantilla guardada correctamente')}
                      />
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
          {mostrarCostes && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(presupuesto.totales?.costeTotal || 0)}</div>
                  <p className="text-sm text-muted-foreground">Coste Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${(presupuesto.totales?.margenBruto || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(presupuesto.totales?.margenBruto || 0)}
                    <span className="text-sm font-normal ml-2">
                      ({(presupuesto.totales?.margenPorcentaje || 0).toFixed(1)}%)
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
            {/* Líneas del presupuesto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Líneas del Presupuesto
                </CardTitle>
                <CardDescription>
                  {presupuesto.lineas?.length || 0} líneas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-3 text-left">Descripción</th>
                        <th className="px-3 py-3 text-right w-16">Cant.</th>
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
                      {(presupuesto.lineas || []).map((linea, index) => (
                        <tr key={linea._id || index} className="border-b hover:bg-muted/30">
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-medium">{linea.nombre}</div>
                              {linea.descripcion && (
                                <div className="text-xs text-muted-foreground">{linea.descripcion}</div>
                              )}
                              <Badge variant="outline" className="text-xs mt-1">
                                {getTipoLineaLabel(linea.tipo)}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">{linea.cantidad} {linea.unidad}</td>
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
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr>
                        <td colSpan={mostrarCostes ? 5 : 4} className="px-3 py-2 text-right font-medium">
                          Base Imponible:
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(presupuesto.totales?.subtotalNeto || 0)}
                        </td>
                        {mostrarCostes && <td></td>}
                      </tr>
                      <tr>
                        <td colSpan={mostrarCostes ? 5 : 4} className="px-3 py-2 text-right font-medium">
                          IVA:
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {formatCurrency(presupuesto.totales?.totalIva || 0)}
                        </td>
                        {mostrarCostes && <td></td>}
                      </tr>
                      <tr className="text-lg">
                        <td colSpan={mostrarCostes ? 5 : 4} className="px-3 py-3 text-right font-bold">
                          TOTAL:
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-primary">
                          {formatCurrency(presupuesto.totales?.totalPresupuesto || 0)}
                        </td>
                        {mostrarCostes && <td></td>}
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

            {/* Historial y Seguimiento */}
            <PresupuestoHistorial
              historial={presupuesto.historial || []}
              notasSeguimiento={presupuesto.notasSeguimiento || []}
              contadorEnvios={presupuesto.contadorEnvios}
              fechaEnvio={presupuesto.fechaEnvio}
              fechaRespuesta={presupuesto.fechaRespuesta}
              fechaCreacion={presupuesto.fechaCreacion}
              onAddNota={async (nota) => {
                try {
                  const notaData = {
                    ...nota,
                    fechaProximaAccion: nota.fechaProximaAccion
                      ? (nota.fechaProximaAccion instanceof Date
                          ? nota.fechaProximaAccion.toISOString()
                          : nota.fechaProximaAccion)
                      : undefined
                  }
                  const response = await presupuestosService.addNotaSeguimiento(presupuesto._id, notaData)
                  if (response.success && response.data) {
                    loadPresupuesto()
                    toast.success('Nota de seguimiento añadida')
                  }
                } catch (error) {
                  toast.error('Error al añadir nota')
                  throw error
                }
              }}
            />

            {/* Historial de Recordatorios */}
            <Card>
              <CardContent className="pt-6">
                <HistorialRecordatorios presupuestoId={presupuesto._id} />
              </CardContent>
            </Card>

            {/* Portal de Cliente */}
            <EnlacePortalPresupuesto
              presupuestoId={presupuesto._id}
              urlPortal={presupuesto.urlPortal}
              tokenExpirado={presupuesto.tokenExpirado}
              respuestaCliente={presupuesto.respuestaCliente}
              clienteEmail={presupuesto.clienteEmail}
              onEnlaceGenerado={loadPresupuesto}
            />
          </div>

          {/* Columna lateral - Info */}
          <div className="space-y-6">
            {/* Estado del Presupuesto */}
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
                    {presupuesto.diasParaCaducar !== null && presupuesto.diasParaCaducar !== undefined && (
                      <p className={`text-xs ${presupuesto.diasParaCaducar < 0 ? 'text-destructive' : presupuesto.diasParaCaducar <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {presupuesto.diasParaCaducar < 0
                          ? `Caducado hace ${Math.abs(presupuesto.diasParaCaducar)} días`
                          : presupuesto.diasParaCaducar === 0
                          ? 'Caduca hoy'
                          : `Válido ${presupuesto.diasParaCaducar} días más`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <p className="text-sm text-muted-foreground">{presupuesto.clienteNif}</p>
                  </div>
                </div>
                {presupuesto.clienteEmail && (
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${presupuesto.clienteEmail}`} className="text-sm hover:underline text-primary">
                      {presupuesto.clienteEmail}
                    </a>
                  </div>
                )}
                {presupuesto.clienteTelefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${presupuesto.clienteTelefono}`} className="text-sm hover:underline">
                      {presupuesto.clienteTelefono}
                    </a>
                  </div>
                )}
                {presupuesto.referenciaCliente && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ref. Cliente</p>
                      <p className="text-sm">{presupuesto.referenciaCliente}</p>
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
                {presupuesto.condiciones?.validezDias && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Validez</p>
                      <p className="text-sm">{presupuesto.condiciones.validezDias} días</p>
                    </div>
                  </div>
                )}
                {presupuesto.condiciones?.tiempoEntrega && (
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tiempo Entrega</p>
                      <p className="text-sm">{presupuesto.condiciones.tiempoEntrega}</p>
                    </div>
                  </div>
                )}
                {presupuesto.condiciones?.garantia && (
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Garantía</p>
                      <p className="text-sm">{presupuesto.condiciones.garantia}</p>
                    </div>
                  </div>
                )}
                {presupuesto.condiciones?.portesPagados !== undefined && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {presupuesto.condiciones.portesPagados
                        ? <span className="text-green-600 font-medium">Portes incluidos</span>
                        : presupuesto.condiciones.portesImporte
                          ? `Portes: ${formatCurrency(presupuesto.condiciones.portesImporte)}`
                          : 'Portes a cargo del cliente'}
                    </p>
                  </div>
                )}
                {!formaPagoNombre && !terminoPagoNombre && !presupuesto.condiciones?.tiempoEntrega && !presupuesto.condiciones?.garantia && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Sin condiciones especificadas
                  </p>
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
                    <p className="font-medium">{formatDate(presupuesto.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Validez</p>
                    <p className="font-medium">{formatDate(presupuesto.fechaValidez)}</p>
                  </div>
                  {presupuesto.fechaEnvio && (
                    <div>
                      <p className="text-xs text-muted-foreground">Enviado</p>
                      <p>{formatDate(presupuesto.fechaEnvio)}</p>
                    </div>
                  )}
                  {presupuesto.fechaRespuesta && (
                    <div>
                      <p className="text-xs text-muted-foreground">Respuesta</p>
                      <p>{formatDate(presupuesto.fechaRespuesta)}</p>
                    </div>
                  )}
                  {presupuesto.fechaEntregaPrevista && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Entrega Prevista</p>
                      <p className="font-medium text-primary">{formatDate(presupuesto.fechaEntregaPrevista)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dirección de entrega */}
            {presupuesto.direccionEntrega && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {presupuesto.direccionEntrega.tipo === 'recogida' ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Recogida en tienda</p>
                        {presupuesto.direccionEntrega.instrucciones && (
                          <p className="text-xs text-blue-700 mt-1">{presupuesto.direccionEntrega.instrucciones}</p>
                        )}
                      </div>
                    </div>
                  ) : presupuesto.direccionEntrega.calle ? (
                    <div className="space-y-2">
                      <address className="not-italic text-sm">
                        {presupuesto.direccionEntrega.nombre && (
                          <p className="font-medium">{presupuesto.direccionEntrega.nombre}</p>
                        )}
                        <p>{presupuesto.direccionEntrega.calle} {presupuesto.direccionEntrega.numero}</p>
                        {presupuesto.direccionEntrega.piso && <p>{presupuesto.direccionEntrega.piso}</p>}
                        <p>{presupuesto.direccionEntrega.codigoPostal} {presupuesto.direccionEntrega.ciudad}</p>
                        {presupuesto.direccionEntrega.provincia && (
                          <p>{presupuesto.direccionEntrega.provincia}, {presupuesto.direccionEntrega.pais || 'España'}</p>
                        )}
                      </address>
                      {(presupuesto.direccionEntrega.personaContacto || presupuesto.direccionEntrega.telefonoContacto) && (
                        <div className="pt-2 border-t text-sm">
                          {presupuesto.direccionEntrega.personaContacto && (
                            <p><span className="text-muted-foreground">Contacto:</span> {presupuesto.direccionEntrega.personaContacto}</p>
                          )}
                          {presupuesto.direccionEntrega.telefonoContacto && (
                            <p><span className="text-muted-foreground">Tel:</span> {presupuesto.direccionEntrega.telefonoContacto}</p>
                          )}
                        </div>
                      )}
                      {presupuesto.direccionEntrega.horarioEntrega && (
                        <p className="text-xs text-muted-foreground pt-1 border-t">
                          Horario: {presupuesto.direccionEntrega.horarioEntrega}
                        </p>
                      )}
                      {presupuesto.direccionEntrega.instrucciones && (
                        <p className="text-xs bg-amber-50 p-2 rounded border border-amber-200 text-amber-800">
                          {presupuesto.direccionEntrega.instrucciones}
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

            {/* Información del sistema */}
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
                  <span className="text-muted-foreground">Número</span>
                  <span className="font-mono">{presupuesto.numero || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versión</span>
                  <span>{presupuesto.version || 1}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Diálogo de opciones de impresión / email */}
      <Dialog open={showPrintOptionsDialog} onOpenChange={setShowPrintOptionsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {printOptionsMode === 'email' ? (
                <>
                  <Mail className="h-5 w-5" />
                  Opciones del PDF para Email
                </>
              ) : (
                <>
                  <Printer className="h-5 w-5" />
                  Opciones de Impresión
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {printOptionsMode === 'email'
                ? 'Personaliza qué información se incluirá en el PDF adjunto'
                : 'Personaliza cómo se imprimirá el presupuesto'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Descripción de productos */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Descripción de productos</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={printOptions.mostrarDescripcion === 'ninguna' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrintOptions(prev => ({ ...prev, mostrarDescripcion: 'ninguna' }))}
                  className="w-full"
                >
                  Ninguna
                </Button>
                <Button
                  type="button"
                  variant={printOptions.mostrarDescripcion === 'corta' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrintOptions(prev => ({ ...prev, mostrarDescripcion: 'corta' }))}
                  className="w-full"
                >
                  Corta
                </Button>
                <Button
                  type="button"
                  variant={printOptions.mostrarDescripcion === 'larga' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPrintOptions(prev => ({ ...prev, mostrarDescripcion: 'larga' }))}
                  className="w-full"
                >
                  Completa
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {printOptions.mostrarDescripcion === 'ninguna' && 'Solo se mostrará el nombre del producto'}
                {printOptions.mostrarDescripcion === 'corta' && 'Descripción truncada a 100 caracteres'}
                {printOptions.mostrarDescripcion === 'larga' && 'Descripción completa del producto'}
              </p>
            </div>

            <Separator />

            {/* Otras opciones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="mostrarReferencias" className="cursor-pointer">
                  Mostrar referencias (SKU)
                </Label>
                <Switch
                  id="mostrarReferencias"
                  checked={printOptions.mostrarReferencias}
                  onCheckedChange={(checked) => setPrintOptions(prev => ({ ...prev, mostrarReferencias: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mostrarCondiciones" className="cursor-pointer">
                  Mostrar condiciones comerciales
                </Label>
                <Switch
                  id="mostrarCondiciones"
                  checked={printOptions.mostrarCondiciones}
                  onCheckedChange={(checked) => setPrintOptions(prev => ({ ...prev, mostrarCondiciones: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mostrarFirmas" className="cursor-pointer">
                  Mostrar espacio para firmas
                </Label>
                <Switch
                  id="mostrarFirmas"
                  checked={printOptions.mostrarFirmas}
                  onCheckedChange={(checked) => setPrintOptions(prev => ({ ...prev, mostrarFirmas: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="mostrarCuentaBancaria" className="cursor-pointer">
                  Mostrar datos bancarios
                </Label>
                <Switch
                  id="mostrarCuentaBancaria"
                  checked={printOptions.mostrarCuentaBancaria}
                  onCheckedChange={(checked) => setPrintOptions(prev => ({ ...prev, mostrarCuentaBancaria: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mostrarLOPD" className="cursor-pointer">
                  Mostrar texto LOPD/RGPD
                </Label>
                <Switch
                  id="mostrarLOPD"
                  checked={printOptions.mostrarLOPD}
                  onCheckedChange={(checked) => setPrintOptions(prev => ({ ...prev, mostrarLOPD: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mostrarRegistroMercantil" className="cursor-pointer">
                  Mostrar registro mercantil
                </Label>
                <Switch
                  id="mostrarRegistroMercantil"
                  checked={printOptions.mostrarRegistroMercantil}
                  onCheckedChange={(checked) => setPrintOptions(prev => ({ ...prev, mostrarRegistroMercantil: checked }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPrintOptionsDialog(false)}>
              Cancelar
            </Button>
            {printOptionsMode === 'email' ? (
              <Button onClick={handleConfirmEnviarEmail} disabled={isSendingEmail}>
                <Mail className="mr-2 h-4 w-4" />
                {isSendingEmail ? 'Enviando...' : 'Enviar Email'}
              </Button>
            ) : (
              <Button onClick={handleConfirmPrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el presupuesto <span className="font-semibold">{presupuesto.codigo}</span>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar presupuesto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vista oculta para impresión */}
      {showPrintView && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-auto print:relative print:inset-auto print:z-auto">
          <div className="no-print absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintView(false)}
            >
              Cerrar vista previa
            </Button>
          </div>
          <PresupuestoPrintView
            ref={printRef}
            presupuesto={presupuesto}
            empresa={empresa}
            options={printOptions}
          />
        </div>
      )}

      {/* Diálogo de importar líneas */}
      <ImportarLineasDialog
        open={showImportarLineas}
        onOpenChange={setShowImportarLineas}
        presupuestoId={presupuesto._id}
        onImportado={loadPresupuesto}
      />
    </DashboardLayout>
  )
}
