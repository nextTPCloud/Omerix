'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, ArrowLeftRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { vencimientosService } from '@/services/vencimientos.service'
import { Vencimiento } from '@/types/vencimiento.types'
import { toast } from 'sonner'

interface PagoParcial {
  fecha: Date | string
  importe: number
  formaPagoId?: string
  referencia?: string
  observaciones?: string
}

export default function MovimientosPagoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [vencimiento, setVencimiento] = useState<Vencimiento | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Los movimientos/pagos parciales están en vencimiento.cobrosParciales
  const movimientos: PagoParcial[] = (vencimiento as any)?.cobrosParciales || []

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setIsLoading(true)
        const response = await vencimientosService.getById(id)
        if (response.success && response.data) {
          setVencimiento(response.data)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
        toast.error('Error al cargar los movimientos')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      cargarDatos()
    }
  }, [id])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString('es-ES')
    } catch {
      return '-'
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando movimientos...</p>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <ArrowLeftRight className="h-7 w-7 text-blue-600" />
                Movimientos del Pago
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {vencimiento?.numero} - {vencimiento?.terceroNombre}
              </p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>

        {/* Resumen */}
        {vencimiento && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Importe Total</p>
              <p className="text-xl font-bold">{formatCurrency(vencimiento.importe)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Pagado</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(vencimiento.importe - vencimiento.importePendiente)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Pendiente</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(vencimiento.importePendiente)}
              </p>
            </Card>
          </div>
        )}

        {/* Tabla de movimientos */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Historial de Movimientos</h3>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-right font-semibold">Importe</th>
                  <th className="px-4 py-3 text-left font-semibold">Referencia</th>
                  <th className="px-4 py-3 text-left font-semibold">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <ArrowLeftRight className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="font-medium">No hay movimientos registrados</p>
                      <p className="text-xs mt-1">Los pagos se registraran aqui</p>
                    </td>
                  </tr>
                ) : (
                  movimientos.map((mov, index) => (
                    <tr key={index} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{formatDate(mov.fecha)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-red-50 text-red-700">Pago</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {formatCurrency(mov.importe)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{mov.referencia || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{mov.observaciones || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    
  )
}
