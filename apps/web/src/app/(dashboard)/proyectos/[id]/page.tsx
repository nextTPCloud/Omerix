'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { proyectosService } from '@/services/proyectos.service'
import { IProyecto, ESTADOS_PROYECTO, PRIORIDADES_PROYECTO, TIPOS_PROYECTO } from '@/types/proyecto.types'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  Calendar,
  Clock,
  Target,
  Users,
  FileText,
  FolderKanban,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  MoreVertical,
  Plus,
  ChevronDown,
  Flag,
  DollarSign,
  Hourglass,
} from 'lucide-react'
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
import { RecurrenciaConfig } from '@/components/proyectos/RecurrenciaConfig'

export default function ProyectoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [proyecto, setProyecto] = useState<IProyecto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadProyecto()
  }, [params.id])

  const loadProyecto = async () => {
    try {
      setIsLoading(true)
      const response = await proyectosService.getById(params.id as string)
      if (response.data) {
        setProyecto(response.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar proyecto')
      router.push('/proyectos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!proyecto) return

    try {
      await proyectosService.delete(proyecto._id)
      toast.success('Proyecto desactivado correctamente')
      router.push('/proyectos')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al desactivar proyecto')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const getEstadoBadgeVariant = (estado: string) => {
    const estadoInfo = ESTADOS_PROYECTO.find(e => e.value === estado)
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'en_progreso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'pausado': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getPrioridadBadgeVariant = (prioridad: string) => {
    switch (prioridad) {
      case 'critica': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'alta': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'media': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'baja': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      default: return ''
    }
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando proyecto...</p>
          </div>
        </div>
      
    )
  }

  if (!proyecto) {
    return (
      
        <div className="text-center py-12">
          <p className="text-muted-foreground">Proyecto no encontrado</p>
        </div>
      
    )
  }

  const tipoInfo = TIPOS_PROYECTO.find(t => t.value === proyecto.tipo)
  const estadoInfo = ESTADOS_PROYECTO.find(e => e.value === proyecto.estado)
  const prioridadInfo = PRIORIDADES_PROYECTO.find(p => p.value === proyecto.prioridad)

  // Obtener nombre del cliente
  const clienteNombre = typeof proyecto.clienteId === 'object'
    ? proyecto.clienteId.nombre
    : 'Cliente'

  return (
      <>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Link href="/proyectos">
              <Button variant="ghost" size="icon" className="mt-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold tracking-tight">{proyecto.nombre}</h1>
                    <Badge className={getEstadoBadgeVariant(proyecto.estado)}>
                      {estadoInfo?.label || proyecto.estado}
                    </Badge>
                    <Badge className={getPrioridadBadgeVariant(proyecto.prioridad)}>
                      <Flag className="mr-1 h-3 w-3" />
                      {prioridadInfo?.label || proyecto.prioridad}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{proyecto.codigo}</span>
                    <span>•</span>
                    <span>{tipoInfo?.label || proyecto.tipo}</span>
                    <span>•</span>
                    <span>{clienteNombre}</span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/proyectos/${proyecto._id}/editar`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>

                  <RecurrenciaConfig
                    proyectoId={proyecto._id}
                    esRecurrente={proyecto.esRecurrente || false}
                    recurrencia={proyecto.recurrencia}
                    onUpdate={loadProyecto}
                  />

                  <Separator orientation="vertical" className="h-8" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Crear documento</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push(`/presupuestos/nuevo?proyectoId=${proyecto._id}`)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Presupuesto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Desactivar proyecto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Progreso</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {proyecto.progreso || 0}%
                    </p>
                    <Progress value={proyecto.progreso || 0} className="mt-2 h-2" />
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Presupuesto</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {(proyecto.presupuestoAprobado || proyecto.presupuestoEstimado || 0).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Horas Estimadas</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {proyecto.horasEstimadas || 0}h
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Hourglass className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Participantes</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {proyecto.participantes?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="general" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="hitos" className="gap-2">
              <Target className="h-4 w-4" />
              Hitos
            </TabsTrigger>
            <TabsTrigger value="equipo" className="gap-2">
              <Users className="h-4 w-4" />
              Equipo
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
          </TabsList>

          {/* Tab General */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Info Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    Información del Proyecto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código</p>
                      <p className="text-sm font-mono">{proyecto.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                      <p className="text-sm">{tipoInfo?.label || proyecto.tipo}</p>
                    </div>
                  </div>

                  {proyecto.descripcion && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                      <p className="text-sm whitespace-pre-wrap">{proyecto.descripcion}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <Badge className={`mt-1 ${getEstadoBadgeVariant(proyecto.estado)}`}>
                        {estadoInfo?.label || proyecto.estado}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Prioridad</p>
                      <Badge className={`mt-1 ${getPrioridadBadgeVariant(proyecto.prioridad)}`}>
                        {prioridadInfo?.label || proyecto.prioridad}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p className="text-sm font-semibold">{clienteNombre}</p>
                  </div>
                  {typeof proyecto.clienteId === 'object' && proyecto.clienteId.codigo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Código</p>
                      <p className="text-sm font-mono">{proyecto.clienteId.codigo}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const clienteId = typeof proyecto.clienteId === 'object'
                        ? proyecto.clienteId._id
                        : proyecto.clienteId
                      router.push(`/clientes/${clienteId}`)
                    }}
                  >
                    Ver cliente
                  </Button>
                </CardContent>
              </Card>

              {/* Fechas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Fechas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha Inicio</p>
                      <p className="text-sm">
                        {proyecto.fechaInicio
                          ? new Date(proyecto.fechaInicio).toLocaleDateString('es-ES')
                          : 'No definida'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha Fin Prevista</p>
                      <p className="text-sm">
                        {proyecto.fechaFinPrevista
                          ? new Date(proyecto.fechaFinPrevista).toLocaleDateString('es-ES')
                          : 'No definida'}
                      </p>
                    </div>
                  </div>
                  {proyecto.fechaFinReal && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha Fin Real</p>
                      <p className="text-sm">
                        {new Date(proyecto.fechaFinReal).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Económico */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Datos Económicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Presupuesto Estimado</p>
                      <p className="text-sm font-semibold">
                        {(proyecto.presupuestoEstimado || 0).toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Presupuesto Aprobado</p>
                      <p className="text-sm font-semibold">
                        {(proyecto.presupuestoAprobado || 0).toLocaleString('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </p>
                    </div>
                  </div>
                  {proyecto.margenPrevisto && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Margen Previsto</p>
                      <p className="text-sm">{proyecto.margenPrevisto}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dirección */}
              {proyecto.direccion && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Dirección del Proyecto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      {proyecto.direccion.calle && <p>{proyecto.direccion.calle}</p>}
                      <p>
                        {proyecto.direccion.codigoPostal} {proyecto.direccion.ciudad}
                      </p>
                      <p className="text-muted-foreground">
                        {proyecto.direccion.provincia}, {proyecto.direccion.pais}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Observaciones */}
              {proyecto.observaciones && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{proyecto.observaciones}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab Hitos */}
          <TabsContent value="hitos" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Hitos del Proyecto</CardTitle>
                <CardDescription>Objetivos y metas del proyecto</CardDescription>
              </CardHeader>
              <CardContent>
                {proyecto.hitos && proyecto.hitos.length > 0 ? (
                  <div className="space-y-4">
                    {proyecto.hitos.map((hito, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className={`p-2 rounded-full ${hito.completado ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {hito.completado ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Target className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{hito.nombre}</p>
                          {hito.descripcion && (
                            <p className="text-sm text-muted-foreground mt-1">{hito.descripcion}</p>
                          )}
                          {hito.fechaPrevista && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Fecha prevista: {new Date(hito.fechaPrevista).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                        <Badge variant={hito.completado ? 'default' : 'outline'}>
                          {hito.completado ? 'Completado' : 'Pendiente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">No hay hitos definidos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Equipo */}
          <TabsContent value="equipo" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipo del Proyecto</CardTitle>
                <CardDescription>Participantes asignados al proyecto</CardDescription>
              </CardHeader>
              <CardContent>
                {proyecto.participantes && proyecto.participantes.length > 0 ? (
                  <div className="space-y-4">
                    {proyecto.participantes.map((participante, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {typeof participante.personalId === 'object'
                              ? `${participante.personalId.nombre} ${participante.personalId.apellidos || ''}`.trim()
                              : participante.personalId}
                          </p>
                          <p className="text-sm text-muted-foreground">{participante.rol}</p>
                        </div>
                        <div className="text-right">
                          {participante.horasAsignadas && (
                            <p className="text-sm">{participante.horasAsignadas}h asignadas</p>
                          )}
                          <Badge variant={participante.activo ? 'default' : 'secondary'}>
                            {participante.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">No hay participantes asignados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Documentos */}
          <TabsContent value="documentos" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-semibold mb-2">Documentos en desarrollo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Los documentos asociados al proyecto se mostrarán aquí
                </p>
                <Button variant="outline" onClick={() => router.push(`/presupuestos/nuevo?proyectoId=${proyecto._id}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear presupuesto
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog desactivar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de desactivar el proyecto <span className="font-semibold">{proyecto.nombre}</span>.
              Esta acción no eliminará el proyecto, pero lo marcará como inactivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desactivar proyecto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
  )
}
