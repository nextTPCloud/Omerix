'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { FullCreateModal } from '@/components/ui/full-create-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, FileText, Calendar, Users } from 'lucide-react'
import { proyectosService } from '@/services/proyectos.service'
import { clientesService } from '@/services/clientes.service'
import { agentesService } from '@/services/agentes-comerciales.service'
import { Cliente } from '@/types/cliente.types'
import { AgenteComercial } from '@/types/agente-comercial.types'
import {
  TIPOS_PROYECTO,
  ESTADOS_PROYECTO,
  PRIORIDADES_PROYECTO,
  TipoProyecto,
  EstadoProyecto,
  PrioridadProyecto,
} from '@/types/proyecto.types'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { DateInput } from '@/components/ui/date-picker'
import { FullCreateCliente } from './FullCreateCliente'
import { FullCreateAgenteComercial } from './FullCreateAgenteComercial'
import { toast } from 'sonner'

interface FullCreateProyectoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (proyecto: { _id: string; codigo: string; nombre: string }) => void
  clienteIdDefault?: string
}

export function FullCreateProyecto({ open, onOpenChange, onCreated, clienteIdDefault }: FullCreateProyectoProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('datos')

  // Datos para selects
  const [clientesDisponibles, setClientesDisponibles] = useState<Cliente[]>([])
  const [agentesDisponibles, setAgentesDisponibles] = useState<AgenteComercial[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingAgentes, setLoadingAgentes] = useState(false)

  // Modales anidados
  const [showCreateCliente, setShowCreateCliente] = useState(false)
  const [showCreateAgente, setShowCreateAgente] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    clienteId: clienteIdDefault || '',
    agenteComercialId: '',
    tipo: TipoProyecto.CLIENTE,
    estado: EstadoProyecto.BORRADOR,
    prioridad: PrioridadProyecto.MEDIA,
    fechaInicio: '',
    fechaFinPrevista: '',
    presupuestoEstimado: 0,
    horasEstimadas: 0,
    observaciones: '',
    activo: true,
  })

  // Cargar clientes
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
    if (open) loadClientes()
  }, [open])

  // Cargar agentes
  useEffect(() => {
    const loadAgentes = async () => {
      try {
        setLoadingAgentes(true)
        const response = await agentesService.getAll({ activo: true, limit: 100 })
        if (response.success) {
          setAgentesDisponibles(response.data || [])
        }
      } catch (error) {
        console.error('Error cargando agentes:', error)
      } finally {
        setLoadingAgentes(false)
      }
    }
    if (open) loadAgentes()
  }, [open])

  // Actualizar clienteId si viene por defecto
  useEffect(() => {
    if (clienteIdDefault) {
      setFormData(prev => ({ ...prev, clienteId: clienteIdDefault }))
    }
  }, [clienteIdDefault])

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

  const handleClienteCreated = (newCliente: { _id: string; codigo: string; nombre: string; nif: string }) => {
    setClientesDisponibles(prev => [...prev, { ...newCliente, activo: true } as Cliente])
    setFormData(prev => ({ ...prev, clienteId: newCliente._id }))
  }

  const handleAgenteCreated = (newAgente: { _id: string; codigo: string; nombre: string; apellidos?: string }) => {
    setAgentesDisponibles(prev => [...prev, { ...newAgente, activo: true } as AgenteComercial])
    setFormData(prev => ({ ...prev, agenteComercialId: newAgente._id }))
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre del proyecto es obligatorio')
      return
    }
    if (!formData.clienteId) {
      toast.error('Debe seleccionar un cliente')
      return
    }

    setLoading(true)
    try {
      const response = await proyectosService.create({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || undefined,
        clienteId: formData.clienteId,
        agenteComercialId: formData.agenteComercialId || undefined,
        tipo: formData.tipo,
        estado: formData.estado,
        prioridad: formData.prioridad,
        fechaInicio: formData.fechaInicio || undefined,
        fechaFinPrevista: formData.fechaFinPrevista || undefined,
        presupuestoEstimado: formData.presupuestoEstimado || undefined,
        horasEstimadas: formData.horasEstimadas || undefined,
        observaciones: formData.observaciones.trim() || undefined,
        activo: formData.activo,
      })

      if (response.success && response.data) {
        toast.success('Proyecto creado correctamente')
        onCreated({
          _id: response.data._id,
          codigo: response.data.codigo,
          nombre: response.data.nombre,
        })
        onOpenChange(false)
        resetForm()
      }
    } catch (error: any) {
      console.error('Error al crear proyecto:', error)
      toast.error(error.response?.data?.message || 'Error al crear proyecto')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      clienteId: clienteIdDefault || '',
      agenteComercialId: '',
      tipo: TipoProyecto.CLIENTE,
      estado: EstadoProyecto.BORRADOR,
      prioridad: PrioridadProyecto.MEDIA,
      fechaInicio: '',
      fechaFinPrevista: '',
      presupuestoEstimado: 0,
      horasEstimadas: 0,
      observaciones: '',
      activo: true,
    })
    setActiveTab('datos')
  }

  return (
    <>
      <FullCreateModal
        open={open}
        onOpenChange={onOpenChange}
        title="Crear Nuevo Proyecto"
        description="Complete los datos del proyecto"
        onSubmit={handleSubmit}
        loading={loading}
        size="xl"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="datos" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Datos
            </TabsTrigger>
            <TabsTrigger value="cliente" className="gap-2">
              <Users className="h-4 w-4" />
              Cliente
            </TabsTrigger>
            <TabsTrigger value="planificacion" className="gap-2">
              <Calendar className="h-4 w-4" />
              Planificación
            </TabsTrigger>
            <TabsTrigger value="otros" className="gap-2">
              <FileText className="h-4 w-4" />
              Otros
            </TabsTrigger>
          </TabsList>

          {/* Tab Datos */}
          <TabsContent value="datos" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nombre del Proyecto *</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Instalación sistema de climatización"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada del proyecto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Proyecto</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoProyecto })}
                >
                  {TIPOS_PROYECTO.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoProyecto })}
                >
                  {ESTADOS_PROYECTO.map(estado => (
                    <option key={estado.value} value={estado.value}>{estado.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as PrioridadProyecto })}
                >
                  {PRIORIDADES_PROYECTO.map(prioridad => (
                    <option key={prioridad.value} value={prioridad.value}>{prioridad.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </TabsContent>

          {/* Tab Cliente */}
          <TabsContent value="cliente" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cliente y Agente Comercial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <SearchableSelect
                    options={clientesOptions}
                    value={formData.clienteId}
                    onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                    placeholder="Buscar cliente..."
                    searchPlaceholder="Buscar por nombre, código o NIF..."
                    emptyMessage="No se encontraron clientes"
                    loading={loadingClientes}
                    onCreate={() => setShowCreateCliente(true)}
                    createLabel="Crear cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Agente Comercial</Label>
                  <SearchableSelect
                    options={agentesOptions}
                    value={formData.agenteComercialId}
                    onValueChange={(value) => setFormData({ ...formData, agenteComercialId: value })}
                    placeholder="Buscar agente..."
                    searchPlaceholder="Buscar por nombre o código..."
                    emptyMessage="No se encontraron agentes"
                    loading={loadingAgentes}
                    onCreate={() => setShowCreateAgente(true)}
                    createLabel="Crear agente"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Planificación */}
          <TabsContent value="planificacion" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fechas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Inicio</Label>
                    <DateInput
                      value={formData.fechaInicio}
                      onChange={(value) => setFormData({ ...formData, fechaInicio: value })}
                      placeholder="Seleccionar fecha de inicio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin Prevista</Label>
                    <DateInput
                      value={formData.fechaFinPrevista}
                      onChange={(value) => setFormData({ ...formData, fechaFinPrevista: value })}
                      placeholder="Seleccionar fecha fin"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estimaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Presupuesto Estimado (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.presupuestoEstimado || ''}
                      onChange={(e) => setFormData({ ...formData, presupuestoEstimado: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horas Estimadas</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.horasEstimadas || ''}
                      onChange={(e) => setFormData({ ...formData, horasEstimadas: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Otros */}
          <TabsContent value="otros" className="space-y-4 mt-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <div>
                <Label>Proyecto Activo</Label>
                <p className="text-xs text-muted-foreground">Los proyectos inactivos no aparecerán en las búsquedas</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales sobre el proyecto..."
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>
      </FullCreateModal>

      {/* Modales anidados */}
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
    </>
  )
}
