'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EstadoForm } from '@/components/estados/EstadoForm'
import { estadosService } from '@/services/estados.service'
import { CreateEstadoDTO } from '@/types/estado.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'

export default function NuevoEstadoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateEstadoDTO) => {
    try {
      setIsLoading(true)
      const response = await estadosService.create(data)

      if (response.success) {
        toast.success('Estado creado correctamente')
        router.push('/estados')
      } else {
        toast.error('Error al crear el estado')
      }
    } catch (error: any) {
      console.error('Error al crear estado:', error)
      toast.error(error?.response?.data?.message || 'Error al crear el estado')
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
              <Tag className="h-7 w-7 text-primary" />
              Nuevo Estado
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea un nuevo estado para el sistema
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/estados">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Link>
          </Button>
        </div>

        {/* FORMULARIO */}
        <EstadoForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
