'use client'

import React, { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useReactToPrint } from 'react-to-print'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { facturasService } from '@/services/facturas.service'
import { empresaService, EmpresaInfo } from '@/services/empresa.service'
import { verifactuService } from '@/services/verifactu.service'
import {
  IFactura,
  EstadoFactura,
  getEstadoConfig,
  getTipoFacturaLabel,
  getMetodoPagoLabel,
  getSistemaFiscalLabel,
  getTipoLineaLabel,
  estaVencida,
  diasHastaVencimiento,
  MetodoPago,
  METODOS_PAGO,
  ESTADOS_FACTURA,
} from '@/types/factura.types'
import { FacturaPrintView, PrintOptions, defaultPrintOptions } from '@/components/facturas/FacturaPrintView'
import { FacturaHistorial } from '@/components/facturas/FacturaHistorial'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Send,
  QrCode,
  Euro,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  CreditCard,
  Ban,
  Printer,
  Mail,
  Copy,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  MessageCircle,
  User,
  Check,
  AtSign,
  Phone,
  Hash,
  Shield,
  ShoppingCart,
  Banknote,
  Timer,
  Truck,
  MapPin,
  Package,
  FileCheck,
  Receipt,
  Landmark,
  Loader2,
  Layers,
  Fingerprint,
} from 'lucide-react'
import { toast } from 'sonner'
import { FirmasDocumento } from '@/components/firmas/FirmasDocumento'
import { SolicitarFirmaModal } from '@/components/firmas/SolicitarFirmaModal'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function FacturaDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [factura, setFactura] = useState<IFactura | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaInfo | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [qrData, setQrData] = useState<{ codigoQR: string; urlVerificacion: string } | null>(null)
  const [mostrarCostes, setMostrarCostes] = useState(true)

  // Estados de diálogos
  const [emitirDialogOpen, setEmitirDialogOpen] = useState(false)
  const [cobroDialogOpen, setCobroDialogOpen] = useState(false)
  const [anularDialogOpen, setAnularDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [firmaDialogOpen, setFirmaDialogOpen] = useState(false)
  const [showPrintView, setShowPrintView] = useState(false)
  const [showPrintOptionsDialog, setShowPrintOptionsDialog] = useState(false)
  const [printOptionsMode, setPrintOptionsMode] = useState<'print' | 'email'>('print')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [printOptions, setPrintOptions] = useState<PrintOptions>(defaultPrintOptions)
  const [expandedKits, setExpandedKits] = useState<Set<number>>(new Set())

  // Estado para envío a Hacienda (VeriFactu)
  const [enviarHaciendaDialogOpen, setEnviarHaciendaDialogOpen] = useState(false)
  const [isEnviandoHacienda, setIsEnviandoHacienda] = useState(false)
  const [entornoVeriFactu, setEntornoVeriFactu] = useState<'test' | 'production'>('test')

  const printRef = useRef<HTMLDivElement>(null)

  // Estado del formulario de cobro
  const [cobroData, setCobroData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    importe: 0,
    metodoPago: MetodoPago.TRANSFERENCIA,
    referencia: '',
  })

  // Estado del formulario de anulación
  const [anularData, setAnularData] = useState({
    motivo: '',
    crearRectificativa: true,
  })

  // Hook para imprimir
  const handlePrintDocument = useReactToPrint({
    contentRef: printRef,
    documentTitle: factura ? `Factura_${factura.codigo}` : 'Factura',
    onAfterPrint: () => setShowPrintView(false),
  })

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================

  useEffect(() => {
    loadFactura()
    loadEmpresa()
  }, [resolvedParams.id])

  const loadFactura = async () => {
    try {
      setLoading(true)
      const response = await facturasService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setFactura(response.data)
        setCobroData(prev => ({
          ...prev,
          importe: response.data!.importePendiente,
        }))
        setMostrarCostes(response.data.mostrarCostes !== false)
      } else {
        toast.error('Factura no encontrada')
        router.push('/facturas')
      }
    } catch (error) {
      console.error('Error cargando factura:', error)
      toast.error('Error al cargar la factura')
    } finally {
      setLoading(false)
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

  const loadQR = async () => {
    try {
      const response = await facturasService.getQR(resolvedParams.id)
      if (response.success && response.data) {
        setQrData(response.data)
      }
    } catch (error) {
      console.error('Error cargando QR:', error)
    }
  }

  // ============================================
  // FUNCIONES DE ACCIONES
  // ============================================

  const handleEmitir = async () => {
    try {
      const response = await facturasService.emitir(resolvedParams.id)
      if (response.success) {
        toast.success('Factura emitida correctamente')
        loadFactura()
        loadQR()
        setEmitirDialogOpen(false)
      } else {
        toast.error(response.error || 'Error al emitir')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al emitir factura'
      toast.error(errorMessage)
    }
  }

  const handleRegistrarCobro = async () => {
    try {
      const response = await facturasService.registrarCobro(resolvedParams.id, cobroData)
      if (response.success) {
        toast.success('Cobro registrado correctamente')
        loadFactura()
        setCobroDialogOpen(false)
      } else {
        toast.error(response.error || 'Error al registrar cobro')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar cobro'
      toast.error(errorMessage)
    }
  }

  const handleAnular = async () => {
    try {
      const response = await facturasService.anular(resolvedParams.id, anularData)
      if (response.success) {
        toast.success('Factura anulada correctamente')
        loadFactura()
        setAnularDialogOpen(false)
      } else {
        toast.error(response.error || 'Error al anular')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al anular factura'
      toast.error(errorMessage)
    }
  }

  const handleDuplicar = async () => {
    if (!factura) return

    try {
      const response = await facturasService.duplicar(resolvedParams.id)
      if (response.success && response.data) {
        toast.success('Factura duplicada correctamente')
        router.push(`/facturas/${response.data._id}/editar`)
      } else {
        toast.error(response.error || 'Error al duplicar')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al duplicar factura'
      toast.error(errorMessage)
    }
  }

  // Enviar factura a Hacienda (VeriFactu)
  const handleEnviarHacienda = async () => {
    if (!factura) return

    try {
      setIsEnviandoHacienda(true)
      toast.loading('Enviando factura a la AEAT...', { id: 'enviando-hacienda' })

      const response = await verifactuService.enviarFactura(factura._id, {
        entorno: entornoVeriFactu,
      })

      toast.dismiss('enviando-hacienda')

      if (response.success && response.data.exito) {
        toast.success(response.message || 'Factura enviada correctamente a la AEAT')
        if (response.data.csv) {
          toast.info(`CSV asignado: ${response.data.csv}`)
        }
        loadFactura()
        setEnviarHaciendaDialogOpen(false)
      } else {
        const errores = response.data.errores?.map(e => `${e.codigo}: ${e.descripcion}`).join('\n')
        toast.error(
          `Error al enviar factura: ${response.data.mensaje}${errores ? '\n' + errores : ''}`,
          { duration: 10000 }
        )
      }
    } catch (error: any) {
      toast.dismiss('enviando-hacienda')
      toast.error(error.response?.data?.error || 'Error al enviar factura a la AEAT')
    } finally {
      setIsEnviandoHacienda(false)
    }
  }

  const handleDelete = async () => {
    if (!factura) return

    try {
      await facturasService.delete(factura._id)
      toast.success('Factura eliminada correctamente')
      router.push('/facturas')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar factura')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleCambiarEstado = async (estado: EstadoFactura) => {
    if (!factura) return

    try {
      const response = await facturasService.cambiarEstado(resolvedParams.id, { estado })
      if (response.success && response.data) {
        setFactura(response.data)
        const estadoConfig = getEstadoConfig(estado)
        toast.success(`Estado cambiado a ${estadoConfig.label}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const showQR = async () => {
    if (!qrData) {
      await loadQR()
    }
    setQrDialogOpen(true)
  }

  // ============================================
  // FUNCIONES DE IMPRESIÓN / EMAIL
  // ============================================

  const handlePrint = () => {
    if (!factura) return
    setPrintOptionsMode('print')
    setShowPrintOptionsDialog(true)
  }

  const handleExportPDF = () => {
    if (!factura) return
    setPrintOptionsMode('print')
    setShowPrintOptionsDialog(true)
  }

  const handleConfirmPrint = () => {
    if (!factura) return
    setShowPrintOptionsDialog(false)

    // Construir URL con opciones de impresión
    const params = new URLSearchParams()
    params.set('desc', printOptions.mostrarDescripcion)
    if (!printOptions.mostrarReferencias) params.set('ref', 'false')
    if (!printOptions.mostrarCondiciones) params.set('cond', 'false')
    if (!printOptions.mostrarVencimientos) params.set('venc', 'false')
    if (!printOptions.mostrarLOPD) params.set('lopd', 'false')
    if (!printOptions.mostrarRegistroMercantil) params.set('reg', 'false')
    if (!printOptions.mostrarCuentaBancaria) params.set('banco', 'false')
    if (!printOptions.mostrarQR) params.set('qr', 'false')

    // Abrir en nueva ventana para permitir zoom nativo del navegador
    window.open(
      `/facturas/${resolvedParams.id}/imprimir?${params.toString()}`,
      '_blank',
      'width=900,height=700,menubar=yes,toolbar=yes,scrollbars=yes,resizable=yes'
    )
  }

  const handleEnviarEmail = () => {
    if (!factura) return

    const email = factura.clienteEmail
    if (!email) {
      toast.error('El cliente no tiene email configurado')
      return
    }

    setPrintOptionsMode('email')
    setShowPrintOptionsDialog(true)
  }

  const handleConfirmEnviarEmail = async () => {
    if (!factura) return

    setIsSendingEmail(true)
    setShowPrintOptionsDialog(false)

    try {
      toast.loading('Enviando email con PDF adjunto...', { id: 'sending-email' })

      const response = await facturasService.enviarPorEmail(resolvedParams.id, {
        pdfOptions: {
          mostrarDescripcion: printOptions.mostrarDescripcion,
          mostrarReferencias: printOptions.mostrarReferencias,
          mostrarCondiciones: printOptions.mostrarCondiciones,
          mostrarCuentaBancaria: printOptions.mostrarCuentaBancaria,
          mostrarLOPD: printOptions.mostrarLOPD,
          mostrarRegistroMercantil: printOptions.mostrarRegistroMercantil,
        },
      })

      toast.dismiss('sending-email')

      if (response.success) {
        toast.success('Email con PDF enviado correctamente')
        loadFactura()
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
    if (!factura) return

    const telefono = factura.clienteTelefono?.replace(/\s/g, '').replace(/[^0-9]/g, '')
    if (!telefono) {
      toast.error('El cliente no tiene teléfono configurado')
      return
    }

    let telefonoWA = telefono
    if (!telefono.startsWith('34') && telefono.length === 9) {
      telefonoWA = '34' + telefono
    }

    const mensaje = encodeURIComponent(
      `Hola ${factura.clienteNombre},\n\n` +
      `Le enviamos la factura *${factura.codigo}* por un importe de *${formatCurrency(factura.totales?.totalFactura || 0)}*.\n\n` +
      `Fecha de vencimiento: ${factura.fechaVencimiento ? formatDate(factura.fechaVencimiento) : 'No especificada'}\n\n` +
      `Quedamos a su disposición para cualquier consulta.`
    )

    window.open(`https://wa.me/${telefonoWA}?text=${mensaje}`, '_blank')
  }

  // ============================================
  // FUNCIONES DE FORMATO
  // ============================================

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

  // Toggle para expandir/contraer kits
  const toggleKit = (index: number) => {
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

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando factura...</p>
          </div>
        </div>
      
    )
  }

  if (!factura) {
    return (
      
        <div className="text-center py-12">
          <p className="text-muted-foreground">Factura no encontrada</p>
        </div>
      
    )
  }

  const estadoConfig = getEstadoConfig(factura.estado)
  const vencida = estaVencida(factura)
  const diasVenc = diasHastaVencimiento(factura.fechaVencimiento)

  const clienteNombre = typeof factura.clienteId === 'object'
    ? factura.clienteId.nombre
    : factura.clienteNombre

  const agenteNombre = typeof factura.agenteComercialId === 'object'
    ? `${factura.agenteComercialId.nombre} ${factura.agenteComercialId.apellidos}`
    : undefined

  const proyectoNombre = typeof factura.proyectoId === 'object'
    ? factura.proyectoId.nombre
    : undefined

  // Calcular porcentaje cobrado
  const porcentajeCobrado = factura.totales?.totalFactura > 0
    ? Math.round((factura.importeCobrado / factura.totales.totalFactura) * 100)
    : 0

  return (
      <>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link href="/facturas">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight">
                      {factura.codigo}
                    </h1>
                    <Badge className={estadoConfig.color}>
                      <span className={`w-2 h-2 rounded-full ${estadoConfig.dotColor} mr-1.5`} />
                      {estadoConfig.label}
                    </Badge>
                    {factura.esRectificativa && (
                      <Badge variant="outline">Rectificativa</Badge>
                    )}
                    {factura.inmutable && (
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Emitida
                      </Badge>
                    )}
                    {vencida && factura.estado !== EstadoFactura.COBRADA && factura.estado !== EstadoFactura.ANULADA && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Vencida
                      </Badge>
                    )}
                  </div>
                  {factura.titulo && (
                    <p className="text-lg text-muted-foreground mt-1">{factura.titulo}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(factura.fecha)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {clienteNombre}
                    </span>
                    <span className="flex items-center gap-1">
                      <Receipt className="h-4 w-4" />
                      {getTipoFacturaLabel(factura.tipo)}
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

                  {/* Editar - solo si es borrador */}
                  {factura.estado === EstadoFactura.BORRADOR && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/facturas/${factura._id}/editar`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  )}

                  {/* Emitir - solo si es borrador */}
                  {factura.estado === EstadoFactura.BORRADOR && (
                    <Button size="sm" onClick={() => setEmitirDialogOpen(true)}>
                      <Send className="mr-2 h-4 w-4" />
                      Emitir
                    </Button>
                  )}

                  {/* Registrar cobro - si está emitida y tiene pendiente */}
                  {factura.inmutable && factura.importePendiente > 0 && (
                    <Button size="sm" onClick={() => setCobroDialogOpen(true)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Cobrar
                    </Button>
                  )}

                  {/* Enviar a Hacienda - si está emitida y no se ha enviado aún O si fue rechazado */}
                  {factura.inmutable && (!factura.verifactu?.estadoEnvio || factura.verifactu?.estadoEnvio === 'pendiente' || factura.verifactu?.estadoEnvio === 'rechazado') && (
                    <Button
                      size="sm"
                      variant={factura.verifactu?.estadoEnvio === 'rechazado' ? 'destructive' : 'outline'}
                      onClick={() => setEnviarHaciendaDialogOpen(true)}
                      className={factura.verifactu?.estadoEnvio === 'rechazado' ? '' : 'text-blue-600 border-blue-300 hover:bg-blue-50'}
                    >
                      <Landmark className="mr-2 h-4 w-4" />
                      {factura.verifactu?.estadoEnvio === 'rechazado' ? 'Reintentar envío AEAT' : 'Enviar a Hacienda'}
                    </Button>
                  )}

                  {/* Badge de estado VeriFactu si ya fue enviado */}
                  {factura.verifactu?.estadoEnvio && factura.verifactu.estadoEnvio !== 'pendiente' && factura.verifactu.estadoEnvio !== 'rechazado' && (
                    <Badge
                      variant={factura.verifactu.estadoEnvio === 'enviado' || factura.verifactu.estadoEnvio === 'aceptado' ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      <Landmark className="h-3 w-3" />
                      AEAT: {factura.verifactu.estadoEnvio === 'aceptado' ? 'Aceptado' : factura.verifactu.estadoEnvio}
                    </Badge>
                  )}

                  {/* Cambiar estado - Dropdown con todos los estados */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <span className={`w-2 h-2 rounded-full mr-2 ${estadoConfig.dotColor || 'bg-gray-400'}`} />
                        Estado
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Cambiar estado a:</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {ESTADOS_FACTURA.map((estado) => {
                        const config = getEstadoConfig(estado.value)
                        const isCurrentState = factura.estado === estado.value
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
                      {factura.codigoQR && (
                        <DropdownMenuItem onClick={showQR}>
                          <QrCode className="mr-2 h-4 w-4" />
                          Ver código QR
                        </DropdownMenuItem>
                      )}
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
                      <DropdownMenuItem onClick={() => setFirmaDialogOpen(true)}>
                        <Fingerprint className="mr-2 h-4 w-4" />
                        Solicitar Firma
                      </DropdownMenuItem>
                      {factura.estado !== EstadoFactura.ANULADA && (
                        <DropdownMenuItem
                          className="text-orange-600 focus:text-orange-600"
                          onClick={() => setAnularDialogOpen(true)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Anular factura
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {factura.estado === EstadoFactura.BORRADOR && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setShowDeleteDialog(true)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerta de rechazo AEAT */}
        {factura.verifactu?.estadoEnvio === 'rechazado' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>AEAT ha rechazado esta factura</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">
                <strong>Error:</strong> {factura.verifactu.mensajeRespuesta || 'Error desconocido'}
              </p>
              {factura.verifactu.codigoRespuesta && (
                <p className="text-xs opacity-80">Código: {factura.verifactu.codigoRespuesta}</p>
              )}
              <p className="mt-2 text-sm">
                La factura está emitida pero el envío a la AEAT falló. Puedes reintentar el envío con el botón &quot;Reintentar envío AEAT&quot;.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Resumen en cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(factura.totales?.totalFactura || 0)}</div>
              <p className="text-sm text-muted-foreground">Total Factura</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(factura.importeCobrado)}</div>
              <p className="text-sm text-muted-foreground">Cobrado ({porcentajeCobrado}%)</p>
              {/* Barra de progreso */}
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${porcentajeCobrado}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${factura.importePendiente > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {formatCurrency(factura.importePendiente)}
              </div>
              <p className="text-sm text-muted-foreground">Pendiente de cobro</p>
            </CardContent>
          </Card>
          {mostrarCostes && (
            <Card>
              <CardContent className="pt-6">
                <div className={`text-2xl font-bold ${(factura.totales?.margenBruto || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(factura.totales?.margenBruto || 0)}
                  <span className="text-sm font-normal ml-2">
                    ({(factura.totales?.margenPorcentaje || 0).toFixed(1)}%)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Margen Bruto</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contenido principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna principal - Líneas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Líneas de factura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Líneas de Factura
                </CardTitle>
                <CardDescription>
                  {factura.lineas?.length || 0} líneas
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
                        <th className="px-3 py-3 text-center w-16">IVA</th>
                        <th className="px-3 py-3 text-right w-28">Subtotal</th>
                        {mostrarCostes && (
                          <th className="px-3 py-3 text-right w-24 text-green-600">Margen</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(factura.lineas || []).map((linea, index) => (
                        <React.Fragment key={linea._id || index}>
                          <tr className="border-b hover:bg-muted/30">
                            <td className="px-3 py-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  {/* Botón expandir/contraer para kits */}
                                  {linea.tipo === 'kit' && linea.componentesKit && linea.componentesKit.length > 0 && (
                                    <button
                                      onClick={() => toggleKit(index)}
                                      className="p-0.5 hover:bg-muted rounded"
                                    >
                                      {expandedKits.has(index) ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </button>
                                  )}
                                  <span className="font-medium">{linea.nombre}</span>
                                  {/* Badge de Kit */}
                                  {linea.tipo === 'kit' && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Layers className="h-3 w-3 mr-1" />
                                      Kit
                                    </Badge>
                                  )}
                                </div>
                                {/* Mostrar variante seleccionada */}
                                {linea.variante && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.entries(linea.variante.combinacion || {}).map(([attr, val]) => (
                                      <Badge key={attr} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                        {attr}: {String(val)}
                                      </Badge>
                                    ))}
                                    {linea.variante.sku && (
                                      <span className="text-xs text-muted-foreground">({linea.variante.sku})</span>
                                    )}
                                  </div>
                                )}
                                {linea.descripcion && (
                                  <div className="text-xs text-muted-foreground">{linea.descripcion}</div>
                                )}
                                {linea.codigo && (
                                  <div className="text-xs text-muted-foreground font-mono">{linea.codigo}</div>
                                )}
                                {linea.tipo !== 'kit' && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {getTipoLineaLabel(linea.tipo)}
                                  </Badge>
                                )}
                                {/* Indicador de cantidad de componentes del kit */}
                                {linea.tipo === 'kit' && linea.componentesKit && linea.componentesKit.length > 0 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    ({linea.componentesKit.length} componentes)
                                  </span>
                                )}
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
                            <td className="px-3 py-3 text-center">{linea.iva}%</td>
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
                          {/* Filas de componentes del kit - expandibles */}
                          {linea.tipo === 'kit' && linea.componentesKit && linea.componentesKit.length > 0 && expandedKits.has(index) && (
                            linea.componentesKit.map((componente: any, compIndex: number) => (
                              <tr key={`${linea._id}-comp-${compIndex}`} className="bg-muted/20 border-b text-sm">
                                <td className="px-3 py-2 pl-8">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">└</span>
                                    <div>
                                      {componente.sku && (
                                        <span className="text-xs text-muted-foreground font-mono mr-2">{componente.sku}</span>
                                      )}
                                      <span className="text-muted-foreground">{componente.nombre}</span>
                                      {componente.opcional && (
                                        <Badge variant="outline" className="text-xs ml-2">Opcional</Badge>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right text-muted-foreground">
                                  {componente.cantidad * linea.cantidad}
                                </td>
                                <td className="px-3 py-2 text-right text-muted-foreground">
                                  {formatCurrency(componente.precioUnitario)}
                                </td>
                                {mostrarCostes && (
                                  <td className="px-3 py-2 text-right text-blue-400">
                                    {formatCurrency(componente.costeUnitario)}
                                  </td>
                                )}
                                <td className="px-3 py-2 text-right text-muted-foreground">
                                  {componente.descuento > 0 ? `${componente.descuento}%` : '-'}
                                </td>
                                <td className="px-3 py-2 text-center text-muted-foreground">{componente.iva}%</td>
                                <td className="px-3 py-2 text-right text-muted-foreground">
                                  {formatCurrency(componente.subtotal * linea.cantidad)}
                                </td>
                                {mostrarCostes && <td className="px-3 py-2"></td>}
                              </tr>
                            ))
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
                          {formatCurrency(factura.totales?.subtotalNeto || 0)}
                        </td>
                        {mostrarCostes && <td></td>}
                      </tr>
                      {factura.totales?.desgloseIva?.map((iva, index) => (
                        <tr key={index}>
                          <td colSpan={mostrarCostes ? 6 : 5} className="px-3 py-1 text-right text-sm">
                            IVA {iva.tipo}% (Base: {formatCurrency(iva.base)}):
                          </td>
                          <td className="px-3 py-1 text-right">
                            {formatCurrency(iva.cuota)}
                          </td>
                          {mostrarCostes && <td></td>}
                        </tr>
                      ))}
                      {factura.totales?.totalRecargoEquivalencia > 0 && (
                        <tr>
                          <td colSpan={mostrarCostes ? 6 : 5} className="px-3 py-1 text-right text-sm">
                            Recargo Equivalencia:
                          </td>
                          <td className="px-3 py-1 text-right">
                            {formatCurrency(factura.totales.totalRecargoEquivalencia)}
                          </td>
                          {mostrarCostes && <td></td>}
                        </tr>
                      )}
                      {factura.importeRetencion && factura.importeRetencion > 0 && (
                        <tr>
                          <td colSpan={mostrarCostes ? 6 : 5} className="px-3 py-1 text-right text-sm text-orange-600">
                            Retención IRPF ({factura.retencionIRPF}%):
                          </td>
                          <td className="px-3 py-1 text-right text-orange-600">
                            -{formatCurrency(factura.importeRetencion)}
                          </td>
                          {mostrarCostes && <td></td>}
                        </tr>
                      )}
                      <tr className="text-lg">
                        <td colSpan={mostrarCostes ? 6 : 5} className="px-3 py-3 text-right font-bold">
                          TOTAL:
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-primary">
                          {formatCurrency(factura.totales?.totalFactura || 0)}
                        </td>
                        {mostrarCostes && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Vencimientos */}
            {factura.vencimientos && factura.vencimientos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Vencimientos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {factura.vencimientos.map((venc, index) => (
                      <div
                        key={venc._id || index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          venc.cobrado
                            ? 'bg-green-50 border border-green-200'
                            : new Date(venc.fecha) < new Date()
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            venc.cobrado ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {venc.cobrado ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium">Vencimiento {venc.numero}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(venc.fecha)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(venc.importe)}</p>
                          <p className="text-xs text-muted-foreground">
                            {getMetodoPagoLabel(venc.metodoPago)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observaciones */}
            {factura.observaciones && (
              <Card>
                <CardHeader>
                  <CardTitle>Observaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{factura.observaciones}</p>
                </CardContent>
              </Card>
            )}

            {/* Historial y Cobros */}
            <FacturaHistorial
              historial={factura.historial || []}
              cobros={factura.cobros || []}
              contadorEnvios={factura.fechaEnvio ? 1 : 0}
              fechaEnvio={factura.fechaEnvio}
              fechaCreacion={factura.fechaCreacion}
              importeCobrado={factura.importeCobrado}
              importePendiente={factura.importePendiente}
              totalFactura={factura.totales?.totalFactura || 0}
            />
          </div>

          {/* Columna lateral - Info */}
          <div className="space-y-6">
            {/* Estado de la Factura */}
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
                    {factura.fechaVencimiento && (
                      <p className={`text-xs ${vencida ? 'text-destructive' : diasVenc <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {vencida
                          ? `Vencida hace ${Math.abs(diasVenc)} días`
                          : diasVenc === 0
                          ? 'Vence hoy'
                          : `Vence en ${diasVenc} días`}
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
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{clienteNombre}</p>
                    <p className="text-sm text-muted-foreground">{factura.clienteNif}</p>
                  </div>
                </div>
                {factura.clienteEmail && (
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${factura.clienteEmail}`} className="text-sm hover:underline text-primary">
                      {factura.clienteEmail}
                    </a>
                  </div>
                )}
                {factura.clienteTelefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${factura.clienteTelefono}`} className="text-sm hover:underline">
                      {factura.clienteTelefono}
                    </a>
                  </div>
                )}
                {factura.referenciaCliente && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ref. Cliente</p>
                      <p className="text-sm">{factura.referenciaCliente}</p>
                    </div>
                  </div>
                )}
                {factura.direccionFacturacion && factura.direccionFacturacion.calle && (
                  <div className="flex items-start gap-2 pt-2 border-t">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <address className="not-italic text-sm">
                      <p>{factura.direccionFacturacion.calle} {factura.direccionFacturacion.numero}</p>
                      {factura.direccionFacturacion.piso && <p>{factura.direccionFacturacion.piso}</p>}
                      <p>{factura.direccionFacturacion.codigoPostal} {factura.direccionFacturacion.ciudad}</p>
                      {factura.direccionFacturacion.provincia && (
                        <p>{factura.direccionFacturacion.provincia}</p>
                      )}
                    </address>
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
                    <p className="font-medium">{formatDate(factura.fecha)}</p>
                  </div>
                  {factura.fechaVencimiento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Vencimiento</p>
                      <p className={`font-medium ${vencida ? 'text-red-600' : ''}`}>
                        {formatDate(factura.fechaVencimiento)}
                      </p>
                    </div>
                  )}
                  {factura.fechaEnvio && (
                    <div>
                      <p className="text-xs text-muted-foreground">Enviada</p>
                      <p>{formatDate(factura.fechaEnvio)}</p>
                    </div>
                  )}
                  {factura.fechaOperacion && (
                    <div>
                      <p className="text-xs text-muted-foreground">Operación</p>
                      <p>{formatDate(factura.fechaOperacion)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Datos fiscales */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Datos Fiscales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sistema</span>
                  <span className="font-medium">{getSistemaFiscalLabel(factura.sistemaFiscal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serie</span>
                  <span className="font-mono">{factura.serie}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Número</span>
                  <span className="font-mono">{factura.numero}</span>
                </div>
                {factura.verifactu && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">ID VeriFactu</p>
                    <p className="text-xs font-mono break-all">{factura.verifactu.idFactura}</p>
                    <Badge
                      variant={factura.verifactu.estadoEnvio === 'aceptado' ? 'default' : factura.verifactu.estadoEnvio === 'rechazado' ? 'destructive' : 'secondary'}
                      className="mt-1"
                    >
                      {factura.verifactu.estadoEnvio === 'aceptado' ? 'Aceptado por AEAT' :
                       factura.verifactu.estadoEnvio === 'rechazado' ? 'Rechazado por AEAT' :
                       factura.verifactu.estadoEnvio}
                    </Badge>
                    {factura.verifactu.estadoEnvio === 'rechazado' && factura.verifactu.mensajeRespuesta && (
                      <p className="text-xs text-destructive mt-1">{factura.verifactu.mensajeRespuesta}</p>
                    )}
                  </div>
                )}
                {factura.ticketbai && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">ID TicketBAI</p>
                    <p className="text-xs font-mono break-all">{factura.ticketbai.tbaiId}</p>
                    <Badge
                      variant={factura.ticketbai.estadoEnvio === 'aceptado' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {factura.ticketbai.estadoEnvio}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR si está emitida */}
            {factura.codigoQR && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Código QR
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <img
                    src={factura.codigoQR}
                    alt="Código QR de verificación"
                    className="w-32 h-32"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Escanea para verificar la factura
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Firmas digitales */}
            <FirmasDocumento
              tipoDocumento="factura"
              documentoId={factura._id}
              codigoDocumento={factura.codigo || factura.numero || `FAC-${factura._id.slice(-6)}`}
            />

            {/* Relaciones */}
            {(agenteNombre || proyectoNombre || factura.albaranesOrigen?.length) && (
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
                  {factura.albaranesOrigen && factura.albaranesOrigen.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Albaranes origen</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {factura.albaranesOrigen.map((alb, index) => {
                            const codigo = typeof alb === 'object' ? alb.codigo : alb
                            return (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {codigo}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {factura.tags && factura.tags.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Etiquetas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {factura.tags.map((tag, index) => (
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
                  <span className="text-muted-foreground">Creada</span>
                  <span>{new Date(factura.fechaCreacion).toLocaleString('es-ES')}</span>
                </div>
                {factura.fechaModificacion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modificada</span>
                    <span>{new Date(factura.fechaModificacion).toLocaleString('es-ES')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground">Inmutable</span>
                  <span>{factura.inmutable ? 'Sí' : 'No'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Diálogo de emitir */}
      <Dialog open={emitirDialogOpen} onOpenChange={setEmitirDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir factura</DialogTitle>
            <DialogDescription>
              Al emitir la factura se generarán los datos fiscales (VeriFactu/TicketBAI) y la factura
              se convertirá en <strong>INMUTABLE</strong>. No podrá ser modificada después.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Se generará el código QR de verificación fiscal.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmitirDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEmitir}>
              <Send className="h-4 w-4 mr-2" />
              Emitir factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cobro */}
      <Dialog open={cobroDialogOpen} onOpenChange={setCobroDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar cobro</DialogTitle>
            <DialogDescription>
              Pendiente de cobro: {formatCurrency(factura.importePendiente)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={cobroData.fecha}
                  onChange={(e) => setCobroData(prev => ({ ...prev, fecha: e.target.value }))}
                />
              </div>
              <div>
                <Label>Importe</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cobroData.importe}
                  onChange={(e) => setCobroData(prev => ({ ...prev, importe: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label>Método de pago</Label>
              <Select
                value={cobroData.metodoPago}
                onValueChange={(value) => setCobroData(prev => ({ ...prev, metodoPago: value as MetodoPago }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map(metodo => (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Referencia (opcional)</Label>
              <Input
                value={cobroData.referencia}
                onChange={(e) => setCobroData(prev => ({ ...prev, referencia: e.target.value }))}
                placeholder="Número de transferencia, cheque, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCobroDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarCobro}>
              <CreditCard className="h-4 w-4 mr-2" />
              Registrar cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de anular */}
      <Dialog open={anularDialogOpen} onOpenChange={setAnularDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular factura</DialogTitle>
            <DialogDescription>
              {factura.inmutable
                ? 'Al estar emitida, se creará una factura rectificativa para anular los importes.'
                : 'La factura será marcada como anulada.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Motivo de anulación *</Label>
              <Input
                value={anularData.motivo}
                onChange={(e) => setAnularData(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Indica el motivo de la anulación"
              />
            </div>
            {factura.inmutable && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="crearRectificativa"
                  checked={anularData.crearRectificativa}
                  onChange={(e) => setAnularData(prev => ({ ...prev, crearRectificativa: e.target.checked }))}
                />
                <Label htmlFor="crearRectificativa">Crear factura rectificativa automáticamente</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnularDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleAnular} disabled={!anularData.motivo}>
              <Ban className="h-4 w-4 mr-2" />
              Anular factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo QR */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR de verificación</DialogTitle>
            <DialogDescription>
              Escanea este código para verificar la autenticidad de la factura
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {qrData?.codigoQR ? (
              <img
                src={qrData.codigoQR}
                alt="Código QR"
                className="w-64 h-64"
              />
            ) : factura.codigoQR ? (
              <img
                src={factura.codigoQR}
                alt="Código QR"
                className="w-64 h-64"
              />
            ) : (
              <p>Cargando QR...</p>
            )}
            {(qrData?.urlVerificacion || factura.urlVerificacion) && (
              <p className="text-xs text-muted-foreground mt-2 text-center break-all">
                {qrData?.urlVerificacion || factura.urlVerificacion}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de enviar a Hacienda (VeriFactu) */}
      <Dialog open={enviarHaciendaDialogOpen} onOpenChange={setEnviarHaciendaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Enviar factura a la AEAT
            </DialogTitle>
            <DialogDescription>
              Se enviará la factura al sistema VeriFactu de la Agencia Tributaria.
              Esta operación es irreversible y quedará registrada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Información de la factura */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Factura:</span>
                <span className="font-medium">{factura.codigo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Importe:</span>
                <span className="font-medium">{formatCurrency(factura.totales?.totalFactura || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{factura.clienteNombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">NIF:</span>
                <span className="font-medium">{factura.clienteNif || 'Sin NIF'}</span>
              </div>
            </div>

            {/* Selector de entorno */}
            <div className="space-y-2">
              <Label>Entorno de envío</Label>
              <Select
                value={entornoVeriFactu}
                onValueChange={(value) => setEntornoVeriFactu(value as 'test' | 'production')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Pruebas (Test)
                    </div>
                  </SelectItem>
                  <SelectItem value="production">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Producción (Real)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {entornoVeriFactu === 'test'
                  ? 'El envío se realizará al entorno de pruebas de la AEAT. No tiene validez fiscal.'
                  : 'El envío se realizará al sistema REAL de la AEAT. Esta acción tiene validez fiscal.'}
              </p>
            </div>

            {/* Advertencia de producción */}
            {entornoVeriFactu === 'production' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Atención:</strong> Estás a punto de enviar esta factura al sistema REAL de Hacienda.
                    Asegúrate de que todos los datos son correctos.
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEnviarHaciendaDialogOpen(false)}
              disabled={isEnviandoHacienda}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarHacienda}
              disabled={isEnviandoHacienda}
              className={entornoVeriFactu === 'production' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isEnviandoHacienda ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Landmark className="mr-2 h-4 w-4" />
                  Enviar a AEAT
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                : 'Personaliza cómo se imprimirá la factura'}
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
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la factura <span className="font-semibold">{factura.codigo}</span>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar factura
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
          <FacturaPrintView
            ref={printRef}
            factura={factura}
            empresa={empresa}
            options={printOptions}
          />
        </div>
      )}

      {/* Modal solicitar firma */}
      <SolicitarFirmaModal
        tipoDocumento="factura"
        documentoId={factura._id}
        codigoDocumento={factura.codigo || factura.numero || `FAC-${factura._id.slice(-6)}`}
        open={firmaDialogOpen}
        onClose={() => setFirmaDialogOpen(false)}
      />
      </>
  )
}
