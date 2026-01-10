'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { partesTrabajoService } from '@/services/partes-trabajo.service'
import { clientesService } from '@/services/clientes.service'
import { proyectosService } from '@/services/proyectos.service'
import { personalService } from '@/services/personal.service'
import {
  CreateParteTrabajoDTO,
  TIPOS_PARTE_TRABAJO,
  PRIORIDADES,
  TipoParteTrabajo,
  Prioridad,
} from '@/types/parte-trabajo.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  SearchableSelect,
  MultiSearchableSelect,
  SearchableSelectOption,
} from '@/components/ui/searchable-select'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'
import {
  ArrowLeft,
  Save,
  Wrench,
  RefreshCw,
  Calendar,
  Building2,
  FolderKanban,
  User,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  FileText,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Colores para prioridades
const PRIORIDAD_COLORS: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-700 border-gray-300',
  media: 'bg-blue-100 text-blue-700 border-blue-300',
  alta: 'bg-orange-100 text-orange-700 border-orange-300',
  urgente: 'bg-red-100 text-red-700 border-red-300',
}

// Iconos para tipos de parte
const TIPO_ICONS: Record<string, string> = {
  mantenimiento: '🔧',
  instalacion: '🏗️',
  reparacion: '🛠️',
  servicio: '⚡',
  proyecto: '📋',
  otro: '📝',
}

export default function NuevoParteTrabajoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Listas para selects
  const [clientes, setClientes] = useState<any[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])
  const [personal, setPersonal] = useState<any[]>([])

  // Cliente seleccionado (para obtener direcciones)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null)

  // Form data
  const [formData, setFormData] = useState<CreateParteTrabajoDTO>({
    clienteId: '',
    tipo: 'servicio',
    prioridad: 'media',
    fecha: new Date().toISOString().split('T')[0],
    titulo: '',
    descripcion: '',
  })

  // Personal asignado (multiple)
  const [personalAsignado, setPersonalAsignado] = useState<string[]>([])

  // Horario planificado
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [duracionEstimada, setDuracionEstimada] = useState('')

  // Direccion manual o auto
  const [usarDireccionCliente, setUsarDireccionCliente] = useState(true)

  // Estado para conflictos de disponibilidad de personal
  const [conflictosPersonal, setConflictosPersonal] = useState<Array<{
    personalId: string
    personalNombre: string
    parteId: string
    parteCodigo: string
    horaInicio: string
    horaFin: string
  }>>([])

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true)
      try {
        const [clientesRes, proyectosRes, personalRes] = await Promise.all([
          clientesService.getAll({ limit: 100, activo: true }),
          proyectosService.getAll({ limit: 100, activo: 'true' }),
          personalService.getAll({ limit: 100, activo: true }),
        ])

        if (clientesRes.success) setClientes(clientesRes.data || [])
        if (proyectosRes.success) setProyectos(proyectosRes.data || [])
        if (personalRes.success) setPersonal(personalRes.data || [])
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
  }, [])

  // Cuando cambia el cliente, actualizar direccion si corresponde
  useEffect(() => {
    if (formData.clienteId) {
      const cliente = clientes.find(c => c._id === formData.clienteId)
      setClienteSeleccionado(cliente)

      if (cliente && usarDireccionCliente) {
        // Obtener direccion fiscal o principal del cliente
        const direccion = cliente.direccionFiscal || cliente.direccion ||
          cliente.direcciones?.find((d: any) => d.tipo === 'fiscal' || d.predeterminada) ||
          cliente.direcciones?.[0]

        if (direccion) {
          setFormData(prev => ({
            ...prev,
            direccionTrabajo: {
              calle: direccion.calle || '',
              numero: direccion.numero || '',
              codigoPostal: direccion.codigoPostal || '',
              ciudad: direccion.ciudad || '',
              provincia: direccion.provincia || '',
              pais: direccion.pais || 'España',
              coordenadas: direccion.coordenadas,
            }
          }))
        }
      }
    } else {
      setClienteSeleccionado(null)
    }
  }, [formData.clienteId, clientes, usarDireccionCliente])

  // Opciones para SearchableSelect de clientes
  const clienteOptions: SearchableSelectOption[] = useMemo(() =>
    clientes.map(c => ({
      value: c._id,
      label: c.nombre || c.nombreComercial || 'Sin nombre',
      description: c.nif || c.email || '',
    })), [clientes])

  // Filtrar proyectos por cliente seleccionado
  const proyectosFiltrados = useMemo(() => {
    if (!formData.clienteId) return proyectos
    return proyectos.filter((p) =>
      p.clienteId === formData.clienteId ||
      p.clienteId?._id === formData.clienteId
    )
  }, [proyectos, formData.clienteId])

  // Opciones para SearchableSelect de proyectos
  const proyectoOptions: SearchableSelectOption[] = useMemo(() =>
    proyectosFiltrados.map(p => ({
      value: p._id,
      label: `${p.codigo || ''} - ${p.nombre || p.titulo || 'Sin nombre'}`.trim(),
      description: p.estado || '',
    })), [proyectosFiltrados])

  // Opciones para SearchableSelect de personal
  const personalOptions: SearchableSelectOption[] = useMemo(() =>
    personal.map(p => ({
      value: p._id,
      label: `${p.nombre || ''} ${p.apellidos || ''}`.trim() || 'Sin nombre',
      description: p.cargo || p.categoria || '',
    })), [personal])

  // Verificar disponibilidad de personal cuando cambia seleccion o horarios
  const verificarDisponibilidadPersonal = useCallback(async () => {
    if (personalAsignado.length === 0 || !formData.fecha) {
      setConflictosPersonal([])
      return
    }

    const horaInicioVerif = horaInicio || '08:00'
    const horaFinVerif = horaFin || '17:00'

    try {
      const response = await partesTrabajoService.verificarDisponibilidad({
        personalIds: personalAsignado,
        fecha: formData.fecha,
        horaInicio: horaInicioVerif,
        horaFin: horaFinVerif
      })

      if (response.success && response.data) {
        setConflictosPersonal(response.data.conflictos)
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error)
    }
  }, [personalAsignado, formData.fecha, horaInicio, horaFin])

  // Efecto para verificar disponibilidad cuando cambian los datos relevantes
  useEffect(() => {
    verificarDisponibilidadPersonal()
  }, [verificarDisponibilidadPersonal])

  // Manejar seleccion de direccion desde autocomplete
  const handleAddressSelect = (address: any) => {
    setFormData(prev => ({
      ...prev,
      direccionTrabajo: {
        calle: address.calle || '',
        numero: address.numero || '',
        codigoPostal: address.codigoPostal || '',
        ciudad: address.ciudad || '',
        provincia: address.provincia || '',
        pais: address.pais || 'España',
        coordenadas: address.latitud && address.longitud ? {
          lat: address.latitud,
          lng: address.longitud,
        } : undefined,
      }
    }))
    setUsarDireccionCliente(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clienteId) {
      toast.error('El cliente es obligatorio')
      return
    }

    setIsSaving(true)
    try {
      // Agregar horario planificado - siempre establecer fechaInicio para planificación
      const dataToSend: CreateParteTrabajoDTO = {
        ...formData,
        fechaInicio: horaInicio
          ? `${formData.fecha}T${horaInicio}:00`
          : `${formData.fecha}T08:00:00`, // Default 8:00 para que aparezca en planificación
        fechaFin: horaFin ? `${formData.fecha}T${horaFin}:00` : undefined,
      }

      // Si hay personal asignado, agregar como lineas de personal con horas por defecto
      if (personalAsignado.length > 0) {
        const horaInicioDefault = horaInicio || '08:00'
        const horaFinDefault = horaFin || '17:00'
        dataToSend.lineasPersonal = personalAsignado.map(pId => {
          const p = personal.find(pers => pers._id === pId)
          return {
            personalId: pId,
            personalNombre: p ? `${p.nombre || ''} ${p.apellidos || ''}`.trim() : '',
            fecha: formData.fecha || new Date().toISOString().split('T')[0],
            horaInicio: horaInicioDefault,
            horaFin: horaFinDefault,
            horasTrabajadas: 8, // Estimación inicial de 8h
            tarifaHoraCoste: p?.tarifaHoraCoste || 0,
            tarifaHoraVenta: p?.tarifaHoraVenta || 0,
            costeTotal: (p?.tarifaHoraCoste || 0) * 8,
            ventaTotal: (p?.tarifaHoraVenta || 0) * 8,
            facturable: true,
            incluidoEnAlbaran: false,
          }
        })
      }

      const response = await partesTrabajoService.create(dataToSend)
      if (response.success && response.data) {
        toast.success('Parte de trabajo creado correctamente')
        router.push(`/partes-trabajo/${response.data._id}/editar`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear el parte de trabajo')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/partes-trabajo">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Wrench className="h-7 w-7 text-primary" />
              Nuevo Parte de Trabajo
            </h1>
            <p className="text-sm text-muted-foreground">
              Configura los datos del parte. Podras agregar materiales y mas detalles despues.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="gap-2">
                <FileText className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="planificacion" className="gap-2">
                <Clock className="h-4 w-4" />
                Planificacion
              </TabsTrigger>
              <TabsTrigger value="ubicacion" className="gap-2">
                <MapPin className="h-4 w-4" />
                Ubicacion
              </TabsTrigger>
            </TabsList>

            {/* TAB: General */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Cliente y Proyecto
                  </CardTitle>
                  <CardDescription>
                    Selecciona el cliente para el que se realiza el trabajo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cliente */}
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <SearchableSelect
                      options={clienteOptions}
                      value={formData.clienteId}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        clienteId: value,
                        proyectoId: undefined
                      })}
                      placeholder="Buscar cliente..."
                      searchPlaceholder="Escribe para buscar..."
                      emptyMessage="No se encontraron clientes"
                    />
                    {clienteSeleccionado && (
                      <p className="text-xs text-muted-foreground">
                        {clienteSeleccionado.email || clienteSeleccionado.telefono || ''}
                      </p>
                    )}
                  </div>

                  {/* Proyecto (opcional) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      Proyecto
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <SearchableSelect
                      options={proyectoOptions}
                      value={formData.proyectoId || ''}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        proyectoId: value || undefined
                      })}
                      placeholder="Sin proyecto asignado"
                      searchPlaceholder="Buscar proyecto..."
                      emptyMessage={formData.clienteId
                        ? "No hay proyectos para este cliente"
                        : "Selecciona un cliente primero"
                      }
                      allowClear
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Tipo y Prioridad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tipo de trabajo */}
                  <div className="space-y-2">
                    <Label>Tipo de trabajo</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {TIPOS_PARTE_TRABAJO.map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, tipo: tipo.value as TipoParteTrabajo })}
                          className={cn(
                            'flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all',
                            formData.tipo === tipo.value
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <span className="text-xl mb-1">{TIPO_ICONS[tipo.value]}</span>
                          <span className="text-xs font-medium">{tipo.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prioridad */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Prioridad
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRIORIDADES.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, prioridad: p.value as Prioridad })}
                          className={cn(
                            'flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all',
                            formData.prioridad === p.value
                              ? `${PRIORIDAD_COLORS[p.value]} border-current ring-1`
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <span className="text-sm font-medium">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Descripcion del Trabajo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Titulo */}
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Titulo</Label>
                    <Input
                      id="titulo"
                      placeholder="Ej: Revision anual climatizacion"
                      value={formData.titulo || ''}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </div>

                  {/* Descripcion */}
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripcion del trabajo</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Describe el trabajo a realizar..."
                      rows={4}
                      value={formData.descripcion || ''}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Planificacion */}
            <TabsContent value="planificacion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Fecha y Horario
                  </CardTitle>
                  <CardDescription>
                    Planifica cuando se realizara el trabajo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Fecha */}
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha del trabajo</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha?.split('T')[0] || ''}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      />
                    </div>

                    {/* Hora inicio */}
                    <div className="space-y-2">
                      <Label htmlFor="horaInicio">Hora inicio</Label>
                      <Input
                        id="horaInicio"
                        type="time"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                        placeholder="--:--"
                      />
                    </div>

                    {/* Hora fin */}
                    <div className="space-y-2">
                      <Label htmlFor="horaFin">Hora fin (estimada)</Label>
                      <Input
                        id="horaFin"
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                        placeholder="--:--"
                      />
                    </div>
                  </div>

                  {/* Duracion estimada */}
                  <div className="space-y-2">
                    <Label htmlFor="duracion">Duracion estimada</Label>
                    <Input
                      id="duracion"
                      placeholder="Ej: 2 horas, media jornada..."
                      value={duracionEstimada}
                      onChange={(e) => setDuracionEstimada(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Personal Asignado
                  </CardTitle>
                  <CardDescription>
                    Selecciona las personas que realizaran el trabajo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Responsable principal */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Responsable
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <SearchableSelect
                      options={personalOptions}
                      value={formData.responsableId || ''}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        responsableId: value || undefined
                      })}
                      placeholder="Sin responsable asignado"
                      searchPlaceholder="Buscar empleado..."
                      emptyMessage="No se encontraron empleados"
                      allowClear
                    />
                  </div>

                  {/* Personal adicional */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Equipo de trabajo
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <MultiSearchableSelect
                      options={personalOptions}
                      values={personalAsignado}
                      onValuesChange={setPersonalAsignado}
                      placeholder="Seleccionar personal..."
                      searchPlaceholder="Buscar empleados..."
                      emptyMessage="No se encontraron empleados"
                    />
                    {personalAsignado.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {personalAsignado.length} persona(s) asignada(s) al trabajo
                      </p>
                    )}
                    {/* Alerta de conflictos de disponibilidad */}
                    {conflictosPersonal.length > 0 && (
                      <Alert variant="destructive" className="mt-3 border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle>Conflictos de disponibilidad</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                            {conflictosPersonal.map((conflicto, idx) => (
                              <li key={idx}>
                                <strong>{conflicto.personalNombre}</strong> asignado en{' '}
                                <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900 px-1 rounded">
                                  {conflicto.parteCodigo}
                                </span>{' '}
                                ({conflicto.horaInicio} - {conflicto.horaFin})
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs mt-2 opacity-75">
                            Puedes continuar, pero habrá solapamiento de horarios.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Ubicacion */}
            <TabsContent value="ubicacion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Direccion del Trabajo
                  </CardTitle>
                  <CardDescription>
                    Indica donde se realizara el trabajo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Opcion de usar direccion del cliente */}
                  {clienteSeleccionado && (
                    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <input
                        type="checkbox"
                        id="usarDireccionCliente"
                        checked={usarDireccionCliente}
                        onChange={(e) => {
                          setUsarDireccionCliente(e.target.checked)
                          if (e.target.checked && clienteSeleccionado) {
                            const direccion = clienteSeleccionado.direccionFiscal ||
                              clienteSeleccionado.direccion ||
                              clienteSeleccionado.direcciones?.[0]
                            if (direccion) {
                              setFormData(prev => ({
                                ...prev,
                                direccionTrabajo: {
                                  calle: direccion.calle || '',
                                  numero: direccion.numero || '',
                                  codigoPostal: direccion.codigoPostal || '',
                                  ciudad: direccion.ciudad || '',
                                  provincia: direccion.provincia || '',
                                  pais: direccion.pais || 'España',
                                }
                              }))
                            }
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor="usarDireccionCliente" className="cursor-pointer flex-1">
                        <span className="font-medium">Usar direccion del cliente</span>
                        {clienteSeleccionado.direccion?.calle && (
                          <p className="text-xs text-muted-foreground">
                            {clienteSeleccionado.direccion.calle}, {clienteSeleccionado.direccion.ciudad}
                          </p>
                        )}
                      </Label>
                    </div>
                  )}

                  {/* Buscador de direcciones con OpenStreetMap */}
                  <AddressAutocomplete
                    onAddressSelect={handleAddressSelect}
                    label="Buscar otra direccion"
                    placeholder="Escribe para buscar en OpenStreetMap..."
                    defaultValue=""
                  />

                  {/* Campos de direccion manual */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="calle">Calle</Label>
                      <Input
                        id="calle"
                        placeholder="Nombre de la calle"
                        value={formData.direccionTrabajo?.calle || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, calle: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero">Numero</Label>
                      <Input
                        id="numero"
                        placeholder="Numero"
                        value={formData.direccionTrabajo?.numero || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, numero: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codigoPostal">Codigo Postal</Label>
                      <Input
                        id="codigoPostal"
                        placeholder="CP"
                        value={formData.direccionTrabajo?.codigoPostal || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, codigoPostal: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        placeholder="Ciudad"
                        value={formData.direccionTrabajo?.ciudad || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, ciudad: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Provincia</Label>
                      <Input
                        id="provincia"
                        placeholder="Provincia"
                        value={formData.direccionTrabajo?.provincia || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          direccionTrabajo: { ...formData.direccionTrabajo, provincia: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  {/* Observaciones de ubicacion */}
                  <div className="space-y-2">
                    <Label htmlFor="observacionesDireccion">Observaciones de acceso</Label>
                    <Textarea
                      id="observacionesDireccion"
                      placeholder="Ej: Entrada por parking, preguntar por Jose..."
                      rows={2}
                      value={formData.direccionTrabajo?.observaciones || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        direccionTrabajo: { ...formData.direccionTrabajo, observaciones: e.target.value }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Resumen y botones */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Resumen */}
                <div className="flex flex-wrap items-center gap-2">
                  {formData.clienteId && (
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {clientes.find(c => c._id === formData.clienteId)?.nombre || 'Cliente'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    {TIPO_ICONS[formData.tipo]} {TIPOS_PARTE_TRABAJO.find(t => t.value === formData.tipo)?.label}
                  </Badge>
                  <Badge className={cn('gap-1', PRIORIDAD_COLORS[formData.prioridad])}>
                    {PRIORIDADES.find(p => p.value === formData.prioridad)?.label}
                  </Badge>
                  {personalAsignado.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {personalAsignado.length} persona(s)
                    </Badge>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button type="button" variant="outline" asChild className="flex-1 sm:flex-none">
                    <Link href="/partes-trabajo">Cancelar</Link>
                  </Button>
                  <Button type="submit" disabled={isSaving || !formData.clienteId} className="flex-1 sm:flex-none">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Crear Parte'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
