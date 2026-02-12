"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { FacturaForm } from '@/components/facturas/FacturaForm'
import { facturasService } from '@/services/facturas.service'
import { CreateFacturaDTO, UpdateFacturaDTO, IFactura, getEstadoConfig, EstadoFactura } from '@/types/factura.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Lock, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

export default function EditarFacturaPage() {
  const router = useRouter()
  const params = useParams()
  const facturaId = params.id as string

  const [factura, setFactura] = useState<IFactura | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar factura
  useEffect(() => {
    const loadFactura = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await facturasService.getById(facturaId)

        if (response.success && response.data) {
          setFactura(response.data)
        } else {
          setError('No se encontró la factura')
        }
      } catch (error: any) {
        console.error('Error cargando factura:', error)
        setError(error.response?.data?.message || 'Error al cargar la factura')
      } finally {
        setIsLoading(false)
      }
    }

    if (facturaId) {
      loadFactura()
    }
  }, [facturaId])

  // Actualizar factura
  const handleSubmit = async (data: CreateFacturaDTO | UpdateFacturaDTO) => {
    try {
      setIsSaving(true)
      const response = await facturasService.update(facturaId, data as UpdateFacturaDTO)

      if (response.success && response.data) {
        toast.success('Factura actualizada correctamente')
        router.push(`/facturas/${facturaId}`)
      }
    } catch (error: any) {
      console.error('Error al actualizar factura:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar la factura')
    } finally {
      setIsSaving(false)
    }
  }

  // Mostrar loading
  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando factura...</p>
          </div>
        </div>
      
    )
  }

  // Mostrar error
  if (error || !factura) {
    return (
      
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-lg text-muted-foreground">{error || 'Factura no encontrada'}</p>
          <Link href="/facturas">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al listado
            </Button>
          </Link>
        </div>
      
    )
  }

  // Verificar si la factura está inmutable (emitida con VeriFactu/TicketBAI)
  if (factura.inmutable) {
    return (
      
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Lock className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Factura inmutable</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Esta factura ha sido emitida y registrada en el sistema fiscal.
            Por requisitos legales, no puede ser modificada.
          </p>
          <p className="text-sm text-muted-foreground">
            Si necesita corregir algo, debe crear una factura rectificativa.
          </p>
          <div className="flex gap-4 mt-4">
            <Link href={`/facturas/${facturaId}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver factura
              </Button>
            </Link>
            <Link href={`/facturas/nuevo?rectificativa=${facturaId}`}>
              <Button>
                Crear rectificativa
              </Button>
            </Link>
          </div>
        </div>
      
    )
  }

  // Verificar si la factura está bloqueada
  if (factura.bloqueado) {
    return (
      
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Lock className="h-16 w-16 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            Esta factura está bloqueada y no puede ser editada
          </p>
          <Link href={`/facturas/${facturaId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ver factura
            </Button>
          </Link>
        </div>
      
    )
  }

  const estadoConfig = getEstadoConfig(factura.estado)

  // Advertencia si la factura ya está emitida (pero aún no es inmutable)
  const mostrarAdvertenciaEmitida = factura.estado !== EstadoFactura.BORRADOR

  return (
    
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Link href={`/facturas/${facturaId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Editar Factura {factura.codigo}
              </h1>
              <Badge className={estadoConfig.color}>
                {estadoConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Cliente: {factura.clienteNombre}
              {factura.titulo && ` · ${factura.titulo}`}
            </p>
          </div>
        </div>

        {/* Advertencia si ya está emitida */}
        {mostrarAdvertenciaEmitida && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Factura ya procesada</AlertTitle>
            <AlertDescription>
              Esta factura ya no está en estado borrador. Los cambios que realice
              podrían afectar a los registros contables y fiscales. Proceda con
              precaución o considere crear una factura rectificativa.
            </AlertDescription>
          </Alert>
        )}

        {/* FORMULARIO */}
        <FacturaForm
          initialData={factura}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="edit"
        />
      </div>
    
  )
}
