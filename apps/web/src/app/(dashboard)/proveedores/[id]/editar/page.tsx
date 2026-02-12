'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { ProveedorForm } from '@/components/proveedores/ProveedorForm'
import { proveedoresService } from '@/services/proveedores.service'
import { Proveedor, UpdateProveedorDTO } from '@/types/proveedor.types'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Truck, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarProveedorPage() {
  const router = useRouter()
  const params = useParams()
  const proveedorId = params.id as string

  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (proveedorId) {
      cargarProveedor()
    }
  }, [proveedorId])

  const cargarProveedor = async () => {
    try {
      setIsLoading(true)
      const response = await proveedoresService.getById(proveedorId)
      if (response.success) {
        setProveedor(response.data)
      } else {
        toast.error('Error al cargar el proveedor')
        router.push('/proveedores')
      }
    } catch (error) {
      console.error('Error al cargar proveedor:', error)
      toast.error('Error al cargar el proveedor')
      router.push('/proveedores')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateProveedorDTO) => {
    try {
      setIsSaving(true)
      const response = await proveedoresService.update(proveedorId, data)

      if (response.success) {
        toast.success('Proveedor actualizado correctamente')
        router.push(`/proveedores/${proveedorId}`)
      } else {
        toast.error('Error al actualizar el proveedor')
      }
    } catch (error: any) {
      console.error('Error al actualizar proveedor:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el proveedor')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando proveedor...</p>
          </div>
        </div>
      
    )
  }

  if (!proveedor) {
    return (
      
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-lg font-medium">Proveedor no encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/proveedores">Volver al listado</Link>
            </Button>
          </div>
        </div>
      
    )
  }

  return (
    
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/proveedores/${proveedorId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Truck className="h-7 w-7 text-primary" />
                Editar Proveedor
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {proveedor.codigo} - {proveedor.nombre}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <ProveedorForm
          initialData={proveedor}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="edit"
        />
      </div>
    
  )
}
