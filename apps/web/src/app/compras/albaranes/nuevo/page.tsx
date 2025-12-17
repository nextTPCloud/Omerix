'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AlbaranCompraForm } from '@/components/compras/AlbaranCompraForm'
import { albaranesCompraService } from '@/services/albaranes-compra.service'
import { CreateAlbaranCompraDTO, UpdateAlbaranCompraDTO, AlbaranCompra } from '@/types/albaran-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, Truck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NuevoAlbaranCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pedidoCompraId = searchParams.get('pedidoCompraId')
  const proveedorId = searchParams.get('proveedorId')

  const [albaranDesdePedido, setAlbaranDesdePedido] = useState<AlbaranCompra | null>(null)
  const [isLoadingPedido, setIsLoadingPedido] = useState(false)

  // Si viene de un pedido, crear el albaran automaticamente
  useEffect(() => {
    const crearDesdePedido = async () => {
      if (pedidoCompraId) {
        try {
          setIsLoadingPedido(true)
          toast.loading('Creando albaran desde pedido...')
          const response = await albaranesCompraService.crearDesdePedido(pedidoCompraId)
          toast.dismiss()
          if (response.success && response.data) {
            toast.success('Albaran creado desde pedido')
            // Redirigir a editar el albaran recien creado
            router.push(`/compras/albaranes/${response.data._id}/editar`)
          }
        } catch (error: any) {
          toast.dismiss()
          toast.error(error.response?.data?.message || 'Error al crear albaran desde pedido')
        } finally {
          setIsLoadingPedido(false)
        }
      }
    }
    crearDesdePedido()
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

  if (isLoadingPedido) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Creando albaran desde pedido...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  )
}
