'use client'

export const dynamic = 'force-dynamic'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { FacturaCompraForm } from '@/components/compras/FacturaCompraForm'
import { facturasCompraService } from '@/services/facturas-compra.service'
import { CreateFacturaCompraDTO, UpdateFacturaCompraDTO, FacturaCompra } from '@/types/factura-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, Receipt, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NuevaFacturaCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const albaranCompraIds = searchParams.get('albaranCompraIds')
  const proveedorId = searchParams.get('proveedorId')

  const [facturaDesdeAlbaranes, setFacturaDesdeAlbaranes] = useState<FacturaCompra | null>(null)
  const [isLoadingAlbaranes, setIsLoadingAlbaranes] = useState(false)

  // Parsear IDs de albaranes si vienen en la URL
  const albaranIds = albaranCompraIds ? albaranCompraIds.split(',') : []

  const handleSubmit = async (data: CreateFacturaCompraDTO | UpdateFacturaCompraDTO) => {
    try {
      // Si viene de albaranes, usar el endpoint especifico
      if (albaranIds.length > 0 && data.numeroFacturaProveedor && data.fechaFacturaProveedor) {
        const response = await facturasCompraService.crearDesdeAlbaranes(
          albaranIds,
          data.numeroFacturaProveedor,
          data.fechaFacturaProveedor
        )
        if (response.success && response.data) {
          toast.success('Factura de compra creada desde albaranes')
          router.push(`/compras/facturas/${response.data._id}`)
        }
      } else {
        const response = await facturasCompraService.create(data as CreateFacturaCompraDTO)
        if (response.success && response.data) {
          toast.success('Factura de compra creada correctamente')
          router.push(`/compras/facturas/${response.data._id}`)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear factura de compra')
      throw error
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <Link href="/compras/facturas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              Nueva Factura de Compra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {albaranIds.length > 0
                ? `Crear factura desde ${albaranIds.length} albaran(es) seleccionado(s)`
                : 'Registra una nueva factura de proveedor'
              }
            </p>
          </div>
        </div>

        {/* Formulario */}
        <FacturaCompraForm
          onSubmit={handleSubmit}
          defaultProveedorId={proveedorId || undefined}
          defaultAlbaranIds={albaranIds.length > 0 ? albaranIds : undefined}
        />
      </div>
    </DashboardLayout>
  )
}
