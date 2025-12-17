'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { FacturaCompraForm } from '@/components/compras/FacturaCompraForm'
import { facturasCompraService } from '@/services/facturas-compra.service'
import { FacturaCompra, UpdateFacturaCompraDTO } from '@/types/factura-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, Receipt, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarFacturaCompraPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [factura, setFactura] = useState<FacturaCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFactura()
  }, [resolvedParams.id])

  const loadFactura = async () => {
    try {
      setIsLoading(true)
      const response = await facturasCompraService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setFactura(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar factura')
      router.push('/compras/facturas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateFacturaCompraDTO) => {
    try {
      const response = await facturasCompraService.update(resolvedParams.id, data)
      if (response.success && response.data) {
        toast.success('Factura de compra actualizada correctamente')
        router.push(`/compras/facturas/${resolvedParams.id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar factura de compra')
      throw error
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando factura...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!factura) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Factura de compra no encontrada</p>
          <Link href="/compras/facturas">
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
          <Link href={`/compras/facturas/${resolvedParams.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              Editar Factura {factura.codigo}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica los datos de la factura de compra
            </p>
          </div>
        </div>

        {/* Formulario */}
        <FacturaCompraForm
          factura={factura}
          onSubmit={handleSubmit}
          isEditing
        />
      </div>
    </DashboardLayout>
  )
}
