'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Euro, Edit, RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { vencimientosService } from '@/services/vencimientos.service'
import { Vencimiento, ESTADOS_VENCIMIENTO } from '@/types/vencimiento.types'
import { toast } from 'sonner'

export default function VerCobroPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [vencimiento, setVencimiento] = useState<Vencimiento | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const cargarVencimiento = async () => {
      try {
        setIsLoading(true)
        const response = await vencimientosService.getById(id)
        if (response.success && response.data) {
          setVencimiento(response.data)
        } else {
          toast.error('Cobro no encontrado')
        }
      } catch (error) {
        console.error('Error al cargar cobro:', error)
        toast.error('Error al cargar el cobro')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      cargarVencimiento()
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

  const getEstadoBadge = (estado: string, estaVencido?: boolean) => {
    const config: Record<string, { color: string; icon: any }> = {
      pendiente: { color: estaVencido ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800', icon: estaVencido ? AlertTriangle : Clock },
      parcial: { color: 'bg-blue-100 text-blue-800', icon: DollarSign },
      cobrado: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      impagado: { color: 'bg-red-100 text-red-800', icon: XCircle },
      anulado: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    }

    const { color, icon: Icon } = config[estado] || config.pendiente
    const label = ESTADOS_VENCIMIENTO.find(e => e.value === estado)?.label || estado

    return (
      <Badge className={`${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando cobro...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!vencimiento) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Cobro no encontrado</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
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
                <Euro className="h-7 w-7 text-green-600" />
                Cobro {vencimiento.numero}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Detalle del vencimiento
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/tesoreria/cobros/${id}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Datos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Informacion del Cliente</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{vencimiento.terceroNombre || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NIF</p>
                <p className="font-medium">{vencimiento.terceroNif || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Documento</p>
                <p className="font-medium">{vencimiento.documentoNumero || '-'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Informacion del Cobro</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <div className="mt-1">{getEstadoBadge(vencimiento.estado, vencimiento.estaVencido)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Vencimiento</p>
                <p className={`font-medium ${vencimiento.estaVencido ? 'text-red-600' : ''}`}>
                  {formatDate(vencimiento.fechaVencimiento)}
                  {vencimiento.diasVencido && vencimiento.diasVencido > 0 && (
                    <span className="ml-2 text-sm text-red-500">({vencimiento.diasVencido} dias vencido)</span>
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Importes</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Importe Total</p>
                <p className="text-xl font-bold">{formatCurrency(vencimiento.importe)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Importe Pendiente</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(vencimiento.importePendiente)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cobrado</p>
                <p className="text-lg font-medium text-green-600">
                  {formatCurrency(vencimiento.importe - vencimiento.importePendiente)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Acciones rapidas</h3>
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(`/tesoreria/cobros/${id}/movimientos`)}
              >
                Ver movimientos
              </Button>
              {vencimiento.documentoId && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/facturas/${vencimiento.documentoId}`)}
                >
                  Ver factura relacionada
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
