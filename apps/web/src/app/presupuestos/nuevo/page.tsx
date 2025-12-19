"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PresupuestoForm } from '@/components/presupuestos/PresupuestoForm'
import { presupuestosService } from '@/services/presupuestos.service'
import { clientesService } from '@/services/clientes.service'
import { CreatePresupuestoDTO, UpdatePresupuestoDTO, IPresupuesto, EstadoPresupuesto } from '@/types/presupuesto.types'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevoPresupuestoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCliente, setIsLoadingCliente] = useState(false)
  const [initialData, setInitialData] = useState<Partial<IPresupuesto> | undefined>(undefined)

  // Leer clienteId de la URL
  const clienteIdFromUrl = searchParams.get('clienteId')

  // Cargar datos del cliente si viene en la URL
  useEffect(() => {
    const loadCliente = async () => {
      if (!clienteIdFromUrl) return

      try {
        setIsLoadingCliente(true)
        const response = await clientesService.getById(clienteIdFromUrl)

        if (response.success && response.data) {
          const cliente = response.data
          // Establecer los datos iniciales con la información del cliente
          setInitialData({
            clienteId: cliente._id,
            clienteNombre: cliente.nombre,
            clienteNif: cliente.nif,
            clienteEmail: cliente.email,
            clienteTelefono: cliente.telefono,
            estado: EstadoPresupuesto.BORRADOR,
            fecha: new Date().toISOString(),
            fechaValidez: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            lineas: [],
            condiciones: {
              formaPagoId: cliente.formaPagoId,
              terminoPagoId: cliente.terminoPagoId,
              validezDias: 30,
              portesPagados: false,
            },
          } as Partial<IPresupuesto>)

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
  }, [clienteIdFromUrl])

  // ============================================
  // CREAR PRESUPUESTO
  // ============================================

  const handleSubmit = async (data: CreatePresupuestoDTO | UpdatePresupuestoDTO) => {
    try {
      setIsSaving(true)
      const response = await presupuestosService.create(data as CreatePresupuestoDTO)

      if (response.success && response.data) {
        toast.success('Presupuesto creado correctamente')
        router.push(`/presupuestos/${response.data._id}`)
      }
    } catch (error: any) {
      console.error('Error al crear presupuesto:', error)

      // Manejo de errores específicos
      if (error.response?.status === 409) {
        toast.error('Ya existe un presupuesto con ese número')
      } else {
        toast.error(error.response?.data?.message || 'Error al crear el presupuesto')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================

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
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}

        <div className="flex items-center gap-4">
          <Link href="/presupuestos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Presupuesto</h1>
            <p className="text-muted-foreground">
              Registrar un nuevo presupuesto en el sistema
              {initialData?.clienteNombre && (
                <span className="ml-2 text-primary font-medium">
                  · Cliente: {initialData.clienteNombre}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* FORMULARIO */}
        {/* ============================================ */}

        <PresupuestoForm
          initialData={initialData as IPresupuesto | undefined}
          onSubmit={handleSubmit}
          isLoading={isSaving}
          mode="create"
        />
      </div>
    </DashboardLayout>
  )
}
