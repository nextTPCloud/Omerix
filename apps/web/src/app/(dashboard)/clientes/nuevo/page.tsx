"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import { clientesService } from '@/services/clientes.service'
import { CreateClienteDTO, UpdateClienteDTO } from '@/types/cliente.types'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoClientePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // CREAR CLIENTE
  // ============================================

  // ✅ CORRECCIÓN: Ahora acepta ambos tipos
  const handleSubmit = async (data: CreateClienteDTO | UpdateClienteDTO) => {
    try {
      setIsSaving(true)
      const response = await clientesService.create(data as CreateClienteDTO)
      
      if (response.success && response.data) {
        toast.success('Cliente creado correctamente')
        router.push(`/clientes/${response.data._id}`)  // ✅ CORRECCIÓN: Sintaxis corregida
      }
    } catch (error: any) {
      console.error('Error al crear cliente:', error)
      
      // Manejo de errores específicos
      if (error.response?.status === 409) {
        toast.error('Ya existe un cliente con ese NIF')
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el cliente')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    
      <div className="space-y-6">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
            <p className="text-muted-foreground">
              Registrar un nuevo cliente en el sistema
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* FORMULARIO */}
        {/* ============================================ */}
        
        <ClienteForm
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="create"
        />
      </div>
    
  )
}