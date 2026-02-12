'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'

import { AlbaranCompraForm } from '@/components/compras/AlbaranCompraForm'
import { albaranesCompraService } from '@/services/albaranes-compra.service'
import { AlbaranCompra, UpdateAlbaranCompraDTO } from '@/types/albaran-compra.types'
import { toast } from 'sonner'
import { ArrowLeft, Truck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarAlbaranCompraPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [albaran, setAlbaran] = useState<AlbaranCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAlbaran()
  }, [resolvedParams.id])

  const loadAlbaran = async () => {
    try {
      setIsLoading(true)
      const response = await albaranesCompraService.getById(resolvedParams.id)
      if (response.success && response.data) {
        setAlbaran(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar albaran')
      router.push('/compras/albaranes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateAlbaranCompraDTO) => {
    try {
      const response = await albaranesCompraService.update(resolvedParams.id, data)
      if (response.success && response.data) {
        toast.success('Albaran de compra actualizado correctamente')
        router.push(`/compras/albaranes/${resolvedParams.id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar albaran de compra')
      throw error
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Cargando albaran...</p>
          </div>
        </div>
      
    )
  }

  if (!albaran) {
    return (
      
        <div className="text-center py-12">
          <Truck className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Albaran de compra no encontrado</p>
          <Link href="/compras/albaranes">
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
          <Link href={`/compras/albaranes/${resolvedParams.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Editar Albaran {albaran.codigo}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifica los datos del albaran de compra
            </p>
          </div>
        </div>

        {/* Formulario */}
        <AlbaranCompraForm
          albaran={albaran}
          onSubmit={handleSubmit}
          isEditing
        />
      </div>
    
  )
}
