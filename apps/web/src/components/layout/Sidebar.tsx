"use client"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  BarChart3,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wrench,
  Wallet,
  Truck,
  Receipt,
  Calendar,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
  FolderTree,
  Warehouse,
  Percent,
  Tag,
  ListChecks,
  Layers,
  UtensilsCrossed,
  Printer,
  ChefHat,
  AlertTriangle,
  SlidersHorizontal,
  Grid3X3,
  Palette,
  Database,
  FileStack,
  CreditCard,
  Clock,
  Landmark,
  Briefcase,
  UserCog,
  Star,
  FolderKanban,
  CalendarDays,
  Timer,
  Fingerprint,
  ArrowRightLeft,
  ClipboardList,
  Edit,
  CheckSquare,
  FileBarChart,
  Shield,
  Calculator,
  Download,
  PieChart,
  Target,
  UserPlus,
  Phone,
  Kanban,
  Share2,
  Bell,
  Plug,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavoritosContext } from '@/contexts/FavoritosContext'
import { usePermissions } from '@/hooks/usePermissions'
import { useLicense } from '@/hooks/useLicense'
import { useAuthStore } from '@/stores/authStore'
import { IPermisosEspeciales } from '@/types/permissions.types'

interface MenuItem {
  title: string
  href?: string
  icon: any
  adminOnly?: boolean
  children?: {
    title: string
    href: string
  }[]
}

// Mapeo de iconos por nombre para los favoritos
const iconMap: { [key: string]: any } = {
  Home, Users, Package, ShoppingCart, FileText, Settings, BarChart3,
  TrendingUp, TrendingDown, Wrench, Wallet, Truck, Receipt, Calendar,
  Building2, BookOpen, FolderTree, Warehouse, Percent, Tag, ListChecks,
  Layers, UtensilsCrossed, Printer, ChefHat, AlertTriangle, SlidersHorizontal,
  Grid3X3, Palette, Database, FileStack, CreditCard, Clock, Landmark,
  Briefcase, UserCog, Star, FolderKanban, CalendarDays, Timer, Fingerprint,
  ArrowRightLeft, ClipboardList, Edit, CheckSquare, FileBarChart,
  Calculator, Download, PieChart, Target, UserPlus, Phone, Kanban,
  Share2, Bell, Plug,
}

// Tipo de permiso requerido para cada grupo
type PermisoGrupo = keyof IPermisosEspeciales | null

interface MenuGroup {
  group: string
  icon: any
  items: MenuItem[]
  permiso?: PermisoGrupo // Permiso requerido para ver este grupo
  moduloLicencia?: string // Modulo de licencia requerido para acceder
  proximamente?: boolean // Modulo en desarrollo
  requierePersonalId?: boolean // Solo visible si el usuario tiene empleado vinculado
  requiereAlgunModulo?: boolean // Solo visible si tiene al menos un módulo funcional
}

const menuGroups: MenuGroup[] = [
  // ═══════════════════════════════════════════════════════════════
  // MÓDULOS FUNCIONALES (según licencia)
  // ═══════════════════════════════════════════════════════════════
  {
    group: 'Ventas',
    icon: TrendingUp,
    permiso: 'accesoVentas',
    moduloLicencia: 'ventas',
    items: [
      {
        title: 'Clientes',
        href: '/clientes',
        icon: Users,
      },
      {
        title: 'Presupuestos',
        icon: FileText,
        children: [
          { title: 'Listado presupuestos', href: '/presupuestos' },
          { title: 'Nuevo presupuesto', href: '/presupuestos/nuevo' },
        ],
      },
      {
        title: 'Pedidos',
        icon: ShoppingCart,
        children: [
          { title: 'Listado pedidos', href: '/pedidos' },
          { title: 'Nuevo pedido', href: '/pedidos/nuevo' },
        ],
      },
      {
        title: 'Albaranes',
        icon: Truck,
        children: [
          { title: 'Listado albaranes', href: '/albaranes' },
          { title: 'Nuevo albarán', href: '/albaranes/nuevo' },
        ],
      },
      {
        title: 'Facturas',
        icon: Receipt,
        children: [
          { title: 'Listado facturas', href: '/facturas' },
          { title: 'Nueva factura', href: '/facturas/nuevo' },
        ],
      },
      {
        title: 'Agentes Comerciales',
        href: '/agentes-comerciales',
        icon: Briefcase,
      },
      // Configuración integrada en Ventas
      {
        title: 'Tarifas',
        href: '/tarifas',
        icon: Tag,
      },
      {
        title: 'Ofertas',
        href: '/ofertas',
        icon: Percent,
      },
    ],
  },
  {
    group: 'Compras',
    icon: TrendingDown,
    permiso: 'accesoCompras',
    moduloLicencia: 'compras',
    items: [
      {
        title: 'Proveedores',
        href: '/proveedores',
        icon: Building2,
      },
      {
        title: 'Presupuestos',
        icon: FileText,
        children: [
          { title: 'Listado presupuestos compra', href: '/compras/presupuestos' },
          { title: 'Nuevo presupuesto compra', href: '/compras/presupuestos/nuevo' },
        ],
      },
      {
        title: 'Pedidos',
        icon: ShoppingCart,
        children: [
          { title: 'Listado pedidos compra', href: '/compras/pedidos' },
          { title: 'Nuevo pedido compra', href: '/compras/pedidos/nuevo' },
        ],
      },
      {
        title: 'Albaranes',
        icon: Truck,
        children: [
          { title: 'Listado albaranes compra', href: '/compras/albaranes' },
          { title: 'Nuevo albarán compra', href: '/compras/albaranes/nuevo' },
        ],
      },
      {
        title: 'Facturas',
        icon: Receipt,
        children: [
          { title: 'Listado facturas compra', href: '/compras/facturas' },
          { title: 'Nueva factura compra', href: '/compras/facturas/nuevo' },
        ],
      },
      ],
  },
  {
    group: 'Tesorería',
    icon: Wallet,
    // Sin permiso requerido - solo necesita el módulo de licencia
    moduloLicencia: 'tesoreria',
    items: [
      {
        title: 'Vencimientos',
        icon: Calendar,
        children: [
          { title: 'Cobros', href: '/tesoreria/cobros' },
          { title: 'Pagos', href: '/tesoreria/pagos' },
        ],
      },
      {
        title: 'Pagarés',
        href: '/tesoreria/pagares',
        icon: FileText,
      },
      {
        title: 'Recibos',
        href: '/tesoreria/recibos',
        icon: Receipt,
      },
      {
        title: 'Movimientos',
        href: '/tesoreria/movimientos',
        icon: Wallet,
      },
      {
        title: 'Cuentas Bancarias',
        href: '/tesoreria/cuentas-bancarias',
        icon: Landmark,
      },
      {
        title: 'Conciliación',
        href: '/tesoreria/conciliacion',
        icon: CheckSquare,
      },
      {
        title: 'Previsiones',
        href: '/tesoreria/previsiones',
        icon: TrendingUp,
      },
      // Configuración integrada en Tesorería
      {
        title: 'Formas de Pago',
        href: '/formas-pago',
        icon: CreditCard,
      },
      {
        title: 'Términos de Pago',
        href: '/terminos-pago',
        icon: Clock,
      },
    ],
  },
  {
    group: 'Contabilidad',
    icon: Calculator,
    moduloLicencia: 'contabilidad',
    items: [
      {
        title: 'Panel',
        href: '/contabilidad',
        icon: Calculator,
      },
      {
        title: 'Plan de Cuentas',
        href: '/contabilidad/cuentas',
        icon: BookOpen,
      },
      {
        title: 'Asientos',
        icon: FileText,
        children: [
          { title: 'Listado asientos', href: '/contabilidad/asientos' },
          { title: 'Nuevo asiento', href: '/contabilidad/asientos/nuevo' },
        ],
      },
      {
        title: 'Informes',
        icon: BarChart3,
        children: [
          { title: 'Libro Diario', href: '/contabilidad/informes/libro-diario' },
          { title: 'Libro Mayor', href: '/contabilidad/informes/libro-mayor' },
          { title: 'Sumas y Saldos', href: '/contabilidad/informes/sumas-saldos' },
          { title: 'Balance Situación', href: '/contabilidad/informes/balance' },
          { title: 'Cuenta Resultados', href: '/contabilidad/informes/resultados' },
        ],
      },
      {
        title: 'Exportación',
        href: '/contabilidad/exportar',
        icon: Download,
      },
    ],
  },
  {
    group: 'Mi Fichaje',
    icon: Fingerprint,
    requierePersonalId: true, // Solo visible si el usuario tiene empleado vinculado
    items: [
      {
        title: 'Fichar',
        href: '/fichaje',
        icon: Fingerprint,
      },
    ],
  },
  {
    group: 'RRHH',
    icon: UserCog,
    moduloLicencia: 'rrhh',
    permiso: 'accesoRRHH', // Requiere permiso además de módulo
    items: [
      {
        title: 'Personal',
        href: '/personal',
        icon: Users,
      },
      {
        title: 'Departamentos',
        href: '/departamentos',
        icon: Building2,
      },
      {
        title: 'Turnos',
        href: '/turnos',
        icon: Timer,
      },
      {
        title: 'Calendarios',
        href: '/calendarios',
        icon: CalendarDays,
      },
      {
        title: 'Fichajes',
        href: '/fichajes',
        icon: Fingerprint,
        adminOnly: true,
      },
      {
        title: 'Terminales',
        href: '/terminales',
        icon: Fingerprint,
      },
    ],
  },
  {
    group: 'Almacenes',
    icon: Package,
    permiso: 'accesoAlmacen',
    moduloLicencia: 'inventario',
    items: [
      {
        title: 'Productos',
        href: '/productos',
        icon: Package,
      },
      {
        title: 'Familias',
        href: '/familias',
        icon: FolderTree,
      },
      {
        title: 'Almacenes',
        href: '/almacenes',
        icon: Warehouse,
      },
      {
        title: 'Stock Actual',
        href: '/almacenes/stock',
        icon: BarChart3,
      },
      {
        title: 'Movimientos',
        href: '/almacenes/movimientos',
        icon: ArrowRightLeft,
      },
      {
        title: 'Traspasos',
        icon: Truck,
        children: [
          { title: 'Listado traspasos', href: '/almacenes/traspasos' },
          { title: 'Nuevo traspaso', href: '/almacenes/traspasos/nuevo' },
        ],
      },
      {
        title: 'Inventarios',
        icon: ClipboardList,
        children: [
          { title: 'Listado inventarios', href: '/almacenes/inventarios' },
          { title: 'Nuevo inventario', href: '/almacenes/inventarios/nuevo' },
        ],
      },
      {
        title: 'Ajustes',
        href: '/almacenes/ajustes/nuevo',
        icon: Edit,
      },
      {
        title: 'Variantes',
        href: '/variantes',
        icon: Palette,
      },
    ],
  },
  {
    group: 'Servicios',
    icon: Wrench,
    permiso: 'accesoVentas',
    moduloLicencia: 'proyectos',
    items: [
      {
        title: 'Proyectos',
        icon: FolderKanban,
        children: [
          { title: 'Listado proyectos', href: '/proyectos' },
          { title: 'Nuevo proyecto', href: '/proyectos/nuevo' },
        ],
      },
      {
        title: 'Partes de Trabajo',
        icon: Wrench,
        children: [
          { title: 'Planificación', href: '/servicios/planificacion' },
          { title: 'Listado partes', href: '/partes-trabajo' },
          { title: 'Nuevo parte', href: '/partes-trabajo/nuevo' },
        ],
      },
      {
        title: 'Maquinaria',
        href: '/maquinaria',
        icon: Truck,
      },
      {
        title: 'Tipos de Gasto',
        href: '/tipos-gasto',
        icon: Tag,
      },
    ],
  },
  {
    group: 'CRM',
    icon: Target,
    moduloLicencia: 'crm',
    items: [
      {
        title: 'Panel CRM',
        href: '/crm',
        icon: Target,
      },
      {
        title: 'Leads',
        icon: UserPlus,
        children: [
          { title: 'Listado leads', href: '/crm/leads' },
          { title: 'Nuevo lead', href: '/crm/leads/nuevo' },
        ],
      },
      {
        title: 'Oportunidades',
        icon: Kanban,
        children: [
          { title: 'Pipeline', href: '/crm/oportunidades' },
          { title: 'Nueva oportunidad', href: '/crm/oportunidades/nueva' },
        ],
      },
      {
        title: 'Actividades',
        icon: Phone,
        children: [
          { title: 'Listado actividades', href: '/crm/actividades' },
          { title: 'Nueva actividad', href: '/crm/actividades/nueva' },
        ],
      },
      {
        title: 'Configuración Pipeline',
        href: '/crm/configuracion/pipeline',
        icon: Settings,
      },
    ],
  },
  {
    group: 'Redes Sociales',
    icon: Share2,
    moduloLicencia: 'redes-sociales',
    items: [
      {
        title: 'Panel',
        href: '/redes-sociales',
        icon: Share2,
      },
      {
        title: 'Publicaciones',
        href: '/redes-sociales/publicaciones',
        icon: FileText,
      },
      {
        title: 'Programar',
        href: '/redes-sociales/programar',
        icon: Calendar,
      },
      {
        title: 'Cuentas',
        href: '/redes-sociales/cuentas',
        icon: Users,
      },
    ],
  },
  {
    group: 'Integraciones',
    icon: Plug,
    requiereAlgunModulo: true,
    items: [
      {
        title: 'Google Calendar',
        href: '/integraciones/google-calendar',
        icon: Calendar,
      },
      {
        title: 'Recordatorios',
        href: '/recordatorios',
        icon: Bell,
      },
    ],
  },
  {
    group: 'Punto de Venta',
    icon: Grid3X3,
    moduloLicencia: 'tpv',
    items: [
      {
        title: 'Terminales TPV',
        href: '/configuracion/tpv',
        icon: Grid3X3,
      },
    ],
  },
  {
    group: 'Restauración',
    icon: UtensilsCrossed,
    permiso: 'accesoTPV',
    moduloLicencia: 'restauracion',
    items: [
      {
        title: 'Terminales TPV',
        href: '/configuracion/tpv',
        icon: Grid3X3,
      },
      {
        title: 'Zonas Preparación',
        href: '/zonas-preparacion',
        icon: ChefHat,
      },
      {
        title: 'Impresoras',
        href: '/impresoras',
        icon: Printer,
      },
      {
        title: 'Alérgenos',
        href: '/alergenos',
        icon: AlertTriangle,
      },
      {
        title: 'Modificadores',
        icon: SlidersHorizontal,
        children: [
          { title: 'Modificadores', href: '/modificadores' },
          { title: 'Grupos', href: '/grupos-modificadores' },
        ],
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURACIÓN (según licencia o siempre visible)
  // ═══════════════════════════════════════════════════════════════
  {
    group: 'Ficheros',
    icon: FileStack,
    moduloLicencia: 'ventas', // Solo si tiene ventas (documentos comerciales)
    items: [
      {
        title: 'Series de Documentos',
        href: '/series-documentos',
        icon: FileStack,
      },
      {
        title: 'Tipos de Impuesto',
        href: '/tipos-impuesto',
        icon: Percent,
      },
      {
        title: 'Estados',
        href: '/estados',
        icon: ListChecks,
      },
      {
        title: 'Situaciones',
        href: '/situaciones',
        icon: Layers,
      },
      {
        title: 'Clasificaciones',
        href: '/clasificaciones',
        icon: FolderTree,
      },
    ],
  },
  {
    group: 'Mi Empresa',
    icon: Building2,
    requiereAlgunModulo: true, // Solo visible si tiene al menos un módulo funcional
    items: [
      {
        title: 'Configuración',
        href: '/configuracion',
        icon: Settings,
      },
    ],
  },
  {
    group: 'Desarrolladores',
    icon: BookOpen,
    moduloLicencia: 'api', // Solo para planes con acceso API (Profesional+)
    items: [
      {
        title: 'API Docs',
        href: '/api-docs',
        icon: BookOpen,
      },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { favoritos, isFavorito, toggleFavorito, loading: favoritosLoading } = useFavoritosContext()
  const { can } = usePermissions()
  const { hasModule, plan, loading: licenseLoading } = useLicense()
  const { user } = useAuthStore()

  // Superadmin tiene acceso completo sin restricciones de licencia
  const isSuperadmin = user?.rol === 'superadmin'

  // Verificar si el usuario tiene empleado vinculado (para Mi Fichaje)
  const tienePersonalId = !!(user as any)?.personalId

  // Verificar si el usuario tiene acceso a algún módulo funcional
  // Esto determina si ve Dashboard/Informes o solo Mi Fichaje
  const modulosFuncionales = ['ventas', 'compras', 'contabilidad', 'rrhh', 'inventario', 'proyectos', 'crm', 'restauracion']
  const tieneAlgunModulo = isSuperadmin || modulosFuncionales.some(modulo => hasModule(modulo))

  // Filtrar grupos del menú según permisos Y licencia
  // Ocultamos completamente los módulos no incluidos en el plan
  const filteredMenuGroups = menuGroups.filter(group => {
    // Verificar permiso si está definido
    if (group.permiso && !can(group.permiso)) return false

    // Verificar si requiere personalId (ej: Mi Fichaje)
    if (group.requierePersonalId && !tienePersonalId) return false

    // Verificar si requiere al menos un módulo funcional
    if (group.requiereAlgunModulo && !tieneAlgunModulo) return false

    // Verificar licencia de módulo (ocultar si no está incluido)
    // Superadmin ve todo, y módulos sin restricción de licencia siempre se muestran
    if (group.moduloLicencia && !isSuperadmin) {
      if (!hasModule(group.moduloLicencia)) return false
    }

    return true
  })

  // Recopilar todas las rutas del menú para determinar coincidencias exactas
  const allMenuHrefs = useMemo(() => {
    const hrefs: string[] = []
    for (const group of menuGroups) {
      for (const item of group.items) {
        if (item.href) hrefs.push(item.href)
        if (item.children) {
          for (const child of item.children) {
            hrefs.push(child.href)
          }
        }
      }
    }
    return hrefs
  }, [])

  // Función para verificar si una ruta es la más específica para el pathname actual
  const isActiveHref = (href: string): boolean => {
    // Coincidencia exacta siempre es activa
    if (pathname === href) return true

    // Si el pathname comienza con href/, verificar que no haya otra ruta más específica
    if (pathname.startsWith(href + '/')) {
      // Buscar si hay otra ruta del menú que sea más específica (más larga y también coincida)
      const hasMoreSpecific = allMenuHrefs.some(otherHref =>
        otherHref !== href &&
        otherHref.startsWith(href + '/') &&
        (pathname === otherHref || pathname.startsWith(otherHref + '/'))
      )
      return !hasMoreSpecific
    }

    return false
  }

  // Auto-expandir grupos e items basándose en la ruta actual
  // Usar useMemo para calcular qué grupos e items deben estar expandidos
  const { activeGroup, activeItem } = useMemo(() => {
    let foundGroup: string | null = null
    let foundItem: string | null = null

    // Buscar en todos los grupos del menú (no solo los filtrados)
    for (const group of menuGroups) {
      for (const item of group.items) {
        // Verificar si la ruta actual coincide con un item directo
        if (item.href && isActiveHref(item.href)) {
          foundGroup = group.group
          break
        }

        // Verificar si la ruta actual coincide con algún hijo
        if (item.children) {
          for (const child of item.children) {
            if (isActiveHref(child.href)) {
              foundGroup = group.group
              foundItem = item.title
              break
            }
          }
          if (foundItem) break
        }
      }
      if (foundGroup) break
    }

    return { activeGroup: foundGroup, activeItem: foundItem }
  }, [pathname, allMenuHrefs])

  // Efecto para expandir automáticamente el grupo e item activos cuando cambia la ruta
  useEffect(() => {
    if (activeGroup && !expandedGroups.includes(activeGroup)) {
      setExpandedGroups((prev) => [...prev, activeGroup])
    }
    if (activeItem && !expandedItems.includes(activeItem)) {
      setExpandedItems((prev) => [...prev, activeItem])
    }
  }, [activeGroup, activeItem]) // Intencionalmente sin expandedGroups/expandedItems para evitar loops

  const toggleGroup = (group: string) => {
    if (isCollapsed) return
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    )
  }

  const toggleItem = (title: string) => {
    if (isCollapsed) return
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] border-r transition-all duration-300 ease-in-out",
          "bg-slate-900 dark:bg-slate-950",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Toggle button */}
          <div className={cn(
            "flex items-center border-b border-slate-800 p-2",
            isCollapsed ? "justify-center" : "justify-end"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 hidden lg:flex text-slate-400 hover:text-white hover:bg-slate-800"
              title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            >
              {isCollapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Menu */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-2 px-2">
              {/* Dashboard - Solo visible si tiene algún módulo funcional */}
              {tieneAlgunModulo && (
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    pathname === '/dashboard'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? "Dashboard" : undefined}
                >
                  <Home className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>Dashboard</span>}
                </Link>
              )}

              {/* Panel Administracion - Solo visible para superadmin */}
              {isSuperadmin && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    pathname.startsWith('/admin')
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'text-amber-400 hover:bg-slate-800 hover:text-amber-300',
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? "Panel Administracion" : undefined}
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>Panel Administracion</span>}
                </Link>
              )}

              {/* Informes - Solo visible si tiene algún módulo funcional */}
              {tieneAlgunModulo && (
                <Link
                  href="/informes"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    pathname.startsWith('/informes')
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? "Informes" : undefined}
                >
                  <FileBarChart className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>Informes</span>}
                </Link>
              )}

              {/* Separador - Solo si hay Dashboard/Informes */}
              {!isCollapsed && tieneAlgunModulo && <div className="border-t border-slate-800 my-3" />}

              {/* Favoritos */}
              {favoritos.length > 0 && (
                <div className="space-y-1">
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <Star className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500 fill-yellow-500" />
                      <span>Favoritos</span>
                    </div>
                  )}
                  <div className={cn("space-y-0.5", !isCollapsed && "pl-2")}>
                    {favoritos.map((fav) => {
                      const FavIcon = fav.icon ? iconMap[fav.icon] || Star : Star
                      const isActive = pathname === fav.href
                      return (
                        <div key={fav.href} className="flex items-center group">
                          <Link
                            href={fav.href}
                            onClick={onClose}
                            className={cn(
                              'flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                              isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                              isCollapsed && "justify-center"
                            )}
                            title={isCollapsed ? fav.title : undefined}
                          >
                            <FavIcon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && <span>{fav.title}</span>}
                          </Link>
                          {!isCollapsed && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleFavorito({ href: fav.href, title: fav.title, icon: fav.icon })
                              }}
                              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Quitar de favoritos"
                            >
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {!isCollapsed && <div className="border-t border-slate-800 my-3" />}
                </div>
              )}

              {/* Grupos de menú (filtrados por permisos y licencia) */}
              {filteredMenuGroups.map((group) => {
                const isGroupExpanded = expandedGroups.includes(group.group)
                const GroupIcon = group.icon

                return (
                  <div key={group.group} className="space-y-0.5">
                    {/* Grupo header */}
                    {!isCollapsed && (
                      <button
                        onClick={() => toggleGroup(group.group)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                          isGroupExpanded
                            ? "text-white bg-slate-800/50"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        )}
                      >
                        <GroupIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{group.group}</span>
                        {isGroupExpanded ? (
                          <ChevronDown className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                    )}

                    {/* Items del grupo */}
                    {(isGroupExpanded || isCollapsed) && (
                      <div className={cn(
                        "space-y-0.5",
                        !isCollapsed && "pl-2"
                      )}>
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const hasChildren = item.children && item.children.length > 0
                          const isItemExpanded = expandedItems.includes(item.title)
                          // Detectar si este item está activo usando la función que considera rutas más específicas
                          const isActive = item.href ? isActiveHref(item.href) : false
                          // Detectar si algún hijo está activo
                          const isChildActive = hasChildren && item.children?.some(c => isActiveHref(c.href))
                          const itemIsFavorito = item.href ? isFavorito(item.href) : false

                          if (!hasChildren && item.href) {
                            // Item simple sin hijos
                            return (
                              <div key={item.href} className="flex items-center group">
                                <Link
                                  href={item.href}
                                  onClick={onClose}
                                  className={cn(
                                    'flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                                    isActive
                                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-medium'
                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                                    isCollapsed && "justify-center"
                                  )}
                                  title={isCollapsed ? item.title : undefined}
                                >
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                  {!isCollapsed && <span>{item.title}</span>}
                                </Link>
                                {!isCollapsed && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      toggleFavorito({
                                        href: item.href!,
                                        title: item.title,
                                        icon: Icon.displayName || Icon.name
                                      })
                                    }}
                                    className={cn(
                                      "p-1 transition-opacity",
                                      itemIsFavorito ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    )}
                                    title={itemIsFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                                  >
                                    <Star className={cn(
                                      "h-3.5 w-3.5",
                                      itemIsFavorito
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-slate-500 hover:text-yellow-500"
                                    )} />
                                  </button>
                                )}
                              </div>
                            )
                          }

                          if (hasChildren) {
                            // Item con submenú
                            return (
                              <div key={item.title}>
                                <button
                                  onClick={() => toggleItem(item.title)}
                                  className={cn(
                                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                                    isChildActive
                                      ? 'text-blue-400 bg-slate-800/50'
                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                                    isCollapsed && "justify-center"
                                  )}
                                  title={isCollapsed ? item.title : undefined}
                                >
                                  <Icon className="h-4 w-4 flex-shrink-0" />
                                  {!isCollapsed && (
                                    <>
                                      <span className="flex-1 text-left">{item.title}</span>
                                      {isItemExpanded ? (
                                        <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                                      )}
                                    </>
                                  )}
                                </button>

                                {/* Submenú */}
                                {isItemExpanded && !isCollapsed && (
                                  <div className="ml-6 mt-1 space-y-0.5 border-l border-slate-700 pl-2">
                                    {item.children?.map((child) => {
                                      // Detectar si este hijo está activo usando la función que considera rutas más específicas
                                      const isThisChildActive = isActiveHref(child.href)
                                      const childIsFavorito = isFavorito(child.href)
                                      return (
                                        <div key={child.href} className="flex items-center group">
                                          <Link
                                            href={child.href}
                                            onClick={onClose}
                                            className={cn(
                                              'flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all',
                                              isThisChildActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-medium'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            )}
                                          >
                                            <div className={cn(
                                              "h-1.5 w-1.5 rounded-full",
                                              isThisChildActive ? "bg-white" : "bg-slate-600"
                                            )} />
                                            <span>{child.title}</span>
                                          </Link>
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              toggleFavorito({
                                                href: child.href,
                                                title: child.title,
                                                icon: Icon.displayName || Icon.name
                                              })
                                            }}
                                            className={cn(
                                              "p-1 transition-opacity",
                                              childIsFavorito ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}
                                            title={childIsFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                                          >
                                            <Star className={cn(
                                              "h-3 w-3",
                                              childIsFavorito
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-slate-500 hover:text-yellow-500"
                                            )} />
                                          </button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          return null
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  )
}