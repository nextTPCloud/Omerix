'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SituacionForm } from '@/components/situaciones/SituacionForm'
import { situacionesService } from '@/services/situaciones.service'
import { CreateSituacionDTO, UpdateSituacionDTO } from '@/types/situacion.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ListChecks } from 'lucide-react'
import Link from 'next/link'

export default function NuevaSituacionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateSituacionDTO | UpdateSituacionDTO) => {
    try {
      setIsLoading(true)
      const response = await situacionesService.create(data as CreateSituacionDTO)

      if (response.success) {
        toast.success('Situación creada correctamente')
        router.push('/situaciones')
      } else {
        toast.error('Error al crear la situación')
      }
    } catch (error: any) {
      console.error('Error al crear situación:', error)
      toast.error(error?.response?.data?.message || 'Error al crear la situación')
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
              <ListChecks className="h-7 w-7 text-primary" />
              Nueva Situación
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea una nueva situación para el sistema
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/situaciones">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Link>
          </Button>
        </div>

        {/* FORMULARIO */}
        <SituacionForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
