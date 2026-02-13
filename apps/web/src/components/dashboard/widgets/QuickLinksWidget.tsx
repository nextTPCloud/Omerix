'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  Wallet,
  Settings,
  BarChart2,
  Plus,
  TrendingUp,
  Truck,
  ClipboardList,
  LucideIcon,
  Euro,
  CreditCard,
  Calendar,
  Briefcase,
  Building2,
  Clock,
} from 'lucide-react'
import { IWidget } from '@/services/dashboard.service'
import { WidgetWrapper } from './WidgetWrapper'

interface QuickLink {
  titulo: string
  url: string
  icono?: string
  categoria?: string
}

interface FrecuenteData {
  path: string
  count: number
  lastVisit: string
}

interface QuickLinksWidgetProps {
  widget: IWidget
  isLoading?: boolean
  error?: string
  frecuentes?: FrecuenteData[]
  onRefresh?: () => void
  onConfigure?: () => void
  onRemove?: () => void
}

const ICONOS_MAP: Record<string, LucideIcon> = {
  document: FileText,
  users: Users,
  package: Package,
  cart: ShoppingCart,
  receipt: Receipt,
  wallet: Wallet,
  settings: Settings,
  chart: BarChart2,
  plus: Plus,
  trending: TrendingUp,
  truck: Truck,
  clipboard: ClipboardList,
  euro: Euro,
  credit: CreditCard,
  calendar: Calendar,
  briefcase: Briefcase,
  building: Building2,
  clock: Clock,
}

// Catálogo de páginas conocidas: path → título + icono
const CATALOGO_PAGINAS: Record<string, { titulo: string; icono: string }> = {
  '/presupuestos/nuevo': { titulo: 'Nuevo Presupuesto', icono: 'plus' },
  '/presupuestos': { titulo: 'Presupuestos', icono: 'document' },
  '/facturas/nuevo': { titulo: 'Nueva Factura', icono: 'receipt' },
  '/facturas': { titulo: 'Facturas', icono: 'receipt' },
  '/pedidos/nuevo': { titulo: 'Nuevo Pedido', icono: 'clipboard' },
  '/pedidos': { titulo: 'Pedidos', icono: 'clipboard' },
  '/albaranes/nuevo': { titulo: 'Nuevo Albarán', icono: 'document' },
  '/albaranes': { titulo: 'Albaranes', icono: 'document' },
  '/clientes': { titulo: 'Clientes', icono: 'users' },
  '/productos': { titulo: 'Productos', icono: 'package' },
  '/proveedores': { titulo: 'Proveedores', icono: 'truck' },
  '/tesoreria/cobros': { titulo: 'Cobros', icono: 'euro' },
  '/tesoreria/pagos': { titulo: 'Pagos', icono: 'credit' },
  '/tesoreria': { titulo: 'Tesorería', icono: 'wallet' },
  '/partes-trabajo/nuevo': { titulo: 'Nuevo Parte', icono: 'briefcase' },
  '/partes-trabajo': { titulo: 'Partes Trabajo', icono: 'clipboard' },
  '/personal': { titulo: 'Personal', icono: 'users' },
  '/calendario': { titulo: 'Calendario', icono: 'calendar' },
  '/contabilidad': { titulo: 'Contabilidad', icono: 'chart' },
  '/contabilidad/asientos': { titulo: 'Asientos', icono: 'document' },
  '/crm': { titulo: 'CRM', icono: 'trending' },
  '/crm/leads': { titulo: 'Leads', icono: 'users' },
  '/crm/oportunidades': { titulo: 'Oportunidades', icono: 'trending' },
  '/proyectos': { titulo: 'Proyectos', icono: 'briefcase' },
  '/inventarios': { titulo: 'Inventarios', icono: 'package' },
  '/fichajes': { titulo: 'Fichajes', icono: 'clock' },
  '/informes': { titulo: 'Informes', icono: 'chart' },
  '/configuracion': { titulo: 'Configuración', icono: 'settings' },
  '/familias': { titulo: 'Familias', icono: 'package' },
  '/tarifas': { titulo: 'Tarifas', icono: 'euro' },
  '/ofertas': { titulo: 'Ofertas', icono: 'trending' },
  '/pedidos-compra': { titulo: 'Pedidos Compra', icono: 'cart' },
  '/albaranes-compra': { titulo: 'Albaranes Compra', icono: 'document' },
  '/facturas-compra': { titulo: 'Facturas Compra', icono: 'receipt' },
  '/maquinaria': { titulo: 'Maquinaria', icono: 'building' },
}

// Enlaces por defecto para usuarios nuevos sin historial
const ENLACES_DEFAULT: QuickLink[] = [
  { titulo: 'Nuevo Presupuesto', url: '/presupuestos/nuevo', icono: 'plus', categoria: 'ventas' },
  { titulo: 'Nueva Factura', url: '/facturas/nuevo', icono: 'receipt', categoria: 'ventas' },
  { titulo: 'Presupuestos', url: '/presupuestos', icono: 'document', categoria: 'ventas' },
  { titulo: 'Facturas', url: '/facturas', icono: 'receipt', categoria: 'ventas' },
  { titulo: 'Clientes', url: '/clientes', icono: 'users', categoria: 'maestros' },
  { titulo: 'Productos', url: '/productos', icono: 'package', categoria: 'maestros' },
  { titulo: 'Cobros', url: '/tesoreria/cobros', icono: 'euro', categoria: 'tesoreria' },
  { titulo: 'Calendario', url: '/calendario', icono: 'calendar', categoria: 'otros' },
]

const MAX_LINKS_DISPLAY = 8

/**
 * Genera título legible a partir de un path desconocido
 */
function tituloDesdePath(path: string): string {
  const segmentos = path.split('/').filter(Boolean)
  const ultimo = segmentos[segmentos.length - 1] || path
  return ultimo
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function QuickLinksWidget({
  widget,
  isLoading,
  error,
  frecuentes,
  onRefresh,
  onConfigure,
  onRemove,
}: QuickLinksWidgetProps) {
  const router = useRouter()

  // Construir lista de enlaces: frecuentes del backend + fallback a defaults
  const enlacesOrdenados = useMemo(() => {
    // Si hay frecuentes del backend, mapear a QuickLink con título e icono
    if (frecuentes && frecuentes.length > 0) {
      const fromBackend: (QuickLink & { uso: number })[] = frecuentes
        .filter(f => f.path && !f.path.includes('/[')) // Excluir rutas dinámicas internas
        .map(f => {
          const conocido = CATALOGO_PAGINAS[f.path]
          return {
            titulo: conocido?.titulo || tituloDesdePath(f.path),
            url: f.path,
            icono: conocido?.icono || 'document',
            uso: f.count,
          }
        })

      // Si hay menos del máximo, completar con defaults que no estén ya
      const urlsPresentes = new Set(fromBackend.map(e => e.url))
      const complemento = ENLACES_DEFAULT
        .filter(e => !urlsPresentes.has(e.url))
        .map(e => ({ ...e, uso: 0 }))

      return [...fromBackend, ...complemento].slice(0, MAX_LINKS_DISPLAY)
    }

    // Fallback: enlaces por defecto para usuarios sin historial
    return ENLACES_DEFAULT.slice(0, MAX_LINKS_DISPLAY).map(e => ({ ...e, uso: 0 }))
  }, [frecuentes])

  const handleClick = (enlace: QuickLink) => {
    router.push(enlace.url)
  }

  return (
    <WidgetWrapper
      widget={widget}
      titulo="Accesos Rapidos"
      isLoading={isLoading}
      error={error}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      onRemove={onRemove}
    >
      <div className="h-full overflow-auto">
        <div className="grid grid-cols-2 gap-2">
          {enlacesOrdenados.map((enlace) => {
            const Icono = enlace.icono ? ICONOS_MAP[enlace.icono] || FileText : FileText
            const esFrecuente = enlace.uso >= 3

            return (
              <Button
                key={enlace.url}
                variant="outline"
                className={`h-auto py-2.5 px-3 justify-start gap-2 text-left relative ${
                  esFrecuente ? 'border-primary/30 bg-primary/5' : ''
                }`}
                onClick={() => handleClick(enlace)}
              >
                <Icono className={`h-4 w-4 flex-shrink-0 ${esFrecuente ? 'text-primary' : ''}`} />
                <span className="text-xs truncate flex-1">{enlace.titulo}</span>
                {esFrecuente && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-primary/10 text-primary">
                    {enlace.uso}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
        {enlacesOrdenados.some(e => e.uso > 0) && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Basado en tu navegacion real
          </p>
        )}
      </div>
    </WidgetWrapper>
  )
}
