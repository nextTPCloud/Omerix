"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  ArrowRight,
  Eye,
  Calendar,
  Clock,
  Search,
  Plus,
  Building2,
  Truck,
  CreditCard,
  Receipt,
  ClipboardList,
  Boxes,
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
  facturas: [
    { numero: 'F-2024-0156', fecha: '15/01/2024', cliente: 'Empresa ABC SL', base: 1033.06, iva: 216.94, total: 1250.00, estado: 'Pagada' },
    { numero: 'F-2024-0155', fecha: '15/01/2024', cliente: 'Juan Garcia', base: 74.30, iva: 15.60, total: 89.90, estado: 'Pendiente' },
    { numero: 'F-2024-0154', fecha: '14/01/2024', cliente: 'Tech Solutions', base: 2826.45, iva: 593.55, total: 3420.00, estado: 'Pagada' },
    { numero: 'F-2024-0153', fecha: '14/01/2024', cliente: 'Maria Lopez', base: 129.34, iva: 27.16, total: 156.50, estado: 'Pendiente' },
    { numero: 'F-2024-0152', fecha: '13/01/2024', cliente: 'Global Trade SA', base: 7355.37, iva: 1544.63, total: 8900.00, estado: 'Pagada' },
    { numero: 'F-2024-0151', fecha: '13/01/2024', cliente: 'Distribuciones Norte SL', base: 2479.34, iva: 520.66, total: 3000.00, estado: 'Pagada' },
    { numero: 'F-2024-0150', fecha: '12/01/2024', cliente: 'Comercial Este SA', base: 4132.23, iva: 867.77, total: 5000.00, estado: 'Vencida' },
  ],
  pedidos: [
    { numero: 'P-2024-0089', fecha: '15/01/2024', cliente: 'Tech Solutions', total: 5600.00, estado: 'Pendiente' },
    { numero: 'P-2024-0088', fecha: '14/01/2024', cliente: 'Empresa ABC SL', total: 2340.00, estado: 'Confirmado' },
    { numero: 'P-2024-0087', fecha: '14/01/2024', cliente: 'Maria Lopez', total: 890.00, estado: 'En preparacion' },
    { numero: 'P-2024-0086', fecha: '13/01/2024', cliente: 'Global Trade SA', total: 12500.00, estado: 'Enviado' },
    { numero: 'P-2024-0085', fecha: '12/01/2024', cliente: 'Juan Garcia', total: 450.00, estado: 'Entregado' },
  ],
  clientes: [
    { nombre: 'Empresa ABC SL', nif: 'B12345678', email: 'contacto@empresaabc.es', telefono: '912345678', ventas: 45320.50 },
    { nombre: 'Tech Solutions', nif: 'B87654321', email: 'info@techsolutions.es', telefono: '934567890', ventas: 38500.00 },
    { nombre: 'Global Trade SA', nif: 'A11223344', email: 'comercial@globaltrade.es', telefono: '916789012', ventas: 125000.00 },
    { nombre: 'Maria Lopez', nif: '12345678A', email: 'maria.lopez@email.com', telefono: '654321098', ventas: 2450.00 },
    { nombre: 'Juan Garcia', nif: '87654321B', email: 'juan.garcia@email.com', telefono: '612345678', ventas: 1890.00 },
    { nombre: 'Distribuciones Norte SL', nif: 'B55667788', email: 'pedidos@distnorte.es', telefono: '985123456', ventas: 67800.00 },
  ],
  productos: [
    { sku: 'LAP-PRO-15', nombre: 'Laptop Pro 15"', familia: 'Portatiles', precio: 1299.00, stock: 12, minimo: 10 },
    { sku: 'MON-4K-27', nombre: 'Monitor 27" 4K', familia: 'Monitores', precio: 449.00, stock: 25, minimo: 15 },
    { sku: 'TEC-MEC-RGB', nombre: 'Teclado Mecanico RGB', familia: 'Perifericos', precio: 89.90, stock: 89, minimo: 30 },
    { sku: 'RAT-ERG-01', nombre: 'Raton Ergonomico', familia: 'Perifericos', precio: 45.00, stock: 156, minimo: 50 },
    { sku: 'AUR-BT-PRO', nombre: 'Auriculares Bluetooth Pro', familia: 'Audio', precio: 179.00, stock: 8, minimo: 20 },
    { sku: 'CAM-WEB-HD', nombre: 'Webcam HD 1080p', familia: 'Perifericos', precio: 69.00, stock: 45, minimo: 25 },
    { sku: 'HUB-USB-C', nombre: 'Hub USB-C 7 puertos', familia: 'Accesorios', precio: 39.00, stock: 78, minimo: 40 },
  ],
  albaranes: [
    { numero: 'ALB-2024-0234', fecha: '15/01/2024', cliente: 'Tech Solutions', lineas: 5, estado: 'Pendiente facturar' },
    { numero: 'ALB-2024-0233', fecha: '14/01/2024', cliente: 'Empresa ABC SL', lineas: 3, estado: 'Facturado' },
    { numero: 'ALB-2024-0232', fecha: '14/01/2024', cliente: 'Global Trade SA', lineas: 8, estado: 'Facturado' },
    { numero: 'ALB-2024-0231', fecha: '13/01/2024', cliente: 'Maria Lopez', lineas: 2, estado: 'Pendiente facturar' },
  ],
  presupuestos: [
    { numero: 'PRE-2024-0078', fecha: '15/01/2024', cliente: 'Nuevo Cliente SL', total: 15600.00, validez: '30 dias', estado: 'Enviado' },
    { numero: 'PRE-2024-0077', fecha: '14/01/2024', cliente: 'Tech Solutions', total: 8900.00, validez: '15 dias', estado: 'Aceptado' },
    { numero: 'PRE-2024-0076', fecha: '13/01/2024', cliente: 'Empresa ABC SL', total: 4500.00, validez: '30 dias', estado: 'Rechazado' },
  ],
  actividadReciente: [
    { tipo: 'venta', descripcion: 'Nueva factura F-2024-0156', tiempo: 'Hace 5 min' },
    { tipo: 'cliente', descripcion: 'Nuevo cliente: Tech Solutions', tiempo: 'Hace 15 min' },
    { tipo: 'stock', descripcion: 'Stock bajo: Laptop Pro 15"', tiempo: 'Hace 30 min' },
    { tipo: 'pago', descripcion: 'Pago recibido: 1.250€', tiempo: 'Hace 1 hora' },
  ],
}

type SeccionActiva = 'dashboard' | 'facturas' | 'pedidos' | 'clientes' | 'productos' | 'albaranes' | 'presupuestos'

function SandboxBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium text-sm">
            Modo Sandbox - Explora todas las funciones con datos de ejemplo
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

function SandboxSidebar({ seccion, onCambiarSeccion }: { seccion: SeccionActiva, onCambiarSeccion: (s: SeccionActiva) => void }) {
  const menuItems: { icon: any, label: string, seccion: SeccionActiva }[] = [
    { icon: BarChart3, label: 'Dashboard', seccion: 'dashboard' },
    { icon: FileText, label: 'Facturas', seccion: 'facturas' },
    { icon: ShoppingCart, label: 'Pedidos', seccion: 'pedidos' },
    { icon: Receipt, label: 'Presupuestos', seccion: 'presupuestos' },
    { icon: Truck, label: 'Albaranes', seccion: 'albaranes' },
    { icon: Users, label: 'Clientes', seccion: 'clientes' },
    { icon: Package, label: 'Productos', seccion: 'productos' },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 pt-16">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Tralok</h1>
        <p className="text-xs text-slate-400">Sandbox Demo</p>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onCambiarSeccion(item.seccion)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              seccion === item.seccion
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 mb-2 px-3">Modulos adicionales</p>
        <div className="space-y-1">
          {[
            { icon: Euro, label: 'Tesoreria' },
            { icon: Calendar, label: 'Calendarios' },
            { icon: CreditCard, label: 'TPV' },
            { icon: ClipboardList, label: 'Proyectos' },
            { icon: Building2, label: 'Compras' },
            { icon: Boxes, label: 'Inventario' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500">
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              <Badge variant="outline" className="ml-auto text-[10px] h-5 border-slate-600 text-slate-500">Add-on</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-800 rounded-lg">
        <p className="text-xs text-slate-400 mb-2">
          Crea tu cuenta para usar datos reales.
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

function DashboardContent() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Vista general de tu negocio (datos de ejemplo)</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ultimas Ventas</CardTitle>
            <CardDescription>Facturas recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {datosDemo.facturas.slice(0, 5).map((factura) => (
                <div key={factura.numero} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{factura.numero}</p>
                    <p className="text-xs text-slate-500">{factura.cliente}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{factura.total.toLocaleString('es-ES')}€</p>
                    <Badge variant={factura.estado === 'Pagada' ? 'default' : factura.estado === 'Vencida' ? 'destructive' : 'secondary'} className="text-xs">
                      {factura.estado}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Productos Populares</CardTitle>
            <CardDescription>Mas vendidos este mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {datosDemo.productos.slice(0, 4).map((producto) => (
                <div key={producto.sku} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{producto.nombre}</p>
                    <p className="text-xs text-slate-500">{producto.precio.toLocaleString('es-ES')}€</p>
                  </div>
                  <Badge variant={producto.stock < producto.minimo ? 'destructive' : 'outline'}>
                    Stock: {producto.stock}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Actividad Reciente</CardTitle>
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
    </>
  )
}

function FacturasContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="text-slate-500">Gestion de facturas de venta</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Factura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar facturas..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosDemo.facturas.map((factura) => (
                <TableRow key={factura.numero} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-medium">{factura.numero}</TableCell>
                  <TableCell>{factura.fecha}</TableCell>
                  <TableCell>{factura.cliente}</TableCell>
                  <TableCell className="text-right">{factura.base.toLocaleString('es-ES')}€</TableCell>
                  <TableCell className="text-right">{factura.iva.toLocaleString('es-ES')}€</TableCell>
                  <TableCell className="text-right font-medium">{factura.total.toLocaleString('es-ES')}€</TableCell>
                  <TableCell>
                    <Badge variant={factura.estado === 'Pagada' ? 'default' : factura.estado === 'Vencida' ? 'destructive' : 'secondary'}>
                      {factura.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function PedidosContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
          <p className="text-slate-500">Gestion de pedidos de clientes</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar pedidos..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosDemo.pedidos.map((pedido) => (
                <TableRow key={pedido.numero} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-medium">{pedido.numero}</TableCell>
                  <TableCell>{pedido.fecha}</TableCell>
                  <TableCell>{pedido.cliente}</TableCell>
                  <TableCell className="text-right font-medium">{pedido.total.toLocaleString('es-ES')}€</TableCell>
                  <TableCell>
                    <Badge variant={
                      pedido.estado === 'Entregado' ? 'default' :
                      pedido.estado === 'Enviado' ? 'default' :
                      pedido.estado === 'Confirmado' ? 'secondary' :
                      'outline'
                    }>
                      {pedido.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function ClientesContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500">Gestion de clientes</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar clientes..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>NIF/CIF</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead className="text-right">Ventas totales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosDemo.clientes.map((cliente) => (
                <TableRow key={cliente.nif} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-medium">{cliente.nombre}</TableCell>
                  <TableCell>{cliente.nif}</TableCell>
                  <TableCell>{cliente.email}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell className="text-right font-medium">{cliente.ventas.toLocaleString('es-ES')}€</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function ProductosContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
          <p className="text-slate-500">Catalogo de productos</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar productos..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Familia</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosDemo.productos.map((producto) => (
                <TableRow key={producto.sku} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-mono text-sm">{producto.sku}</TableCell>
                  <TableCell className="font-medium">{producto.nombre}</TableCell>
                  <TableCell>{producto.familia}</TableCell>
                  <TableCell className="text-right">{producto.precio.toLocaleString('es-ES')}€</TableCell>
                  <TableCell className="text-right">{producto.stock}</TableCell>
                  <TableCell>
                    <Badge variant={producto.stock < producto.minimo ? 'destructive' : 'default'}>
                      {producto.stock < producto.minimo ? 'Stock bajo' : 'OK'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function AlbaranesContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Albaranes</h1>
          <p className="text-slate-500">Albaranes de entrega</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Albaran
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar albaranes..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Lineas</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosDemo.albaranes.map((albaran) => (
                <TableRow key={albaran.numero} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-medium">{albaran.numero}</TableCell>
                  <TableCell>{albaran.fecha}</TableCell>
                  <TableCell>{albaran.cliente}</TableCell>
                  <TableCell className="text-right">{albaran.lineas}</TableCell>
                  <TableCell>
                    <Badge variant={albaran.estado === 'Facturado' ? 'default' : 'secondary'}>
                      {albaran.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function PresupuestosContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuestos</h1>
          <p className="text-slate-500">Presupuestos y ofertas</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Presupuesto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar presupuestos..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Validez</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosDemo.presupuestos.map((presupuesto) => (
                <TableRow key={presupuesto.numero} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-medium">{presupuesto.numero}</TableCell>
                  <TableCell>{presupuesto.fecha}</TableCell>
                  <TableCell>{presupuesto.cliente}</TableCell>
                  <TableCell className="text-right font-medium">{presupuesto.total.toLocaleString('es-ES')}€</TableCell>
                  <TableCell>{presupuesto.validez}</TableCell>
                  <TableCell>
                    <Badge variant={
                      presupuesto.estado === 'Aceptado' ? 'default' :
                      presupuesto.estado === 'Rechazado' ? 'destructive' :
                      'secondary'
                    }>
                      {presupuesto.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

export default function SandboxPage() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>('dashboard')

  const renderContenido = () => {
    switch (seccionActiva) {
      case 'dashboard':
        return <DashboardContent />
      case 'facturas':
        return <FacturasContent />
      case 'pedidos':
        return <PedidosContent />
      case 'clientes':
        return <ClientesContent />
      case 'productos':
        return <ProductosContent />
      case 'albaranes':
        return <AlbaranesContent />
      case 'presupuestos':
        return <PresupuestosContent />
      default:
        return <DashboardContent />
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <SandboxBanner />

      <div className="flex pt-10">
        <SandboxSidebar seccion={seccionActiva} onCambiarSeccion={setSeccionActiva} />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Modo sandbox - Los datos son de ejemplo. Los botones y acciones estan deshabilitados.
                <Link href="/register" className="ml-2 font-medium underline">
                  Crea tu cuenta
                </Link>{' '}
                para trabajar con datos reales.
              </AlertDescription>
            </Alert>

            {renderContenido()}

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
