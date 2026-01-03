"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CreditCard,
  Clock,
  AlertTriangle,
  Check,
  ArrowUpRight,
  Download,
  Plus,
  Users,
  FileText,
  Package,
  HardDrive,
  Building2,
  Zap,
  Monitor,
  Smartphone,
  Tablet,
  Activity,
  RefreshCw,
  Loader2,
  Trash2,
  MoreVertical,
  CalendarOff,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useLicense } from '@/hooks/useLicense'
import { billingService, IPlan, IAddOn } from '@/services/billing.service'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Componente de barra de uso
function UsageBar({ label, used, limit, icon: Icon }: {
  label: string
  used: number
  limit: number
  icon: React.ElementType
}) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const isWarning = percentage >= 80
  const isCritical = percentage >= 95

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
        <span className={`font-medium ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-900'}`}>
          {used.toLocaleString()}{isUnlimited ? '' : ` / ${limit.toLocaleString()}`}
          {isUnlimited && <span className="text-slate-400 text-xs ml-1">(ilimitado)</span>}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-2 ${isCritical ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-amber-500' : ''}`}
        />
      )}
    </div>
  )
}

// Modal de cambio de plan
function ChangePlanModal({ currentPlan, onPlanChange }: {
  currentPlan: IPlan | null
  onPlanChange: () => void
}) {
  const [planes, setPlanes] = useState<IPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const response = await billingService.getPlanes()
        if (response.success && response.data) {
          setPlanes(response.data.filter(p => p.visible))
        }
      } catch (error) {
        console.error('Error al cargar planes:', error)
      }
    }
    if (open) fetchPlanes()
  }, [open])

  const handleSelectPlan = async (planSlug: string) => {
    setLoading(true)
    try {
      // Por ahora redirigimos al checkout
      window.location.href = `/checkout?plan=${planSlug}&tipo=mensual`
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          Cambiar plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cambiar de plan</DialogTitle>
          <DialogDescription>
            Selecciona el plan que mejor se adapte a tus necesidades
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {planes.map((plan) => (
            <Card
              key={plan._id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                currentPlan?.slug === plan.slug ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                <div className="mt-1">
                  <span className="text-2xl font-bold">{plan.precio.mensual}€</span>
                  <span className="text-slate-500">/mes</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-slate-600 mb-4">
                  <li>{plan.limites.usuariosTotales === -1 ? 'Usuarios ilimitados' : `${plan.limites.usuariosTotales} usuarios`}</li>
                  <li>{plan.limites.facturasMes === -1 ? 'Facturas ilimitadas' : `${plan.limites.facturasMes} facturas/mes`}</li>
                </ul>
                <Button
                  className="w-full"
                  variant={currentPlan?.slug === plan.slug ? 'secondary' : 'default'}
                  disabled={currentPlan?.slug === plan.slug || loading}
                  onClick={() => handleSelectPlan(plan.slug)}
                >
                  {currentPlan?.slug === plan.slug ? 'Plan actual' : 'Seleccionar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Interfaz para sesiones activas
interface SesionActiva {
  id: string
  usuario: {
    id: string
    nombre: string
    email: string
  } | null
  deviceInfo: string
  ipAddress: string
  createdAt: string
  expiresAt: string
}

export default function BillingPage() {
  const { license, plan, loading, isTrial, daysRemaining, warnings, refetch } = useLicense()
  const [metodoPago, setMetodoPago] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [sesionesActivas, setSesionesActivas] = useState<SesionActiva[]>([])
  const [totalSesiones, setTotalSesiones] = useState(0)
  const [loadingExtra, setLoadingExtra] = useState(true)

  // Estado de renovación automática
  const [renovacionAutomatica, setRenovacionAutomatica] = useState(true)
  const [fechaRenovacion, setFechaRenovacion] = useState<string | null>(null)
  const [pasarela, setPasarela] = useState<'stripe' | 'paypal' | null>(null)
  const [togglingRenovacion, setTogglingRenovacion] = useState(false)

  // Estado para cancelación de add-ons
  const [cancelingAddOn, setCancelingAddOn] = useState<string | null>(null)

  useEffect(() => {
    const fetchExtraData = async () => {
      try {
        const [metodoPagoRes, facturasRes, sesionesRes, renovacionRes] = await Promise.all([
          billingService.getMetodoPago().catch(() => ({ success: false, data: null })),
          billingService.getFacturasSuscripcion().catch(() => ({ success: false, data: [] })),
          billingService.getSesionesActivasEmpresa().catch(() => ({ success: false, data: { totalSesiones: 0, sesiones: [] } })),
          billingService.getEstadoRenovacion().catch(() => ({ success: false, data: null }))
        ])

        if (metodoPagoRes.success) setMetodoPago(metodoPagoRes.data)
        if (facturasRes.success) setHistorial(facturasRes.data || [])
        if (sesionesRes.success && sesionesRes.data) {
          setTotalSesiones(sesionesRes.data.totalSesiones)
          setSesionesActivas(sesionesRes.data.sesiones)
        }
        if (renovacionRes.success && renovacionRes.data) {
          setRenovacionAutomatica(renovacionRes.data.renovacionAutomatica)
          setFechaRenovacion(renovacionRes.data.fechaRenovacion)
          setPasarela(renovacionRes.data.pasarela)
        }
      } catch (error) {
        console.error('Error al cargar datos extra:', error)
      } finally {
        setLoadingExtra(false)
      }
    }

    if (license) fetchExtraData()
  }, [license])

  // Descargar factura PDF
  const handleDescargarFactura = async (facturaId: string, numeroFactura: string) => {
    try {
      const blob = await billingService.descargarFacturaPDF(facturaId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${numeroFactura}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Factura descargada correctamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al descargar factura')
    }
  }

  // Handler para toggle de renovación
  const handleToggleRenovacion = async (activar: boolean) => {
    setTogglingRenovacion(true)
    try {
      const response = await billingService.toggleRenovacionAutomatica(activar)
      if (response.success) {
        setRenovacionAutomatica(response.renovacionAutomatica ?? activar)
        toast.success(response.message || (activar ? 'Renovación automática activada' : 'Renovación automática desactivada'))
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar renovación')
      // Revertir el estado visual
      setRenovacionAutomatica(!activar)
    } finally {
      setTogglingRenovacion(false)
    }
  }

  // Handler para cancelar add-on
  const handleCancelAddOn = async (addOnSlug: string, cancelarAlRenovar: boolean = true) => {
    setCancelingAddOn(addOnSlug)
    try {
      const response = await billingService.removeAddOn(addOnSlug, cancelarAlRenovar)
      if (response.success) {
        toast.success(response.message || 'Add-on cancelado correctamente')
        // Refrescar datos de licencia
        refetch()
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar add-on')
    } finally {
      setCancelingAddOn(null)
    }
  }

  // Helper para icono de dispositivo
  const getDeviceIcon = (deviceInfo: string) => {
    const lower = deviceInfo.toLowerCase()
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return <Tablet className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  // Helper para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 lg:col-span-2" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    )
  }

  if (!license || !plan) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se pudo cargar la informacion de facturacion</h3>
              <p className="text-slate-500 mb-4">Por favor, intenta de nuevo mas tarde</p>
              <Button onClick={refetch}>Reintentar</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const estadoBadge = {
    trial: { label: 'Periodo de prueba', variant: 'outline' as const, className: 'bg-blue-50 text-blue-700 border-blue-200' },
    activa: { label: 'Activa', variant: 'outline' as const, className: 'bg-green-50 text-green-700 border-green-200' },
    suspendida: { label: 'Suspendida', variant: 'outline' as const, className: 'bg-amber-50 text-amber-700 border-amber-200' },
    cancelada: { label: 'Cancelada', variant: 'outline' as const, className: 'bg-slate-50 text-slate-700 border-slate-200' },
    expirada: { label: 'Expirada', variant: 'outline' as const, className: 'bg-red-50 text-red-700 border-red-200' },
  }

  const estado = estadoBadge[license.estado] || estadoBadge.activa

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturacion y suscripcion</h1>
          <p className="text-slate-500">Gestiona tu plan, metodo de pago y consulta tu historial</p>
        </div>

      {/* Advertencias */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Estado de suscripcion + Metodo de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de suscripcion */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tu suscripcion</CardTitle>
              <Badge variant={estado.variant} className={estado.className}>
                {estado.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Plan {plan.nombre}</h3>
                <p className="text-slate-500">
                  {isTrial ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {daysRemaining} dias restantes de prueba
                    </span>
                  ) : (
                    <span>
                      {plan.precio.mensual}€/mes
                      {license.tipoSuscripcion === 'anual' && ' (facturado anualmente)'}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <ChangePlanModal currentPlan={plan} onPlanChange={refetch} />
                {isTrial && (
                  <Link href="/checkout">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Zap className="h-4 w-4 mr-2" />
                      Activar plan
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <Separator />

            {/* Renovación automática */}
            {!isTrial && pasarela && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className={`h-5 w-5 ${renovacionAutomatica ? 'text-green-600' : 'text-slate-400'}`} />
                  <div>
                    <Label htmlFor="renovacion" className="text-sm font-medium text-slate-900">
                      Renovación automática
                    </Label>
                    <p className="text-xs text-slate-500">
                      {renovacionAutomatica
                        ? `Se renovará automáticamente el ${fechaRenovacion ? new Date(fechaRenovacion).toLocaleDateString('es-ES') : ''}`
                        : 'La suscripción se cancelará al final del período actual'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {togglingRenovacion && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  <Switch
                    id="renovacion"
                    checked={renovacionAutomatica}
                    onCheckedChange={handleToggleRenovacion}
                    disabled={togglingRenovacion}
                  />
                </div>
              </div>
            )}

            {/* Modulos incluidos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-700">Modulos incluidos</h4>
                <Link href="/checkout">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir módulos
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.modulosIncluidos.includes('*') ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">Todos los modulos</Badge>
                ) : (
                  <>
                    {plan.modulosIncluidos.map((modulo) => (
                      <Badge key={modulo} variant="outline" className="capitalize">
                        {modulo}
                      </Badge>
                    ))}
                    {/* Añadir módulos de add-ons activos */}
                    {license.addOns?.filter(a => a.activo).map((addon) => {
                      // Mapear slug de addon a módulo visible
                      const moduloNombre = addon.slug === 'rrhh' || addon.slug === 'rrhh-fichaje'
                        ? 'RRHH / Fichaje'
                        : addon.slug === 'tpv' || addon.slug === 'restauracion'
                          ? 'TPV / Restauración'
                          : addon.nombre
                      return (
                        <Badge key={addon.slug} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {moduloNombre}
                        </Badge>
                      )
                    })}
                  </>
                )}
              </div>

              {/* Add-ons contratados con detalles */}
              {license.addOns && license.addOns.filter(a => a.activo).length > 0 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-purple-800">Add-ons contratados</h4>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                      {license.addOns.filter(a => a.activo).length} activo{license.addOns.filter(a => a.activo).length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {license.addOns.filter(a => a.activo).map((addon) => (
                      <div key={addon.slug || addon.nombre} className="flex items-center justify-between p-3 bg-white rounded border border-purple-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-purple-900">{addon.nombre}</p>
                            {addon.cancelarAlRenovar && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                Se cancela al renovar
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-purple-600">
                            {addon.fechaActivacion
                              ? `Activado el ${new Date(addon.fechaActivacion).toLocaleDateString('es-ES')}`
                              : 'Activado'
                            }
                            {' • '}
                            <span className="text-purple-500">
                              {addon.cancelarAlRenovar
                                ? `Activo hasta ${fechaRenovacion ? new Date(fechaRenovacion).toLocaleDateString('es-ES') : 'próxima factura'}`
                                : `Renueva con el plan (${fechaRenovacion ? new Date(fechaRenovacion).toLocaleDateString('es-ES') : 'próxima factura'})`
                              }
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-semibold text-purple-800">
                              +{license.tipoSuscripcion === 'anual' && addon.precioMensual
                                ? (addon.precioMensual * 10).toFixed(0)
                                : addon.precioMensual}€
                            </span>
                            <span className="text-xs text-purple-600">/{license.tipoSuscripcion === 'anual' ? 'año' : 'mes'}</span>
                          </div>
                          {!addon.cancelarAlRenovar && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={cancelingAddOn === addon.slug}
                                >
                                  {cancelingAddOn === addon.slug ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-amber-600"
                                  onClick={() => handleCancelAddOn(addon.slug, true)}
                                >
                                  <CalendarOff className="h-4 w-4 mr-2" />
                                  No renovar
                                  <span className="text-xs text-slate-500 ml-2">(activo hasta renovación)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleCancelAddOn(addon.slug, false)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar ahora
                                  <span className="text-xs text-slate-500 ml-2">(con crédito prorrateado)</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-purple-600 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Todos los add-ons se renuevan junto con tu plan para simplificar la facturación
                  </p>
                </div>
              )}

              {/* Información de TPVs disponibles */}
              {(plan.limites.tpvsActivos > 0 || license.addOns?.some(a => a.slug === 'tpv' && a.activo)) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Terminales TPV</p>
                        <p className="text-xs text-blue-600">
                          {license?.usoActual?.tpvsActuales ?? 0} de {plan.limites.tpvsActivos} TPVs registrados
                        </p>
                      </div>
                    </div>
                    <Link href="/configuracion/tpv">
                      <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        Gestionar TPVs
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metodo de pago */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Metodo de pago</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingExtra ? (
              <Skeleton className="h-20" />
            ) : metodoPago ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-12 h-8 bg-gradient-to-r from-slate-700 to-slate-900 rounded flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {metodoPago.marca} •••• {metodoPago.ultimos4}
                  </p>
                  <p className="text-xs text-slate-500">Expira {metodoPago.expira}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">No hay metodo de pago</p>
              </div>
            )}
            <Button variant="outline" className="w-full mt-3">
              <Plus className="h-4 w-4 mr-2" />
              {metodoPago ? 'Cambiar tarjeta' : 'Agregar tarjeta'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Uso actual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uso actual</CardTitle>
          <CardDescription>Recursos utilizados de tu plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UsageBar
              label="Sesiones activas"
              used={totalSesiones}
              limit={plan?.limites?.usuariosSimultaneos ?? -1}
              icon={Activity}
            />
            <UsageBar
              label="Usuarios totales"
              used={license?.usoActual?.usuariosActuales ?? 0}
              limit={plan?.limites?.usuariosTotales ?? -1}
              icon={Users}
            />
            <UsageBar
              label="Facturas este mes"
              used={license?.usoActual?.facturasEsteMes ?? 0}
              limit={plan?.limites?.facturasMes ?? -1}
              icon={FileText}
            />
            <UsageBar
              label="Productos"
              used={license?.usoActual?.productosActuales ?? 0}
              limit={plan?.limites?.productosCatalogo ?? -1}
              icon={Package}
            />
            <UsageBar
              label="Almacenes"
              used={license?.usoActual?.almacenesActuales ?? 0}
              limit={plan?.limites?.almacenes ?? -1}
              icon={Building2}
            />
            <UsageBar
              label="Clientes"
              used={license?.usoActual?.clientesActuales ?? 0}
              limit={plan?.limites?.clientes ?? -1}
              icon={Users}
            />
            <UsageBar
              label="TPVs activos"
              used={license?.usoActual?.tpvsActuales ?? 0}
              limit={plan?.limites?.tpvsActivos ?? 0}
              icon={Monitor}
            />
            <UsageBar
              label="Almacenamiento"
              used={license?.usoActual?.almacenamientoUsadoGB ?? 0}
              limit={plan?.limites?.almacenamientoGB ?? -1}
              icon={HardDrive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sesiones activas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Sesiones activas</CardTitle>
              <CardDescription>Usuarios conectados simultaneamente</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {totalSesiones} activa{totalSesiones !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingExtra ? (
            <Skeleton className="h-32" />
          ) : sesionesActivas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Inicio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sesionesActivas.map((sesion) => (
                  <TableRow key={sesion.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sesion.usuario?.nombre || 'Usuario desconocido'}</p>
                        <p className="text-xs text-slate-500">{sesion.usuario?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(sesion.deviceInfo)}
                        <span className="text-sm truncate max-w-[200px]" title={sesion.deviceInfo}>
                          {sesion.deviceInfo.length > 30
                            ? sesion.deviceInfo.substring(0, 30) + '...'
                            : sesion.deviceInfo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{sesion.ipAddress}</TableCell>
                    <TableCell className="text-sm text-slate-600">{formatDate(sesion.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>No hay sesiones activas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de facturas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de facturas</CardTitle>
          <CardDescription>Tus facturas de suscripción</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingExtra ? (
            <Skeleton className="h-32" />
          ) : historial.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((factura: any) => (
                  <TableRow key={factura._id}>
                    <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                    <TableCell>{new Date(factura.fechaEmision).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>{factura.planNombre || 'Suscripción'}</TableCell>
                    <TableCell>{factura.total?.toFixed(2)}€</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        factura.estado === 'pagada' ? 'bg-green-50 text-green-700' :
                        factura.estado === 'emitida' ? 'bg-amber-50 text-amber-700' :
                        factura.estado === 'anulada' ? 'bg-red-50 text-red-700' :
                        'bg-slate-50 text-slate-700'
                      }>
                        {factura.estado === 'pagada' ? 'Pagada' :
                         factura.estado === 'emitida' ? 'Emitida' :
                         factura.estado === 'anulada' ? 'Anulada' :
                         factura.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDescargarFactura(factura._id, factura.numeroFactura)}
                        title="Descargar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>No hay facturas todavía</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones adicionales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opciones adicionales</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/checkout">
            <Button variant="outline">Ver todos los planes</Button>
          </Link>
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            Cancelar suscripcion
          </Button>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}
