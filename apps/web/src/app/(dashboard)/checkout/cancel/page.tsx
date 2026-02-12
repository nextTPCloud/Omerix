'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  XCircle,
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Pago Cancelado</CardTitle>
          <CardDescription className="text-base">
            El proceso de pago ha sido cancelado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mensaje informativo */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No te preocupes, no se ha realizado ningun cargo.
              Tu cuenta sigue activa con el plan actual.
            </p>
          </div>

          {/* Razones comunes */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Podemos ayudarte si:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Tuviste problemas con el pago o la tarjeta fue rechazada</span>
              </li>
              <li className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Tienes dudas sobre que plan elegir</span>
              </li>
              <li className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Necesitas una forma de pago alternativa</span>
              </li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <Button className="w-full" size="lg" asChild>
              <Link href="/configuracion/billing">
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar de Nuevo
              </Link>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/contacto">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contactar
                </Link>
              </Button>
            </div>
          </div>

          {/* Contacto directo */}
          <div className="text-center text-xs text-muted-foreground">
            <p>
              Tambien puedes escribirnos a{' '}
              <a href="mailto:soporte@tralok.com" className="text-blue-600 hover:underline">
                soporte@tralok.com
              </a>
            </p>
          </div>
        </CardContent>
        </Card>
      </div>
    
  )
}
