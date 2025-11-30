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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavoritosContext } from '@/contexts/FavoritosContext'

interface MenuItem {
  title: string
  href?: string
  icon: any
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
  Briefcase, UserCog, Star, FolderKanban,
}

const menuGroups: { group: string; icon: any; items: MenuItem[] }[] = [
  {
    group: 'Ventas',
    icon: TrendingUp,
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
          { title: 'Listado', href: '/presupuestos' },
          { title: 'Nuevo', href: '/presupuestos/nuevo' },
        ],
      },
      {
        title: 'Pedidos',
        icon: ShoppingCart,
        children: [
          { title: 'Listado', href: '/pedidos' },
          { title: 'Nuevo', href: '/pedidos/nuevo' },
        ],
      },
      {
        title: 'Albaranes',
        icon: Truck,
        children: [
          { title: 'Listado', href: '/albaranes' },
          { title: 'Nuevo', href: '/albaranes/nuevo' },
        ],
      },
      {
        title: 'Facturas',
        icon: Receipt,
        children: [
          { title: 'Listado', href: '/facturas' },
          { title: 'Nueva', href: '/facturas/nuevo' },
        ],
      },
    ],
  },
  {
    group: 'Compras',
    icon: TrendingDown,
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
          { title: 'Listado', href: '/compras/presupuestos' },
          { title: 'Nuevo', href: '/compras/presupuestos/nuevo' },
        ],
      },
      {
        title: 'Pedidos',
        icon: ShoppingCart,
        children: [
          { title: 'Listado', href: '/compras/pedidos' },
          { title: 'Nuevo', href: '/compras/pedidos/nuevo' },
        ],
      },
      {
        title: 'Albaranes',
        icon: Truck,
        children: [
          { title: 'Listado', href: '/compras/albaranes' },
          { title: 'Nuevo', href: '/compras/albaranes/nuevo' },
        ],
      },
      {
        title: 'Facturas',
        icon: Receipt,
        children: [
          { title: 'Listado', href: '/compras/facturas' },
          { title: 'Nueva', href: '/compras/facturas/nuevo' },
        ],
      },
    ],
  },
  {
    group: 'Servicios',
    icon: Wrench,
    items: [
      {
        title: 'Proyectos',
        icon: FolderKanban,
        children: [
          { title: 'Listado', href: '/proyectos' },
          { title: 'Nuevo', href: '/proyectos/nuevo' },
        ],
      },
      {
        title: 'Partes de Trabajo',
        icon: Wrench,
        children: [
          { title: 'Listado', href: '/partes' },
          { title: 'Nuevo', href: '/partes/nuevo' },
        ],
      },
    ],
  },
  {
    group: 'Tesorería',
    icon: Wallet,
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
    ],
  },
  {
    group: 'Catálogos',
    icon: Package,
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
        title: 'Variantes',
        href: '/variantes',
        icon: Palette,
      },
    ],
  },
  {
    group: 'Restauración',
    icon: UtensilsCrossed,
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
    items: [
      {
        title: 'Ficheros',
        icon: FileStack,
        children: [
          { title: 'Tipos de Impuesto', href: '/tipos-impuesto' },
          { title: 'Formas de Pago', href: '/formas-pago' },
          { title: 'Términos de Pago', href: '/terminos-pago' },
          { title: 'Estados', href: '/estados' },
          { title: 'Situaciones', href: '/situaciones' },
          { title: 'Clasificaciones', href: '/clasificaciones' },
        ],
      },
    ],
  },
  {
    group: 'Informes',
    icon: BarChart3,
    items: [
      {
        title: 'Reportes',
        href: '/reportes',
        icon: BarChart3,
      },
    ],
  },
  {
    group: 'Sistema',
    icon: Settings,
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
          "fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Toggle button */}
          <div className={cn(
            "flex items-center border-b p-2",
            isCollapsed ? "justify-center" : "justify-end"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 hidden lg:flex"
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
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                  pathname === '/dashboard'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? "Dashboard" : undefined}
              >
                <Home className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>Dashboard</span>}
              </Link>

              {/* Separador */}
              {!isCollapsed && <div className="border-t my-2" />}

              {/* Favoritos */}
              {favoritos.length > 0 && (
                <div className="space-y-1">
                  {!isCollapsed && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
                      <Star className="h-4 w-4 flex-shrink-0 text-yellow-500 fill-yellow-500" />
                      <span>Favoritos</span>
                    </div>
                  )}
                  <div className={cn("space-y-1", !isCollapsed && "pl-2")}>
                    {favoritos.map((fav) => {
                      const FavIcon = fav.icon ? iconMap[fav.icon] || Star : Star
                      const isActive = pathname === fav.href
                      return (
                        <div key={fav.href} className="flex items-center group">
                          <Link
                            href={fav.href}
                            onClick={onClose}
                            className={cn(
                              'flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                              isActive
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground',
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
                  {!isCollapsed && <div className="border-t my-2" />}
                </div>
              )}

              {/* Grupos de menú */}
              {menuGroups.map((group) => {
                const isGroupExpanded = expandedGroups.includes(group.group)
                const GroupIcon = group.icon

                return (
                  <div key={group.group} className="space-y-1">
                    {/* Grupo header */}
                    {!isCollapsed && (
                      <button
                        onClick={() => toggleGroup(group.group)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                          "text-muted-foreground"
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
                        "space-y-1",
                        !isCollapsed && "pl-2"
                      )}>
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const hasChildren = item.children && item.children.length > 0
                          const isItemExpanded = expandedItems.includes(item.title)
                          const isActive = item.href ? pathname === item.href : false
                          const itemIsFavorito = item.href ? isFavorito(item.href) : false

                          if (!hasChildren && item.href) {
                            // Item simple sin hijos
                            return (
                              <div key={item.href} className="flex items-center group">
                                <Link
                                  href={item.href}
                                  onClick={onClose}
                                  className={cn(
                                    'flex-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                                    isActive
                                      ? 'bg-accent text-accent-foreground'
                                      : 'text-muted-foreground',
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
                                        : "text-muted-foreground hover:text-yellow-500"
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
                                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent text-muted-foreground',
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
                                  <div className="ml-8 mt-1 space-y-1">
                                    {item.children?.map((child) => {
                                      const isChildActive = pathname === child.href
                                      const childIsFavorito = isFavorito(child.href)
                                      return (
                                        <div key={child.href} className="flex items-center group">
                                          <Link
                                            href={child.href}
                                            onClick={onClose}
                                            className={cn(
                                              'flex-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                                              isChildActive
                                                ? 'bg-accent text-accent-foreground'
                                                : 'text-muted-foreground'
                                            )}
                                          >
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
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
                                                : "text-muted-foreground hover:text-yellow-500"
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