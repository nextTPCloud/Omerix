'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

import { PresupuestoCompraForm } from '@/components/compras/PresupuestoCompraForm'
import { presupuestosCompraService } from '@/services/presupuestos-compra.service'
import { PresupuestoCompra, UpdatePresupuestoCompraDTO } from '@/types/presupuesto-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarPresupuestoCompraPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [presupuesto, setPresupuesto] = useState<PresupuestoCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPresupuesto()
  }, [resolvedParams.id])

  const loadPresupuesto = async () => {
    try {
      setIsLoading(true)
      const response = await presupuestosCompraService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setPresupuesto(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar presupuesto')
      router.push('/compras/presupuestos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdatePresupuestoCompraDTO) => {
    try {
      const response = await presupuestosCompraService.update(resolvedParams.id, data)
      if (response.success && response.data) {
        toast.success('Presupuesto de compra actualizado correctamente')
        router.push(`/compras/presupuestos/${resolvedParams.id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar presupuesto de compra')
      throw error
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando presupuesto...</p>
          </div>
        </div>
      
    )
  }

  if (!presupuesto) {
    return (
      
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Presupuesto de compra no encontrado</p>
          <Link href="/compras/presupuestos">
            <Button variant="link" className="mt-2">
              Volver al listado
            </Button>
          </Link>
        </div>
      
    )
  }

  return (
    
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <Link href={`/compras/presupuestos/${resolvedParams.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Editar Presupuesto {presupuesto.codigo}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica los datos del presupuesto de compra
            </p>
          </div>
        </div>

        {/* Formulario */}
        <PresupuestoCompraForm
          presupuesto={presupuesto}
          onSubmit={handleSubmit}
          isEditing
        />
      </div>
    
  )
}
