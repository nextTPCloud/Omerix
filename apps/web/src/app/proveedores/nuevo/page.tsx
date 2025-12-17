'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProveedorForm } from '@/components/proveedores/ProveedorForm'
import { proveedoresService } from '@/services/proveedores.service'
import { CreateProveedorDTO, UpdateProveedorDTO } from '@/types/proveedor.types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Truck } from 'lucide-react'
import { toast } from 'sonner'

export default function NuevoProveedorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateProveedorDTO | UpdateProveedorDTO) => {
    try {
      setIsLoading(true)
      const response = await proveedoresService.create(data as CreateProveedorDTO)

      if (response.success) {
        toast.success('Proveedor creado correctamente')
        router.push(`/proveedores/${response.data._id}`)
      } else {
        toast.error('Error al crear el proveedor')
      }
    } catch (error: any) {
      console.error('Error al crear proveedor:', error)
      toast.error(error.response?.data?.message || 'Error al crear el proveedor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/proveedores">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Truck className="h-7 w-7 text-primary" />
                Nuevo Proveedor
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Crea un nuevo proveedor en el sistema
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <Card className="p-6">
          <ProveedorForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mode="create"
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}
