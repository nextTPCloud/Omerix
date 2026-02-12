'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HardDrive, AlertTriangle } from 'lucide-react'
import { archivosService, StorageUsage } from '@/services/archivos.service'

const MODULO_LABELS: Record<string, string> = {
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  productos: 'Productos',
  personal: 'Personal',
  empresa: 'Empresa',
  proyectos: 'Proyectos',
  'partes-trabajo': 'Partes de Trabajo',
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function StorageUsageCard() {
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsage = async () => {
      try {
        const data = await archivosService.getStorageUsage()
        setUsage(data)
      } catch (error) {
        console.error('Error al cargar uso de almacenamiento:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUsage()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-2 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) return null

  const isWarning = usage.percentUsed > 80
  const isCritical = usage.percentUsed > 95

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-5 w-5" />
              Almacenamiento
            </CardTitle>
            <CardDescription>
              {usage.fileCount} archivos almacenados
            </CardDescription>
          </div>
          {isWarning && (
            <Badge variant={isCritical ? 'destructive' : 'secondary'}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {isCritical ? 'Casi lleno' : 'Uso alto'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{formatBytes(usage.usedBytes)} usados</span>
            <span className="text-muted-foreground">{usage.limitGB} GB disponibles</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isCritical ? 'bg-destructive' : isWarning ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {usage.percentUsed}% utilizado
          </p>
        </div>

        {/* Desglose por modulo */}
        {usage.breakdown && Object.keys(usage.breakdown).length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Desglose por modulo</p>
            <div className="space-y-1">
              {Object.entries(usage.breakdown)
                .sort(([, a], [, b]) => b.bytes - a.bytes)
                .map(([modulo, stats]) => (
                  <div key={modulo} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {MODULO_LABELS[modulo] || modulo}
                    </span>
                    <span>
                      {formatBytes(stats.bytes)} ({stats.count} archivos)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
