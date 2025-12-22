'use client'

import { useState, useEffect, useMemo } from 'react'
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

interface QuickLinksWidgetProps {
  widget: IWidget
  isLoading?: boolean
  error?: string
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

// Enlaces por defecto ampliados con mas opciones utiles
const ENLACES_DEFAULT: QuickLink[] = [
  // Ventas
  { titulo: 'Nuevo Presupuesto', url: '/presupuestos/nuevo', icono: 'plus', categoria: 'ventas' },
  { titulo: 'Nueva Factura', url: '/facturas/nuevo', icono: 'receipt', categoria: 'ventas' },
  { titulo: 'Nuevo Pedido', url: '/pedidos/nuevo', icono: 'clipboard', categoria: 'ventas' },
  { titulo: 'Presupuestos', url: '/presupuestos', icono: 'document', categoria: 'ventas' },
  { titulo: 'Facturas', url: '/facturas', icono: 'receipt', categoria: 'ventas' },
  // Maestros
  { titulo: 'Clientes', url: '/clientes', icono: 'users', categoria: 'maestros' },
  { titulo: 'Productos', url: '/productos', icono: 'package', categoria: 'maestros' },
  { titulo: 'Proveedores', url: '/proveedores', icono: 'truck', categoria: 'maestros' },
  // Tesoreria
  { titulo: 'Cobros', url: '/tesoreria/cobros', icono: 'euro', categoria: 'tesoreria' },
  { titulo: 'Pagos', url: '/tesoreria/pagos', icono: 'credit', categoria: 'tesoreria' },
  // RRHH
  { titulo: 'Nuevo Parte', url: '/partes-trabajo/nuevo', icono: 'briefcase', categoria: 'rrhh' },
  { titulo: 'Partes Trabajo', url: '/partes-trabajo', icono: 'clipboard', categoria: 'rrhh' },
  { titulo: 'Personal', url: '/personal', icono: 'users', categoria: 'rrhh' },
  // Calendario
  { titulo: 'Calendario', url: '/calendario', icono: 'calendar', categoria: 'otros' },
]

const STORAGE_KEY = 'quicklinks_usage'
const MAX_LINKS_DISPLAY = 8

// Obtener contadores de uso desde localStorage
function getUsageStats(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Guardar contador de uso
function incrementUsage(url: string) {
  if (typeof window === 'undefined') return
  try {
    const stats = getUsageStats()
    stats[url] = (stats[url] || 0) + 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // Ignorar errores de localStorage
  }
}

export function QuickLinksWidget({
  widget,
  isLoading,
  error,
  onRefresh,
  onConfigure,
  onRemove,
}: QuickLinksWidgetProps) {
  const router = useRouter()
  const [usageStats, setUsageStats] = useState<Record<string, number>>({})

  // Cargar estadisticas de uso al montar
  useEffect(() => {
    setUsageStats(getUsageStats())
  }, [])

  // Usar enlaces configurados o por defecto
  // Verificar que hay enlaces y que no estan vacios
  const enlacesBase = (widget.config?.enlaces && widget.config.enlaces.length > 0)
    ? widget.config.enlaces
    : ENLACES_DEFAULT

  // Ordenar por uso y limitar cantidad
  const enlacesOrdenados = useMemo(() => {
    const conUso = enlacesBase.map(enlace => ({
      ...enlace,
      uso: usageStats[enlace.url] || 0,
    }))

    // Ordenar por uso descendente
    conUso.sort((a, b) => b.uso - a.uso)

    // Retornar solo los primeros MAX_LINKS_DISPLAY
    return conUso.slice(0, MAX_LINKS_DISPLAY)
  }, [enlacesBase, usageStats])

  const handleClick = (enlace: QuickLink) => {
    incrementUsage(enlace.url)
    setUsageStats(prev => ({
      ...prev,
      [enlace.url]: (prev[enlace.url] || 0) + 1,
    }))
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
          {enlacesOrdenados.map((enlace, index) => {
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
        {enlacesOrdenados.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Los accesos mas usados aparecen primero
          </p>
        )}
      </div>
    </WidgetWrapper>
  )
}
