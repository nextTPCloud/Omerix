"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { clientesService } from '@/services/clientes.service'
import { Cliente } from '@/types/cliente.types'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building,
  User,
} from 'lucide-react'

export default function ClienteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCliente()
  }, [id])

  const loadCliente = async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getById(id)
      setCliente(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar cliente')
      router.push('/clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!cliente) return
    
    if (!confirm(`¿Estás seguro de desactivar al cliente "${cliente.nombre}"?`)) {
      return
    }

    try {
      await clientesService.delete(id)
      toast.success('Cliente desactivado correctamente')
      router.push('/clientes')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar cliente')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!cliente) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cliente no encontrado</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{cliente.nombre}</h1>
                <Badge variant={cliente.activo ? 'success' : 'destructive'}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant={cliente.tipoCliente === 'empresa' ? 'default' : 'secondary'}>
                  {cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
                </Badge>
              </div>
              <p className="text-muted-foreground">Código: {cliente.codigo}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/clientes/${id}/editar`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Desactivar
            </Button>
          </div>
        </div>

        {/* Información Principal */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Datos Básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Datos Básicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">NIF/CIF</p>
                <p className="font-medium">{cliente.nif}</p>
              </div>
              {cliente.nombreComercial && (
                <div>
                  <p className="text-sm text-muted-foreground">Nombre Comercial</p>
                  <p className="font-medium">{cliente.nombreComercial}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cliente.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{cliente.email}</p>
                </div>
              )}
              {cliente.telefono && (
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{cliente.telefono}</p>
                </div>
              )}
              {cliente.movil && (
                <div>
                  <p className="text-sm text-muted-foreground">Móvil</p>
                  <p className="font-medium">{cliente.movil}</p>
                </div>
              )}
              {cliente.web && (
                <div>
                  <p className="text-sm text-muted-foreground">Web</p>
                  <a
                    href={cliente.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {cliente.web}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dirección */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dirección
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {cliente.direccion.calle}
                {cliente.direccion.numero && `, ${cliente.direccion.numero}`}
                {cliente.direccion.piso && `, ${cliente.direccion.piso}`}
              </p>
              <p>
                {cliente.direccion.codigoPostal} {cliente.direccion.ciudad}
              </p>
              <p>{cliente.direccion.provincia}</p>
              <p>{cliente.direccion.pais}</p>
            </CardContent>
          </Card>

          {/* Datos Comerciales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Datos Comerciales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pago</p>
                <p className="font-medium capitalize">{cliente.formaPago}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Días de Pago</p>
                <p className="font-medium">{cliente.diasPago} días</p>
              </div>
              {cliente.descuentoGeneral && (
                <div>
                  <p className="text-sm text-muted-foreground">Descuento General</p>
                  <p className="font-medium">{cliente.descuentoGeneral}%</p>
                </div>
              )}
              {cliente.limiteCredito && (
                <div>
                  <p className="text-sm text-muted-foreground">Límite de Crédito</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(cliente.limiteCredito)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Observaciones */}
        {cliente.observaciones && (
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{cliente.observaciones}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}