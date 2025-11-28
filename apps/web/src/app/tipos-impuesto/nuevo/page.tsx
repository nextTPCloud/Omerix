'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TipoImpuestoForm } from '@/components/tipos-impuesto/TipoImpuestoForm'
import { tiposImpuestoService } from '@/services/tipos-impuesto.service'
import { CreateTipoImpuestoDTO } from '@/types/tipo-impuesto.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Percent } from 'lucide-react'
import Link from 'next/link'

export default function NuevoTipoImpuestoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateTipoImpuestoDTO) => {
    try {
      setIsLoading(true)
      const response = await tiposImpuestoService.create(data)

      if (response.success) {
        toast.success('Tipo de impuesto creado correctamente')
        router.push('/tipos-impuesto')
      } else {
        toast.error('Error al crear el tipo de impuesto')
      }
    } catch (error: any) {
      console.error('Error al crear tipo de impuesto:', error)
      toast.error(error?.response?.data?.message || 'Error al crear el tipo de impuesto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Percent className="h-7 w-7 text-primary" />
              Nuevo Tipo de Impuesto
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea un nuevo tipo de impuesto para facturas
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tipos-impuesto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Link>
          </Button>
        </div>

        {/* FORMULARIO */}
        <TipoImpuestoForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
