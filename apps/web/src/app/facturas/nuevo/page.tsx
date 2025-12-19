"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { FacturaForm } from '@/components/facturas/FacturaForm'
import { facturasService } from '@/services/facturas.service'
import { clientesService } from '@/services/clientes.service'
import { CreateFacturaDTO, UpdateFacturaDTO, IFactura, EstadoFactura, TipoFactura, SistemaFiscal } from '@/types/factura.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevaFacturaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCliente, setIsLoadingCliente] = useState(false)
  const [isCreatingFromAlbaranes, setIsCreatingFromAlbaranes] = useState(false)
  const [initialData, setInitialData] = useState<Partial<IFactura> | undefined>(undefined)

  // Leer parámetros de la URL
  const clienteIdFromUrl = searchParams.get('clienteId')
  const albaranesFromUrl = searchParams.get('albaranes')

  // Crear desde albaranes si vienen los IDs
  useEffect(() => {
    const crearDesdeAlbaranes = async () => {
      if (!albaranesFromUrl) return

      try {
        setIsCreatingFromAlbaranes(true)
        const albaranesIds = albaranesFromUrl.split(',')

        const response = await facturasService.crearDesdeAlbaranes({
          albaranesIds,
          agruparPorCliente: true,
        })

        if (response.success && response.data) {
          const facturas = response.data as IFactura[]
          if (facturas.length === 1) {
            toast.success('Factura creada desde albaranes')
            router.push(`/facturas/${facturas[0]._id}/editar`)
          } else {
            toast.success(`${facturas.length} facturas creadas desde albaranes`)
            router.push('/facturas')
          }
        }
      } catch (error: any) {
        console.error('Error creando factura desde albaranes:', error)
        toast.error(error.response?.data?.message || 'Error al crear la factura desde albaranes')
        setIsCreatingFromAlbaranes(false)
      }
    }

    crearDesdeAlbaranes()
  }, [albaranesFromUrl, router])

  // Cargar datos del cliente si viene en la URL
  useEffect(() => {
    const loadCliente = async () => {
      if (!clienteIdFromUrl || albaranesFromUrl) return

      try {
        setIsLoadingCliente(true)
        const response = await clientesService.getById(clienteIdFromUrl)

        if (response.success && response.data) {
          const cliente = response.data

          // Buscar dirección fiscal
          const dirFacturacion = cliente.direcciones?.find(
            d => d.tipo === 'fiscal'
          )

          setInitialData({
            clienteId: cliente._id,
            clienteNombre: cliente.nombre,
            clienteNif: cliente.nif,
            clienteEmail: cliente.email,
            clienteTelefono: cliente.telefono,
            tipo: TipoFactura.ORDINARIA,
            estado: EstadoFactura.BORRADOR,
            fecha: new Date().toISOString(),
            lineas: [],
            vencimientos: [],
            recargoEquivalencia: (cliente as any).aplicaRecargoEquivalencia || false,
            sistemaFiscal: SistemaFiscal.VERIFACTU,
            direccionFacturacion: dirFacturacion ? {
              nombre: cliente.nombre,
              calle: dirFacturacion.calle || '',
              numero: dirFacturacion.numero || '',
              piso: dirFacturacion.piso || '',
              codigoPostal: dirFacturacion.codigoPostal || '',
              ciudad: dirFacturacion.ciudad || '',
              provincia: dirFacturacion.provincia || '',
              pais: dirFacturacion.pais || 'España',
            } : undefined,
          } as Partial<IFactura>)

          toast.success(`Cliente "${cliente.nombre}" cargado`)
        }
      } catch (error) {
        console.error('Error cargando cliente:', error)
        toast.error('No se pudo cargar el cliente')
      } finally {
        setIsLoadingCliente(false)
      }
    }

    loadCliente()
  }, [clienteIdFromUrl, albaranesFromUrl])

  // Crear factura
  const handleSubmit = async (data: CreateFacturaDTO | UpdateFacturaDTO) => {
    try {
      setIsSaving(true)
      const response = await facturasService.create(data as CreateFacturaDTO)

      if (response.success && response.data) {
        toast.success('Factura creada correctamente')
        router.push(`/facturas/${response.data._id}`)
      }
    } catch (error: any) {
      console.error('Error al crear factura:', error)

      if (error.response?.status === 409) {
        toast.error('Ya existe una factura con ese número')
      } else {
        toast.error(error.response?.data?.message || 'Error al crear la factura')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Mostrar loading mientras se crea desde albaranes
  if (isCreatingFromAlbaranes) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Creando factura desde albaranes...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Mostrar loading mientras carga el cliente
  if (isLoadingCliente) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando datos del cliente...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Link href="/facturas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nueva Factura</h1>
            <p className="text-muted-foreground">
              Crear una nueva factura
              {initialData?.clienteNombre && (
                <span className="ml-2 text-primary font-medium">
                  · Cliente: {initialData.clienteNombre}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        <FacturaForm
          initialData={initialData as IFactura | undefined}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
