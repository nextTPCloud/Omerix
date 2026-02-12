'use client'

export const dynamic = 'force-dynamic'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { AlbaranCompraForm } from '@/components/compras/AlbaranCompraForm'
import { albaranesCompraService } from '@/services/albaranes-compra.service'
import { CreateAlbaranCompraDTO, UpdateAlbaranCompraDTO } from '@/types/albaran-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, Truck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NuevoAlbaranCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pedidoCompraId = searchParams.get('pedidoCompraId')
  const proveedorId = searchParams.get('proveedorId')

  // Si viene con pedidoCompraId, redirigir a la pagina de recepcion
  useEffect(() => {
    if (pedidoCompraId) {
      router.replace(`/compras/pedidos/${pedidoCompraId}/recepcion`)
    }
  }, [pedidoCompraId, router])

  const handleSubmit = async (data: CreateAlbaranCompraDTO | UpdateAlbaranCompraDTO) => {
    try {
      const response = await albaranesCompraService.create(data as CreateAlbaranCompraDTO)
      if (response.success && response.data) {
        toast.success('Albaran de compra creado correctamente')
        router.push(`/compras/albaranes/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear albaran de compra')
      throw error
    }
  }

  // Si viene de un pedido, mostrar loading mientras redirecciona
  if (pedidoCompraId) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Redirigiendo a recepcion de pedido...</p>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <Link href="/compras/albaranes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Nuevo Albaran de Compra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registra una nueva recepcion de mercancia
            </p>
          </div>
        </div>

        {/* Formulario */}
        <AlbaranCompraForm
          onSubmit={handleSubmit}
          defaultProveedorId={proveedorId || undefined}
        />
      </div>
    
  )
}
