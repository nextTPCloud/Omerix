"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ClienteForm } from '@/components/clientes/ClienteForm' // ✅ Importación nombrada
import { clientesService } from '@/services/clientes.service'
import { Cliente, UpdateClienteDTO } from '@/types/cliente.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Building2, User } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface EditarClientePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditarClientePage({ params }: EditarClientePageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ============================================
  // CARGAR CLIENTE
  // ============================================

  useEffect(() => {
    loadCliente()
  }, [resolvedParams.id])

  const loadCliente = async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getById(resolvedParams.id)
      
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
      
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando cliente...</p>
          </div>
        </div>
      
    )
  }

  if (!cliente) {
    return (
      
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Cliente no encontrado</p>
            <Button onClick={() => router.push('/clientes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Clientes
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
            <Link href={`/clientes/${cliente._id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
              <p className="text-muted-foreground mt-1">
                Modificar datos de <span className="font-medium">{cliente.nombre}</span>
              </p>
            </div>
          </div>

          {/* Info rápida del cliente */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Código:</span>
                  <Badge variant="outline" className="font-mono">{cliente.codigo}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">NIF:</span>
                  <Badge variant="outline" className="font-mono">{cliente.nif}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <Badge variant={cliente.tipoCliente === 'empresa' ? 'default' : 'secondary'}>
                    {cliente.tipoCliente === 'empresa' ? (
                      <><Building2 className="mr-1 h-3 w-3" />Empresa</>
                    ) : (
                      <><User className="mr-1 h-3 w-3" />Particular</>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge variant={cliente.activo ? 'default' : 'secondary'} className={
                    cliente.activo
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
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
    
  )
}