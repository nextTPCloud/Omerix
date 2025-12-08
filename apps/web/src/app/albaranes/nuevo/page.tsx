"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { AlbaranForm } from '@/components/albaranes/AlbaranForm'
import { albaranesService } from '@/services/albaranes.service'
import { clientesService } from '@/services/clientes.service'
import { CreateAlbaranDTO, UpdateAlbaranDTO, IAlbaran, EstadoAlbaran, TipoAlbaran } from '@/types/albaran.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevoAlbaranPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCliente, setIsLoadingCliente] = useState(false)
  const [isCreatingFromPedido, setIsCreatingFromPedido] = useState(false)
  const [initialData, setInitialData] = useState<Partial<IAlbaran> | undefined>(undefined)

  // Leer parámetros de la URL
  const clienteIdFromUrl = searchParams.get('clienteId')
  const pedidoIdFromUrl = searchParams.get('pedidoId')

  // Crear desde pedido si viene el ID
  useEffect(() => {
    const crearDesdePedido = async () => {
      if (!pedidoIdFromUrl) return

      try {
        setIsCreatingFromPedido(true)
        const response = await albaranesService.crearDesdePedido(pedidoIdFromUrl, {
          entregarTodo: false,
        })

        if (response.success && response.data) {
          toast.success('Albarán creado desde pedido')
          router.push(`/albaranes/${response.data._id}/editar`)
        }
      } catch (error: any) {
        console.error('Error creando albarán desde pedido:', error)
        toast.error(error.response?.data?.message || 'Error al crear el albarán desde pedido')
        setIsCreatingFromPedido(false)
      }
    }

    crearDesdePedido()
  }, [pedidoIdFromUrl, router])

  // Cargar datos del cliente si viene en la URL
  useEffect(() => {
    const loadCliente = async () => {
      if (!clienteIdFromUrl || pedidoIdFromUrl) return

      try {
        setIsLoadingCliente(true)
        const response = await clientesService.getById(clienteIdFromUrl)

        if (response.success && response.data) {
          const cliente = response.data
          setInitialData({
            clienteId: cliente._id,
            clienteNombre: cliente.nombre,
            clienteNif: cliente.nif,
            clienteEmail: cliente.email,
            clienteTelefono: cliente.telefono,
            tipo: TipoAlbaran.VENTA,
            estado: EstadoAlbaran.BORRADOR,
            fecha: new Date().toISOString(),
            lineas: [],
            datosTransporte: {
              portesPagados: false,
            },
          } as Partial<IAlbaran>)

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
  }, [clienteIdFromUrl, pedidoIdFromUrl])

  // Crear albarán
  const handleSubmit = async (data: CreateAlbaranDTO | UpdateAlbaranDTO) => {
    try {
      setIsSaving(true)
      const response = await albaranesService.create(data as CreateAlbaranDTO)

      if (response.success && response.data) {
        toast.success('Albarán creado correctamente')
        router.push(`/albaranes/${response.data._id}`)
      }
    } catch (error: any) {
      console.error('Error al crear albarán:', error)

      if (error.response?.status === 409) {
        toast.error('Ya existe un albarán con ese número')
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el albarán')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Mostrar loading mientras se crea desde pedido
  if (isCreatingFromPedido) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Creando albarán desde pedido...</p>
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
          <Link href="/albaranes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Albarán</h1>
            <p className="text-muted-foreground">
              Crear un nuevo albarán de entrega
              {initialData?.clienteNombre && (
                <span className="ml-2 text-primary font-medium">
                  · Cliente: {initialData.clienteNombre}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        <AlbaranForm
          initialData={initialData as IAlbaran | undefined}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
