"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PedidoForm } from '@/components/pedidos/PedidoForm'
import { pedidosService } from '@/services/pedidos.service'
import { clientesService } from '@/services/clientes.service'
import { CreatePedidoDTO, UpdatePedidoDTO, IPedido, EstadoPedido, Prioridad } from '@/types/pedido.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevoPedidoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCliente, setIsLoadingCliente] = useState(false)
  const [isCreatingFromPresupuesto, setIsCreatingFromPresupuesto] = useState(false)
  const [initialData, setInitialData] = useState<Partial<IPedido> | undefined>(undefined)

  // Leer parámetros de la URL
  const clienteIdFromUrl = searchParams.get('clienteId')
  const presupuestoIdFromUrl = searchParams.get('presupuestoId')

  // Crear desde presupuesto si viene el ID
  useEffect(() => {
    const crearDesdePresupuesto = async () => {
      if (!presupuestoIdFromUrl) return

      try {
        setIsCreatingFromPresupuesto(true)
        const response = await pedidosService.crearDesdePresupuesto(presupuestoIdFromUrl)

        if (response.success && response.data) {
          toast.success('Pedido creado desde presupuesto')
          router.push(`/pedidos/${response.data._id}/editar`)
        }
      } catch (error: any) {
        console.error('Error creando pedido desde presupuesto:', error)
        toast.error(error.response?.data?.message || 'Error al crear el pedido desde presupuesto')
        setIsCreatingFromPresupuesto(false)
      }
    }

    crearDesdePresupuesto()
  }, [presupuestoIdFromUrl, router])

  // Cargar datos del cliente si viene en la URL
  useEffect(() => {
    const loadCliente = async () => {
      if (!clienteIdFromUrl || presupuestoIdFromUrl) return

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
            estado: EstadoPedido.BORRADOR,
            prioridad: Prioridad.MEDIA,
            fecha: new Date().toISOString(),
            lineas: [],
            condiciones: {
              formaPagoId: cliente.formaPagoId,
              terminoPagoId: cliente.terminoPagoId,
              portesPagados: false,
            },
          } as Partial<IPedido>)

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
  }, [clienteIdFromUrl, presupuestoIdFromUrl])

  // Crear pedido
  const handleSubmit = async (data: CreatePedidoDTO | UpdatePedidoDTO) => {
    try {
      setIsSaving(true)
      const response = await pedidosService.create(data as CreatePedidoDTO)

      if (response.success && response.data) {
        toast.success('Pedido creado correctamente')
        router.push(`/pedidos/${response.data._id}`)
      }
    } catch (error: any) {
      console.error('Error al crear pedido:', error)

      if (error.response?.status === 409) {
        toast.error('Ya existe un pedido con ese número')
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el pedido')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Mostrar loading mientras se crea desde presupuesto
  if (isCreatingFromPresupuesto) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Creando pedido desde presupuesto...</p>
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
          <Link href="/pedidos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Pedido</h1>
            <p className="text-muted-foreground">
              Registrar un nuevo pedido de venta en el sistema
              {initialData?.clienteNombre && (
                <span className="ml-2 text-primary font-medium">
                  · Cliente: {initialData.clienteNombre}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        <PedidoForm
          initialData={initialData as IPedido | undefined}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
