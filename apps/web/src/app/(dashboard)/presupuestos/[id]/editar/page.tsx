"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { PresupuestoForm } from '@/components/presupuestos/PresupuestoForm'
import { presupuestosService } from '@/services/presupuestos.service'
import { IPresupuesto, UpdatePresupuestoDTO } from '@/types/presupuesto.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface EditarPresupuestoPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditarPresupuestoPage({ params }: EditarPresupuestoPageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const [presupuesto, setPresupuesto] = useState<IPresupuesto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // CARGAR PRESUPUESTO
  // ============================================

  useEffect(() => {
    loadPresupuesto()
  }, [resolvedParams.id])

  const loadPresupuesto = async () => {
    try {
      setIsLoading(true)
      const response = await presupuestosService.getById(resolvedParams.id)

      if (response.success && response.data) {
        setPresupuesto(response.data)
      } else {
        toast.error('No se pudo cargar el presupuesto')
        router.push('/presupuestos')
      }
    } catch (error: any) {
      console.error('Error al cargar presupuesto:', error)
      toast.error(error.response?.data?.message || 'Error al cargar el presupuesto')
      router.push('/presupuestos')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

  const handleSubmit = async (data: UpdatePresupuestoDTO) => {
    if (!presupuesto) return

    try {
      setIsSaving(true)
      const response = await presupuestosService.update(presupuesto._id, data)

      if (response.success) {
        toast.success('Presupuesto actualizado correctamente')
        router.push(`/presupuestos/${presupuesto._id}`)
      }
    } catch (error: any) {
      console.error('Error al actualizar presupuesto:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el presupuesto')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando presupuesto...</p>
          </div>
        </div>
      
    )
  }

  if (!presupuesto) {
    return (
      
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Presupuesto no encontrado</p>
            <Button onClick={() => router.push('/presupuestos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Presupuestos
            </Button>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="space-y-6">
        {/* ============================================ */}
        {/* HEADER PROFESIONAL */}
        {/* ============================================ */}

        <div className="space-y-4">
          {/* Navegación y título */}
          <div className="flex items-center gap-4">
            <Link href={`/presupuestos/${presupuesto._id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">Editar Presupuesto</h1>
              <p className="text-muted-foreground mt-1">
                Modificar datos del presupuesto <span className="font-medium">{presupuesto.numero}</span>
              </p>
            </div>
          </div>

          {/* Info rápida del presupuesto */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Número:</span>
                  <Badge variant="outline" className="font-mono">{presupuesto.numero}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Fecha:</span>
                  <Badge variant="outline">
                    {new Date(presupuesto.fecha).toLocaleDateString('es-ES')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge variant="default">
                    {presupuesto.estado}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <Badge variant="outline" className="font-mono">
                    {(presupuesto.totales?.totalPresupuesto || 0).toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================ */}
        {/* FORMULARIO */}
        {/* ============================================ */}

        <PresupuestoForm
          initialData={presupuesto}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="edit"
        />
      </div>
    
  )
}
