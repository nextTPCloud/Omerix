'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { agentesService } from '@/services/agentes-comerciales.service'
import { AgenteComercial, TIPOS_AGENTE, ESTADOS_AGENTE, TIPOS_COMISION } from '@/types/agente-comercial.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  Copy,
  UserCheck,
  UserX,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Target,
  TrendingUp,
  Users,
  Percent,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AgenteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [agente, setAgente] = useState<AgenteComercial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const loadAgente = async () => {
      try {
        setLoading(true)
        const response = await agentesService.getById(id)
        if (response.success) {
          setAgente(response.data)
        } else {
          throw new Error('Agente no encontrado')
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar el agente')
        toast.error('Error al cargar los datos del agente')
      } finally {
        setLoading(false)
      }
    }

    // Validar que el ID sea válido (no undefined, null, o string "undefined")
    if (id && id !== 'undefined' && id !== 'null' && id !== 'nuevo') {
      loadAgente()
    } else if (id === 'nuevo') {
      // Si es "nuevo", redirigir a la página de edición
      router.replace('/agentes-comerciales/nuevo/editar')
    } else {
      setLoading(false)
      setError('ID de agente no válido')
    }
  }, [id, router])

  const handleDelete = async () => {
    try {
      const response = await agentesService.delete(id)
      if (response.success) {
        toast.success('Agente eliminado correctamente')
        router.push('/agentes-comerciales')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el agente')
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleChangeStatus = async () => {
    if (!agente) return
    try {
      const response = await agentesService.changeStatus(id, !agente.activo)
      if (response.success) {
        setAgente(response.data)
        toast.success(response.data.activo ? 'Agente activado' : 'Agente desactivado')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar el estado')
    }
  }

  const handleDuplicar = async () => {
    try {
      const response = await agentesService.duplicar(id)
      if (response.success) {
        toast.success('Agente duplicado correctamente')
        router.push(`/agentes-comerciales/${response.data._id}/editar`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al duplicar el agente')
    }
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      
    )
  }

  if (error || !agente) {
    return (
      
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">{error || 'Agente no encontrado'}</p>
          <Button variant="outline" onClick={() => router.push('/agentes-comerciales')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al listado
          </Button>
        </div>
      
    )
  }

  return (
      <>
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/agentes-comerciales')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{agente.nombreCompleto || agente.nombre}</h1>
                <Badge variant={agente.activo ? 'default' : 'secondary'}>
                  {agente.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="font-mono">{agente.codigo}</span>
                <span>•</span>
                <Badge variant="outline">
                  {TIPOS_AGENTE.find((t) => t.value === agente.tipo)?.label || agente.tipo}
                </Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/agentes-comerciales/${id}/editar`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicar}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleChangeStatus}>
                  {agente.activo ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contenido */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="comisiones">Comisiones</TabsTrigger>
            <TabsTrigger value="zonas">Zonas</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Datos Personales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Datos del Agente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Código</span>
                    <span className="font-mono">{agente.codigo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre completo</span>
                    <span>{agente.nombreCompleto || agente.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NIF</span>
                    <span>{agente.nif || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge variant="outline">
                      {TIPOS_AGENTE.find((t) => t.value === agente.tipo)?.label || agente.tipo}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado</span>
                    <Badge variant="secondary">
                      {ESTADOS_AGENTE.find((e) => e.value === agente.estado)?.label || agente.estado}
                    </Badge>
                  </div>
                  {agente.supervisor && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supervisor</span>
                      <span>{agente.supervisor.nombre} {agente.supervisor.apellidos}</span>
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
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{agente.contacto?.email || '-'}</span>
                  </div>
                  {agente.contacto?.emailSecundario && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{agente.contacto.emailSecundario}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{agente.contacto?.telefono || '-'}</span>
                  </div>
                  {agente.contacto?.telefonoMovil && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{agente.contacto.telefonoMovil}</span>
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
                  {agente.direccion?.direccion ? (
                    <div className="space-y-1">
                      <p>{agente.direccion.direccion}</p>
                      <p>
                        {agente.direccion.codigoPostal} {agente.direccion.ciudad}
                      </p>
                      <p>{agente.direccion.provincia}, {agente.direccion.pais}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin dirección registrada</p>
                  )}
                </CardContent>
              </Card>

              {/* Datos Bancarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Datos Bancarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IBAN</span>
                    <span className="font-mono">{agente.iban || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SWIFT</span>
                    <span className="font-mono">{agente.swift || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Banco</span>
                    <span>{agente.banco || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Rendimiento */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {(agente.ventasTotales || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </p>
                      <p className="text-sm text-muted-foreground">Ventas Totales</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">
                        {(agente.comisionesAcumuladas || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </p>
                      <p className="text-sm text-muted-foreground">Comisiones Acumuladas</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{agente.comision?.porcentaje || 0}%</p>
                      <p className="text-sm text-muted-foreground">Comisión Actual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comisiones" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Configuración de Comisiones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de comisión</p>
                    <p className="font-medium">
                      {TIPOS_COMISION.find((t) => t.value === agente.comision?.tipo)?.label || agente.comision?.tipo || 'Porcentaje'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Porcentaje</p>
                    <p className="font-medium">{agente.comision?.porcentaje || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Importe fijo</p>
                    <p className="font-medium">
                      {(agente.comision?.importeFijo || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rango de comisión</p>
                    <p className="font-medium">
                      {agente.comision?.porcentajeMinimo || 0}% - {agente.comision?.porcentajeMaximo || 100}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zonas" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Zonas Asignadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agente.zonasAsignadas && agente.zonasAsignadas.length > 0 ? (
                  <div className="space-y-3">
                    {agente.zonasAsignadas.map((zona, index) => (
                      <div key={zona._id || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{zona.zona}</p>
                          {zona.descripcion && (
                            <p className="text-sm text-muted-foreground">{zona.descripcion}</p>
                          )}
                        </div>
                        <Badge variant={zona.activa ? 'default' : 'secondary'}>
                          {zona.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay zonas asignadas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clientes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes Asignados
                </CardTitle>
                <CardDescription>
                  {agente.clientesAsignados?.length || 0} cliente(s) asignado(s) a este agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agente.clientesAsignados && agente.clientesAsignados.length > 0 ? (
                  <div className="space-y-3">
                    {agente.clientesAsignados.map((clienteId: any, index: number) => {
                      const cliente = typeof clienteId === 'object' ? clienteId : null
                      return (
                        <div
                          key={cliente?._id || clienteId || index}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => cliente?._id && router.push(`/clientes/${cliente._id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {cliente?.nombre || cliente?.nombreComercial || `Cliente ${index + 1}`}
                              </p>
                              {cliente?.codigo && (
                                <p className="text-sm text-muted-foreground font-mono">
                                  {cliente.codigo}
                                </p>
                              )}
                            </div>
                          </div>
                          {cliente?.activo !== undefined && (
                            <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                              {cliente.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No hay clientes asignados</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Asigna clientes desde la ficha del cliente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objetivos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agente.objetivosVentas && agente.objetivosVentas.length > 0 ? (
                  <div className="space-y-3">
                    {agente.objetivosVentas.map((obj, index) => (
                      <div key={obj._id || index} className="p-4 border rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{obj.periodo}</span>
                          <Badge variant={obj.porcentajeCumplimiento && obj.porcentajeCumplimiento >= 100 ? 'default' : 'secondary'}>
                            {(obj.porcentajeCumplimiento || 0).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Objetivo: {obj.objetivo.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                          <span>Conseguido: {obj.conseguido.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                        </div>
                        <div className="mt-2 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${Math.min(obj.porcentajeCumplimiento || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay objetivos definidos</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Observaciones */}
        {agente.observaciones && (
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{agente.observaciones}</p>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {agente.tags && agente.tags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Etiquetas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agente.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info de auditoría */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Creado: {new Date(agente.fechaCreacion).toLocaleDateString('es-ES')}</span>
              </div>
              {agente.fechaModificacion && (
                <span>Modificado: {new Date(agente.fechaModificacion).toLocaleDateString('es-ES')}</span>
              )}
              {agente.fechaAlta && (
                <span>Fecha alta: {new Date(agente.fechaAlta).toLocaleDateString('es-ES')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al agente{' '}
              <strong>{agente.nombreCompleto || agente.nombre}</strong>?
              Esta acción no se puede deshacer.
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
      </>
  )
}
