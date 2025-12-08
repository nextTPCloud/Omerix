"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { AlbaranForm } from '@/components/albaranes/AlbaranForm'
import { albaranesService } from '@/services/albaranes.service'
import { CreateAlbaranDTO, UpdateAlbaranDTO, IAlbaran, getEstadoConfig } from '@/types/albaran.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function EditarAlbaranPage() {
  const router = useRouter()
  const params = useParams()
  const albaranId = params.id as string

  const [albaran, setAlbaran] = useState<IAlbaran | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar albarán
  useEffect(() => {
    const loadAlbaran = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await albaranesService.getById(albaranId)

        if (response.success && response.data) {
          setAlbaran(response.data)
        } else {
          setError('No se encontró el albarán')
        }
      } catch (error: any) {
        console.error('Error cargando albarán:', error)
        setError(error.response?.data?.message || 'Error al cargar el albarán')
      } finally {
        setIsLoading(false)
      }
    }

    if (albaranId) {
      loadAlbaran()
    }
  }, [albaranId])

  // Actualizar albarán
  const handleSubmit = async (data: CreateAlbaranDTO | UpdateAlbaranDTO) => {
    try {
      setIsSaving(true)
      const response = await albaranesService.update(albaranId, data as UpdateAlbaranDTO)

      if (response.success && response.data) {
        toast.success('Albarán actualizado correctamente')
        router.push(`/albaranes/${albaranId}`)
      }
    } catch (error: any) {
      console.error('Error al actualizar albarán:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el albarán')
    } finally {
      setIsSaving(false)
    }
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando albarán...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Mostrar error
  if (error || !albaran) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-lg text-muted-foreground">{error || 'Albarán no encontrado'}</p>
          <Link href="/albaranes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  // Verificar si el albarán está bloqueado
  if (albaran.bloqueado) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-lg text-muted-foreground">
            Este albarán está bloqueado y no puede ser editado
          </p>
          <Link href={`/albaranes/${albaranId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ver albarán
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const estadoConfig = getEstadoConfig(albaran.estado)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Link href={`/albaranes/${albaranId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Editar Albarán {albaran.codigo}
              </h1>
              <Badge className={estadoConfig.color}>
                {estadoConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Cliente: {albaran.clienteNombre}
              {albaran.titulo && ` · ${albaran.titulo}`}
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        <AlbaranForm
          initialData={albaran}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="edit"
        />
      </div>
    </DashboardLayout>
  )
}
