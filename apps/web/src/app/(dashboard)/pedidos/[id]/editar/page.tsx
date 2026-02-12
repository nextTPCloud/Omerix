"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { PedidoForm } from '@/components/pedidos/PedidoForm'
import { pedidosService } from '@/services/pedidos.service'
import { IPedido, UpdatePedidoDTO, getEstadoConfig, getPrioridadConfig } from '@/types/pedido.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface EditarPedidoPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditarPedidoPage({ params }: EditarPedidoPageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const [pedido, setPedido] = useState<IPedido | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Cargar pedido
  useEffect(() => {
    loadPedido()
  }, [resolvedParams.id])

  const loadPedido = async () => {
    try {
      setIsLoading(true)
      const response = await pedidosService.getById(resolvedParams.id)

      if (response.success && response.data) {
        setPedido(response.data)
      } else {
        toast.error('No se pudo cargar el pedido')
        router.push('/pedidos')
      }
    } catch (error: any) {
      console.error('Error al cargar pedido:', error)
      toast.error(error.response?.data?.message || 'Error al cargar el pedido')
      router.push('/pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar cambios
  const handleSubmit = async (data: UpdatePedidoDTO) => {
    if (!pedido) return

    try {
      setIsSaving(true)
      const response = await pedidosService.update(pedido._id, data)

      if (response.success) {
        toast.success('Pedido actualizado correctamente')
        router.push(`/pedidos/${pedido._id}`)
      }
    } catch (error: any) {
      console.error('Error al actualizar pedido:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el pedido')
    } finally {
      setIsSaving(false)
    }
  }

  // Render loading
  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando pedido...</p>
          </div>
        </div>
      
    )
  }

  // Render not found
  if (!pedido) {
    return (
      
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
            <p className="text-lg text-muted-foreground">Pedido no encontrado</p>
            <Button onClick={() => router.push('/pedidos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Pedidos
            </Button>
          </div>
        </div>
      
    )
  }

  const estadoConfig = getEstadoConfig(pedido.estado)
  const prioridadConfig = getPrioridadConfig(pedido.prioridad)

  return (
    
      <div className="space-y-6">
        {/* HEADER PROFESIONAL */}
        <div className="space-y-4">
          {/* Navegación y título */}
          <div className="flex items-center gap-4">
            <Link href={`/pedidos/${pedido._id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">Editar Pedido</h1>
              <p className="text-muted-foreground mt-1">
                Modificar datos del pedido <span className="font-medium">{pedido.codigo}</span>
              </p>
            </div>
          </div>

          {/* Info rápida del pedido */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Código:</span>
                  <Badge variant="outline" className="font-mono">{pedido.codigo}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Fecha:</span>
                  <Badge variant="outline">
                    {new Date(pedido.fecha).toLocaleDateString('es-ES')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge className={estadoConfig.color}>
                    {estadoConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Prioridad:</span>
                  <Badge variant="outline" className={prioridadConfig.color}>
                    {prioridadConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <Badge variant="outline" className="font-mono">
                    {(pedido.totales?.totalPedido || 0).toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FORMULARIO */}
        <PedidoForm
          initialData={pedido}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="edit"
        />
      </div>
    
  )
}
