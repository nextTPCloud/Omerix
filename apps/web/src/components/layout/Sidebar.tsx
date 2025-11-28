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
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MenuItem {
  title: string
  href?: string
  icon: any
  children?: {
    title: string
    href: string
  }[]
}

const menuGroups: { group: string; icon: any; items: MenuItem[] }[] = [
  {
    group: 'Principal',
    icon: Home,
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      },
    ],
  },
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Principal'])
  const [expandedItems, setExpandedItems] = useState<string[]>([])

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

                          if (!hasChildren && item.href) {
                            // Item simple sin hijos
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
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
                                      return (
                                        <Link
                                          key={child.href}
                                          href={child.href}
                                          onClick={onClose}
                                          className={cn(
                                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                                            isChildActive
                                              ? 'bg-accent text-accent-foreground'
                                              : 'text-muted-foreground'
                                          )}
                                        >
                                          <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                          <span>{child.title}</span>
                                        </Link>
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