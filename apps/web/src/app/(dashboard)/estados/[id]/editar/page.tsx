'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { EstadoForm } from '@/components/estados/EstadoForm'
import { estadosService } from '@/services/estados.service'
import { Estado, UpdateEstadoDTO } from '@/types/estado.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Tag, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function EditarEstadoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [estado, setEstado] = useState<Estado | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    cargarEstado()
  }, [id])

  const cargarEstado = async () => {
    try {
      setIsLoading(true)
      const response = await estadosService.getById(id)

      if (response.success) {
        setEstado(response.data)
      } else {
        toast.error('Error al cargar el estado')
        router.push('/estados')
      }
    } catch (error: any) {
      console.error('Error al cargar estado:', error)
      toast.error(error?.response?.data?.message || 'Error al cargar el estado')
      router.push('/estados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateEstadoDTO) => {
    try {
      setIsSaving(true)
      const response = await estadosService.update(id, data)

      if (response.success) {
        toast.success('Estado actualizado correctamente')
        router.push('/estados')
      } else {
        toast.error('Error al actualizar el estado')
      }
    } catch (error: any) {
      console.error('Error al actualizar estado:', error)
      toast.error(error?.response?.data?.message || 'Error al actualizar el estado')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando estado...</p>
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
              <Tag className="h-7 w-7 text-primary" />
              Editar Estado
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica los datos del estado: {estado?.nombre}
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
          isLoading={isSaving}
          initialData={estado}
          mode="edit"
        />
      </div>
    
  )
}
