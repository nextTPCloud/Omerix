'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { IWidget } from '@/services/dashboard.service'
import { WidgetWrapper } from './WidgetWrapper'

interface KPIData {
  total: number
  count?: number
  variacion?: number
  tendencia?: 'up' | 'down' | 'stable'
  periodo?: string
}

interface KPIWidgetProps {
  widget: IWidget
  data: KPIData | null
  isLoading?: boolean
  error?: string
  titulo: string
  icono?: React.ReactNode
  colorClase?: string
  onRefresh?: () => void
  onConfigure?: () => void
  onRemove?: () => void
}

export function KPIWidget({
  widget,
  data,
  isLoading,
  error,
  titulo,
  icono,
  colorClase = 'text-primary',
  onRefresh,
  onConfigure,
  onRemove,
}: KPIWidgetProps) {
  const formato = widget.config.formato || 'moneda'
  const mostrarPorcentaje = widget.config.mostrarPorcentaje !== false

  const formatValue = (value: number) => {
    switch (formato) {
      case 'moneda':
        return formatCurrency(value)
      case 'porcentaje':
        return `${value.toFixed(widget.config.decimales ?? 1)}%`
      case 'numero':
      default:
        return value.toLocaleString('es-ES', {
          maximumFractionDigits: widget.config.decimales ?? 0,
        })
    }
  }

  const getTendenciaIcon = () => {
    if (!data?.tendencia) return null
    switch (data.tendencia) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <WidgetWrapper
      widget={widget}
      titulo={titulo}
      isLoading={isLoading}
      error={error}
      onRefresh={onRefresh}
      onConfigure={onConfigure}
      onRemove={onRemove}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn('text-2xl font-bold', colorClase)}>
            {data ? formatValue(data.total) : '-'}
          </p>

          {data?.count !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {data.count} {data.count === 1 ? 'elemento' : 'elementos'}
            </p>
          )}

          {mostrarPorcentaje && data?.variacion !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {getTendenciaIcon()}
              <span
                className={cn(
                  'text-sm font-medium',
                  data.variacion >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {data.variacion >= 0 ? '+' : ''}
                {data.variacion.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs anterior</span>
            </div>
          )}
        </div>

        {icono && (
          <div className="rounded-full bg-primary/10 p-3">{icono}</div>
        )}
      </div>
    </WidgetWrapper>
  )
}
