"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { ProyectoForm } from '@/components/proyectos/ProyectoForm'
import { proyectosService } from '@/services/proyectos.service'
import { IProyecto, UpdateProyectoDTO } from '@/types/proyecto.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface EditarProyectoPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditarProyectoPage({ params }: EditarProyectoPageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const [proyecto, setProyecto] = useState<IProyecto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadProyecto()
  }, [resolvedParams.id])

  const loadProyecto = async () => {
    try {
      setIsLoading(true)
      const response = await proyectosService.getById(resolvedParams.id)

      if (response.success && response.data) {
        setProyecto(response.data)
      } else {
        toast.error('No se pudo cargar el proyecto')
        router.push('/proyectos')
      }
    } catch (error: any) {
      console.error('Error al cargar proyecto:', error)
      toast.error(error.response?.data?.message || 'Error al cargar el proyecto')
      router.push('/proyectos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateProyectoDTO) => {
    if (!proyecto) return

    try {
      setIsSaving(true)
      const response = await proyectosService.update(proyecto._id, data)

      if (response.success) {
        toast.success('Proyecto actualizado correctamente')
        router.push(`/proyectos/${proyecto._id}`)
      }
    } catch (error: any) {
      console.error('Error al actualizar proyecto:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el proyecto')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando proyecto...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!proyecto) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Proyecto no encontrado</p>
          <Link href="/proyectos">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a proyectos
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-start gap-4">
          <Link href={`/proyectos/${proyecto._id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">Editar Proyecto</h1>
              <Badge variant="outline" className="gap-1">
                <FolderKanban className="h-3 w-3" />
                {proyecto.codigo}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Modifica los datos del proyecto {proyecto.nombre}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono font-medium">{proyecto.codigo}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Creado:</span>
                <span>{new Date(proyecto.fechaCreacion).toLocaleDateString('es-ES')}</span>
              </div>
              {proyecto.fechaModificacion && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Última modificación:</span>
                <span>{new Date(proyecto.fechaModificacion).toLocaleDateString('es-ES')}</span>
              </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulario */}
        <ProyectoForm
          initialData={proyecto}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="edit"
        />
      </div>
    </DashboardLayout>
  )
}
