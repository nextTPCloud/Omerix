"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Building2,
  Calculator,
  Briefcase,
  UtensilsCrossed,
  Monitor,
  Warehouse,
  FileText,
  CreditCard,
  Lock,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Headphones,
  Target,
  Calendar,
  Share2,
  Bell,
  PieChart,
} from 'lucide-react'

// Header publico
function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg
              width="140"
              height="40"
              viewBox="0 0 200 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-9 w-auto"
            >
              <style>{`
                @font-face {
                  font-family: 'GameOfSquids';
                  src: url('/fonts/GameOfSquids.woff2') format('woff2'),
                      url('/fonts/GameOfSquids.woff') format('woff');
                  font-weight: 700;
                  font-style: bold;
                }
              `}</style>
              <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" opacity="0.15"/>
              <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
              <rect x="14" y="28" width="4" height="10" rx="1.5" fill="#1e40af"/>
              <rect x="20" y="23" width="4" height="15" rx="1.5" fill="#1e40af"/>
              <rect x="26" y="18" width="4" height="20" rx="1.5" fill="#1e40af"/>
              <circle cx="34" cy="15" r="3" fill="#2563eb"/>
              <text x="54" y="38" fontFamily="GameOfSquids, sans-serif" fontSize="36" fontWeight="700" fill="#1e40af" letterSpacing="1">Tralok</text>
            </svg>
          </Link>

          {/* Navegacion */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/planes"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Planes
            </Link>
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#modulos"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Modulos
            </a>
          </nav>

          {/* Botones */}
          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Iniciar sesion
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Prueba gratis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

// Footer publico
function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <svg
                width="120"
                height="32"
                viewBox="0 0 200 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-auto"
              >
                <circle cx="24" cy="24" r="20" stroke="white" strokeWidth="2.5" fill="none" opacity="0.15"/>
                <circle cx="24" cy="24" r="20" stroke="white" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
                <rect x="14" y="28" width="4" height="10" rx="1.5" fill="white"/>
                <rect x="20" y="23" width="4" height="15" rx="1.5" fill="white"/>
                <rect x="26" y="18" width="4" height="20" rx="1.5" fill="white"/>
                <circle cx="34" cy="15" r="3" fill="white"/>
                <text x="54" y="38" fontFamily="GameOfSquids, sans-serif" fontSize="36" fontWeight="700" fill="white" letterSpacing="1">Tralok</text>
              </svg>
            </Link>
            <p className="text-slate-400 text-sm max-w-md">
              El ERP completo para gestionar tu negocio. Ventas, compras, inventario,
              recursos humanos y mucho mas en una sola plataforma.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Producto</h3>
            <ul className="space-y-2">
              <li><Link href="/planes" className="text-slate-400 hover:text-white text-sm transition-colors">Planes y precios</Link></li>
              <li><a href="#features" className="text-slate-400 hover:text-white text-sm transition-colors">Funcionalidades</a></li>
              <li><a href="#modulos" className="text-slate-400 hover:text-white text-sm transition-colors">Modulos</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacidad" className="text-slate-400 hover:text-white text-sm transition-colors">Privacidad</Link></li>
              <li><Link href="/terminos" className="text-slate-400 hover:text-white text-sm transition-colors">Terminos de uso</Link></li>
              <li><Link href="/contacto" className="text-slate-400 hover:text-white text-sm transition-colors">Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Tralok. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

// Seccion Hero
function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-blue-200 bg-blue-50 text-blue-700">
            <Link href="/sandbox">Prueba el sandbox</Link> - Sin registro
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            El ERP que tu negocio{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              necesita
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Gestiona ventas, compras, inventario, recursos humanos, proyectos y mucho mas
            desde una unica plataforma. Diseno moderno, facil de usar y 100% en la nube.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/sandbox">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                Probar sandbox
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/planes">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-slate-300">
                Ver planes y precios
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Sandbox sin registro</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Soporte en espanol</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Datos seguros en Europa</span>
            </div>
          </div>
        </div>

        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100 to-transparent z-10 h-32 bottom-0 top-auto" />
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden mx-auto max-w-5xl">
            <div className="bg-slate-800 h-8 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="bg-slate-100 h-80 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                <p className="text-lg font-medium text-slate-600">Dashboard interactivo</p>
                <p className="text-sm text-slate-500">Metricas en tiempo real de tu negocio</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Seccion Modulos
function ModulosSection() {
  const modulosCore = [
    { icon: ShoppingCart, nombre: 'Ventas', descripcion: 'Facturas, presupuestos, pedidos, albaranes y control de cobros.', disponible: true },
    { icon: Package, nombre: 'Compras', descripcion: 'Pedidos a proveedores, albaranes de entrada y gestion de pagos.', disponible: true },
    { icon: Warehouse, nombre: 'Inventario', descripcion: 'Multi-almacen, control de stock, traspasos y trazabilidad.', disponible: true },
    { icon: Users, nombre: 'RRHH', descripcion: 'Personal, fichajes, turnos, calendarios y planificacion.', disponible: true },
    { icon: Briefcase, nombre: 'Proyectos', descripcion: 'Gestion de proyectos, tareas, partes de trabajo y rentabilidad.', disponible: true },
    { icon: CreditCard, nombre: 'Tesoreria', descripcion: 'Cobros, pagos, vencimientos, remesas y prevision de caja.', disponible: true },
  ]

  const modulosPro = [
    { icon: Target, nombre: 'CRM', descripcion: 'Leads, oportunidades, pipeline de ventas y actividades comerciales.', disponible: true, pro: true },
    { icon: Calculator, nombre: 'Contabilidad', descripcion: 'Plan de cuentas, asientos, balances, cuenta de resultados y libro mayor.', disponible: true, pro: true },
    { icon: Share2, nombre: 'Redes Sociales', descripcion: 'Publica en Facebook e Instagram, programa contenido y analiza metricas.', disponible: true, pro: true },
    { icon: Calendar, nombre: 'Google Calendar', descripcion: 'Sincronizacion bidireccional con partes, tareas y actividades CRM.', disponible: true, pro: true },
    { icon: Bell, nombre: 'Recordatorios', descripcion: 'Alertas unificadas, notificaciones y seguimiento automatico.', disponible: true, pro: true },
    { icon: PieChart, nombre: 'Dashboard Pro', descripcion: 'Widgets personalizables de CRM, contabilidad y KPIs avanzados.', disponible: true, pro: true },
  ]

  const modulosExtra = [
    { icon: BarChart3, nombre: 'Informes', descripcion: 'Informes personalizables, graficos y exportacion a Excel/PDF.', disponible: true },
    { icon: UtensilsCrossed, nombre: 'Restauracion', descripcion: 'Comandas, mesas, carta digital y gestion de cocina.', disponible: true, addon: true },
    { icon: Monitor, nombre: 'TPV', descripcion: 'Punto de venta tactil, tickets y cierre de caja.', disponible: true },
  ]

  const modulos = [...modulosCore, ...modulosPro, ...modulosExtra]

  return (
    <section id="modulos" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Modulos integrados que trabajan juntos para optimizar cada area de tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulos.map((modulo: any) => (
            <Card key={modulo.nombre} className={`relative overflow-hidden transition-all hover:shadow-lg ${!modulo.disponible ? 'opacity-75' : ''} ${modulo.pro ? 'border-purple-200 bg-purple-50/30' : ''}`}>
              {modulo.proximamente && (
                <Badge className="absolute top-3 right-3 bg-amber-100 text-amber-700 border-amber-200">Proximamente</Badge>
              )}
              {modulo.addon && (
                <Badge className="absolute top-3 right-3 bg-purple-100 text-purple-700 border-purple-200">Add-on</Badge>
              )}
              {modulo.pro && (
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">Pro</Badge>
              )}
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${modulo.pro ? 'bg-purple-100 text-purple-600' : modulo.disponible ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {!modulo.disponible ? <Lock className="h-6 w-6" /> : <modulo.icon className="h-6 w-6" />}
                </div>
                <CardTitle className="text-lg">{modulo.nombre}</CardTitle>
                <CardDescription>{modulo.descripcion}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// Seccion Beneficios
function BeneficiosSection() {
  const beneficios = [
    { icon: Zap, titulo: 'Rapido y moderno', descripcion: 'Interfaz fluida construida con las ultimas tecnologias. Sin tiempos de espera.' },
    { icon: Shield, titulo: 'Seguro y fiable', descripcion: 'Datos cifrados, backups automaticos y servidores en la Union Europea.' },
    { icon: Building2, titulo: 'Multi-empresa', descripcion: 'Gestiona varias empresas desde una unica cuenta. Perfecto para grupos.' },
    { icon: FileText, titulo: 'Integracion Hacienda', descripcion: 'Preparado para SII y TicketBAI. Cumple con la normativa fiscal espanola.' },
    { icon: Target, titulo: 'CRM integrado', descripcion: 'Pipeline de ventas, leads, oportunidades y seguimiento comercial completo.' },
    { icon: Calendar, titulo: 'Sincronizacion calendario', descripcion: 'Google Calendar bidireccional. Tus citas y tareas siempre sincronizadas.' },
    { icon: Share2, titulo: 'Redes sociales', descripcion: 'Publica en Facebook e Instagram. Programa contenido y analiza metricas.' },
    { icon: Bell, titulo: 'Alertas inteligentes', descripcion: 'Recordatorios automaticos de vencimientos, seguimientos y tareas.' },
    { icon: Calculator, titulo: 'Contabilidad completa', descripcion: 'Plan de cuentas, asientos, balances, cuenta de resultados y libro mayor.' },
    { icon: Headphones, titulo: 'Soporte en espanol', descripcion: 'Equipo local que entiende tu negocio. Respuesta rapida y personalizada.' }
  ]

  return (
    <section id="features" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Por que elegir Tralok</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Disenado para empresas espanolas que buscan eficiencia y cumplimiento normativo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {beneficios.map((beneficio) => (
            <div key={beneficio.titulo} className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-white hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-3">
                <beneficio.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{beneficio.titulo}</h3>
              <p className="text-slate-600 text-sm">{beneficio.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Seccion Precios
// Sincronizado con seed-plans.ts
function PreciosSection() {
  const planes = [
    { nombre: 'Starter', precio: 19, descripcion: 'Para autonomos que empiezan', features: ['1 sesion simultanea', '2 usuarios', '100 facturas/mes', 'Facturacion basica'], destacado: false },
    { nombre: 'Basico', precio: 35, descripcion: 'Para autonomos y microempresas', features: ['2 sesiones simultaneas', '10 usuarios totales', '200 facturas/mes', 'Compras e inventario'], destacado: false },
    { nombre: 'Profesional', precio: 99, descripcion: 'Para empresas en crecimiento', features: ['15 sesiones simultaneas', '30 usuarios totales', '1.000 facturas/mes', 'Todos los modulos'], destacado: true },
    { nombre: 'Enterprise', precio: 249, descripcion: 'Para grandes organizaciones', features: ['Usuarios ilimitados', 'Facturas ilimitadas', 'API y integraciones', 'Soporte prioritario'], destacado: false }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Planes para cada tipo de negocio</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Elige el plan que mejor se adapte a tu negocio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {planes.map((plan) => (
            <Card key={plan.nombre} className={`relative ${plan.destacado ? 'border-blue-500 border-2 shadow-lg' : 'border-slate-200'}`}>
              {plan.destacado && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white">Mas popular</Badge>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.nombre}</CardTitle>
                <CardDescription>{plan.descripcion}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.precio}€</span>
                  <span className="text-slate-500">/mes</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/register?plan=${plan.nombre.toLowerCase()}`}>
                  <Button className={`w-full ${plan.destacado ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`} variant={plan.destacado ? 'default' : 'outline'}>
                    Contratar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/planes" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
            Ver comparativa completa
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// CTA final
function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Empieza a gestionar tu negocio de forma inteligente
        </h2>
        <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
          Unete a cientos de empresas que ya confian en Tralok para su gestion diaria.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sandbox">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
              Probar sandbox
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="ghost" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-600 px-8 font-semibold">
              Crear cuenta
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// Landing page component
function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-grow">
        <HeroSection />
        <ModulosSection />
        <BeneficiosSection />
        <PreciosSection />
        <CTASection />
      </main>
      <PublicFooter />
    </div>
  )
}

// Loading spinner
function LoadingScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
      <svg
        width="140"
        height="40"
        viewBox="0 0 200 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-auto"
      >
        <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" opacity="0.15"/>
        <circle cx="24" cy="24" r="20" stroke="#1e40af" strokeWidth="2.5" fill="none" strokeDasharray="95 31" strokeLinecap="round"/>
        <rect x="14" y="28" width="4" height="10" rx="1.5" fill="#1e40af"/>
        <rect x="20" y="23" width="4" height="15" rx="1.5" fill="#1e40af"/>
        <rect x="26" y="18" width="4" height="20" rx="1.5" fill="#1e40af"/>
        <circle cx="34" cy="15" r="3" fill="#2563eb"/>
        <text x="54" y="38" fontFamily="GameOfSquids, sans-serif" fontSize="36" fontWeight="700" fill="#1e40af" letterSpacing="1">Tralok</text>
      </svg>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isHydrated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isHydrated && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isHydrated, mounted, router])

  // Mostrar loading mientras se verifica autenticacion
  if (!mounted || !isHydrated) {
    return <LoadingScreen />
  }

  // Si esta autenticado, mostrar loading mientras redirige
  if (isAuthenticated) {
    return <LoadingScreen />
  }

  // Mostrar landing page para usuarios no autenticados
  return <LandingPage />
}
