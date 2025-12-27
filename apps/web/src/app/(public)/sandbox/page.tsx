"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Package,
  Euro,
  ShoppingCart,
  AlertTriangle,
  Lock,
  ArrowRight,
  Eye,
  Calendar,
  Clock,
} from 'lucide-react'

// Datos de ejemplo para el sandbox
const datosDemo = {
  resumen: {
    ventasHoy: 2450.80,
    ventasMes: 45320.50,
    facturasPendientes: 12,
    clientesActivos: 156,
    productosStock: 342,
    pedidosPendientes: 8,
  },
  ultimasVentas: [
    { id: 'F-2024-0156', cliente: 'Empresa ABC SL', importe: 1250.00, estado: 'Pagada' },
    { id: 'F-2024-0155', cliente: 'Juan Garcia', importe: 89.90, estado: 'Pendiente' },
    { id: 'F-2024-0154', cliente: 'Tech Solutions', importe: 3420.00, estado: 'Pagada' },
    { id: 'F-2024-0153', cliente: 'Maria Lopez', importe: 156.50, estado: 'Pendiente' },
    { id: 'F-2024-0152', cliente: 'Global Trade SA', importe: 8900.00, estado: 'Pagada' },
  ],
  productosPopulares: [
    { nombre: 'Laptop Pro 15"', ventas: 45, stock: 12 },
    { nombre: 'Monitor 27" 4K', ventas: 38, stock: 25 },
    { nombre: 'Teclado Mecanico RGB', ventas: 67, stock: 89 },
    { nombre: 'Raton Ergonomico', ventas: 52, stock: 156 },
  ],
  actividadReciente: [
    { tipo: 'venta', descripcion: 'Nueva factura F-2024-0156', tiempo: 'Hace 5 min' },
    { tipo: 'cliente', descripcion: 'Nuevo cliente: Tech Solutions', tiempo: 'Hace 15 min' },
    { tipo: 'stock', descripcion: 'Stock bajo: Laptop Pro 15"', tiempo: 'Hace 30 min' },
    { tipo: 'pago', descripcion: 'Pago recibido: 1.250€', tiempo: 'Hace 1 hora' },
  ],
}

function SandboxBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium text-sm">
            Modo Sandbox - Solo visualizacion, los datos son de ejemplo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/register">
            <Button size="sm" variant="secondary" className="h-7 text-xs">
              Crear cuenta real
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function SandboxSidebar() {
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', active: true },
    { icon: FileText, label: 'Facturas', locked: true },
    { icon: ShoppingCart, label: 'Pedidos', locked: true },
    { icon: Users, label: 'Clientes', locked: true },
    { icon: Package, label: 'Productos', locked: true },
    { icon: Euro, label: 'Tesoreria', locked: true },
    { icon: Calendar, label: 'Calendarios', locked: true },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 pt-16">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Tralok</h1>
        <p className="text-xs text-slate-400">Sandbox Demo</p>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              item.active
                ? 'bg-blue-600 text-white'
                : item.locked
                ? 'text-slate-500 cursor-not-allowed'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.locked && <Lock className="h-3 w-3 ml-auto" />}
          </div>
        ))}
      </nav>
      <div className="mt-8 p-4 bg-slate-800 rounded-lg">
        <p className="text-xs text-slate-400 mb-2">
          Para acceder a todas las funciones, crea tu cuenta.
        </p>
        <Link href="/register">
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
            Registrarse
          </Button>
        </Link>
      </div>
    </aside>
  )
}

function StatCard({ title, value, icon: Icon, trend, trendUp }: {
  title: string
  value: string
  icon: any
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <SandboxBanner />

      <div className="flex pt-10">
        <SandboxSidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500">Vista general de tu negocio (datos de ejemplo)</p>
            </div>

            {/* Alert */}
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Estas en modo sandbox. Los datos mostrados son de ejemplo y no se pueden modificar.
                <Link href="/register" className="ml-2 font-medium underline">
                  Crea tu cuenta
                </Link>{' '}
                para empezar con tu propio negocio.
              </AlertDescription>
            </Alert>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Ventas Hoy"
                value={`${datosDemo.resumen.ventasHoy.toLocaleString('es-ES')}€`}
                icon={Euro}
                trend="+12% vs ayer"
                trendUp={true}
              />
              <StatCard
                title="Ventas del Mes"
                value={`${datosDemo.resumen.ventasMes.toLocaleString('es-ES')}€`}
                icon={TrendingUp}
                trend="+8% vs mes anterior"
                trendUp={true}
              />
              <StatCard
                title="Facturas Pendientes"
                value={datosDemo.resumen.facturasPendientes.toString()}
                icon={FileText}
              />
              <StatCard
                title="Clientes Activos"
                value={datosDemo.resumen.clientesActivos.toString()}
                icon={Users}
                trend="+5 este mes"
                trendUp={true}
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ultimas ventas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ultimas Ventas</CardTitle>
                  <CardDescription>Facturas recientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {datosDemo.ultimasVentas.map((venta) => (
                      <div key={venta.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{venta.id}</p>
                          <p className="text-xs text-slate-500">{venta.cliente}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{venta.importe.toLocaleString('es-ES')}€</p>
                          <Badge variant={venta.estado === 'Pagada' ? 'default' : 'secondary'} className="text-xs">
                            {venta.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4 text-blue-600" disabled>
                    <Lock className="h-3 w-3 mr-2" />
                    Ver todas las facturas
                  </Button>
                </CardContent>
              </Card>

              {/* Productos populares */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productos Populares</CardTitle>
                  <CardDescription>Mas vendidos este mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {datosDemo.productosPopulares.map((producto) => (
                      <div key={producto.nombre} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{producto.nombre}</p>
                          <p className="text-xs text-slate-500">{producto.ventas} vendidos</p>
                        </div>
                        <Badge variant={producto.stock < 20 ? 'destructive' : 'outline'}>
                          Stock: {producto.stock}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4 text-blue-600" disabled>
                    <Lock className="h-3 w-3 mr-2" />
                    Ver catalogo completo
                  </Button>
                </CardContent>
              </Card>

              {/* Actividad reciente */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                  <CardDescription>Ultimos movimientos en tu negocio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {datosDemo.actividadReciente.map((actividad, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{actividad.descripcion}</p>
                          <p className="text-xs text-slate-500">{actividad.tiempo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <Card className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardContent className="py-8">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Te gusta lo que ves?</h3>
                  <p className="text-blue-100 mb-4">
                    Crea tu cuenta y empieza a gestionar tu negocio con datos reales.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link href="/register">
                      <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                        Crear cuenta
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/planes">
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                        Ver planes
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
