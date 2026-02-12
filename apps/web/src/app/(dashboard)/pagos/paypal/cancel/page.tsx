'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function PayPalCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <CardTitle>Pago cancelado</CardTitle>
          <CardDescription>
            Has cancelado el proceso de pago con PayPal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">No se ha realizado ningun cargo</p>
            <p>Puedes intentar el pago de nuevo cuando lo desees.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/configuracion/billing">
              <Button className="w-full">
                Volver a facturacion
              </Button>
            </Link>
            <Link href="/checkout">
              <Button variant="outline" className="w-full">
                Intentar de nuevo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
