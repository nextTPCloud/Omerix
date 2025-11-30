"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { ProyectoForm } from '@/components/proyectos/ProyectoForm'
import { proyectosService } from '@/services/proyectos.service'
import { CreateProyectoDTO, UpdateProyectoDTO } from '@/types/proyecto.types'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoProyectoPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // CREAR PROYECTO
  // ============================================

  const handleSubmit = async (data: CreateProyectoDTO | UpdateProyectoDTO) => {
    try {
      setIsSaving(true)
      const response = await proyectosService.create(data as CreateProyectoDTO)

      if (response.success && response.data) {
        toast.success('Proyecto creado correctamente')
        router.push(`/proyectos/${response.data._id}`)
      }
    } catch (error: any) {
      console.error('Error al crear proyecto:', error)

      // Manejo de errores específicos
      if (error.response?.status === 409) {
        toast.error('Ya existe un proyecto con ese código')
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el proyecto')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}

        <div className="flex items-center gap-4">
          <Link href="/proyectos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Proyecto</h1>
            <p className="text-muted-foreground">
              Registrar un nuevo proyecto en el sistema
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* FORMULARIO */}
        {/* ============================================ */}

        <ProyectoForm
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
