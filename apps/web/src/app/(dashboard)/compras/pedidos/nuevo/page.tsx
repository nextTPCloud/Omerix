'use client'

import { useRouter } from 'next/navigation'

import { PedidoCompraForm } from '@/components/compras/PedidoCompraForm'
import { pedidosCompraService } from '@/services/pedidos-compra.service'
import { CreatePedidoCompraDTO, UpdatePedidoCompraDTO } from '@/types/pedido-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NuevoPedidoCompraPage() {
  const router = useRouter()

  const handleSubmit = async (data: CreatePedidoCompraDTO | UpdatePedidoCompraDTO) => {
    try {
      const response = await pedidosCompraService.create(data as CreatePedidoCompraDTO)
      if (response.success && response.data) {
        toast.success('Pedido de compra creado correctamente')
        router.push(`/compras/pedidos/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear pedido de compra')
      throw error
    }
  }

  return (
    
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <Link href="/compras/pedidos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Nuevo Pedido de Compra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea un nuevo pedido a un proveedor
            </p>
          </div>
        </div>

        {/* Formulario */}
        <PedidoCompraForm onSubmit={handleSubmit} />
      </div>
    
  )
}
