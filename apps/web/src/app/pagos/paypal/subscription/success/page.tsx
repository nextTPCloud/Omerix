'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/services/api'

export default function PayPalSubscriptionSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const subscriptionId = searchParams.get('subscription_id')
  const baToken = searchParams.get('ba_token')
  const token = searchParams.get('token')

  useEffect(() => {
    const activarSuscripcion = async () => {
      if (!subscriptionId) {
        setStatus('error')
        setMessage('No se encontro el ID de la suscripcion')
        return
      }

      try {
        // Llamar al backend para confirmar y activar la suscripcion
        const response = await api.post('/pagos/paypal/subscriptions/activate', {
          subscriptionId,
          baToken,
          token,
        })

        if (response.data.success) {
          setStatus('success')
          setMessage('Tu suscripcion ha sido activada correctamente')
        } else {
          setStatus('error')
          setMessage(response.data.message || 'Error al activar la suscripcion')
        }
      } catch (error: any) {
        console.error('Error activando suscripcion:', error)
        // Aunque falle la activacion automatica, el webhook de PayPal la activara
        setStatus('success')
        setMessage('Tu pago ha sido procesado. La activacion puede tardar unos minutos.')
      }
    }

    activarSuscripcion()
  }, [subscriptionId, baToken, token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
              <CardTitle>Procesando pago...</CardTitle>
              <CardDescription>
                Estamos confirmando tu suscripcion con PayPal
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-green-700">Pago completado</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-700">Error en el pago</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                <p className="font-medium mb-1">Tu plan ha sido activado</p>
                <p>Ya puedes disfrutar de todas las funcionalidades de tu nuevo plan.</p>
              </div>

              {subscriptionId && (
                <div className="text-center text-sm text-slate-500">
                  <p>ID de suscripcion: {subscriptionId}</p>
                </div>
              )}
            </>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <p>Si crees que esto es un error, por favor contacta con soporte.</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {status !== 'loading' && (
              <>
                <Link href="/configuracion/billing">
                  <Button className="w-full">
                    Ver mi suscripcion
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Ir al dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
