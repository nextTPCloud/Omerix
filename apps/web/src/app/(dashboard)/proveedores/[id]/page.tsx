'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import { proveedoresService } from '@/services/proveedores.service'
import { Proveedor, TIPOS_PROVEEDOR } from '@/types/proveedor.types'
import { TabDocumentos, TabEstadisticas, TabActividad, TabArchivos } from '@/components/proveedores/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Pencil,
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
  MoreVertical,
  Plus,
  ChevronDown,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  FileUp,
  ExternalLink,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
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

export default function ProveedorDetallePage() {
  const router = useRouter()
  const params = useParams()
  const proveedorId = params.id as string

  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
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

  const handleCreateDocument = (tipo: string) => {
    if (!proveedor) return

    const rutas: Record<string, string> = {
      pedido: `/compras/pedidos/nuevo?proveedorId=${proveedor._id}`,
      albaran: `/compras/albaranes/nuevo?proveedorId=${proveedor._id}`,
      factura: `/compras/facturas/nuevo?proveedorId=${proveedor._id}`,
    }

    if (rutas[tipo]) {
      router.push(rutas[tipo])
    } else {
      toast.info(`Función "${tipo}" en desarrollo`)
    }
  }

  // Renderizar calificación con estrellas
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

  // Icono según tipo
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
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando proveedor...</p>
          </div>
        </div>
      
    )
  }

  if (!proveedor) {
    return (
      
        <div className="text-center py-12">
          <p className="text-muted-foreground">Proveedor no encontrado</p>
        </div>
      
    )
  }

  return (
      <>
      <div className="space-y-6">
        {/* ========================================== */}
        {/* CABECERA CON INFORMACIÓN CLAVE Y ACCIONES */}
        {/* ========================================== */}
        <div className="flex flex-col gap-4">
          {/* Navegación y título con Toolbar */}
          <div className="flex items-start gap-3">
            <Link href="/proveedores">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Título y badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight">{proveedor.nombre}</h1>
                    <Badge variant={proveedor.activo ? 'default' : 'secondary'} className={
                      proveedor.activo
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }>
                      {proveedor.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant="outline">
                      {getTipoIcon()}
                      <span className="ml-1">
                        {TIPOS_PROVEEDOR.find(t => t.value === proveedor.tipoProveedor)?.label || proveedor.tipoProveedor}
                      </span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{proveedor.codigo}</span>
                    <span>•</span>
                    <span className="font-mono">{proveedor.nif}</span>
                  </div>
                </div>

                {/* Toolbar de acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/proveedores/${proveedor._id}/editar`)}
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
                      <DropdownMenuItem onClick={() => handleCreateDocument('pedido')}>
                        <Package className="mr-2 h-4 w-4" />
                        Pedido de Compra
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateDocument('albaran')}>
                        <Truck className="mr-2 h-4 w-4" />
                        Albarán de Compra
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreateDocument('factura')}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Factura de Compra
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
                      <DropdownMenuItem onClick={handleToggleEstado}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {proveedor.activo ? 'Desactivar' : 'Activar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar proveedor
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
                    <p className="text-xs text-muted-foreground font-medium">Total Compras</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {(proveedor.totalCompras || 0).toLocaleString('es-ES', {
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
                    <p className="text-xs text-muted-foreground font-medium">Fiabilidad</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {proveedor.fiabilidad !== undefined ? `${proveedor.fiabilidad}%` : 'Sin datos'}
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
                    <p className="text-xs text-muted-foreground font-medium">Días de Pago</p>
                    <p className="text-lg font-bold">
                      {proveedor.diasPago || 0} días
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Descuento: {proveedor.descuentoGeneral || 0}%
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
                    <p className="text-xs text-muted-foreground font-medium">Calificación</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (proveedor.calificacion || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Star className="h-5 w-5 text-orange-600 dark:text-orange-400" />
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
              {/* Datos Básicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTipoIcon()}
                    Datos Básicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código</p>
                      <p className="text-sm font-mono">{proveedor.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">NIF/CIF</p>
                      <p className="text-sm font-mono">{proveedor.nif}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Razón Social</p>
                    <p className="text-sm">{proveedor.nombre}</p>
                  </div>

                  {proveedor.nombreComercial && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nombre Comercial</p>
                      <p className="text-sm">{proveedor.nombreComercial}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Calificación</p>
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
                      <a href={`mailto:${proveedor.email}`} className="text-sm text-blue-600 hover:underline">
                        {proveedor.email}
                      </a>
                    </div>
                  )}

                  {proveedor.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${proveedor.telefono}`} className="text-sm hover:text-primary">
                        {proveedor.telefono}
                      </a>
                    </div>
                  )}

                  {proveedor.movil && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${proveedor.movil}`} className="text-sm hover:text-primary">
                        {proveedor.movil} <span className="text-muted-foreground">(Móvil)</span>
                      </a>
                    </div>
                  )}

                  {proveedor.web && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={proveedor.web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {proveedor.web}
                      </a>
                    </div>
                  )}

                  {proveedor.personaContacto?.nombre && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Persona de Contacto</p>
                        <div className="space-y-2 pl-2 border-l-2 border-muted">
                          <p className="text-sm">
                            <span className="font-medium">{proveedor.personaContacto.nombre}</span>
                            {proveedor.personaContacto.cargo && (
                              <span className="text-muted-foreground"> - {proveedor.personaContacto.cargo}</span>
                            )}
                          </p>
                          {proveedor.personaContacto.telefono && (
                            <p className="text-sm text-muted-foreground">
                              Tel: {proveedor.personaContacto.telefono}
                            </p>
                          )}
                          {proveedor.personaContacto.email && (
                            <p className="text-sm text-blue-600">
                              {proveedor.personaContacto.email}
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
                    {proveedor.direcciones && proveedor.direcciones.length > 0 && (
                      <Badge variant="secondary">{proveedor.direcciones.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proveedor.direcciones && proveedor.direcciones.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {proveedor.direcciones.map((dir, idx) => (
                        <div
                          key={idx}
                          className={`p-4 border rounded-lg ${dir.predeterminada ? 'border-primary bg-primary/5' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{dir.nombre || dir.tipo}</span>
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
                                const address = `${dir.calle}${dir.numero ? ' ' + dir.numero : ''}, ${dir.codigoPostal} ${dir.ciudad}, ${dir.provincia}, ${dir.pais}`
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                                  '_blank'
                                )
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p>{dir.calle}{dir.numero && `, ${dir.numero}`}</p>
                            <p>{dir.codigoPostal} {dir.ciudad}</p>
                            <p className="text-muted-foreground">{dir.provincia}, {dir.pais}</p>
                            {dir.personaContacto && (
                              <p className="text-muted-foreground pt-1">
                                Contacto: {dir.personaContacto}
                                {dir.telefonoContacto && ` - ${dir.telefonoContacto}`}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="mt-2 text-xs">{dir.tipo}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay direcciones registradas
                    </p>
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
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Días de Pago</p>
                      <p className="text-sm">{proveedor.diasPago || 0} días</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descuento General</p>
                      <p className="text-sm">{proveedor.descuentoGeneral || 0}%</p>
                    </div>
                  </div>

                  {proveedor.portesMinimosPedido !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Mínimo sin Portes</p>
                      <p className="text-sm font-bold">
                        {proveedor.portesMinimosPedido.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  )}

                  {proveedor.portesImporte !== undefined && proveedor.portesImporte > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Importe Portes</p>
                      <p className="text-sm">
                        {proveedor.portesImporte.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {proveedor.tiempoEntregaPromedio && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tiempo Entrega Promedio</span>
                      <span className="text-sm font-medium">{proveedor.tiempoEntregaPromedio} días</span>
                    </div>
                  )}

                  {proveedor.ultimaCompra && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Última Compra</span>
                      <span className="text-sm font-medium">
                        {new Date(proveedor.ultimaCompra).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cuentas Bancarias */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    Cuentas Bancarias
                    {proveedor.cuentasBancarias && proveedor.cuentasBancarias.length > 0 && (
                      <Badge variant="secondary">{proveedor.cuentasBancarias.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proveedor.cuentasBancarias && proveedor.cuentasBancarias.length > 0 ? (
                    <div className="space-y-4">
                      {proveedor.cuentasBancarias.map((cuenta, idx) => {
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
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay cuentas bancarias registradas
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Certificaciones y Tags */}
              {(proveedor.certificaciones?.length || proveedor.tags?.length || proveedor.observaciones) && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Información Adicional</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {proveedor.certificaciones && proveedor.certificaciones.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Certificaciones</p>
                        <div className="flex flex-wrap gap-2">
                          {proveedor.certificaciones.map((cert, idx) => (
                            <Badge key={idx} variant="outline">{cert}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {proveedor.tags && proveedor.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Etiquetas</p>
                        <div className="flex flex-wrap gap-2">
                          {proveedor.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {proveedor.observaciones && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Observaciones</p>
                        <p className="text-sm whitespace-pre-wrap">{proveedor.observaciones}</p>
                      </div>
                    )}
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
                      {new Date(proveedor.fechaCreacion).toLocaleString('es-ES')}
                    </p>
                  </div>
                  {proveedor.fechaModificacion && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última Actualización</p>
                      <p className="text-sm">
                        {new Date(proveedor.fechaModificacion).toLocaleString('es-ES')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID del Sistema</p>
                    <p className="text-xs font-mono text-muted-foreground">{proveedor._id}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* PESTAÑA: DOCUMENTOS */}
          {/* ========================================== */}
          <TabsContent value="documentos" className="mt-4">
            <TabDocumentos proveedorId={proveedor._id} proveedorNombre={proveedor.nombre} />
          </TabsContent>

          {/* ========================================== */}
          {/* PESTAÑA: ACTIVIDAD */}
          {/* ========================================== */}
          <TabsContent value="actividad" className="mt-4">
            <TabActividad proveedorId={proveedor._id} proveedorNombre={proveedor.nombre} />
          </TabsContent>

          {/* ========================================== */}
          {/* PESTAÑA: ESTADÍSTICAS */}
          {/* ========================================== */}
          <TabsContent value="estadisticas" className="mt-4">
            <TabEstadisticas proveedorId={proveedor._id} proveedorNombre={proveedor.nombre} />
          </TabsContent>

          {/* ========================================== */}
          {/* PESTAÑA: ARCHIVOS */}
          {/* ========================================== */}
          <TabsContent value="archivos" className="mt-4">
            <TabArchivos proveedorId={proveedor._id} proveedorNombre={proveedor.nombre} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo de confirmación para eliminar proveedor */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor
              <span className="font-semibold"> {proveedor.nombre}</span> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar proveedor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
  )
}
