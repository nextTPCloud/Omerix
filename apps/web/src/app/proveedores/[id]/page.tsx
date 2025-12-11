'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { proveedoresService } from '@/services/proveedores.service'
import { Proveedor, TIPOS_PROVEEDOR } from '@/types/proveedor.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Truck,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  User,
  Briefcase,
  Star,
  CreditCard,
  Landmark,
  FileText,
  Clock,
  Calendar,
  Package,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ProveedorDetallePage() {
  const router = useRouter()
  const params = useParams()
  const proveedorId = params.id as string

  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  const handleDelete = async () => {
    try {
      await proveedoresService.delete(proveedorId)
      toast.success('Proveedor eliminado correctamente')
      router.push('/proveedores')
    } catch (error) {
      toast.error('Error al eliminar el proveedor')
    }
  }

  const handleToggleEstado = async () => {
    try {
      const response = await proveedoresService.toggleEstado(proveedorId)
      if (response.success) {
        setProveedor(response.data)
        toast.success(`Proveedor ${response.data.activo ? 'activado' : 'desactivado'}`)
      }
    } catch (error) {
      toast.error('Error al cambiar el estado')
    }
  }

  // Renderizar calificacion con estrellas
  const renderCalificacion = (calificacion?: number) => {
    if (!calificacion) return <span className="text-muted-foreground">Sin calificar</span>
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= calificacion
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">({calificacion}/5)</span>
      </div>
    )
  }

  // Icono segun tipo
  const getTipoIcon = () => {
    switch (proveedor?.tipoProveedor) {
      case 'empresa':
        return <Building2 className="h-5 w-5" />
      case 'autonomo':
        return <Briefcase className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando proveedor...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!proveedor) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-lg font-medium">Proveedor no encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/proveedores">Volver al listado</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/proveedores">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Truck className="h-7 w-7 text-primary" />
                  {proveedor.nombre}
                </h1>
                <Badge variant={proveedor.activo ? 'default' : 'secondary'}>
                  {proveedor.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {proveedor.codigo} | {proveedor.nif}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleToggleEstado}>
              {proveedor.activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/proveedores/${proveedorId}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Contenido Principal */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="direcciones">Direcciones</TabsTrigger>
            <TabsTrigger value="bancarios">Datos Bancarios</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          {/* Tab General */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Datos Basicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTipoIcon()}
                    Datos Basicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Codigo</p>
                      <p className="font-mono font-medium">{proveedor.codigo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">NIF/CIF</p>
                      <p className="font-mono font-medium">{proveedor.nif}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Nombre / Razon Social</p>
                    <p className="font-medium">{proveedor.nombre}</p>
                  </div>

                  {proveedor.nombreComercial && (
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre Comercial</p>
                      <p className="font-medium">{proveedor.nombreComercial}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <Badge variant="outline">
                      {TIPOS_PROVEEDOR.find(t => t.value === proveedor.tipoProveedor)?.label || proveedor.tipoProveedor}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Calificacion</p>
                    {renderCalificacion(proveedor.calificacion)}
                  </div>
                </CardContent>
              </Card>

              {/* Contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proveedor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${proveedor.email}`} className="text-blue-600 hover:underline">
                        {proveedor.email}
                      </a>
                    </div>
                  )}

                  {proveedor.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${proveedor.telefono}`} className="hover:text-primary">
                        {proveedor.telefono}
                      </a>
                    </div>
                  )}

                  {proveedor.movil && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${proveedor.movil}`} className="hover:text-primary">
                        {proveedor.movil} (Movil)
                      </a>
                    </div>
                  )}

                  {proveedor.web && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={proveedor.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {proveedor.web}
                      </a>
                    </div>
                  )}

                  {proveedor.personaContacto?.nombre && (
                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Persona de Contacto</p>
                      <p className="font-medium">{proveedor.personaContacto.nombre}</p>
                      {proveedor.personaContacto.cargo && (
                        <p className="text-sm text-muted-foreground">{proveedor.personaContacto.cargo}</p>
                      )}
                      {proveedor.personaContacto.email && (
                        <p className="text-sm">{proveedor.personaContacto.email}</p>
                      )}
                      {proveedor.personaContacto.telefono && (
                        <p className="text-sm">{proveedor.personaContacto.telefono}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Condiciones Comerciales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Condiciones Comerciales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proveedor.diasPago && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dias de Pago</span>
                      <span className="font-medium">{proveedor.diasPago} dias</span>
                    </div>
                  )}

                  {proveedor.descuentoGeneral !== undefined && proveedor.descuentoGeneral > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Descuento General</span>
                      <span className="font-medium">{proveedor.descuentoGeneral}%</span>
                    </div>
                  )}

                  {proveedor.portesMinimosPedido !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Minimo sin Portes</span>
                      <span className="font-medium">
                        {proveedor.portesMinimosPedido.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  )}

                  {proveedor.portesImporte !== undefined && proveedor.portesImporte > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Importe Portes</span>
                      <span className="font-medium">
                        {proveedor.portesImporte.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Evaluacion */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Evaluacion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proveedor.tiempoEntregaPromedio && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tiempo Entrega Promedio</span>
                      <span className="font-medium">{proveedor.tiempoEntregaPromedio} dias</span>
                    </div>
                  )}

                  {proveedor.fiabilidad !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fiabilidad</span>
                      <span className="font-medium">{proveedor.fiabilidad}%</span>
                    </div>
                  )}

                  {proveedor.certificaciones && proveedor.certificaciones.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2">Certificaciones</p>
                      <div className="flex flex-wrap gap-2">
                        {proveedor.certificaciones.map((cert, idx) => (
                          <Badge key={idx} variant="outline">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {proveedor.totalCompras !== undefined && proveedor.totalCompras > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-muted-foreground">Total Compras</span>
                      <span className="font-bold text-lg">
                        {proveedor.totalCompras.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  )}

                  {proveedor.ultimaCompra && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ultima Compra</span>
                      <span className="font-medium">
                        {new Date(proveedor.ultimaCompra).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tags y Observaciones */}
            {(proveedor.tags?.length || proveedor.observaciones) && (
              <Card>
                <CardHeader>
                  <CardTitle>Informacion Adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proveedor.tags && proveedor.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Etiquetas</p>
                      <div className="flex flex-wrap gap-2">
                        {proveedor.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {proveedor.observaciones && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Observaciones</p>
                      <p className="text-sm whitespace-pre-wrap">{proveedor.observaciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Direcciones */}
          <TabsContent value="direcciones" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Direcciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proveedor.direcciones && proveedor.direcciones.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proveedor.direcciones.map((dir, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={dir.predeterminada ? 'default' : 'outline'}>
                            {dir.tipo}
                          </Badge>
                          {dir.predeterminada && (
                            <Badge variant="secondary">Predeterminada</Badge>
                          )}
                        </div>
                        {dir.nombre && <p className="font-medium">{dir.nombre}</p>}
                        <p>{dir.calle}{dir.numero && `, ${dir.numero}`}</p>
                        <p>{dir.codigoPostal} {dir.ciudad}</p>
                        <p className="text-muted-foreground">{dir.provincia}, {dir.pais}</p>
                        {dir.personaContacto && (
                          <p className="text-sm text-muted-foreground">
                            Contacto: {dir.personaContacto}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay direcciones registradas
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Bancarios */}
          <TabsContent value="bancarios" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Cuentas Bancarias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proveedor.cuentasBancarias && proveedor.cuentasBancarias.length > 0 ? (
                  <div className="space-y-4">
                    {proveedor.cuentasBancarias.map((cuenta, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{cuenta.alias || `Cuenta ${idx + 1}`}</p>
                          {cuenta.predeterminada && (
                            <Badge variant="secondary">Predeterminada</Badge>
                          )}
                        </div>
                        <p className="font-mono">{cuenta.iban}</p>
                        {cuenta.swift && <p className="text-sm">SWIFT: {cuenta.swift}</p>}
                        {cuenta.banco && <p className="text-sm text-muted-foreground">{cuenta.banco}</p>}
                        <p className="text-sm text-muted-foreground">Titular: {cuenta.titular}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay cuentas bancarias registradas
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Documentos */}
          <TabsContent value="documentos" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/compras/pedidos?proveedorId=${proveedorId}`)}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pedidos de Compra</p>
                    <p className="text-sm text-muted-foreground">Ver pedidos</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/compras/albaranes?proveedorId=${proveedorId}`)}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Albaranes de Compra</p>
                    <p className="text-sm text-muted-foreground">Ver albaranes</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/compras/facturas?proveedorId=${proveedorId}`)}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Receipt className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Facturas de Compra</p>
                    <p className="text-sm text-muted-foreground">Ver facturas</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Auditoria */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Creado: {new Date(proveedor.fechaCreacion).toLocaleDateString('es-ES')}</span>
              </div>
              {proveedor.fechaModificacion && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Modificado: {new Date(proveedor.fechaModificacion).toLocaleDateString('es-ES')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog de confirmacion de eliminacion */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. Se eliminara permanentemente el proveedor
                <strong> {proveedor.nombre}</strong> y todos sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
