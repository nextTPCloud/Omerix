'use client'

import React, { useState, useEffect } from 'react'
import {
  IProyecto,
  CreateProyectoDTO,
  UpdateProyectoDTO,
  ESTADOS_PROYECTO,
  PRIORIDADES_PROYECTO,
  TIPOS_PROYECTO,
  TipoProyecto,
  EstadoProyecto,
  PrioridadProyecto,
  IHito,
  IParticipante,
  IDireccionProyecto,
} from '@/types/proyecto.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Save,
  FileText,
  Calendar,
  MapPin,
  Target,
  Users,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { proyectosService } from '@/services/proyectos.service'
import { clientesService } from '@/services/clientes.service'
import { agentesService } from '@/services/agentes-comerciales.service'
import { personalService } from '@/services/personal.service'
import { DateInput } from '@/components/ui/date-picker'
import { Cliente } from '@/types/cliente.types'
import { AgenteComercial } from '@/types/agente-comercial.types'
import { Personal } from '@/types/personal.types'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { FullCreateCliente, FullCreateAgenteComercial, FullCreatePersonal } from '@/components/full-create'

interface ProyectoFormProps {
  initialData?: IProyecto
  onSubmit: (data: CreateProyectoDTO | UpdateProyectoDTO) => Promise<void>
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function ProyectoForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode = 'create',
}: ProyectoFormProps) {
  const [activeTab, setActiveTab] = useState('datos')

  // Estado para clientes, agentes y personal disponibles
  const [clientesDisponibles, setClientesDisponibles] = useState<Cliente[]>([])
  const [agentesDisponibles, setAgentesDisponibles] = useState<AgenteComercial[]>([])
  const [personalDisponible, setPersonalDisponible] = useState<Personal[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingAgentes, setLoadingAgentes] = useState(false)
  const [loadingPersonal, setLoadingPersonal] = useState(false)

  // Modales QuickCreate
  const [showCreateCliente, setShowCreateCliente] = useState(false)
  const [showCreateAgente, setShowCreateAgente] = useState(false)
  const [showCreatePersonal, setShowCreatePersonal] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState<CreateProyectoDTO>({
    nombre: '',
    clienteId: '',
    tipo: TipoProyecto.CLIENTE,
    estado: EstadoProyecto.BORRADOR,
    prioridad: PrioridadProyecto.MEDIA,
    activo: true,
    hitos: [],
    participantes: [],
  })

  // Cargar clientes disponibles
  useEffect(() => {
    const loadClientes = async () => {
      try {
        setLoadingClientes(true)
        const response = await clientesService.getAll({ activo: true, limit: 1000 })
        if (response.success) {
          setClientesDisponibles(response.data || [])
        }
      } catch (error) {
        console.error('Error cargando clientes:', error)
      } finally {
        setLoadingClientes(false)
      }
    }
    loadClientes()
  }, [])

  // Cargar agentes comerciales disponibles
  useEffect(() => {
    const loadAgentes = async () => {
      try {
        setLoadingAgentes(true)
        const response = await agentesService.getAll({ activo: true, limit: 100 })
        if (response.success) {
          setAgentesDisponibles(response.data || [])
        }
      } catch (error) {
        console.error('Error cargando agentes comerciales:', error)
      } finally {
        setLoadingAgentes(false)
      }
    }
    loadAgentes()
  }, [])

  // Cargar personal disponible
  useEffect(() => {
    const loadPersonal = async () => {
      try {
        setLoadingPersonal(true)
        // Cargar sin filtro de activo para obtener todo el personal
        const response = await personalService.getAll({ limit: 1000 })
        console.log('📋 Respuesta personal:', response)
        if (response.success && response.data) {
          setPersonalDisponible(response.data)
          console.log('👥 Personal cargado:', response.data.length)
        }
      } catch (error) {
        console.error('Error cargando personal:', error)
      } finally {
        setLoadingPersonal(false)
      }
    }
    loadPersonal()
  }, [])

  // Cargar datos iniciales si existen
  useEffect(() => {
    if (initialData) {
      const clienteId = typeof initialData.clienteId === 'object'
        ? initialData.clienteId._id
        : initialData.clienteId

      const agenteComercialId = initialData.agenteComercialId
        ? typeof initialData.agenteComercialId === 'object'
          ? initialData.agenteComercialId._id
          : initialData.agenteComercialId
        : undefined

      setFormData({
        codigo: initialData.codigo,
        nombre: initialData.nombre,
        descripcion: initialData.descripcion,
        clienteId,
        agenteComercialId,
        tipo: initialData.tipo,
        estado: initialData.estado,
        prioridad: initialData.prioridad,
        fechaInicio: initialData.fechaInicio
          ? new Date(initialData.fechaInicio).toISOString().split('T')[0]
          : undefined,
        fechaFinPrevista: initialData.fechaFinPrevista
          ? new Date(initialData.fechaFinPrevista).toISOString().split('T')[0]
          : undefined,
        direccion: initialData.direccion,
        presupuestoEstimado: initialData.presupuestoEstimado,
        presupuestoAprobado: initialData.presupuestoAprobado,
        margenPrevisto: initialData.margenPrevisto,
        horasEstimadas: initialData.horasEstimadas,
        hitos: initialData.hitos || [],
        participantes: initialData.participantes || [],
        tags: initialData.tags,
        observaciones: initialData.observaciones,
        activo: initialData.activo,
      })
    }
  }, [initialData])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  // ============================================
  // GESTIÓN DE HITOS
  // ============================================

  const agregarHito = () => {
    const nuevoHito: Omit<IHito, '_id'> = {
      nombre: '',
      descripcion: '',
      fechaPrevista: new Date().toISOString().split('T')[0],
      completado: false,
      orden: formData.hitos?.length || 0,
    }
    setFormData((prev) => ({
      ...prev,
      hitos: [...(prev.hitos || []), nuevoHito],
    }))
  }

  const actualizarHito = (index: number, campo: keyof IHito, valor: any) => {
    setFormData((prev) => {
      const hitos = [...(prev.hitos || [])]
      hitos[index] = { ...hitos[index], [campo]: valor }
      return { ...prev, hitos }
    })
  }

  const eliminarHito = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      hitos: prev.hitos?.filter((_, i) => i !== index),
    }))
  }

  // ============================================
  // GESTIÓN DE PARTICIPANTES
  // ============================================

  const agregarParticipante = () => {
    const nuevoParticipante: Omit<IParticipante, '_id'> = {
      personalId: '',
      rol: '',
      horasAsignadas: 0,
      activo: true,
    }
    setFormData((prev) => ({
      ...prev,
      participantes: [...(prev.participantes || []), nuevoParticipante],
    }))
  }

  const actualizarParticipante = (index: number, campo: keyof IParticipante, valor: any) => {
    setFormData((prev) => {
      const participantes = [...(prev.participantes || [])]
      participantes[index] = { ...participantes[index], [campo]: valor }
      return { ...prev, participantes }
    })
  }

  const eliminarParticipante = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participantes: prev.participantes?.filter((_, i) => i !== index),
    }))
  }

  // ============================================
  // GESTIÓN DE DIRECCIÓN
  // ============================================

  const actualizarDireccion = (campo: keyof IDireccionProyecto, valor: any) => {
    setFormData((prev) => ({
      ...prev,
      direccion: {
        ...prev.direccion,
        [campo]: valor,
      } as IDireccionProyecto,
    }))
  }

  // Contadores para badges en tabs
  const numHitos = formData.hitos?.length || 0
  const numParticipantes = formData.participantes?.length || 0

  // Opciones para SearchableSelect
  const clientesOptions = React.useMemo(() => {
    return clientesDisponibles.map((cliente) => ({
      value: cliente._id,
      label: cliente.nombre,
      description: `${cliente.codigo} - ${cliente.nif}`,
    }))
  }, [clientesDisponibles])

  const agentesOptions = React.useMemo(() => {
    return agentesDisponibles.map((agente) => ({
      value: agente._id,
      label: `${agente.nombre} ${agente.apellidos || ''}`.trim(),
      description: agente.codigo,
    }))
  }, [agentesDisponibles])

  const personalOptions = React.useMemo(() => {
    return personalDisponible.map((persona) => ({
      value: persona._id,
      label: `${persona.nombre} ${persona.apellidos}`.trim(),
      description: `${persona.codigo} - ${persona.datosLaborales?.puesto || 'Sin puesto'}`,
    }))
  }, [personalDisponible])

  // Handlers para cuando se crea un nuevo elemento
  const handleClienteCreated = (newCliente: { _id: string; codigo: string; nombre: string; nif: string }) => {
    setClientesDisponibles(prev => [...prev, { ...newCliente, activo: true } as Cliente])
    setFormData(prev => ({ ...prev, clienteId: newCliente._id }))
  }

  const handleAgenteCreated = (newAgente: { _id: string; codigo: string; nombre: string; apellidos?: string }) => {
    setAgentesDisponibles(prev => [...prev, { ...newAgente, activo: true } as AgenteComercial])
    setFormData(prev => ({ ...prev, agenteComercialId: newAgente._id }))
  }

  const handlePersonalCreated = (newPersonal: { _id: string; codigo: string; nombre: string; apellidos: string }) => {
    setPersonalDisponible(prev => [...prev, { ...newPersonal, activo: true } as Personal])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="datos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Datos</span>
          </TabsTrigger>
          <TabsTrigger value="fechas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Fechas</span>
          </TabsTrigger>
          <TabsTrigger value="direccion" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Dirección</span>
          </TabsTrigger>
          <TabsTrigger value="hitos" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Hitos</span>
            {numHitos > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {numHitos}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="participantes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Participantes</span>
            {numParticipantes > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {numParticipantes}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB: DATOS BÁSICOS */}
        {/* ============================================ */}
        <TabsContent value="datos" className="space-y-6 mt-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código {mode === 'create' && '(opcional)'}</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  value={formData.codigo || ''}
                  onChange={handleChange}
                  onKeyDown={async (e) => {
                    if (e.key === 'ArrowDown' && mode === 'create') {
                      e.preventDefault()
                      try {
                        const response = await proyectosService.sugerirCodigo()
                        if (response.success && response.data) {
                          setFormData((prev) => ({ ...prev, codigo: response.data!.codigo }))
                        }
                      } catch (error) {
                        console.error('Error al sugerir código:', error)
                      }
                    }
                  }}
                  placeholder={mode === 'create' ? 'Ej: PRY-001 (vacío para autogenerar)' : 'Código del proyecto'}
                  disabled={mode === 'edit'}
                  className={mode === 'edit' ? 'bg-muted' : ''}
                />
                {mode === 'create' && (
                  <p className="text-xs text-muted-foreground">
                    Presiona flecha abajo para sugerir el siguiente código
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="activo" className="cursor-pointer">Proyecto Activo</Label>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Instalación sistema eléctrico edificio central"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descripción detallada del proyecto..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Cliente y Agente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente y Agente Comercial</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteId">Cliente *</Label>
                <SearchableSelect
                  options={clientesOptions}
                  value={formData.clienteId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clienteId: value }))}
                  placeholder="Buscar cliente..."
                  searchPlaceholder="Buscar por nombre, código o NIF..."
                  emptyMessage="No se encontraron clientes"
                  loading={loadingClientes}
                  onCreate={() => setShowCreateCliente(true)}
                  createLabel="Crear cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agenteComercialId">Agente Comercial</Label>
                <SearchableSelect
                  options={agentesOptions}
                  value={formData.agenteComercialId || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, agenteComercialId: value || undefined }))}
                  placeholder="Sin agente asignado"
                  searchPlaceholder="Buscar agente comercial..."
                  emptyMessage="No se encontraron agentes"
                  loading={loadingAgentes}
                  allowClear
                  onCreate={() => setShowCreateAgente(true)}
                  createLabel="Crear agente"
                />
              </div>
            </CardContent>
          </Card>

          {/* Clasificación */}
          <Card>
            <CardHeader>
              <CardTitle>Clasificación</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Proyecto</Label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {TIPOS_PROYECTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {ESTADOS_PROYECTO.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <select
                  id="prioridad"
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {PRIORIDADES_PROYECTO.map((prioridad) => (
                    <option key={prioridad.value} value={prioridad.value}>
                      {prioridad.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Etiquetas y Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    setFormData(prev => ({ ...prev, tags }))
                  }}
                  placeholder="Urgente, Alta prioridad, Crítico..."
                />
                <p className="text-xs text-muted-foreground">
                  Separar con comas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Observaciones adicionales sobre el proyecto..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: FECHAS Y PRESUPUESTO */}
        {/* ============================================ */}
        <TabsContent value="fechas" className="space-y-6 mt-6">
          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                <DateInput
                  value={formData.fechaInicio?.toString().split('T')[0] || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, fechaInicio: value || undefined }))}
                  placeholder="Seleccionar fecha de inicio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaFinPrevista">Fecha Fin Prevista</Label>
                <DateInput
                  value={formData.fechaFinPrevista?.toString().split('T')[0] || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, fechaFinPrevista: value || undefined }))}
                  placeholder="Seleccionar fecha fin prevista"
                />
              </div>
            </CardContent>
          </Card>

          {/* Presupuesto */}
          <Card>
            <CardHeader>
              <CardTitle>Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="presupuestoEstimado">Presupuesto Estimado (€)</Label>
                <Input
                  id="presupuestoEstimado"
                  name="presupuestoEstimado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.presupuestoEstimado || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presupuestoAprobado">Presupuesto Aprobado (€)</Label>
                <Input
                  id="presupuestoAprobado"
                  name="presupuestoAprobado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.presupuestoAprobado || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="margenPrevisto">Margen Previsto (%)</Label>
                <Input
                  id="margenPrevisto"
                  name="margenPrevisto"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.margenPrevisto || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horasEstimadas">Horas Estimadas</Label>
                <Input
                  id="horasEstimadas"
                  name="horasEstimadas"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.horasEstimadas || ''}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: DIRECCIÓN DEL PROYECTO */}
        {/* ============================================ */}
        <TabsContent value="direccion" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dirección del Proyecto</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ubicación donde se realizará el proyecto (instalación, obra, etc.)
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="direccion.nombre">Nombre de la Ubicación</Label>
                <Input
                  id="direccion.nombre"
                  value={formData.direccion?.nombre || ''}
                  onChange={(e) => actualizarDireccion('nombre', e.target.value)}
                  placeholder="Ej: Edificio Central, Almacén Norte..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.calle">Calle</Label>
                <Input
                  id="direccion.calle"
                  value={formData.direccion?.calle || ''}
                  onChange={(e) => actualizarDireccion('calle', e.target.value)}
                  placeholder="Nombre de la calle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.numero">Número</Label>
                <Input
                  id="direccion.numero"
                  value={formData.direccion?.numero || ''}
                  onChange={(e) => actualizarDireccion('numero', e.target.value)}
                  placeholder="Número"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.piso">Piso/Planta</Label>
                <Input
                  id="direccion.piso"
                  value={formData.direccion?.piso || ''}
                  onChange={(e) => actualizarDireccion('piso', e.target.value)}
                  placeholder="Piso, Planta..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.codigoPostal">Código Postal</Label>
                <Input
                  id="direccion.codigoPostal"
                  value={formData.direccion?.codigoPostal || ''}
                  onChange={(e) => actualizarDireccion('codigoPostal', e.target.value)}
                  placeholder="CP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.ciudad">Ciudad</Label>
                <Input
                  id="direccion.ciudad"
                  value={formData.direccion?.ciudad || ''}
                  onChange={(e) => actualizarDireccion('ciudad', e.target.value)}
                  placeholder="Ciudad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.provincia">Provincia</Label>
                <Input
                  id="direccion.provincia"
                  value={formData.direccion?.provincia || ''}
                  onChange={(e) => actualizarDireccion('provincia', e.target.value)}
                  placeholder="Provincia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.pais">País</Label>
                <Input
                  id="direccion.pais"
                  value={formData.direccion?.pais || ''}
                  onChange={(e) => actualizarDireccion('pais', e.target.value)}
                  placeholder="País"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.latitud">Latitud</Label>
                <Input
                  id="direccion.latitud"
                  type="number"
                  step="any"
                  value={formData.direccion?.latitud || ''}
                  onChange={(e) => actualizarDireccion('latitud', parseFloat(e.target.value))}
                  placeholder="Coordenada latitud"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion.longitud">Longitud</Label>
                <Input
                  id="direccion.longitud"
                  type="number"
                  step="any"
                  value={formData.direccion?.longitud || ''}
                  onChange={(e) => actualizarDireccion('longitud', parseFloat(e.target.value))}
                  placeholder="Coordenada longitud"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="direccion.notas">Notas de Ubicación</Label>
                <Textarea
                  id="direccion.notas"
                  value={formData.direccion?.notas || ''}
                  onChange={(e) => actualizarDireccion('notas', e.target.value)}
                  rows={3}
                  placeholder="Instrucciones de acceso, referencias, etc..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: HITOS */}
        {/* ============================================ */}
        <TabsContent value="hitos" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hitos del Proyecto</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define los hitos principales del proyecto
                  </p>
                </div>
                <Button type="button" onClick={agregarHito} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Hito
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.hitos && formData.hitos.length > 0 ? (
                <div className="space-y-4">
                  {formData.hitos.map((hito, index) => (
                    <Card key={index} className="border-2">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <Label>Nombre del Hito *</Label>
                              <Input
                                value={hito.nombre}
                                onChange={(e) => actualizarHito(index, 'nombre', e.target.value)}
                                placeholder="Ej: Aprobación del proyecto, Inicio de obras..."
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-8">
                              <Button
                                type="button"
                                variant={hito.completado ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => actualizarHito(index, 'completado', !hito.completado)}
                              >
                                {hito.completado ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => eliminarHito(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label>Descripción</Label>
                            <Textarea
                              value={hito.descripcion || ''}
                              onChange={(e) => actualizarHito(index, 'descripcion', e.target.value)}
                              rows={2}
                              placeholder="Descripción detallada del hito..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Fecha Prevista *</Label>
                            <DateInput
                              value={
                                typeof hito.fechaPrevista === 'string'
                                  ? hito.fechaPrevista.split('T')[0]
                                  : new Date(hito.fechaPrevista).toISOString().split('T')[0]
                              }
                              onChange={(value) => actualizarHito(index, 'fechaPrevista', value)}
                              placeholder="Seleccionar fecha"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Orden</Label>
                            <Input
                              type="number"
                              value={hito.orden}
                              onChange={(e) => actualizarHito(index, 'orden', parseInt(e.target.value))}
                              min="0"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay hitos definidos</p>
                  <p className="text-sm">Haz clic en "Añadir Hito" para crear uno</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: PARTICIPANTES */}
        {/* ============================================ */}
        <TabsContent value="participantes" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Participantes del Proyecto</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equipo asignado al proyecto
                  </p>
                </div>
                <Button type="button" onClick={agregarParticipante} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Participante
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.participantes && formData.participantes.length > 0 ? (
                <div className="space-y-4">
                  {formData.participantes.map((participante, index) => (
                    <Card key={index} className="border-2">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Personal *</Label>
                            <SearchableSelect
                              options={personalOptions}
                              value={typeof participante.personalId === 'object' ? participante.personalId?._id : (participante.personalId || '')}
                              onValueChange={(value) => actualizarParticipante(index, 'personalId', value)}
                              placeholder="Buscar personal..."
                              searchPlaceholder="Buscar por nombre o código..."
                              emptyMessage="No se encontró personal"
                              loading={loadingPersonal}
                              onCreate={() => setShowCreatePersonal(true)}
                              createLabel="Crear personal"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Rol *</Label>
                            <Input
                              value={participante.rol}
                              onChange={(e) => actualizarParticipante(index, 'rol', e.target.value)}
                              placeholder="Ej: Jefe de proyecto, Técnico, Coordinador..."
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Horas Asignadas</Label>
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              value={participante.horasAsignadas || ''}
                              onChange={(e) => actualizarParticipante(index, 'horasAsignadas', parseFloat(e.target.value))}
                              placeholder="0"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 p-3 border rounded-lg flex-1">
                              <Label className="cursor-pointer">Activo</Label>
                              <Switch
                                checked={participante.activo}
                                onCheckedChange={(checked) => actualizarParticipante(index, 'activo', checked)}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => eliminarParticipante(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay participantes asignados</p>
                  <p className="text-sm">Haz clic en "Añadir Participante" para asignar uno</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* BOTONES DE ACCIÓN */}
      {/* ============================================ */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear Proyecto'}
        </Button>
      </div>

      {/* ============================================ */}
      {/* MODALES CREAR (FORMULARIO COMPLETO) */}
      {/* ============================================ */}
      <FullCreateCliente
        open={showCreateCliente}
        onOpenChange={setShowCreateCliente}
        onCreated={handleClienteCreated}
      />

      <FullCreateAgenteComercial
        open={showCreateAgente}
        onOpenChange={setShowCreateAgente}
        onCreated={handleAgenteCreated}
      />

      <FullCreatePersonal
        open={showCreatePersonal}
        onOpenChange={setShowCreatePersonal}
        onCreated={handlePersonalCreated}
      />
    </form>
  )
}

// Exportar como default para compatibilidad
export default ProyectoForm
