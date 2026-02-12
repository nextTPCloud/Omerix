'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { TipoImpuestoForm } from '@/components/tipos-impuesto/TipoImpuestoForm'
import { tiposImpuestoService } from '@/services/tipos-impuesto.service'
import { TipoImpuesto, UpdateTipoImpuestoDTO } from '@/types/tipo-impuesto.types'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Percent, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function EditarTipoImpuestoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [tipoImpuesto, setTipoImpuesto] = useState<TipoImpuesto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (id) {
      cargarTipoImpuesto()
    }
  }, [id])

  const cargarTipoImpuesto = async () => {
    try {
      setIsLoading(true)
      const response = await tiposImpuestoService.getById(id)

      if (response.success && response.data) {
        setTipoImpuesto(response.data)
      } else {
        toast.error('No se pudo cargar el tipo de impuesto')
        router.push('/tipos-impuesto')
      }
    } catch (error) {
      console.error('Error al cargar tipo de impuesto:', error)
      toast.error('Error al cargar el tipo de impuesto')
      router.push('/tipos-impuesto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateTipoImpuestoDTO) => {
    try {
      setIsSaving(true)
      const response = await tiposImpuestoService.update(id, data)

      if (response.success) {
        toast.success('Tipo de impuesto actualizado correctamente')
        router.push(`/tipos-impuesto/${id}`)
      } else {
        toast.error('Error al actualizar el tipo de impuesto')
      }
    } catch (error: any) {
      console.error('Error al actualizar tipo de impuesto:', error)
      toast.error(error?.response?.data?.message || 'Error al actualizar el tipo de impuesto')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando tipo de impuesto...</p>
          </div>
        </div>
      
    )
  }

  if (!tipoImpuesto) {
    return null
  }

  return (
    
      <div className="w-full space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Percent className="h-7 w-7 text-primary" />
              Editar Tipo de Impuesto
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica la información del tipo de impuesto
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/tipos-impuesto/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Link>
            </Button>
          </div>
        </div>

        {/* FORMULARIO */}
        <TipoImpuestoForm
          initialData={tipoImpuesto}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="edit"
        />
      </div>
    
  )
}
