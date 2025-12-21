'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'
import { IWidget } from '@/services/dashboard.service'
import { WidgetWrapper } from './WidgetWrapper'

interface QuickLink {
  titulo: string
  url: string
  icono?: string
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
}

// Enlaces por defecto si no hay configurados
const ENLACES_DEFAULT: QuickLink[] = [
  { titulo: 'Nuevo Presupuesto', url: '/presupuestos/nuevo', icono: 'plus' },
  { titulo: 'Nueva Factura', url: '/facturas/nuevo', icono: 'receipt' },
  { titulo: 'Clientes', url: '/clientes', icono: 'users' },
  { titulo: 'Productos', url: '/productos', icono: 'package' },
]

export function QuickLinksWidget({
  widget,
  isLoading,
  error,
  onRefresh,
  onConfigure,
  onRemove,
}: QuickLinksWidgetProps) {
  const router = useRouter()
  const enlaces = widget.config.enlaces || ENLACES_DEFAULT

  return (
    <WidgetWrapper
      widget={widget}
      titulo="Accesos Rápidos"
      isLoading={isLoading}
      error={error}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      onRemove={onRemove}
    >
      <div className="grid grid-cols-2 gap-2">
        {enlaces.map((enlace, index) => {
          const Icono = enlace.icono ? ICONOS_MAP[enlace.icono] || FileText : FileText

          return (
            <Button
              key={index}
              variant="outline"
              className="h-auto py-3 px-3 justify-start gap-2 text-left"
              onClick={() => router.push(enlace.url)}
            >
              <Icono className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs truncate">{enlace.titulo}</span>
            </Button>
          )
        })}
      </div>
    </WidgetWrapper>
  )
}
