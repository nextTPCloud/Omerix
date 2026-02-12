'use client'


import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, Construction } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NuevoPagoPage() {
  const router = useRouter()

  return (
    
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-red-600" />
              Nuevo Pago
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registrar un nuevo vencimiento de pago
            </p>
          </div>
        </div>

        {/* Contenido placeholder */}
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Construction className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold">Pagina en desarrollo</h2>
            <p className="text-muted-foreground max-w-md">
              El formulario para crear nuevos pagos esta en desarrollo.
              Los pagos normalmente se crean automaticamente al registrar facturas de compra.
            </p>
            <Button onClick={() => router.push('/tesoreria/pagos')}>
              Volver a la lista de pagos
            </Button>
          </div>
        </Card>
      </div>
    
  )
}
