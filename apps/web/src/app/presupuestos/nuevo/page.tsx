"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PresupuestoForm } from '@/components/presupuestos/PresupuestoForm'
import { presupuestosService } from '@/services/presupuestos.service'
import { CreatePresupuestoDTO, UpdatePresupuestoDTO } from '@/types/presupuesto.types'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoPresupuestoPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // CREAR PRESUPUESTO
  // ============================================

  const handleSubmit = async (data: CreatePresupuestoDTO | UpdatePresupuestoDTO) => {
    try {
      setIsSaving(true)
      const response = await presupuestosService.create(data as CreatePresupuestoDTO)

      if (response.success && response.data) {
        toast.success('Presupuesto creado correctamente')
        router.push(`/presupuestos/${response.data._id}`)
      }
    } catch (error: any) {
      console.error('Error al crear presupuesto:', error)

      // Manejo de errores específicos
      if (error.response?.status === 409) {
        toast.error('Ya existe un presupuesto con ese número')
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el presupuesto')
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
          <Link href="/presupuestos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Presupuesto</h1>
            <p className="text-muted-foreground">
              Registrar un nuevo presupuesto en el sistema
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* FORMULARIO */}
        {/* ============================================ */}

        <PresupuestoForm
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
