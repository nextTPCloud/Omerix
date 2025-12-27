'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  ArrowRight,
  Receipt,
  Loader2,
  PartyPopper,
} from 'lucide-react'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState<{
    plan: string
    amount: string
    invoiceUrl?: string
  } | null>(null)

  useEffect(() => {
    // Simular carga de detalles del pedido
    const timer = setTimeout(() => {
      setOrderDetails({
        plan: 'Profesional',
        amount: '955,90€',
        invoiceUrl: '/facturas/1234'
      })
      setLoading(false)
    }, 1500)

    return () => {
      clearTimeout(timer)
    }
  }, [sessionId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-muted-foreground">Verificando tu pago...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <PartyPopper className="h-6 w-6 text-amber-500" />
            Pago Completado
          </CardTitle>
          <CardDescription className="text-base">
            Tu suscripcion se ha activado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Detalles del pedido */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">Detalles de la Suscripcion</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{orderDetails?.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Importe</span>
                <span className="font-medium">{orderDetails?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className="text-green-600 font-medium">Activo</span>
              </div>
            </div>
          </div>

          {/* Mensaje de bienvenida */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Hemos enviado un email de confirmacion con los detalles de tu suscripcion
              y la factura correspondiente.
            </p>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <Button className="w-full" size="lg" asChild>
              <Link href="/dashboard">
                Ir al Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/configuracion/billing">
                <Receipt className="mr-2 h-4 w-4" />
                Ver mi Suscripcion
              </Link>
            </Button>
          </div>

          {/* Referencia del pedido */}
          {sessionId && (
            <p className="text-xs text-center text-muted-foreground">
              Referencia: {sessionId.substring(0, 20)}...
            </p>
          )}
        </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
