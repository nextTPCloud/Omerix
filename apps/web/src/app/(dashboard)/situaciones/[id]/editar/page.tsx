'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { SituacionForm } from '@/components/situaciones/SituacionForm'
import { situacionesService } from '@/services/situaciones.service'
import { Situacion, UpdateSituacionDTO } from '@/types/situacion.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ListChecks, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function EditarSituacionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [situacion, setSituacion] = useState<Situacion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    cargarSituacion()
  }, [id])

  const cargarSituacion = async () => {
    try {
      setIsLoading(true)
      const response = await situacionesService.getById(id)

      if (response.success) {
        setSituacion(response.data)
      } else {
        toast.error('Error al cargar la situación')
        router.push('/situaciones')
      }
    } catch (error: any) {
      console.error('Error al cargar situación:', error)
      toast.error(error?.response?.data?.message || 'Error al cargar la situación')
      router.push('/situaciones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateSituacionDTO) => {
    try {
      setIsSaving(true)
      const response = await situacionesService.update(id, data)

      if (response.success) {
        toast.success('Situación actualizada correctamente')
        router.push('/situaciones')
      } else {
        toast.error('Error al actualizar la situación')
      }
    } catch (error: any) {
      console.error('Error al actualizar situación:', error)
      toast.error(error?.response?.data?.message || 'Error al actualizar la situación')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando situación...</p>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ListChecks className="h-7 w-7 text-primary" />
              Editar Situación
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica los datos de la situación: {situacion?.nombre}
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
          isLoading={isSaving}
          initialData={situacion}
          mode="edit"
        />
      </div>
    
  )
}
