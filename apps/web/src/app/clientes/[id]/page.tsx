"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { clientesService } from '@/services/clientes.service'
import { Cliente } from '@/types/cliente.types'
import { toast } from 'sonner'
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCliente()
  }, [params.id])

  const loadCliente = async () => {
    try {
      setIsLoading(true)
      const response = await clientesService.getById(params.id as string)
      setCliente(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar cliente')
      router.push('/clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!cliente || !confirm(`¿Estás seguro de desactivar al cliente "${cliente.nombre}"?`)) {
      return
    }

    try {
      await clientesService.delete(cliente._id)
      toast.success('Cliente desactivado correctamente')
      router.push('/clientes')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar cliente')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando cliente...</p>
          </div>
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
            <Link href="/clientes">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{cliente.nombre}</h1>
              <p className="text-muted-foreground">{cliente.nif}</p>
            </div>
            <Badge variant={cliente.activo ? 'success' : 'destructive'}>
              {cliente.activo ? 'Activo' : 'Inactivo'}
            </Badge>
            <Badge variant={cliente.tipoCliente === 'empresa' ? 'default' : 'secondary'}>
              {cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/clientes/${cliente._id}/editar`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Desactivar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cliente.nombreComercial && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Comercial</p>
                  <p className="text-sm">{cliente.nombreComercial}</p>
                </div>
              )}
              {cliente.codigo && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Código</p>
                  <p className="text-sm">{cliente.codigo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Datos de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cliente.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${cliente.email}`} className="text-sm text-blue-600 hover:underline">
                    {cliente.email}
                  </a>
                </div>
              )}
              {cliente.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${cliente.telefono}`} className="text-sm">
                    {cliente.telefono}
                  </a>
                </div>
              )}
              {cliente.movil && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${cliente.movil}`} className="text-sm">
                    {cliente.movil} (Móvil)
                  </a>
                </div>
              )}
              {cliente.web && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌐</span>
                  <a
                    href={cliente.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {cliente.web}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dirección Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dirección Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {cliente.direccion.calle}
                {cliente.direccion.numero && `, ${cliente.direccion.numero}`}
                {cliente.direccion.piso && `, ${cliente.direccion.piso}`}
                <br />
                {cliente.direccion.codigoPostal} {cliente.direccion.ciudad}
                <br />
                {cliente.direccion.provincia}, {cliente.direccion.pais}
              </p>
            </CardContent>
          </Card>

          {/* Dirección de Envío */}
          {cliente.direccionEnvio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección de Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {cliente.direccionEnvio.calle}
                  {cliente.direccionEnvio.numero && `, ${cliente.direccionEnvio.numero}`}
                  {cliente.direccionEnvio.piso && `, ${cliente.direccionEnvio.piso}`}
                  <br />
                  {cliente.direccionEnvio.codigoPostal} {cliente.direccionEnvio.ciudad}
                  <br />
                  {cliente.direccionEnvio.provincia}, {cliente.direccionEnvio.pais}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Datos Comerciales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Datos Comerciales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Forma de Pago</p>
                  <p className="text-sm capitalize">{cliente.formaPago}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Días de Pago</p>
                  <p className="text-sm">{cliente.diasPago} días</p>
                </div>
              </div>

              {cliente.descuentoGeneral && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Descuento General</p>
                  <p className="text-sm">{cliente.descuentoGeneral}%</p>
                </div>
              )}

              {cliente.limiteCredito && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Límite de Crédito</p>
                  <p className="text-sm">{cliente.limiteCredito.toLocaleString('es-ES')} €</p>
                </div>
              )}

              {cliente.riesgoActual !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Riesgo Actual</p>
                  <p className="text-sm">{cliente.riesgoActual.toLocaleString('es-ES')} €</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos Bancarios */}
          {(cliente.iban || cliente.swift) && (
            <Card>
              <CardHeader>
                <CardTitle>Datos Bancarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cliente.iban && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IBAN</p>
                    <p className="text-sm font-mono">{cliente.iban}</p>
                  </div>
                )}
                {cliente.swift && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SWIFT/BIC</p>
                    <p className="text-sm font-mono">{cliente.swift}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observaciones */}
          {cliente.observaciones && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{cliente.observaciones}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {cliente.tags && cliente.tags.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Etiquetas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cliente.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Metadatos */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
              <p className="text-sm">
                {new Date(cliente.createdAt).toLocaleString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
              <p className="text-sm">
                {new Date(cliente.updatedAt).toLocaleString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}