'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PedidoCompraForm } from '@/components/compras/PedidoCompraForm'
import { pedidosCompraService } from '@/services/pedidos-compra.service'
import { PedidoCompra, UpdatePedidoCompraDTO } from '@/types/pedido-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, ShoppingCart, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarPedidoCompraPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [pedido, setPedido] = useState<PedidoCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPedido()
  }, [resolvedParams.id])

  const loadPedido = async () => {
    try {
      setIsLoading(true)
      const response = await pedidosCompraService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setPedido(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar pedido')
      router.push('/compras/pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdatePedidoCompraDTO) => {
    try {
      const response = await pedidosCompraService.update(resolvedParams.id, data)
      if (response.success && response.data) {
        toast.success('Pedido de compra actualizado correctamente')
        router.push(`/compras/pedidos/${resolvedParams.id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar pedido de compra')
      throw error
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando pedido...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!pedido) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Pedido de compra no encontrado</p>
          <Link href="/compras/pedidos">
            <Button variant="link" className="mt-2">
              Volver al listado
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
        <div className="flex items-center gap-3">
          <Link href={`/compras/pedidos/${resolvedParams.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Editar Pedido {pedido.codigo}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica los datos del pedido de compra
            </p>
          </div>
        </div>

        {/* Formulario */}
        <PedidoCompraForm
          pedido={pedido}
          onSubmit={handleSubmit}
          isEditing
        />
      </div>
    </DashboardLayout>
  )
}
