"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { ClienteForm } from '@/components/clientes/ClienteForm' // ✅ Importación nombrada
import { clientesService } from '@/services/clientes.service'
import { Cliente, UpdateClienteDTO } from '@/types/cliente.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface EditarClientePageProps {
  params: {
    id: string
  }
}

export default function EditarClientePage({ params }: EditarClientePageProps) {
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // CARGAR CLIENTE
  // ============================================

  useEffect(() => {
    loadCliente()
  }, [params.id])

  const loadCliente = async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getById(params.id)
      
      if (response.success && response.data) {
        setCliente(response.data)
      } else {
        toast.error('No se pudo cargar el cliente')
        router.push('/clientes')
      }
    } catch (error: any) {
      console.error('Error al cargar cliente:', error)
      toast.error(error.response?.data?.message || 'Error al cargar el cliente')
      router.push('/clientes')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // GUARDAR CAMBIOS
  // ============================================

  const handleSubmit = async (data: UpdateClienteDTO) => {
    if (!cliente) return

    try {
      setIsSaving(true)
      const response = await clientesService.update(cliente._id, data)
      
      if (response.success) {
        toast.success('Cliente actualizado correctamente')
        router.push(`/clientes/${cliente._id}`)
      }
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el cliente')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando cliente...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!cliente) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Cliente no encontrado</p>
            <Button onClick={() => router.push('/clientes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Clientes
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        
        <div className="flex items-center gap-4">
          <Link href={`/clientes/${cliente._id}`}>
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

        {/* ============================================ */}
        {/* FORMULARIO */}
        {/* ============================================ */}
        
        <ClienteForm
          initialData={cliente}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="edit"
        />
      </div>
    </DashboardLayout>
  )
}