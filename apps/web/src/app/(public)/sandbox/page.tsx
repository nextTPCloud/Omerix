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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Filter,
  Download,
  Target,
  Calculator,
  Share2,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
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

// Datos adicionales para CRM
const datosCRM = {
  leads: [
    { id: 1, nombre: 'María García', empresa: 'Tech Startup SL', email: 'maria@techstartup.es', telefono: '612345678', origen: 'Web', etapa: 'Nuevo', valorEstimado: 15000 },
    { id: 2, nombre: 'Carlos López', empresa: 'Retail Pro SA', email: 'carlos@retailpro.es', telefono: '623456789', origen: 'Referido', etapa: 'Contactado', valorEstimado: 45000 },
    { id: 3, nombre: 'Ana Martínez', empresa: 'Consulting Group', email: 'ana@consultinggroup.es', telefono: '634567890', origen: 'LinkedIn', etapa: 'Calificado', valorEstimado: 25000 },
    { id: 4, nombre: 'Pedro Sánchez', empresa: 'Import Export SL', email: 'pedro@importexport.es', telefono: '645678901', origen: 'Feria', etapa: 'Propuesta', valorEstimado: 80000 },
    { id: 5, nombre: 'Laura Fernández', empresa: 'Logística Plus', email: 'laura@logisticaplus.es', telefono: '656789012', origen: 'Web', etapa: 'Negociación', valorEstimado: 120000 },
  ],
  oportunidades: [
    { id: 1, nombre: 'Proyecto ERP Completo', cliente: 'Tech Startup SL', valor: 45000, probabilidad: 75, etapa: 'Propuesta', cierre: '15/02/2024' },
    { id: 2, nombre: 'Migración Cloud', cliente: 'Retail Pro SA', valor: 28000, probabilidad: 50, etapa: 'Negociación', cierre: '28/02/2024' },
    { id: 3, nombre: 'Consultoría Digital', cliente: 'Consulting Group', valor: 15000, probabilidad: 90, etapa: 'Cierre', cierre: '20/01/2024' },
  ],
  actividades: [
    { id: 1, tipo: 'Llamada', asunto: 'Seguimiento propuesta', cliente: 'Tech Startup SL', fecha: '16/01/2024 10:00', completada: false },
    { id: 2, tipo: 'Reunión', asunto: 'Demo producto', cliente: 'Retail Pro SA', fecha: '17/01/2024 15:30', completada: false },
    { id: 3, tipo: 'Email', asunto: 'Envío presupuesto', cliente: 'Consulting Group', fecha: '15/01/2024 09:00', completada: true },
  ],
}

// Datos para contabilidad
const datosContabilidad = {
  cuentas: [
    { codigo: '100', nombre: 'Capital social', tipo: 'Patrimonio', saldo: 50000 },
    { codigo: '430', nombre: 'Clientes', tipo: 'Activo', saldo: 125340.50 },
    { codigo: '400', nombre: 'Proveedores', tipo: 'Pasivo', saldo: 45230.80 },
    { codigo: '570', nombre: 'Caja', tipo: 'Activo', saldo: 3450.25 },
    { codigo: '572', nombre: 'Bancos', tipo: 'Activo', saldo: 87650.00 },
    { codigo: '600', nombre: 'Compras', tipo: 'Gasto', saldo: 234500.00 },
    { codigo: '700', nombre: 'Ventas', tipo: 'Ingreso', saldo: 456780.00 },
  ],
  asientos: [
    { numero: 'A-2024-0156', fecha: '15/01/2024', concepto: 'Venta factura F-2024-0156', debe: 1250.00, haber: 1250.00 },
    { numero: 'A-2024-0155', fecha: '15/01/2024', concepto: 'Cobro cliente ABC', debe: 3420.00, haber: 3420.00 },
    { numero: 'A-2024-0154', fecha: '14/01/2024', concepto: 'Pago proveedor XYZ', debe: 2100.00, haber: 2100.00 },
  ],
  resumen: {
    ingresos: 456780.00,
    gastos: 234500.00,
    resultado: 222280.00,
    activo: 216440.75,
    pasivo: 45230.80,
    patrimonio: 171209.95,
  },
}

type SeccionActiva = 'dashboard' | 'facturas' | 'pedidos' | 'clientes' | 'productos' | 'albaranes' | 'presupuestos' | 'crm' | 'contabilidad' | 'redes-sociales'

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

  const modulosExtra: { icon: any, label: string, seccion: SeccionActiva }[] = [
    { icon: Target, label: 'CRM', seccion: 'crm' },
    { icon: Calculator, label: 'Contabilidad', seccion: 'contabilidad' },
    { icon: Share2, label: 'Redes Sociales', seccion: 'redes-sociales' },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 pt-16">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Omerix</h1>
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
        <p className="text-xs text-slate-500 mb-2 px-3">Modulos extra</p>
        <div className="space-y-1">
          {modulosExtra.map(item => (
            <button
              key={item.label}
              onClick={() => onCambiarSeccion(item.seccion)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                seccion === item.seccion
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              <Badge variant="outline" className="ml-auto text-[10px] h-5 border-purple-500 text-purple-400">Pro</Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 mb-2 px-3">Integraciones</p>
        <div className="space-y-1">
          {[
            { icon: Euro, label: 'Tesoreria' },
            { icon: CalendarDays, label: 'Google Calendar' },
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

function CRMContent() {
  const [filtroEtapa, setFiltroEtapa] = useState('todos')
  const [filtroOrigen, setFiltroOrigen] = useState('todos')

  const leadsFiltrados = datosCRM.leads.filter(lead => {
    if (filtroEtapa !== 'todos' && lead.etapa !== filtroEtapa) return false
    if (filtroOrigen !== 'todos' && lead.origen !== filtroOrigen) return false
    return true
  })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="h-7 w-7 text-purple-600" />
            CRM
          </h1>
          <p className="text-slate-500">Gestiona leads, oportunidades y actividades</p>
        </div>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4" />
          Nuevo Lead
        </Button>
      </div>

      {/* KPIs CRM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Leads Activos</p>
                <p className="text-2xl font-bold">{datosCRM.leads.length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Oportunidades</p>
                <p className="text-2xl font-bold">{datosCRM.oportunidades.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Valor Pipeline</p>
                <p className="text-2xl font-bold">{datosCRM.oportunidades.reduce((acc, o) => acc + o.valor, 0).toLocaleString('es-ES')}€</p>
              </div>
              <Euro className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Actividades Hoy</p>
                <p className="text-2xl font-bold">{datosCRM.actividades.filter(a => !a.completada).length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Leads</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar..." className="pl-10 w-[200px]" />
              </div>
              <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las etapas</SelectItem>
                  <SelectItem value="Nuevo">Nuevo</SelectItem>
                  <SelectItem value="Contactado">Contactado</SelectItem>
                  <SelectItem value="Calificado">Calificado</SelectItem>
                  <SelectItem value="Propuesta">Propuesta</SelectItem>
                  <SelectItem value="Negociación">Negociación</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroOrigen} onValueChange={setFiltroOrigen}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los orígenes</SelectItem>
                  <SelectItem value="Web">Web</SelectItem>
                  <SelectItem value="Referido">Referido</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Feria">Feria</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Valor Est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsFiltrados.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-medium">{lead.nombre}</TableCell>
                  <TableCell>{lead.empresa}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone className="h-3 w-3" />
                      {lead.telefono}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.origen}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      lead.etapa === 'Negociación' ? 'default' :
                      lead.etapa === 'Propuesta' ? 'default' :
                      'secondary'
                    } className={
                      lead.etapa === 'Negociación' ? 'bg-purple-500' :
                      lead.etapa === 'Propuesta' ? 'bg-blue-500' : ''
                    }>
                      {lead.etapa}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {lead.valorEstimado.toLocaleString('es-ES')}€
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actividades */}
      <Card>
        <CardHeader>
          <CardTitle>Actividades Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {datosCRM.actividades.map((actividad) => (
              <div key={actividad.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${actividad.completada ? 'bg-green-100' : 'bg-orange-100'}`}>
                    {actividad.tipo === 'Llamada' ? <Phone className="h-4 w-4 text-orange-600" /> :
                     actividad.tipo === 'Reunión' ? <Users className="h-4 w-4 text-blue-600" /> :
                     <Mail className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{actividad.asunto}</p>
                    <p className="text-xs text-slate-500">{actividad.cliente} - {actividad.fecha}</p>
                  </div>
                </div>
                <Badge variant={actividad.completada ? 'default' : 'outline'}>
                  {actividad.completada ? 'Completada' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function ContabilidadContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="h-7 w-7 text-cyan-600" />
            Contabilidad
          </h1>
          <p className="text-slate-500">Plan de cuentas, asientos e informes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4" />
            Nuevo Asiento
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600 font-medium">Ingresos</p>
            <p className="text-xl font-bold text-green-700">{datosContabilidad.resumen.ingresos.toLocaleString('es-ES')}€</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 font-medium">Gastos</p>
            <p className="text-xl font-bold text-red-700">{datosContabilidad.resumen.gastos.toLocaleString('es-ES')}€</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-600 font-medium">Resultado</p>
            <p className="text-xl font-bold text-blue-700">{datosContabilidad.resumen.resultado.toLocaleString('es-ES')}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Activo</p>
            <p className="text-xl font-bold">{datosContabilidad.resumen.activo.toLocaleString('es-ES')}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Pasivo</p>
            <p className="text-xl font-bold">{datosContabilidad.resumen.pasivo.toLocaleString('es-ES')}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Patrimonio</p>
            <p className="text-xl font-bold">{datosContabilidad.resumen.patrimonio.toLocaleString('es-ES')}€</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan de Cuentas */}
        <Card>
          <CardHeader>
            <CardTitle>Plan de Cuentas</CardTitle>
            <CardDescription>Cuentas contables activas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datosContabilidad.cuentas.map((cuenta) => (
                  <TableRow key={cuenta.codigo}>
                    <TableCell className="font-mono">{cuenta.codigo}</TableCell>
                    <TableCell className="font-medium">{cuenta.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        cuenta.tipo === 'Activo' ? 'border-blue-300 text-blue-600' :
                        cuenta.tipo === 'Pasivo' ? 'border-red-300 text-red-600' :
                        cuenta.tipo === 'Ingreso' ? 'border-green-300 text-green-600' :
                        cuenta.tipo === 'Gasto' ? 'border-orange-300 text-orange-600' :
                        ''
                      }>{cuenta.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {cuenta.saldo.toLocaleString('es-ES')}€
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Ultimos Asientos */}
        <Card>
          <CardHeader>
            <CardTitle>Ultimos Asientos</CardTitle>
            <CardDescription>Movimientos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datosContabilidad.asientos.map((asiento) => (
                  <TableRow key={asiento.numero}>
                    <TableCell className="font-mono text-sm">{asiento.numero}</TableCell>
                    <TableCell>{asiento.fecha}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{asiento.concepto}</TableCell>
                    <TableCell className="text-right text-blue-600">{asiento.debe.toLocaleString('es-ES')}€</TableCell>
                    <TableCell className="text-right text-red-600">{asiento.haber.toLocaleString('es-ES')}€</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function RedesSocialesContent() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="h-7 w-7 text-pink-600" />
            Redes Sociales
          </h1>
          <p className="text-slate-500">Gestiona Facebook e Instagram</p>
        </div>
        <Button className="gap-2 bg-pink-600 hover:bg-pink-700">
          <Plus className="h-4 w-4" />
          Nueva publicacion
        </Button>
      </div>

      {/* Cuentas conectadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Facebook</p>
                <p className="text-sm text-slate-500">@miempresa</p>
              </div>
              <Badge variant="default" className="ml-auto bg-green-500">Conectada</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div>
                <p className="font-bold">12.5K</p>
                <p className="text-xs text-slate-500">Seguidores</p>
              </div>
              <div>
                <p className="font-bold">856</p>
                <p className="text-xs text-slate-500">Posts</p>
              </div>
              <div>
                <p className="font-bold">4.2%</p>
                <p className="text-xs text-slate-500">Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200 bg-pink-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium">Instagram</p>
                <p className="text-sm text-slate-500">@miempresa.oficial</p>
              </div>
              <Badge variant="default" className="ml-auto bg-green-500">Conectada</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div>
                <p className="font-bold">8.9K</p>
                <p className="text-xs text-slate-500">Seguidores</p>
              </div>
              <div>
                <p className="font-bold">342</p>
                <p className="text-xs text-slate-500">Posts</p>
              </div>
              <div>
                <p className="font-bold">5.8%</p>
                <p className="text-xs text-slate-500">Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full py-8">
            <Plus className="h-8 w-8 text-slate-300 mb-2" />
            <p className="font-medium text-slate-500">Conectar cuenta</p>
            <p className="text-sm text-slate-400">Facebook o Instagram</p>
          </CardContent>
        </Card>
      </div>

      {/* Publicaciones programadas */}
      <Card>
        <CardHeader>
          <CardTitle>Publicaciones Programadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { titulo: 'Nuevo producto disponible', fecha: '17/01/2024 10:00', plataforma: 'ambas', estado: 'programada' },
              { titulo: 'Oferta especial fin de semana', fecha: '20/01/2024 09:00', plataforma: 'instagram', estado: 'programada' },
              { titulo: 'Tips de uso', fecha: '22/01/2024 14:00', plataforma: 'facebook', estado: 'borrador' },
            ].map((pub, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium">{pub.titulo}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-3 w-3" />
                      {pub.fecha}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pub.estado === 'programada' ? 'default' : 'secondary'}>
                    {pub.estado}
                  </Badge>
                  <Button variant="outline" size="sm">Editar</Button>
                </div>
              </div>
            ))}
          </div>
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
      case 'crm':
        return <CRMContent />
      case 'contabilidad':
        return <ContabilidadContent />
      case 'redes-sociales':
        return <RedesSocialesContent />
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
