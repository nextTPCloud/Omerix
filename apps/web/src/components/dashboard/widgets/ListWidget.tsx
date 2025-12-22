'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, FileText, Users, Package, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { IWidget } from '@/services/dashboard.service'
import { WidgetWrapper } from './WidgetWrapper'

interface ListItem {
  id: string
  titulo: string
  subtitulo?: string
  valor?: number
  estado?: string
  fecha?: string
  url?: string
  icono?: 'document' | 'user' | 'product' | 'alert'
  badge?: { texto: string; variante?: 'default' | 'secondary' | 'destructive' | 'outline' }
}

interface ListWidgetProps {
  widget: IWidget
  data: ListItem[] | null
  isLoading?: boolean
  error?: string
  titulo: string
  emptyMessage?: string
  onRefresh?: () => void
  onConfigure?: () => void
  onRemove?: () => void
}

const ICONOS = {
  document: FileText,
  user: Users,
  product: Package,
  alert: AlertTriangle,
}

export function ListWidget({
  widget,
  data,
  isLoading,
  error,
  titulo,
  emptyMessage = 'No hay elementos',
  onRefresh,
  onConfigure,
  onRemove,
}: ListWidgetProps) {
  const router = useRouter()
  const limite = widget.config.limite || 10

  const handleClick = (item: ListItem) => {
    if (item.url) {
      router.push(item.url)
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
      <ScrollArea className="h-full">
        {!data || data.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[100px] text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-1 pr-2">
            {data.slice(0, limite).map((item) => {
              const Icono = item.icono ? ICONOS[item.icono] : FileText

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleClick(item)}
                >
                  <div className="flex-shrink-0 text-muted-foreground">
                    <Icono className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.titulo}</p>
                    {item.subtitulo && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.subtitulo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.valor !== undefined && (
                      <span className="text-sm font-medium">
                        {formatCurrency(item.valor)}
                      </span>
                    )}
                    {item.fecha && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.fecha)}
                      </span>
                    )}
                    {item.badge && (
                      <Badge variant={item.badge.variante || 'default'}>
                        {item.badge.texto}
                      </Badge>
                    )}
                    {item.url && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </WidgetWrapper>
  )
}
