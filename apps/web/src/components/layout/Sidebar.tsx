"use client"

import { useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavoritosContext } from '@/contexts/FavoritosContext'
import { usePermissions } from '@/hooks/usePermissions'
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
}

// Tipo de permiso requerido para cada grupo
type PermisoGrupo = keyof IPermisosEspeciales | null

interface MenuGroup {
  group: string
  icon: any
  items: MenuItem[]
  permiso?: PermisoGrupo // Permiso requerido para ver este grupo
}

const menuGroups: MenuGroup[] = [
  {
    group: 'Ventas',
    icon: TrendingUp,
    permiso: 'accesoVentas',
    items: [
      {
        title: 'Clientes',
        href: '/clientes',
        icon: Users,
      },
      {
        title: 'Agentes Comerciales',
        href: '/agentes-comerciales',
        icon: Briefcase,
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
    ],
  },
  {
    group: 'Compras',
    icon: TrendingDown,
    permiso: 'accesoCompras',
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
    group: 'Servicios',
    icon: Wrench,
    permiso: 'accesoVentas', // Los servicios están asociados a ventas
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
          { title: 'Listado partes', href: '/partes-trabajo' },
          { title: 'Nuevo parte', href: '/partes-trabajo/nuevo' },
        ],
      },
      {
        title: 'Maquinaria',
        href: '/maquinaria',
        icon: Truck,
      },
    ],
  },
  {
    group: 'Tesorería',
    icon: Wallet,
    permiso: 'accesoContabilidad',
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
    ],
  },
  {
    group: 'RRHH',
    icon: UserCog,
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
        title: 'Mi Fichaje',
        href: '/fichaje',
        icon: Fingerprint,
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
    group: 'Tareas',
    icon: CheckSquare,
    items: [
      {
        title: 'Tareas',
        icon: CheckSquare,
        children: [
          { title: 'Listado tareas', href: '/tareas' },
          { title: 'Nueva tarea', href: '/tareas/nuevo' },
        ],
      },
      {
        title: 'Planificacion',
        href: '/planificacion',
        icon: CalendarDays,
      },
    ],
  },
  {
    group: 'Almacenes',
    icon: Package,
    permiso: 'accesoAlmacen',
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
    group: 'Restauración',
    icon: UtensilsCrossed,
    permiso: 'accesoTPV',
    items: [
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
  {
    group: 'Administración',
    icon: Database,
    permiso: 'accederConfiguracion',
    items: [
      {
        title: 'Precios',
        icon: Tag,
        children: [
          { title: 'Tarifas', href: '/tarifas' },
          { title: 'Ofertas / Promociones', href: '/ofertas' },
        ],
      },
      {
        title: 'Ficheros',
        icon: FileStack,
        children: [
          { title: 'Series de Documentos', href: '/series-documentos' },
          { title: 'Tipos de Impuesto', href: '/tipos-impuesto' },
          { title: 'Formas de Pago', href: '/formas-pago' },
          { title: 'Términos de Pago', href: '/terminos-pago' },
          { title: 'Tipos de Gasto', href: '/tipos-gasto' },
          { title: 'Estados', href: '/estados' },
          { title: 'Situaciones', href: '/situaciones' },
          { title: 'Clasificaciones', href: '/clasificaciones' },
        ],
      },
    ],
  },
  {
    group: 'Sistema',
    icon: Settings,
    permiso: 'accederConfiguracion',
    items: [
      {
        title: 'Configuración',
        href: '/configuracion',
        icon: Settings,
      },
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

  // Filtrar grupos del menú según los permisos del usuario
  const filteredMenuGroups = menuGroups.filter(group => {
    // Si no tiene permiso definido, mostrar siempre (ej: Informes, RRHH)
    if (!group.permiso) return true
    // Verificar si el usuario tiene el permiso requerido
    return can(group.permiso)
  })

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
              {/* Dashboard - Siempre visible al inicio */}
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

              {/* Informes - Siempre visible */}
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

              {/* Separador */}
              {!isCollapsed && <div className="border-t border-slate-800 my-3" />}

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

              {/* Grupos de menú (filtrados por permisos) */}
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
                          const isActive = item.href ? pathname === item.href : false
                          const isChildActive = hasChildren && item.children?.some(c => pathname === c.href)
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
                                      const isThisChildActive = pathname === child.href
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