'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ClasificacionForm } from '@/components/clasificaciones/ClasificacionForm'
import { clasificacionesService } from '@/services/clasificaciones.service'
import { CreateClasificacionDTO } from '@/types/clasificacion.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Layers } from 'lucide-react'
import Link from 'next/link'

export default function NuevaClasificacionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateClasificacionDTO) => {
    try {
      setIsLoading(true)
      const response = await clasificacionesService.create(data)

      if (response.success) {
        toast.success('Clasificación creada correctamente')
        router.push('/clasificaciones')
      } else {
        toast.error('Error al crear la clasificación')
      }
    } catch (error: any) {
      console.error('Error al crear clasificación:', error)
      toast.error(error?.response?.data?.message || 'Error al crear la clasificación')
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
              <Layers className="h-7 w-7 text-primary" />
              Nueva Clasificación
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea una nueva clasificación para el sistema
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/clasificaciones">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Link>
          </Button>
        </div>

        {/* FORMULARIO */}
        <ClasificacionForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
