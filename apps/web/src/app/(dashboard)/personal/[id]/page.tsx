'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { personalService } from '@/services/personal.service'
import { turnosService } from '@/services/turnos.service'
import { calendariosService } from '@/services/calendarios.service'
import { Turno } from '@/types/turno.types'
import { CalendarioLaboral } from '@/types/calendario.types'
import { Personal, TIPOS_CONTRATO, ESTADOS_EMPLEADO, TIPOS_JORNADA, GENEROS, TIPOS_AUSENCIA } from '@/types/personal.types'
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
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  RefreshCw,
  Users,
  Briefcase,
  GraduationCap,
  Clock,
  FileText,
  Wallet,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { TabCalendario, TabVacaciones } from '@/components/personal/tabs'

export default function PersonalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [empleado, setEmpleado] = useState<Personal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [calendarios, setCalendarios] = useState<CalendarioLaboral[]>([])

  useEffect(() => {
    const loadEmpleado = async () => {
      try {
        setLoading(true)
        const [empResponse, turnosRes, calendariosRes] = await Promise.all([
          personalService.getById(id),
          turnosService.getActivos(),
          calendariosService.getActivos()
        ])
        if (empResponse.success) {
          setEmpleado(empResponse.data)
        } else {
          throw new Error('Empleado no encontrado')
        }
        if (turnosRes.success) setTurnos(turnosRes.data)
        if (calendariosRes.success) setCalendarios(calendariosRes.data)
      } catch (err: any) {
        setError(err.message || 'Error al cargar el empleado')
        toast.error('Error al cargar los datos del empleado')
      } finally {
        setLoading(false)
      }
    }

    // Validar que el ID sea válido (no undefined, null, o string "undefined")
    if (id && id !== 'undefined' && id !== 'null' && id !== 'nuevo') {
      loadEmpleado()
    } else if (id === 'nuevo') {
      // Si es "nuevo", redirigir a la página de edición
      router.replace('/personal/nuevo/editar')
    } else {
      setLoading(false)
      setError('ID de empleado no válido')
    }
  }, [id, router])

  const handleDelete = async () => {
    try {
      const response = await personalService.delete(id)
      if (response.success) {
        toast.success('Empleado eliminado correctamente')
        router.push('/personal')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el empleado')
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleChangeStatus = async () => {
    if (!empleado) return
    try {
      const response = await personalService.changeStatus(id, !empleado.activo)
      if (response.success) {
        setEmpleado(response.data)
        toast.success(response.data.activo ? 'Empleado activado' : 'Empleado desactivado')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar el estado')
    }
  }

  const handleDuplicar = async () => {
    try {
      const response = await personalService.duplicar(id)
      if (response.success) {
        toast.success('Empleado duplicado correctamente')
        router.push(`/personal/${response.data._id}/editar`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al duplicar el empleado')
    }
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      
    )
  }

  if (error || !empleado) {
    return (
      
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">{error || 'Empleado no encontrado'}</p>
          <Button variant="outline" onClick={() => router.push('/personal')}>
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
            <Button variant="ghost" size="icon" onClick={() => router.push('/personal')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{empleado.nombreCompleto || `${empleado.nombre} ${empleado.apellidos}`}</h1>
                <Badge variant={empleado.activo ? 'default' : 'secondary'}>
                  {empleado.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="font-mono">{empleado.codigo}</span>
                <span>•</span>
                <span>{empleado.datosLaborales?.puesto}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/personal/${id}/editar`}>
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
                  {empleado.activo ? (
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="laboral">Laboral</TabsTrigger>
            <TabsTrigger value="economicos">Económico</TabsTrigger>
            <TabsTrigger value="formacion">Formación</TabsTrigger>
            <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
            <TabsTrigger value="calendario">Calendario</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Datos Personales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Datos Personales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Código</span>
                    <span className="font-mono">{empleado.codigo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nombre completo</span>
                    <span>{empleado.nombreCompleto || `${empleado.nombre} ${empleado.apellidos}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NIF</span>
                    <span>{empleado.documentacion?.nif || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NSS</span>
                    <span>{empleado.documentacion?.nss || '-'}</span>
                  </div>
                  {empleado.edad && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Edad</span>
                      <span>{empleado.edad} años</span>
                    </div>
                  )}
                  {empleado.datosPersonales?.nacionalidad && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nacionalidad</span>
                      <span>{empleado.datosPersonales.nacionalidad}</span>
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
                  {empleado.contacto?.emailCorporativo && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{empleado.contacto.emailCorporativo} (corp.)</span>
                    </div>
                  )}
                  {empleado.contacto?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{empleado.contacto.email}</span>
                    </div>
                  )}
                  {empleado.contacto?.telefonoMovil && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{empleado.contacto.telefonoMovil}</span>
                    </div>
                  )}
                  {empleado.contacto?.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{empleado.contacto.telefono}</span>
                    </div>
                  )}
                  {empleado.contacto?.telefonoEmergencia && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <Phone className="h-4 w-4" />
                      <span>{empleado.contacto.telefonoEmergencia} (emergencia)</span>
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
                  {empleado.direccion?.direccion ? (
                    <div className="space-y-1">
                      <p>{empleado.direccion.direccion}</p>
                      <p>
                        {empleado.direccion.codigoPostal} {empleado.direccion.ciudad}
                      </p>
                      <p>{empleado.direccion.provincia}, {empleado.direccion.pais}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin dirección registrada</p>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de Vacaciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Vacaciones {new Date().getFullYear()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {empleado.diasVacacionesPendientes || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {empleado.vacaciones?.find(v => v.anio === new Date().getFullYear())?.diasDisfrutados || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Disfrutados</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {empleado.vacaciones?.find(v => v.anio === new Date().getFullYear())?.diasTotales || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Totales</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="laboral" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Control Horario */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Control Horario
                  </CardTitle>
                  <CardDescription>Configuración de turno y calendario para fichajes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Turno asignado</span>
                      <p className="font-medium">
                        {empleado.datosLaborales?.turnoDefectoId
                          ? turnos.find(t => t._id === empleado.datosLaborales?.turnoDefectoId)?.nombre || 'Turno no encontrado'
                          : <span className="text-muted-foreground italic">Heredado del departamento</span>
                        }
                      </p>
                      {empleado.datosLaborales?.turnoDefectoId && (
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const turno = turnos.find(t => t._id === empleado.datosLaborales?.turnoDefectoId)
                            return turno ? `${turno.horaEntrada} - ${turno.horaSalida} (${turno.horasTeoricas}h)` : ''
                          })()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Calendario laboral</span>
                      <p className="font-medium">
                        {empleado.datosLaborales?.calendarioLaboralId
                          ? calendarios.find(c => c._id === empleado.datosLaborales?.calendarioLaboralId)?.nombre || 'Calendario no encontrado'
                          : <span className="text-muted-foreground italic">Heredado del departamento</span>
                        }
                      </p>
                      {empleado.datosLaborales?.calendarioLaboralId && (
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const cal = calendarios.find(c => c._id === empleado.datosLaborales?.calendarioLaboralId)
                            return cal ? `Año ${cal.anio} - ${cal.festivos?.length || 0} festivos` : ''
                          })()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Tolerancia retraso</span>
                      <p className="font-medium">
                        {empleado.datosLaborales?.toleranciaRetrasoMinutos !== undefined
                          ? `${empleado.datosLaborales.toleranciaRetrasoMinutos} minutos`
                          : <span className="text-muted-foreground italic">Por defecto (5 min)</span>
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Datos del Puesto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Puesto</span>
                    <span className="font-medium">{empleado.datosLaborales?.puesto || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoría</span>
                    <span>{empleado.datosLaborales?.categoriaLaboral || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nivel</span>
                    <span>{empleado.datosLaborales?.nivelProfesional || '-'}</span>
                  </div>
                  {empleado.responsable && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsable</span>
                      <span>{empleado.responsable.nombre} {empleado.responsable.apellidos}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Contrato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <Badge variant="outline">
                      {TIPOS_CONTRATO.find(t => t.value === empleado.datosLaborales?.tipoContrato)?.label || empleado.datosLaborales?.tipoContrato}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jornada</span>
                    <span>
                      {TIPOS_JORNADA.find(j => j.value === empleado.datosLaborales?.tipoJornada)?.label || empleado.datosLaborales?.tipoJornada}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas/semana</span>
                    <span>{empleado.datosLaborales?.horasSemanales || 40}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha inicio</span>
                    <span>{empleado.datosLaborales?.fechaInicioContrato ? new Date(empleado.datosLaborales.fechaInicioContrato).toLocaleDateString('es-ES') : '-'}</span>
                  </div>
                  {empleado.datosLaborales?.fechaFinContrato && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha fin</span>
                      <span>{new Date(empleado.datosLaborales.fechaFinContrato).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Antigüedad</span>
                    <Badge variant="secondary">{empleado.antiguedad || 0} años</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="economicos" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Datos Económicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salario bruto anual</span>
                    <span className="font-medium">
                      {(empleado.datosEconomicos?.salarioBrutoAnual || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salario bruto mensual</span>
                    <span>
                      {(empleado.datosEconomicos?.salarioBrutoMensual || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Número de pagas</span>
                    <span>{empleado.datosEconomicos?.numPagas || 14}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IRPF</span>
                    <span>{empleado.datosEconomicos?.irpf || 0}%</span>
                  </div>
                  {empleado.salarioNeto && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Salario neto mensual (aprox.)</span>
                      <span>{empleado.salarioNeto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Cuenta Bancaria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {empleado.cuentasBancarias && empleado.cuentasBancarias.length > 0 ? (
                    <div className="space-y-4">
                      {empleado.cuentasBancarias.map((cuenta, index) => (
                        <div key={cuenta._id || index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-sm">{cuenta.iban}</span>
                            {cuenta.principal && <Badge>Principal</Badge>}
                          </div>
                          {cuenta.banco && <p className="text-sm text-muted-foreground">{cuenta.banco}</p>}
                          {cuenta.titular && <p className="text-sm">{cuenta.titular}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin cuenta bancaria registrada</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="formacion" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Formación Académica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {empleado.formacionAcademica && empleado.formacionAcademica.length > 0 ? (
                    <div className="space-y-4">
                      {empleado.formacionAcademica.map((formacion, index) => (
                        <div key={formacion._id || index} className="p-3 border rounded-lg">
                          <p className="font-medium">{formacion.titulo}</p>
                          {formacion.institucion && <p className="text-sm text-muted-foreground">{formacion.institucion}</p>}
                          {formacion.especialidad && <p className="text-sm">{formacion.especialidad}</p>}
                          {formacion.fechaObtencion && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(formacion.fechaObtencion).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin formación registrada</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experiencia Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {empleado.experienciaLaboral && empleado.experienciaLaboral.length > 0 ? (
                    <div className="space-y-4">
                      {empleado.experienciaLaboral.map((exp, index) => (
                        <div key={exp._id || index} className="p-3 border rounded-lg">
                          <p className="font-medium">{exp.puesto}</p>
                          <p className="text-sm text-muted-foreground">{exp.empresa}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exp.fechaInicio).toLocaleDateString('es-ES')} - {exp.fechaFin ? new Date(exp.fechaFin).toLocaleDateString('es-ES') : 'Actualidad'}
                          </p>
                          {exp.descripcion && <p className="text-sm mt-2">{exp.descripcion}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin experiencia registrada</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vacaciones" className="mt-4">
            <TabVacaciones
              empleado={empleado}
              onUpdate={(updatedEmpleado) => setEmpleado(updatedEmpleado)}
            />
          </TabsContent>

          <TabsContent value="calendario" className="mt-4">
            <TabCalendario empleado={empleado} />
          </TabsContent>

          <TabsContent value="documentos" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {empleado.documentos && empleado.documentos.length > 0 ? (
                  <div className="space-y-3">
                    {empleado.documentos.map((doc, index) => (
                      <div key={doc._id || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{doc.nombre}</p>
                          <p className="text-sm text-muted-foreground">{doc.tipo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.confidencial && <Badge variant="destructive">Confidencial</Badge>}
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              Ver
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sin documentos registrados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Observaciones */}
        {empleado.observaciones && (
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{empleado.observaciones}</p>
            </CardContent>
          </Card>
        )}

        {/* Info de auditoría */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Creado: {new Date(empleado.fechaCreacion).toLocaleDateString('es-ES')}</span>
              </div>
              {empleado.fechaModificacion && (
                <span>Modificado: {new Date(empleado.fechaModificacion).toLocaleDateString('es-ES')}</span>
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
              ¿Estás seguro de que deseas eliminar al empleado{' '}
              <strong>{empleado.nombreCompleto || `${empleado.nombre} ${empleado.apellidos}`}</strong>?
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
