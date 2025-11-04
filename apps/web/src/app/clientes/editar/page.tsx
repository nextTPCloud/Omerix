"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import { clientesService } from '@/services/clientes.service'
import { Cliente } from '@/types/cliente.types'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function EditarClientePage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadCliente()
  }, [params.id])

  const loadCliente = async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getById(params.id as string)
      setCliente(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar cliente')
      router.push('/clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      setIsSaving(true)
      await clientesService.update(params.id as string, data)
      toast.success('Cliente actualizado correctamente')
      router.push(`/clientes/${params.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar cliente')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando cliente...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!cliente) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cliente no encontrado</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/clientes/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
            <p className="text-muted-foreground">
              Modificar datos de {cliente.nombre}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <ClienteForm
          initialData={cliente}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        />
      </div>
    </DashboardLayout>
  )
}