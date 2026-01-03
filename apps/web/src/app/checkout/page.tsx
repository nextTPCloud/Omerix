'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useLicense } from '@/hooks/useLicense'
import { billingService, IPlan } from '@/services/billing.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  CreditCard,
  ArrowLeft,
  Shield,
  Lock,
  Check,
  CheckCircle,
  Loader2,
  Tag,
  Clock,
  UserPlus,
  HardDrive,
  Sparkles,
  Plus,
  Wrench,
  Calculator,
  Users,
} from 'lucide-react'

// Mapeo de iconos para add-ons
const iconMap: Record<string, any> = {
  Clock,
  CreditCard,
  UserPlus,
  HardDrive,
  Sparkles,
  Wrench,
  Calculator,
  Users,
}

// Planes disponibles (sincronizado con seed-plans.ts)
// Precios con IVA incluido
const planesDisponibles: IPlan[] = [
  {
    _id: '0',
    nombre: 'Solo Fichaje',
    slug: 'solo-fichaje',
    descripcion: 'Control horario y fichajes',
    precio: { mensual: 15, anual: 150 },
    limites: {
      usuariosSimultaneos: 5,
      usuariosTotales: 10,
      facturasMes: 0,
      productosCatalogo: 0,
      almacenes: 0,
      clientes: 0,
      tpvsActivos: 0,
      almacenamientoGB: 1,
      llamadasAPIDia: 500,
      emailsMes: 100,
      smsMes: 0,
      whatsappMes: 0,
    },
    modulosIncluidos: ['rrhh', 'calendarios'],
    activo: true,
    visible: true,
  },
  {
    _id: '1',
    nombre: 'Starter',
    slug: 'starter',
    descripcion: 'Para autonomos que empiezan',
    precio: { mensual: 19, anual: 190 },
    limites: {
      usuariosSimultaneos: 1,
      usuariosTotales: 2,
      facturasMes: 100,
      productosCatalogo: 200,
      almacenes: 1,
      clientes: 200,
      tpvsActivos: 0,
      almacenamientoGB: 2,
      llamadasAPIDia: 1000,
      emailsMes: 200,
      smsMes: 20,
      whatsappMes: 20,
    },
    modulosIncluidos: ['clientes', 'productos', 'ventas', 'informes'],
    activo: true,
    visible: true,
  },
  {
    _id: '2',
    nombre: 'Basico',
    slug: 'basico',
    descripcion: 'Para autonomos y microempresas',
    precio: { mensual: 35, anual: 349 },
    limites: {
      usuariosSimultaneos: 2,
      usuariosTotales: 10,
      facturasMes: 200,
      productosCatalogo: 500,
      almacenes: 2,
      clientes: 500,
      tpvsActivos: 1,
      almacenamientoGB: 5,
      llamadasAPIDia: 2000,
      emailsMes: 500,
      smsMes: 50,
      whatsappMes: 50,
    },
    modulosIncluidos: ['ventas', 'compras', 'inventario', 'clientes', 'productos', 'informes'],
    activo: true,
    visible: true,
  },
  {
    _id: '3',
    nombre: 'Profesional',
    slug: 'profesional',
    descripcion: 'Para empresas en crecimiento',
    precio: { mensual: 99, anual: 990 },
    limites: {
      usuariosSimultaneos: 15,
      usuariosTotales: 30,
      facturasMes: 1000,
      productosCatalogo: 5000,
      almacenes: 5,
      clientes: 5000,
      tpvsActivos: 5,
      almacenamientoGB: 20,
      llamadasAPIDia: 10000,
      emailsMes: 2000,
      smsMes: 200,
      whatsappMes: 200,
    },
    modulosIncluidos: ['ventas', 'compras', 'inventario', 'clientes', 'productos', 'informes', 'contabilidad', 'proyectos', 'crm', 'tpv', 'tesoreria', 'calendarios'],
    activo: true,
    visible: true,
  },
  {
    _id: '4',
    nombre: 'Enterprise',
    slug: 'enterprise',
    descripcion: 'Para grandes organizaciones',
    precio: { mensual: 249, anual: 2490 },
    limites: {
      usuariosSimultaneos: -1,
      usuariosTotales: -1,
      facturasMes: -1,
      productosCatalogo: -1,
      almacenes: -1,
      clientes: -1,
      tpvsActivos: -1,
      almacenamientoGB: 100,
      llamadasAPIDia: -1,
      emailsMes: -1,
      smsMes: -1,
      whatsappMes: -1,
    },
    modulosIncluidos: ['*'],
    activo: true,
    visible: true,
  },
]

// Add-ons disponibles (IVA incluido)
interface IAddOnLocal {
  slug: string
  nombre: string
  descripcion: string
  icono: string
  tipo: 'modulo' | 'usuarios' | 'almacenamiento' | 'tokens'
  precioMensual: number
  precioAnual?: number
  esRecurrente: boolean
  cantidad?: number
  unidad?: string
}

const addOnsDisponibles: IAddOnLocal[] = [
  {
    slug: 'rrhh-fichaje',
    nombre: 'Módulo RRHH/Fichaje',
    descripcion: 'Control horario, fichajes, turnos y gestión de personal',
    icono: 'Clock',
    tipo: 'modulo',
    precioMensual: 6,
    precioAnual: 60,
    esRecurrente: true,
  },
  {
    slug: 'tpv',
    nombre: 'Módulo TPV',
    descripcion: 'Terminal punto de venta para tiendas y hostelería',
    icono: 'CreditCard',
    tipo: 'modulo',
    precioMensual: 25,
    precioAnual: 250,
    esRecurrente: true,
  },
  {
    slug: 'proyectos',
    nombre: 'Módulo Servicios',
    descripcion: 'Proyectos, partes de trabajo, maquinaria y tipos de gasto',
    icono: 'Wrench',
    tipo: 'modulo',
    precioMensual: 15,
    precioAnual: 150,
    esRecurrente: true,
  },
  {
    slug: 'contabilidad',
    nombre: 'Módulo Contabilidad',
    descripcion: 'Gestión contable completa, asientos, balances y cuentas anuales',
    icono: 'Calculator',
    tipo: 'modulo',
    precioMensual: 20,
    precioAnual: 200,
    esRecurrente: true,
  },
  {
    slug: 'crm',
    nombre: 'CRM Completo',
    descripcion: 'Gestión de clientes, oportunidades, pipeline de ventas y seguimiento',
    icono: 'Users',
    tipo: 'modulo',
    precioMensual: 15,
    precioAnual: 150,
    esRecurrente: true,
  },
  {
    slug: 'usuario-extra',
    nombre: 'Usuario Extra',
    descripcion: 'Añade un usuario adicional (+1 sesion)',
    icono: 'UserPlus',
    tipo: 'usuarios',
    precioMensual: 5,
    precioAnual: 50,
    esRecurrente: true,
    cantidad: 1,
    unidad: 'usuario',
  },
  {
    slug: 'pack-5-usuarios',
    nombre: 'Pack 5 Usuarios',
    descripcion: '5 usuarios adicionales (ahorra 20%)',
    icono: 'UserPlus',
    tipo: 'usuarios',
    precioMensual: 20,
    precioAnual: 200,
    esRecurrente: true,
    cantidad: 5,
    unidad: 'usuarios',
  },
  {
    slug: 'storage-10gb',
    nombre: '10 GB Extra',
    descripcion: 'Amplía tu almacenamiento',
    icono: 'HardDrive',
    tipo: 'almacenamiento',
    precioMensual: 3,
    precioAnual: 30,
    esRecurrente: true,
    cantidad: 10,
    unidad: 'GB',
  },
  {
    slug: 'tokens-5000',
    nombre: '5.000 Tokens IA',
    descripcion: 'Pack de tokens para asistente IA',
    icono: 'Sparkles',
    tipo: 'tokens',
    precioMensual: 8,
    esRecurrente: false,
    cantidad: 5000,
    unidad: 'tokens',
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { plan: currentPlan, isTrial, license, isActive } = useLicense()

  const [selectedPlan, setSelectedPlan] = useState<IPlan | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [billingCycle, setBillingCycle] = useState<'mensual' | 'anual'>('anual')
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'redsys'>('stripe')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [onlyAddOns, setOnlyAddOns] = useState(false) // Solo comprar add-ons

  // Estado para prorrateo
  const [prorrateoData, setProrrateoData] = useState<{
    aplicaProrrata: boolean
    diasRestantes: number
    diasCiclo: number
    fechaRenovacion: string
    tipoSuscripcion: 'mensual' | 'anual'
    mensaje: string
    desglose: Array<{
      concepto: string
      precioCompleto: number
      precioProrrata: number
    }>
    totales: {
      subtotalCompleto: number
      subtotalProrrata: number
      ivaCompleto: number
      ivaProrrata: number
      totalCompleto: number
      totalProrrata: number
      ahorro: number
    }
  } | null>(null)
  const [loadingProrrateo, setLoadingProrrateo] = useState(false)

  // Verificar si el usuario ya tiene un plan activo (no trial)
  const hasActivePlan = !!(isActive && !isTrial && currentPlan)
  // Verificar si el plan seleccionado es el mismo que el actual (comparación case-insensitive)
  const isSamePlan = !!(selectedPlan && currentPlan &&
    selectedPlan.slug?.toLowerCase() === currentPlan.slug?.toLowerCase())

  // Toggle add-on selection
  const toggleAddOn = (slug: string) => {
    setSelectedAddOns(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    )
  }

  // Calculate add-ons total
  const addOnsTotal = selectedAddOns.reduce((total, slug) => {
    const addon = addOnsDisponibles.find(a => a.slug === slug)
    if (!addon) return total
    const precio = billingCycle === 'anual' && addon.precioAnual
      ? addon.precioAnual
      : addon.precioMensual
    return total + precio
  }, 0)

  // Obtener plan y add-ons de query params
  useEffect(() => {
    const planSlug = searchParams.get('plan')
    const cycle = searchParams.get('cycle') as 'mensual' | 'anual'
    const addonsParam = searchParams.get('addons')
    const onlyAddonsParam = searchParams.get('onlyAddons')

    // Solo preseleccionar plan si viene explícitamente en la URL
    if (planSlug) {
      const plan = planesDisponibles.find(p => p.slug === planSlug)
      if (plan) {
        setSelectedPlan(plan)
      }
    }

    // Si viene con onlyAddons=true y tiene plan activo, activar modo solo add-ons
    if (onlyAddonsParam === 'true' && hasActivePlan && currentPlan) {
      setOnlyAddOns(true)
      // Solo en este caso preseleccionar el plan actual
      const plan = planesDisponibles.find(p => p.slug === currentPlan.slug)
      if (plan) {
        setSelectedPlan(plan)
      }
    }

    // Preseleccionar add-ons si vienen en params
    if (addonsParam) {
      const addons = addonsParam.split(',')
      setSelectedAddOns(addons.filter(slug => addOnsDisponibles.some(a => a.slug === slug)))
    }

    if (cycle === 'mensual' || cycle === 'anual') {
      setBillingCycle(cycle)
    }
  }, [searchParams, hasActivePlan, currentPlan])

  // Efecto para calcular prorrateo cuando se seleccionan add-ons
  useEffect(() => {
    const calcularProrrateo = async () => {
      // Solo calcular si tiene plan activo y hay add-ons seleccionados
      if (!hasActivePlan || selectedAddOns.length === 0) {
        setProrrateoData(null)
        return
      }

      setLoadingProrrateo(true)
      try {
        const response = await billingService.calcularProrrateo({
          addOns: selectedAddOns,
        })

        if (response.success && response.data) {
          setProrrateoData(response.data)
        }
      } catch (error) {
        console.error('Error calculando prorrateo:', error)
        setProrrateoData(null)
      } finally {
        setLoadingProrrateo(false)
      }
    }

    calcularProrrateo()
  }, [hasActivePlan, selectedAddOns])

  // Calcular precios (IVA ya incluido en el precio)
  // Modo solo add-ons: explícito O automático (tiene plan activo, mismo plan, y hay add-ons)
  const isAddOnOnlyMode = onlyAddOns || (hasActivePlan && isSamePlan)
  // Solo cobrar plan si NO es modo add-ons Y (no tiene plan activo O cambió de plan)
  const shouldChargePlan = !isAddOnOnlyMode && (!hasActivePlan || !isSamePlan)

  const planPrice = selectedPlan && shouldChargePlan
    ? billingCycle === 'anual'
      ? selectedPlan.precio.anual
      : selectedPlan.precio.mensual
    : 0

  // Calcular precio total de add-ons (normal vs prorrateado)
  const useProrrateo = prorrateoData?.aplicaProrrata && isAddOnOnlyMode
  const addOnsTotalFinal = useProrrateo
    ? prorrateoData!.totales.totalProrrata // Ya incluye IVA
    : addOnsTotal

  const basePrice = planPrice + (useProrrateo ? 0 : addOnsTotal) // Si hay prorrateo, el total ya viene calculado
  const priceBeforeDiscount = useProrrateo ? prorrateoData!.totales.totalProrrata : basePrice
  const discountAmount = promoApplied ? (priceBeforeDiscount * discount) / 100 : 0
  const total = priceBeforeDiscount - discountAmount

  // El IVA ya está incluido en el precio (21%)
  const baseImponible = useProrrateo ? prorrateoData!.totales.subtotalProrrata : total / 1.21
  const ivaIncluido = useProrrateo ? prorrateoData!.totales.ivaProrrata : total - baseImponible

  // Precio completo (sin prorrateo) para mostrar ahorro
  const totalSinProrrateo = planPrice + addOnsTotal
  const ahorroConProrrateo = useProrrateo ? totalSinProrrateo - total : 0

  // Determinar tipo de operacion
  const operationType = isAddOnOnlyMode
    ? 'addons' // Solo add-ons
    : hasActivePlan && !isSamePlan
      ? 'upgrade' // Cambio de plan
      : 'new' // Nueva suscripcion

  const handleApplyPromo = () => {
    // Simulacion de codigos promocionales
    const promoCodes: Record<string, number> = {
      'WELCOME20': 20,
      'SAVE10': 10,
      'PROMO50': 50,
    }

    const upperCode = promoCode.toUpperCase()
    if (promoCodes[upperCode]) {
      setDiscount(promoCodes[upperCode])
      setPromoApplied(true)
      toast.success(`Codigo promocional aplicado: ${promoCodes[upperCode]}% de descuento`)
    } else {
      toast.error('Codigo promocional no valido')
    }
  }

  const handleCheckout = async () => {
    // Si solo add-ons, no requiere plan
    if (operationType !== 'addons' && !selectedPlan) {
      toast.error('Selecciona un plan')
      return
    }

    // Si solo add-ons, requiere al menos un add-on seleccionado
    if (operationType === 'addons' && selectedAddOns.length === 0) {
      toast.error('Selecciona al menos un add-on')
      return
    }

    if (!acceptTerms) {
      toast.error('Debes aceptar los terminos y condiciones')
      return
    }

    setLoading(true)

    try {
      if (paymentMethod === 'stripe') {
        // Crear sesion de Stripe Checkout
        const response = await billingService.crearCheckoutSession({
          planSlug: operationType === 'addons' ? undefined : selectedPlan?.slug,
          tipoSuscripcion: billingCycle,
          addOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
          onlyAddOns: operationType === 'addons',
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/checkout/cancel`,
        })

        if (response.success && response.data?.url) {
          // Verificar si es una activación directa (add-ons añadidos a suscripción existente)
          if (response.data.sessionId?.startsWith('direct-')) {
            // Los add-ons ya fueron añadidos directamente, mostrar mensaje y redirigir
            toast.success(response.data.message || 'Add-ons añadidos correctamente')
            router.push('/checkout/success?session_id=subscription-updated')
            return
          }
          // Redirigir a Stripe Checkout
          window.location.href = response.data.url
        } else {
          throw new Error('Error al crear sesion de pago')
        }
      } else if (paymentMethod === 'paypal') {
        // Crear suscripcion de PayPal (con soporte para add-ons)
        const paypalParams = {
          planSlug: operationType === 'addons' ? undefined : selectedPlan?.slug,
          tipoSuscripcion: billingCycle,
          addOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
          onlyAddOns: operationType === 'addons',
        }
        console.log('🔵 [Frontend] Enviando a PayPal:', paypalParams)
        const response = await billingService.crearSuscripcionPayPal(paypalParams)

        if (response.success && response.data?.approvalUrl) {
          // Redirigir a PayPal
          window.location.href = response.data.approvalUrl
        } else {
          throw new Error('Error al crear suscripcion de PayPal')
        }
      } else if (paymentMethod === 'redsys') {
        // Crear pago con Redsys (con soporte para add-ons)
        const response = await billingService.crearPagoRedsys({
          planSlug: operationType === 'addons' ? undefined : selectedPlan?.slug,
          tipoSuscripcion: billingCycle,
          addOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
          onlyAddOns: operationType === 'addons',
        })

        if (response.success && response.data) {
          // Crear formulario oculto y enviarlo a Redsys
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = response.data.redsysUrl

          const fields = {
            Ds_SignatureVersion: response.data.Ds_SignatureVersion,
            Ds_MerchantParameters: response.data.Ds_MerchantParameters,
            Ds_Signature: response.data.Ds_Signature,
          }

          Object.entries(fields).forEach(([name, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = name
            input.value = value
            form.appendChild(input)
          })

          document.body.appendChild(form)
          form.submit()
        } else {
          throw new Error('Error al crear pago de Redsys')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  if (!selectedPlan) {
    return (
      <DashboardLayout>
        <div className="container max-w-5xl mx-auto py-8 px-4">
          <div className="mb-8">
            <Link
              href="/configuracion/billing"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a facturacion
            </Link>
            <h1 className="text-2xl font-bold">Elige tu Plan</h1>
            <p className="text-muted-foreground">
              Selecciona el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          {/* Toggle mensual/anual */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'mensual' ? 'text-slate-900' : 'text-slate-500'}`}>
              Mensual
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'mensual' ? 'anual' : 'mensual')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'anual' ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  billingCycle === 'anual' ? 'left-8' : 'left-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium min-w-[40px] ${billingCycle === 'anual' ? 'text-slate-900' : 'text-slate-500'}`}>
              Anual
            </span>
            {billingCycle === 'anual' && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Ahorra ~17%
              </Badge>
            )}
          </div>

          {/* Grid de planes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {planesDisponibles.map((plan) => {
              const precio = billingCycle === 'anual' ? plan.precio.anual : plan.precio.mensual
              const precioMes = billingCycle === 'anual' ? Math.round(plan.precio.anual / 12) : plan.precio.mensual
              const esActual = currentPlan?.slug === plan.slug

              return (
                <Card
                  key={plan._id}
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    plan.slug === 'profesional' ? 'border-blue-500 border-2 shadow-md' : 'border-slate-200'
                  } ${esActual ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => {
                    setSelectedPlan(plan)
                    // Si es el plan actual y tiene add-ons, marcar como solo add-ons
                    if (esActual && hasActivePlan) {
                      setOnlyAddOns(true)
                    } else {
                      setOnlyAddOns(false)
                    }
                  }}
                >
                  {plan.slug === 'profesional' && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 whitespace-nowrap">
                      Mas popular
                    </Badge>
                  )}
                  {esActual && (
                    <Badge className="absolute -top-3 right-4 bg-green-600">
                      Plan actual
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                    <CardDescription>{plan.descripcion}</CardDescription>
                  </CardHeader>

                  <CardContent className="text-center space-y-4">
                    <div>
                      <span className="text-4xl font-bold">{precioMes}€</span>
                      <span className="text-slate-500">/mes</span>
                      <p className="text-xs text-slate-400 mt-1">IVA incluido</p>
                      {billingCycle === 'anual' && (
                        <p className="text-sm text-green-600 mt-1">
                          Facturado anualmente ({precio}€/año)
                        </p>
                      )}
                    </div>

                    <ul className="text-sm text-slate-600 space-y-2 text-left">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {plan.limites.usuariosTotales === -1 ? 'Usuarios ilimitados' : `${plan.limites.usuariosTotales} usuarios`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {plan.limites.facturasMes === -1 ? 'Facturas ilimitadas' : `${plan.limites.facturasMes} facturas/mes`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {plan.limites.productosCatalogo === -1 ? 'Productos ilimitados' : `${plan.limites.productosCatalogo} productos`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {plan.limites.almacenamientoGB} GB almacenamiento
                      </li>
                    </ul>

                    <Button
                      className={`w-full ${plan.slug === 'profesional' ? 'bg-blue-600 hover:bg-blue-700' : ''} ${esActual ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      variant={plan.slug === 'profesional' || esActual ? 'default' : 'outline'}
                    >
                      {esActual
                        ? (selectedAddOns.length > 0 ? 'Añadir módulos' : 'Tu plan actual')
                        : 'Seleccionar'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Seccion de Add-ons */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-2">Mejora tu plan con Add-ons</h2>
            <p className="text-muted-foreground mb-6">
              Añade módulos y recursos extra a tu suscripción
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addOnsDisponibles.map((addon) => {
                const Icon = iconMap[addon.icono] || Plus
                const isSelected = selectedAddOns.includes(addon.slug)
                const precio = billingCycle === 'anual' && addon.precioAnual
                  ? addon.precioAnual
                  : addon.precioMensual

                return (
                  <Card
                    key={addon.slug}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-950' : 'border-slate-200'
                    }`}
                    onClick={() => toggleAddOn(addon.slug)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm">{addon.nombre}</h3>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{addon.descripcion}</p>
                          <div className="mt-2">
                            <span className="text-lg font-bold">{precio}€</span>
                            <span className="text-xs text-muted-foreground">
                              {addon.esRecurrente ? (billingCycle === 'anual' ? '/año' : '/mes') : ' único'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {selectedAddOns.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Add-ons seleccionados: {selectedAddOns.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {hasActivePlan
                        ? `Añadir a tu plan ${currentPlan?.nombre}`
                        : 'Selecciona un plan para continuar con el pago'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{addOnsTotal}€</p>
                    <p className="text-xs text-muted-foreground">
                      {billingCycle === 'anual' ? '/año' : '/mes'}
                    </p>
                  </div>
                </div>
                {/* Boton para comprar solo add-ons si tiene plan activo */}
                {hasActivePlan && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      setOnlyAddOns(true)
                      // Preseleccionar el plan actual para pasar a la pantalla de pago
                      const plan = planesDisponibles.find(p => p.slug === currentPlan?.slug)
                      if (plan) setSelectedPlan(plan)
                    }}
                  >
                    Comprar Add-ons ({addOnsTotal}€/{billingCycle === 'anual' ? 'año' : 'mes'})
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/configuracion/billing"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a planes
        </Link>
        <h1 className="text-2xl font-bold">Completar Compra</h1>
        <p className="text-muted-foreground">
          {operationType === 'addons'
            ? `Añadir módulos a tu plan ${currentPlan?.nombre || selectedPlan?.nombre}`
            : operationType === 'upgrade'
              ? `Cambiar a Plan ${selectedPlan?.nombre}`
              : `Finaliza tu suscripcion al Plan ${selectedPlan?.nombre}`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Formulario de pago */}
        <div className="lg:col-span-3 space-y-6">
          {/* Selector de ciclo de facturacion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ciclo de Facturacion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBillingCycle('mensual')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    billingCycle === 'mensual'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium">Mensual</p>
                  <p className="text-2xl font-bold">{selectedPlan.precio.mensual}€<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                  <p className="text-xs text-muted-foreground">IVA incluido</p>
                </button>
                <button
                  onClick={() => setBillingCycle('anual')}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                    billingCycle === 'anual'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Badge className="absolute -top-2 right-2 bg-green-600">Ahorra 17%</Badge>
                  <p className="font-medium">Anual</p>
                  <p className="text-2xl font-bold">{selectedPlan.precio.anual}€<span className="text-sm font-normal text-muted-foreground">/año</span></p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(selectedPlan.precio.anual / 12)}€/mes · IVA incluido
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Metodo de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metodo de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'paypal' | 'redsys')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stripe" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Tarjeta
                  </TabsTrigger>
                  <TabsTrigger value="paypal" className="gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.923-.788l.038-.181.732-4.639.047-.256a.96.96 0 0 1 .946-.806h.595c3.857 0 6.875-1.566 7.759-6.098.37-1.893.178-3.47-.813-4.315z"/>
                    </svg>
                    PayPal
                  </TabsTrigger>
                  <TabsTrigger value="redsys" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Redsys
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stripe" className="mt-4 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Lock className="h-4 w-4" />
                      <span>Pago seguro procesado por Stripe</span>
                    </div>
                    <p className="text-sm">
                      Al hacer clic en "Completar pago", seras redirigido a Stripe para introducir
                      los datos de tu tarjeta de forma segura.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="paypal" className="mt-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Shield className="h-4 w-4" />
                      <span>Pago seguro con PayPal</span>
                    </div>
                    <p className="text-sm">
                      Seras redirigido a PayPal para completar el pago con tu cuenta o tarjeta.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="redsys" className="mt-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Shield className="h-4 w-4" />
                      <span>Pago seguro con Redsys (TPV Virtual)</span>
                    </div>
                    <p className="text-sm">
                      Seras redirigido a la pasarela de pago Redsys para completar el pago de forma segura.
                      Compatible con tarjetas Visa, Mastercard y otras.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Codigo promocional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Codigo Promocional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Introduce tu codigo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoApplied}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={!promoCode || promoApplied}
                >
                  {promoApplied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      Aplicado
                    </>
                  ) : (
                    'Aplicar'
                  )}
                </Button>
              </div>
              {promoApplied && (
                <p className="text-sm text-green-600 mt-2">
                  Descuento del {discount}% aplicado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Terminos y condiciones */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Acepto los terminos y condiciones
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Al suscribirte, aceptas nuestros{' '}
                    <Link href="/terminos" className="text-blue-600 hover:underline">
                      Terminos de Servicio
                    </Link>{' '}
                    y{' '}
                    <Link href="/privacidad" className="text-blue-600 hover:underline">
                      Politica de Privacidad
                    </Link>
                    . La suscripcion se renovara automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan seleccionado */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {operationType === 'addons'
                        ? `Plan actual: ${currentPlan?.nombre || selectedPlan?.nombre}`
                        : `Plan ${selectedPlan?.nombre}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {operationType === 'addons'
                        ? 'Añadiendo módulos extra'
                        : `Facturacion ${billingCycle}`}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {operationType === 'addons'
                      ? 'Solo Add-ons'
                      : operationType === 'upgrade'
                        ? 'Cambio de plan'
                        : isTrial
                          ? 'Upgrade desde Trial'
                          : 'Nueva suscripción'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Mensaje de prorrateo */}
              {useProrrateo && prorrateoData?.mensaje && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Pago prorrateado</p>
                      <p>{prorrateoData.mensaje}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Indicador de cargando prorrateo */}
              {loadingProrrateo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Calculando prorrateo...</span>
                </div>
              )}

              {/* Desglose de precios */}
              <div className="space-y-2 text-sm">
                {/* Solo mostrar precio del plan si se va a cobrar */}
                {shouldChargePlan && selectedPlan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Plan {selectedPlan.nombre} ({billingCycle})
                    </span>
                    <span>{planPrice.toFixed(2)}€</span>
                  </div>
                )}

                {/* Add-ons seleccionados - con prorrateo si aplica */}
                {useProrrateo && prorrateoData?.desglose ? (
                  // Mostrar desglose con precios prorrateados
                  prorrateoData.desglose.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {item.concepto}
                        {item.precioProrrata < item.precioCompleto && (
                          <span className="text-xs line-through text-slate-400">
                            {item.precioCompleto.toFixed(2)}€
                          </span>
                        )}
                      </span>
                      <span className={item.precioProrrata < item.precioCompleto ? 'text-green-600 font-medium' : ''}>
                        {item.precioProrrata.toFixed(2)}€
                      </span>
                    </div>
                  ))
                ) : (
                  // Mostrar precios normales
                  selectedAddOns.map(slug => {
                    const addon = addOnsDisponibles.find(a => a.slug === slug)
                    if (!addon) return null
                    const precio = billingCycle === 'anual' && addon.precioAnual
                      ? addon.precioAnual
                      : addon.precioMensual
                    return (
                      <div key={slug} className="flex justify-between text-muted-foreground">
                        <span>{addon.nombre}</span>
                        <span>{precio.toFixed(2)}€</span>
                      </div>
                    )
                  })
                )}

                {promoApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({discount}%)</span>
                    <span>-{discountAmount.toFixed(2)}€</span>
                  </div>
                )}

                {/* Mostrar ahorro por prorrateo */}
                {useProrrateo && ahorroConProrrateo > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Ahorro prorrateo ({prorrateoData?.diasRestantes} días)</span>
                    <span>-{ahorroConProrrateo.toFixed(2)}€</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Base imponible</span>
                  <span>{baseImponible.toFixed(2)}€</span>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>IVA incluido (21%)</span>
                  <span>{ivaIncluido.toFixed(2)}€</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{total.toFixed(2)}€</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={loading || !acceptTerms}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Completar Pago - {total.toFixed(2)}€
                  </>
                )}
              </Button>

              {/* Garantias */}
              <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Pago 100% seguro y encriptado</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Garantia de devolucion de 14 dias</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cancela cuando quieras, sin penalizacion</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
