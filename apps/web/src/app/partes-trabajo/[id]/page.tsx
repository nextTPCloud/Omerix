'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { partesTrabajoService } from '@/services/partes-trabajo.service'
import {
  ParteTrabajo,
  getEstadoParteColor,
  getEstadoParteLabel,
  getPrioridadColor,
  getPrioridadLabel,
  getTipoParteLabel,
  getTipoUnidadAbbr,
  EstadoParteTrabajo,
} from '@/types/parte-trabajo.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  Wrench,
  Calendar,
  Building2,
  FolderKanban,
  User,
  MapPin,
  Copy,
  Printer,
  Play,
  Pause,
  CheckCircle2,
  Ban,
  Receipt,
  Users,
  Package,
  Truck as TruckIcon,
  Wallet,
  Clock,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ParteTrabajoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [parte, setParte] = useState<ParteTrabajo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [generarAlbaranDialogOpen, setGenerarAlbaranDialogOpen] = useState(false)
  const [isGenerandoAlbaran, setIsGenerandoAlbaran] = useState(false)

  const cargarParte = async () => {
    try {
      setIsLoading(true)
      const response = await partesTrabajoService.getById(id)
      if (response.success && response.data) {
        setParte(response.data)
      } else {
        toast.error('Parte de trabajo no encontrado')
        router.push('/partes-trabajo')
      }
    } catch (error) {
      console.error('Error cargando parte:', error)
      toast.error('Error al cargar el parte de trabajo')
      router.push('/partes-trabajo')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) cargarParte()
  }, [id])

  const handleDelete = async () => {
    try {
      const response = await partesTrabajoService.delete(id)
      if (response.success) {
        toast.success('Parte de trabajo eliminado')
        router.push('/partes-trabajo')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar')
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleCambiarEstado = async (estado: EstadoParteTrabajo) => {
    try {
      const response = await partesTrabajoService.cambiarEstado(id, { estado })
      if (response.success) {
        toast.success(`Estado cambiado a ${getEstadoParteLabel(estado)}`)
        cargarParte()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar estado')
    }
  }

  const handleDuplicar = async () => {
    try {
      const response = await partesTrabajoService.duplicar(id)
      if (response.success && response.data) {
        toast.success('Parte de trabajo duplicado')
        router.push(`/partes-trabajo/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al duplicar')
    }
  }

  const handleGenerarAlbaran = async () => {
    try {
      setIsGenerandoAlbaran(true)
      const response = await partesTrabajoService.generarAlbaran(id, {
        incluirPersonal: true,
        incluirMaterial: true,
        incluirMaquinaria: true,
        incluirTransporte: true,
        incluirGastos: true,
        soloFacturables: true,
      })
      if (response.success && response.data) {
        toast.success('Albaran generado correctamente')
        router.push(`/albaranes/${response.data._id}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al generar albaran')
    } finally {
      setIsGenerandoAlbaran(false)
      setGenerarAlbaranDialogOpen(false)
    }
  }

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando parte de trabajo...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!parte) {
    return null
  }

  const estadoColor = getEstadoParteColor(parte.estado)
  const prioridadColor = getPrioridadColor(parte.prioridad)

  return (
    <DashboardLayout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/partes-trabajo">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">{parte.codigo}</h1>
                <Badge
                  variant="outline"
                  className={
                    estadoColor === 'green' ? 'border-green-500 text-green-500 bg-green-50' :
                    estadoColor === 'yellow' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                    estadoColor === 'blue' ? 'border-blue-500 text-blue-500 bg-blue-50' :
                    estadoColor === 'orange' ? 'border-orange-500 text-orange-500 bg-orange-50' :
                    estadoColor === 'purple' ? 'border-purple-500 text-purple-500 bg-purple-50' :
                    estadoColor === 'red' ? 'border-red-500 text-red-500 bg-red-50' :
                    'border-gray-500 text-gray-500 bg-gray-50'
                  }
                >
                  {getEstadoParteLabel(parte.estado)}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    prioridadColor === 'red' ? 'border-red-500 text-red-500' :
                    prioridadColor === 'orange' ? 'border-orange-500 text-orange-500' :
                    prioridadColor === 'blue' ? 'border-blue-500 text-blue-500' :
                    'border-gray-500 text-gray-500'
                  }
                >
                  {getPrioridadLabel(parte.prioridad)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {parte.titulo || getTipoParteLabel(parte.tipo)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/partes-trabajo/${id}/imprimir`}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/partes-trabajo/${id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            {parte.estado === 'completado' && (
              <Button size="sm" onClick={() => setGenerarAlbaranDialogOpen(true)}>
                <Receipt className="h-4 w-4 mr-2" />
                Generar Albaran
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDuplicar}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Cambiar estado</DropdownMenuLabel>
                {parte.estado === 'borrador' && (
                  <DropdownMenuItem onClick={() => handleCambiarEstado('en_curso')}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar
                  </DropdownMenuItem>
                )}
                {parte.estado === 'en_curso' && (
                  <>
                    <DropdownMenuItem onClick={() => handleCambiarEstado('pausado')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCambiarEstado('completado')}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Completar
                    </DropdownMenuItem>
                  </>
                )}
                {parte.estado === 'pausado' && (
                  <DropdownMenuItem onClick={() => handleCambiarEstado('en_curso')}>
                    <Play className="h-4 w-4 mr-2" />
                    Reanudar
                  </DropdownMenuItem>
                )}
                {['borrador', 'planificado', 'en_curso', 'pausado'].includes(parte.estado) && (
                  <DropdownMenuItem
                    onClick={() => handleCambiarEstado('anulado')}
                    className="text-red-600"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Anular
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Informacion general */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informacion General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{parte.clienteNombre}</p>
                    {parte.clienteNif && <p className="text-sm text-muted-foreground">{parte.clienteNif}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{getTipoParteLabel(parte.tipo)}</p>
                  </div>
                </div>
                {parte.proyectoId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Proyecto</p>
                    <p className="font-medium">{parte.proyectoCodigo} - {parte.proyectoNombre}</p>
                  </div>
                )}
                {parte.responsableNombre && (
                  <div>
                    <p className="text-sm text-muted-foreground">Responsable</p>
                    <p className="font-medium">{parte.responsableNombre}</p>
                  </div>
                )}
                {parte.descripcion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descripcion</p>
                    <p className="text-sm">{parte.descripcion}</p>
                  </div>
                )}
                {parte.trabajoRealizado && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trabajo Realizado</p>
                    <p className="text-sm">{parte.trabajoRealizado}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs con lineas */}
            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                    <TabsTrigger
                      value="personal"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Personal ({parte.lineasPersonal?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="material"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Material ({parte.lineasMaterial?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="maquinaria"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Maquinaria ({parte.lineasMaquinaria?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="transporte"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <TruckIcon className="h-4 w-4 mr-2" />
                      Transporte ({parte.lineasTransporte?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                      value="gastos"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Gastos ({parte.lineasGastos?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal */}
                  <TabsContent value="personal" className="p-4">
                    {parte.lineasPersonal?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Trabajador</th>
                              <th className="text-left p-2">Fecha</th>
                              <th className="text-right p-2">Horas</th>
                              <th className="text-right p-2">Tarifa/h</th>
                              <th className="text-right p-2">Venta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parte.lineasPersonal.map((linea, idx) => (
                              <tr key={linea._id || idx} className="border-b">
                                <td className="p-2">{linea.personalNombre}</td>
                                <td className="p-2">{new Date(linea.fecha).toLocaleDateString('es-ES')}</td>
                                <td className="p-2 text-right">{linea.horasTrabajadas + (linea.horasExtras || 0)}h</td>
                                <td className="p-2 text-right">{formatCurrency(linea.tarifaHoraVenta)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(linea.ventaTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No hay lineas de personal</p>
                    )}
                  </TabsContent>

                  {/* Material */}
                  <TabsContent value="material" className="p-4">
                    {parte.lineasMaterial?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Producto</th>
                              <th className="text-right p-2">Cantidad</th>
                              <th className="text-right p-2">Precio</th>
                              <th className="text-right p-2">Venta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parte.lineasMaterial.map((linea, idx) => (
                              <tr key={linea._id || idx} className="border-b">
                                <td className="p-2">{linea.productoNombre}</td>
                                <td className="p-2 text-right">{linea.cantidad} {linea.unidad}</td>
                                <td className="p-2 text-right">{formatCurrency(linea.precioVenta)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(linea.ventaTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No hay lineas de material</p>
                    )}
                  </TabsContent>

                  {/* Maquinaria */}
                  <TabsContent value="maquinaria" className="p-4">
                    {parte.lineasMaquinaria?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Maquinaria</th>
                              <th className="text-left p-2">Fecha</th>
                              <th className="text-right p-2">Cantidad</th>
                              <th className="text-right p-2">Tarifa</th>
                              <th className="text-right p-2">Venta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parte.lineasMaquinaria.map((linea, idx) => (
                              <tr key={linea._id || idx} className="border-b">
                                <td className="p-2">{linea.nombre}</td>
                                <td className="p-2">{new Date(linea.fechaUso).toLocaleDateString('es-ES')}</td>
                                <td className="p-2 text-right">{linea.cantidad} {getTipoUnidadAbbr(linea.tipoUnidad)}</td>
                                <td className="p-2 text-right">{formatCurrency(linea.tarifaVenta)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(linea.ventaTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No hay lineas de maquinaria</p>
                    )}
                  </TabsContent>

                  {/* Transporte */}
                  <TabsContent value="transporte" className="p-4">
                    {parte.lineasTransporte?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Vehiculo</th>
                              <th className="text-left p-2">Ruta</th>
                              <th className="text-right p-2">Km</th>
                              <th className="text-right p-2">Venta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parte.lineasTransporte.map((linea, idx) => (
                              <tr key={linea._id || idx} className="border-b">
                                <td className="p-2">{linea.vehiculoNombre}</td>
                                <td className="p-2">{linea.origen && linea.destino ? `${linea.origen} → ${linea.destino}` : '-'}</td>
                                <td className="p-2 text-right">{linea.kmRecorridos} km</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(linea.precioVenta)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No hay lineas de transporte</p>
                    )}
                  </TabsContent>

                  {/* Gastos */}
                  <TabsContent value="gastos" className="p-4">
                    {parte.lineasGastos?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Tipo</th>
                              <th className="text-left p-2">Descripcion</th>
                              <th className="text-right p-2">Importe</th>
                              <th className="text-right p-2">Facturable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parte.lineasGastos.map((linea, idx) => (
                              <tr key={linea._id || idx} className="border-b">
                                <td className="p-2">{linea.tipoGastoNombre}</td>
                                <td className="p-2">{linea.descripcion || '-'}</td>
                                <td className="p-2 text-right">{formatCurrency(linea.importe)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(linea.importeFacturable)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No hay lineas de gastos</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Resumen */}
          <div className="space-y-6">
            {/* Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fecha</span>
                  <span className="font-medium">{new Date(parte.fecha).toLocaleDateString('es-ES')}</span>
                </div>
                {parte.fechaInicio && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Inicio</span>
                    <span>{new Date(parte.fechaInicio).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
                {parte.fechaFin && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fin</span>
                    <span>{new Date(parte.fechaFin).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Resumen Economico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Personal</span>
                  <span>{formatCurrency(parte.totales?.ventaPersonal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Material</span>
                  <span>{formatCurrency(parte.totales?.ventaMaterial || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Maquinaria</span>
                  <span>{formatCurrency(parte.totales?.ventaMaquinaria || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transporte</span>
                  <span>{formatCurrency(parte.totales?.ventaTransporte || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos</span>
                  <span>{formatCurrency(parte.totales?.ventaGastos || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(parte.totales?.subtotalVenta || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA</span>
                  <span>{formatCurrency(parte.totales?.totalIva || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total Venta</span>
                  <span className="text-primary">{formatCurrency(parte.totales?.totalVenta || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coste Total</span>
                  <span>{formatCurrency(parte.totales?.costeTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margen</span>
                  <span className="text-green-600">
                    {formatCurrency(parte.totales?.margenBruto || 0)} ({(parte.totales?.margenPorcentaje || 0).toFixed(1)}%)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Horas trabajadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tiempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{parte.totalHorasTrabajadas || 0}h</p>
                  <p className="text-sm text-muted-foreground">Total horas trabajadas</p>
                </div>
              </CardContent>
            </Card>

            {/* Direccion */}
            {parte.direccionTrabajo && (parte.direccionTrabajo.calle || parte.direccionTrabajo.ciudad) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Direccion del Trabajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {parte.direccionTrabajo.calle} {parte.direccionTrabajo.numero}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {parte.direccionTrabajo.codigoPostal} {parte.direccionTrabajo.ciudad}
                  </p>
                  {parte.direccionTrabajo.provincia && (
                    <p className="text-sm text-muted-foreground">{parte.direccionTrabajo.provincia}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de eliminacion */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Parte de Trabajo</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que quieres eliminar el parte {parte.codigo}? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de generar albaran */}
      <Dialog open={generarAlbaranDialogOpen} onOpenChange={setGenerarAlbaranDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Albaran</DialogTitle>
            <DialogDescription>
              Se generara un albaran de venta con todas las lineas facturables de este parte de trabajo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerarAlbaranDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerarAlbaran} disabled={isGenerandoAlbaran}>
              {isGenerandoAlbaran ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Generar Albaran
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
