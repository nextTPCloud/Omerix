'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PresupuestoCompraForm } from '@/components/compras/PresupuestoCompraForm'
import { presupuestosCompraService } from '@/services/presupuestos-compra.service'
import { CreatePresupuestoCompraDTO, UpdatePresupuestoCompraDTO } from '@/types/presupuesto-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NuevoPresupuestoCompraPage() {
  const router = useRouter()

  const handleSubmit = async (data: CreatePresupuestoCompraDTO | UpdatePresupuestoCompraDTO) => {
    try {
      const response = await presupuestosCompraService.create(data as CreatePresupuestoCompraDTO)
      if (response.success && response.data) {
        toast.success('Presupuesto de compra creado correctamente')
        router.push(`/compras/presupuestos/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear presupuesto de compra')
      throw error
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <Link href="/compras/presupuestos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Nuevo Presupuesto de Compra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crea una solicitud de presupuesto a un proveedor
            </p>
          </div>
        </div>

        {/* Formulario */}
        <PresupuestoCompraForm onSubmit={handleSubmit} />
      </div>
    </DashboardLayout>
  )
}
