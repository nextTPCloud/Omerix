'use client'

import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Euro, Construction } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EditarCobroPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Euro className="h-7 w-7 text-green-600" />
              Editar Cobro
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modificar vencimiento de cobro
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
              El formulario para editar cobros esta en desarrollo.
              ID del cobro: {id}
            </p>
            <Button onClick={() => router.push('/tesoreria/cobros')}>
              Volver a la lista de cobros
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
