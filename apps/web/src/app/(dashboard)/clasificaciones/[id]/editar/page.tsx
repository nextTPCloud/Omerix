'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { ClasificacionForm } from '@/components/clasificaciones/ClasificacionForm'
import { clasificacionesService } from '@/services/clasificaciones.service'
import { Clasificacion, UpdateClasificacionDTO } from '@/types/clasificacion.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Layers, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function EditarClasificacionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [clasificacion, setClasificacion] = useState<Clasificacion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    cargarClasificacion()
  }, [id])

  const cargarClasificacion = async () => {
    try {
      setIsLoading(true)
      const response = await clasificacionesService.getById(id)

      if (response.success) {
        setClasificacion(response.data)
      } else {
        toast.error('Error al cargar la clasificación')
        router.push('/clasificaciones')
      }
    } catch (error: any) {
      console.error('Error al cargar clasificación:', error)
      toast.error(error?.response?.data?.message || 'Error al cargar la clasificación')
      router.push('/clasificaciones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateClasificacionDTO) => {
    try {
      setIsSaving(true)
      const response = await clasificacionesService.update(id, data)

      if (response.success) {
        toast.success('Clasificación actualizada correctamente')
        router.push('/clasificaciones')
      } else {
        toast.error('Error al actualizar la clasificación')
      }
    } catch (error: any) {
      console.error('Error al actualizar clasificación:', error)
      toast.error(error?.response?.data?.message || 'Error al actualizar la clasificación')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando clasificación...</p>
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
              <Layers className="h-7 w-7 text-primary" />
              Editar Clasificación
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica los datos de la clasificación: {clasificacion?.nombre}
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
          isLoading={isSaving}
          initialData={clasificacion}
          mode="edit"
        />
      </div>
    
  )
}
