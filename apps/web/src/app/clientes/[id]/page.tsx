'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Building2,
  User,
  Globe,
  AlertCircle,
  TrendingUp,
  Package,
  FileText,
  Truck,
  Receipt,
  Wrench,
  Calendar,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Clock,
  Tags,
  FileUp,
  Download,
  MoreHorizontal,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Users,
  Target,
  Plus,
  ChevronDown,
  Landmark,
  Home,
  Factory,
  HardHat,
  ExternalLink,
  Star,
  Copy,
} from 'lucide-react'
import { TIPOS_DIRECCION, TIPOS_MANDATO_SEPA } from '@/types/cliente.types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
    if (!cliente) return

    try {
      await clientesService.delete(cliente._id)
      toast.success('Cliente desactivado correctamente')
      router.push('/clientes')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar cliente')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const handleCreateDocument = (tipo: string) => {
    if (!cliente) return

    const rutas: Record<string, string> = {
      presupuesto: `/presupuestos/nuevo?clienteId=${cliente._id}`,
      pedido: `/pedidos/nuevo?clienteId=${cliente._id}`,
      albaran: `/albaranes/nuevo?clienteId=${cliente._id}`,
      factura: `/facturas/nuevo?clienteId=${cliente._id}`,
      parte: `/partes/nuevo?clienteId=${cliente._id}`,
    }

    if (rutas[tipo]) {
      router.push(rutas[tipo])
    } else {
      toast.info(`Función "${tipo}" en desarrollo`)
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

  // Calcular crédito disponible
  const creditoDisponible = cliente.limiteCredito
    ? Math.max(0, cliente.limiteCredito - (cliente.riesgoActual || 0))
    : null

  const excedeCredito = cliente.limiteCredito
    ? (cliente.riesgoActual || 0) > cliente.limiteCredito
    : false

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ========================================== */}
        {/* CABECERA CON INFORMACIÓN CLAVE Y ACCIONES */}
        {/* ========================================== */}
        <div className="flex flex-col gap-4">
          {/* Navegación y título con Toolbar */}
          <div className="flex items-start gap-3">
            <Link href="/clientes">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Título y badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight">{cliente.nombre}</h1>
                    <Badge variant={cliente.activo ? 'default' : 'secondary'} className={
                      cliente.activo
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant={cliente.tipoCliente === 'empresa' ? 'default' : 'secondary'}>
                      {cliente.tipoCliente === 'empresa' ? (
                        <><Building2 className="mr-1 h-3 w-3" />Empresa</>
                      ) : (
                        <><User className="mr-1 h-3 w-3" />Particular</>
                      )}
                    </Badge>
                    {excedeCredito && (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Excede crédito
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{cliente.codigo}</span>
                    <span>•</span>
                    <span className="font-mono">{cliente.nif}</span>
                  </div>
                </div>

                {/* Toolbar de acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/clientes/${cliente._id}/editar`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  <Separator orientation="vertical" className="h-8" />

                  {/* Dropdown: Nuevo Documento */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Documento
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Crear documento</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleCreateDocument('presupuesto')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Presupuesto
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateDocument('pedido')}>
                        <Package className="mr-2 h-4 w-4" />
                        Pedido
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateDocument('albaran')}>
                        <Truck className="mr-2 h-4 w-4" />
                        Albarán
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateDocument('factura')}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Factura
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateDocument('parte')}>
                        <Wrench className="mr-2 h-4 w-4" />
                        Parte de Trabajo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Separator orientation="vertical" className="h-8" />

                  {/* Dropdown: Más acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toast.info('Exportar a PDF - En desarrollo')}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar a PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info('Enviar email - En desarrollo')}>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Desactivar cliente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Riesgo Actual</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {(cliente.riesgoActual || 0).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Crédito Disponible</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {creditoDisponible !== null ? (
                        creditoDisponible.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })
                      ) : (
                        'Sin límite'
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Forma de Pago</p>
                    <p className="text-lg font-bold capitalize">
                      {cliente.formaPago}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cliente.diasPago} días
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Descuento</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {cliente.descuentoGeneral ? `${cliente.descuentoGeneral}%` : 'Sin descuento'}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ========================================== */}
        {/* PESTAÑAS DE CONTENIDO */}
        {/* ========================================== */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
            <TabsTrigger value="general" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="actividad" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Actividad</span>
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger value="archivos" className="gap-2">
              <FileUp className="h-4 w-4" />
              <span className="hidden sm:inline">Archivos</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================== */}
          {/* PESTAÑA: INFORMACIÓN GENERAL */}
          {/* ========================================== */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código</p>
                      <p className="text-sm font-mono">{cliente.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">NIF/CIF</p>
                      <p className="text-sm font-mono">{cliente.nif}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
                    <p className="text-sm">{cliente.nombre}</p>
                  </div>

                  {cliente.nombreComercial && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nombre Comercial</p>
                      <p className="text-sm">{cliente.nombreComercial}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                      <Badge variant="outline" className="mt-1">
                        {cliente.tipoCliente === 'empresa' ? 'Empresa' : 'Particular'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <Badge variant="outline" className="mt-1">
                        {cliente.activo ? (
                          <><CheckCircle2 className="mr-1 h-3 w-3 text-green-600" />Activo</>
                        ) : (
                          <><XCircle className="mr-1 h-3 w-3 text-red-600" />Inactivo</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Datos de Contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contacto
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
                      <a href={`tel:${cliente.telefono}`} className="text-sm hover:text-primary">
                        {cliente.telefono}
                      </a>
                    </div>
                  )}

                  {cliente.movil && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${cliente.movil}`} className="text-sm hover:text-primary">
                        {cliente.movil} <span className="text-muted-foreground">(Móvil)</span>
                      </a>
                    </div>
                  )}

                  {cliente.web && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={cliente.web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {cliente.web}
                      </a>
                    </div>
                  )}

                  {cliente.personaContacto && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Persona de Contacto</p>
                        <div className="space-y-2 pl-2 border-l-2 border-muted">
                          <p className="text-sm">
                            <span className="font-medium">{cliente.personaContacto.nombre}</span>
                            {cliente.personaContacto.cargo && (
                              <span className="text-muted-foreground"> - {cliente.personaContacto.cargo}</span>
                            )}
                          </p>
                          {cliente.personaContacto.telefono && (
                            <p className="text-sm text-muted-foreground">
                              Tel: {cliente.personaContacto.telefono}
                            </p>
                          )}
                          {cliente.personaContacto.email && (
                            <p className="text-sm text-blue-600">
                              {cliente.personaContacto.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Direcciones */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Direcciones
                    {cliente.direcciones && cliente.direcciones.length > 0 && (
                      <Badge variant="secondary">{cliente.direcciones.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cliente.direcciones && cliente.direcciones.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {cliente.direcciones.map((dir, idx) => {
                        const tipoInfo = TIPOS_DIRECCION.find(t => t.value === dir.tipo)
                        const TipoIcon = dir.tipo === 'fiscal' ? Building2
                          : dir.tipo === 'envio' ? Truck
                          : dir.tipo === 'almacen' ? Factory
                          : dir.tipo === 'obra' ? HardHat
                          : Home

                        return (
                          <div
                            key={idx}
                            className={`p-4 border rounded-lg ${dir.predeterminada ? 'border-primary bg-primary/5' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <TipoIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{dir.nombre || tipoInfo?.label || 'Direccion'}</span>
                                {dir.predeterminada && (
                                  <Badge variant="default" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  if (dir.latitud && dir.longitud) {
                                    window.open(
                                      `https://www.google.com/maps?q=${dir.latitud},${dir.longitud}`,
                                      '_blank'
                                    )
                                  } else {
                                    const address = `${dir.calle}${dir.numero ? ' ' + dir.numero : ''}, ${dir.codigoPostal} ${dir.ciudad}, ${dir.provincia}, ${dir.pais}`
                                    window.open(
                                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                                      '_blank'
                                    )
                                  }
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p>
                                {dir.calle}
                                {dir.numero && `, ${dir.numero}`}
                                {dir.piso && `, ${dir.piso}`}
                              </p>
                              <p>
                                {dir.codigoPostal} {dir.ciudad}
                              </p>
                              <p className="text-muted-foreground">
                                {dir.provincia}, {dir.pais}
                              </p>
                              {dir.personaContacto && (
                                <p className="text-muted-foreground pt-1">
                                  Contacto: {dir.personaContacto}
                                  {dir.telefonoContacto && ` - ${dir.telefonoContacto}`}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {tipoInfo?.label || dir.tipo}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  ) : cliente.direccion ? (
                    // Compatibilidad con direccion legacy
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Direccion Principal</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const direccion = cliente.direccion
                            if (!direccion) return
                            if (direccion.latitud && direccion.longitud) {
                              window.open(
                                `https://www.google.com/maps?q=${direccion.latitud},${direccion.longitud}`,
                                '_blank'
                              )
                            } else {
                              const address = `${direccion.calle || ''}${direccion.numero ? ' ' + direccion.numero : ''}, ${direccion.codigoPostal || ''} ${direccion.ciudad || ''}, ${direccion.provincia || ''}, ${direccion.pais || ''}`
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                                '_blank'
                              )
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          {cliente.direccion.calle}
                          {cliente.direccion.numero && `, ${cliente.direccion.numero}`}
                          {cliente.direccion.piso && `, ${cliente.direccion.piso}`}
                        </p>
                        <p>
                          {cliente.direccion.codigoPostal} {cliente.direccion.ciudad}
                        </p>
                        <p className="text-muted-foreground">
                          {cliente.direccion.provincia}, {cliente.direccion.pais}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay direcciones registradas
                    </p>
                  )}
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

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Límite de Crédito</p>
                      <p className="text-sm font-bold">
                        {cliente.limiteCredito
                          ? cliente.limiteCredito.toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            })
                          : 'Sin límite'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Riesgo Actual</p>
                      <p className={`text-sm font-bold ${excedeCredito ? 'text-red-600' : 'text-green-600'}`}>
                        {(cliente.riesgoActual || 0).toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                  </div>

                  {creditoDisponible !== null && (
                    <div className={`p-3 rounded-lg ${excedeCredito ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Crédito Disponible</p>
                      <p className={`text-lg font-bold ${excedeCredito ? 'text-red-600' : 'text-green-600'}`}>
                        {creditoDisponible.toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cuentas Bancarias */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    Cuentas Bancarias
                    {cliente.cuentasBancarias && cliente.cuentasBancarias.length > 0 && (
                      <Badge variant="secondary">{cliente.cuentasBancarias.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cliente.cuentasBancarias && cliente.cuentasBancarias.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {cliente.cuentasBancarias.map((cuenta, idx) => {
                        const mandatoInfo = cuenta.mandatoSEPA?.tipoMandato
                          ? TIPOS_MANDATO_SEPA.find(t => t.value === cuenta.mandatoSEPA?.tipoMandato)
                          : null

                        // Formatear IBAN para mostrar
                        const ibanFormateado = cuenta.iban?.replace(/(.{4})/g, '$1 ').trim()

                        return (
                          <div
                            key={idx}
                            className={`p-4 border rounded-lg ${cuenta.predeterminada ? 'border-primary bg-primary/5' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{cuenta.banco || cuenta.alias || 'Cuenta bancaria'}</span>
                                {cuenta.predeterminada && (
                                  <Badge variant="default" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Principal
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  navigator.clipboard.writeText(cuenta.iban)
                                  toast.success('IBAN copiado al portapapeles')
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">IBAN</p>
                                <p className="font-mono">{ibanFormateado}</p>
                              </div>
                              {cuenta.swift && (
                                <div>
                                  <p className="text-xs text-muted-foreground">SWIFT/BIC</p>
                                  <p className="font-mono">{cuenta.swift}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground">Titular</p>
                                <p>{cuenta.titular}</p>
                              </div>
                              {cuenta.mandatoSEPA && cuenta.mandatoSEPA.referencia && (
                                <div className="pt-2 border-t">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CreditCard className="h-3 w-3" />
                                    <span className="text-xs font-medium">Mandato SEPA</span>
                                    {cuenta.mandatoSEPA.firmado && (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                        Firmado
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Ref: {cuenta.mandatoSEPA.referencia}
                                    {mandatoInfo && ` - ${mandatoInfo.label}`}
                                  </p>
                                  {cuenta.mandatoSEPA.fechaFirma && (
                                    <p className="text-xs text-muted-foreground">
                                      Firmado: {new Date(cuenta.mandatoSEPA.fechaFirma).toLocaleDateString('es-ES')}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : cliente.iban ? (
                    // Compatibilidad con IBAN legacy
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Cuenta bancaria</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            navigator.clipboard.writeText(cliente.iban || '')
                            toast.success('IBAN copiado al portapapeles')
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">IBAN</p>
                          <p className="font-mono">{cliente.iban?.replace(/(.{4})/g, '$1 ').trim()}</p>
                        </div>
                        {cliente.swift && (
                          <div>
                            <p className="text-xs text-muted-foreground">SWIFT/BIC</p>
                            <p className="font-mono">{cliente.swift}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay cuentas bancarias registradas
                    </p>
                  )}
                </CardContent>
              </Card>

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
                    <CardTitle className="flex items-center gap-2">
                      <Tags className="h-5 w-5" />
                      Etiquetas
                    </CardTitle>
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

              {/* Información del Sistema */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Información del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
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
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID del Sistema</p>
                    <p className="text-xs font-mono text-muted-foreground">{cliente._id}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* PESTAÑA: DOCUMENTOS */}
          {/* ========================================== */}
          <TabsContent value="documentos" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Presupuestos */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={() => toast.info('Endpoint de presupuestos en desarrollo')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <CardTitle className="text-lg">Presupuestos</CardTitle>
                  <CardDescription>Ver todos los presupuestos</CardDescription>
                </CardHeader>
              </Card>

              {/* Pedidos */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500" onClick={() => toast.info('Endpoint de pedidos en desarrollo')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Package className="h-8 w-8 text-green-600" />
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <CardTitle className="text-lg">Pedidos</CardTitle>
                  <CardDescription>Ver todos los pedidos</CardDescription>
                </CardHeader>
              </Card>

              {/* Albaranes */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500" onClick={() => toast.info('Endpoint de albaranes en desarrollo')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Truck className="h-8 w-8 text-purple-600" />
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <CardTitle className="text-lg">Albaranes</CardTitle>
                  <CardDescription>Ver todos los albaranes</CardDescription>
                </CardHeader>
              </Card>

              {/* Facturas */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500" onClick={() => toast.info('Endpoint de facturas en desarrollo')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Receipt className="h-8 w-8 text-orange-600" />
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <CardTitle className="text-lg">Facturas</CardTitle>
                  <CardDescription>Ver todas las facturas</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Placeholder cuando no hay documentos */}
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-semibold mb-2">Documentos en desarrollo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Los endpoints de documentos están en desarrollo. Pronto podrás ver todos los documentos de este cliente.
                </p>
                <Button variant="outline" onClick={() => setActiveTab('general')}>
                  Volver a información general
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================== */}
          {/* PESTAÑA: ACTIVIDAD */}
          {/* ========================================== */}
          <TabsContent value="actividad" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Actividad</CardTitle>
                <CardDescription>Últimas interacciones y movimientos con este cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-semibold mb-2">Historial en desarrollo</h3>
                  <p className="text-sm text-muted-foreground">
                    El sistema de seguimiento de actividad estará disponible próximamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================== */}
          {/* PESTAÑA: ESTADÍSTICAS */}
          {/* ========================================== */}
          <TabsContent value="estadisticas" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Ventas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Resumen de Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">
                      Estadísticas de ventas en desarrollo
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Productos más vendidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Productos Más Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">
                      Análisis de productos en desarrollo
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* PESTAÑA: ARCHIVOS */}
          {/* ========================================== */}
          <TabsContent value="archivos" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Archivos y Documentos</CardTitle>
                <CardDescription>Documentos adjuntos relacionados con este cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-semibold mb-2">Gestión de archivos en desarrollo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pronto podrás subir y gestionar documentos relacionados con este cliente
                  </p>
                  <Button variant="outline" disabled>
                    <FileUp className="mr-2 h-4 w-4" />
                    Subir archivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo de confirmación para desactivar cliente */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de desactivar al cliente <span className="font-semibold">{cliente.nombre}</span>.
              Esta acción no eliminará el cliente de forma permanente, pero lo marcará como inactivo
              y no aparecerá en las búsquedas por defecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desactivar cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}